-- Egg & Wet Tissue app schema. Apply migrations in numbered order.
-- Internal source artifact: this SQL is not displayed inside the app.

-- 001_game_profiles.sql

create table if not exists public.game_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null default 'Player',
  country_code text not null default 'ZA',
  points integer not null default 0 check (points >= 0),
  wins integer not null default 0 check (wins >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_profiles_country_code_format check (country_code ~ '^[A-Z]{2}$')
);

alter table public.game_profiles enable row level security;
grant select on public.game_profiles to anon, authenticated;
grant insert (id, username, country_code) on public.game_profiles to authenticated;
grant update (username, country_code, updated_at) on public.game_profiles to authenticated;

drop policy if exists "Game profiles are public" on public.game_profiles;
create policy "Game profiles are public"
  on public.game_profiles for select to anon, authenticated using (true);
drop policy if exists "Users create their own game profile" on public.game_profiles;
create policy "Users create their own game profile"
  on public.game_profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "Users update their own game profile" on public.game_profiles;
create policy "Users update their own game profile"
  on public.game_profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.record_game_win()
returns public.game_profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result public.game_profiles;
begin
  if auth.uid() is null then
    raise exception 'You must sign in to record a win';
  end if;

  insert into public.game_profiles (id, username, country_code, points, wins)
  values (auth.uid(), 'Player', 'ZA', 10, 1)
  on conflict (id) do update
    set points = public.game_profiles.points + 10,
        wins = public.game_profiles.wins + 1,
        updated_at = now()
  returning * into result;
  return result;
end;
$$;

revoke all on function public.record_game_win() from public, anon;
grant execute on function public.record_game_win() to authenticated;

create or replace function public.get_my_game_rank()
returns bigint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select ranked.rank
  from (
    select id, row_number() over (order by points desc, wins desc, created_at asc) as rank
    from public.game_profiles
  ) ranked
  where ranked.id = auth.uid();
$$;

revoke all on function public.get_my_game_rank() from public, anon;
grant execute on function public.get_my_game_rank() to authenticated;

-- Existing Supabase users can sign in normally. Existing public profile rows
-- with UUID ids are copied when the legacy table contains compatible fields.
do $$
declare
  username_expr text;
  country_expr text;
  points_expr text;
  wins_expr text;
  created_expr text;
begin
  if to_regclass('public.profiles') is null
    or not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='id' and udt_name='uuid') then
    return;
  end if;
  username_expr := case
    when exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='username') then 'coalesce(nullif(username, ''''), ''Player'')'
    when exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='name') then 'coalesce(nullif(name, ''''), ''Player'')'
    else '''Player''' end;
  country_expr := case
    when exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='country_code') then 'upper(country_code::text)'
    else '''ZA''' end;
  points_expr := case
    when exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='points') then 'greatest(coalesce(points::integer, 0), 0)'
    else '0' end;
  wins_expr := case
    when exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='wins') then 'greatest(coalesce(wins::integer, 0), 0)'
    else '0' end;
  created_expr := case
    when exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='created_at') then 'coalesce(created_at::timestamptz, now())'
    else 'now()' end;
  execute format(
    'insert into public.game_profiles (id, username, country_code, points, wins, created_at) select id, left(%s, 24), case when %s ~ ''^[A-Z]{2}$'' then %s else ''ZA'' end, %s, %s, %s from public.profiles on conflict (id) do nothing',
    username_expr, country_expr, country_expr, points_expr, wins_expr, created_expr
  );
end;
$$;


-- 002_avatars_challenges.sql

alter table public.game_profiles add column if not exists avatar_url text;
grant update (avatar_url) on public.game_profiles to authenticated;

insert into storage.buckets (id, name, public)
values ('game-avatars', 'game-avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Public game avatars are readable" on storage.objects;
create policy "Public game avatars are readable" on storage.objects for select using (bucket_id = 'game-avatars');
drop policy if exists "Users upload their own game avatar" on storage.objects;
create policy "Users upload their own game avatar" on storage.objects for insert to authenticated with check (bucket_id = 'game-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users update their own game avatar" on storage.objects;
create policy "Users update their own game avatar" on storage.objects for update to authenticated using (bucket_id = 'game-avatars' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'game-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create table if not exists public.game_challenges (
 id uuid primary key default gen_random_uuid(),
 challenger_id uuid not null references public.game_profiles(id) on delete cascade,
 challenged_id uuid not null references public.game_profiles(id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','accepted','declined')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint game_challenges_no_self check (challenger_id <> challenged_id)
);
create index if not exists game_challenges_challenged_created on public.game_challenges(challenged_id, created_at desc);
create index if not exists game_challenges_challenger_created on public.game_challenges(challenger_id, created_at desc);
alter table public.game_challenges enable row level security;
grant select, insert, update on public.game_challenges to authenticated;
drop policy if exists "Players see their challenges" on public.game_challenges;
create policy "Players see their challenges" on public.game_challenges for select to authenticated using (challenger_id = auth.uid() or challenged_id = auth.uid());
drop policy if exists "Players send challenges as themselves" on public.game_challenges;
create policy "Players send challenges as themselves" on public.game_challenges for insert to authenticated with check (challenger_id = auth.uid() and challenged_id <> auth.uid());
drop policy if exists "Invited players respond to challenges" on public.game_challenges;
create policy "Invited players respond to challenges" on public.game_challenges for update to authenticated using (challenged_id = auth.uid() and status = 'pending') with check (challenged_id = auth.uid() and status in ('accepted','declined'));


-- 003_restore_profiles_and_scoring.sql

begin;

alter table public.game_profiles
  add column if not exists computer_wins integer not null default 0,
  add column if not exists friend_wins integer not null default 0,
  add column if not exists online_wins integer not null default 0,
  add column if not exists legacy_wins_synced integer not null default 0,
  add column if not exists legacy_points_synced integer not null default 0,
  add column if not exists legacy_computer_synced integer not null default 0,
  add column if not exists legacy_friend_synced integer not null default 0,
  add column if not exists legacy_online_synced integer not null default 0,
  add column if not exists native_wins_seeded boolean not null default false;

-- Earlier native releases recorded computer wins only. Preserve those wins.
update public.game_profiles set computer_wins=computer_wins+greatest(wins-computer_wins-friend_wins-online_wins,0),native_wins_seeded=true where not native_wins_seeded;

-- Import the original score categories without replacing newer earned points.
-- The sync markers make this migration safe to run again.
insert into public.game_profiles(id,username,country_code,avatar_url,wins,points,computer_wins,friend_wins,online_wins,legacy_wins_synced,legacy_points_synced,legacy_computer_synced,legacy_friend_synced,legacy_online_synced,native_wins_seeded)
select p.id,left(coalesce(nullif(p.username,''),'Player'),24),case when upper(p.country_code)~'^[A-Z]{2}$' then upper(p.country_code) else 'ZA' end,p.avatar_url,
greatest(coalesce(p.wins,0),coalesce(p.computer_wins,0)+coalesce(p.friend_wins,0)+coalesce(p.online_wins,0)),
greatest(coalesce(p.wins,0),coalesce(p.computer_wins,0)+coalesce(p.friend_wins,0)+coalesce(p.online_wins,0))*10,
coalesce(p.computer_wins,0),coalesce(p.friend_wins,0),coalesce(p.online_wins,0),
greatest(coalesce(p.wins,0),coalesce(p.computer_wins,0)+coalesce(p.friend_wins,0)+coalesce(p.online_wins,0)),
greatest(coalesce(p.wins,0),coalesce(p.computer_wins,0)+coalesce(p.friend_wins,0)+coalesce(p.online_wins,0))*10,
coalesce(p.computer_wins,0),coalesce(p.friend_wins,0),coalesce(p.online_wins,0),true
from public.profiles p join auth.users u on u.id=p.id
on conflict(id) do update set
 username=case when game_profiles.username='Player' then excluded.username else game_profiles.username end,
 avatar_url=coalesce(nullif(game_profiles.avatar_url,''),excluded.avatar_url),
 wins=game_profiles.wins+greatest(excluded.legacy_wins_synced-game_profiles.legacy_wins_synced,0),
 points=game_profiles.points+greatest(excluded.legacy_points_synced-game_profiles.legacy_points_synced,0),
 computer_wins=game_profiles.computer_wins+greatest(excluded.legacy_computer_synced-game_profiles.legacy_computer_synced,0),
 friend_wins=game_profiles.friend_wins+greatest(excluded.legacy_friend_synced-game_profiles.legacy_friend_synced,0),
 online_wins=game_profiles.online_wins+greatest(excluded.legacy_online_synced-game_profiles.legacy_online_synced,0),
 legacy_wins_synced=greatest(game_profiles.legacy_wins_synced,excluded.legacy_wins_synced),
 legacy_points_synced=greatest(game_profiles.legacy_points_synced,excluded.legacy_points_synced),
 legacy_computer_synced=greatest(game_profiles.legacy_computer_synced,excluded.legacy_computer_synced),
 legacy_friend_synced=greatest(game_profiles.legacy_friend_synced,excluded.legacy_friend_synced),
 legacy_online_synced=greatest(game_profiles.legacy_online_synced,excluded.legacy_online_synced),updated_at=now();

grant insert(id,username,country_code,avatar_url) on public.game_profiles to authenticated;
grant update(username,country_code,avatar_url,updated_at) on public.game_profiles to authenticated;

create table if not exists public.game_results(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 game_id uuid not null,
 difficulty text not null check(difficulty in ('easy','normal','hard')),
 game_mode text not null check(game_mode in ('classic','sudden','chaos','tour')),
 opponent text not null check(opponent in ('computer','friend')),
 safe_sprays integer not null check(safe_sprays between 0 and 80),
 rounds integer not null check(rounds between 0 and 40),
 final_roll integer not null default 1 check(final_roll between 1 and 12),
 won boolean not null,
 points_awarded integer not null check(points_awarded between -200 and 200),
 created_at timestamptz not null default now(),unique(user_id,game_id)
);
alter table public.game_results enable row level security;
revoke all on public.game_results from anon,authenticated;
grant select on public.game_results to authenticated;
drop policy if exists "Players read their results" on public.game_results;
create policy "Players read their results" on public.game_results for select to authenticated using(user_id=auth.uid());

create or replace function public.save_game_profile(p_username text,p_country_code text,p_avatar_url text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Please sign in';end if;
 if length(trim(p_username)) not between 1 and 24 then raise exception 'Choose a username between 1 and 24 characters';end if;
 if p_country_code!~'^[A-Z]{2}$' then raise exception 'Choose a country';end if;
 if p_avatar_url is not null and (p_avatar_url!~'^https://' or length(p_avatar_url)>2000) then raise exception 'Upload a profile photo first';end if;
 insert into game_profiles(id,username,country_code,avatar_url) values(auth.uid(),trim(p_username),p_country_code,p_avatar_url)
 on conflict(id) do update set username=excluded.username,country_code=excluded.country_code,avatar_url=excluded.avatar_url,updated_at=now();
 update profiles set username=trim(p_username),country_code=p_country_code,avatar_url=p_avatar_url where id=auth.uid();
end;$$;
revoke all on function public.save_game_profile(text,text,text) from public,anon;
grant execute on function public.save_game_profile(text,text,text) to authenticated;

create or replace function public.get_game_leaderboard()
returns table(id uuid,username text,country_code text,avatar_url text,points integer,wins integer,computer_wins integer,friend_wins integer,online_wins integer,created_at timestamptz)
language sql stable security definer set search_path=public,pg_temp as $$
 select p.id,p.username,p.country_code,p.avatar_url,p.points,p.wins,p.computer_wins,p.friend_wins,p.online_wins,p.created_at from game_profiles p order by p.points desc,p.wins desc,p.created_at asc;
$$;
revoke all on function public.get_game_leaderboard() from public;
grant execute on function public.get_game_leaderboard() to anon,authenticated;

drop function if exists public.record_game_result(uuid,text,text,text,integer,integer,boolean);
create or replace function public.record_game_result(p_game_id uuid,p_difficulty text,p_game_mode text,p_opponent text,p_safe_sprays integer,p_rounds integer,p_final_roll integer,p_won boolean)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare award integer; inserted_id uuid; total integer; result_wins integer; multiplier numeric;
begin
 if auth.uid() is null then raise exception 'Please sign in';end if;
 if p_difficulty not in ('easy','normal','hard') or p_game_mode not in ('classic','sudden','chaos','tour') or p_opponent not in ('computer','friend') or p_safe_sprays not between 0 and 80 or p_rounds not between 0 and 40 or p_final_roll not between 1 and 12 then raise exception 'Invalid game result';end if;
 multiplier=case p_difficulty when 'hard' then 2 when 'normal' then 1.5 else 1 end;
 award=floor((least(60,p_safe_sprays*2)+least(20,p_rounds*2)+20)*multiplier);
 if not p_won then award := -award; end if;
 insert into game_results(user_id,game_id,difficulty,game_mode,opponent,safe_sprays,rounds,final_roll,won,points_awarded)
 values(auth.uid(),p_game_id,p_difficulty,p_game_mode,p_opponent,p_safe_sprays,p_rounds,p_final_roll,p_won,award) on conflict(user_id,game_id) do nothing returning id into inserted_id;
 if inserted_id is not null then
  insert into game_profiles(id,username,country_code) select u.id,left(coalesce(u.raw_user_meta_data->>'username','Player'),24),'ZA' from auth.users u where u.id=auth.uid() on conflict(id) do nothing;
  update game_profiles set points=greatest(0,points+award),wins=wins+case when p_won then 1 else 0 end,
   computer_wins=computer_wins+case when p_won and p_opponent='computer' then 1 else 0 end,
   friend_wins=friend_wins+case when p_won and p_opponent='friend' then 1 else 0 end,updated_at=now() where id=auth.uid();
 end if;
 select p.points,p.wins into total,result_wins from game_profiles p where p.id=auth.uid();
 return jsonb_build_object('points_awarded',award,'total_points',total,'wins',result_wins,'already_recorded',inserted_id is null);
end;$$;
revoke all on function public.record_game_result(uuid,text,text,text,integer,integer,integer,boolean) from public,anon;
grant execute on function public.record_game_result(uuid,text,text,text,integer,integer,integer,boolean) to authenticated;
notify pgrst,'reload schema';
commit;

-- 007_username_and_game_shields.sql
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
