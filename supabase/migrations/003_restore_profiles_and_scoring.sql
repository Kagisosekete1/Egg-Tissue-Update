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
 won boolean not null,
 points_awarded integer not null check(points_awarded between 0 and 200),
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

create or replace function public.record_game_result(p_game_id uuid,p_difficulty text,p_game_mode text,p_opponent text,p_safe_sprays integer,p_rounds integer,p_won boolean)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare award integer; inserted_id uuid; total integer; result_wins integer;
begin
 if auth.uid() is null then raise exception 'Please sign in';end if;
 if p_difficulty not in ('easy','normal','hard') or p_game_mode not in ('classic','sudden','chaos','tour') or p_opponent not in ('computer','friend') or p_safe_sprays not between 0 and 80 or p_rounds not between 0 and 40 then raise exception 'Invalid game result';end if;
 award=floor((least(60,p_safe_sprays*2)+least(20,p_rounds*2)+case when p_won then 20 else 0 end)*case p_difficulty when 'hard' then 2 when 'normal' then 1.5 else 1 end);
 insert into game_results(user_id,game_id,difficulty,game_mode,opponent,safe_sprays,rounds,won,points_awarded)
 values(auth.uid(),p_game_id,p_difficulty,p_game_mode,p_opponent,p_safe_sprays,p_rounds,p_won,award) on conflict(user_id,game_id) do nothing returning id into inserted_id;
 if inserted_id is not null then
  insert into game_profiles(id,username,country_code) select u.id,left(coalesce(u.raw_user_meta_data->>'username','Player'),24),'ZA' from auth.users u where u.id=auth.uid() on conflict(id) do nothing;
  update game_profiles set points=points+award,wins=wins+case when p_won then 1 else 0 end,
   computer_wins=computer_wins+case when p_won and p_opponent='computer' then 1 else 0 end,
   friend_wins=friend_wins+case when p_won and p_opponent='friend' then 1 else 0 end,updated_at=now() where id=auth.uid();
 end if;
 select p.points,p.wins into total,result_wins from game_profiles p where p.id=auth.uid();
 return jsonb_build_object('points_awarded',award,'total_points',total,'wins',result_wins,'already_recorded',inserted_id is null);
end;$$;
revoke all on function public.record_game_result(uuid,text,text,text,integer,integer,boolean) from public,anon;
grant execute on function public.record_game_result(uuid,text,text,text,integer,integer,boolean) to authenticated;
notify pgrst,'reload schema';
commit;
