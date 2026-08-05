-- Supabase SQL Editor에서 한 번 실행하세요.
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  plan text not null default 'free' check (plan in ('free','plus')),
  created_at timestamptz not null default now()
);

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  creator_name text check (creator_name is null or char_length(creator_name) between 1 and 80),
  name text not null check (char_length(name) between 1 and 30),
  breed text,
  born_on date,
  passed_on date,
  story text check (char_length(story) <= 1000),
  cover_path text,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.pet_media (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  media_type text not null check (media_type in ('image','video')),
  file_name text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 104857600),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 80),
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists guestbook_entries_pet_created_idx on public.guestbook_entries (pet_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.pet_media enable row level security;
alter table public.guestbook_entries enable row level security;

create policy "profiles own read" on public.profiles for select using (auth.uid() = id);
create policy "profiles own insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles own update" on public.profiles for update using (auth.uid() = id);
create policy "public pets or own pets read" on public.pets for select using (is_public or auth.uid() = owner_id);
create policy "owners create pets within plan limit" on public.pets for insert with check (
  auth.uid() = owner_id and (
    ((select plan from public.profiles where id = auth.uid()) = 'plus'
      and (select count(*) from public.pets where owner_id = auth.uid()) < 10)
    or ((select plan from public.profiles where id = auth.uid()) = 'free'
      and (select count(*) from public.pets where owner_id = auth.uid()) < 1)
  )
);
create policy "owners update pets" on public.pets for update using (auth.uid() = owner_id);
create policy "owners delete pets" on public.pets for delete using (auth.uid() = owner_id);
create policy "public media metadata or own read" on public.pet_media for select using (
  auth.uid() = owner_id or exists(select 1 from public.pets where pets.id = pet_id and pets.is_public)
);
create policy "owners create media" on public.pet_media for insert with check (
  auth.uid() = owner_id and exists(
    select 1 from public.pets where pets.id = pet_media.pet_id and pets.owner_id = auth.uid()
  )
);
create policy "owners delete media" on public.pet_media for delete using (auth.uid() = owner_id);
create policy "visible memorial guestbook read" on public.guestbook_entries for select using (
  exists(select 1 from public.pets where pets.id = pet_id and (pets.is_public or pets.owner_id = auth.uid()))
);
create policy "signed in visitors write guestbook" on public.guestbook_entries for insert to authenticated with check (
  auth.uid() = author_id and exists(select 1 from public.pets where pets.id = pet_id and (pets.is_public or pets.owner_id = auth.uid()))
);
create policy "authors delete own guestbook entries" on public.guestbook_entries for delete to authenticated using (auth.uid() = author_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles(id, display_name) values(new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email)); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('pet-media','pet-media',false,104857600,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "owners upload pet media" on storage.objects for insert to authenticated with check (
  bucket_id = 'pet-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists(
    select 1 from public.pets
    where pets.id::text = (storage.foldername(name))[2] and pets.owner_id = auth.uid()
  )
);
create policy "authorized reads pet media" on storage.objects for select using (
  bucket_id = 'pet-media' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists(select 1 from public.pets where pets.id = ((storage.foldername(name))[2])::uuid and pets.is_public)
  )
);
create policy "owners delete pet media" on storage.objects for delete to authenticated using (bucket_id = 'pet-media' and (storage.foldername(name))[1] = auth.uid()::text);
