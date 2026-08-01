import { qs, qsa, on } from '../utils/dom.js';

/**
 * Gallery filter buttons.
 * Filters items with data-cat matching the pressed button's data-filter.
 * "all" shows everything. Uses aria-pressed for state.
 */
export function initGalleryFilter() {
  const filterRow = qs('[data-gallery-filter]');
  const gallery = qs('[data-gallery-grid]');
  if (!filterRow || !gallery) return;

  const items = qsa('[data-cat]', gallery);

  on(filterRow, 'click', (event) => {
    const btn = event.target.closest('.filter-btn');
    if (!btn) return;
    const target = btn.dataset.filter || 'all';
    qsa('.filter-btn', filterRow).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    items.forEach((item) => {
      const cat = item.dataset.cat;
      const show = target === 'all' || cat === target;
      item.hidden = !show;
    });
  });
}
