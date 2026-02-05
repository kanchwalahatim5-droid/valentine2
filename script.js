// Updated script: shows persuasive lines each time user clicks "No" (plus existing behavior)
(function(){
  // DOM refs
  const noBtn = document.getElementById('noBtn');
  const yesBtn = document.getElementById('yesBtn');
  const buttonsArea = document.getElementById('buttons');
  const popup = document.getElementById('popup');
  const closePopup = document.getElementById('closePopup');
  const shareBtn = document.getElementById('shareBtn');
  const persuadeEl = document.getElementById('persuade');

  // Keep previous sticker and confetti logic (omitted here for brevity in this snippet)
  // (Assume the rest of your sticker code is unchanged — only persuasion logic added/updated.)

  // persuasive messages to rotate through
  const persuadeLines = [
    "But think about all the sunsets we've watched together… 🌅",
    "Remember that time we laughed until our stomachs hurt? 😄",
    "I made a playlist just for you — and it's missing your 'Yes'. 🎵",
    "Promise I'll bring your favorite snacks on our next date. 🍪",
    "I baked cookies just so you'd say yes. (I ate some too) 🍪💕",
    "Your smile is my favorite thing — don't hide it from me. 😊",
    "We have a lot more inside jokes to make — let's start with this yes. 😉",
    "Imagine our next adventure together — it'll be sweeter with you. ✈️❤️",
    "I'll hold your hand through scary movies and Monday mornings. 🍿☕",
    "You + me = best team. Ready to level up? 💑",
    "If you say yes I'll draw you a silly heart every day. 🎨💓",
    "Please? I'll let you pick the next movie. 🎬😍"
  ];
  let persuadeIndex = 0;

  // show persuade message with animation and accessible announcement
  function showPersuadeLine() {
    const line = persuadeLines[persuadeIndex % persuadeLines.length];
    persuadeIndex++;
    // set text and animate
    persuadeEl.textContent = line;
    // trigger show class for CSS animation
    persuadeEl.classList.remove('show');
    // small reflow to restart animation
    void persuadeEl.offsetWidth;
    persuadeEl.classList.add('show');

    // optionally play a tiny playful sound (subtle)
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
    } catch (e) {
      // ignore audio errors (autoplay, unsupported, etc.)
    }

    // hide after a short time
    clearTimeout(showPersuadeLine._timeout);
    showPersuadeLine._timeout = setTimeout(()=> {
      persuadeEl.classList.remove('show');
    }, 2800);
  }

  // existing dodge logic (simplified here — keep your current implementation)
  noBtn.style.transition = 'left .28s cubic-bezier(.2,.9,.3,1), top .28s cubic-bezier(.2,.9,.3,1), transform .18s ease';

  function rectOverlap(a, b) { const xOverlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)); const yOverlap = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)); return xOverlap * yOverlap; }
  function rectDistance(a, b) { const ax = (a.left + a.right)/2, ay = (a.top + a.bottom)/2; const bx = (b.left + b.right)/2, by = (b.top + b.bottom)/2; return Math.hypot(ax-bx, ay-by); }

  function moveNoButtonRandomly(avoidRect) {
    const areaRect = buttonsArea.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();
    const yesRect = yesBtn.getBoundingClientRect();
    const maxX = Math.max(8, areaRect.width - btnRect.width - 8);
    const maxY = Math.max(8, areaRect.height - btnRect.height - 8);

    let attempt = 0;
    let left, top;
    do {
      left = Math.random() * maxX;
      top  = Math.random() * maxY;
      attempt++;
      const candidateRect = {
        left: areaRect.left + left,
        right: areaRect.left + left + btnRect.width,
        top: areaRect.top + top,
        bottom: areaRect.top + top + btnRect.height
      };
      const overlap = rectOverlap(candidateRect, yesRect);
      if (overlap < 50 && (!avoidRect || rectDistance(candidateRect, avoidRect) > 70)) break;
    } while(attempt < 12);

    noBtn.style.left = `${Math.max(6, left)}px`;
    noBtn.style.top  = `${Math.max(6, top)}px`;
    noBtn.style.transform = `rotate(${(Math.random()-0.5)*10}deg)`;
  }

  // dodge + show persuasion only when user actually attempts a click/tap/press
  function attemptNo(e) {
    // show persuasion only on explicit click/tap/keyboard-activation events
    const isClickLike = e && (e.type === 'click' || e.type === 'touchstart' || (e.type === 'keydown' && (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar')));
    // compute avoidRect for nicer escaping
    let avoidRect = null;
    if (e && (e.clientX || (e.touches && e.touches[0]))) {
      const x = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
      const y = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY) || 0;
      avoidRect = { left: x-40, right: x+40, top: y-40, bottom: y+40 };
    }
    try { e && e.preventDefault(); } catch(e){}
    // tiny leap animation
    noBtn.style.transform = 'scale(1.06) rotate(4deg)';
    setTimeout(()=> moveNoButtonRandomly(avoidRect), 70);

    if (isClickLike) {
      showPersuadeLine();
    }
  }

  // attach events (keep other events to maintain existing UX)
  noBtn.addEventListener('click', attemptNo);
  noBtn.addEventListener('touchstart', function(e){ attemptNo(e); }, {passive:false});
  noBtn.addEventListener('keydown', function(e){
    if (['Enter',' ','Spacebar','Tab'].includes(e.key)) {
      attemptNo(e);
      // keep keyboard flow to yes
      yesBtn.focus();
    }
  });
  noBtn.addEventListener('mouseenter', function(e){ /* keep dodge on hover but don't show persuasion */ 
    try { e && e.preventDefault(); } catch(e){}
    noBtn.style.transform = 'scale(1.03) rotate(2deg)';
    setTimeout(()=> moveNoButtonRandomly(null), 90);
  });

  // rest of page behavior (yes popup, confetti, stickers) should remain unchanged
  // Example: yes button opens the popup (existing code kept)
  yesBtn.addEventListener('click', function(){
    popup.setAttribute('aria-hidden','false');
    closePopup && closePopup.focus && closePopup.focus();
    // (optional: play chime / spawn hearts — keep your existing functions)
  });
  closePopup && closePopup.addEventListener && closePopup.addEventListener('click', function(){ popup.setAttribute('aria-hidden','true'); yesBtn.focus(); });

  // initialize
  setTimeout(()=> {
    const areaRect = buttonsArea.getBoundingClientRect();
    noBtn.style.left = `${Math.min(30, Math.max(6, areaRect.width*0.18))}px`;
    noBtn.style.top  = `${Math.min(areaRect.height*0.75, 120)}px`;
    noBtn.style.transform = 'rotate(0deg)';
  }, 80);

})();
