/* Who we are: the page fades to silicon (white text) while the section
   crosses the middle band of the viewport, like the yellow fade on the
   Certified section. The fade itself is a CSS transition (css/who.css). */
(() => {
  const section = document.querySelector('.who');
  if (!section) return;
  // Dark from when the section top passes 60% of the viewport until the copy
  // under the headline has scrolled out of view at the top, so the whole
  // section reads on silicon before the page lifts back to aluminium. Checked
  // on scroll (not an observer) so a fast scroll or a jump can't leave it stuck on.
  // Leaving the dark state is a longer, softer fade (is-dark-leaving, see
  // css/who.css) than going in.
  const html = document.documentElement;
  const copy = section.querySelector('.who-copy') || section;
  let leaveTimer = 0;
  const sync = () => {
    const vh = innerHeight;
    const dark = section.getBoundingClientRect().top < vh * 0.6 &&
                 copy.getBoundingClientRect().bottom > 0;
    const was = html.classList.contains('is-dark-page');
    if (dark === was) return;
    clearTimeout(leaveTimer);
    html.classList.toggle('is-dark-leaving', !dark);
    if (!dark) leaveTimer = setTimeout(() => html.classList.remove('is-dark-leaving'), 1200);
    html.classList.toggle('is-dark-page', dark);
  };
  addEventListener('scroll', sync, { passive: true });
  addEventListener('resize', sync);
  sync();
})();
