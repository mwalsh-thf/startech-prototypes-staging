/* Footer.
   1. Wordmark letters rise in once it scrolls into view (.is-in).
   2. html.is-footer-page while the footer is on screen, so the page canvas
      (Safari's overscroll bounce) matches the silicon footer. */
(() => {
  const footer = document.querySelector('.site-footer');
  const wm = footer && footer.querySelector('.ft-wm');
  if (!footer) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!('IntersectionObserver' in window)) {
    if (wm) wm.classList.add('is-in');
    return;
  }

  if (wm) {
    if (reduce) wm.classList.add('is-in');
    else {
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        wm.classList.add('is-in');
        io.disconnect();
      }, { threshold: 0.2 });
      io.observe(wm);
    }
  }

  new IntersectionObserver((entries) => {
    document.documentElement.classList.toggle('is-footer-page', entries[0].isIntersecting);
  }).observe(footer);
})();
