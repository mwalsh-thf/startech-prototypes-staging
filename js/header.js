/* Header scroll behaviour (see .site-header.is-hidden / .is-pill in css/styles.css).
   Scrolling down past the bar hides it. Scrolling up brings it back; away from
   the top it comes back as a white pill, and at the top it is the plain
   full-width bar again. On the Who we are page the bar also stays put, in its
   full-width state, until the intro has scrolled up past it. When the intro
   stage unpins, the framed video's top edge pushes the bar up off the screen
   (--hdr-push) so the two never overlap. */
(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const TOP = 8;          // px: at or above this the bar is in its full-width state
  const HIDE_AFTER = 120; // px: never hide before the bar has fully scrolled past
  const SLACK = 4;        // px: ignore tiny jitter / rubber-banding

  const hold = document.querySelector('.intro');  // keep the bar in place over this
  const stage = hold && hold.querySelector('.intro-stage');

  // How far the framed video's top edge has risen into the bar (px, ≤ 0).
  // Only once the sticky stage has unpinned; while pinned the frame grows
  // from full-bleed under the bar, which is meant to overlap.
  const pushFor = () => {
    const h = header.offsetHeight;
    const top = stage.getBoundingClientRect().top;
    if (top >= 0) return 0;
    const ft = parseFloat(stage.style.getPropertyValue('--f-t')) || 0;
    return Math.max(-h * 1.1, Math.min(0, top + Math.max(0, ft - h)));
  };

  let last = window.scrollY, ticking = false, wasHolding = false;

  const update = () => {
    ticking = false;
    const y = Math.max(0, window.scrollY);
    const delta = y - last;

    const holding = hold && hold.getBoundingClientRect().bottom > header.offsetHeight;

    const push = holding && stage ? pushFor() : 0;
    header.classList.toggle('is-pushed', push < 0);
    header.style.setProperty('--hdr-push', push.toFixed(1) + 'px');

    if (y <= TOP || holding) {
      header.classList.remove('is-hidden', 'is-pill');
    } else if (wasHolding && delta > 0) {
      header.classList.add('is-hidden');      // leaving the intro downwards: stay off screen
    } else if (delta > SLACK && y > HIDE_AFTER) {
      header.classList.add('is-hidden');
    } else if (delta < -SLACK) {
      header.classList.remove('is-hidden');
      header.classList.add('is-pill');
    }
    if (Math.abs(delta) > SLACK || y <= TOP || holding) last = y;
    wasHolding = holding;
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });

  // Keep the bar usable while something inside it has focus (keyboard users).
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  update();
})();

/* Magnetic dot: when the pointer comes close to the logo's yellow dot, the
   dot alone leans towards it by at most ~1.5px (the wordmark stays put), eased
   back to rest as the pointer leaves. Mouse only. */
(() => {
  const dot = document.querySelector('.site-header .logo-dot');
  if (!dot) return;
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const RANGE = 60;   // px from the dot's centre where the pull starts
  const RANGE_RIGHT = 110;  // reaches further out to the right, past the logo's end
  const MAX = 1.5;    // px: furthest the dot ever moves
  const EASE = 0.12;  // per-frame smoothing

  let tx = 0, ty = 0, x = 0, y = 0, raf = 0;

  const frame = () => {
    x += (tx - x) * EASE;
    y += (ty - y) * EASE;
    if (Math.abs(tx - x) < 0.01 && Math.abs(ty - y) < 0.01) { x = tx; y = ty; raf = 0; }
    dot.style.transform = x || y ? `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)` : '';
    if (raf) raf = requestAnimationFrame(frame);
  };
  const aim = (nx, ny) => {
    tx = nx; ty = ny;
    if (!raf) raf = requestAnimationFrame(frame);
  };

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = dot.getBoundingClientRect();
    // Measured from where the dot sits at rest, so its own drift doesn't feed back.
    const ox = e.clientX - (r.left + r.width / 2 - x);
    const oy = e.clientY - (r.top + r.height / 2 - y);
    const d = Math.hypot(ox, oy);
    // Stretch the zone out to the right: the pull is felt as far as RANGE_RIGHT
    // on that side, falling off just as gently.
    const reachX = ox > 0 ? RANGE / RANGE_RIGHT : 1;
    const pull = 1 - Math.min(1, Math.hypot(ox * reachX, oy) / RANGE);
    if (pull <= 0 || d === 0) { aim(0, 0); return; }
    // Full lean once the pointer is past the dot's own radius, less on top of it.
    const reach = Math.min(1, d / (r.width / 2 || 1));
    const k = MAX * pull * pull * reach / d;  // stronger the closer it gets
    aim(ox * k, oy * k);
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => aim(0, 0));
})();
