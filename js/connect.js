/* Connect with us.
   Add .is-in once the intro and each column scroll into view; the copy then fades and
   slides up line by line (stagger from --i in css). */
(() => {
  const items = Array.from(document.querySelectorAll('.connect-intro, .connect-item'));
  if (!items.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });
  items.forEach((el) => io.observe(el));
})();
