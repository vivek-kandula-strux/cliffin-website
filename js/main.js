/**
 * Entry point — loaded as an ES module from every page (<script type="module">).
 * Registers the .js enhancement class synchronously so initial animation
 * states apply before first paint, then wires up the components.
 */

// Set the enhancement class immediately (before DOM ready) so that
// [data-animate] initial states apply in CSS without a flash of unstyled content.
document.documentElement.classList.add('js');

import { initNavigation } from './components/navigation.js';
import { initForms } from './components/form.js';
import { initGalleryFilter } from './components/gallery.js';
import { initAnimations } from './animations/index.js';
import { initPageTransitions } from './animations/page-transitions.js';
import { initModal } from './components/modal.js';

function boot() {
  initNavigation();
  initForms();
  initGalleryFilter();
  initAnimations();
  initPageTransitions();
  initModal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
