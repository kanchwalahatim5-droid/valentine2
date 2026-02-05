// Keep the button fixed — no movement code here.
// Small script to handle the modal and ensure no dragging or accidental movement.

(function(){
  const btn = document.getElementById('proposal-btn');
  const modal = document.getElementById('modal');
  const closeModal = document.getElementById('close-modal');

  // Prevent dragging of the button or any children
  btn.addEventListener('dragstart', e => e.preventDefault());
  btn.setAttribute('draggable', 'false');

  // Also prevent long-press -> selection on mobile
  btn.addEventListener('touchstart', () => {}, {passive: true});

  // Click reveals a loving modal (no movement)
  btn.addEventListener('click', () => {
    modal.setAttribute('aria-hidden', 'false');
    // small celebratory animation: quick heart burst (CSS-free, DOM-based)
    heartBurst(btn);
  });

  closeModal.addEventListener('click', () => {
    modal.setAttribute('aria-hidden', 'true');
  });

  // close modal on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.setAttribute('aria-hidden', 'true');
  });

  // keyboard accessibility: Esc closes
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modal.setAttribute('aria-hidden', 'true');
  });

  // small helper to spawn tiny hearts for a moment
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
      // random color and trajectory
      const hue = 330 + Math.random()*20;
      el.innerHTML = '💖';
      document.body.appendChild(el);

      const dx = (Math.random()-0.5) * 120;
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
