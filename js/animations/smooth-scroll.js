/**
 * Lenis smooth scroll — progressive enhancement.
 *
 * Fires only when:
 *   • prefers-reduced-motion is NOT set
 *   • a fine pointer is available (mouse/trackpad) — mobile keeps native scroll
 *     because touch inertia is already optimized and adding Lenis creates a
 *     laggy, disconnected feel on iOS momentum scroll.
 *
 * Integrates with GSAP ScrollTrigger by re-syncing on Lenis frames so scroll
 * reveals fire at the right position (Lenis translates the wrapper, not the
 * document, so ScrollTrigger needs updates from Lenis' internal RAF).
 *
 * If Lenis fails to load from the CDN we silently fall back to native scroll —
 * every other animation still works.
 */
import { prefersReducedMotion } from '../utils/dom.js';
import { config } from '../config.js';

export async function initSmoothScroll({ ScrollTrigger } = {}) {
  if (prefersReducedMotion()) return null;

  // Touch-primary devices skip Lenis — native inertia feels better than JS-driven.
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!isFinePointer) return null;

  let Lenis;
  try {
    ({ default: Lenis } = await import(/* @vite-ignore */ config.LENIS_URL));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[smooth-scroll] Lenis failed to load — falling back to native scroll.', error);
    return null;
  }

  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // exp-out
    smoothWheel: true,
    // We deliberately do NOT smooth touch — see comment above.
    smoothTouch: false,
    touchMultiplier: 1.5,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  if (ScrollTrigger) {
    lenis.on('scroll', ScrollTrigger.update);
    // Ensure ScrollTrigger uses the correct scroll source (still window here
    // since Lenis translates the body, not a wrapper element by default).
  }

  // Intercept in-page anchor clicks so they use Lenis' scrollTo — this is the
  // key premium touch (buttery navigation to a section).
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    lenis.scrollTo(target, { offset: -100, duration: 1.2 });
    // Update URL without triggering the native jump
    history.replaceState(null, '', href);
  });

  return lenis;
}
