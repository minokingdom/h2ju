/* ==============================================
   제물포구청장 예비후보 이종호 - 웹자보
   더불어민주당 블루 테마 · 모바일 퍼스트
   ============================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 새로고침 시 항상 최상단(Hero)에서 시작하게 강제 설정
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);

  initNavigation();
  initScrollAnimations();
  initPlexus();
  initCountUp();
  initSupportForm();
  initSmoothScroll();
  initPartyBadge();
  initGallery(); // 갤러리 초기화 추가
});

// ── Gallery Config ──
// 구글 드라이브 폴더 ID
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
  wrapper.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:200px;width:100%;color:#999;">구글 드라이브 연결 중...</div>';

  let items = [];

  try {
    // 1. CORS 우회 프록시(allorigins)를 사용하여 드라이브 폴더의 HTML 데이터 가져오기
    // 사진 업로드 즉시 반영되도록 캐시 무효화(Cache-Busting) 파라미터(현재 시간) 추가
    const timestamp = new Date().getTime();
    const embedUrl = `https://drive.google.com/embeddedfolderview?id=${DRIVE_FOLDER_ID}&t=${timestamp}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(embedUrl)}&cb=${timestamp}`;

    const resp = await fetch(proxyUrl);
    if (!resp.ok) throw new Error('Proxy error');
    const html = await resp.text();

    // 2. ID 추출 (정규식 사용 - 프록시된 HTML에서 더 확실한 방법)
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
    wrap.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        lastTouchDist = getTouchDist(e.touches);
      } else if (e.touches.length === 1 && scale > 1) {
        isDragging = true;
        startDragX = e.touches[0].clientX;
        startDragY = e.touches[0].clientY;
        startPosX = posX; startPosY = posY;
      }
    }, { passive: true });

    wrap.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = getTouchDist(e.touches);
        const delta = (dist - lastTouchDist) * 0.008;
        scale = Math.min(5, Math.max(1, scale + delta));
        if (scale <= 1) resetZoom();
        lastTouchDist = dist;
        applyTransform(img);
      } else if (e.touches.length === 1 && isDragging && scale > 1) {
        e.preventDefault();
        posX = startPosX + (e.touches[0].clientX - startDragX) / scale;
        posY = startPosY + (e.touches[0].clientY - startDragY) / scale;
        applyTransform(img);
      }
    }, { passive: false });

    wrap.addEventListener('touchend', () => { isDragging = false; }, { passive: true });

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

    // 스와이프로 넘기기 (줌 안 된 상태에서만)
    let swStartX = 0;
    wrap.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1 && scale <= 1) swStartX = e.touches[0].clientX;
    }, { passive: true });
    wrap.addEventListener('touchend', (e) => {
      if (scale > 1) return;
      const dx = e.changedTouches[0].clientX - swStartX;
      if (Math.abs(dx) > 60) goTo(dx < 0 ? 1 : -1);
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

  document.addEventListener('touchstart', e => {
    startX = e.changedTouches[0].clientX;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const endX = e.changedTouches[0].clientX;
    const swipeDistance = startX - endX; // 양수: 왼쪽으로 밀기 (메뉴 열기)
    const screenWidth = window.innerWidth;

    // 1. 왼쪽 가장자리에서 오른쪽으로 밀 때 (메뉴 열기)
    // 시작점이 왼쪽 25% 이내이고, 오른쪽으로 40px 이상 밀었을 때
    if (startX < screenWidth * 0.25 && swipeDistance < -40) {
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
  }, { passive: true });

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
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbydQAp8P2wRErhKHmc_DDQZdQDjsQufDfYYsCfs6-4mYF7q7ph3rGY5djwbqc0gBLitRQ/exec";

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

      // Google Apps Script는 no-cors 모드로 전송해야 할 때가 많습니다.
      await fetch(GOOGLE_SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        cache: "no-cache",
        headers: { "Content-Type": "application/json" },
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

  // 1. 영상 주입 (아직 투명 상태)
  container.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
  container.classList.remove('loaded');

  // 2. 모달 및 로더 표시
  modal.classList.add('active');
  loader.style.opacity = '1';
  loader.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // 3. 약 1.5초 후(로딩 연출) 영상 페이드 인
  setTimeout(() => {
    loader.style.opacity = '0';
    container.classList.add('loaded');
    document.body.classList.add('video-loaded'); // 버튼 등장 트리거
    setTimeout(() => { loader.style.display = 'none'; }, 500);
  }, 1500); // 1.5초 노출
}

function closeVideo() {
  const modal = document.getElementById('video-modal');
  const container = document.getElementById('player-container');
  const loader = document.getElementById('video-loader');
  if (!modal || !container || !loader) return;

  modal.classList.remove('active');
  document.body.classList.remove('video-loaded'); // 상태 초기화
  container.innerHTML = '';
  container.classList.remove('loaded');
  loader.style.display = 'flex';
  loader.style.opacity = '1';
  document.body.style.overflow = '';
}
