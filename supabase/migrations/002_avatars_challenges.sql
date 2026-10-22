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
