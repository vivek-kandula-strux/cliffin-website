/**
 * Premium micro-interactions — vanilla GSAP, scroll-safe subset.
 *
 * Catalogue:
 *   1. initCounters          — stats count up on scroll-enter
 *   2. initButtonRipple      — material-style click ripple on all .btn elements
 *   3. initPlayPulse         — repeating emanation rings on the video play button
 *   4. initIconBounce        — .icon-chip pops in with back.out spring on scroll
 *
 * Removed to keep scrolling native and the main thread free:
 *   • custom cursor, 3-D card tilt, image hover pan
 *   • scroll-driven parallax (tiles, cards, scenes, terrain, data-parallax)
 */

import { qs, qsa, prefersReducedMotion } from '../utils/dom.js';

export function initMicro(gsap, ScrollTrigger) {
  const reduced = prefersReducedMotion();

  // Always run — imperceptible or purely structural
  initButtonRipple();
  initPlayPulse(gsap);

  if (reduced) return;

  initCounters(gsap, ScrollTrigger);
  initIconBounce(gsap, ScrollTrigger);
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
   2. BUTTON RIPPLE
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
      setTimeout(() => ripple.remove(), 800);
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   3. PLAY-BUTTON PULSE
   Two GSAP loops staggered by 0.9 s create the double-ring
   sonar pulse around the video play button.
───────────────────────────────────────────────────────────── */
function initPlayPulse(gsap) {
  const play = qs('.play-btn');
  if (!play) return;

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
   4. ICON CHIP BOUNCE
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
