-- 추모관 목록과 상세 화면에 생성자 표시 이름을 추가합니다.
-- Supabase SQL Editor에서 한 번 실행하세요.
alter table public.pets
  add column if not exists creator_name text;

alter table public.pets
  drop constraint if exists pets_creator_name_check;

alter table public.pets
  add constraint pets_creator_name_check
  check (creator_name is null or char_length(creator_name) between 1 and 80);

update public.pets as pet
set creator_name = case
  when profile.display_name like '%@%'
    then split_part(profile.display_name, '@', 1)
  else coalesce(nullif(profile.display_name, ''), '별빛 보호자')
end
from public.profiles as profile
where profile.id = pet.owner_id
  and pet.creator_name is null;

alter table public.pets enable row level security;
drop policy if exists "public pets or own pets read" on public.pets;
create policy "public pets or own pets read" on public.pets
for select using (is_public or auth.uid() = owner_id);
