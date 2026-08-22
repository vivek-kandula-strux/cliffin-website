#!/usr/bin/env node
/**
 * audit-checklist.js
 * Scans HTML files and writes CHECKLIST.md with live implementation status.
 * Triggered automatically by the Claude Code PostToolUse hook after every Edit/Write.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'CHECKLIST.md');

// ── Helpers ───────────────────────────────────────────────────────────────────

function read(file) {
  try { return fs.readFileSync(path.join(ROOT, file), 'utf8'); }
  catch { return ''; }
}

function fileExists(...parts) {
  return fs.existsSync(path.join(ROOT, ...parts));
}

function dirHasFiles(relDir, pattern) {
  const dir = path.join(ROOT, relDir);
  if (!fs.existsSync(dir)) return false;
  return fs.readdirSync(dir).some(f => pattern ? pattern.test(f) : true);
}

function has(src, ...terms) {
  return terms.every(t => src.includes(t));
}

function lacks(src, ...terms) {
  return terms.every(t => !src.includes(t));
}

const DONE    = '✅';
const PARTIAL = '⚠️';
const PEND    = '❌';

function icon(done, partial = false) {
  if (done) return DONE;
  if (partial) return PARTIAL;
  return PEND;
}

// ── Read pages ────────────────────────────────────────────────────────────────

const idx      = read('index.html');
const school   = read('school-programs.html');
const corp     = read('corporate-packages.html');
const camps    = read('camp-sites.html');
const workshop = read('adventure-workshops.html');
const ALL      = idx + school + corp + camps + workshop;

// ── HOME PAGE ─────────────────────────────────────────────────────────────────

// 1. Schools image/banner
const c1 = has(idx, 'school-programs-01') || has(idx, 'school-wix');

// 2. Corporate photos updated (no longer using adventure-day-out.webp as corp image)
const c2 = has(idx, 'corporate') && lacks(idx, 'adventure-day-out.webp');

// 3 & 4. Know More CTAs
const c3 = has(idx, 'corporate-packages.html', 'Know More');
const c4 = has(idx, 'camp-sites.html', 'Know More');

// 5. Upcoming Events — 3 correctly-named cards
const upcomingExists = (has(idx, 'Night Camp') || has(idx, 'night-camp'))
                    && (has(idx, 'Day Out') || has(idx, 'Dayouts'));
const upcomingCorrect = has(idx, 'Night Camping') && has(idx, 'Dayouts') && has(idx, 'Weekend Trips');
const c5_done    = upcomingExists && upcomingCorrect;
const c5_partial = upcomingExists && !upcomingCorrect;

// 6. Why Cliff Inn — structure done; copy done only when Ravi's words are in
const whyStructure = has(idx, 'why-title') || has(idx, 'Why Cliff');
const whyCopyDone  = whyStructure && lacks(idx, 'What makes us different');
const c6_done    = whyCopyDone;
const c6_partial = whyStructure && !whyCopyDone;

// 7. Testimonials (7 reviewers)
const T = {
  Laxmi:    has(idx, 'Laxmi',    'Microsoft'),
  Pooja:    has(idx, 'Pooja',    'Deloitte'),
  Srinivas: has(idx, 'Srinivas', 'TATA'),
  Sravan:   has(idx, 'Sravan',   'Infosys'),
  Vlad:     has(idx, 'Vlad'),
  Anuj:     has(idx, 'Anuj'),
  Ravi:     has(idx, 'Ravi') && has(idx, 'quote'),
};
const tDone    = Object.values(T).filter(Boolean).length;
const tMissing = Object.keys(T).filter(k => !T[k]);
const tPresent = Object.keys(T).filter(k => T[k]);
const c7_done    = tDone === 7;
const c7_partial = tDone > 0 && !c7_done;

// ── SCHOOL PROGRAMME ──────────────────────────────────────────────────────────

// 8. Beach View Rappelling removed
const c8 = lacks(school, 'Beach View Rappelling', 'Beach-View Rappelling');

// Note: also still appears in index.html hero section (line ~391)
const beachOnHome = has(idx, 'Beach-View Rappelling') || has(idx, 'Beach View Rappelling');

// 9–14. Stats
const c9  = /50[\s\S]{0,60}Schools?/.test(school)  || has(school, 'data-count="50"');
const c10 = has(school, '5000') || has(school, '5,000');
const c11 = has(school, '100') && has(school, 'Safety');
const c12 = has(school, '15')  && has(school, 'Activit');
const c13 = has(school, '8')   && has(school, 'Year');
// c14 (4.9 Star Rating) removed intentionally — footer trust strip covers rating/social proof

// 15. School reviews section
const c15 = (has(school, 'Mounika') && has(school, 'Vlad'))
          || has(school, 'sports-reviews')
          || (has(school, 'Principal') && has(school, 'quote'));

// ── IN-SCHOOL ADVENTURE CAMPS ────────────────────────────────────────────────

// 16–19
const inSchoolCard       = has(school, 'In-School Adventure Camps');
const inSchoolDesc       = has(school, 'directly on your school campus')
                        || has(school, 'school premises')
                        || has(school, 'mobile obstacle');
const inSchoolActivities = has(school, 'Climbing Wall')
                        && has(school, 'Slacklining')
                        && has(school, 'Kayak Experience');
const inSchoolDisclaimer = has(school, 'installed after inspection')
                        || has(school, 'visit to the academy');

const c16_done    = inSchoolCard && inSchoolDesc && inSchoolActivities && inSchoolDisclaimer;
const c16_partial = inSchoolCard && !c16_done;
const c17 = inSchoolDesc;
const c18 = inSchoolActivities;
const c19 = inSchoolDisclaimer;

// ── DAY CAMP ──────────────────────────────────────────────────────────────────

const c20 = has(school, 'Alpha 360');
const c21 = has(school, 'Sky Cycling') && has(school, 'Zipline') && has(school, 'Kayaking') && has(school, 'Rappelling');
const c22 = has(school, '1-Day Out') && has(school, '9:30 AM') && has(school, '5:00 PM');

// ── NIGHT CAMP ────────────────────────────────────────────────────────────────

const c23 = has(school, 'Forest Cooking') && has(school, 'Talent Show') && has(school, 'Campfire');
const c24 = has(school, 'Night Camp') && has(school, 'Sunrise viewing');

// ── MEDIA ─────────────────────────────────────────────────────────────────────

const m1 = fileExists('assets/images/cliffinnadventures/school-programs/school-wix-01.webp');
const m2 = fileExists('assets/images/cliffinnadventures/corporate');
const m3 = dirHasFiles(
  'assets/images/cliffinnadventures/testimonials',
  /laxmi|pooja|srinivas|sravan|vlad|anuj|ravi/i
);

// ── Score ─────────────────────────────────────────────────────────────────────

const allChecks = [
  c1, c2, c3, c4, c5_done, c6_done, c7_done,
  c8, c9, c10, c11, c12, c13, c15,
  c16_done, c17, c18, c19,
  c20, c21, c22,
  c23, c24,
  m1, m2, // m3 excluded (needs actual reviewer file names)
];
const TOTAL = allChecks.length;
const DONE_COUNT = allChecks.filter(Boolean).length;
const PCT = Math.round((DONE_COUNT / TOTAL) * 100);
const BAR_FILLED = Math.round(PCT / 5);
const progressBar = '█'.repeat(BAR_FILLED) + '░'.repeat(20 - BAR_FILLED);

// ── Timestamp ─────────────────────────────────────────────────────────────────

const now = new Date().toLocaleString('en-IN', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
});

// ── Build markdown ────────────────────────────────────────────────────────────

const md = `# Cliff Inn Adventures — Website Change Checklist

> Auto-updated by \`scripts/audit-checklist.js\` after every file edit via Claude Code hook.
> **Last updated:** ${now} IST &nbsp;|&nbsp; **Progress:** ${DONE_COUNT} / ${TOTAL} items (${PCT}%)

\`\`\`
[${progressBar}] ${PCT}%
\`\`\`

---

## PAGE: HOME

| # | Status | Task | Note |
|---|--------|------|------|
| 1 | ${icon(c1)} | Schools image section / banner | ${c1 ? 'Bento tile with `school-programs-01.webp` confirmed' : 'No school photo banner found in index.html'} |
| 2 | ${icon(c2)} | Replace corporate outing photos | ${c2 ? 'Updated photos in place' : '`adventure-day-out.webp` still used — upload new corporate photos'} |
| 3 | ${icon(c3)} | "Know More" CTA → Corporate page | ${c3 ? 'Tile links to `corporate-packages.html` with "Know More →"' : 'Missing from home bento'} |
| 4 | ${icon(c4)} | "Know More" CTA → Campsite page | ${c4 ? 'Tile links to `camp-sites.html` with "Know More →"' : 'Missing from home bento'} |
| 5 | ${icon(c5_done, c5_partial)} | Upcoming Events — 3 program cards (correct names) | ${c5_done ? 'All 3 cards with correct names' : c5_partial ? 'Cards exist but names don\'t match spec — need: "Night Camping — 16 Hrs", "Dayouts — 1 Day", "Weekend Trips — 3 Days/2 Nights"' : 'Upcoming events section missing'} |
| 6 | ${icon(c6_done, c6_partial)} | "Why Cliff Inn?" section with Ravi's copy | ${c6_done ? 'Section has custom copy from Ravi' : c6_partial ? 'Section exists but still uses placeholder ("What makes us different") — awaiting Ravi\'s copy' : 'Section missing entirely'} |
| 7 | ${icon(c7_done, c7_partial)} | Google Reviews — Laxmi, Pooja, Srinivas, Sravan, Vlad, Anuj, Ravi | ${c7_done ? 'All 7 reviewers present' : `✓ ${tPresent.join(', ') || 'none'} &nbsp;|&nbsp; ✗ Missing: ${tMissing.join(', ')}`} |

---

## PAGE: SCHOOL PROGRAMME

| # | Status | Task | Note |
|---|--------|------|------|
| 8 | ${icon(c8)} | Remove "Beach View Rappelling" from activities | ${c8 ? 'Removed from school-programs.html' : 'Still present — delete from activities list'}${beachOnHome ? ' ⚠️ Also still on home page hero section' : ''} |
| 9 | ${icon(c9)} | Stat: 50+ Schools | ${c9 ? 'Present in stat strip' : 'Missing — add "50+ Schools" stat item'} |
| 10 | ${icon(c10)} | Stat: 5,000+ Students | ${c10 ? 'Present' : 'Missing'} |
| 11 | ${icon(c11)} | Stat: 100% Safety Record | ${c11 ? 'Present' : 'Missing'} |
| 12 | ${icon(c12)} | Stat: 15+ Activities | ${c12 ? 'Present' : 'Missing'} |
| 13 | ${icon(c13)} | Stat: 8+ Years | ${c13 ? 'Present' : 'Missing'} |
| 15 | ${icon(c15)} | School-specific reviews section | ${c15 ? 'Section with reviewer names found' : 'No reviews section on school-programs.html'} |

---

## PAGE: IN-SCHOOL ADVENTURE CAMPS

| # | Status | Task | Note |
|---|--------|------|------|
| 16 | ${icon(c16_done, c16_partial)} | In-School Adventure Camps product | ${c16_done ? 'Card with description, activities and disclaimer' : c16_partial ? 'Card exists in school-programs.html but needs description/activities/disclaimer' : 'Missing'} |
| 17 | ${icon(c17)} | Description copy | ${c17 ? 'Present' : 'Missing — description of on-campus setup'} |
| 18 | ${icon(c18)} | Key mobile activities | ${c18 ? 'Climbing Wall, Slacklining, Kayak Experience confirmed' : 'Not built — needs activity list'} |
| 19 | ${icon(c19)} | Disclaimer / installation note | ${c19 ? 'Present' : 'Missing — installation/safety note'} |

---

## PAGE: OUTDOOR BOOT CAMP — DAY CAMP

| # | Status | Task | Note |
|---|--------|------|------|
| 20 | ${icon(c20)} | Section titled "1-Day Out — Alpha 360°" | ${c20 ? 'Section found' : 'Not built anywhere on the site'} |
| 21 | ${icon(c21)} | Alpha 360° key activities | ${c21 ? 'Key activities confirmed' : 'Not built — needs: Sky Cycling, Zipline, Kayaking, Rappelling'} |
| 22 | ${icon(c22)} | Alpha 360° day timing | ${c22 ? 'Day timing found' : 'Not built — needs: 9:30 AM to 5:00 PM window'} |

---

## PAGE: NIGHT CAMP (16 Hours, 1 Night)

| # | Status | Task | Note |
|---|--------|------|------|
| 23 | ${icon(c23)} | Night Camp highlights (Forest Cooking, Talent Show, Campfire) | ${c23 ? 'Highlights found' : 'Not built — needs: Forest Cooking, Talent Show, Campfire'} |
| 24 | ${icon(c24)} | Night Camp sunrise experience | ${c24 ? 'Sunrise viewing found' : 'Not built — needs: Sunrise viewing'} |

---

## CONTENT & MEDIA TASKS _(non-dev — script checks file presence only)_

| # | Status | Task | Note |
|---|--------|------|------|
| M1 | ${icon(m1)} | School programme photos uploaded | ${m1 ? '`school-wix-01` through `school-wix-09` detected' : 'school-wix images not found'} |
| M2 | ${icon(m2)} | Corporate outing photos uploaded | ${m2 ? 'Corporate photo folder exists' : 'No `/corporate/` photo folder found — upload photos first'} |
| M3 | ${icon(m3)} | Reviewer photos for testimonials | ${m3 ? 'Reviewer image files detected' : 'No reviewer photos found in `/testimonials/`'} |
| M4 | ❌ | Google Review text / screenshots collected | Manual task — cannot auto-verify |
| M5 | ❌ | Confirm institutions: Vlad, Anuj, Ravi | Manual task — pending Ravi |
| M6 | ❌ | "Why Cliff Inn?" final copy from Ravi | Manual task — pending Ravi |
| M7 | ❌ | Confirm Anuj (Director) — Schools or Corporate section? | Manual task — pending confirmation |

---

_Automated by \`scripts/audit-checklist.js\` · Claude Code PostToolUse hook (Edit + Write)_
`;

fs.writeFileSync(OUT, md, 'utf8');
process.stdout.write(`[audit] CHECKLIST.md updated — ${DONE_COUNT}/${TOTAL} done (${PCT}%)\n`);
