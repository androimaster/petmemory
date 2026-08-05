# 별이 된 친구

반려견 사진과 영상을 기록하고 공개 여부를 선택할 수 있는 온라인 추모관입니다. 브라우저에서 실행되는 HTML, CSS, JavaScript와 Supabase를 사용하며 GitHub Pages로 배포됩니다.

## Supabase 연결

1. Supabase에서 새 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase/schema.sql` 전체를 실행합니다.
3. Authentication → Providers에서 Google을 활성화합니다.
4. 로컬에서는 `supabase-config.example.js`를 `supabase-config.js`로 복사한 후 Project URL과 anon public key를 입력합니다.
5. Google Cloud와 Supabase의 허용된 Redirect URL에 로컬 주소 및 GitHub Pages 주소를 등록합니다.

`anon` 키는 브라우저 사용을 전제로 한 공개 키입니다. 데이터 보호는 `supabase/schema.sql`의 Row Level Security 정책으로 처리되며 service role 키는 절대 브라우저나 GitHub Pages에 넣지 않습니다.

## GitHub Pages 배포

저장소 Settings → Secrets and variables → Actions → Variables에 아래 값을 추가합니다.

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Settings → Pages → Source를 **GitHub Actions**로 선택합니다. `main` 브랜치에 push하면 `.github/workflows/pages.yml`이 정적 사이트를 배포합니다.

## 로컬 미리보기

정적 파일 서버로 프로젝트 루트를 열면 됩니다. `file://`로 직접 열면 OAuth 리디렉션이 동작하지 않을 수 있습니다.
