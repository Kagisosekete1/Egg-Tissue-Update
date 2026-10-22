begin;

-- The old profiles table predates the native game's 24-character username
-- input. Keep its named check aligned with the username accepted by settings.
do $$
begin
  if to_regclass('public.profiles') is not null
    and exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='profiles' and column_name='username'
    ) then
    execute $sql$
      update public.profiles
      set username = left(coalesce(nullif(btrim(username), ''), 'Player'), 24)
      where username is null or btrim(username) = '' or char_length(btrim(username)) > 24
    $sql$;
    execute 'alter table public.profiles drop constraint if exists profiles_username_check';
    execute $sql$
      alter table public.profiles
      add constraint profiles_username_check
      check (username is null or char_length(btrim(username)) between 1 and 24)
    $sql$;
  end if;
end;
$$;

-- Each row is one purchased shield. Purchases and point deductions run inside
-- SECURITY DEFINER RPCs so clients cannot grant themselves inventory.
create table if not exists public.game_shields (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.game_profiles(id) on delete cascade,
  shield_type text not null check (shield_type in ('basic','golden','super')),
  max_hits integer not null check (max_hits in (1,2,3)),
  remaining_hits integer not null check (remaining_hits between 0 and max_hits),
  equipped boolean not null default false,
  request_id uuid not null,
  created_at timestamptz not null default now(),
  constraint game_shields_type_strength check (
    (shield_type='basic' and max_hits=1) or
    (shield_type='golden' and max_hits=2) or
    (shield_type='super' and max_hits=3)
  ),
  constraint game_shields_user_request_unique unique (user_id, request_id)
);

create unique index if not exists game_shields_one_equipped_per_user
  on public.game_shields(user_id) where equipped;
create index if not exists game_shields_user_created
  on public.game_shields(user_id, created_at desc);

alter table public.game_shields enable row level security;
revoke all on public.game_shields from anon, authenticated;
grant select on public.game_shields to authenticated;
drop policy if exists "Players read their shield inventory" on public.game_shields;
create policy "Players read their shield inventory"
  on public.game_shields for select to authenticated using (user_id=auth.uid());

-- Idempotency ledger: a retried damage event cannot spend two shield hits.
create table if not exists public.game_shield_blocks (
  user_id uuid not null references public.game_profiles(id) on delete cascade,
  event_id uuid not null,
  shield_id uuid not null references public.game_shields(id) on delete cascade,
  remaining_hits integer not null check (remaining_hits >= 0),
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);
alter table public.game_shield_blocks enable row level security;
revoke all on public.game_shield_blocks from anon, authenticated;

create or replace function public.purchase_game_shield(p_shield_type text, p_request_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  price integer;
  hits integer;
  balance integer;
  shield public.game_shields;
begin
  if auth.uid() is null then raise exception 'Please sign in to buy a shield'; end if;
  if p_request_id is null then raise exception 'Purchase request is missing'; end if;
  case p_shield_type
    when 'basic' then price:=5000; hits:=1;
    when 'golden' then price:=10000; hits:=2;
    when 'super' then price:=20000; hits:=3;
    else raise exception 'Unknown shield type';
  end case;

  insert into public.game_profiles(id,username,country_code)
    select u.id,left(coalesce(nullif(btrim(u.raw_user_meta_data->>'username'),''),'Player'),24),'ZA'
    from auth.users u where u.id=auth.uid()
    on conflict(id) do nothing;
  select p.points into balance from public.game_profiles p where p.id=auth.uid() for update;
  if not found then raise exception 'Player profile is unavailable'; end if;

  select * into shield from public.game_shields
    where user_id=auth.uid() and request_id=p_request_id;
  if found then
    return jsonb_build_object('shield_id',shield.id,'shield_type',shield.shield_type,
      'remaining_hits',shield.remaining_hits,'points_balance',balance,'duplicate',true);
  end if;
  if balance < price then raise exception 'Not enough points'; end if;

  update public.game_profiles set points=points-price,updated_at=now()
    where id=auth.uid() returning points into balance;
  insert into public.game_shields(user_id,shield_type,max_hits,remaining_hits,request_id)
    values(auth.uid(),p_shield_type,hits,hits,p_request_id) returning * into shield;
  return jsonb_build_object('shield_id',shield.id,'shield_type',shield.shield_type,
    'remaining_hits',shield.remaining_hits,'points_balance',balance,'duplicate',false);
end;
$$;
revoke all on function public.purchase_game_shield(text,uuid) from public,anon;
grant execute on function public.purchase_game_shield(text,uuid) to authenticated;

create or replace function public.equip_game_shield(p_shield_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare shield public.game_shields;
begin
  if auth.uid() is null then raise exception 'Please sign in to equip a shield'; end if;
  if p_shield_id is null then
    update public.game_shields set equipped=false where user_id=auth.uid() and equipped;
    return jsonb_build_object('equipped',false);
  end if;
  perform 1 from public.game_shields
    where id=p_shield_id and user_id=auth.uid() and remaining_hits>0 for update;
  if not found then raise exception 'That shield is unavailable or broken'; end if;
  update public.game_shields set equipped=false where user_id=auth.uid() and equipped;
  update public.game_shields set equipped=true
    where id=p_shield_id and user_id=auth.uid() returning * into shield;
  return jsonb_build_object('equipped',true,'shield_id',shield.id,
    'shield_type',shield.shield_type,'remaining_hits',shield.remaining_hits,'max_hits',shield.max_hits);
end;
$$;
revoke all on function public.equip_game_shield(uuid) from public,anon;
grant execute on function public.equip_game_shield(uuid) to authenticated;

create or replace function public.consume_game_shield_hit(p_shield_id uuid, p_event_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  prior public.game_shield_blocks;
  shield public.game_shields;
begin
  if auth.uid() is null then raise exception 'Please sign in'; end if;
  if p_event_id is null then raise exception 'Damage event is missing'; end if;
  select * into prior from public.game_shield_blocks
    where user_id=auth.uid() and event_id=p_event_id;
  if found then
    return jsonb_build_object('blocked',true,'shield_id',prior.shield_id,
      'remaining_hits',prior.remaining_hits,'duplicate',true);
  end if;

  select * into shield from public.game_shields
    where id=p_shield_id and user_id=auth.uid() for update;
  if not found then return jsonb_build_object('blocked',false,'remaining_hits',0); end if;
  -- Recheck while holding the shield-row lock so concurrent retries of this
  -- same event cannot decrement durability twice, including the final hit.
  select * into prior from public.game_shield_blocks
    where user_id=auth.uid() and event_id=p_event_id;
  if found then
    return jsonb_build_object('blocked',true,'shield_id',prior.shield_id,
      'remaining_hits',prior.remaining_hits,'duplicate',true);
  end if;
  if not shield.equipped or shield.remaining_hits<=0 then
    return jsonb_build_object('blocked',false,'remaining_hits',0);
  end if;

  update public.game_shields set remaining_hits=remaining_hits-1,
    equipped=(remaining_hits-1)>0
    where id=shield.id returning * into shield;
  insert into public.game_shield_blocks(user_id,event_id,shield_id,remaining_hits)
    values(auth.uid(),p_event_id,shield.id,shield.remaining_hits)
    on conflict(user_id,event_id) do nothing;
  return jsonb_build_object('blocked',true,'shield_id',shield.id,
    'shield_type',shield.shield_type,'remaining_hits',shield.remaining_hits,
    'max_hits',shield.max_hits,'equipped',shield.equipped,'duplicate',false);
end;
$$;
revoke all on function public.consume_game_shield_hit(uuid,uuid) from public,anon;
grant execute on function public.consume_game_shield_hit(uuid,uuid) to authenticated;

notify pgrst,'reload schema';
commit;
