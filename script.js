// Evasive "No" button logic + modal + confetti/particles + background hearts + shower hearts
// Config
const DODGE_DISTANCE = 120;        // px - how close the pointer can get before No dodges
const MOVE_DISTANCE = 120;         // px - how far to attempt to move each dodge
const MAX_MOVES_BEFORE_HOLD = 999; // set lower to allow clicks after N attempts
const BG_HEART_COUNT = 40;         // increased background hearts (more visible)
const SHOWER_HEART_COUNT = 36;     // hearts falling from above when Yes clicked

(function () {
  const yesBtn = document.getElementById('yes-btn');
  const noBtn = document.getElementById('no-btn');
  const noWrap = document.getElementById('no-wrap');
  const card = document.getElementById('card');
  const ctaRow = document.getElementById('cta-row');
  const modal = document.getElementById('modal');
  const modalClose = document.getElementById('modal-close');
  const modalOk = document.getElementById('modal-ok');
  const nameEl = document.querySelector('.name');
  const bgHearts = document.querySelector('.bg-hearts');
  const yayImg = document.getElementById('yay-img');

  // Entrance animation
  requestAnimationFrame(() => card.classList.add('enter'));
  yesBtn.classList.add('pulse');

  // Add shimmer on name
  nameEl.classList.add('shimmer');

  // Utility
  function getRect(el) { return el.getBoundingClientRect(); }

  // Keep internal state
  let moves = 0;
  let isHolding = false;

  // Compute bounds the No button may occupy (inside the card, with padding)
  function computeBounds() {
    const cardRect = getRect(card);
    const padding = 18;
    return {
      left: padding,
      top: padding,
      right: cardRect.width - padding - noBtn.offsetWidth,
      bottom: cardRect.height - padding - noBtn.offsetHeight
    };
  }

  // Get center of an element in document coords
  function centerOf(el) {
    const r = getRect(el);
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  // Move button by px vector (constrained), using transform for smoothness
  function placeNoAt(clientX, clientY) {
    const wrapRect = noWrap.getBoundingClientRect();
    const localX = clientX - wrapRect.left;
    const localY = clientY - wrapRect.top;

    // New left/top within wrapper
    let left = localX - noBtn.offsetWidth / 2;
    let top = localY - noBtn.offsetHeight / 2;

    const bounds = computeBounds();
    // Bounds are relative to the card; convert to wrapper local coords
    const cardRect = getRect(card);
    const wrapRectRel = {
      left: wrapRect.left - cardRect.left,
      top: wrapRect.top - cardRect.top
    };

    const minLeft = bounds.left - wrapRectRel.left;
    const maxLeft = bounds.right - wrapRectRel.left;
    const minTop = bounds.top - wrapRectRel.top;
    const maxTop = bounds.bottom - wrapRectRel.top;

    left = Math.max(minLeft, Math.min(maxLeft, left));
    top = Math.max(minTop, Math.min(maxTop, top));

    // Apply transform for GPU-accelerated smooth motion
    noBtn.style.transition = 'transform 380ms cubic-bezier(.2,.85,.25,1)';
    const tx = left + 'px';
    const ty = top + 'px';
    noBtn.style.transform = `translate3d(${tx}, ${ty}, 0)`;
    noBtn.style.setProperty('--tx', tx);
    noBtn.style.setProperty('--ty', ty);
  }

  // When pointer/touch gets near, move the No button away
  function handlePointer(clientX, clientY) {
    if (isHolding || moves >= MAX_MOVES_BEFORE_HOLD) return;
    const noCenter = centerOf(noBtn);
    const dx = clientX - noCenter.x;
    const dy = clientY - noCenter.y;
    const dist = Math.hypot(dx, dy);

    if (dist < DODGE_DISTANCE) {
      // compute a vector away from the pointer
      const awayX = dx / (dist || 1);
      const awayY = dy / (dist || 1);

      // Attempt to push by MOVE_DISTANCE plus a bit of random jitter
      const tryX = noCenter.x + awayX * MOVE_DISTANCE + (Math.random() - 0.5) * 40;
      const tryY = noCenter.y + awayY * MOVE_DISTANCE + (Math.random() - 0.5) * 40;

      // visual feedback: card pulse
      card.classList.add('pulse');
      setTimeout(() => card.classList.remove('pulse'), 520);

      // make the name shimmer a little on dodge
      nameEl.classList.add('shimmer-burst');
      setTimeout(() => nameEl.classList.remove('shimmer-burst'), 700);

      // wiggle indicator
      noBtn.classList.add('moving');
      // Place animated
      placeNoAt(tryX, tryY);

      moves++;
      if (moves >= MAX_MOVES_BEFORE_HOLD) {
        isHolding = true;
        setTimeout(() => noBtn.classList.remove('moving'), 540);
      } else {
        setTimeout(() => noBtn.classList.remove('moving'), 720);
      }
    }
  }

  // Global pointer move (mousemove & touchmove)
  function onMove(e) {
    const p = e.touches ? e.touches[0] : e;
    handlePointer(p.clientX, p.clientY);
  }

  // For touch attempts starting directly on the no button (tap), dodge immediately
  function onNoTouchStart(e) {
    if (isHolding || moves >= MAX_MOVES_BEFORE_HOLD) return;
    e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    handlePointer(p.clientX, p.clientY);
  }

  // If somebody manages to click No, optionally show a small reaction
  function onNoClick(e) {
    if (!isHolding && moves < MAX_MOVES_BEFORE_HOLD) {
      // cancel the click and display a tiny nudge
      e.preventDefault();
      e.stopPropagation();
      noBtn.animate([
        { transform: noBtn.style.transform + ' translateX(0)' },
        { transform: noBtn.style.transform + ' translateX(-8px)' },
        { transform: noBtn.style.transform + ' translateX(6px)' },
        { transform: noBtn.style.transform + ' translateX(0)' }
      ], { duration: 360, easing: 'ease-out' });
      return false;
    }
    return true;
  }

  // Modal open/close functions
  function openModal() {
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    modalClose.focus();

    // show and animate your supplied image above "Yay!"
    if (yayImg) {
      // ensure visible and animate in
      yayImg.classList.add('show');
      // hide after a while (optional)
      setTimeout(() => yayImg.classList.remove('show'), 4000);
    }

    // celebrate: confetti + hearts + shower from top
    burstConfettiAtCenter();
    burstHeartsAtCenter();
    showerHeartsFromTop(SHOWER_HEART_COUNT);
  }
  function closeModal() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    yesBtn.focus();
    // hide image quickly
    if (yayImg) yayImg.classList.remove('show');
  }

  // Particle helpers (confetti + hearts)
  function makeParticle(x, y, color, size = 10, shape = 'rect') {
    const p = document.createElement('div');
    p.className = 'particle';
    if (shape === 'heart') p.classList.add('heart');
    p.style.left = `${x - size / 2}px`;
    p.style.top = `${y - size / 2}px`;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.background = color;
    p.style.borderRadius = shape === 'heart' ? '50% 50% 50% 50% / 60% 60% 40% 40%' : '2px';
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    p.style.zIndex = 2600;
    document.body.appendChild(p);
    return p;
  }

  function animateParticle(p, vx, vy, rot, delay = 0, gravity = 0.6, fade = true) {
    const duration = 1400 + Math.random() * 600;
    p.animate([
      { transform: `translate3d(0,0,0) rotate(0deg)`, opacity: 1 },
      { transform: `translate3d(${vx}px, ${vy + gravity * duration / 10}px, 0) rotate(${rot}deg)`, opacity: fade ? 0 : 1 }
    ], { duration, easing: 'cubic-bezier(.2,.8,.2,1)', delay });
    setTimeout(() => { try { p.remove(); } catch(e){} }, duration + delay + 60);
  }

  function burstConfettiAtCenter() {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const colors = ['#FF6B9A', '#FF9BC2', '#FFD6E0', '#FFF58F', '#69C0FF'];
    for (let i = 0; i < 22; i++) {
      const angle = (Math.PI * 2) * (i / 22) + (Math.random() - 0.5);
      const speed = 180 + Math.random() * 160;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const p = makeParticle(cx, cy, colors[i % colors.length], 10 + Math.random() * 10, 'rect');
      animateParticle(p, vx, vy, (Math.random() - 0.5) * 720, 0, 0.8, true);
    }
  }

  function burstHeartsAtCenter() {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2 - 40;
    const colors = ['#FF6B9A', '#FF9BC2', '#FFB4CF'];
    for (let i = 0; i < 12; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
      const speed = 120 + Math.random() * 140;
      const vx = Math.cos(angle) * speed + (Math.random() - 0.5) * 40;
      const vy = Math.sin(angle) * speed + (Math.random() - 0.5) * 40;
      const p = makeParticle(cx + (Math.random() - 0.5) * 40, cy + (Math.random() - 0.5) * 20, colors[i % colors.length], 14 + Math.random() * 10, 'heart');
      animateParticle(p, vx, vy, (Math.random() - 0.5) * 540, 0, 0.6, true);
    }
  }

  // Shower hearts falling from top
  function showerHeartsFromTop(count = 30) {
    const colors = ['#FF6B9A', '#FF9BC2', '#FFB4CF', '#FFD6E0'];
    const w = window.innerWidth;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * w;
      const y = -20 - Math.random() * 120; // above the viewport
      const size = 10 + Math.random() * 20;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const p = document.createElement('div');
      p.className = 'particle heart';
      p.style.left = `${x - size/2}px`;
      p.style.top = `${y - size/2}px`;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.background = color;
      p.style.borderRadius = '50% 50% 50% 50% / 60% 60% 40% 40%';
      p.style.zIndex = 2600;
      document.body.appendChild(p);

      // animate falling down
      const vx = (Math.random() - 0.5) * 120; // slight horizontal drift
      const vy = window.innerHeight * (0.8 + Math.random() * 0.6);
      const rot = (Math.random() - 0.5) * 720;
      animateParticle(p, vx, vy, rot, Math.random() * 180, 0.9, true);
    }
  }

  // Background hearts generation (bigger & more visible)
  function spawnBackgroundHearts(count = BG_HEART_COUNT) {
    const colors = ['rgba(255,107,154,0.36)', 'rgba(255,155,180,0.28)', 'rgba(255,180,200,0.22)'];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'bg-heart';
      const size = 14 + Math.random() * 36; // larger sizes for more visibility
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      // random horizontal position
      const left = Math.random() * 100;
      el.style.left = `${left}%`;
      // start slightly below viewport
      el.style.top = `${85 + Math.random() * 25}%`;
      // random color (more visible)
      const color = colors[Math.floor(Math.random() * colors.length)];
      // inline SVG heart for crisp shape
      const svg = `<svg viewBox="0 0 32 32" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <path d="M23.6 4c-2.2 0-4 1.6-4.6 3.6C18.4 5.6 16.6 4 14.4 4 10.6 4 8 7.2 8 11c0 7.1 9.1 11.5 11.6 12.8.5.3 1.1.3 1.6 0C22.9 22.5 32 18.1 32 11c0-3.8-2.6-7-8.4-7z" fill="${color}"/>
      </svg>`;
      el.innerHTML = svg;

      const dur = 12 + Math.random() * 18; // seconds
      const delay = -Math.random() * dur; // negative delay to spread positions
      el.style.animation = `heartRise ${dur}s linear ${delay}s infinite`;
      el.style.zIndex = -3;

      bgHearts.appendChild(el);

      // subtle horizontal oscillation
      (function(el) {
        let t = Math.random() * 1000;
        function tick() {
          t += 0.006;
          const drift = (Math.sin(t * (0.5 + Math.random() * 0.9)) * 40);
          el.style.transform = `translateX(${drift}px)`;
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      })(el);
    }
  }

  // Event wiring
  document.addEventListener('mousemove', onMove, { passive: true });
  document.addEventListener('touchmove', onMove, { passive: true });

  noBtn.addEventListener('touchstart', onNoTouchStart, { passive: false });
  noBtn.addEventListener('mousedown', onNoTouchStart, { passive: false });

  noBtn.addEventListener('click', onNoClick);

  yesBtn.addEventListener('click', () => {
    openModal();
  });

  modalClose.addEventListener('click', closeModal);
  modalOk.addEventListener('click', closeModal);

  // close modal on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      closeModal();
    }
  });

  // Keep No button constrained if window resized
  window.addEventListener('resize', () => {
    const cur = getRect(noBtn);
    const centerX = cur.left + cur.width / 2;
    const centerY = cur.top + cur.height / 2;
    placeNoAt(centerX, centerY);
  });

  // spawn background hearts
  spawnBackgroundHearts(BG_HEART_COUNT);

  // expose a little tidy-up API (optional)
  window.__valentine = { resetMoves: () => { moves = 0; isHolding = false; } };
})();
