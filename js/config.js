/**
 * Site-wide configuration.
 * Replace the WEBHOOK_URL with your webhook endpoint —
 * see README.md → "Contact form: Google Sheet webhook" for the Apps Script setup.
 */
export const config = {
  // Pabbly Connect webhook endpoint for form submissions.
  WEBHOOK_URL: 'https://connect.pabbly.com/webhook-listener/webhook/IjU3NjAwNTY5MDYzNzA0M2Qi_pc/IjU3NjcwNTY4MDYzNDA0MzQ1MjY4NTUzNzUxM2Ei_pc',

  // Reveal fallback threshold — when GSAP isn't loaded we use IntersectionObserver
  REVEAL_ROOT_MARGIN: '0px 0px -10% 0px',

  // Breakpoints (kept in sync with CSS)
  BREAKPOINT_MOBILE: '(max-width: 860px)',
  BREAKPOINT_NAV: '(max-width: 1040px)',

  // GSAP CDN — ES module builds served via esm.sh (see README for pinning).
  GSAP_URL: 'https://esm.sh/gsap@3.12.5',
  GSAP_SCROLLTRIGGER_URL: 'https://esm.sh/gsap@3.12.5/ScrollTrigger',

  // Lenis smooth scroll — ES module. Progressive enhancement only;
  // disabled automatically if reduced motion is preferred or fine-pointer
  // is absent (mobile keeps native scroll for snappy touch behavior).
  LENIS_URL: 'https://esm.sh/lenis@1.1.14',
};
