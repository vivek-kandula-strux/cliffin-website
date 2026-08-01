/**
 * Site-wide configuration.
 * Replace the WEBHOOK_URL with your Google Apps Script Web App URL —
 * see README.md → "Contact form: Google Sheet webhook" for the setup script.
 */
export const config = {
  // TODO(vivek): Replace with the deployed Apps Script Web App URL.
  // Should look like: https://script.google.com/macros/s/{deployment-id}/exec
  WEBHOOK_URL: '',

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
