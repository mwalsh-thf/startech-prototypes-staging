/* Yellow-dot Certified: scroll-driven stage (see css/certified.css).
   Progress `p` is how far the section top has scrolled past the viewport top,
   in viewport heights. Smoothed per frame like the intro.
   The section follows the Why tiles, so p = -1 is the instant its top enters
   at the bottom of the viewport.
    -1 → -0.45     media fades + sharpens in from the bottom of the page and
                   rises a little as it enters
    -0.1 – 0.5     heading + accordion fade up
     pin        the stage pins once the accordion block is centred in the
                viewport (p = `pinAt`) and holds for `hold` viewport heights.
   The drawers aren't scroll-driven: 01 starts open and the heads open the
   others on click, one at a time.                                          */
(() => {
  const section = document.querySelector('.certified');
  if (!section) return;

  const media  = section.querySelector('.certified-media');
  const frames = Array.from(section.querySelectorAll('.certified-frame'));
  const items  = Array.from(section.querySelectorAll('.certified-item'));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Page fades to yellow once the section top has risen above 35% of the
  // viewport (late, so the Why tiles above stay on aluminium) and until its
  // bottom passes 40% (timed CSS transition, see css/certified.css). Leaving
  // it downwards the stage fades to white (is-white-page) to meet the white
  // Connect section rather than back to aluminium. Checked on scroll so a
  // jump straight past the section (e.g. back to top) can't leave it stuck.
  {
    const html = document.documentElement;
    const syncPage = () => {
      const r = section.getBoundingClientRect();
      const vh = innerHeight;
      html.classList.toggle('is-yellow-page', r.top < vh * 0.35 && r.bottom > vh * 0.4);
      html.classList.toggle('is-white-page', r.bottom < vh * 0.4);
    };
    addEventListener('scroll', syncPage, { passive: true });
    addEventListener('resize', syncPage);
    syncPage();
  }

  // ---- Accordion: click a head to open its drawer; one open at a time. ----
  const setOpen = (idx) => {
    items.forEach((li, i) => {
      li.classList.toggle('is-open', i === idx);
      const btn = li.querySelector('.certified-item-head');
      if (btn) btn.setAttribute('aria-expanded', String(i === idx));
    });
  };
  items.forEach((li, i) => {
    const btn = li.querySelector('.certified-item-head');
    if (btn) btn.addEventListener('click', () => setOpen(i));
  });

  if (reduce) return;                       // CSS shows the static layout

  const stage = section.querySelector('.certified-stage');
  const ACT = { revealStart: -1, revealEnd: -0.45, copyStart: -0.1, copyEnd: 0.5,
                hold: 0.5 };
  const RISE_PX = 80;                       // how far the media rises as it enters
  const PIN_DROP = 40;                      // px the pinned accordion sits below centre
  const PIN_GAP = 24;                       // min px kept between the accordion and the viewport bottom
  let pinAt = 0;

  // The stage scrolls until the accordion row reaches the middle of the
  // viewport, then pins there (never leaving the stage bottom above the
  // viewport bottom). The runway is sized from the stage's real height.
  const row = section.querySelector('.certified-row');
  const layout = () => {
    const vh = window.innerHeight || 1;
    stage.style.paddingBottom = '';          // measure with the CSS padding
    // Measure with drawer 01 open (the pinned state), whatever is open now.
    section.classList.add('is-measuring');
    const was = items.map((li) => li.classList.contains('is-open'));
    items.forEach((li, i) => li.classList.toggle('is-open', i === 0));
    let h = stage.offsetHeight;
    const rowTop = row ? row.offsetTop : 0;
    const rowH = row ? row.offsetHeight : 0;
    items.forEach((li, i) => li.classList.toggle('is-open', was[i]));
    void stage.offsetHeight;                 // settle before transitions return
    section.classList.remove('is-measuring');
    // Centre the whole accordion block in the viewport once pinned, then sit
    // it PIN_DROP lower so the accordion clears the fixed header's logo.
    // On short screens that drop would push the last drawer off the bottom of
    // the viewport, so it never sits lower than PIN_GAP above the bottom edge.
    const centred = (vh - rowH) / 2 - rowTop + PIN_DROP;
    const fitBottom = vh - PIN_GAP - rowTop - rowH;
    const pinTop = Math.min(0, Math.round(Math.min(centred, fitBottom)));
    // If that would lift the stage bottom off the viewport bottom, add page
    // beneath the accordion so the stage still fills the screen.
    const extra = (vh - h) - pinTop;
    if (extra > 0) {
      const base = parseFloat(getComputedStyle(stage).paddingBottom) || 0;
      stage.style.paddingBottom = (base + extra).toFixed(1) + 'px';
      h = stage.offsetHeight;
    }
    pinAt = -pinTop / vh;
    s.setProperty('--cert-pin-top', pinTop.toFixed(1) + 'px');
    const runway = pinAt + ACT.hold;
    s.height = (runway * vh + h).toFixed(0) + 'px';
  };
  const HOLD_MS = 500;                      // spritz hold per still

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const seg = (p, a, b) => clamp01((p - a) / (b - a));
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  // ---- Spritz -------------------------------------------------------------
  let timer = null, active = 0;
  const show = (i) => {
    frames[active].classList.remove('is-active');
    active = (i + frames.length) % frames.length;
    frames[active].classList.add('is-active');
  };
  const startSpritz = () => {
    if (timer || frames.length < 2) return;
    timer = setInterval(() => show(active + 1), HOLD_MS);
  };
  const stopSpritz = () => {
    if (!timer) return;
    clearInterval(timer); timer = null;
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopSpritz();
  });

  // ---- Scroll state -------------------------------------------------------
  const s = section.style;
  let target = 0, cur = 0, rafId = 0, running = false, primed = false;

  const measure = () => {
    const r = section.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    target = -r.top / vh;
    const inView = r.top < vh && r.bottom > 0;
    if (!inView) { stopSpritz(); return false; }
    return true;
  };

  const render = (p) => {
    // Act 1: the media fades + sharpens in while rising from the page bottom.
    const rv = easeOut(seg(p, ACT.revealStart, ACT.revealEnd));
    s.setProperty('--cert-media-o', Math.min(1, rv * 1.6).toFixed(3));
    s.setProperty('--cert-media-y', ((1 - rv) * RISE_PX).toFixed(1) + 'px');
    s.setProperty('--cert-media-blur', ((1 - rv) * 28).toFixed(2) + 'px');
    s.setProperty('--cert-media-scale', (1 + (1 - rv) * 0.06).toFixed(4));
    section.classList.toggle('is-revealed', rv >= 0.995);
    if (rv > 0.15 && target < 99) startSpritz();

    // Act 2: copy fades up.
    const cp = easeOut(seg(p, ACT.copyStart, ACT.copyEnd));
    s.setProperty('--cert-copy-opacity', cp.toFixed(3));
    s.setProperty('--cert-copy-y', ((1 - cp) * 40).toFixed(1) + 'px');
  };

  const tick = () => {
    const inView = measure();
    if (!inView) { running = false; return; }
    if (!primed) { cur = target; primed = true; }   // no settle-in from 0 on first sight
    cur += (target - cur) * 0.14;
    if (Math.abs(target - cur) < 0.0005) cur = target;
    render(cur);
    rafId = requestAnimationFrame(tick);
  };
  const wake = () => {
    if (running) return;
    running = true;
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  };

  window.addEventListener('scroll', wake, { passive: true });
  window.addEventListener('resize', () => { layout(); wake(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  layout();
  wake();
})();
