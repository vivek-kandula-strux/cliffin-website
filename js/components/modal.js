import { qs, qsa, on } from '../utils/dom.js';

const TRIPS = {
  'Himalayan High Trek': {
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80',
    alt: 'Snow-line ridge on a Himalayan trek',
    date: 'Oct 2026',
    spots: '8 spots left',
    location: 'Himachal',
    duration: '6 Days',
    difficulty: 'Moderate',
    price: '₹18,500',
    desc: 'Trek through snow-line trails and alpine meadows on a fully-supported 6-day Himalayan crossing. Summit views, glacial streams and guides who know every switchback.',
    includes: [
      'Expert mountain guides',
      'Camping gear & tents',
      'All meals on trail',
      'Mountain permits',
      'Group transport from Hyderabad',
    ],
  },
  'Nallamalla Night Camp': {
    img: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=900&q=80',
    alt: 'Camping tents beneath tall trees at dusk',
    date: 'Aug 2026',
    spots: '12 spots left',
    location: 'Srisailam Forest',
    duration: '2 Days',
    difficulty: 'Easy',
    price: '₹3,900',
    desc: 'Two days deep in the Nallamalla forest — bonfires, night walks with a naturalist, and star-gazing far from city lights. Perfect for first-timers and families.',
    includes: [
      'Forest guide & naturalist',
      'Camping gear & sleeping mats',
      'All meals + bonfire dinner',
      'Night wildlife walk',
      'Star-gazing session',
    ],
  },
  'Coastal Rappelling Expedition': {
    img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=80',
    alt: 'Dramatic sea cliff on the eastern coast',
    date: 'Sep 2026',
    spots: '6 spots left',
    location: 'Vizag Coast',
    duration: '3 Days',
    difficulty: 'Challenging',
    price: '₹7,500',
    desc: 'Descend dramatic sea cliffs up to 60m on the Vizag coast, then trek to hidden coves only reachable by rope. Our most adrenaline-packed weekend.',
    includes: [
      'Certified rappelling instructor',
      'All safety gear & harnesses',
      'Sea cliff descents (up to 60m)',
      'Hidden cove coastal trek',
      'Meals & cliff-side camp',
    ],
  },
};

const GENERAL_ENQUIRY = {
  img: 'assets/images/cliffinnadventures/hero/cliffside-panorama.webp',
  alt: 'Dramatic coastal cliffs rising above the sea at golden light',
  date: 'Year-round',
  spots: 'Small groups',
  location: 'India',
  duration: 'Tailored',
  difficulty: 'All levels',
  price: 'Custom',
  desc: "Tell us your group, dates and goals — we'll craft a fully-guided adventure around you. No payment now; our team calls within 24 hours.",
  includes: [
    'Dedicated trip designer',
    'Certified guides',
    'Safety gear & permits',
    'Custom itinerary',
    'Flexible dates',
  ],
};

export function initModal() {
  const modal = document.getElementById('trip-modal');
  if (!modal) return;

  const backdrop = modal.querySelector('.modal__backdrop');
  const closeBtn = modal.querySelector('.modal__close');
  const container = modal.querySelector('.modal__container');
  const form = modal.querySelector('[data-form="modal-interest"]');
  const title = modal.querySelector('#modal-title');

  let lastFocused = null;
  let focusTrapHandler = null;

  // ---- Open ----
  function openModal(tripName, triggerEl) {
    const trip = tripName === 'General enquiry' ? GENERAL_ENQUIRY : TRIPS[tripName];
    if (!trip) return;

    lastFocused = triggerEl || document.activeElement;

    resetForm();
    populate(trip, tripName);

    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';

    // Trigger enter animation
    container.removeAttribute('data-entering');
    void container.offsetWidth;
    container.setAttribute('data-entering', '');

    focusTrapHandler = createFocusTrap(modal);
    document.addEventListener('keydown', focusTrapHandler);

    requestAnimationFrame(() => title?.focus());
  }

  // ---- Close ----
  function closeModal() {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
    container.removeAttribute('data-entering');

    if (focusTrapHandler) {
      document.removeEventListener('keydown', focusTrapHandler);
      focusTrapHandler = null;
    }

    lastFocused?.focus();
  }

  // ---- Populate visual panel ----
  function populate(trip, name) {
    qs('#modal-img').src = trip.img;
    qs('#modal-img').alt = trip.alt;
    qs('#modal-date').textContent = trip.date;
    qs('#modal-spots').textContent = trip.spots;
    qs('#modal-location').textContent = trip.location;
    qs('#modal-duration').textContent = trip.duration;
    qs('#modal-difficulty').textContent = trip.difficulty;
    qs('#modal-title').textContent = name;
    qs('#modal-desc').textContent = trip.desc;
    qs('#modal-price').textContent = trip.price;

    const tripInput = form?.querySelector('[name="trip"]');
    if (tripInput) tripInput.value = name;

    qs('#modal-includes').innerHTML = trip.includes
      .map((i) => `<li>${i}</li>`)
      .join('');
  }

  // ---- Reset form state ----
  function resetForm() {
    if (!form) return;
    form.hidden = false;
    form.reset();

    form.querySelectorAll('.field').forEach((f) => {
      f.dataset.invalid = 'false';
    });

    const status = form.querySelector('[data-form-status]');
    if (status) {
      status.textContent = '';
      delete status.dataset.state;
    }

    const successPanel = modal.querySelector('[data-form-success]');
    if (successPanel) successPanel.hidden = true;
  }

  // ---- Wire up trip-card buttons ----
  qsa('a[data-trip]').forEach((btn) => {
    on(btn, 'click', (e) => {
      e.preventDefault();
      openModal(btn.getAttribute('data-trip'), btn);
    });
  });

  // ---- Wire up generic modal-open triggers ----
  qsa('[data-modal-open]').forEach((trigger) => {
    on(trigger, 'click', (e) => {
      e.preventDefault();
      const tripName = trigger.dataset.modalTrip || 'General enquiry';
      openModal(tripName, trigger);
    });
  });

  // ---- Close triggers ----
  on(closeBtn, 'click', closeModal);
  on(backdrop, 'click', closeModal);

  on(document, 'keydown', (e) => {
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')) closeModal();
  });

  // ---- Helpers ----
  function qs(sel) {
    return modal.querySelector(sel);
  }
}

function createFocusTrap(root) {
  const focusableSelector =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  return function trap(event) {
    if (event.key !== 'Tab') return;

    const focusable = Array.from(root.querySelectorAll(focusableSelector)).filter(
      (el) => !el.closest('[hidden]') && getComputedStyle(el).display !== 'none'
    );

    if (focusable.length < 2) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
}
