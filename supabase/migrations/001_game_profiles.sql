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
