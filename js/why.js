/* Why Startech tiles.
   1. Add .is-in to each tile as it scrolls into view. Tiles that arrive
      together (the desktop row) get --i = 0, 1, 2 in page order, which
      css/why.css turns into a transition-delay stagger; stacked on mobile
      they arrive one at a time.
   2. Subtle parallax on the tile photos.
   3. Word-by-word blur/fade entrance on the statement. */
(() => {
  const section = document.querySelector('.why');
  const tiles = Array.from(document.querySelectorAll('.why-tile'));
  if (!section || !tiles.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Statement: split into words (--i is the stagger) and reveal them with a
     blur/fade once the heading scrolls into view (css/why.css). */
  const title = section.querySelector('.why-title');
  if (title && !reduce && 'IntersectionObserver' in window) {
    const words = title.textContent.trim().split(/\s+/);
    title.setAttribute('aria-label', words.join(' '));
    title.textContent = '';
    words.forEach((w, i) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.setAttribute('aria-hidden', 'true');
      span.style.setProperty('--i', i);
      span.textContent = w + (i < words.length - 1 ? ' ' : '');
      title.appendChild(span);
    });
    const tio = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      title.classList.add('is-in');
      tio.disconnect();
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0.2 });
    tio.observe(title);
  }

  /* Subtle parallax: each image is 20% taller than its frame (css), and
     slides by up to half that overflow as the tile crosses the viewport. */
  if (!reduce) {
    const imgs = tiles.map((t) => t.querySelector('.why-tile-img')).filter(Boolean);
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
    entries
      .filter((e) => e.isIntersecting)
      .map((e) => e.target)
      .sort((a, b) => tiles.indexOf(a) - tiles.indexOf(b))
      .forEach((t, k) => {
        t.style.setProperty('--i', k);
        t.classList.add('is-in');
        io.unobserve(t);
      });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });
  tiles.forEach((t) => io.observe(t));
})();
