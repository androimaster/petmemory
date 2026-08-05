# 별이 된 친구 — Agent 작업 지침

이 파일은 이 저장소를 이어서 작업하는 모든 agent가 먼저 읽어야 하는 프로젝트 인수인계 문서다. 사용자 요청과 현재 구현 기준을 임의로 축소하거나 다른 배포 방식으로 바꾸지 않는다.

## 프로젝트 목표

- 서비스명: **별이 된 친구**
- 목적: 회원별 반려견 사진·영상과 이야기를 보관하고, 공개 추모관을 검색하며, 방문자가 방명록을 남길 수 있는 반려견 추모 사이트
- GitHub 저장소: `androimaster/petmemory`
- 운영 URL: `https://androimaster.github.io/petmemory/`
- 프런트엔드: 정적 `HTML`, `CSS`, `JavaScript`
- 인증·DB·파일 저장소: Supabase
- 운영 배포: **GitHub Pages / GitHub Actions**. `.openai/hosting.json`이 있어도 이 프로젝트의 운영 배포를 Sites로 변경하지 않는다.

## 주요 파일

- `index.html`: 정적 페이지, 로그인/추모관/상세/확인 모달
- `styles.css`: 전체 화면 및 모바일 스타일
- `account.css`: 로그인 사용자 헤더와 모바일 로그인·로그아웃 스타일
- `app.js`: Supabase 인증, 추모관 CRUD 흐름, 파일 업로드, 상세 갤러리, 방명록
- `supabase-config.example.js`: 운영 Supabase URL, publishable key, OAuth redirect URL
- `supabase/schema.sql`: 신규 Supabase 프로젝트용 전체 스키마
- `supabase/profile_access.sql`: 기존 가입자의 누락된 프로필 자동 복구 권한
- `supabase/guestbook.sql`: 방명록 테이블과 RLS
- `supabase/media_access.sql`: 사진·영상 메타데이터와 Storage RLS. **항상 최신 파일 전체를 다시 실행할 수 있도록 idempotent하게 유지한다.**
- `supabase/creator_info.sql`: 기존 추모관 생성자 표시 이름과 공개 조회 정책
- `public/hero-dog.png`: 사용자가 제공한 메인 대표 강아지 이미지

## 확정된 기능 요구사항

### 인증과 헤더

- Google OAuth만 사용한다.
- 로그인 전에는 `로그인`, 로그인 후에는 사용자 프로필과 `로그아웃`이 보인다.
- OAuth 복귀 직후 새로고침 없이 로그인 UI가 즉시 바뀌어야 한다.
- 모바일에서도 로그인과 로그아웃이 가능해야 한다.
- 로그아웃 버튼은 즉시 로그아웃하지 않고 `정말 로그아웃할까요?` 확인 모달을 먼저 띄운다.
- OAuth redirect는 GitHub Pages 루트이며 localhost로 보내지 않는다.

### 추모관 생성과 요금제

- 한 계정에서 여러 반려견 추모관을 관리한다.
- 무료 계정은 추모관 1개, 플러스는 최대 10개다.
- 현재 제안 요금: 연 39,000원(월 환산 3,250원). 결제 연결 전에는 안내만 표시한다.
- 사진·영상 선택 시 생성 모달 안에서 즉시 미리보기를 제공한다.
- 생성 성공 직후 생성 모달을 닫고 새 추모관을 목록에 즉시 표시한다.
- 파일 업로드는 추모관 생성 뒤 이어서 처리하되 실패를 숨기지 말고 실제 오류를 사용자에게 표시한다.
- 재로그인 후에도 본인이 만든 공개·비공개 추모관은 반드시 조회되어야 한다.

### 공개 범위와 표시 문구

- 공개 추모관은 로그아웃 사용자와 다른 로그인 사용자가 조회할 수 있다.
- 비공개 추모관과 그 사진은 생성자만 조회할 수 있다. 클라이언트 숨김만으로 처리하지 말고 Supabase RLS로 강제한다.
- 생성자 ID와 현재 사용자 ID가 같은 공개 추모관: `내 추모관`
- 생성자 ID와 현재 사용자 ID가 같은 비공개 추모관: `내 추모관(비공개)`
- 생성자와 조회자가 다른 공개 추모관: `공개 추모관`
- 목록과 상세 화면 모두 생성자 표시 이름을 보여준다.
- 소유자 비교는 `String(pet.owner_id) === String(currentUser.id)` 방식으로 안정적으로 처리한다.

### 상세 화면, 사진과 영상

- 추모관 카드를 선택하면 모달형 상세 화면을 연다.
- 상세 화면은 이야기, 사진·영상 갤러리, 생성자 정보, 방명록을 보여준다.
- 사진·영상 추가 버튼은 추모관 생성자에게만 보인다.
- 타인에게는 `생성자만 사진을 추가할 수 있어요` 안내를 보여준다.
- API를 직접 호출해도 생성자만 업로드할 수 있도록 `pet_media`와 `storage.objects` RLS를 모두 적용한다.
- 공개 추모관의 사진은 로그아웃 사용자와 다른 사용자에게도 생성자가 보는 것과 동일하게 보여야 한다.
- 비공개 버킷을 유지하고 signed URL을 사용한다. 버킷 전체를 public으로 바꾸면 비공개 추모관 파일이 노출될 수 있으므로 금지한다.
- `pet_media` 행이 누락되어도 실제 Storage 폴더를 조회해 파일을 복구 표시하는 fallback이 있다.

### 방명록

- 공개 추모관을 볼 수 있는 로그인 사용자는 방명록을 작성할 수 있다.
- 작성자 이름과 작성 시각을 표시한다.
- 작성 시각은 `Asia/Seoul` 기준으로 연월일과 시·분·초까지 표시한다.
- 방명록 테이블이 아직 활성화되지 않았다면 준비가 필요하다는 명확한 안내를 표시한다.

### 검색과 목록

- 공개 추모관은 이름과 견종으로 검색할 수 있다.
- 로그인 사용자는 공개 추모관과 자신의 모든 추모관을 함께 본다.
- 조회는 `pets`의 RLS(`is_public OR auth.uid() = owner_id`)를 신뢰해 전체 select하고, 클라이언트에서 비공개 타인 데이터를 노출하지 않는다.

## Supabase 보안 불변 조건

- 브라우저에는 publishable/anon key만 둔다. service role key를 코드, GitHub Pages, 커밋에 절대 넣지 않는다.
- `profiles`, `pets`, `pet_media`, `guestbook_entries`, `storage.objects`의 RLS를 유지한다.
- 추모관 비공개 여부, 업로드 소유권, 방명록 작성 권한은 반드시 서버 정책에서 검증한다.
- 공개 사진 읽기는 `public.can_read_public_pet_media(object_name)` security-definer 함수와 Storage select policy를 사용한다.
- 생성자 사진 쓰기는 `public.can_manage_pet_media(target_pet_id)` security-definer 함수와 `pet_media`/Storage insert policy를 사용한다.
- 보안 함수는 `search_path = public`, 최소 EXECUTE grant만 사용한다.

## 기존 Supabase 프로젝트에 필요한 SQL

신규 프로젝트는 `supabase/schema.sql` 전체를 실행한다. 기존 운영 프로젝트에는 필요에 따라 다음 파일을 Supabase SQL Editor에서 실행한다.

1. `supabase/profile_access.sql`
2. `supabase/guestbook.sql`
3. `supabase/creator_info.sql`
4. `supabase/media_access.sql` — 정책이 여러 번 개선됐으므로 항상 최신 전체 파일을 다시 실행한다.

정적 코드를 배포하는 것만으로 Supabase SQL은 적용되지 않는다. 사용자가 SQL 실행을 완료하기 전에는 기능이 완전히 활성화됐다고 단정하지 않는다.

## 현재 확인된 운영 상태와 미해결 확인 사항

- `예삐` 추모관 ID: `eadfd40c-a20e-41c8-9887-9994cdd02bc1`
- `예삐`는 공개 상태이며 `cover_path`가 저장돼 있다.
- 익명 signed URL 발급이 과거 `404 Object not found`로 실패해 `can_read_public_pet_media` 방식으로 정책을 변경했다.
- 사용자가 상세 화면에서 추가한 사진은 마지막 확인 당시 `pet_media`에 기록되지 않았고 최초 사진 1건만 있었다. 업로드 정책을 `can_manage_pet_media` 방식으로 변경했다.
- **사용자가 최신 `supabase/media_access.sql`을 실제 운영 Supabase에서 실행한 뒤, 생성자로 사진을 다시 추가하고 익명 signed URL과 `pet_media` 행을 재확인해야 한다.** 이 검증 전에는 해결 완료라고 단정하지 않는다.

## 구현·검증·배포 규칙

- 기존 정적 구조를 보존하고 불필요하게 React/Vinext 쪽으로 옮기지 않는다.
- 수정할 때 캐시 무효화를 위해 `index.html`의 `styles.css?v=...`, `account.css?v=...`, `app.js?v=...` 값을 올린다.
- JavaScript 변경 후 `node --check app.js`, 전체 변경 후 `git diff --check`를 실행한다.
- 사용자 요청이 구현과 배포를 포함하면 `main`에 명확한 커밋을 만들고 `origin main`으로 push한다.
- GitHub Actions의 `Deploy GitHub Pages`가 성공했는지 확인한다.
- 운영 데이터 문제는 publishable key를 이용한 읽기 전용 REST/Storage 요청으로 사실을 확인할 수 있다. 인증 토큰, 쿠키, service role key는 읽거나 노출하지 않는다.
- 오류를 예시 데이터로 조용히 가리지 말고, 생성/업로드/권한 실패 원인을 사용자에게 명확히 표시한다.
- 사용자 기존 변경을 보존하고 관련 없는 파일을 수정하지 않는다.

## 사용자 커뮤니케이션

- 사용자는 반복되는 “SQL을 실행하세요” 안내만 받는 것에 불만이 있다. 가능한 경우 실제 운영 응답을 먼저 확인하고, 어떤 데이터/정책이 실패했는지 근거를 제시한다.
- SQL 실행이 필요한 경우 어떤 파일을 왜 다시 실행해야 하는지 구체적으로 말한다.
- 사용자가 SQL 실행 완료를 알려주면 즉시 다음을 재검증한다.
  1. 익명 사용자의 공개 추모관 조회
  2. 익명 signed URL 발급
  3. 생성자의 추가 사진 업로드
  4. `pet_media` 새 행 생성
  5. 생성자·타 사용자·로그아웃 상태의 상세 갤러리 표시
