/* Intro section choreography.
   Reads scroll position → target values; eases the *displayed* values toward
   the targets every frame so the piece feels soft even on a scroll wheel.
   Writes everything as CSS custom properties on .intro-stage (see css/intro.css). */
(() => {
  const section = document.querySelector('.intro');
  const stage = section && section.querySelector('.intro-stage');
  const photo = section && section.querySelector('.intro-photo');
  const title = section && section.querySelector('.intro-title');
  const header = document.querySelector('.site-header');
  if (!section || !stage || !photo || !title) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Split the statement into words for the entrance ------------------ */
  // Lines are fixed by <br> in the markup; each line is a block so it never
  // rewraps, and the words inside it animate in sequence (--i is the stagger).
  const splitWords = (el) => {
    const lines = el.innerHTML.split(/<br\s*\/?>/i).map(l => l.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
    el.textContent = '';
    let i = 0;
    lines.forEach(line => {
      const row = document.createElement('span');
      row.className = 'line';
      const words = line.split(/\s+/);
      words.forEach((w, j) => {
        const span = document.createElement('span');
        span.className = 'w';
        span.style.setProperty('--i', i++);
        span.textContent = w + (j < words.length - 1 ? ' ' : '');
        row.appendChild(span);
      });
      el.appendChild(row);
    });
  };
  splitWords(title);
  // Once the entrance has finished, let the scroll logic own the hint opacity.
  setTimeout(() => stage.classList.add('is-ready'), 3200);

  /* ---- Header height → sticky offset ------------------------------------ */
  const setHeader = () => {
    const h = header ? Math.round(header.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty('--header-h', h + 'px');
  };
  setHeader();
  if (header && 'ResizeObserver' in window) new ResizeObserver(setHeader).observe(header);

  if (reduce) return;                       // CSS handles the static fallback

  /* ---- Photo placement ------------------------------------------------- */
  // Fractions of the photo where the printed yellow dot sits, measured from the file.
  const dotX = parseFloat(photo.dataset.dotX) || 0.5;
  const dotY = parseFloat(photo.dataset.dotY) || 0.5;
  const dotD = parseFloat(photo.dataset.dotD) || 0.01;  // diameter as a fraction of photo width

  let stageW = 0, stageH = 0, dotPx = 20;
  // Frame end state: `wide` is the 2:1 rounded frame inset from the page (Figma 700:249).
  const mkBox = () => ({ l: 0, t: 0, r: 0, b: 0, rad: 0, k: 1, cx: 0, cy: 0, w: 0, h: 0, cover: 0 });
  let wide = mkBox();
  const full = mkBox();                                  // the full-bleed hero frame

  const finishBox = (bx) => {
    bx.w = stageW - bx.l - bx.r; bx.h = stageH - bx.t - bx.b;
    bx.cx = bx.l + bx.w / 2; bx.cy = bx.t + bx.h / 2;
    // Smallest scale at which the (stage-covering) photo still covers the box.
    bx.k = Math.max(bx.w / stageW, bx.h / stageH) * 1.02;
    bx.cover = Math.hypot(bx.w, bx.h) * 1.02;             // circle diameter that fills the box
  };
  const mixBox = (A, B, t) => ({
    l: lerp(A.l, B.l, t), t: lerp(A.t, B.t, t), r: lerp(A.r, B.r, t), b: lerp(A.b, B.b, t),
    rad: lerp(A.rad, B.rad, t), k: lerp(A.k, B.k, t), cx: lerp(A.cx, B.cx, t), cy: lerp(A.cy, B.cy, t),
  });

  const layout = () => {
    const r = stage.getBoundingClientRect();
    stageW = r.width; stageH = r.height;
    const natW = photo.naturalWidth || 2000, natH = photo.naturalHeight || 1432;

    // Scale so the photo covers the stage *with the dot pinned at centre*.
    // The limiting edge is whichever side of the dot is shorter.
    const needW = stageW / (2 * Math.min(dotX, 1 - dotX));
    const needH = stageH / (2 * Math.min(dotY, 1 - dotY));
    const scale = Math.max(needW / natW, needH / natH) * 1.02;   // small safety margin
    const w = natW * scale, h = natH * scale;
    const x = stageW / 2 - dotX * w;
    const y = stageH / 2 - dotY * h;

    stage.style.setProperty('--photo-w', w + 'px');
    stage.style.setProperty('--photo-h', h + 'px');
    stage.style.setProperty('--photo-x', x + 'px');
    stage.style.setProperty('--photo-y', y + 'px');
    // Zoom the photo around the dot so the dot never drifts while it settles.
    stage.style.setProperty('--photo-ox', (dotX * 100) + '%');
    stage.style.setProperty('--photo-oy', (dotY * 100) + '%');

    dotPx = dotD * w;                                    // on-screen size of the printed dot

    const narrow = stageW <= 760;
    const pad = narrow ? 16 : 40;
    const headerH = header ? header.getBoundingClientRect().height : 0;
    finishBox(full);

    // Wide frame: 2:1-ish (Figma 700:254 is 1454×686), 40px in from the page
    // edges, centred in the height left under the header. If that height is
    // short, the width gives way so the ratio holds. Narrow screens use a
    // taller 4:5 frame so the promise panel still fits inside it.
    const ratio = narrow ? 1.25 : 686 / 1454;
    let ww = stageW - 2 * pad, wh = ww * ratio;
    const wAvailH = stageH - headerH - 2 * pad;
    if (wh > wAvailH) { wh = Math.max(160, wAvailH); ww = wh / ratio; }
    wide.l = wide.r = (stageW - ww) / 2;
    wide.t = headerH + pad + (wAvailH - wh) / 2;
    wide.b = stageH - wide.t - wh;
    wide.rad = Math.round(Math.min(80, wh * 0.117));      // 80px on the 686px-tall frame
    finishBox(wide);

  };

  /* ---- Easing helpers -------------------------------------------------- */
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const seg = (p, a, b) => clamp01((p - a) / (b - a));           // 0→1 across [a,b]
  const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeOutBack = (t) => { const c = 1.4; const u = t - 1; return 1 + (c + 1) * u * u * u + c * u * u; };
  const easeIn = t => t * t * t;
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---- Scroll → progress ----------------------------------------------- */
  let target = 0, shown = 0, raf = 0, lastT = 0;

  // Progress is measured in viewport heights scrolled since the section pinned.
  // Act map (see --intro-screens in css/intro.css, currently 3.4; the stage unpins after the hold):
  //  hero     0.0 → 1.4   photo + dot + white statement; the statement blurs away,
  //                       the dot grows into a yellow screen while the frame shrinks
  //                       and rounds into the 2:1 frame (Figma 665:3224 frames 1–4)
  //  reveal   0.7 → 1.8   a second circle grows from the frame's centre while the
  //                       yellow is still swallowing the corners (Figma 700:459),
  //                       masking in the cables photo (frames 4–6), which sharpens
  //                       as it grows; panel pops in 1.75 → 2.35
  //  hold     2.6 → 3.4   framed photo + panel hold (Figma 700:249), then the
  //                       stage unpins and the "Who we are" section scrolls up
  const ACT = { heroEnd: 1.4, revealStart: 0.7, revealEnd: 1.8, panelIn: 1.75 };

  const readProgress = () => {
    const top = section.getBoundingClientRect().top + window.scrollY;
    const runway = section.offsetHeight - stageH;   // header floats over the stage, so it takes no runway
    const s = (window.scrollY - top) / stageH;
    target = Math.min(runway / stageH, Math.max(0, s));
  };

  const render = (sc) => {
    const p = seg(sc, 0, ACT.heroEnd);           // hero progress 0→1
    // Hero phase map (p is 0→1):
    //  copy     0.02 → 0.34   white statement fades, blurs and sinks
    //  dot in   0.02 → 0.12   yellow circle fades in over the printed dot
    //  circle   0.12 → 0.88   printed-dot size → the 2:1 frame's diagonal (eased)
    //  frame    0.26 → 1.0    full-bleed → 2:1 rounded frame, inset from the page
    //  photo    0.15 → 0.80   eases up 1× → 1.08× and softens as it is covered
    //  nav ink  0.40 → 0.62   white → silicon as the frame's top edge leaves the header
    // Hidden at rest (the printed dot carries the photo), it fades in on top
    // of it first and only then starts to grow.
    const o = easeOut(seg(p, 0.02, 0.12));
    const c = easeInOut(seg(p, 0.12, 0.88));
    // Grow on a log curve: linear interpolation would snap through the small
    // sizes and then crawl through the huge ones.
    // It only needs to fill the 2:1 frame it ends up clipped to, not the
    // whole stage, so the corners of the frame are the last thing it covers.
    const d = Math.exp(lerp(Math.log(dotPx), Math.log(wide.cover), c));
    const t = easeIn(seg(p, 0.02, 0.34));
    const ph = easeInOut(seg(p, 0.15, 0.80));
    const a = easeInOut(seg(p, 0.26, 1.0));                        // full → wide

    const s = stage.style;
    // The yellow circle drifts from the stage centre to the frame's centre as
    // the frame shrinks, so the second circle grows out of the same point.
    s.setProperty('--circle-o', o.toFixed(3));
    s.setProperty('--circle-d', d.toFixed(2) + 'px');
    s.setProperty('--circle-dx', ((wide.cx - stageW / 2) * a).toFixed(1) + 'px');
    s.setProperty('--circle-dy', ((wide.cy - stageH / 2) * a).toFixed(1) + 'px');

    s.setProperty('--copy-opacity', (1 - t).toFixed(3));
    s.setProperty('--copy-blur', (t * 22).toFixed(2) + 'px');
    s.setProperty('--copy-y', (t * 36).toFixed(2) + 'px');
    s.setProperty('--copy-scale', (1 - t * 0.03).toFixed(4));

    // Second circle: starts while the yellow is still swallowing the frame's
    // corners and masks the cables photo in from the centre until it has
    // covered them. The photo sharpens and settles from a touch of zoom.
    const b = easeInOut(seg(sc, ACT.revealStart, ACT.revealEnd));
    s.setProperty('--b-r', (b * wide.cover / 2).toFixed(1) + 'px');
    s.setProperty('--xf-k', lerp(1.08, 1, b).toFixed(4));
    s.setProperty('--xf-b', ((1 - easeOut(seg(b, 0, 0.7))) * 14).toFixed(2) + 'px');
    // Hero photo: sharp at rest; softens and eases up as the yellow covers it.
    s.setProperty('--photo-blur', (ph * 16).toFixed(2) + 'px');
    s.setProperty('--photo-zoom', lerp(1, 1.08, ph).toFixed(4));

    // Header ink: white over the photo → silicon once the frame has dropped
    // clear of the header, and it stays silicon from then on.
    const light = 1 - easeInOut(seg(p, 0.40, 0.62));
    if (header) header.style.setProperty('--nav-light', light.toFixed(3));

    // ---- Frame: full-bleed → wide (hero) ----------------------------------
    const bx = mixBox(full, wide, a);
    s.setProperty('--f-l', bx.l.toFixed(1) + 'px');
    s.setProperty('--f-t', bx.t.toFixed(1) + 'px');
    s.setProperty('--f-r', bx.r.toFixed(1) + 'px');
    s.setProperty('--f-b', bx.b.toFixed(1) + 'px');
    s.setProperty('--f-rad', bx.rad.toFixed(1) + 'px');
    s.setProperty('--f-cx', bx.cx.toFixed(1) + 'px');
    s.setProperty('--f-cy', bx.cy.toFixed(1) + 'px');
    s.setProperty('--wrap-x', (bx.cx - stageW / 2).toFixed(1) + 'px');
    s.setProperty('--wrap-y', (bx.cy - stageH / 2).toFixed(1) + 'px');
    s.setProperty('--wrap-k', bx.k.toFixed(4));
    stage.classList.toggle('is-framed', a > 0.98 && b > 0.98);

    // Promise panel (Figma 705:538): a yellow dot appears where the button will
    // sit and stretches into a pill, then the copy and button label fade up.
    // --card-p only drives the optional white card (.intro-panel.has-card).
    const pw = seg(sc, ACT.panelIn, ACT.panelIn + 0.6);
    const dotK = lerp(0.42, 1, easeInOut(seg(pw, 0.32, 0.62)));   // dot → button size
    s.setProperty('--dot-k', (easeOutBack(seg(pw, 0, 0.18)) * dotK).toFixed(4));
    s.setProperty('--btn-open', easeInOut(seg(pw, 0.36, 0.66)).toFixed(4));
    s.setProperty('--card-p', easeOutBack(seg(pw, 0.28, 0.72)).toFixed(4));
    s.setProperty('--panel-copy-o', easeOut(seg(pw, 0.62, 1)).toFixed(3));
    s.setProperty('--btn-label-o', easeOut(seg(pw, 0.7, 1)).toFixed(3));
    s.setProperty('--panel-opacity', '1');
    s.setProperty('--panel-y', '0px');
    s.setProperty('--panel-blur', '0px');
  };

  const tick = (now) => {
    const dt = Math.min(48, now - (lastT || now)); lastT = now;
    // Frame-rate independent smoothing: ~0.12 per 16ms frame.
    const k = 1 - Math.pow(1 - 0.12, dt / 16.67);
    shown = lerp(shown, target, k);
    if (Math.abs(target - shown) < 0.0002) shown = target;
    render(shown);
    raf = (shown !== target) ? requestAnimationFrame(tick) : 0;
  };
  const kick = () => { if (!raf) { lastT = 0; raf = requestAnimationFrame(tick); } };

  const onScroll = () => { readProgress(); kick(); };
  const onResize = () => { setHeader(); layout(); readProgress(); render(shown); kick(); };

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize);
  if (photo.complete) layout(); else photo.addEventListener('load', onResize, { once: true });

  layout(); readProgress(); shown = target; render(shown);
})();
