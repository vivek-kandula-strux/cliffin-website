/**
 * Small DOM helpers. Nothing here needs the framework treatment —
 * plain functions with obvious behaviour.
 */

export const qs = (selector, root = document) => root.querySelector(selector);
export const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export const on = (target, type, handler, options) => {
  if (!target) return () => {};
  target.addEventListener(type, handler, options);
  return () => target.removeEventListener(type, handler, options);
};

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const supportsViewTransitions = () =>
  typeof document.startViewTransition === 'function';
