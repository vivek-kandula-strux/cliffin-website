# Cliffan Adventures — Design System

Extracted from `Home.dc.html`. This is the premium, adventure-forward system that all pages should follow.

---

## 1. Brand Voice

Adventurous, aspirational, warm. Copy speaks to freedom and escape ("Escape the ordinary, find your freedom"), backs it with credibility (years guiding, groups served, safety), and always ends on a clear invitation to act. Serves three audiences equally: schools, corporates, and independent explorers.

---

## 2. Typography

Loaded via Google Fonts:
`Space+Grotesk:400,500,600,700` · `Archivo:400,500,600,700` · `Instrument+Serif:ital`

| Role | Family | Usage |
|------|--------|-------|
| Display / headings | **Space Grotesk** | All `h1`–`h3`, stat numbers, buttons, nav, labels. `font-weight: 700` for headlines, `600` for buttons/subheads. |
| Body | **Archivo** | Paragraphs, form fields, meta labels, chips. `400` body, `500`–`600` emphasis. |
| Accent | **Instrument Serif** *(italic)* | Eyebrow/kicker labels, a single highlighted word inside a headline, pull-quotes. Always `font-style: italic`, `font-weight: 400`. |

**Headline treatment**
- `font-size: clamp(42px, 5.6vw, 82px)` for hero `h1`; section `h2` `clamp(30px, 4.2vw, 52px)`.
- `line-height: 0.94`–`1.0`, `letter-spacing: -0.03em`.
- Highlight one word per headline in Instrument Serif italic + ember color, `letter-spacing: 0`.

**Eyebrow / kicker pattern** (repeated above every section title):
```html
<span style="font-family: 'Instrument Serif', serif; font-style: italic; font-size: 26px;
  color: oklch(0.67 0.15 47); display: inline-flex; align-items: center; gap: 12px;">
  <span style="width: 34px; height: 1px; background: oklch(0.67 0.15 47);"></span>Eyebrow text</span>
```
(On dark panels use the amber accent `oklch(0.8 0.13 55)` for both text and rule.)

**Meta labels / chips:** Archivo, `font-size: 11px`, `font-weight: 600`, `letter-spacing: 0.04em`, `text-transform: uppercase`.

---

## 3. Color Palette (oklch)

### Core
| Token | oklch | Use |
|-------|-------|-----|
| **Deep pine** (ink) | `oklch(0.23 0.03 158)` | Primary text on light bg |
| **Pine panel** | `oklch(0.2 0.03 158)` | Dark bento panels, dark form bg, CTA-dark buttons |
| **Warm ember** (primary) | `oklch(0.67 0.15 47)` | Primary buttons, eyebrows, accent tiles, links, hover borders |
| **Open sky blue** | `oklch(0.52 0.1 232)` | Secondary stat tile, chip accents |
| **Amber / gold** | `oklch(0.8 0.14 52)` / `oklch(0.8 0.13 55)` | Stars, accents on dark, "know more" links |

### Neutrals
| Token | oklch | Use |
|-------|-------|-----|
| Page background | `oklch(0.955 0.012 88)` | `body` |
| Card white | `oklch(0.99 0.006 88)` | Light cards / tiles |
| Card border | `oklch(0.9 0.01 88)` | Default borders, dividers `oklch(0.92 0.008 88)` |
| Muted text | `oklch(0.5 0.02 160)` | Body copy on light |
| Text on dark | `oklch(0.98 0.01 88)` / body `oklch(0.86 0.02 88)` |

### Links
```css
a { color: oklch(0.67 0.15 47); }        /* ember */
a:hover { color: oklch(0.23 0.03 158); } /* pine */
```

### Gradient System (premium depth layer)

Gradients are what separate this system from a flat "orange box" template — every dark surface, every primary action and every accent number is graded, never a flat fill. Four families:

**1. Dark mesh panels** — every pine bento tile (hero, "why choose", register-interest, testimonial, CTA-dark) uses a two-part treatment: a subtle linear base for tonal depth, plus a 3-layer radial mesh overlay for the signature glow.
```css
/* base */
background: linear-gradient(155deg, oklch(0.24 0.035 160), oklch(0.16 0.03 156));
/* overlay, absolutely positioned, inset:0, pointer-events:none */
background: radial-gradient(85% 65% at 90% 0%,  oklch(0.52 0.1 232 / 0.48), transparent 60%),
            radial-gradient(75% 75% at 4% 105%, oklch(0.6 0.16 47 / 0.46),  transparent 58%),
            radial-gradient(55% 45% at 55% 45%, oklch(0.32 0.05 158 / 0.5), transparent 72%);
```
Sky-blue glow top-right, ember glow bottom-left, a third quiet pine-tinted core glow to avoid a flat middle. Scale opacities down (~0.3) for smaller tiles so it reads as ambient light, not a spotlight.

**2. Accent gradient fills** — ember and sky solids become diagonal gradients for tactile depth, always paired with a soft tinted drop shadow:
```css
/* ember (primary buttons, ember stat tiles) */
background: linear-gradient(135deg, oklch(0.72 0.16 52), oklch(0.62 0.16 42));
box-shadow: 0 10px 26px oklch(0.6 0.16 45 / 0.38);
/* sky (secondary stat tiles) */
background: linear-gradient(135deg, oklch(0.58 0.11 230), oklch(0.44 0.1 238));
box-shadow: 0 14px 34px oklch(0.45 0.1 235 / 0.3);
```

**3. Gradient text** — one accent word per hero/section headline may use a warm foil-text treatment instead of a flat accent color:
```css
background: linear-gradient(100deg, oklch(0.85 0.13 60), oklch(0.72 0.16 42));
-webkit-background-clip: text; background-clip: text; color: transparent;
```
Use sparingly — one word per page maximum, always on a dark or hero surface.

**4. Graded image scrims** — photo overlays are never a flat black-to-transparent fade. Add a faint warm mid-stop so photography feels color-graded, not just darkened:
```css
background: linear-gradient(0deg, oklch(0.16 0.03 158 / 0.92) 4%, oklch(0.4 0.1 40 / 0.2) 42%, transparent 68%);
```

**5. Light-surface sheen** — flat white cards get a barely-there diagonal gradient instead of a solid fill, so they catch light like the dark tiles do:
```css
background: linear-gradient(160deg, oklch(1 0 0), oklch(0.97 0.012 85));
```

**Page wash** — body background is a soft off-center radial instead of a flat tone:
```css
background: radial-gradient(120% 60% at 50% -10%, oklch(0.975 0.014 88), oklch(0.955 0.012 88) 55%);
```

Rule of thumb: flat color = secondary/utility element; gradient = anything meant to feel premium (primary CTAs, hero surfaces, stat highlights, hero photography).

---

## 4. Layout

- **Container:** `width: min(1280px, 94vw); margin: 0 auto;`
- **Section rhythm:** `padding: clamp(28px, 4vw, 50px) 0;` (hero and last section get extra bottom padding).
- **Bento grid:** `display: grid; grid-template-columns: repeat(12, 1fr); grid-auto-rows: minmax(150px, auto); gap: 16px;`
  - Tiles use `grid-column: span N` (+ `grid-row: span N` for tall tiles).
  - **Mobile (`max-width: 860px`):** grid collapses to `display: flex; flex-direction: column; gap: 14px;`. Provide `gridStyle` from logic based on a `matchMedia` flag rather than CSS media queries.
- **Card grids** (trips, etc.): `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;`
- Section-header rows: flex, `justify-content: space-between; align-items: flex-end`, wrap with `gap: 14px 24px`.

---

## 5. Shape & Elevation

- **Radius:** tiles/cards/panels `26px`; inputs `12px`; icon chips `14px`; pills/buttons `40px` (fully round).
- **Borders:** `1px solid oklch(0.9 0.01 88)` on light cards.
- **Hover elevation:** `border-color: oklch(0.67 0.15 47); box-shadow: 0 22px 44px oklch(0.2 0.03 158 / 0.1)` (cards) or `0 20px 40px oklch(0.2 0.03 158 / 0.08)` (feature tiles).
- **Image tiles:** `border-radius: 26px; overflow: hidden;` with an absolute gradient scrim for legible text — `linear-gradient(0deg, oklch(0.18 0.03 158 / 0.9) 6%, transparent 62%)`.

---

## 6. Buttons

| Variant | Style |
|---------|-------|
| **Primary (ember)** | `background: oklch(0.67 0.15 47); color: oklch(0.99 0.01 88);` → hover `background: oklch(0.98 0.01 88); color: oklch(0.23 0.03 158)` |
| **Primary (dark)** | `background: oklch(0.2 0.03 158); color: oklch(0.98 0.01 88);` → hover `background: oklch(0.67 0.15 47)` |
| **Outline on dark** | `background: transparent; border: 1px solid oklch(1 0 0 / 0.35); color: oklch(0.97 0.01 88);` → hover `border-color/color: oklch(0.8 0.14 52)` |
| **Text link (underline)** | Space Grotesk 600, `border-bottom: 2px solid oklch(0.67 0.15 47); padding-bottom: 4px` → hover color ember |

All buttons: Space Grotesk, `font-weight: 600`, `font-size: 14–16px`, `padding: 15px 30px` (large) / `11px 20px` (small), `border-radius: 40px`. Arrow `→` suffix on CTAs.

---

## 7. Chips / Pills

- **Category chip (accent):** ember or sky, tinted bg — e.g. `color: oklch(0.45 0.08 232); background: oklch(0.52 0.1 232 / 0.12)`, `padding: 5px 11px; border-radius: 40px`.
- **Neutral chip:** `color: oklch(0.5 0.02 160); background: oklch(0.9 0.01 88)`.
- **Badge on image (glass):** `background: oklch(0.2 0.03 158 / 0.72); backdrop-filter: blur(6px); color: oklch(0.98 0.01 88)`.
- **Solid status badge:** ember bg, white text (e.g. "6 spots left").

---

## 8. Forms

- Dark panel context: inputs `background: oklch(1 0 0 / 0.06); border: 1px solid oklch(1 0 0 / 0.16); color: oklch(0.98 0.01 88); border-radius: 12px; padding: 14px 16px`.
- Placeholder color `oklch(0.78 0.02 88)`.
- **Grid inputs must have** `box-sizing: border-box; width: 100%; min-width: 0;` to avoid overflow inside grid columns.
- Two-column form grid `grid-template-columns: 1fr 1fr; gap: 14px`, full-width fields use `grid-column: span 2`.
- Submit = primary ember button, full width.
- Success state replaces form with a bordered confirmation panel (`border: 1px solid oklch(0.8 0.14 52 / 0.5)`), driven by logic `sc-if`.

---

## 9. Icons

Custom inline SVG, `24×24`, `viewBox 0 0 24 24`, stroke `oklch(0.67 0.15 47)` at `stroke-width: 1.6`, built via `React.createElement` in the logic class. Housed in a `50×50` chip: `border-radius: 14px; background: oklch(0.67 0.15 47 / 0.12)`. Geometric/outdoor motifs (compass, peak, gear, leaf, clock, diamond). No emoji except sparing use in success copy.

---

## 10. Imagery

- Use `<image-slot>` placeholders (`shape="rect|circle" fit="cover"`) with a descriptive `placeholder` attribute and unique `id`.
- Every photographic tile carries a gradient scrim so overlaid text/chips stay legible.
- Star ratings rendered as `★★★★★` text in amber (dark bg) or ember (light bg), `letter-spacing: 2px`.

---

## 11. Shared Components

- `<dc-import name="Nav" active="…" hint-size="100%,120px">` at top of every page — pass the current page key via `active`.
- `<dc-import name="Footer" hint-size="100%,520px">` at bottom.
- Wrap page body: `font-family: 'Archivo', sans-serif; color: oklch(0.23 0.03 158); overflow-x: hidden; background: oklch(0.955 0.012 88);`

---

## 12. Responsive Logic Pattern

Bento layouts switch structure in JS, not CSS. In the logic class:
```js
componentDidMount() {
  this.mq = window.matchMedia('(max-width: 860px)');
  this.apply = () => this.setState({ isMobile: this.mq.matches });
  this.apply();
  this.mq.addEventListener('change', this.apply);
}
```
Then expose `gridStyle` (grid vs. flex-column) from `renderVals()` for every bento section.
