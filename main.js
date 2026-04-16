/* ==============================================
   제물포구청장 예비후보 이종호 - 웹자보
   더불어민주당 블루 테마 · 모바일 퍼스트
   ============================================== */

document.addEventListener('DOMContentLoaded', async () => {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);

  injectAdminStyles();
  await fetchSiteConfig();
  applySiteConfig();
  renderVideos();
  renderPopups();
  initNavigation();
  initScrollAnimations();
  initPlexus();
  initCountUp();
  initSupportForm();
  initSmoothScroll();
  initPartyBadge();
  initGallery();
  initCardNews();
  initAdmin();
});

// ── Gallery Config ──
// 구글 드라이브 폴더 ID (내부 앱스 스크립트와 통신 시 사용)
const DRIVE_FOLDER_ID = '1oumiKa0CepOu2SetVxgrtrtd9eahkQXQ';

// 구글 드라이브 이미지 URL 헬퍼
function driveThumbUrl(fileId) {
  return `https://lh3.googleusercontent.com/d/${fileId}=w600`;
}
function driveFullUrl(fileId) {
  return `https://lh3.googleusercontent.com/d/${fileId}=w1600`;
}

// 갤러리 데이터 (동적으로 채워짐)
let GALLERY_ITEMS = [];

// ── Gallery ──
async function initGallery() {
  const wrapper = document.getElementById('gallery-wrapper');
  if (!wrapper) return;

  // 로딩 표시
  wrapper.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:200px;width:100%;color:#999;">사진을 가져오는 중....</div>';

  let items = [];

  try {
    // 1. CORS 우회 프록시를 사용하여 드라이브 폴더의 HTML 데이터 가져오기
    const timestamp = new Date().getTime();
    const embedUrl = `https://drive.google.com/embeddedfolderview?id=${DRIVE_FOLDER_ID}&t=${timestamp}`;
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(embedUrl)}`;

    const resp = await fetch(proxyUrl);
    if (!resp.ok) throw new Error('Proxy error');
    const html = await resp.text();

    // 2. ID 추출 (정규식 사용)
    const idRegex = /\/file\/d\/([a-zA-Z0-9_-]+)\//g;
    let match;
    const ids = new Set(); // 중복 방지

    while ((match = idRegex.exec(html)) !== null) {
      ids.add(match[1]);
    }

    if (ids.size > 0) {
      items = Array.from(ids).map(fileId => ({
        id: fileId,
        thumb: driveThumbUrl(fileId),
        full: driveFullUrl(fileId)
      }));
    }
  } catch (e) {
    console.warn('동적 연동 실패, 예비 목록 사용:', e);
  }

  // 3. 만약 연동에 실패했거나 폴더가 비어있으면 예비 목록(Fallback) 사용
  if (items.length === 0) {
    items = [
      { id: '1anR50xuFM6ze7VU-Zh6rbQ_R28spWmsB' },
      { id: '1aXnbkFSZflKcw-oFZqnmhfPEQ1Mkh9vu' },
      { id: '12XYOAs0L3T9s_X49OgcX3TimEpC_sSmw' },
      { id: '1Q107G_rKLeYA4jUGohWTSF8o0V5O1vN1' },
      { id: '1Kea8QerciCDW2mp6dEluJkMkUCF9XM2-' },
      { id: '18HhRuvMcMRE2-I2EvCVsbZXx4d_tR4kl' }
    ].map(item => ({
      ...item,
      thumb: driveThumbUrl(item.id),
      full: driveFullUrl(item.id)
    }));
  }

  GALLERY_ITEMS = items; // 전역 변수 업데이트

  // 4. 카드 렌더링
  wrapper.innerHTML = GALLERY_ITEMS.map((item, index) => `
    <div class="gallery-card" data-index="${index}">
      <img src="${item.thumb}" alt="활동사진" class="gallery-thumb-img" loading="lazy">
    </div>
  `).join('');


  // 사진 클릭 시 확대 보기, 블러 및 화살표 제어
  const blurLeft = document.getElementById('gallery-blur-left');
  const blurRight = document.getElementById('gallery-blur-right');
  const prevBtn = document.getElementById('gallery-prev-btn');
  const nextBtn = document.getElementById('gallery-next-btn');
  const galleryBox = wrapper.closest('.gallery-box');
  // 화살표 상호작용 지연 처리용 (변수 중복 선언 수정)
  let interactionTimer = null;

  function setInteracting() {
    if (!galleryBox) return;
    galleryBox.classList.add('interacting');
    clearTimeout(interactionTimer);
    interactionTimer = setTimeout(() => {
      galleryBox.classList.remove('interacting');
    }, 2000);
  }

  // 화살표 클릭 시 스크롤
  if (prevBtn) prevBtn.addEventListener('click', () => { wrapper.scrollBy({ left: -240, behavior: 'smooth' }); setInteracting(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { wrapper.scrollBy({ left: 240, behavior: 'smooth' }); setInteracting(); });

  // 마우스 호버 시 화살표 하이드/쇼
  if (galleryBox) {
    galleryBox.addEventListener('mouseenter', () => { galleryBox.classList.add('interacting'); clearTimeout(interactionTimer); });
    galleryBox.addEventListener('mouseleave', () => setInteracting());
  }

  // ── IntersectionObserver로 첫/끝 카드 감지 (블러 제어용) ──
  const galleryCards = wrapper.querySelectorAll('.gallery-card');
  if (galleryCards.length > 0) {
    const firstCard = galleryCards[0];
    const lastCard = galleryCards[galleryCards.length - 1];

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const isFirst = entry.target === firstCard;
        const isLast = entry.target === lastCard;

        if (isFirst) {
          // 첫 카드가 화면에 보이면 왼쪽 블러/화살표 숨김
          const inView = entry.isIntersecting;
          if (blurLeft) blurLeft.classList.toggle('active', !inView);
          if (prevBtn) prevBtn.classList.toggle('active', !inView);
        }
        if (isLast) {
          // 마지막 카드가 화면에 보이면 오른쪽 블러/화살표 숨김
          const inView = entry.isIntersecting;
          if (blurRight) blurRight.classList.toggle('active', !inView);
          if (nextBtn) nextBtn.classList.toggle('active', !inView);
        }
      });
    }, {
      root: wrapper,
      threshold: 0.5 // 절반 이상 보이면 감지
    });

    observer.observe(firstCard);
    observer.observe(lastCard);
  }

  // 스크롤 시 화살표 노출 트리거
  wrapper.addEventListener('scroll', setInteracting, { passive: true });

  // 개별 카드 클릭 -> 확대 모달
  wrapper.querySelectorAll('.gallery-card').forEach(item => {
    item.addEventListener('click', () => {
      const index = parseInt(item.dataset.index);
      openGalleryModal(index);
    });
  });

  // 전체보기 버튼 클릭 -> 그리드 모달
  const btnAll = document.getElementById('btn-gallery-all');
  if (btnAll) {
    btnAll.addEventListener('click', openGalleryGrid);
  }
}

// ── 갤러리 그리드 (전체보기 타일형) ──
function openGalleryGrid() {
  const overlay = document.createElement('div');
  overlay.className = 'gm-grid-overlay';
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  overlay.innerHTML = `
    <div class="gm-grid-header">
      <h3>활동 사진 전체보기</h3>
      <button class="gm-grid-close" aria-label="닫기">✕</button>
    </div>
    <div class="gm-grid-content">
      ${GALLERY_ITEMS.map((item, index) => `
        <div class="gm-grid-tile" data-index="${index}">
          <img src="${item.thumb}" alt="활동사진" loading="lazy">
        </div>
      `).join('')}
    </div>
  `;

  // 닫기
  overlay.querySelector('.gm-grid-close').addEventListener('click', () => {
    overlay.remove();
    document.body.style.overflow = '';
  });

  // 타일 클릭 -> 확대 모달
  overlay.querySelectorAll('.gm-grid-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      const index = parseInt(tile.dataset.index);
      // 그리드 덮개는 유지한 채로 확대 모달만 띄우거나, 닫고 띄우거나 선택 가능.
      // 여기서는 닫고 띄우는 것이 깔끔함.
      overlay.remove();
      document.body.style.overflow = '';
      openGalleryModal(index);
    });
  });
}

// ── 갤러리 모달 (전체화면 + 핀치 줌인/줌아웃) ──
function openGalleryModal(startIndex) {
  const existing = document.getElementById('gallery-modal');
  if (existing) existing.remove();

  let currentIndex = startIndex;
  let scale = 1, posX = 0, posY = 0;
  let isDragging = false, startDragX = 0, startDragY = 0, startPosX = 0, startPosY = 0;
  let lastTouchDist = 0;
  let isPinching = false;

  // 모달 생성
  const modal = document.createElement('div');
  modal.id = 'gallery-modal';
  modal.className = 'gm-overlay';
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  function resetZoom() { scale = 1; posX = 0; posY = 0; }

  function render() {
    const item = GALLERY_ITEMS[currentIndex];
    const total = GALLERY_ITEMS.length;
    modal.innerHTML = `
      <button class="gm-close" aria-label="닫기">✕</button>
      <div class="gm-counter">${currentIndex + 1} / ${total}</div>
      ${total > 1 ? '<button class="gm-nav gm-prev" aria-label="이전">‹</button>' : ''}
      ${total > 1 ? '<button class="gm-nav gm-next" aria-label="다음">›</button>' : ''}
      <div class="gm-img-wrap">
        <img src="${item.full}" alt="활동사진" class="gm-img" draggable="false"
             style="transform:scale(${scale}) translate(${posX}px,${posY}px)">
      </div>
      <div class="gm-hint">핀치 또는 더블탭으로 확대 · 스와이프로 넘기기</div>
    `;
    bindModalEvents();
  }

  function bindModalEvents() {
    const img = modal.querySelector('.gm-img');
    const wrap = modal.querySelector('.gm-img-wrap');
    const closeBtn = modal.querySelector('.gm-close');
    const prevBtn = modal.querySelector('.gm-prev');
    const nextBtn = modal.querySelector('.gm-next');

    closeBtn.addEventListener('click', closeModal);
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(-1); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(1); });

    // 배경 클릭으로 닫기 (줌 상태가 아닐 때만)
    modal.addEventListener('click', (e) => {
      if (e.target === modal && scale <= 1) closeModal();
    });

    // 더블탭 줌
    let lastTap = 0;
    wrap.addEventListener('touchend', (e) => {
      if (isPinching) return; // 핀치 조작 중에는 더블탭 무시
      const now = Date.now();
      if (now - lastTap < 300) {
        e.preventDefault();
        if (scale > 1) { resetZoom(); } else { scale = 2.5; }
        applyTransform(img);
      }
      lastTap = now;
    });

    // 더블클릭 줌 (데스크탑)
    wrap.addEventListener('dblclick', (e) => {
      e.preventDefault();
      if (scale > 1) { resetZoom(); } else { scale = 2.5; }
      applyTransform(img);
    });

    // 마우스 휠 줌
    wrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.3 : 0.3;
      scale = Math.min(5, Math.max(1, scale + delta));
      if (scale <= 1) { resetZoom(); }
      applyTransform(img);
    }, { passive: false });

    // 핀치 줌 (터치)
    let lastTouchMidX = 0;
    let lastTouchMidY = 0;

    wrap.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        isPinching = true;
        lastTouchDist = getTouchDist(e.touches);
        lastTouchMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        lastTouchMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      } else if (e.touches.length === 1) {
        // 1인치 터치 시 드래그 상태 초기화 (줌 상태일 때만)
        if (scale > 1) {
          isDragging = true;
          startDragX = e.touches[0].clientX;
          startDragY = e.touches[0].clientY;
          startPosX = posX; startPosY = posY;
        }
      }
    }, { passive: true });

    wrap.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = getTouchDist(e.touches);
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        
        const delta = (dist - lastTouchDist) * 0.008;
        const newScale = Math.min(5, Math.max(1, scale + delta));
        
        if (newScale > 1) {
          // 중심점 고정 수식: posX_new = posX_old + (midX - CenterX) * (1/scale_new - 1/scale_old)
          // 여기서는 단순화하여 델타값을 이용한 보정 적용
          const scaleRatio = newScale / scale;
          // 실제 화면 중앙(모달 중앙) 좌표 계산 (대략적)
          const rect = wrap.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          // 줌 중심점 보정
          posX += (midX - centerX) * (1/scale - 1/newScale);
          posY += (midY - centerY) * (1/scale - 1/newScale);
          
          scale = newScale;
          applyTransform(img);
        } else {
          resetZoom();
          applyTransform(img);
        }
        
        lastTouchDist = dist;
        lastTouchMidX = midX;
        lastTouchMidY = midY;
      } else if (e.touches.length === 1 && isDragging && scale > 1) {
        e.preventDefault();
        posX = startPosX + (e.touches[0].clientX - startDragX) / scale;
        posY = startPosY + (e.touches[0].clientY - startDragY) / scale;
        applyTransform(img);
      }
    }, { passive: false });

    // 터치 종료 시 상태 정리 (전환 시 끊김 방지)
    wrap.addEventListener('touchend', (e) => {
      if (e.touches.length === 1 && scale > 1) {
        // 2인치에서 1인치로 전환될 때 현재 손가락 기준으로 드래그 시작점 재설정
        isDragging = true;
        startDragX = e.touches[0].clientX;
        startDragY = e.touches[0].clientY;
        startPosX = posX; startPosY = posY;
      } else if (e.touches.length === 0) {
        isDragging = false;
        // 핀치 종료 후 약간의 유예 시간을 두어 더블탭 오작동 방지
        setTimeout(() => { if (!isDragging) isPinching = false; }, 100);
      }
    }, { passive: true });

    // 마우스 드래그 (줌 상태에서 이동)
    wrap.addEventListener('mousedown', (e) => {
      if (scale > 1) {
        isDragging = true;
        startDragX = e.clientX; startDragY = e.clientY;
        startPosX = posX; startPosY = posY;
        wrap.style.cursor = 'grabbing';
      }
    });
    wrap.addEventListener('mousemove', (e) => {
      if (isDragging && scale > 1) {
        posX = startPosX + (e.clientX - startDragX) / scale;
        posY = startPosY + (e.clientY - startDragY) / scale;
        applyTransform(img);
      }
    });
    wrap.addEventListener('mouseup', () => { isDragging = false; wrap.style.cursor = ''; });
    wrap.addEventListener('mouseleave', () => { isDragging = false; wrap.style.cursor = ''; });

    // 스와이프로 넘기기 (줌 안 된 상태에서만 & 멀티터치 방지)
    let swStartX = null;

    wrap.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        isPinching = true; // 핀치 시작 감지
        swStartX = null;
      } else if (e.touches.length === 1 && scale <= 1) {
        isPinching = false;
        swStartX = e.touches[0].clientX;
      }
    }, { passive: true });

    wrap.addEventListener('touchmove', (e) => {
      if (e.touches.length > 1) isPinching = true;
    }, { passive: true });

    wrap.addEventListener('touchend', (e) => {
      if (isPinching || scale > 1 || swStartX === null) {
        swStartX = null;
        isPinching = false;
        return;
      }
      const dx = e.changedTouches[0].clientX - swStartX;
      if (Math.abs(dx) > 70) { // 임계값 소폭 상향 (기존 60)
        goTo(dx < 0 ? 1 : -1);
      }
      swStartX = null;
    }, { passive: true });
  }

  function applyTransform(img) {
    if (!img) return;
    img.style.transform = `scale(${scale}) translate(${posX}px,${posY}px)`;
  }

  function getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function goTo(dir) {
    currentIndex = (currentIndex + dir + GALLERY_ITEMS.length) % GALLERY_ITEMS.length;
    resetZoom();
    render();
  }

  function closeModal() {
    modal.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', keyHandler);
  }

  function keyHandler(e) {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') goTo(-1);
    if (e.key === 'ArrowRight') goTo(1);
  }
  document.addEventListener('keydown', keyHandler);

  render();
}

// ── Navigation (Swipe 전용) ──
function initNavigation() {
  const nav = document.getElementById('floating-nav');
  const mobileMenu = document.getElementById('mobile-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const mobileLinks = document.querySelectorAll('.mobile-link');
  const sections = document.querySelectorAll('.section, #hero');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    nav.classList.toggle('scrolled', scrollY > 60);

    // Active section highlight
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 100;
      if (scrollY >= top) {
        current = section.getAttribute('id') || '';
      }
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === current);
    });
  }, { passive: true });

  // ── Swipe Logic 고감도 개선 (오른쪽 끝 터치 영역 사용) ──
  let startX = 0;
  let isDraggingNav = false;

  const onNavStart = e => {
    isDraggingNav = true;
    startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
  };

  const onNavEnd = e => {
    if (!isDraggingNav) return;
    isDraggingNav = false;
    const endX = e.type.includes('mouse') ? e.clientX : e.changedTouches[0].clientX;
    const swipeDistance = startX - endX; // 양수: 왼쪽으로 밀기 (메뉴 닫기 등)
    const screenWidth = window.innerWidth;

    // 1. 밀기 (메뉴 열기)
    // 오른쪽으로 40px 이상 밀었을 때
    if (swipeDistance < -40) {
      if (!mobileMenu.classList.contains('active')) {
        mobileMenu.classList.add('active');
        document.body.classList.add('menu-open');
      }
    }

    // 2. 이미 메뉴가 열린 상태에서 아무 곳이나 왼쪽으로 40px 이상 밀면 닫기
    if (mobileMenu.classList.contains('active') && swipeDistance > 40) {
      mobileMenu.classList.remove('active');
      document.body.classList.remove('menu-open');
    }
  };

  document.addEventListener('touchstart', onNavStart, { passive: true });
  document.addEventListener('touchend', onNavEnd, { passive: true });
  
  // PC 환경 마우스 드래그 지원
  document.addEventListener('mousedown', onNavStart, { passive: true });
  document.addEventListener('mouseup', onNavEnd, { passive: true });

  // 햄버거 버튼 클릭으로도 열기 지원 (PC/모두 공통)
  const menuBtn = document.getElementById('menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.add('active');
      document.body.classList.add('menu-open');
    });
  }

  // 메뉴 링크 클릭 시 자동 닫기
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      document.body.classList.remove('menu-open');
    });
  });
}

// ── Scroll Animations ──
function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

// ── 캔버스 기반 '연결의 네트워크' (Plexus) 애니메이션 ──
function initPlexus() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let w, h, particles = [];
  const COUNT = 80; // 입자 개수 대폭 증가 (더 풍성하게)
  const DIST = 120; // 연결 거리 확대 (더 촘촘한 그물망)

  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() {
      this.init();
    }
    init() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 0.7; // 속도감 업
      this.vy = (Math.random() - 0.5) * 0.7; // 속도감 업
      this.r = Math.random() * 1.5 + 1;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > w) this.vx *= -1;
      if (this.y < 0 || this.y > h) this.vy *= -1;
    }
    draw() {
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'; // 점 투명도 업
      ctx.fill();
    }
  }

  for (let i = 0; i < COUNT; i++) particles.push(new Particle());

  function animate() {
    ctx.clearRect(0, 0, w, h);
    // 배경색 채우기
    ctx.fillStyle = '#001d3d'; ctx.fillRect(0, 0, w, h);

    particles.forEach((p, i) => {
      p.update(); p.draw();
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x, dy = p.y - p2.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < DIST) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.28 * (1 - d / DIST)})`; // 선 선명도 업
          ctx.lineWidth = 0.5;
          ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    });
    requestAnimationFrame(animate);
  }
  animate();
}

// ── Count Up ──
function initCountUp() {
  const counters = document.querySelectorAll('.stat-number[data-target]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        animateCount(el, 0, parseInt(el.dataset.target), 1800);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(c => observer.observe(c));
}

function animateCount(el, start, end, duration) {
  const t0 = performance.now();

  function tick(now) {
    const p = Math.min((now - t0) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(start + (end - start) * eased).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ── 구글 스프레드시트 연동 설정 ──
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbwC6qNNfcKMRRBfYnnNYDZdRRn6zl1seJK8wm3tn-eEtOQCEdv4XD2sCO6gyt01ndR-Mw/exec";

function initSupportForm() {
  const form = document.getElementById('support-form');
  const result = document.getElementById('support-result');
  if (!form) {
    console.warn('Support form not found');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Support form submitted'); // 전송 시작 확인용

    const btn = form.querySelector('.btn-submit');
    const nameEl = document.getElementById('support-name');
    const phoneEl = document.getElementById('support-phone');
    const messageEl = document.getElementById('support-message');

    if (!nameEl || !phoneEl || !messageEl) {
      console.error('필요한 입력란을 찾을 수 없습니다.');
      return;
    }

    const name = nameEl.value.trim() || '익명';
    let phoneRaw = phoneEl.value.trim();
    const msg = messageEl.value.trim();

    if (!msg || !phoneRaw) {
      alert('연락처와 메시지를 모두 입력해 주세요.');
      return;
    }

    // 1. 전화번호 포맷팅 (01012345678 -> 010-1234-5678)
    const digits = phoneRaw.replace(/\D/g, "");
    let phoneFormatted = digits;
    if (digits.length === 11) {
      phoneFormatted = digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
    } else if (digits.length === 10) {
      phoneFormatted = digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    }

    // 2. UI 상태 변경 (로딩 중)
    btn.disabled = true;
    const originalBtnContent = btn.innerHTML;
    btn.innerHTML = '<span>🚀 전송 중...</span>';
    result.className = 'support-result';
    result.innerHTML = '응원메시지가 우리동네 현주씨에게 전달되고 있습니다...';

    try {
      // 3. 데이터 전송
      const data = { name, phone: phoneFormatted, message: msg };

      // 구글 서버와의 통신을 위해 JSON 데이터를 문자열로 전송합니다.
      await fetch(GOOGLE_SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(data)
      });

      // 4. 성공 처리
      console.log('전송 성공!');
      result.className = 'support-result success';
      result.innerHTML = `🎉 ${name}님의 응원이 전달되었습니다! 감사합니다!`;
      form.reset();
      createConfetti();
    } catch (err) {
      console.error('전송 과정 중 오류 발생:', err);
      result.className = 'support-result error';
      result.innerHTML = '죄송합니다. 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalBtnContent;
      setTimeout(() => {
        if (result.className.includes('success')) {
          result.innerHTML = '';
        }
      }, 6000);
    }
  });
}

// ── Confetti ──
function createConfetti() {
  const colors = ['#004EA2', '#2196F3', '#42A5F5', '#64B5F6', '#90CAF9', '#ffffff'];

  if (!document.getElementById('confetti-style')) {
    const s = document.createElement('style');
    s.id = 'confetti-style';
    s.textContent = `
      @keyframes confetti-fall {
        0% { transform:translateY(0) rotate(0deg) scale(1); opacity:1; }
        100% { transform:translateY(100vh) rotate(720deg) scale(0); opacity:0; }
      }
    `;
    document.head.appendChild(s);
  }

  for (let i = 0; i < 40; i++) {
    const c = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];

    c.style.cssText = `
      position:fixed;
      width:${Math.random() * 8 + 4}px;
      height:${Math.random() * 8 + 4}px;
      background:${color};
      left:${Math.random() * 100}vw;
      top:-10px;
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      pointer-events:none;
      z-index:10000;
      animation:confetti-fall ${Math.random() * 2 + 1.5}s ease-out forwards;
      animation-delay:${Math.random() * 0.4}s;
    `;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3500);
  }
}

// ── Smooth Scroll ──
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const offset = 70;
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - offset,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ── Party Badge ──
function initPartyBadge() {
  const badge = document.getElementById('party-badge');
  if (!badge) return;

  // Show/hide based on scroll
  let hidden = true;
  badge.style.opacity = '0';
  badge.style.transform = 'scale(0.8) translateY(20px)';

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400 && hidden) {
      hidden = false;
      badge.style.transition = '0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      badge.style.opacity = '1';
      badge.style.transform = 'scale(1) translateY(0)';
    } else if (window.scrollY <= 400 && !hidden) {
      hidden = true;
      badge.style.transition = '0.3s ease';
      badge.style.opacity = '0';
      badge.style.transform = 'scale(0.8) translateY(20px)';
    }
  }, { passive: true });
}
// ── Video Modal ──
function openVideo(videoId) {
  const modal = document.getElementById('video-modal');
  const container = document.getElementById('player-container');
  const loader = document.getElementById('video-loader');
  if (!modal || !container || !loader) return;

  container.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
  container.classList.remove('loaded');

  modal.classList.add('active');
  loader.style.opacity = '1';
  loader.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    loader.style.opacity = '0';
    container.classList.add('loaded');
    document.body.classList.add('video-loaded');
    setTimeout(() => { loader.style.display = 'none'; }, 500);
  }, 1500);
}

function closeVideo() {
  const modal = document.getElementById('video-modal');
  const container = document.getElementById('player-container');
  const loader = document.getElementById('video-loader');
  if (!modal || !container || !loader) return;

  modal.classList.remove('active');
  document.body.classList.remove('video-loaded');
  container.innerHTML = '';
  container.classList.remove('loaded');
  loader.style.display = 'flex';
  loader.style.opacity = '1';
  document.body.style.overflow = '';
}

// ════════════════════════════════════════════
// 관리자 패널 (Admin Panel)
// ════════════════════════════════════════════

const ADMIN_PASSWORD = 'h2ju1011';

const DEFAULT_CONFIG = {
  videos: [
    { id: 'IWeB56h_X78', label: '필승!! 경선승리' },
    { id: 'uxfq0quNYIg', label: '하하하, 하현주가 딱!!' },
    { id: 'T0XgALKVqOk', label: '박찬대소 하현주' },
    { id: 'gaSU2sBJ4aI', label: '선거사무실 오픈' }
  ],
  heroSlogan: '남동을 지역위원회\n#영입인재_1호',
  careers: {
    current: ['더불어민주당 남동(을) 사회적경제위원장', '대한민국 주민자치연합회 사무총장', '민주평통 남동구 자문위원'],
    previous: ['서창2동 주민자치회장', '남동구 주민자치협의회 사무국장', '인천시 주민자치연합회 사무총장']
  },
  popups: [
    { imageUrl: '', linkUrl: '', isActive: false },
    { imageUrl: '', linkUrl: '', isActive: false },
    { imageUrl: '', linkUrl: '', isActive: false }
  ],
  cardNews: [
    { imageUrl: 'gallery-1.png', label: '카드뉴스 1' },
    { imageUrl: 'gallery-2.png', label: '카드뉴스 2' },
    { imageUrl: 'gallery-3.png', label: '카드뉴스 3' },
    { imageUrl: 'gallery-4.png', label: '카드뉴스 4' },
    { imageUrl: 'gallery-5.png', label: '카드뉴스 5' }
  ]
};

let CURRENT_CONFIG = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

async function fetchSiteConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    if (data && typeof data === 'object' && !data.error && Object.keys(data).length > 0) {
      CURRENT_CONFIG = {
        videos: data.videos || DEFAULT_CONFIG.videos,
        heroSlogan: data.heroSlogan !== undefined ? data.heroSlogan : DEFAULT_CONFIG.heroSlogan,
        careers: data.careers || DEFAULT_CONFIG.careers,
        popups: data.popups || DEFAULT_CONFIG.popups,
        cardNews: data.cardNews || DEFAULT_CONFIG.cardNews
      };
    }
  } catch (err) {
    console.warn('API 로드 실패, 기본값 사용:', err);
  }
}

async function saveSiteConfig(password, config) {
  const res = await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, config })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '저장 실패');
  CURRENT_CONFIG = config;
  return data;
}

function getSiteConfig() {
  return CURRENT_CONFIG;
}

function renderVideos() {
  const grid = document.getElementById('video-grid');
  if (!grid) return;
  const { videos } = getSiteConfig();
  grid.innerHTML = videos.map((v, i) => `
    <div class="video-item" onclick="openVideo('${v.id}')">
      <div class="video-thumb">
        <img src="https://img.youtube.com/vi/${v.id}/hqdefault.jpg" alt="영상 ${i + 1}" loading="lazy">
        <div class="play-btn"></div>
      </div>
      <span class="video-label">${v.label}</span>
    </div>
  `).join('');
}

function renderHeroSlogan() {
  const p = document.querySelector('.hero-quote p');
  if (p) p.innerHTML = getSiteConfig().heroSlogan.replace(/\n/g, '<br>');
}

function renderCareers() {
  const { careers } = getSiteConfig();
  const cols = document.querySelectorAll('.career-col');
  if (cols[0]) {
    const ul = cols[0].querySelector('.career-list');
    if (ul) ul.innerHTML = careers.current.map(t => `<li>${t}</li>`).join('');
  }
  if (cols[1]) {
    const ul = cols[1].querySelector('.career-list');
    if (ul) ul.innerHTML = careers.previous.map(t => `<li>${t}</li>`).join('');
  }
}

function renderCardNews() {
  const track = document.getElementById('cardnews-track');
  const dotsContainer = document.getElementById('cardnews-dots');
  if (!track || !dotsContainer) return;

  const items = getSiteConfig().cardNews || DEFAULT_CONFIG.cardNews;
  track.innerHTML = items.map((item, i) => `
    <div class="cardnews-slide">
      <img src="${item.imageUrl}" alt="${item.label || '카드뉴스 ' + (i + 1)}" loading="lazy">
    </div>
  `).join('');

  dotsContainer.innerHTML = items.map((_, i) =>
    `<span class="cardnews-dot${i === 0 ? ' active' : ''}" data-index="${i}"></span>`
  ).join('');

  // 슬라이더 재초기화
  initCardNews();
}

function applySiteConfig() {
  renderHeroSlogan();
  renderCareers();
  renderCardNews();
}

function initAdmin() {
  const btn = document.getElementById('admin-entry-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const menu = document.getElementById('mobile-menu');
    if (menu) { menu.classList.remove('active'); document.body.classList.remove('menu-open'); }
    showAdminLogin();
  });
}

function showAdminLogin() {
  document.getElementById('admin-login-overlay')?.remove();
  const el = document.createElement('div');
  el.id = 'admin-login-overlay';
  el.innerHTML = `
    <div class="admin-login-box">
      <div class="alb-icon">⚙️</div>
      <h2>관리자 로그인</h2>
      <p>하현주 선거캠프 관리자 전용</p>
      <input type="password" id="apw" placeholder="비밀번호를 입력하세요" autocomplete="off">
      <div id="apw-err" class="apw-err"></div>
      <button id="apw-ok">로그인</button>
      <button id="apw-cancel" class="apw-cancel">취소</button>
    </div>
  `;
  document.body.appendChild(el);
  const inp = el.querySelector('#apw');
  const err = el.querySelector('#apw-err');
  setTimeout(() => inp.focus(), 80);
  let userPass = '';
  function tryLogin() {
    userPass = inp.value;
    
    // 이 단계에서는 서버에 실제 GET 비밀번호 검증용 호출을 하지 않고 다음 단계(POST 업데이트)에서 에러가 나면 튕겨내는 방식으로 함.
    // 임시로 클라이언트 차원에서도 하드코딩된 패스워드를 체크하는 우회법이나, 패스워드를 넘겨서 설정 창부터 띄웁니다.
    // 서버가 없었던 기존 사이트 구조상, 패널 UI는 보여주고 "저장"시에 인증 에러를 내뿜게 설계.
    el.remove(); 
    showAdminPanel(userPass);
  }
  el.querySelector('#apw-ok').onclick = tryLogin;
  el.querySelector('#apw-cancel').onclick = () => el.remove();
  inp.onkeydown = e => { if (e.key === 'Enter') tryLogin(); };
  el.onclick = e => { if (e.target === el) el.remove(); };
}

function showAdminPanel(password) {
  document.getElementById('admin-panel-overlay')?.remove();
  const cfg = getSiteConfig();
  const el = document.createElement('div');
  el.id = 'admin-panel-overlay';
  el.innerHTML = `
    <div class="adm-panel">
      <div class="adm-header">
        <div class="adm-header-left">⚙️ <div><h2>관리자 패널</h2><span>하현주 선거캠프 웹사이트</span></div></div>
        <button id="adm-close">✕</button>
      </div>
      <div class="adm-body">

        <div class="adm-section">
          <div class="adm-sh">▶️ <h3>유튜브 영상 관리</h3></div>
          <div class="adm-sb">
            <p class="adm-hint">유튜브 URL에서 영상 ID만 입력하세요.<br>예) youtube.com/watch?v=<strong>IWeB56h_X78</strong></p>
            <div id="adm-vlist">
              ${cfg.videos.map((v, i) => `
                <div class="adm-vrow" data-i="${i}">
                  <div class="adm-vnum">${i + 1}</div>
                  <div class="adm-vinputs">
                    <input class="adm-input vid-id" placeholder="영상 ID" value="${v.id}">
                    <input class="adm-input vid-label" placeholder="제목" value="${v.label}">
                  </div>
                  <img class="adm-vthumb" src="https://img.youtube.com/vi/${v.id}/mqdefault.jpg">
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="adm-section">
          <div class="adm-sh">🖼️ <h3>메인 팝업 관리</h3></div>
          <div class="adm-sb">
            <p class="adm-hint">활성화된 팝업만 화면에 뜹니다. (권장: 이미지URL 필수입력)</p>
            <div id="adm-plist">
              ${(cfg.popups || DEFAULT_CONFIG.popups).map((p, i) => `
                <div class="adm-vrow popup-row" style="margin-bottom:12px; gap:8px;">
                  <div class="adm-vnum" style="display:flex; flex-direction:column; align-items:center;">
                    <span style="font-size:12px; margin-bottom:5px;">#${i+1}</span>
                    <input type="checkbox" class="pop-active" style="width:20px;height:20px;cursor:pointer;" ${p.isActive ? 'checked' : ''} title="화면에 표시">
                  </div>
                  <div class="adm-vinputs">
                    <input class="adm-input pop-img" placeholder="팝업 이미지 주소 (URL - 필수)" value="${p.imageUrl || ''}">
                    <input class="adm-input pop-link" placeholder="팝업 클릭 시 이동할 링크 URL (선택)" value="${p.linkUrl || ''}">
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="adm-section">
          <div class="adm-sh">💬 <h3>메인 슬로건</h3></div>
          <div class="adm-sb">
            <p class="adm-hint">줄바꿈(Enter)으로 행을 나눌 수 있습니다.</p>
            <textarea id="adm-slogan" class="adm-ta" rows="3">${cfg.heroSlogan}</textarea>
          </div>
        </div>

        <div class="adm-section">
          <div class="adm-sh">📋 <h3>이력 관리</h3></div>
          <div class="adm-sb">
            <p class="adm-hint">각 항목을 줄바꿈으로 구분하세요.</p>
            <div class="adm-career-cols">
              <div><label class="adm-lbl">현직</label>
                <textarea id="adm-cur" class="adm-ta" rows="5">${cfg.careers.current.join('\n')}</textarea></div>
              <div><label class="adm-lbl">전직</label>
                <textarea id="adm-prv" class="adm-ta" rows="5">${cfg.careers.previous.join('\n')}</textarea></div>
            </div>
          </div>
        </div>

        <div class="adm-section">
          <div class="adm-sh">🗞️ <h3>카드뉴스 관리</h3></div>
          <div class="adm-sb">
            <p class="adm-hint">이미지 URL 5개를 입력하세요. (직접 업로드 후 URL 복사)</p>
            <div id="adm-cnlist">
              ${(cfg.cardNews || DEFAULT_CONFIG.cardNews).map((cn, i) => `
                <div class="adm-vrow" style="align-items:center; gap:8px;">
                  <div class="adm-vnum">${i + 1}</div>
                  <div class="adm-vinputs" style="flex:1;">
                    <input class="adm-input cn-url" placeholder="이미지 URL" value="${cn.imageUrl || ''}">
                    <input class="adm-input cn-label" placeholder="설명 (선택)" value="${cn.label || ''}">
                  </div>
                  <img class="adm-vthumb cn-thumb" src="${cn.imageUrl || ''}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;background:#222;" onerror="this.style.display='none'" onload="this.style.display='block'">
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="adm-save-bar">
          <div id="adm-msg"></div>
          <button id="adm-save" class="adm-btn-save">💾 서버에 저장 및 적용</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(el);
  document.body.style.overflow = 'hidden';

  const panel = el.querySelector('.adm-panel');
  panel.style.transform = 'translateY(100%)';
  requestAnimationFrame(() => {
    panel.style.transition = 'transform .35s cubic-bezier(.32,.72,0,1)';
    panel.style.transform = 'translateY(0)';
  });

  el.querySelectorAll('#adm-vlist .adm-vrow').forEach(row => {
    const idInp = row.querySelector('.vid-id');
    const thumb = row.querySelector('.adm-vthumb');
    idInp.addEventListener('input', () => {
      if (idInp.value.trim()) thumb.src = `https://img.youtube.com/vi/${idInp.value.trim()}/mqdefault.jpg`;
    });
  });

  // 카드뉴스 썸네일 미리보기
  el.querySelectorAll('#adm-cnlist .adm-vrow').forEach(row => {
    const urlInp = row.querySelector('.cn-url');
    const thumb = row.querySelector('.cn-thumb');
    urlInp.addEventListener('input', () => {
      thumb.src = urlInp.value.trim();
      thumb.style.display = urlInp.value.trim() ? 'block' : 'none';
    });
  });

  function closePanel() {
    panel.style.transition = 'transform .25s ease';
    panel.style.transform = 'translateY(100%)';
    setTimeout(() => { el.remove(); document.body.style.overflow = ''; }, 260);
  }
  el.querySelector('#adm-close').onclick = closePanel;
  el.onclick = e => { if (e.target === el) closePanel(); };

  el.querySelector('#adm-save').onclick = async () => {
    const btn = el.querySelector('#adm-save');
    const msg = el.querySelector('#adm-msg');
    
    const videos = Array.from(el.querySelectorAll('.adm-vrow')).map(r => ({
      id: r.querySelector('.vid-id').value.trim(),
      label: r.querySelector('.vid-label').value.trim() || '제목 없음'
    })).filter(v => v.id);
    if (!videos.length) { alert('영상 ID를 1개 이상 입력해주세요.'); return; }
    
    // 팝업 설정 수집
    const popups = Array.from(el.querySelectorAll('.popup-row')).map(r => ({
      isActive: r.querySelector('.pop-active').checked,
      imageUrl: r.querySelector('.pop-img').value.trim(),
      linkUrl: r.querySelector('.pop-link').value.trim()
    }));
    
    const heroSlogan = el.querySelector('#adm-slogan').value.trim();
    const current = el.querySelector('#adm-cur').value.split('\n').map(s => s.trim()).filter(Boolean);
    const previous = el.querySelector('#adm-prv').value.split('\n').map(s => s.trim()).filter(Boolean);
    
    // 카드뉴스 수집
    const cardNews = Array.from(el.querySelectorAll('#adm-cnlist .adm-vrow')).map(r => ({
      imageUrl: r.querySelector('.cn-url').value.trim(),
      label: r.querySelector('.cn-label').value.trim()
    })).filter(cn => cn.imageUrl);

    // 서버로 데이터 전송
    const newConfig = { videos, heroSlogan, popups, careers: { current, previous }, cardNews };
    
    try {
      btn.textContent = '⏳ 저장 중...';
      btn.disabled = true;
      msg.textContent = '';
      
      await saveSiteConfig(password, newConfig);
      
      // 화면 갱신
      renderVideos(); renderHeroSlogan(); renderCareers(); renderCardNews();
      
      msg.textContent = '✅ 서버에 적용되었습니다!';
      msg.style.color = '#4ade80';
      btn.textContent = '💾 서버에 저장 및 적용';
      setTimeout(() => { msg.textContent = ''; }, 3000);
    } catch (e) {
      msg.textContent = '❌ 에러: ' + e.message;
      msg.style.color = '#f87171';
      btn.textContent = '💾 서버에 저장 및 적용';
    } finally {
      btn.disabled = false;
    }
  };
}

function injectAdminStyles() {
  if (document.getElementById('admin-css')) return;
  const s = document.createElement('style');
  s.id = 'admin-css';
  s.textContent = `
    @keyframes aShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
    .mobile-admin-btn{display:block;margin:32px auto 0;background:none;border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.45);padding:10px 20px;border-radius:30px;font-size:.8rem;cursor:pointer;font-family:inherit;transition:.2s;letter-spacing:.03em;}
    .mobile-admin-btn:hover{border-color:rgba(255,255,255,.4);color:rgba(255,255,255,.75);}
    #admin-login-overlay{position:fixed;inset:0;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(6px);}
    .admin-login-box{background:#16162a;border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:40px 30px;width:88%;max-width:340px;text-align:center;color:#fff;box-shadow:0 24px 64px rgba(0,0,0,.6);}
    .alb-icon{font-size:44px;margin-bottom:14px;}
    .admin-login-box h2{font-size:1.25rem;font-weight:700;margin:0 0 6px;}
    .admin-login-box p{font-size:.82rem;color:rgba(255,255,255,.45);margin:0 0 22px;}
    .admin-login-box input{width:100%;padding:13px 15px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.15);border-radius:12px;color:#fff;font-size:.95rem;outline:none;box-sizing:border-box;margin-bottom:8px;font-family:inherit;transition:border-color .2s;}
    .admin-login-box input:focus{border-color:#004EA2;background:rgba(0,78,162,.15);}
    .admin-login-box input::placeholder{color:rgba(255,255,255,.3);}
    .apw-err{font-size:.79rem;color:#f87171;min-height:20px;margin-bottom:10px;}
    .admin-login-box button{width:100%;padding:13px;border-radius:12px;border:none;cursor:pointer;font-size:.95rem;font-weight:600;font-family:inherit;margin-top:6px;transition:.2s;}
    #apw-ok{background:linear-gradient(135deg,#004EA2,#0066cc);color:#fff;}
    #apw-ok:hover{filter:brightness(1.1);}
    .apw-cancel{background:rgba(255,255,255,.07)!important;color:rgba(255,255,255,.55)!important;}
    .apw-cancel:hover{background:rgba(255,255,255,.13)!important;}
    #admin-panel-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:99999;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(5px);}
    .adm-panel{background:#0f0f1c;width:100%;max-width:500px;max-height:92vh;border-radius:24px 24px 0 0;display:flex;flex-direction:column;color:#fff;box-shadow:0 -20px 60px rgba(0,0,0,.5);overflow:hidden;}
    .adm-header{display:flex;align-items:center;justify-content:space-between;padding:20px 22px;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0;gap:14px;font-size:24px;}
    .adm-header-left{display:flex;align-items:center;gap:12px;}
    .adm-header h2{font-size:1rem;font-weight:700;margin:0;}
    .adm-header span{font-size:.72rem;color:rgba(255,255,255,.4);}
    #adm-close{background:rgba(255,255,255,.1);border:none;color:#fff;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:.9rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:.2s;}
    #adm-close:hover{background:rgba(255,255,255,.22);}
    .adm-body{overflow-y:auto;flex:1;padding:18px 18px 40px;}
    .adm-section{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;margin-bottom:14px;overflow:hidden;}
    .adm-sh{display:flex;align-items:center;gap:9px;padding:13px 17px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.03);font-size:.95rem;}
    .adm-sh h3{margin:0;font-size:.9rem;font-weight:600;}
    .adm-sb{padding:14px 17px;}
    .adm-hint{font-size:.74rem;color:rgba(255,255,255,.4);margin:0 0 13px;line-height:1.5;}
    .adm-hint strong{color:rgba(0,200,255,.8);}
    .adm-vrow{display:flex;align-items:center;gap:9px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.05);}
    .adm-vrow:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0;}
    .adm-vnum{background:rgba(0,78,162,.65);color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.74rem;font-weight:700;flex-shrink:0;}
    .adm-vinputs{flex:1;display:flex;flex-direction:column;gap:5px;}
    .adm-input{width:100%;padding:9px 12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:9px;color:#fff;font-size:.82rem;outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .2s;}
    .adm-input:focus{border-color:#004EA2;background:rgba(0,78,162,.15);}
    .adm-input::placeholder{color:rgba(255,255,255,.3);}
    .adm-vthumb{width:78px;height:54px;object-fit:cover;border-radius:8px;flex-shrink:0;background:#222;}
    .adm-ta{width:100%;padding:11px 13px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:12px;color:#fff;font-size:.82rem;outline:none;box-sizing:border-box;font-family:inherit;resize:vertical;line-height:1.6;transition:border-color .2s;}
    .adm-ta:focus{border-color:#004EA2;background:rgba(0,78,162,.15);}
    .adm-ta::placeholder{color:rgba(255,255,255,.3);}
    .adm-career-cols{display:grid;grid-template-columns:1fr 1fr;gap:11px;}
    .adm-lbl{display:block;font-size:.78rem;color:rgba(255,255,255,.5);margin-bottom:7px;font-weight:600;}
    .adm-save-bar{display:flex;align-items:center;gap:10px;padding:4px 0;margin-top:4px;}
    #adm-msg{flex:1;font-size:.85rem;font-weight:600;}
    .adm-btn-save{background:linear-gradient(135deg,#004EA2,#0070e0);color:#fff;border:none;border-radius:12px;padding:13px 22px;font-size:.92rem;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;transition:.2s;}
    .adm-btn-save:hover{filter:brightness(1.12);transform:translateY(-1px);}
    .adm-btn-reset{background:rgba(255,255,255,.07);color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:13px 14px;font-size:.82rem;cursor:pointer;font-family:inherit;white-space:nowrap;transition:.2s;}
    .adm-btn-reset:hover{background:rgba(248,113,113,.15);color:#f87171;border-color:rgba(248,113,113,.3);}
  `;
  document.head.appendChild(s);
}

// ── POPUP LOGIC ──
function renderPopups() {
  const cfg = getSiteConfig();
  const popupsData = cfg.popups || [];
  const activePopups = popupsData.filter(p => p.isActive && p.imageUrl);
  
  if (activePopups.length === 0) return;

  const hideUntil = localStorage.getItem('h2ju_popup_hide_until');
  if (hideUntil && Date.now() < parseInt(hideUntil)) return;

  let pOverlay = document.getElementById('main-popup-overlay');
  if (pOverlay) pOverlay.remove();

  pOverlay = document.createElement('div');
  pOverlay.id = 'main-popup-overlay';
  
  if (!document.getElementById('popup-style')) {
    const pst = document.createElement('style');
    pst.id = 'popup-style';
    pst.innerHTML = `
      #main-popup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); animation: fadeIn 0.3s ease; }
      .popup-box { width: 90%; max-width: 400px; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3); display: flex; flex-direction: column; }
      .popup-slider { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
      .popup-slider::-webkit-scrollbar { display: none; }
      .popup-slide { scroll-snap-align: center; flex: 0 0 100%; position: relative; }
      .popup-slide img { width: 100%; height: auto; max-height: 70vh; object-fit: contain; background: #000; display: block; }
      .popup-swipe-hint { text-align: center; font-size: 0.8rem; color: #fff; background: rgba(0,0,0,0.5); padding: 5px 0; margin: 0; position: absolute; bottom: 0; width: 100%; z-index: 2; pointer-events: none; }
      .popup-footer { display: flex; background: #E2E8F0; border-top: 1px solid #CBD5E1; }
      .popup-btn { flex: 1; padding: 14px; font-size: 0.95rem; font-weight: 700; background: none; border: none; cursor: pointer; color: #1E293B; }
      .popup-footer-divider { width: 1px; background: #CBD5E1; }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `;
    document.head.appendChild(pst);
  }

  const slidesHTML = activePopups.map(p => {
    const imgHtml = `<img src="${p.imageUrl}" alt="최근 소식 팝업" style="width:100%; display:block;">`;
    const linkedHtml = p.linkUrl ? `<a href="${p.linkUrl}" target="_blank" style="display:block;">${imgHtml}</a>` : imgHtml;
    return `<div class="popup-slide">${linkedHtml}${activePopups.length > 1 ? '<p class="popup-swipe-hint">👈 옆으로 넘겨 더 보기 👉</p>' : ''}</div>`;
  }).join('');

  pOverlay.innerHTML = `
    <div class="popup-box" onclick="event.stopPropagation()">
      <div class="popup-slider">
        ${slidesHTML}
      </div>
      <div class="popup-footer">
        <button class="popup-btn" onclick="
          localStorage.setItem('h2ju_popup_hide_until', Date.now() + 24 * 60 * 60 * 1000);
          document.getElementById('main-popup-overlay').remove();
        ">오늘 하루 보지 않기</button>
        <div class="popup-footer-divider"></div>
        <button class="popup-btn" onclick="document.getElementById('main-popup-overlay').remove();">닫기</button>
      </div>
    </div>
  `;

  document.body.appendChild(pOverlay);
}

// ── Card News Slider ──
function initCardNews() {
  const track = document.getElementById('cardnews-track');
  const dots = document.querySelectorAll('.cardnews-dot');
  if (!track || dots.length === 0) return;

  const total = track.children.length;
  let current = 0;
  let autoTimer = null;
  let touchStartX = null;
  let isDragging = false;

  function goTo(index) {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function next() { goTo(current + 1); }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(next, 4000);
  }

  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }

  // 도트 클릭
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); startAuto(); });
  });

  // 터치 스와이프
  track.parentElement.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    isDragging = true;
    stopAuto();
  }, { passive: true });

  track.parentElement.addEventListener('touchend', (e) => {
    if (!isDragging || touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) goTo(dx < 0 ? current + 1 : current - 1);
    touchStartX = null;
    isDragging = false;
    startAuto();
  }, { passive: true });

  // 탭 비활성화 시 일시정지
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAuto(); else startAuto();
  });

  // 초기화
  goTo(0);
  startAuto();
}
