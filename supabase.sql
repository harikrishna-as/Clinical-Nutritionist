-- Supabase 24/7 setup for Clinical Nutrition DSS
-- Run this in Supabase Dashboard → SQL Editor for project ybmrgxwmppytvexrlfjd (or your project)
-- Org: ofjtqupvucswboyjdafj

-- 1. Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);
alter table public.profiles enable row level security;
create policy "Public can read profiles" on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- 2. Storage bucket for avatars (create via Dashboard → Storage → New bucket: avatars, public: true)
-- Or via SQL:
insert into storage.buckets (id, name, public) values ('avatars','avatars', true) on conflict (id) do nothing;
create policy "Avatar public read" on storage.objects for select using (bucket_id = 'avatars');
create policy "Users can upload avatar" on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "Users can update avatar" on storage.objects for update using (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- 3. Optional: user_datas table for syncing local users (if you want to mirror localStorage)
create table if not exists public.user_datas (
  id uuid primary key default gen_random_uuid(),
  email text,
  name text,
  data jsonb,
  created_at timestamp with time zone default now()
);
alter table public.user_datas enable row level security;
create policy "Allow all for service_role" on public.user_datas for all using (true) with check (true);
