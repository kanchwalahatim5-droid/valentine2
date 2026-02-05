// index page behavior:
// - "No" button dodges on hover/click/touch/focus.
// - When user explicitly tries to click/tap/activate "No", rotate persuasive lines and animate them.
// - "Yes" navigates to success.html showing sprinkles + sticker.

(function(){
  const noBtn = document.getElementById('noBtn');
  const yesBtn = document.getElementById('yesBtn');
  const buttonsArea = document.getElementById('buttons');
  const persuadeEl = document.getElementById('persuade');

  // persuasive messages (includes "think about it" and "don't do this", etc.)
  const persuadeLines = [
    "Think about it... remember our first laugh together? 💭",
    "Don't do this — my heart might stop! 💔 → because of cuteness",
    "Please? I'll bring your favorite dessert next time 🍮",
    "I promise more movie nights and holding hands 🎬🤝",
    "If you say yes, I'll make you breakfast in bed 🥐☕",
    "Imagine the silly selfies we'll take together 🤳❤️",
    "We still have so many inside jokes to create — say yes 😉",
    "Say yes and I’ll always share my fries with you 🍟💕",
    "I learned your favorite song just for today — it'll be sweeter with you 🎵",
    "Think about all the sunsets we could watch together 🌅",
    "Don't make me plead — okay... I'm pleading: please? 🥺",
    "If you say yes I’ll wear that goofy hat you love 🎩😊"
  ];
  let persuadeIndex = 0;

  // show a persuasive message (with animation + aria-live)
  function showPersuade() {
    const line = persuadeLines[persuadeIndex % persuadeLines.length];
    persuadeIndex++;
    persuadeEl.textContent = line;
    // animate
    persuadeEl.classList.remove('show');
    void persuadeEl.offsetWidth; // reflow to restart animation
    persuadeEl.classList.add('show');

    // subtle tiny sound (very short) - safe try/catch
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = 520 + Math.random()*60;
      g.gain.value = 0.02;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      o.stop(ctx.currentTime + 0.15);
    } catch(e){}
    // hide after a while
    clearTimeout(showPersuade._t);
    showPersuade._t = setTimeout(()=> persuadeEl.classList.remove('show'), 3000);
  }

  // utility helpers for positioning
  function rectOverlap(a, b){
    const xOverlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const yOverlap = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return xOverlap * yOverlap;
  }
  function rectDistance(a,b){
    const ax=(a.left+a.right)/2, ay=(a.top+a.bottom)/2;
    const bx=(b.left+b.right)/2, by=(b.top+b.bottom)/2;
    return Math.hypot(ax-bx, ay-by);
  }

  // move No button to a random safe spot within buttons area (avoiding the Yes button)
  function moveNoButtonRandomly(avoidRect){
    const areaRect = buttonsArea.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();
    const yesRect = yesBtn.getBoundingClientRect();
    const maxX = Math.max(6, areaRect.width - btnRect.width - 6);
    const maxY = Math.max(6, areaRect.height - btnRect.height - 6);

    let attempt = 0;
    let left, top;
    do {
      left = Math.random() * maxX;
      top  = Math.random() * maxY;
      attempt++;
      const candidate = {
        left: areaRect.left + left,
        right: areaRect.left + left + btnRect.width,
        top: areaRect.top + top,
        bottom: areaRect.top + top + btnRect.height
      };
      const overlap = rectOverlap(candidate, yesRect);
      if (overlap < 50 && (!avoidRect || rectDistance(candidate, avoidRect) > 70)) break;
    } while(attempt < 16);

    // apply style (px relative to container)
    noBtn.style.left = `${Math.max(6, left)}px`;
    noBtn.style.top  = `${Math.max(6, top)}px`;
    // playful rotation
    noBtn.style.transform = `rotate(${(Math.random()-0.5)*12}deg)`;
  }

  // attempt to activate "No" (called on click/touch/keyboard activation)
  function attemptNo(e) {
    // decide if this was an explicit activation that should show persuasion
    const isExplicit = e && (e.type === 'click' || e.type === 'touchstart' || (e.type === 'keydown' && (e.key === 'Enter' || e.key === ' ')));
    // compute avoid rect from pointer/touch if available
    let avoidRect = null;
    if (e && (e.clientX || (e.touches && e.touches[0]))) {
      const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const y = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      avoidRect = { left: x-40, right: x+40, top: y-40, bottom: y+40 };
    }
    try { e && e.preventDefault(); } catch(e){}

    // small jump animation then reposition
    noBtn.style.transform = 'scale(1.06) rotate(6deg)';
    setTimeout(()=> moveNoButtonRandomly(avoidRect), 80);

    if (isExplicit) showPersuade();
  }

  // Hover and focus should move the button (but not show persuasion)
  function hoverDodge(e){
    try { e && e.preventDefault(); } catch(e){}
    noBtn.style.transform = 'scale(1.03) rotate(3deg)';
    setTimeout(()=> moveNoButtonRandomly(null), 90);
  }

  // event listeners to make the No button evasive & persuasive
  noBtn.addEventListener('mouseenter', hoverDodge);
  noBtn.addEventListener('mouseover', hoverDodge);
  noBtn.addEventListener('touchstart', function(e){ attemptNo(e); }, {passive:false});
  noBtn.addEventListener('click', attemptNo);
  noBtn.addEventListener('focus', hoverDodge);

  // keyboard attempts: Enter/Space should trigger attemptNo and move focus to Yes
  noBtn.addEventListener('keydown', function(e){
    if (['Enter',' ','Spacebar','Tab'].includes(e.key)) {
      attemptNo(e);
      // keep keyboard flow to Yes so user doesn't get trapped
      yesBtn.focus();
    }
  });

  // Yes click: go to celebration page
  yesBtn.addEventListener('click', function(){
    // small click animation then navigate
    yesBtn.animate([{transform:'scale(1)'},{transform:'scale(0.96)'}], {duration:120, easing:'ease'});
    // small delay for the effect
    setTimeout(()=> {
      window.location.href = 'success.html';
    }, 140);
  });

  // ensure No button is in a sensible initial position after layout
  function init() {
    const areaRect = buttonsArea.getBoundingClientRect();
    noBtn.style.left = `${Math.min(30, Math.max(6, areaRect.width*0.18))}px`;
    noBtn.style.top  = `${Math.min(areaRect.height*0.75, 120)}px`;
    noBtn.style.transform = 'rotate(0deg)';
  }
  setTimeout(init, 60);

  // keep inside on resize
  window.addEventListener('resize', init);

})();
