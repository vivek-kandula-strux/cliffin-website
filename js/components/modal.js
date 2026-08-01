import { config } from '../config.js';

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

export function initModal() {
  const modal = document.getElementById('trip-modal');
  if (!modal) return;

  const backdrop  = modal.querySelector('.modal__backdrop');
  const closeBtn  = modal.querySelector('.modal__close');
  const container = modal.querySelector('.modal__container');
  const form      = modal.querySelector('[data-modal-form]');
  const formStatus = form?.querySelector('[data-modal-form-status]');
  const successPanel = modal.querySelector('[data-modal-success]');

  let lastFocused = null;

  // ---- Open ----
  function openModal(tripName, triggerEl) {
    const trip = TRIPS[tripName];
    if (!trip) return;

    lastFocused = triggerEl || document.activeElement;

    resetForm(tripName);
    populate(trip, tripName);

    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';

    // Trigger enter animation
    container.removeAttribute('data-entering');
    void container.offsetWidth;
    container.setAttribute('data-entering', '');

    requestAnimationFrame(() => closeBtn.focus());
  }

  // ---- Close ----
  function closeModal() {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
    container.removeAttribute('data-entering');
    lastFocused?.focus();
  }

  // ---- Populate visual panel ----
  function populate(trip, name) {
    qs('#modal-img').src = trip.img;
    qs('#modal-img').alt = trip.alt;
    qs('#modal-date').textContent   = trip.date;
    qs('#modal-spots').textContent  = trip.spots;
    qs('#modal-location').textContent   = trip.location;
    qs('#modal-duration').textContent   = trip.duration;
    qs('#modal-difficulty').textContent = trip.difficulty;
    qs('#modal-title').textContent  = name;
    qs('#modal-desc').textContent   = trip.desc;
    qs('#modal-price').textContent  = trip.price;

    const tripInput = form?.querySelector('[name="trip"]');
    if (tripInput) tripInput.value = name;

    qs('#modal-includes').innerHTML = trip.includes
      .map(i => `<li>${i}</li>`)
      .join('');
  }

  // ---- Reset form state ----
  function resetForm(tripName) {
    if (!form) return;
    form.hidden = false;
    form.reset();

    form.querySelectorAll('.field').forEach(f => {
      f.dataset.invalid = 'false';
    });

    if (formStatus) formStatus.textContent = '';
    if (successPanel) successPanel.hidden = true;
  }

  // ---- Wire up card buttons ----
  document.querySelectorAll('a[data-trip]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      openModal(btn.getAttribute('data-trip'), btn);
    });
  });

  // ---- Close triggers ----
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')) closeModal();
  });

  // ---- Focus trap ----
  document.addEventListener('keydown', e => {
    if (modal.hasAttribute('hidden') || e.key !== 'Tab') return;

    const focusable = Array.from(
      modal.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.closest('[hidden]') && getComputedStyle(el).display !== 'none');

    if (focusable.length < 2) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // ---- Form submission ----
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      if (!validateForm(form)) {
        if (formStatus) formStatus.textContent = 'Please fill in the highlighted fields.';
        const bad = form.querySelector('.field[data-invalid="true"] input, .field[data-invalid="true"] textarea');
        bad?.focus();
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      setLoading(submitBtn, true);
      if (formStatus) formStatus.textContent = '';

      try {
        await sendToWebhook({
          form: 'modal-interest',
          page: window.location.pathname,
          submittedAt: new Date().toISOString(),
          ...serializeForm(form),
        });

        form.hidden = true;
        if (successPanel) successPanel.hidden = false;
        form.reset();
      } catch {
        if (formStatus) {
          formStatus.textContent =
            'Something went wrong — please email cliffinnadventures@gmail.com or try again.';
        }
      } finally {
        setLoading(submitBtn, false);
      }
    });

    form.addEventListener('input', e => {
      const field = e.target.closest('.field');
      if (field?.dataset.invalid === 'true') field.dataset.invalid = 'false';
    });
  }

  // ---- Helpers ----
  function qs(sel) { return modal.querySelector(sel); }
}

function validateForm(form) {
  let valid = true;

  form.querySelectorAll('.field').forEach(f => { f.dataset.invalid = 'false'; });

  form.querySelectorAll('[required]').forEach(input => {
    const field = input.closest('.field');
    if (!input.value.trim()) {
      if (field) field.dataset.invalid = 'true';
      valid = false;
    }
  });

  form.querySelectorAll('input[type="email"]').forEach(input => {
    if (input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
      const field = input.closest('.field');
      if (field) field.dataset.invalid = 'true';
      valid = false;
    }
  });

  return valid;
}

function serializeForm(form) {
  const data = {};
  new FormData(form).forEach((value, key) => {
    data[key] = typeof value === 'string' ? value.trim() : value;
  });
  return data;
}

function setLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.dataset.label = btn.textContent;
    btn.textContent = 'Sending…';
  } else if (btn.dataset.label) {
    btn.textContent = btn.dataset.label;
  }
}

async function sendToWebhook(payload) {
  const url = config.WEBHOOK_URL;

  if (!url) {
    // Dev mode — simulate a round-trip so the UI can be tested.
    await new Promise(r => setTimeout(r, 700));
    return;
  }

  await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    redirect: 'follow',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  });
}
