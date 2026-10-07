/* Who we are: the page fades to silicon (white text) while the section
   crosses the middle band of the viewport, like the yellow fade on the
   Certified section. The fade itself is a CSS transition (css/who.css). */
(() => {
  const section = document.querySelector('.who');
  if (!section) return;
  // Dark while the section top is above 60% of the viewport and its bottom
  // is still below 80%, so the page is back on aluminium as soon as the Why
  // section starts coming up. Checked on scroll (not an observer) so a fast
  // scroll or a jump can't leave it stuck on.
  const sync = () => {
    const r = section.getBoundingClientRect();
    const vh = innerHeight;
    document.documentElement.classList.toggle('is-dark-page', r.top < vh * 0.6 && r.bottom > vh * 0.8);
  };
  addEventListener('scroll', sync, { passive: true });
  addEventListener('resize', sync);
  sync();
})();
