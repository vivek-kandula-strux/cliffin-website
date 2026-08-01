/**
 * Premium micro-interactions — React-quality motion, vanilla GSAP stack.
 *
 * Catalogue:
 *   1. initCounters       — hero stats count up on scroll-enter
 *   2. initTextScramble   — "freedom" word resolves from random chars post-hero
 *   3. initCardTilt       — 3-D perspective tilt + specular highlight on hover
 *   4. initCustomCursor   — dot + lagging ring cursor, morphs over interactives
 *   5. initPlayPulse      — repeating emanation rings on the video play button
 *   6. initButtonRipple   — material-style click ripple on all .btn elements
 *   7. initIconBounce     — .icon-chip pops in with back.out spring on scroll
 *   8. initImageHoverPan  — tile images drift toward cursor on hover
 *   9. initScrollParallax — scrub-based depth shift on section feature images
 *  10. initTerrainReveal  — closing-scene hiker band: mask fade-in + horizontal drift on scroll
 */

import { qs, qsa, prefersReducedMotion } from '../utils/dom.js';

export function initMicro(gsap, ScrollTrigger) {
  const reduced = prefersReducedMotion();
  const fine    = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Always run — imperceptible or purely structural
  initButtonRipple();
  initPlayPulse(gsap);

  if (reduced) return;

  initCounters(gsap, ScrollTrigger);
  initIconBounce(gsap, ScrollTrigger);
  initScrollParallax(gsap, ScrollTrigger);
  initTerrainReveal(gsap, ScrollTrigger);
  initTextScramble(gsap);

  if (!fine) return;

  initCustomCursor(gsap);
  initCardTilt(gsap);
  initImageHoverPan(gsap);
}

/* ─────────────────────────────────────────────────────────────
   1. COUNTER ANIMATIONS
   Reads [data-count="N"] + optional [data-count-k] (appends "k").
   Hero stats get a 2.1 s delay so they count up after the
   hero entrance timeline finishes revealing them.
───────────────────────────────────────────────────────────── */
function initCounters(gsap, ScrollTrigger) {
  qsa('[data-count]').forEach(el => {
    const target  = parseFloat(el.dataset.count);
    const isK     = el.hasAttribute('data-count-k');
    const suffix  = isK ? 'k' : '';
    const inHero  = !!el.closest('[data-hero]');
    // First child text-node holds the raw number (before the <span> child)
    const textNode = [...el.childNodes].find(n => n.nodeType === Node.TEXT_NODE);
    if (!textNode) return;

    ScrollTrigger.create({
      trigger : el,
      start   : 'top 90%',
      once    : true,
      onEnter() {
        // Delay in hero: entrance timeline completes at ~1.8 s
        gsap.delayedCall(inHero ? 2.1 : 0, () => {
          const obj = { val: 0 };
          textNode.textContent = '0' + suffix;
          gsap.to(obj, {
            val      : target,
            duration : 1.7,
            ease     : 'power2.out',
            onUpdate()  { textNode.textContent = Math.round(obj.val) + suffix; },
            onComplete(){ textNode.textContent = target + suffix; },
          });
        });
      },
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   2. TEXT SCRAMBLE
   [data-scramble] resolves from random chars to its real text.
   Fires ~1.9 s after load — after hero copy has landed.
───────────────────────────────────────────────────────────── */
function initTextScramble(gsap) {
  const el = qs('[data-scramble]');
  if (!el) return;

  const original = el.textContent;
  const POOL     = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjklmnpqrstuvwxyz023456789!#@';
  const FRAMES   = 22;
  let   frame    = 0;

  gsap.delayedCall(1.95, () => {
    const id = setInterval(() => {
      el.textContent = original
        .split('')
        .map((ch, i) =>
          i < (frame / FRAMES) * original.length
            ? original[i]
            : POOL[Math.floor(Math.random() * POOL.length)]
        )
        .join('');

      if (++frame > FRAMES) {
        el.textContent = original;
        clearInterval(id);
      }
    }, 42);
  });
}

/* ─────────────────────────────────────────────────────────────
   3. 3-D CARD TILT
   Perspective tilt on all non-hero image tiles, cards, feature
   blocks and light quote cards. A specular highlight div tracks
   the tilt direction to imply a real light source.
───────────────────────────────────────────────────────────── */
function initCardTilt(gsap) {
  const all = qsa('.tile--image, .card, .feature, .quote--light');
  const els = all.filter(
    el =>
      !el.closest('[data-hero]') &&
      !el.classList.contains('tile--cta-row') &&
      !el.classList.contains('tile--dark')
  );

  els.forEach(el => {
    // Specular highlight overlay
    const shine = document.createElement('span');
    shine.setAttribute('aria-hidden', 'true');
    shine.style.cssText = [
      'position:absolute', 'inset:0', 'border-radius:inherit',
      'background:radial-gradient(ellipse 55% 35% at 50% 50%,oklch(1 0 0 / 0.09),transparent 68%)',
      'pointer-events:none', 'opacity:0', 'z-index:3',
      'transition:opacity 0.3s ease',
    ].join(';');
    el.style.position = 'relative';
    el.appendChild(shine);

    gsap.set(el, { transformPerspective: 900 });

    const MAX = 6; // degrees
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

    const step = () => {
      cx += (tx - cx) * 0.1;
      cy += (ty - cy) * 0.1;
      gsap.set(el, { rotationY: cx, rotationX: cy });
      const px = ((cx / MAX) * 0.5 + 0.5) * 100;
      const py = ((-cy / MAX) * 0.5 + 0.5) * 100;
      shine.style.backgroundImage =
        `radial-gradient(ellipse 55% 35% at ${px.toFixed(1)}% ${py.toFixed(1)}%,oklch(1 0 0 / 0.1),transparent 68%)`;

      if (Math.abs(tx - cx) > 0.02 || Math.abs(ty - cy) > 0.02) {
        raf = requestAnimationFrame(step);
      } else {
        raf = null;
      }
    };

    el.addEventListener('pointerenter', () => { shine.style.opacity = '1'; });
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      tx =  ((e.clientX - r.left) / r.width  - 0.5) * MAX * 2;
      ty = -((e.clientY - r.top)  / r.height - 0.5) * MAX * 2;
      if (!raf) raf = requestAnimationFrame(step);
    });
    el.addEventListener('pointerleave', () => {
      tx = 0; ty = 0;
      shine.style.opacity = '0';
      if (!raf) raf = requestAnimationFrame(step);
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   4. CUSTOM CURSOR
   #cursor-dot (small, instant) + #cursor-ring (large, lagging).
   Ring scale-morphs when hovering interactive elements.
   Adds .custom-cursor to <html> so CSS hides the native cursor.
───────────────────────────────────────────────────────────── */
function initCustomCursor(gsap) {
  const dot  = qs('#cursor-dot');
  const ring = qs('#cursor-ring');
  if (!dot || !ring) return;

  document.documentElement.classList.add('custom-cursor');

  // Start off-screen so they don't flash at 0,0 before first move
  let mx = -300, my = -300;
  let dx = -300, dy = -300;
  let rx = -300, ry = -300;
  let raf = null;

  const tick = () => {
    dx += (mx - dx) * 0.9;
    dy += (my - dy) * 0.9;
    rx += (mx - rx) * 0.13;
    ry += (my - ry) * 0.13;
    dot.style.transform  = `translate3d(${dx.toFixed(1)}px,${dy.toFixed(1)}px,0)`;
    ring.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`;
    raf = (Math.abs(mx - rx) > 0.1 || Math.abs(my - ry) > 0.1)
      ? requestAnimationFrame(tick)
      : null;
  };

  document.addEventListener('pointermove', e => {
    mx = e.clientX; my = e.clientY;
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0'; ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity = '1'; ring.style.opacity = '1';
  });

  // Hover state — event delegation to catch all interactives
  const HOVER_SEL = 'a, button, .btn, input, select, textarea, label, [role="button"], .tile--image, .card, .play-btn';
  document.addEventListener('pointerover', e => {
    if (e.target.closest?.(HOVER_SEL)) ring.classList.add('is-hover');
  });
  document.addEventListener('pointerout', e => {
    if (!e.relatedTarget?.closest?.(HOVER_SEL)) ring.classList.remove('is-hover');
  });
}

/* ─────────────────────────────────────────────────────────────
   5. PLAY-BUTTON PULSE
   Two GSAP loops staggered by 0.9 s create the double-ring
   sonar pulse around the video play button.
───────────────────────────────────────────────────────────── */
function initPlayPulse(gsap) {
  const play = qs('.play-btn');
  if (!play) return;

  // Ensure overflow is visible so rings can expand outside the button
  play.style.overflow = 'visible';

  [0, 0.9].forEach(delay => {
    const ring = document.createElement('span');
    ring.className = 'play-pulse';
    ring.setAttribute('aria-hidden', 'true');
    play.appendChild(ring);
    gsap.fromTo(
      ring,
      { scale: 0.7, autoAlpha: 0.65 },
      { scale: 2.5, autoAlpha: 0, duration: 2.3, ease: 'power1.out', repeat: -1, delay }
    );
  });
}

/* ─────────────────────────────────────────────────────────────
   6. BUTTON RIPPLE
   pointerdown on any .btn spawns a span that expands outward
   via CSS animation, then removes itself on animationend.
───────────────────────────────────────────────────────────── */
function initButtonRipple() {
  qsa('.btn').forEach(btn => {
    btn.addEventListener('pointerdown', e => {
      const r      = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      ripple.style.left = `${e.clientX - r.left}px`;
      ripple.style.top  = `${e.clientY - r.top}px`;
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   7. ICON CHIP BOUNCE
   Each .icon-chip pops in with a back.out spring after its
   parent feature enters the viewport. Delay of 0.28 s lets
   the parent fade settle before the chip announces itself.
───────────────────────────────────────────────────────────── */
function initIconBounce(gsap, ScrollTrigger) {
  qsa('.icon-chip').forEach(chip => {
    ScrollTrigger.create({
      trigger : chip,
      start   : 'top 88%',
      once    : true,
      onEnter() {
        gsap.fromTo(
          chip,
          { scale: 0.45, rotation: -14, autoAlpha: 0 },
          { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.58, ease: 'back.out(2.6)', delay: 0.28 }
        );
      },
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   8. IMAGE HOVER PAN
   On pointer move over a .tile--image, the <img> inside pans
   subtly toward the cursor for a tactile parallax sense of depth.
   The hero tile is excluded (it has its own pointer parallax).
───────────────────────────────────────────────────────────── */
function initImageHoverPan(gsap) {
  qsa('.tile--image').filter(tile => !tile.closest('[data-hero]')).forEach(tile => {
    const img = tile.querySelector('img');
    if (!img || img.hasAttribute('data-hero-parallax')) return;

    tile.addEventListener('pointermove', e => {
      const r  = tile.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width  - 0.5;
      const ny = (e.clientY - r.top)  / r.height - 0.5;
      gsap.to(img, { x: nx * 16, y: ny * 10, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
    });
    tile.addEventListener('pointerleave', () => {
      gsap.to(img, { x: 0, y: 0, duration: 0.85, ease: 'power3.out', overwrite: 'auto' });
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   9. SCROLL PARALLAX
   Each non-hero tile image shifts ±8 % on its Y axis as the
   tile scrolls through the viewport — a subtle depth layer that
   makes the page feel cinematic without full Lenis overhead.
───────────────────────────────────────────────────────────── */
function initScrollParallax(gsap, ScrollTrigger) {
  qsa('.tile--image img')
    .filter(img => !img.hasAttribute('data-hero-parallax') && !img.closest('[data-hero]'))
    .forEach(img => {
      const tile = img.closest('.tile--image');
      if (!tile) return;
      gsap.fromTo(
        img,
        { y: '-8%' },
        {
          y    : '8%',
          ease : 'none',
          scrollTrigger: {
            trigger           : tile,
            start             : 'top bottom',
            end               : 'bottom top',
            scrub             : 1.8,
            invalidateOnRefresh: true,
          },
        }
      );
    });
}

/* ─────────────────────────────────────────────────────────────
   10. TERRAIN REVEAL
   Two scrub-linked animations on the closing-scene hiker band:
     a) mask-image fade — hikers rise from the CTA's darkness as
        the band enters the viewport (95% → 18% fade zone).
     b) object-position drift — the crop pans horizontally as the
        section moves through the viewport (58% → 42%), so the
        hikers appear to march across.
   Both driven via CSS variables that CSS references in mask-image
   and object-position — avoids GSAP inline-style clobbering.
───────────────────────────────────────────────────────────── */
function initTerrainReveal(gsap, ScrollTrigger) {
  const terrain = qs('.footer-terrain');
  const img     = terrain?.querySelector('img');
  if (!terrain || !img) return;

  // We set mask-image + object-position as full inline strings on every tick.
  // CSS-var indirection is unreliable across browsers for mask-image repaints
  // unless the var is registered with @property (which we do in CSS as a
  // second line of defense) — but string-setting is bulletproof.
  const applyMask = (fadePct) => {
    const val = `linear-gradient(to bottom, transparent 0%, black ${fadePct.toFixed(1)}%)`;
    img.style.maskImage = val;
    img.style.webkitMaskImage = val;
  };
  const applyPan = (panPct) => {
    img.style.objectPosition = `${panPct.toFixed(1)}% 62%`;
  };

  // Prime the initial state so the hikers are hidden before the trigger fires.
  applyMask(95);
  applyPan(58);

  // (a) Mask reveal — completes as the band settles into view.
  const revealState = { p: 0 };
  gsap.to(revealState, {
    p: 1,
    ease: 'none',
    scrollTrigger: {
      trigger : terrain,
      start   : 'top bottom',
      end     : 'top 55%',
      scrub   : 1,
      invalidateOnRefresh: true,
    },
    onUpdate() {
      applyMask(95 - (95 - 18) * revealState.p);
    },
  });

  // (b) Horizontal drift — subtle march across the full scroll range.
  const driftState = { p: 0 };
  gsap.to(driftState, {
    p: 1,
    ease: 'none',
    scrollTrigger: {
      trigger : terrain,
      start   : 'top bottom',
      end     : 'bottom top',
      scrub   : 1.4,
      invalidateOnRefresh: true,
    },
    onUpdate() {
      applyPan(58 - (58 - 42) * driftState.p);
    },
  });
}
