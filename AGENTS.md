# Cliff-Inn Adventures — Agent Instructions

This file is Kimi Code's project-level standing brief. It is injected into every session as reference data. Review it at the start of every task before making changes.

## 1. Project identity

- **Name:** Cliff-Inn Adventures
- **Domain:** Guided outdoor experiences for schools, corporates and independent explorers in India — rappelling, treks, night camps, team challenges.
- **Live site:** https://www.cliffinnadventures.com/
- **Repo type:** Static hand-authored site. No build step, no framework, no bundler.
- **Stack:** HTML5, vanilla CSS with layered files, vanilla JS as ES modules, GSAP + ScrollTrigger from esm.sh, View Transition API for cross-page fades.

## 2. Communication style (caveman skill)

The user has the `caveman` skill active by default at **full** intensity.

- Keep chat responses terse. Drop filler, hedging and articles where grammar allows.
- Never drop `not`/`never`/`no`/`only`/`except` — they flip meaning.
- Preserve exact technical terms, file paths, API names, CLI commands, commit keywords and error strings verbatim.
- Code blocks, commands and file contents stay byte-for-byte exact.
- No tool-call narration, no decorative tables/emoji, no long raw error-log dumps unless asked.
- For security warnings or irreversible actions, switch back to clear full prose temporarily.
- This instruction file and all committed artifacts (code, comments, docs, commit messages) are written in normal prose, not caveman style.

## 3. Architecture

### File layout

```text
index.html, about.html, adventure-workshops.html, camp-sites.html,
contact.html, corporate-packages.html, gallery.html, school-programs.html

css/
  main.css          @imports variables → reset → base → layout → components → animations → utilities → print → modal
  variables.css     Design tokens (colors, type, space, radii, motion, gradients)
  reset.css
  base.css          Typography, focus, skip-link
  layout.css        Containers, grids
  components.css    Buttons, cards, nav, footer, forms, hero
  animations.css    data-animate initial states + view transitions
  utilities.css
  print.css
  modal.css

js/
  main.js           Entry module; adds .js class, wires nav/form/gallery/animations
  config.js         WEBHOOK_URL, GSAP/Lenis URLs, breakpoints
  utils/dom.js
  components/navigation.js, form.js, gallery.js
  animations/index.js, page-transitions.js

partials/
  nav.html          Source of truth for site header
  footer.html       Source of truth for site footer

assets/
  Background/       Hero / footer imagery
  Logo/             WebP logos at multiple widths
  images/           Page-specific imagery
  favicons/         favicon.svg only
```

### Partials workflow

`partials/nav.html` and `partials/footer.html` are **not** auto-included. Each HTML page contains the literal block between markers:

```html
<!-- BEGIN partials/nav.html -->
…
<!-- END partials/nav.html -->
```

If you edit a partial, copy the new block into every page and update the active link's `aria-current="page"` per page.

### No build step

- Serve the folder with any static server so ES module imports work:
  - `python -m http.server 5173`
  - `npx http-server -p 5173`
- Opening files directly via `file://` will fail because browsers block ES modules from that origin.

## 4. Design system

Source files: `css/variables.css` and `design-system.md`.

### Typography (live site)

Loaded in every `<head>`:

```html
Outfit:wght@400;500;600;700
DM+Sans:wght@400;500;600;700
Lora:ital,wght@1,400;1,500
```

- Display/headings: **Outfit**
- Body: **DM Sans**
- Accent/eyebrows/italic highlight words: **Lora**

### Color palette (oklch)

| Token | Value | Use |
|-------|-------|-----|
| `--color-ink` | `oklch(0.23 0.03 158)` | Primary text on light |
| `--color-ember` | `oklch(0.67 0.15 47)` | Primary accent, links, CTAs |
| `--color-sky` | `oklch(0.52 0.1 232)` | Secondary accent |
| `--color-amber` | `oklch(0.8 0.14 52)` | Stars, warm accents on dark |
| `--color-page` | `oklch(0.955 0.012 88)` | Page background |
| `--color-card` | `oklch(0.99 0.006 88)` | Light cards |
| `--color-subheading` | `oklch(0.67 0.15 47)` | H3-level titles |

Dark contexts use the `.on-dark` class; it redefines `--color-text`, `--color-text-muted`, `--color-link` and `--color-link-hover`.

### Radius tokens

| Token | Value |
|-------|-------|
| `--radius-tile` | `26px` |
| `--radius-card` | `22px` |
| `--radius-input` | `12px` |
| `--radius-chip` | `14px` |
| `--radius-pill` | `40px` |

### Gradient rule of thumb

Flat color = secondary/utility. Gradient = premium surfaces (hero, CTA-dark, stat tiles, primary buttons, hero photography). Always use the CSS variables; do not hard-code one-off gradients.

## 5. Editing conventions

- **One source of truth:**
  - Colors/type/spacing: `css/variables.css`
  - Nav: `partials/nav.html`
  - Footer: `partials/footer.html`
  - GSAP/Lenis/webhook URLs: `js/config.js`
- **Markup:** use semantic landmarks (`<header>`, `<nav aria-label="…">`, `<main id="main">`, `<footer>`). Every section should have a real heading; use `<section aria-labelledby="…">` where appropriate.
- **Images:** always provide `alt`, explicit `width`/`height`, `decoding="async"`. Lazy-load below-fold images. LCP image gets `fetchpriority="high"`.
- **Buttons:** use existing `.btn .btn--primary`, `.btn--secondary`, `.btn--outline` classes. CTA buttons end with `→`.
- **Icons:** inline SVG, `24×24` viewBox, `stroke="currentColor"`, `stroke-width="1.6"` or `1.8`, `aria-hidden="true"` when decorative.
- **Do not invent business facts:** trip prices, dates, spot counts, address, phone numbers and legal-page URLs must match what the owner provides. Current placeholders are listed in README.md "What still needs a human".

## 6. Animation

- **Entry:** `js/main.js` adds `.js` to `<html>` synchronously so initial hidden states never flash.
- **Scroll reveals:** `data-animate` elements start hidden in `css/animations.css`; GSAP ScrollTrigger reveals them.
- **Hero:** `data-hero`, `data-hero-eyebrow`, `data-hero-title`, `data-hero-description`, `data-hero-actions`, `data-hero-media` drive the timeline in `js/animations/index.js`.
- **Page transitions:** View Transition API in `js/animations/page-transitions.js` is progressive enhancement only.
- **Reduced motion:** `(prefers-reduced-motion: reduce)` is honored in CSS and JS; `initAnimations()` short-circuits and shows everything.
- **Fallback:** if GSAP fails, `IntersectionObserver` with `.is-in` class is used; if that fails, all `data-animate` elements are shown.

## 7. Forms and webhook

- Contact form and register-interest form POST to a Google Apps Script Web App URL configured in `js/config.js` (`WEBHOOK_URL`).
- Until a real URL is set, the form logs the payload to the console and shows the success UI.
- The Apps Script expects headers: `timestamp | form | page | fullName | firstName | lastName | email | phone | trip | groupSize | notes | message`. The script appends whatever keys the payload contains.

## 8. Accessibility

- Skip link `<a class="skip-link" href="#main">` is the first focusable element on every page.
- Mobile menu: toggle button has `aria-expanded`, `aria-controls`, closes on Escape and after any link click.
- Form fields have visible labels, `aria-live="polite"` status, and error states tied via `data-invalid`.
- Focus rings are defined in `css/base.css`; do not remove them.
- Decorative elements use `aria-hidden="true"`.

## 9. Post-edit audit

After every edit that touches an HTML file (including `partials/*.html`), run:

```bash
node scripts/audit-checklist.js
```

Then read the generated `CHECKLIST.md`, identify which items changed status compared to the previous run, and report the new progress percentage.

## 10. Testing checklist

Before deploying any change, verify:

- [ ] No horizontal scroll from 320 px to 1920 px.
- [ ] Tab order is logical and the skip link appears first.
- [ ] Mobile menu opens/closes with keyboard and Escape.
- [ ] With DevTools Rendering → **Emulate `prefers-reduced-motion`**, all content appears instantly.
- [ ] Print preview hides header/footer/CTAs and remains readable (`css/print.css`).
- [ ] Every HTML page still validates the nav/footer markers after partial edits.
- [ ] Form still logs payload correctly when `WEBHOOK_URL` is empty.

## 11. Deployment

- Deploy the repo root as a static site.
- Replace Unsplash placeholder URLs with real photography before public launch.
- Generate PNG favicon set (192, 512, apple-touch-icon) once final artwork exists.
- Add real legal pages and update footer links.
- Set `WEBHOOK_URL` and test the live form end-to-end.

## 12. Things to never invent

- Business address / map coordinates
- Phone numbers, email addresses, social links
- Trip prices, dates, availability
- Legal page content or URLs
- Photography / image sources
- Analytics / tracking scripts
- Structured data (JSON-LD) until real address, phone and hours are confirmed
