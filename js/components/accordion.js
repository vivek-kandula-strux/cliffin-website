/**
 * Accessible accordion.
 *
 * - Wires up every `[data-accordion]` container.
 * - Items toggle via `[data-accordion-trigger]` / `[data-accordion-panel]`.
 * - Add `data-accordion-single` to keep only one item open at a time.
 * - Uses `inert` + `aria-hidden` for accessibility while keeping the panel
 *   animateable with CSS `grid-template-rows`.
 */

export function initAccordion() {
  document.querySelectorAll('[data-accordion]').forEach((accordion) => {
    const single = accordion.hasAttribute('data-accordion-single');
    const items = Array.from(accordion.querySelectorAll('[data-accordion-item]'));

    items.forEach((item) => {
      const trigger = item.querySelector('[data-accordion-trigger]');
      const panel = item.querySelector('[data-accordion-panel]');
      if (!trigger || !panel) return;

      const setOpen = (open) => {
        trigger.setAttribute('aria-expanded', String(open));
        panel.setAttribute('aria-hidden', String(!open));
        if (open) {
          panel.removeAttribute('inert');
          item.classList.add('is-open');
        } else {
          panel.setAttribute('inert', '');
          item.classList.remove('is-open');
        }
      };

      trigger.addEventListener('click', () => {
        const willOpen = trigger.getAttribute('aria-expanded') !== 'true';

        if (single && willOpen) {
          items.forEach((otherItem) => {
            if (otherItem === item) return;
            const otherTrigger = otherItem.querySelector('[data-accordion-trigger]');
            const otherPanel = otherItem.querySelector('[data-accordion-panel]');
            if (otherTrigger && otherPanel) {
              otherTrigger.setAttribute('aria-expanded', 'false');
              otherPanel.setAttribute('aria-hidden', 'true');
              otherPanel.setAttribute('inert', '');
              otherItem.classList.remove('is-open');
            }
          });
        }

        setOpen(willOpen);
      });

      trigger.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        const idx = items.indexOf(item);
        const nextIdx = e.key === 'ArrowDown'
          ? (idx + 1) % items.length
          : (idx - 1 + items.length) % items.length;
        items[nextIdx]?.querySelector('[data-accordion-trigger]')?.focus();
      });

      // Initialize collapsed state
      setOpen(false);
    });
  });
}
