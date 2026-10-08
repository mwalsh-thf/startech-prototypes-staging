/* Who we are: the same blur/rise entrance as the Why statement (css/why.css),
   but the headline comes in line by line and then the copy beneath it
   paragraph by paragraph, once each scrolls into view (css/who.css). */
(() => {
  const section = document.querySelector('.who');
  if (!section) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

  const title = section.querySelector('.who-title');
  const copy = section.querySelector('.who-copy');
  const reveal = (el, items) => {
    if (!el) return;
    items.forEach((item, i) => item.style.setProperty('--i', i));
    el.classList.add('is-armed');
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      el.classList.add('is-in');
      io.disconnect();
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0.2 });
    io.observe(el);
  };
  reveal(title, title ? Array.from(title.children) : []);
  reveal(copy, copy ? Array.from(copy.children) : []);
})();
