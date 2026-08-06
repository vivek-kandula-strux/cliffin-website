# Cliff-Inn Adventures — Website

A static, hand-authored HTML/CSS/vanilla-JS site with GSAP-powered animation and the View Transition API for cross-page fades. No build step, no framework, no bundler.

The site was refactored from a Framer export (see [archive/](archive/)) into a maintainable static site with a modular CSS system and progressive-enhancement animation.

---

## Quick start

There's nothing to install. Serve the folder with any static file server so ES module imports and cross-origin fonts work:

```bash
# Python 3 (any recent version)
python -m http.server 5173

# Or Node
npx http-server -p 5173

# Or the VS Code "Live Server" extension
```

Then open <http://localhost:5173/>.

Opening the pages by double-clicking (`file://`) will not work — browsers block ES module imports from the `file://` origin.

---

## Project structure

```text
├── index.html                        Home
├── about.html
├── adventure-workshops.html
├── camp-sites.html
├── contact.html
├── corporate-packages.html
├── gallery.html
├── school-programs.html
│
├── css/
│   ├── main.css                      Single import that pulls the layers below in order
│   ├── variables.css                 Design tokens (color, type, space, radius, motion)
│   ├── reset.css
│   ├── base.css                      Body, typography, focus, skip link, eyebrows
│   ├── layout.css                    Container, bento grid, card grid, breadcrumbs
│   ├── components.css                Nav, footer, buttons, cards, forms, hero, tiles
│   ├── animations.css                data-animate initial states + view transitions
│   ├── utilities.css
│   └── print.css                     Print-friendly stylesheet
│
├── js/
│   ├── main.js                       Entry — loaded as type="module"
│   ├── config.js                     WEBHOOK_URL, GSAP CDN URLs, breakpoints
│   ├── utils/dom.js
│   ├── components/
│   │   ├── navigation.js             Mobile menu, aria-expanded, aria-current
│   │   ├── form.js                   Validate + POST to Google Sheet webhook
│   │   └── gallery.js                Filter buttons
│   └── animations/
│       ├── index.js                  Hero timeline + scroll reveals via GSAP
│       └── page-transitions.js       View Transition API (progressive enhancement)
│
├── partials/
│   ├── nav.html                      Source of truth for the site header
│   └── footer.html                   Source of truth for the site footer
│
├── assets/
│   └── favicons/favicon.svg
│
├── archive/                          Original Framer export + reference material
│   ├── framer-source/                All .dc.html pages (Home, About, …)
│   ├── framer-runtime/               support.js, image-slot.js, doc-page.js
│   └── touringo-reference/           Third-party template inspiration (unused)
│
├── design-system.md                  The oklch tokens/typography/gradients source
├── robots.txt
├── sitemap.xml
├── site.webmanifest
└── .gitignore
```

The nav and footer are inlined into every page between the markers `<!-- BEGIN partials/nav.html -->` / `<!-- END partials/nav.html -->` (same for footer). If you change [partials/nav.html](partials/nav.html), copy that block into each page — the `active` link uses `aria-current="page"` and is the only per-page difference.

---

## Editing content

- **Colors, typography, spacing, radii, gradients:** edit [css/variables.css](css/variables.css). Everything else derives from those tokens.
- **A page's content:** edit that page's HTML. Section semantics are intentional — `<section aria-labelledby>` with a real heading in every block.
- **Nav / footer:** edit [partials/nav.html](partials/nav.html) or [partials/footer.html](partials/footer.html), then propagate the block to every page. There's no build step to do it for you.

---

## GSAP animation

GSAP and ScrollTrigger are loaded as ES modules from `esm.sh` when the entry script runs — no npm install, no bundler. The URL is set once in [js/config.js](js/config.js#L13) so you can pin a specific version or self-host later.

### What each element does

- `data-hero`, `data-hero-eyebrow`, `data-hero-title`, `data-hero-description`, `data-hero-actions`, `data-hero-media` — hooks used by the hero timeline in [js/animations/index.js](js/animations/index.js#L58).
- `data-animate` — any element that should reveal on scroll. Initial state is hidden (see [css/animations.css](css/animations.css#L10)) so nothing flashes into place if JS runs late.
- `.js` — added to `<html>` synchronously in [js/main.js](js/main.js#L8) so initial states apply immediately.

### Reduced motion

`(prefers-reduced-motion: reduce)` is respected in three layers:

1. [css/animations.css](css/animations.css#L28) shortens all transitions/animations to 1 ms.
2. [js/main.js](js/main.js) → `initAnimations()` short-circuits and shows everything.
3. The View Transition API animation is neutralised in the same CSS block.

### Fallback

If GSAP fails to load (network, CSP), [js/animations/index.js](js/animations/index.js#L96) falls back to an `IntersectionObserver` reveal via the `is-in` class, then a plain reveal-all if that's also unavailable.

---

## Contact form: Google Sheet webhook

Both the contact form and the register-interest form POST to a Google Apps Script Web App URL that appends a row to a Google Sheet. To wire it up:

**1. Create a Google Sheet** with these headers in row 1:

```
timestamp | form | page | fullName | firstName | lastName | email | phone | trip | groupSize | notes | message
```

(Add / remove columns to match the field names you actually collect. The script below writes whatever keys the payload contains.)

**2. Open Extensions → Apps Script** in the sheet and paste this:

```js
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const data = JSON.parse(e.postData.contents || '{}');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => h === 'timestamp' ? new Date() : (data[h] ?? ''));
  sheet.appendRow(row);
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

**3. Deploy → New deployment → Web app**

- Description: `Cliff-Inn contact webhook`
- Execute as: **Me**
- Who has access: **Anyone**
- Copy the resulting URL (it looks like `https://script.google.com/macros/s/…/exec`)

**4. Paste it into [js/config.js](js/config.js#L8)** as the value of `WEBHOOK_URL`.

Until you set that URL, the form will log its payload to the browser console and show the success state so you can dogfood the UI. The `fetch` uses `mode: 'no-cors'` so Apps Script's opaque response doesn't reject.

---

## Accessibility

- Skip-to-content link on every page (see `<a class="skip-link" href="#main">` at the top of each file).
- Semantic landmarks: `<header>`, `<nav aria-label="…">`, `<main id="main">`, `<footer>`.
- Every image has `alt` — decorative overlay elements use `aria-hidden="true"`.
- Focus states are visible on every interactive element (see [css/base.css](css/base.css#L52)).
- Mobile menu: `aria-expanded` on the burger, `aria-controls` pointing at the panel, closes on Escape and after any link click.
- Forms: labels for every field, `aria-live="polite"` status region, error messaging tied to fields via `data-invalid`.
- Reduced motion respected in CSS and JS.

---

## Performance

- Fonts preconnect + `display=swap` in every `<head>`; only the weights actually used are requested.
- Images use explicit `width`/`height` to prevent CLS, `loading="lazy"` below the fold, `fetchpriority="high"` on the LCP image only.
- No third-party analytics (add your own when needed).
- GSAP is loaded on demand from a CDN — no cost to visitors who prefer reduced motion.
- CSS is layered but shipped as regular files; if you want to concatenate for prod, run any minifier over `css/*.css` — the `@import` order in [css/main.css](css/main.css) is authoritative.

---

## What still needs a human

The bulk of the site is done, but the following need real-world information and can't be invented:

- [ ] **Photography.** All images use curated Unsplash URLs matching the placeholder descriptions. Replace with the studio's own photos before launch — search + replace `https://images.unsplash.com/photo-…` with the real CDN.
- [ ] **Legal pages.** The footer links to Privacy Policy / Cancellation / T&Cs / Release of Liability — currently `#`. Provide real URLs or pages.
- [ ] **Business address.** [contact.html](contact.html) uses an OpenStreetMap tile centred on Hyderabad. Replace with the real campsite coordinates (`&marker=17.408%2C78.478`).
- [ ] **Webhook.** Set `WEBHOOK_URL` in [js/config.js](js/config.js). Until then the form is a no-op that shows the success state.
- [ ] **Favicons.** Only [assets/favicons/favicon.svg](assets/favicons/favicon.svg) is included. Generate a PNG set (192, 512, apple-touch-icon) once you have final artwork.
- [ ] **Analytics / consent.** No tracking is wired up — add whatever your policy needs.
- [ ] **Trip prices, dates, spot counts.** Currently placeholders (`8 spots left`, `₹18,500`, `Oct 2026`). Update on [index.html](index.html) as bookings change.
- [ ] **Structured data.** Optional — add `Organization` / `LocalBusiness` JSON-LD once real address, phone and hours are confirmed.

---

## Testing checklist (manual — no test suite)

Before deploying, load each page and:

- Resize the browser between 320 px and 1920 px — no horizontal scroll, no clipped headings.
- Tab from the top — the skip link appears first, focus is always visible, order is logical.
- Open the mobile menu with a keyboard, close with Escape.
- With DevTools → **Rendering → Emulate `prefers-reduced-motion`** enabled, verify everything appears instantly and nothing is hidden waiting for a scroll trigger.
- Print preview each page — [css/print.css](css/print.css) hides the header/footer/CTAs and simplifies colour.

---

## Attribution

- **Fonts:** [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk), [Archivo](https://fonts.google.com/specimen/Archivo), [Lora](https://fonts.google.com/specimen/Lora) — via Google Fonts.
- **Stock imagery:** [Unsplash](https://unsplash.com) (free-to-use). Individual attributions live in the `alt` text; swap out before launch.
- **Animation:** [GSAP 3](https://gsap.com) via [esm.sh](https://esm.sh).
