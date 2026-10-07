/* Culture / Careers tiles.
   1. Add .is-in once the tiles scroll into view (stagger from --i in css).
   2. Subtle parallax: each image is 20% taller than its tile (css) and
      slides by up to half that overflow as the tile crosses the viewport.
   The hover grow/shrink is pure css (flex-grow). */
(() => {
  const tiles = Array.from(document.querySelectorAll('.cc-tile'));
  if (!tiles.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduce) {
    const imgs = tiles.map((t) => t.querySelector('.cc-img')).filter(Boolean);
    let ticking = false;
    const parallax = () => {
      ticking = false;
      const vh = window.innerHeight || 1;
      imgs.forEach((img) => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        // -1 when the tile is just below the viewport, +1 when just above.
        const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / ((vh + r.height) / 2)));
        img.style.setProperty('--plx-y', (-p * r.height * 0.1).toFixed(1) + 'px');
      });
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(parallax);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    parallax();
  }

  if (reduce || !('IntersectionObserver' in window)) {
    tiles.forEach((t) => t.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  tiles.forEach((t) => io.observe(t));
})();
