/* Prototype click-blocker: links and buttons do nothing when clicked, so the
   page never jumps or navigates. Hover states still work. To make one work,
   add a `data-live` attribute to it (same convention as accessories/). */
document.addEventListener('click', (e) => {
  const el = e.target.closest('a, button');
  if (el && !el.hasAttribute('data-live')) e.preventDefault();
}, true);
