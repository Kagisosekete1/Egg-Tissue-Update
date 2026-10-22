-- Point-staked online battles. Point changes and battle actions are server-side
-- transactions; the app never submits a balance or winner as authoritative data.
begin;
alter table public.game_challenges
  add column if not exists stake_points integer not null default 0,
  add column if not exists challenger_stake_reserved boolean not null default false,
  add column if not exists challenged_stake_reserved boolean not null default false,
  add column if not exists battle_id uuid,
  add column if not exists request_id uuid,
  add column if not exists expires_at timestamptz not null default (now() + interval '24 hours');
alter table public.game_profiles
  add column if not exists online_wins integer not null default 0;

alter table public.game_challenges drop constraint if exists game_challenges_status_check;
alter table public.game_challenges add constraint game_challenges_status_check
  check (status in ('pending','accepted','declined','completed'));
revoke insert, update on public.game_challenges from anon, authenticated;
drop policy if exists "Players send challenges as themselves" on public.game_challenges;
drop policy if exists "Invited players respond to challenges" on public.game_challenges;

alter table public.game_challenges drop constraint if exists game_challenges_stake_points_check;
alter table public.game_challenges add constraint game_challenges_stake_points_check
  check (stake_points = 0 or (stake_points between 50 and 5000 and stake_points % 50 = 0));
create unique index if not exists game_challenges_request_id_unique
  on public.game_challenges(challenger_id, request_id) where request_id is not null;

create table if not exists public.game_battles (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null unique references public.game_challenges(id) on delete cascade,
  player_one uuid not null references public.game_profiles(id) on delete cascade,
  player_two uuid not null references public.game_profiles(id) on delete cascade,
  stake_points integer not null check (stake_points = 0 or (stake_points between 50 and 5000 and stake_points % 50 = 0)),
  current_player uuid not null references public.game_profiles(id),
  phase text not null default 'ready' check (phase in ('ready','spraying','over')),
  round integer not null default 1 check (round > 0),
  roll integer not null default 0 check (roll between 0 and 6),
  last_roll integer not null default 0 check (last_roll between 0 and 6),
  sprayed integer not null default 0 check (sprayed >= 0),
  damage numeric not null default 0 check (damage >= 0),
  threshold numeric not null check (threshold > 0),
  winner_id uuid references public.game_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_battles_distinct_players check (player_one <> player_two),
  constraint game_battles_current_player_check check (current_player in (player_one,player_two)),
  constraint game_battles_winner_check check (winner_id is null or winner_id in (player_one,player_two))
);
create index if not exists game_battles_players_updated on public.game_battles(player_one, player_two, updated_at desc);
alter table public.game_battles enable row level security;
grant select on public.game_battles to authenticated;
drop policy if exists "Battle players can view their matches" on public.game_battles;
create policy "Battle players can view their matches" on public.game_battles
  for select to authenticated using (auth.uid() in (player_one,player_two));
revoke insert, update, delete on public.game_battles from anon, authenticated;

-- New invitations can only be created through this function. This reserves the
-- challenger's stake atomically and is idempotent for a retried client request.
create or replace function public.create_staked_battle_invite(p_opponent_id uuid, p_stake_points integer, p_request_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid := auth.uid(); v_balance integer; v_row public.game_challenges%rowtype;
begin
  if v_user is null then raise exception 'Sign in to start a battle'; end if;
  if p_opponent_id is null or p_opponent_id = v_user then raise exception 'Choose another player'; end if;
  if p_stake_points is null or p_stake_points < 50 or p_stake_points > 5000 or p_stake_points % 50 <> 0 then raise exception 'Choose a stake from 50 to 5,000 points in steps of 50'; end if;
  if p_request_id is null then raise exception 'A request id is required'; end if;
  perform pg_advisory_xact_lock(hashtext(least(v_user::text,p_opponent_id::text)),hashtext(greatest(v_user::text,p_opponent_id::text)));
  select * into v_row from public.game_challenges where challenger_id=v_user and request_id=p_request_id;
  if found then return jsonb_build_object('challenge_id',v_row.id,'stake_points',v_row.stake_points,'duplicate',true); end if;
  perform 1 from public.game_profiles where id=p_opponent_id;
  if not found then raise exception 'Player not found'; end if;
  select points into v_balance from public.game_profiles where id=v_user for update;
  if not found then raise exception 'Your player profile is not ready'; end if;
  if v_balance < p_stake_points then raise exception 'Not enough points for this battle stake'; end if;
  if exists(select 1 from public.game_challenges where status='pending' and expires_at>now() and
    ((challenger_id=v_user and challenged_id=p_opponent_id) or (challenger_id=p_opponent_id and challenged_id=v_user))) then
    raise exception 'There is already a pending invitation between these players';
  end if;
  update public.game_profiles set points=points-p_stake_points,updated_at=now() where id=v_user returning points into v_balance;
  insert into public.game_challenges(challenger_id,challenged_id,status,stake_points,challenger_stake_reserved,request_id,expires_at)
    values(v_user,p_opponent_id,'pending',p_stake_points,true,p_request_id,now()+interval '24 hours') returning * into v_row;
  return jsonb_build_object('challenge_id',v_row.id,'stake_points',p_stake_points,'points_balance',v_balance,'duplicate',false);
end; $$;

create or replace function public.accept_staked_battle_invite(p_challenge_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid := auth.uid(); v_c public.game_challenges%rowtype; v_balance integer; v_battle public.game_battles%rowtype;
begin
  if v_user is null then raise exception 'Sign in to accept a battle'; end if;
  select * into v_c from public.game_challenges where id=p_challenge_id for update;
  if not found or v_c.challenged_id<>v_user then raise exception 'Battle invitation not found'; end if;
  if v_c.status='accepted' and v_c.battle_id is not null then
    select * into v_battle from public.game_battles where id=v_c.battle_id;
    return jsonb_build_object('battle_id',v_battle.id,'duplicate',true);
  end if;
  if v_c.status<>'pending' then raise exception 'This battle invitation is no longer pending'; end if;
  if v_c.expires_at<=now() then
    if v_c.challenger_stake_reserved then
      update public.game_profiles set points=points+v_c.stake_points,updated_at=now() where id=v_c.challenger_id;
    end if;
    update public.game_challenges set status='declined',challenger_stake_reserved=false,updated_at=now() where id=v_c.id;
    return jsonb_build_object('expired',true);
  end if;
  select points into v_balance from public.game_profiles where id=v_user for update;
  if not found or v_balance<v_c.stake_points then raise exception 'You need % points to accept this battle',v_c.stake_points; end if;
  update public.game_profiles set points=points-v_c.stake_points,updated_at=now() where id=v_user;
  insert into public.game_battles(challenge_id,player_one,player_two,stake_points,current_player,threshold)
    values(v_c.id,v_c.challenger_id,v_c.challenged_id,v_c.stake_points,v_c.challenger_id,17+random()*6) returning * into v_battle;
  update public.game_challenges set status='accepted',challenged_stake_reserved=true,battle_id=v_battle.id,updated_at=now() where id=v_c.id;
  return jsonb_build_object('battle_id',v_battle.id,'duplicate',false);
end; $$;

create or replace function public.respond_staked_battle_invite(p_challenge_id uuid, p_accept boolean)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid := auth.uid(); v_c public.game_challenges%rowtype; v_balance integer;
begin
  if v_user is null then raise exception 'Sign in to respond to a battle'; end if;
  select * into v_c from public.game_challenges where id=p_challenge_id for update;
  if not found then raise exception 'Battle invitation not found'; end if;
  if p_accept then return public.accept_staked_battle_invite(p_challenge_id); end if;
  if v_c.challenger_id<>v_user and v_c.challenged_id<>v_user then raise exception 'You are not part of this invitation'; end if;
  if v_c.status<>'pending' then return jsonb_build_object('status',v_c.status,'duplicate',true); end if;
  if v_c.challenger_stake_reserved then
    update public.game_profiles set points=points+v_c.stake_points,updated_at=now() where id=v_c.challenger_id returning points into v_balance;
  end if;
  update public.game_challenges set status='declined',challenger_stake_reserved=false,updated_at=now() where id=v_c.id;
  return jsonb_build_object('status','declined','refunded',v_c.challenger_stake_reserved);
end; $$;

create or replace function public.expire_staked_battle_invites()
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare v_c public.game_challenges%rowtype; v_count integer:=0;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  for v_c in select * from public.game_challenges where status='pending' and expires_at<=now() and challenger_stake_reserved for update skip locked loop
    update public.game_profiles set points=points+v_c.stake_points,updated_at=now() where id=v_c.challenger_id;
    update public.game_challenges set status='declined',challenger_stake_reserved=false,updated_at=now() where id=v_c.id;
    v_count:=v_count+1;
  end loop;
  return v_count;
end; $$;

create or replace function public.battle_roll(p_battle_id uuid)
returns public.game_battles language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid:=auth.uid(); v_b public.game_battles%rowtype; v_roll integer;
begin
  if v_user is null then raise exception 'Sign in to play'; end if;
  select * into v_b from public.game_battles where id=p_battle_id for update;
  if not found or v_user not in(v_b.player_one,v_b.player_two) then raise exception 'Battle not found'; end if;
  if v_b.phase<>'ready' or v_b.current_player<>v_user then raise exception 'It is not your turn to roll'; end if;
  v_roll:=1+floor(random()*6)::integer;
  if v_roll=v_b.last_roll then v_roll:=case when v_roll=6 then 1 else v_roll+1 end; end if;
  update public.game_battles set phase='spraying',roll=v_roll,last_roll=v_roll,sprayed=0,updated_at=now() where id=v_b.id returning * into v_b;
  return v_b;
end; $$;

create or replace function public.battle_spray(p_battle_id uuid)
returns public.game_battles language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid:=auth.uid(); v_b public.game_battles%rowtype; v_hit numeric; v_new_damage numeric; v_new_sprayed integer; v_winner uuid;
begin
  if v_user is null then raise exception 'Sign in to play'; end if;
  select * into v_b from public.game_battles where id=p_battle_id for update;
  if not found or v_user not in(v_b.player_one,v_b.player_two) then raise exception 'Battle not found'; end if;
  if v_b.phase<>'spraying' or v_b.current_player<>v_user then raise exception 'It is not your turn to spray'; end if;
  v_hit:=case when v_b.roll<=2 then 0.7 when v_b.roll<=4 then 1.0 else 1.3 end;
  v_new_damage:=v_b.damage+v_hit; v_new_sprayed:=v_b.sprayed+1;
  if v_new_damage>=v_b.threshold then
    v_winner:=case when v_user=v_b.player_one then v_b.player_two else v_b.player_one end;
    update public.game_profiles set points=points+(v_b.stake_points*2),wins=coalesce(wins,0)+1,online_wins=online_wins+1,updated_at=now() where id=v_winner;
    update public.game_battles set phase='over',damage=v_new_damage,sprayed=v_new_sprayed,winner_id=v_winner,updated_at=now() where id=v_b.id returning * into v_b;
    update public.game_challenges set status='completed',updated_at=now() where id=v_b.challenge_id;
    return v_b;
  end if;
  if v_new_sprayed>=v_b.roll then
    update public.game_battles set phase='ready',current_player=case when v_user=v_b.player_one then v_b.player_two else v_b.player_one end,
      round=round+case when v_user=v_b.player_two then 1 else 0 end,roll=0,sprayed=0,damage=v_new_damage,updated_at=now()
      where id=v_b.id returning * into v_b;
  else
    update public.game_battles set sprayed=v_new_sprayed,damage=v_new_damage,updated_at=now() where id=v_b.id returning * into v_b;
  end if;
  return v_b;
end; $$;

create or replace function public.battle_forfeit(p_battle_id uuid)
returns public.game_battles language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid:=auth.uid(); v_b public.game_battles%rowtype; v_winner uuid;
begin
  if v_user is null then raise exception 'Sign in to play'; end if;
  select * into v_b from public.game_battles where id=p_battle_id for update;
  if not found or v_user not in(v_b.player_one,v_b.player_two) then raise exception 'Battle not found'; end if;
  if v_b.phase='over' then return v_b; end if;
  v_winner:=case when v_user=v_b.player_one then v_b.player_two else v_b.player_one end;
  update public.game_profiles set points=points+(v_b.stake_points*2),wins=coalesce(wins,0)+1,online_wins=online_wins+1,updated_at=now() where id=v_winner;
  update public.game_battles set phase='over',winner_id=v_winner,updated_at=now() where id=v_b.id returning * into v_b;
  update public.game_challenges set status='completed',updated_at=now() where id=v_b.challenge_id;
  return v_b;
end; $$;

revoke all on function public.create_staked_battle_invite(uuid,integer,uuid) from public, anon;
revoke all on function public.accept_staked_battle_invite(uuid) from public, anon;
revoke all on function public.respond_staked_battle_invite(uuid,boolean) from public, anon;
revoke all on function public.expire_staked_battle_invites() from public, anon;
revoke all on function public.battle_roll(uuid) from public, anon;
revoke all on function public.battle_spray(uuid) from public, anon;
revoke all on function public.battle_forfeit(uuid) from public, anon;
grant execute on function public.create_staked_battle_invite(uuid,integer,uuid) to authenticated;
grant execute on function public.accept_staked_battle_invite(uuid) to authenticated;
grant execute on function public.respond_staked_battle_invite(uuid,boolean) to authenticated;
grant execute on function public.expire_staked_battle_invites() to authenticated;
grant execute on function public.battle_roll(uuid) to authenticated;
grant execute on function public.battle_spray(uuid) to authenticated;
grant execute on function public.battle_forfeit(uuid) to authenticated;

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='game_battles') then
    alter publication supabase_realtime add table public.game_battles;
  end if;
exception when undefined_object then null; end $$;

notify pgrst,'reload schema';
commit;
