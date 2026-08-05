-- 추모관 사진·영상 업로드 및 다시 보기 권한을 복구합니다.
-- Supabase SQL Editor에서 한 번 실행하세요.
alter table public.pet_media enable row level security;

drop policy if exists "public media metadata or own read" on public.pet_media;
create policy "public media metadata or own read" on public.pet_media
for select using (
  auth.uid() = owner_id
  or exists(select 1 from public.pets where pets.id = pet_media.pet_id and pets.is_public)
);

drop policy if exists "owners create media" on public.pet_media;
create policy "owners create media" on public.pet_media
for insert to authenticated with check (
  auth.uid() = owner_id
  and exists(
    select 1 from public.pets
    where pets.id = pet_media.pet_id and pets.owner_id = auth.uid()
  )
);

drop policy if exists "owners upload pet media" on storage.objects;
create policy "owners upload pet media" on storage.objects
for insert to authenticated with check (
  bucket_id = 'pet-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists(
    select 1 from public.pets
    where pets.id::text = (storage.foldername(name))[2]
      and pets.owner_id = auth.uid()
  )
);

drop policy if exists "authorized reads pet media" on storage.objects;
create or replace function public.can_read_public_pet_media(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.pets
    where pets.id::text = (storage.foldername(object_name))[2]
      and pets.is_public = true
  );
$$;

revoke all on function public.can_read_public_pet_media(text) from public;
grant execute on function public.can_read_public_pet_media(text) to anon, authenticated;

create policy "authorized reads pet media" on storage.objects
for select using (
  bucket_id = 'pet-media' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.can_read_public_pet_media(name)
  )
);
