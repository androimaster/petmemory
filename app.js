const demoPets = [
  { id:"demo-1", name:"몽이", breed:"말티즈", born_on:"2012-03-12", passed_on:"2025-01-07", story:"작은 발로 우리 집에 가장 큰 사랑을 남겨준 몽이", cover_url:"https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=900&q=85" },
  { id:"demo-2", name:"초코", breed:"푸들", born_on:"2010-08-02", passed_on:"2024-10-22", story:"산책이라는 말만 들어도 온몸으로 웃어주던 아이", cover_url:"https://images.unsplash.com/photo-1594149929911-78975a43d4f5?auto=format&fit=crop&w=900&q=85" },
  { id:"demo-3", name:"보리", breed:"골든리트리버", born_on:"2015-04-18", passed_on:"2025-02-11", story:"누구에게나 다정했던 우리의 영원한 햇살", cover_url:"https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=85" },
  { id:"demo-4", name:"구름", breed:"포메라니안", born_on:"2013-06-08", passed_on:"2023-12-05", story:"구름처럼 포근했던 너를 오래도록 기억할게", cover_url:"https://images.unsplash.com/photo-1601979031925-424e53b6caaa?auto=format&fit=crop&w=900&q=85" },
];

const config = window.SUPABASE_CONFIG || {};
const configured = Boolean(config.url && config.anonKey && !config.url.includes("YOUR_") && !config.anonKey.includes("YOUR_"));
const sbClient = configured ? window.supabase.createClient(config.url, config.anonKey) : null;
let currentUser = null;
let publicPets = [];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const toast = (message) => { const el = $("#toast"); el.textContent = message; el.classList.add("show"); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 3200); };
const year = (date) => date ? date.slice(0,4) : "";

function renderPets(items) {
  const grid = $("#memorialGrid");
  $("#resultCount").textContent = `${items.length}명의 친구`;
  if (!items.length) { grid.innerHTML = '<div class="empty">✦<h3>아직 만난 친구가 없어요</h3><p>다른 이름이나 견종으로 검색해 보세요.</p></div>'; return; }
  grid.innerHTML = items.map((pet) => `<article class="pet-card"><div class="pet-photo" style="background-image:url('${escapeHtml(pet.cover_url || "https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=900&q=80")}')"><span>공개</span></div><div class="pet-info"><div><h3>${escapeHtml(pet.name)}</h3><small>${year(pet.born_on)} — ${year(pet.passed_on)}</small></div><p>${escapeHtml(pet.story || "소중한 기억이 별처럼 머물고 있어요.")}</p><footer><span>#${escapeHtml(pet.breed || "반려견")}</span><button data-star="${pet.id}">✦ 별 남기기</button></footer></div></article>`).join("");
}

function escapeHtml(value="") { const el = document.createElement("div"); el.textContent = value; return el.innerHTML.replaceAll("'", "&#39;"); }

async function loadPublicPets() {
  if (!sbClient) { publicPets = demoPets; renderPets(publicPets); return; }
  const { data, error } = await sbClient.from("pets").select("id,name,breed,born_on,passed_on,story,cover_path").eq("is_public", true).order("created_at", { ascending:false }).limit(40);
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
  const { count } = await sbClient.from("pets").select("id", { count:"exact", head:true }).eq("owner_id", currentUser.id);
  const { data: profile } = await sbClient.from("profiles").select("plan").eq("id", currentUser.id).maybeSingle();
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
  progress.hidden = true; form.reset(); $("#petDialog").close(); toast("소중한 추모관이 만들어졌어요."); loadPublicPets();
}

$("#searchInput").addEventListener("input", (event) => { const q = event.target.value.trim().toLowerCase(); renderPets(publicPets.filter(p => [p.name,p.breed].some(v => (v || "").toLowerCase().includes(q)))); });
$("#googleLogin").addEventListener("click", signInWithGoogle);
$("#petForm").addEventListener("submit", createPet);
$("#upgradeButton").addEventListener("click", () => toast("결제 기능은 다음 단계에서 연결할 수 있어요."));
$$('[data-action="login"]').forEach(button => button.addEventListener("click", () => $("#authDialog").showModal()));
$$('[data-action="create"]').forEach(button => button.addEventListener("click", openCreateDialog));
$$('[data-action="upgrade"]').forEach(button => button.addEventListener("click", () => $("#upgradeDialog").showModal()));
$$('[data-close]').forEach(button => button.addEventListener("click", () => button.closest("dialog").close()));
$$('dialog').forEach(dialog => dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); }));

if (sbClient) {
  sbClient.auth.getSession().then(({ data }) => { currentUser = data.session?.user || null; });
  sbClient.auth.onAuthStateChange((_event, session) => { currentUser = session?.user || null; });
}
loadPublicPets();
