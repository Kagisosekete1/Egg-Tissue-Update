begin;

-- Point purchases and use of boosts are persisted with server-side costs and
-- idempotency keys. Real-money products and billing are intentionally absent.
create table if not exists public.game_powerup_inventory (
  user_id uuid not null references public.game_profiles(id) on delete cascade,
  powerup_type text not null check (powerup_type in (
    'tension_boost','pressure_blast','emergency_stabilizer',
    'quick_escape','counter_attack','lucky_roll'
  )),
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id,powerup_type)
);
alter table public.game_powerup_inventory enable row level security;
revoke all on public.game_powerup_inventory from anon,authenticated;
grant select on public.game_powerup_inventory to authenticated;
drop policy if exists "Players read their power-up inventory" on public.game_powerup_inventory;
create policy "Players read their power-up inventory"
  on public.game_powerup_inventory for select to authenticated using (user_id=auth.uid());

create table if not exists public.game_powerup_purchases (
  user_id uuid not null references public.game_profiles(id) on delete cascade,
  request_id uuid not null,
  powerup_type text not null check (powerup_type in (
    'tension_boost','pressure_blast','emergency_stabilizer',
    'quick_escape','counter_attack','lucky_roll'
  )),
  points_paid integer not null check (points_paid > 0),
  created_at timestamptz not null default now(),
  primary key (user_id,request_id)
);
alter table public.game_powerup_purchases enable row level security;
revoke all on public.game_powerup_purchases from anon,authenticated;

create table if not exists public.game_powerup_uses (
  user_id uuid not null references public.game_profiles(id) on delete cascade,
  game_id uuid not null,
  action_id uuid not null,
  powerup_type text not null check (powerup_type in (
    'tension_boost','pressure_blast','emergency_stabilizer',
    'quick_escape','counter_attack','lucky_roll'
  )),
  created_at timestamptz not null default now(),
  primary key (user_id,game_id,action_id)
);
alter table public.game_powerup_uses enable row level security;
revoke all on public.game_powerup_uses from anon,authenticated;

create or replace function public.purchase_game_powerup(p_powerup_type text,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare price integer; balance integer; owned integer; prior public.game_powerup_purchases;
begin
  if auth.uid() is null then raise exception 'Please sign in to buy a power-up'; end if;
  if p_request_id is null then raise exception 'Purchase request is missing'; end if;
  case p_powerup_type
    when 'tension_boost' then price:=500;
    when 'pressure_blast' then price:=1000;
    when 'emergency_stabilizer' then price:=750;
    when 'quick_escape' then price:=1500;
    when 'counter_attack' then price:=1000;
    when 'lucky_roll' then price:=750;
    else raise exception 'Unknown power-up';
  end case;

  insert into public.game_profiles(id,username,country_code)
    select u.id,left(coalesce(nullif(btrim(u.raw_user_meta_data->>'username'),''),'Player'),24),'ZA'
      from auth.users u where u.id=auth.uid() on conflict(id) do nothing;
  select p.points into balance from public.game_profiles p where p.id=auth.uid() for update;
  if not found then raise exception 'Player profile is unavailable'; end if;

  select * into prior from public.game_powerup_purchases
    where user_id=auth.uid() and request_id=p_request_id;
  if found then
    select quantity into owned from public.game_powerup_inventory
      where user_id=auth.uid() and powerup_type=prior.powerup_type;
    return jsonb_build_object('powerup_type',prior.powerup_type,'quantity',coalesce(owned,0),
      'points_balance',balance,'duplicate',true);
  end if;
  if balance < price then raise exception 'Not enough points'; end if;

  update public.game_profiles set points=points-price,updated_at=now()
    where id=auth.uid() returning points into balance;
  insert into public.game_powerup_inventory(user_id,powerup_type,quantity)
    values(auth.uid(),p_powerup_type,1)
    on conflict(user_id,powerup_type) do update
      set quantity=game_powerup_inventory.quantity+1,updated_at=now()
    returning quantity into owned;
  insert into public.game_powerup_purchases(user_id,request_id,powerup_type,points_paid)
    values(auth.uid(),p_request_id,p_powerup_type,price);
  return jsonb_build_object('powerup_type',p_powerup_type,'quantity',owned,
    'points_balance',balance,'duplicate',false);
end;
$$;
revoke all on function public.purchase_game_powerup(text,uuid) from public,anon;
grant execute on function public.purchase_game_powerup(text,uuid) to authenticated;

create or replace function public.consume_game_powerup(p_powerup_type text,p_game_id uuid,p_action_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare prior public.game_powerup_uses; owned integer;
begin
  if auth.uid() is null then raise exception 'Please sign in to use a power-up'; end if;
  if p_game_id is null or p_action_id is null then raise exception 'Power-up action is missing'; end if;
  if p_powerup_type not in ('tension_boost','pressure_blast','emergency_stabilizer',
      'quick_escape','counter_attack','lucky_roll') then raise exception 'Unknown power-up'; end if;
  perform 1 from public.game_profiles where id=auth.uid() for update;
  if not found then raise exception 'Player profile is unavailable'; end if;
  select * into prior from public.game_powerup_uses
    where user_id=auth.uid() and game_id=p_game_id and action_id=p_action_id;
  if found then
    select quantity into owned from public.game_powerup_inventory
      where user_id=auth.uid() and powerup_type=prior.powerup_type;
    return jsonb_build_object('powerup_type',prior.powerup_type,'quantity',coalesce(owned,0),'duplicate',true);
  end if;
  update public.game_powerup_inventory set quantity=quantity-1,updated_at=now()
    where user_id=auth.uid() and powerup_type=p_powerup_type and quantity>0
    returning quantity into owned;
  if not found then raise exception 'You do not own this power-up'; end if;
  insert into public.game_powerup_uses(user_id,game_id,action_id,powerup_type)
    values(auth.uid(),p_game_id,p_action_id,p_powerup_type);
  return jsonb_build_object('powerup_type',p_powerup_type,'quantity',owned,'duplicate',false);
end;
$$;
revoke all on function public.consume_game_powerup(text,uuid,uuid) from public,anon;
grant execute on function public.consume_game_powerup(text,uuid,uuid) to authenticated;

notify pgrst,'reload schema';
commit;
