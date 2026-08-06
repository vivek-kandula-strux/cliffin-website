/**
 * Premium micro-interactions — React-quality motion, vanilla GSAP stack.
 *
 * Catalogue:
 *   1. initCounters          — hero stats count up on scroll-enter
 *   2. initTextScramble      — "freedom" word resolves from random chars post-hero
 *   3. initCardTilt          — 3-D perspective tilt + specular highlight on hover
 *   4. initCustomCursor      — dot + lagging ring cursor, morphs over interactives
 *   5. initPlayPulse         — repeating emanation rings on the video play button
 *   6. initButtonRipple      — material-style click ripple on all .btn elements
 *   7. initIconBounce        — .icon-chip pops in with back.out spring on scroll
 *   8. initImageHoverPan     — tile images drift toward cursor on hover
 *   9. initScrollParallax    — scrub-based depth shift on tile feature images
 *  10. initCardMediaParallax — scrub-based depth shift on .card__media images
 *  11. initInteriorHeroDrift — inner-page hero image drifts up as section scrolls out
 *  12. initParallaxScenes    — sticky-pinned scene with layered depth (base/mist/scrim)
 *  13. initTerrainReveal     — closing-scene mountain band: mask fade-in + Y-drift
 *  14. initDataParallax      — reusable [data-parallax] API for any element
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
  initCardMediaParallax(gsap, ScrollTrigger);
  initInteriorHeroDrift(gsap, ScrollTrigger);
  initParallaxScenes(gsap, ScrollTrigger);
  initTerrainReveal(gsap, ScrollTrigger);
  initDataParallax(gsap, ScrollTrigger);
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
      start   : 'top bottom',
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
      start   : 'top bottom',
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

   Mobile skipped: touch scroll velocity is uneven and Lenis is
   disabled there (smoothTouch: false), so scrub reads as jerky
   rather than smooth. The extra per-frame inline-transform writes
   also cost more on mobile GPUs relative to the barely-visible
   ±8 % effect on a small viewport.
───────────────────────────────────────────────────────────── */
function initScrollParallax(gsap, ScrollTrigger) {
  if (window.matchMedia('(max-width: 767px)').matches) return;

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
   10. PARALLAX SCENE
   Sticky-pinned scene with 3 depth layers. Sticky positioning
   handles the pin (cheaper than ScrollTrigger.pin — no element
   cloning); GSAP handles the layer transforms across the full
   scene scroll range for a smooth breathing motion through pin.

   Bails on mobile / reduced-motion where the CSS collapses the
   sticky element to static — no animation needed then.
───────────────────────────────────────────────────────────── */
function initParallaxScenes(gsap, ScrollTrigger) {
  qsa('[data-parallax-scene]').forEach(scene => {
    const sticky = scene.querySelector('.parallax-scene__sticky');
    if (!sticky || getComputedStyle(sticky).position !== 'sticky') return;

    const base = scene.querySelector('.parallax-scene__layer--base');
    const mist = scene.querySelector('.parallax-scene__layer--mist');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger : scene,
        start   : 'top bottom',
        end     : 'bottom top',
        scrub   : 1.2,
        invalidateOnRefresh: true,
      },
    });

    if (base) {
      tl.fromTo(base,
        { scale: 1.15, yPercent: -4 },
        { scale: 1.0,  yPercent: 4, ease: 'none' },
        0
      );
    }
    if (mist) {
      tl.fromTo(mist,
        { autoAlpha: 0,   yPercent: -8 },
        { autoAlpha: 0.7, yPercent: 6, ease: 'none' },
        0
      );
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   11. TERRAIN REVEAL
   Two coordinated scrub tweens on the closing-scene mountain band:
     • Fade-in as the band first enters the viewport (0 → 220 px)
     • Slow Y-drift across the full traversal (image sits with a
       small base scale so translate stays within cover bounds and
       never exposes bare background at the top or bottom).
   Distance is deliberately restrained (~6 % of image height) so
   the mountains feel like they're being observed from a boat that
   is barely moving — not tumbling past.
───────────────────────────────────────────────────────────── */
function initTerrainReveal(gsap, ScrollTrigger) {
  const terrain = qs('.footer-terrain');
  const img     = terrain?.querySelector('img');
  if (!terrain || !img) return;

  gsap.fromTo(img,
    { autoAlpha: 0 },
    {
      autoAlpha: 1,
      ease: 'none',
      scrollTrigger: {
        trigger : terrain,
        start   : 'top bottom',
        end     : '+=220',
        scrub   : 1,
        invalidateOnRefresh: true,
      },
    }
  );

  // Y-drift: image starts slightly below its rest position and drifts
  // up as the section moves through the viewport. Base scale 1.06 keeps
  // object-fit:cover fully covered at both extremes of the translate.
  gsap.fromTo(img,
    { yPercent: 6, scale: 1.06 },
    {
      yPercent: -6,
      scale: 1.06,
      ease: 'none',
      scrollTrigger: {
        trigger : terrain,
        start   : 'top bottom',
        end     : 'bottom top',
        scrub   : 1.4,
        invalidateOnRefresh: true,
      },
    }
  );
}

/* ─────────────────────────────────────────────────────────────
   10b. CARD MEDIA PARALLAX
   Mirrors initScrollParallax but for .card__media images (used on
   Upcoming Expeditions, Adventure Workshops, Corporate & School
   Programs pages). Same ±8 % Y range and same overflow contract
   (parent .card__media has overflow:hidden) so nothing spills.
   Skips the light-tilt cards (initCardTilt) target set — GSAP just
   composes the y transform into the tilt matrix at animation time.
───────────────────────────────────────────────────────────── */
function initCardMediaParallax(gsap, ScrollTrigger) {
  // Mobile skipped — same reasoning as initScrollParallax above. Also,
  // card grids on mobile often collapse to single-column with the card
  // media occupying most of the visible viewport, which means many
  // scrub tweens would all be firing simultaneously per scroll frame.
  if (window.matchMedia('(max-width: 767px)').matches) return;

  qsa('.card__media img').forEach(img => {
    const media = img.closest('.card__media');
    if (!media) return;
    // Base scale 1.1 keeps the ±8 % Y translate inside object-fit:cover
    // bounds so bare card background never peeks through at the edges.
    gsap.fromTo(
      img,
      { yPercent: -8, scale: 1.1 },
      {
        yPercent: 8,
        scale: 1.1,
        ease: 'none',
        scrollTrigger: {
          trigger           : media,
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
   11b. INTERIOR HERO DRIFT
   Inner-page heroes (.hero-banner, not .hero-banner--home) use a
   full-bleed background image inside .hero-banner__media. As the
   hero scrolls out of view, the image drifts up by ~14 % of its
   own height, giving the header a "camera continuing to move"
   feel. Home hero is skipped — its cursor parallax owns the img
   transform, and mixing scrub + pointer writes causes flicker.
   Mobile skipped: interior heroes are short there and the effect
   reads as a jump rather than depth. Base scale 1.14 keeps the
   translate inside cover bounds.
───────────────────────────────────────────────────────────── */
function initInteriorHeroDrift(gsap, ScrollTrigger) {
  if (window.matchMedia('(max-width: 767px)').matches) return;

  qsa('.hero-banner').forEach(hero => {
    if (hero.classList.contains('hero-banner--home')) return;
    const img = hero.querySelector('.hero-banner__media img');
    if (!img) return;

    gsap.fromTo(
      img,
      { yPercent: 0, scale: 1.14 },
      {
        yPercent: -14,
        scale: 1.14,
        ease: 'none',
        scrollTrigger: {
          trigger           : hero,
          start             : 'top top',
          end               : 'bottom top',
          scrub             : 1.2,
          invalidateOnRefresh: true,
        },
      }
    );
  });
}

/* ─────────────────────────────────────────────────────────────
   14. DATA-PARALLAX — REUSABLE API
   Any element marked [data-parallax="0.15"] gets a scroll-driven
   translate whose speed is the numeric value (0 = static, 1 = as
   fast as scroll). Optional attributes:
     • data-parallax-direction="horizontal"  → translateX instead
     • data-parallax-mobile="false"          → disable on ≤767 px
   Distance is derived from the element's own height so the tween
   stays proportional across break-points. Only elements whose
   layout can absorb the translate should be tagged (i.e. inside
   an overflow:hidden parent or with room to move).
───────────────────────────────────────────────────────────── */
function initDataParallax(gsap, ScrollTrigger) {
  const isMobile = window.matchMedia('(max-width: 767px)').matches;

  qsa('[data-parallax]').forEach(el => {
    if (isMobile && el.dataset.parallaxMobile === 'false') return;

    const speed = parseFloat(el.dataset.parallax) || 0.15;
    const clampedSpeed = Math.max(-1, Math.min(1, speed));
    const horizontal = el.dataset.parallaxDirection === 'horizontal';

    // Distance in px: viewport-relative so tall & short elements both
    // feel calibrated. 100vh * speed → 15 vh for the default 0.15.
    const distance = window.innerHeight * clampedSpeed;

    const from = horizontal ? { x: -distance / 2 } : { y: -distance / 2 };
    const to   = horizontal ? { x:  distance / 2 } : { y:  distance / 2 };

    gsap.fromTo(el, from, {
      ...to,
      ease: 'none',
      scrollTrigger: {
        trigger           : el,
        start             : 'top bottom',
        end               : 'bottom top',
        scrub             : 1.4,
        invalidateOnRefresh: true,
      },
    });
  });
}
