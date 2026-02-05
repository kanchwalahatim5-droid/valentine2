// Evasive "No" button logic + modal logic

(function(){
  const yesBtn = document.getElementById('yes-btn');
  const noBtn = document.getElementById('no-btn');
  const modal = document.getElementById('modal');
  const closeModal = document.getElementById('close-modal');
  const ctaArea = document.getElementById('cta-area');

  // Prevent dragging and selection on the no button
  [noBtn, yesBtn].forEach(b => {
    b.addEventListener('dragstart', e => e.preventDefault());
    b.setAttribute('draggable', 'false');
    b.addEventListener('touchstart', () => {}, {passive:true});
  });

  // Yes button opens modal
  yesBtn.addEventListener('click', () => {
    modal.setAttribute('aria-hidden', 'false');
    heartBurst(yesBtn);
  });

  // Modal handlers (close)
  closeModal && closeModal.addEventListener('click', () => modal.setAttribute('aria-hidden', 'true'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.setAttribute('aria-hidden', 'true'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') modal.setAttribute('aria-hidden', 'true'); });

  // Evasive behavior: when pointer gets close to the No button, move it.
  // Also move on touchstart attempts.
  let moveCount = 0;
  const MAX_MOVES_BEFORE_HOLD = 999; // set high so it generally keeps dodging
  const DODGE_DISTANCE = 120; // px proximity to trigger dodge

  function getCenter(rect){
    return { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
  }

  function distance(a,b){
    const dx = a.x-b.x, dy = a.y-b.y;
    return Math.sqrt(dx*dx + dy*dy);
  }

  function moveNoButtonRandomly() {
    const areaRect = ctaArea.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();

    const padding = 8; // gap from edges
    const maxLeft = areaRect.width - btnRect.width - padding;
    const maxTop = areaRect.height - btnRect.height - padding;

    // If area is too small, don't move
    if (maxLeft <= 0 || maxTop <= 0) return;

    const left = Math.max(padding, Math.random() * maxLeft);
    const top = Math.max(padding, Math.random() * maxTop);

    // Position using absolute offsets relative to the container
    noBtn.style.left = `${left + areaRect.left - areaRect.left + btnRect.width/2}px`;
    noBtn.style.top = `${top + areaRect.top - areaRect.top + btnRect.height/2}px`;

    // Actually set left/top as px within container by using offsetParent coordinates.
    // We'll convert to percentages that keep the button centered on the chosen point.
    // Simpler: set using pixel offsets relative to ctaArea:
    noBtn.style.left = `${left + btnRect.width/2}px`;
    noBtn.style.top = `${top + btnRect.height/2}px`;

    moveCount++;
  }

  // When pointer moves inside cta area, check distance to noBtn
  ctaArea.addEventListener('mousemove', (e) => {
    const btnRect = noBtn.getBoundingClientRect();
    const center = getCenter(btnRect);
    const pointer = { x: e.clientX, y: e.clientY };
    if (distance(center, pointer) < DODGE_DISTANCE && moveCount < MAX_MOVES_BEFORE_HOLD) {
      moveNoButtonRandomly();
    }
  });

  // Also react to touchstart anywhere in cta area to dodge
  ctaArea.addEventListener('touchstart', (e) => {
    // Use first touch
    const touch = e.touches[0];
    if (!touch) return;
    const btnRect = noBtn.getBoundingClientRect();
    const center = getCenter(btnRect);
    const touchPt = { x: touch.clientX, y: touch.clientY };
    if (distance(center, touchPt) < DODGE_DISTANCE && moveCount < MAX_MOVES_BEFORE_HOLD) {
      moveNoButtonRandomly();
    }
  }, {passive:true});

  // Also dodge when focus attempts (keyboard) — jump away once focused
  noBtn.addEventListener('focus', () => {
    if (moveCount < MAX_MOVES_BEFORE_HOLD) moveNoButtonRandomly();
  });

  // As an accessibility-friendly fallback: if user actually manages to click "No",
  // show a playful alert and reset the button.
  noBtn.addEventListener('click', () => {
    // tiny playful response
    noBtn.textContent = '😳';
    setTimeout(() => { noBtn.textContent = 'No 😅'; }, 900);
  });

  // Initialize no button position (center-right)
  function placeInitialNo(){
    const areaRect = ctaArea.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();
    const startLeft = Math.min(areaRect.width - btnRect.width - 12, areaRect.width/2 + 80);
    const startTop = (areaRect.height - btnRect.height)/2;
    noBtn.style.left = `${startLeft + btnRect.width/2}px`;
    noBtn.style.top = `${startTop + btnRect.height/2}px`;
  }

  // Fire once on load and on resize
  window.addEventListener('load', placeInitialNo);
  window.addEventListener('resize', () => {
    // Slight debounce
    clearTimeout(window.__no_pos_timer);
    window.__no_pos_timer = setTimeout(placeInitialNo, 120);
  });

  // Small helper to spawn tiny hearts for a moment (used when Yes clicked)
  function heartBurst(target){
    const rect = target.getBoundingClientRect();
    for(let i=0;i<8;i++){
      const el = document.createElement('div');
      el.className = 'mini-heart';
      el.style.position = 'fixed';
      el.style.left = (rect.left + rect.width/2) + 'px';
      el.style.top = (rect.top + rect.height/2) + 'px';
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.pointerEvents = 'none';
      el.style.transform = 'translate(-50%,-50%) scale(1)';
      el.style.opacity = '1';
      el.style.zIndex = 9999;
      el.innerHTML = '💖';
      document.body.appendChild(el);

      const dx = (Math.random()-0.5) * 140;
      const dy = -60 - Math.random()*80;
      const dur = 600 + Math.random()*300;

      el.animate([
        { transform: `translate(-50%,-50%) translate(0px,0px) scale(1)`, opacity:1 },
        { transform: `translate(-50%,-50%) translate(${dx}px,${dy}px) scale(.6)`, opacity:0 }
      ], { duration: dur, easing: 'cubic-bezier(.2,.8,.2,1)'});

      setTimeout(()=> el.remove(), dur + 50);
    }
  }

})();
