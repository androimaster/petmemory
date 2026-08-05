// Supabase 프로젝트 설정에서 Project URL과 anon public key를 복사하세요.
// 이 파일은 공개 설정 예시이며, anon key는 RLS 정책과 함께 브라우저에서 사용하도록 설계된 키입니다.
window.SUPABASE_CONFIG = window.SUPABASE_CONFIG || {
  url: "YOUR_SUPABASE_URL",
  anonKey: "YOUR_SUPABASE_ANON_KEY",
  redirectUrl: window.location.origin + window.location.pathname,
};
