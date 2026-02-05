// Evasive "No" button logic + modal logic
// Config
const DODGE_DISTANCE = 120;        // px - how close the pointer can get before No dodges
const MOVE_DISTANCE = 120;         // px - how far to attempt to move each dodge
const MAX_MOVES_BEFORE_HOLD = 999; // set lower (e.g. 8) if you want it to eventually stop dodging

(function () {
  const yesBtn = document.getElementById('yes-btn');
  const noBtn = document.getElementById('no-btn');
  const noWrap = document.getElementById('no-wrap');
  const card = document.getElementById('card');
  const ctaRow = document.getElementById('cta-row');
  const modal = document.getElementById('modal');
  const modalClose = document.getElementById('modal-close');
  const modalOk = document.getElementById('modal-ok');

  // Entrance animation
  requestAnimationFrame(() => card.classList.add('enter'));
  yesBtn.classList.add('pulse');

  // Utility
  function getRect(el) { return el.getBoundingClientRect(); }

  // Keep internal state
  let moves = 0;
  let isHolding = false;

  // Compute bounds the No button may occupy (inside the card, with padding)
  function computeBounds() {
    const cardRect = getRect(card);
    // We'll measure the wrapper relative to the card to position the button using left/top
    const padding = 16;
    return {
      left: padding,
      top: padding,
      right: cardRect.width - padding - noBtn.offsetWidth,
      bottom: cardRect.height - padding - noBtn.offsetHeight
    };
  }

  // Convert a document point to coordinates relative to the noWrap (so we can set left/top)
  function toWrapCoords(x, y) {
    const wrapRect = noWrap.getBoundingClientRect();
    return { x: x - wrapRect.left, y: y - wrapRect.top };
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
    // We'll compute desired left so that button center matches localX/localY
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
    // For wiggle animation, pass values via CSS variables
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

      // wiggle indicator
      noBtn.classList.add('moving');
      // Place animated
      placeNoAt(tryX, tryY);

      moves++;
      if (moves >= MAX_MOVES_BEFORE_HOLD) {
        isHolding = true;
        // leave the moving animation off after a short delay
        setTimeout(() => noBtn.classList.remove('moving'), 540);
        // optional: add a friendly tooltip or small shake to indicate "giving up"
      } else {
        // remove moving class after animation finishes to allow retrigger
        setTimeout(() => noBtn.classList.remove('moving'), 720);
      }
    }
  }

  // Global pointer move (mousemove & touchmove) attached to document for responsiveness
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
      // quick shake
      noBtn.animate([
        { transform: noBtn.style.transform + ' translateX(0)' },
        { transform: noBtn.style.transform + ' translateX(-8px)' },
        { transform: noBtn.style.transform + ' translateX(6px)' },
        { transform: noBtn.style.transform + ' translateX(0)' }
      ], { duration: 360, easing: 'ease-out' });
      return false;
    }
    // otherwise, let it go through (if holding or allowed)
    return true;
  }

  // Modal open/close functions
  function openModal() {
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    // focus the close button for accessibility
    modalClose.focus();
  }
  function closeModal() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    yesBtn.focus();
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
    // recompute and ensure the button stays inside
    // extract current transform and move to a valid spot if needed
    const wrapRect = noWrap.getBoundingClientRect();
    const cur = getRect(noBtn);
    const centerX = cur.left + cur.width / 2;
    const centerY = cur.top + cur.height / 2;
    placeNoAt(centerX, centerY);
  });
})();
