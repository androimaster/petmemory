import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

(() => {
const demoPets = [
  { id:"demo-1", name:"몽이", breed:"말티즈", born_on:"2012-03-12", passed_on:"2025-01-07", story:"작은 발로 우리 집에 가장 큰 사랑을 남겨준 몽이", cover_url:"https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=900&q=85" },
  { id:"demo-2", name:"초코", breed:"푸들", born_on:"2010-08-02", passed_on:"2024-10-22", story:"산책이라는 말만 들어도 온몸으로 웃어주던 아이", cover_url:"https://images.unsplash.com/photo-1594149929911-78975a43d4f5?auto=format&fit=crop&w=900&q=85" },
  { id:"demo-3", name:"보리", breed:"골든리트리버", born_on:"2015-04-18", passed_on:"2025-02-11", story:"누구에게나 다정했던 우리의 영원한 햇살", cover_url:"https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=85" },
  { id:"demo-4", name:"구름", breed:"포메라니안", born_on:"2013-06-08", passed_on:"2023-12-05", story:"구름처럼 포근했던 너를 오래도록 기억할게", cover_url:"https://images.unsplash.com/photo-1601979031925-424e53b6caaa?auto=format&fit=crop&w=900&q=85" },
];

const config = window.SUPABASE_CONFIG || {};
const configured = Boolean(config.url && config.anonKey && !config.url.includes("YOUR_") && !config.anonKey.includes("YOUR_"));
const sbClient = configured ? createClient(config.url, config.anonKey) : null;
let currentUser = null;
let publicPets = [];
let petLoadSequence = 0;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const toast = (message) => { const el = $("#toast"); el.textContent = message; el.classList.add("show"); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 3200); };
const year = (date) => date ? date.slice(0,4) : "";

function updateAuthUI(user) {
  const loginButton = $("#loginButton");
  const account = $("#userAccount");
  const avatar = $("#userAvatar");
  if (!user) {
    loginButton.hidden = false;
    account.hidden = true;
    return;
  }

  const metadata = user.user_metadata || {};
  const name = metadata.full_name || metadata.name || user.email?.split("@")[0] || "회원";
  loginButton.hidden = true;
  account.hidden = false;
  $("#userName").textContent = name;
  $("#userEmail").textContent = user.email || "";
  if (metadata.avatar_url || metadata.picture) {
    avatar.src = metadata.avatar_url || metadata.picture;
    avatar.alt = `${name} 프로필 사진`;
    avatar.hidden = false;
    avatar.onerror = () => { avatar.hidden = true; };
  } else {
    avatar.hidden = true;
  }
}

function showOAuthError() {
  const params = new URLSearchParams(location.hash.slice(1));
  const message = params.get("error_description");
  if (!message) return;
  toast(`로그인 오류: ${message}`);
  history.replaceState(null, "", location.pathname + location.search);
}

async function initializeAuth() {
  sbClient.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    updateAuthUI(currentUser);
    loadVisiblePets();
  });

  const hash = new URLSearchParams(location.hash.slice(1));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");

  if (accessToken && refreshToken) {
    const { data, error } = await sbClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      toast(`로그인 세션 오류: ${error.message}`);
      updateAuthUI(null);
      return;
    }
    currentUser = data.session?.user || null;
    updateAuthUI(currentUser);
    loadVisiblePets();
    history.replaceState(null, "", location.pathname + location.search);
    return;
  }

  const { data, error } = await sbClient.auth.getSession();
  if (error) toast(`로그인 확인 오류: ${error.message}`);
  currentUser = data.session?.user || null;
  updateAuthUI(currentUser);
  loadVisiblePets();
}

function renderPets(items) {
  const grid = $("#memorialGrid");
  $("#resultCount").textContent = `${items.length}명의 친구`;
  if (!items.length) { grid.innerHTML = '<div class="empty">✦<h3>아직 만난 친구가 없어요</h3><p>다른 이름이나 견종으로 검색해 보세요.</p></div>'; return; }
  grid.innerHTML = items.map((pet) => {
    const isMine = Boolean(currentUser && pet.owner_id === currentUser.id);
    const visibility = isMine ? `내 추모관 · ${pet.is_public ? "공개" : "비공개"}` : "공개";
    return `<article class="pet-card"><div class="pet-photo" style="background-image:url('${escapeHtml(pet.cover_url || "https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=900&q=80")}')"><span>${visibility}</span></div><div class="pet-info"><div><h3>${escapeHtml(pet.name)}</h3><small>${year(pet.born_on)} — ${year(pet.passed_on)}</small></div><p>${escapeHtml(pet.story || "소중한 기억이 별처럼 머물고 있어요.")}</p><footer><span>#${escapeHtml(pet.breed || "반려견")}</span><button data-star="${pet.id}">${isMine ? "추모관 관리 →" : "✦ 별 남기기"}</button></footer></div></article>`;
  }).join("");
}

function escapeHtml(value="") { const el = document.createElement("div"); el.textContent = value; return el.innerHTML.replaceAll("'", "&#39;"); }

async function loadVisiblePets() {
  const loadId = ++petLoadSequence;
  if (!sbClient) { publicPets = demoPets; renderPets(publicPets); return; }
  let query = sbClient.from("pets").select("id,owner_id,name,breed,born_on,passed_on,story,cover_path,is_public");
  query = currentUser
    ? query.or(`is_public.eq.true,owner_id.eq.${currentUser.id}`)
    : query.eq("is_public", true);
  const { data, error } = await query.order("created_at", { ascending:false }).limit(40);
  if (loadId !== petLoadSequence) return;
  if (error) { console.error(error); publicPets = demoPets; toast("Supabase 연결을 확인해 주세요. 예시 추모관을 보여드려요."); } else {
    publicPets = await Promise.all(data.map(async pet => {
      if (!pet.cover_path) return pet;
      const { data: signed } = await sbClient.storage.from("pet-media").createSignedUrl(pet.cover_path, 3600);
      return { ...pet, cover_url:signed?.signedUrl || null };
    }));
  }
  renderPets(publicPets);
}

async function signInWithGoogle() {
  if (!sbClient) { toast("supabase-config.js에 프로젝트 정보를 입력해 주세요."); return; }
  const { error } = await sbClient.auth.signInWithOAuth({ provider:"google", options:{ redirectTo: config.redirectUrl || location.href } });
  if (error) toast(error.message);
}

async function openCreateDialog() {
  if (!sbClient) { $("#petDialog").showModal(); toast("현재는 화면 미리보기 모드입니다."); return; }
  if (!currentUser) { $("#authDialog").showModal(); return; }
  toast("추모관을 만들 수 있는지 확인하고 있어요.");
  const [{ count, error: countError }, { data: profile, error: profileError }] = await Promise.all([
    sbClient.from("pets").select("id", { count:"exact", head:true }).eq("owner_id", currentUser.id),
    sbClient.from("profiles").select("plan").eq("id", currentUser.id).maybeSingle(),
  ]);
  if (countError) { toast(`추모관 확인 오류: ${countError.message}`); return; }
  if (profileError) console.warn("프로필 요금제 확인 오류", profileError);
  if ((count || 0) >= 1 && (profile?.plan || "free") === "free") { $("#upgradeDialog").showModal(); return; }
  $("#petDialog").showModal();
}

async function createPet(event) {
  event.preventDefault();
  if (!sbClient || !currentUser) { toast("Supabase 연결 후 실제 저장이 시작됩니다."); return; }
  const form = event.currentTarget; const formData = new FormData(form); const files = formData.getAll("media").filter(file => file.size);
  const progress = $("#uploadProgress"); progress.hidden = false;
  const petId = crypto.randomUUID();
  const pet = { id:petId, owner_id:currentUser.id, name:formData.get("name"), breed:formData.get("breed") || null, born_on:formData.get("born_on") || null, passed_on:formData.get("passed_on") || null, story:formData.get("story") || null, is_public:formData.get("is_public") === "on" };
  const { error: petError } = await sbClient.from("pets").insert(pet);
  if (petError) { progress.hidden = true; toast(petError.message); return; }
  let coverUrl = null;
  for (let index=0; index<files.length; index++) {
    const file = files[index]; const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_"); const path = `${currentUser.id}/${petId}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await sbClient.storage.from("pet-media").upload(path, file, { contentType:file.type, upsert:false });
    if (error) { toast(`${file.name} 업로드에 실패했어요.`); continue; }
    if (!coverUrl && file.type.startsWith("image/")) coverUrl = path;
    await sbClient.from("pet_media").insert({ pet_id:petId, owner_id:currentUser.id, storage_path:path, media_type:file.type.startsWith("video/") ? "video" : "image", file_name:file.name, file_size:file.size, sort_order:index });
  }
  if (coverUrl) await sbClient.from("pets").update({ cover_path:coverUrl }).eq("id", petId);
  progress.hidden = true; form.reset(); $("#petDialog").close(); toast("소중한 추모관이 만들어졌어요."); loadVisiblePets();
}

$("#searchInput").addEventListener("input", (event) => { const q = event.target.value.trim().toLowerCase(); renderPets(publicPets.filter(p => [p.name,p.breed].some(v => (v || "").toLowerCase().includes(q)))); });
$("#googleLogin").addEventListener("click", signInWithGoogle);
$("#petForm").addEventListener("submit", createPet);
$("#upgradeButton").addEventListener("click", () => toast("결제 기능은 다음 단계에서 연결할 수 있어요."));
$("#logoutButton").addEventListener("click", async () => {
  if (!sbClient) return;
  const { error } = await sbClient.auth.signOut();
  if (error) toast(`로그아웃 오류: ${error.message}`);
  else toast("안전하게 로그아웃했어요.");
});
$$('[data-action="login"]').forEach(button => button.addEventListener("click", () => $("#authDialog").showModal()));
$$('[data-action="create"]').forEach(button => button.addEventListener("click", openCreateDialog));
$$('[data-action="upgrade"]').forEach(button => button.addEventListener("click", () => $("#upgradeDialog").showModal()));
$$('[data-close]').forEach(button => button.addEventListener("click", () => button.closest("dialog").close()));
$$('dialog').forEach(dialog => dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); }));

if (sbClient) {
  initializeAuth();
} else {
  updateAuthUI(null);
  loadVisiblePets();
}
showOAuthError();
})();
