/**
 * Premium micro-interactions.
 *
 * Hero mouse parallax: the hero image drifts a few pixels against cursor
 * movement — the classic "premium editorial" tell. Effect is intentionally
 * subtle (max ~14px translate) so it reads as depth, not motion sickness.
 *
 * Magnetic buttons: primary CTAs get a gentle pull toward the cursor when
 * it's within ~120px. Uses transform (GPU) and short easing for snappiness.
 *
 * Both effects are:
 *   • fine-pointer only (touch skips — no cursor to react to)
 *   • reduced-motion respectful
 *   • RAF-throttled so they never fight the browser's paint loop
 */
import { qs, qsa, prefersReducedMotion } from '../utils/dom.js';

export function initInteractions() {
  if (prefersReducedMotion()) return;

  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!isFinePointer) return;

  initHeroParallax();
  initMagneticButtons();
  initScrollProgress();
}

/* -------------------------------------------------------- */
/* Hero image parallax                                       */
/* -------------------------------------------------------- */
function initHeroParallax() {
  const image = qs('[data-hero-parallax]');
  if (!image) return;

  const heroSection = image.closest('[data-hero]') || image.parentElement;
  if (!heroSection) return;

  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
  let rafId = null;
  const MAX = 14; // px

  function onMove(event) {
    const rect = heroSection.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width - 0.5;   // -0.5 .. 0.5
    const ny = (event.clientY - rect.top) / rect.height - 0.5;
    targetX = nx * -MAX;
    targetY = ny * -MAX;
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function onLeave() {
    targetX = 0;
    targetY = 0;
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function tick() {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    image.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) scale(1.05)`;
    if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  heroSection.addEventListener('pointermove', onMove);
  heroSection.addEventListener('pointerleave', onLeave);
}

/* -------------------------------------------------------- */
/* Magnetic buttons — subtle pull toward cursor              */
/* Applied to primary hero CTAs and header enquire button.   */
/* -------------------------------------------------------- */
function initMagneticButtons() {
  const targets = qsa('[data-magnetic], .hero-copy .btn--primary, .header__enquire');
  if (!targets.length) return;

  const STRENGTH = 0.28;
  const RADIUS = 140;

  targets.forEach((el) => {
    let rafId = null;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    let active = false;

    function tick() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    }

    function schedule() { if (!rafId) rafId = requestAnimationFrame(tick); }

    el.addEventListener('pointerenter', () => { active = true; });

    el.addEventListener('pointermove', (event) => {
      if (!active) return;
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const dist = Math.hypot(dx, dy);
      if (dist > RADIUS) return;
      tx = dx * STRENGTH;
      ty = dy * STRENGTH;
      schedule();
    });

    el.addEventListener('pointerleave', () => {
      active = false;
      tx = 0; ty = 0;
      schedule();
    });
  });
}

/* -------------------------------------------------------- */
/* Scroll progress — thin ember rule at top of viewport      */
/* Non-essential garnish; skipped if the bar node isn't in   */
/* the DOM (no-op progressive enhancement).                  */
/* -------------------------------------------------------- */
function initScrollProgress() {
  const bar = qs('[data-scroll-progress]');
  if (!bar) return;

  // Cache the scrollable range. Reading `scrollHeight` inside the scroll RAF
  // forces a synchronous layout every frame; with Lenis emitting ~60
  // scroll ticks/sec, that adds up. Recompute only when the page can
  // actually change size (resize, orientation, load).
  let max = document.documentElement.scrollHeight - window.innerHeight;
  const recomputeMax = () => {
    max = document.documentElement.scrollHeight - window.innerHeight;
  };
  window.addEventListener('resize', recomputeMax, { passive: true });
  window.addEventListener('load', recomputeMax, { once: true });

  let rafId = null;
  function update() {
    const pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    bar.style.transform = `scaleX(${pct.toFixed(4)})`;
    rafId = null;
  }
  window.addEventListener('scroll', () => {
    if (!rafId) rafId = requestAnimationFrame(update);
  }, { passive: true });
  update();
}
