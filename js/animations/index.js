import { qsa, prefersReducedMotion } from '../utils/dom.js';
import { config } from '../config.js';
import { initSmoothScroll } from './smooth-scroll.js';
import { initInteractions } from './interactions.js';
import { initMicro } from './micro.js';

/**
 * Animation entry point.
 *
 * Loads GSAP + ScrollTrigger from a CDN (ES module), then orchestrates:
 *   - Hero entrance timeline (once, immediately on load)
 *   - Scroll reveals for elements with [data-animate] (staggered per view)
 *   - Responsive matchMedia (desktop/mobile/reduced-motion/fine-pointer)
 *
 * Progressive enhancement:
 *   - If reduced motion is preferred, we short-circuit and reveal everything
 *   - If GSAP fails to load, we fall back to an IntersectionObserver reveal
 *   - Safety fallback: if the hero doesn't reveal within 800 ms (slow CDN),
 *     mark it ready via CSS so the copy never gets stuck invisible.
 */
export async function initAnimations() {
  document.documentElement.classList.add('js');

  const heroSafety = setTimeout(markHeroReady, 800);

  if (prefersReducedMotion()) {
    clearTimeout(heroSafety);
    markHeroReady();
    revealAll();
    return;
  }

  let gsap, ScrollTrigger;
  try {
    ({ gsap } = await import(/* @vite-ignore */ config.GSAP_URL));
    ({ ScrollTrigger } = await import(/* @vite-ignore */ config.GSAP_SCROLLTRIGGER_URL));
    gsap.registerPlugin(ScrollTrigger);
  } catch (error) {
    // GSAP CDN unavailable — fall back to IntersectionObserver reveal.
    clearTimeout(heroSafety);
    markHeroReady();
    // eslint-disable-next-line no-console
    console.warn('[animations] GSAP failed to load; using IntersectionObserver fallback.', error);
    fallbackReveal();
    return;
  }

  clearTimeout(heroSafety);
  markHeroReady();

  // Wire Lenis (smooth scroll) into ScrollTrigger BEFORE the timelines start
  // so trigger positions calculate against the smoothed scroll on first frame.
  // Fires-and-forgets: any Lenis load failure is non-fatal.
  initSmoothScroll({ ScrollTrigger });

  // Non-blocking micro-interactions (hero parallax, magnetic buttons, scroll bar).
  initInteractions();

  // Premium micro-interactions — counters, tilt, cursor, scramble, parallax, etc.
  initMicro(gsap, ScrollTrigger);

  gsap.defaults({ duration: 0.8, ease: 'power3.out' });

  const media = gsap.matchMedia();

  media.add(
    {
      isDesktop: '(min-width: 1041px)',
      isMobile: '(max-width: 1040px)',
      isReduced: '(prefers-reduced-motion: reduce)',
    },
    (context) => {
      const { isReduced, isMobile } = context.conditions;

      if (isReduced) {
        revealAll();
        return;
      }

      playHero(gsap);
      playRevealsGSAP(gsap, ScrollTrigger, { isMobile });
    }
  );
}

function markHeroReady() {
  const hero = document.querySelector('[data-hero]');
  if (hero) hero.classList.add('hero-ready');
}

/* -------------------------------------------------------- */
/* Hero timeline                                            */
/* -------------------------------------------------------- */
function playHero(gsap) {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;

  const eyebrow = hero.querySelector('[data-hero-eyebrow]');
  const title = hero.querySelector('[data-hero-title]');
  const description = hero.querySelector('[data-hero-description]');
  const actions = hero.querySelector('[data-hero-actions]');
  const media = hero.querySelector('[data-hero-media]');
  const badge = hero.querySelector('.hero-media__badge');
  const metaItems = hero.querySelectorAll('.hero-copy__meta-item');

  // Use fromTo() (not .from()) so destinations are explicit — otherwise GSAP
  // reads the CSS-hidden opacity:0 state as the "to" value and animates 0→0,
  // leaving the hero permanently invisible.
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

  const reveal = (el, from, extra = {}) =>
    tl.fromTo(el, from, { autoAlpha: 1, y: 0, scale: 1, ...extra }, extra.at);

  if (eyebrow) reveal(eyebrow, { autoAlpha: 0, y: 16 }, { duration: 0.7 });
  if (title) reveal(title, { autoAlpha: 0, y: 46 }, { duration: 1.1, at: '-=0.35' });
  if (description) reveal(description, { autoAlpha: 0, y: 22 }, { duration: 0.8, at: '-=0.7' });
  if (actions) reveal(actions, { autoAlpha: 0, y: 18 }, { duration: 0.7, at: '-=0.55' });
  if (metaItems.length) {
    tl.fromTo(
      metaItems,
      { autoAlpha: 0, y: 14 },
      { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 },
      '-=0.55'
    );
  }
  if (media) reveal(media, { autoAlpha: 0, scale: 1.06 }, { duration: 1.4, ease: 'power3.out', at: '<0.05' });
  if (badge) reveal(badge, { autoAlpha: 0, y: 20, scale: 0.9 }, { duration: 0.8, ease: 'back.out(1.6)', at: '-=0.6' });
}

/* -------------------------------------------------------- */
/* Scroll reveals — [data-animate]                          */
/* Uses ScrollTrigger.batch so siblings entering together   */
/* stagger cleanly instead of all firing at once.           */
/* -------------------------------------------------------- */
function playRevealsGSAP(gsap, ScrollTrigger, { isMobile }) {
  const targets = qsa('[data-animate]');
  if (!targets.length) return;

  const dist = isMobile ? 16 : 28;

  // Set the start state BEFORE registering the batch trigger so
  // ScrollTrigger sees the hidden state on its first evaluation.
  gsap.set(targets, { autoAlpha: 0, y: dist });

  ScrollTrigger.batch('[data-animate]', {
    // Fire as soon as ANY part of the element enters the viewport
    // (top of element crosses bottom of viewport). Earlier fixes used
    // 'top 88%' which meant an element had to be 12% into view before
    // animating — on mobile this reads as "section only loads when I
    // scroll past it".
    start: 'top bottom',
    once: true,
    onEnter: (batch) => {
      gsap.to(batch, {
        autoAlpha: 1,
        y: 0,
        duration: isMobile ? 0.55 : 0.8,
        ease: 'power3.out',
        stagger: isMobile ? 0.05 : 0.09,
        overwrite: 'auto',
      });
    },
  });

  // Refresh after fonts load so trigger positions match final layout
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
}

/* -------------------------------------------------------- */
/* Fallback reveal — used if GSAP fails to load             */
/* -------------------------------------------------------- */
function fallbackReveal() {
  const targets = qsa('[data-animate]');
  if (!targets.length) {
    revealAll();
    return;
  }
  if (!('IntersectionObserver' in window)) {
    revealAll();
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    },
    // Reveal the moment any part of the element enters the viewport
    // (matches the GSAP path — see start: 'top bottom' above).
    { rootMargin: '0px 0px 0px 0px', threshold: 0 }
  );
  targets.forEach((el) => io.observe(el));
}

function revealAll() {
  qsa('[data-animate]').forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
}
