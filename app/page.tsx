"use client";

import { useMemo, useState } from "react";

const memorials = [
  { name: "몽이", years: "2012 — 2025", breed: "말티즈", message: "작은 발로 우리 집에 가장 큰 사랑을 남겨준 몽이", image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=900&q=85", tags: ["말티즈", "서울"], stars: 128 },
  { name: "초코", years: "2010 — 2024", breed: "푸들", message: "산책이라는 말만 들어도 온몸으로 웃어주던 아이", image: "https://images.unsplash.com/photo-1594149929911-78975a43d4f5?auto=format&fit=crop&w=900&q=85", tags: ["푸들", "부산"], stars: 96 },
  { name: "보리", years: "2015 — 2025", breed: "골든리트리버", message: "누구에게나 다정했던 우리의 영원한 햇살", image: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=85", tags: ["골든리트리버", "인천"], stars: 214 },
  { name: "구름", years: "2013 — 2023", breed: "포메라니안", message: "구름처럼 포근했던 너를 오래도록 기억할게", image: "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?auto=format&fit=crop&w=900&q=85", tags: ["포메라니안", "대전"], stars: 73 },
];

function PawMark() {
  return <span className="paw-mark" aria-hidden="true">●<i>●</i><b>●</b><em>●</em><strong>●</strong></span>;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<"login" | "create" | "upgrade" | null>(null);
  const [onlyPublic, setOnlyPublic] = useState(true);
  const [annual, setAnnual] = useState(true);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return memorials;
    return memorials.filter((pet) => [pet.name, pet.breed, ...pet.tags].some((value) => value.toLowerCase().includes(q)));
  }, [query]);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="별이 된 친구 홈"><PawMark /><span>별이 된 친구</span></a>
        <nav aria-label="주요 메뉴">
          <a href="#memorials">추모관 둘러보기</a>
          <a href="#story">우리의 이야기</a>
          <a href="#plans">이용 요금</a>
        </nav>
        <div className="header-actions">
          <button className="text-button" onClick={() => setDialog("login")}>로그인</button>
          <button className="primary small" onClick={() => setDialog("create")}>추모관 만들기</button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span>✦</span> 사랑은 사라지지 않으니까</div>
          <h1>함께한 모든 순간이<br /><em>별처럼 빛나도록</em></h1>
          <p>사진과 이야기로 소중한 반려견의 삶을 기록하고,<br className="desktop" /> 오래도록 간직할 수 있는 온라인 추모 공간입니다.</p>
          <div className="hero-actions">
            <button className="primary" onClick={() => setDialog("create")}>우리 아이 추모관 만들기 <span>→</span></button>
            <a className="secondary" href="#memorials">다른 친구 만나보기</a>
          </div>
          <div className="trust-row"><span className="avatars">🐶 🐕 🐩</span><span><b>2,480+</b>개의 소중한 이야기가<br />별이 되어 빛나고 있어요</span></div>
        </div>
        <div className="hero-visual" aria-label="햇살 아래 함께한 반려견의 행복한 순간">
          <div className="hero-photo" />
          <div className="memory-note"><span>“</span><p>우리에게 와줘서 고마워.<br />영원히 사랑해, 별이야.</p><small>2011. 04. 18 — 2025. 01. 07</small></div>
          <div className="floating-star">✦</div>
          <div className="orbit one">✦</div><div className="orbit two">✦</div>
        </div>
      </section>

      <section className="memory-strip" id="story">
        <div><span>01</span><p><b>사진을 모아</b> 흩어진 행복한 순간을 한곳에</p></div>
        <div><span>02</span><p><b>이야기를 남겨</b> 우리 아이만의 따뜻한 기록으로</p></div>
        <div><span>03</span><p><b>함께 기억해</b> 가족과 친구가 추억을 나누도록</p></div>
      </section>

      <section className="memorial-section" id="memorials">
        <div className="section-heading">
          <div><span className="kicker">별빛 추모관</span><h2>우리 곁에 머무는<br />소중한 친구들</h2></div>
          <p>이름이나 견종으로 공개된 추모관을 찾아보세요.<br />따뜻한 별 하나를 남겨 마음을 전할 수 있어요.</p>
        </div>
        <div className="search-panel">
          <label><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="이름, 견종으로 검색해 보세요" /></label>
          <button className={onlyPublic ? "filter active" : "filter"} onClick={() => setOnlyPublic(!onlyPublic)}><span>✓</span> 공개 추모관만</button>
          <span className="result-count">{results.length}명의 친구</span>
        </div>
        <div className="card-grid">
          {results.map((pet) => <article className="pet-card" key={pet.name}>
            <div className="pet-photo" style={{ backgroundImage: `url(${pet.image})` }}><span>공개</span><button aria-label={`${pet.name}에게 별 남기기`}>✦ {pet.stars}</button></div>
            <div className="pet-info"><div><h3>{pet.name}</h3><span>{pet.years}</span></div><p>{pet.message}</p><div className="tags">{pet.tags.map(tag => <span key={tag}>#{tag}</span>)}<a href="#top">기억 만나기 →</a></div></div>
          </article>)}
        </div>
        {results.length === 0 && <div className="empty"><span>✦</span><h3>아직 만난 친구가 없어요</h3><p>다른 이름이나 견종으로 검색해 보세요.</p></div>}
      </section>

      <section className="private-section">
        <div className="private-card">
          <div className="lock-art"><div>✦</div><span>♡</span></div>
          <div><span className="kicker">내가 정하는 공개 범위</span><h2>소중한 기억은<br />원하는 만큼만 나누세요</h2><p>반려견마다 공개 또는 비공개를 선택할 수 있어요. 비공개 추모관은 나와 초대한 가족만 볼 수 있습니다.</p><ul><li>✓ 반려견별 공개 설정</li><li>✓ 가족 초대 및 공동 기록</li><li>✓ 검색 노출 여부 선택</li></ul></div>
        </div>
      </section>

      <section className="pricing" id="plans">
        <div className="pricing-head"><span className="kicker">이용 요금</span><h2>첫 번째 별은, 언제나 무료예요</h2><p>부담 없이 시작하고 더 많은 친구를 기억하고 싶을 때 업그레이드하세요.</p><div className="billing"><button className={!annual ? "on" : ""} onClick={() => setAnnual(false)}>월간</button><button className={annual ? "on" : ""} onClick={() => setAnnual(true)}>연간 <span>2개월 할인</span></button></div></div>
        <div className="plan-grid">
          <article className="plan"><div><span className="plan-icon">☆</span><h3>별빛 무료</h3><p>한 아이와의 추억을 오래 간직해요</p></div><div className="price"><b>0원</b><span>영원히</span></div><button className="secondary wide" onClick={() => setDialog("create")}>무료로 시작하기</button><ul><li>✓ 추모관 1개</li><li>✓ 사진 최대 30장</li><li>✓ 공개·비공개 설정</li><li>✓ 추억 이야기 기록</li><li>✓ 별과 추모 메시지 받기</li></ul></article>
          <article className="plan featured"><span className="popular">가장 많이 선택해요</span><div><span className="plan-icon">✦</span><h3>별빛 플러스</h3><p>모든 아이의 이야기를 한곳에 모아요</p></div><div className="price"><b>{annual ? "39,000원" : "3,900원"}</b><span>{annual ? "연간 · 월 3,250원" : "매월"}</span></div><button className="primary wide" onClick={() => setDialog("upgrade")}>플러스로 업그레이드</button><ul><li><b>✓ 추모관 최대 10개</b></li><li>✓ 반려견마다 사진 최대 300장</li><li>✓ 가족 최대 5명 초대</li><li>✓ 고화질 원본 보관</li><li>✓ 광고 없이 온전히 추모</li></ul></article>
        </div>
        <p className="pricing-note">언제든 해지할 수 있으며, 해지 후에도 첫 번째 추모관은 계속 무료로 보관됩니다.</p>
      </section>

      <section className="closing"><PawMark /><h2>사랑했던 만큼,<br /><em>오래 기억할 수 있도록</em></h2><p>우리 아이와의 가장 빛나던 순간을 오늘 기록해 보세요.</p><button className="primary" onClick={() => setDialog("create")}>무료 추모관 만들기 <span>→</span></button></section>

      <footer><a className="brand" href="#top"><PawMark /><span>별이 된 친구</span></a><p>반려동물과 함께한 사랑을 오래도록 기억하는 공간</p><div><a href="#memorials">추모관</a><a href="#plans">이용 요금</a><a href="#top">개인정보처리방침</a><a href="#top">문의하기</a></div><small>© 2026 별이 된 친구. All rights reserved.</small></footer>

      {dialog && <div className="modal-backdrop" role="presentation" onMouseDown={() => setDialog(null)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(e) => e.stopPropagation()}><button className="close" onClick={() => setDialog(null)} aria-label="닫기">×</button><PawMark />
        {dialog === "upgrade" ? <><span className="kicker">별빛 플러스</span><h2 id="modal-title">모든 아이의 기억을<br />한곳에 간직하세요</h2><p>추모관 최대 10개와 사진 300장, 가족 초대 기능을 이용할 수 있어요.</p><button className="primary wide">{annual ? "연 39,000원으로 시작" : "월 3,900원으로 시작"}</button><small>결제 기능은 정식 출시 시 연결됩니다.</small></> : <><span className="kicker">{dialog === "create" ? "무료로 시작하기" : "다시 만나 반가워요"}</span><h2 id="modal-title">구글 계정으로<br />간편하게 시작하세요</h2><p>첫 번째 반려견 추모관은 무료이며, 반려견마다 공개 범위를 선택할 수 있어요.</p><button className="google-button"><b>G</b> Google 계정으로 계속</button><small>로그인하면 이용약관과 개인정보처리방침에 동의하게 됩니다.</small></>}
      </div></div>}
    </main>
  );
}
