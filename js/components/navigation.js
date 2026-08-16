import { qs, qsa, on } from '../utils/dom.js';

/**
 * Sticky header + accessible mobile menu.
 *
 * - Sets aria-current="page" on the link matching the current page
 * - Toggles the mobile panel on burger click with aria-expanded
 * - Closes on Escape, on outside click, and after any nav link click
 * - Traps focus while the menu is open
 * - Locks body scroll while the menu is open to prevent background scrolling
 */
export function initNavigation() {
  const header = qs('[data-menu-open]');
  const toggle = qs('[data-nav-toggle]');
  const panel = qs('#mobile-nav');

  if (!header || !toggle || !panel) return;

  markActiveLink();

  let previouslyOpen = false;
  let focusTrapHandler = null;

  const setOpen = (open) => {
    // Mirror the open state onto BOTH the header (kept for backwards compat)
    // and <body>. The drawer is now a sibling of <header> — moved out so the
    // header can safely use `contain: paint layout` — so the CSS that reveals
    // it now keys off `body[data-menu-open='true'] .header__mobile` instead
    // of the old descendant selector. See components.css: mobile drawer rules.
    header.dataset.menuOpen = String(open);
    document.body.dataset.menuOpen = String(open);
    toggle.setAttribute('aria-expanded', String(open));

    if (open) {
      document.body.style.overflow = 'hidden';
      focusTrapHandler = createFocusTrap(panel);
      document.addEventListener('keydown', focusTrapHandler);
    } else {
      document.body.style.overflow = '';
      if (focusTrapHandler) {
        document.removeEventListener('keydown', focusTrapHandler);
        focusTrapHandler = null;
      }
      if (previouslyOpen) toggle.focus();
    }
    previouslyOpen = open;
  };

  on(toggle, 'click', () => {
    const willOpen = header.dataset.menuOpen !== 'true';
    setOpen(willOpen);
  });

  // Close on Escape
  on(document, 'keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (header.dataset.menuOpen === 'true') {
      setOpen(false);
    }
  });

  // Close after a link click inside the panel
  on(panel, 'click', (event) => {
    if (event.target.closest('a')) {
      setOpen(false);
    }
  });

  // Close when the viewport grows past the mobile-nav breakpoint
  const mq = window.matchMedia('(max-width: 1040px)');
  const handleMq = (mql) => {
    if (!mql.matches) setOpen(false);
  };
  mq.addEventListener('change', handleMq);

  // Sticky header: toggle a shadow once the page has scrolled past the top.
  // Uses IntersectionObserver on a sentinel so we don't run a listener on every scroll.
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;height:1px;width:1px;pointer-events:none;';
  document.body.prepend(sentinel);
  const io = new IntersectionObserver(
    ([entry]) => {
      header.dataset.scrolled = String(!entry.isIntersecting);
    },
    { threshold: 0 }
  );
  io.observe(sentinel);

  // Adaptive theming: invert the nav when a dark section scrolls behind it.
  // Sections opted-in via [data-nav-invert] flip the header to dark theme while
  // they cross the viewport top (i.e., are currently under the sticky nav).
  const invertTargets = qsa('[data-nav-invert]');
  if (invertTargets.length) {
    let invertCount = 0;
    const themeIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          invertCount += entry.isIntersecting ? 1 : -1;
        });
        if (invertCount < 0) invertCount = 0;
        header.dataset.theme = invertCount > 0 ? 'dark' : 'light';
      },
      { rootMargin: '0px 0px -100% 0px', threshold: 0 }
    );
    invertTargets.forEach((el) => themeIO.observe(el));
  }
}

function markActiveLink() {
  const path = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const currentKey = pageKeyFromPath(path);
  if (!currentKey) return;

  qsa('[data-key]').forEach((link) => {
    if (link.dataset.key === currentKey) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function pageKeyFromPath(path) {
  const map = {
    '': 'home',
    'index.html': 'home',
    'school-programs.html': 'school',
    'adventure-workshops.html': 'workshops',
    'corporate-packages.html': 'corporate',
    'camp-sites.html': 'camps',
    'gallery.html': 'gallery',
    'about.html': 'about',
    'contact.html': 'contact',
  };
  return map[path] || null;
}

function createFocusTrap(root) {
  const focusableSelector =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  return function trap(event) {
    if (event.key !== 'Tab') return;

    const focusable = Array.from(root.querySelectorAll(focusableSelector)).filter(
      (el) => !el.closest('[hidden]') && getComputedStyle(el).display !== 'none'
    );

    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (focusable.length === 1) {
      event.preventDefault();
      first.focus();
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
}
