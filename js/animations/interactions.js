import { prefersReducedMotion } from '../utils/dom.js';

/**
 * Interaction layer.
 *
 * Scroll/pointer-heavy effects (scroll progress bar, hero mouse parallax,
 * magnetic buttons) have been removed to keep scrolling native and the main
 * thread free. Button ripple and play-pulse live in micro.js.
 */
export function initInteractions() {
  if (prefersReducedMotion()) return;
  // No continuous pointer/scroll-driven interactions remain here.
}
