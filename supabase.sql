-- Supabase 24/7 setup for Clinical Nutrition DSS
-- Run this in Supabase Dashboard → SQL Editor for project ybmrgxwmppytvexrlfjd (or your project)
-- Org: ofjtqupvucswboyjdafj

-- 1. Profiles table (extends auth.users) — COMPLETE PROFESSIONAL STRUCTURE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  username text unique,
  email text unique,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
-- Ensure unique case-insensitive (lowercase check)
create unique index if not exists profiles_username_lower_unique on public.profiles (lower(username));
create unique index if not exists profiles_email_lower_unique on public.profiles (lower(email));

alter table public.profiles enable row level security;
drop policy if exists "Public can read profiles" on public.profiles;
create policy "Public can read profiles" on public.profiles for select using (true);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile" on public.profiles for delete using (auth.uid() = id);

-- Updated at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'username', lower(replace(split_part(new.email,'@',1), '.', '_'))),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- 2. Storage bucket for avatars (create via Dashboard → Storage → New bucket: avatars, public: true)
-- Or via SQL:
insert into storage.buckets (id, name, public) values ('avatars','avatars', true) on conflict (id) do nothing;
drop policy if exists "Avatar public read" on storage.objects;
create policy "Avatar public read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "Users can upload avatar" on storage.objects;
create policy "Users can upload avatar" on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
drop policy if exists "Users can update avatar" on storage.objects;
create policy "Users can update avatar" on storage.objects for update using (bucket_id = 'avatars' and auth.role() = 'authenticated');
drop policy if exists "Users can delete avatar" on storage.objects;
create policy "Users can delete avatar" on storage.objects for delete using (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- 3. Optional: user_datas table for syncing local users (if you want to mirror localStorage)
create table if not exists public.user_datas (
  id uuid primary key default gen_random_uuid(),
  email text,
  name text,
  data jsonb,
  created_at timestamp with time zone default now()
);
alter table public.user_datas enable row level security;
drop policy if exists "Allow all for service_role" on public.user_datas;
create policy "Allow all for service_role" on public.user_datas for all using (true) with check (true);
