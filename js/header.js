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
