begin;

-- Keep the losing player's dice roll with the result so penalties are based on
-- the roll that caused the egg to fall.
alter table public.game_results add column if not exists final_roll integer not null default 1;
alter table public.game_results drop constraint if exists game_results_points_awarded_check;
alter table public.game_results add constraint game_results_points_awarded_check
  check(points_awarded between -200 and 200);
alter table public.game_results add constraint game_results_final_roll_check
  check(final_roll between 1 and 12);

drop function if exists public.record_game_result(uuid,text,text,text,integer,integer,boolean);

create function public.record_game_result(
  p_game_id uuid,
  p_difficulty text,
  p_game_mode text,
  p_opponent text,
  p_safe_sprays integer,
  p_rounds integer,
  p_final_roll integer,
  p_won boolean
)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  award integer;
  inserted_id uuid;
  total integer;
  result_wins integer;
  multiplier numeric;
begin
  if auth.uid() is null then raise exception 'Please sign in'; end if;
  if p_difficulty not in ('easy','normal','hard')
    or p_game_mode not in ('classic','sudden','chaos','tour')
    or p_opponent not in ('computer','friend')
    or p_safe_sprays not between 0 and 80
    or p_rounds not between 0 and 40
    or p_final_roll not between 1 and 12 then
    raise exception 'Invalid game result';
  end if;

  multiplier := case p_difficulty when 'hard' then 2 when 'normal' then 1.5 else 1 end;
  if p_won then
    award := floor((least(60,p_safe_sprays*2)+least(20,p_rounds*2)+20)*multiplier);
  else
    award := -floor(greatest(5,p_final_roll*2)*multiplier);
  end if;

  insert into game_results(user_id,game_id,difficulty,game_mode,opponent,safe_sprays,rounds,final_roll,won,points_awarded)
  values(auth.uid(),p_game_id,p_difficulty,p_game_mode,p_opponent,p_safe_sprays,p_rounds,p_final_roll,p_won,award)
  on conflict(user_id,game_id) do nothing returning id into inserted_id;
  if inserted_id is not null then
    insert into game_profiles(id,username,country_code)
      select u.id,left(coalesce(u.raw_user_meta_data->>'username','Player'),24),'ZA'
      from auth.users u where u.id=auth.uid() on conflict(id) do nothing;
    update game_profiles set
      points=greatest(0,points+award),
      wins=wins+case when p_won then 1 else 0 end,
      computer_wins=computer_wins+case when p_won and p_opponent='computer' then 1 else 0 end,
      friend_wins=friend_wins+case when p_won and p_opponent='friend' then 1 else 0 end,
      updated_at=now()
    where id=auth.uid();
  end if;
  select p.points,p.wins into total,result_wins from game_profiles p where p.id=auth.uid();
  return jsonb_build_object('points_awarded',award,'total_points',total,'wins',result_wins,'already_recorded',inserted_id is null);
end;
$$;
revoke all on function public.record_game_result(uuid,text,text,text,integer,integer,integer,boolean) from public,anon;
grant execute on function public.record_game_result(uuid,text,text,text,integer,integer,integer,boolean) to authenticated;

notify pgrst,'reload schema';
commit;
