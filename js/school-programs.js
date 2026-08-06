/**
 * school-programs.js
 * Page-specific motion layer for the School Programs page.
 *
 * The global animations/index.js already wires these on every page:
 *   • Hero entrance timeline      data-hero-* attributes
 *   • [data-animate] batch        staggered scroll reveals
 *   • .card 3-D tilt + specular   micro.js — initCardTilt
 *   • .btn click ripple           micro.js — initButtonRipple
 *   • Hero mouse parallax         interactions.js — data-hero-parallax on img
 *   • [data-magnetic] pull        interactions.js — initMagneticButtons
 *   • Custom cursor               micro.js — #cursor-dot + #cursor-ring in DOM
 *   • Scroll-progress bar         interactions.js — [data-scroll-progress] in DOM
 *   • Counter animations          micro.js — [data-count="N"] on stat elements
 *
 * This module adds:
 *   1. Chip cascade — staggered entrance for .chip-tile elements
 *      (fires just as the parent dark-panel finishes fading in)
 *   2. Media-frame scroll parallax — subtle yPercent scrub on
 *      the split-section image as it moves through the viewport
 *   3. Stat strip counters — .stat-strip__num elements count
 *      from 0 to their data-count value on first scroll-in
 */

/* ── SCHOOL TRIPS — IDEA PICKER MODAL ────────────────────────────
   Runs unconditionally (not gated by reduced motion) because this is
   functional UI, not decorative. Progressive enhancement — without
   JS the trigger anchor falls through to contact.html?trip=school-trips.
─────────────────────────────────────────────────────────────────── */
(function initIdeasModal() {
  'use strict';

  const modal = document.getElementById('ideas-modal');
  if (!modal) return;

  const container = modal.querySelector('.modal__container');
  const triggers  = document.querySelectorAll('[data-open-ideas]');
  const closers   = modal.querySelectorAll('[data-close-ideas]');
  let lastFocused = null;

  function open(triggerEl) {
    lastFocused = triggerEl || document.activeElement;
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';

    // Re-play the .modal__container[data-entering] slide-up animation
    container.removeAttribute('data-entering');
    void container.offsetWidth;
    container.setAttribute('data-entering', '');

    requestAnimationFrame(() => container.focus());
  }

  function close() {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
    container.removeAttribute('data-entering');
    lastFocused?.focus();
  }

  triggers.forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      open(el);
    });
  });

  closers.forEach(el => el.addEventListener('click', close));

  document.addEventListener('keydown', e => {
    if (modal.hasAttribute('hidden')) return;

    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;

    const focusable = Array.from(
      modal.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')
    ).filter(el => getComputedStyle(el).display !== 'none');

    if (focusable.length < 2) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}());

(async function schoolPrograms() {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ── Load GSAP (hits the module cache — already fetched by
     animations/index.js from the exact same esm.sh URL)     ── */
  let gsap, ScrollTrigger;
  try {
    ({ gsap }          = await import('https://esm.sh/gsap@3.12.5'));
    ({ ScrollTrigger } = await import('https://esm.sh/gsap@3.12.5/ScrollTrigger'));
    gsap.registerPlugin(ScrollTrigger);
  } catch (_) {
    return; // Non-critical — both features are progressive enhancement
  }

  /* ── 1. CHIP CASCADE ──────────────────────────────────────────
     gsap.from() immediately sets chips to the "from" state when
     onEnter fires, then delay:0.9 waits for the parent panel
     fade (0.9 s GSAP duration in index.js batch) to complete
     before the stagger begins. clearProps:'all' removes inline
     styles after animation so CSS hover transitions take over.
  ─────────────────────────────────────────────────────────────── */
  const chips = document.querySelectorAll('.chip-tile');
  if (chips.length) {
    ScrollTrigger.create({
      trigger : '.dark-panel',
      start   : 'top bottom',   // reveal as soon as any part enters viewport (matches data-animate batch)
      once    : true,
      onEnter() {
        gsap.from(chips, {
          opacity   : 0,
          y         : 16,
          scale     : 0.88,
          duration  : 0.44,
          ease      : 'back.out(1.7)',
          stagger   : 0.044,
          delay     : 0.9,
          clearProps: 'all',
          overwrite : 'auto',
        });
      },
    });
  }

  /* ── 2. MEDIA-FRAME SCROLL PARALLAX ──────────────────────────
     The image drifts from -7% to +7% on its Y axis while the
     split section moves through the viewport. CSS hover uses
     the `scale` CSS property (separate from `transform`), so
     the two effects compose without fighting each other.

     Mobile skipped — matches the guard on the shared
     initScrollParallax / initCardMediaParallax utilities in
     micro.js. Native touch scroll + scrub reads jerky, and the
     ±7% translate is barely perceptible at phone widths.
  ─────────────────────────────────────────────────────────────── */
  const mediaImg = document.querySelector('.feature-split .media-frame img');
  const isMobileVP = window.matchMedia('(max-width: 767px)').matches;
  if (mediaImg && !isMobileVP) {
    gsap.fromTo(
      mediaImg,
      { yPercent: -7 },
      {
        yPercent : 7,
        ease     : 'none',
        scrollTrigger: {
          trigger            : '.feature-split .media-frame',
          start              : 'top bottom',
          end                : 'bottom top',
          scrub              : 1.5,
          invalidateOnRefresh: true,
        },
      }
    );
  }

  /* ── 3. STAT STRIP COUNTERS ──────────────────────────────────
     Resets each number to 0 immediately (real value stays in
     data-count as the no-JS fallback), then counts up to target
     with a staggered delay and power3.out ease on scroll-in.
     overwrite:true takes precedence over the global micro.js run.
  ─────────────────────────────────────────────────────────────── */
  const statNums = document.querySelectorAll('.stat-strip__num[data-count]');
  if (statNums.length) {
    statNums.forEach(el => { el.firstChild.textContent = '0'; });

    statNums.forEach((el, i) => {
      const target = +el.dataset.count;
      const proxy  = { n: 0 };
      ScrollTrigger.create({
        trigger : el,
        start   : 'top bottom',
        once    : true,
        onEnter() {
          gsap.to(proxy, {
            n        : target,
            duration : 1.6,
            delay    : i * 0.12,
            ease     : 'power3.out',
            overwrite: true,
            onUpdate() {
              el.firstChild.textContent = Math.round(proxy.n);
            },
          });
        },
      });
    });
  }

}());
