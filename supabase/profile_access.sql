-- 기존 가입자의 프로필이 누락된 경우에도 앱이 자동 복구할 수 있게 합니다.
-- Supabase SQL Editor에서 한 번 실행하세요.
drop policy if exists "profiles own insert" on public.profiles;
create policy "profiles own insert" on public.profiles
for insert to authenticated with check (auth.uid() = id);
