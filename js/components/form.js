import { qs, qsa, on } from '../utils/dom.js';
import { config } from '../config.js';

/**
 * Contact / interest form.
 *
 * Any <form> with data-form="contact" or data-form="interest" is wired up:
 *   - Client-side required + email validation, marks fields with data-invalid
 *   - Submits as JSON to config.WEBHOOK_URL (Google Apps Script Web App)
 *   - Uses mode: 'no-cors' fallback if the server responds with an opaque
 *     type — Apps Script commonly does, so we treat any completed fetch as success
 *   - Announces status through an aria-live region
 *   - Swaps to a success panel on success (or shows an error message on failure)
 */
export function initForms() {
  qsa('form[data-form]').forEach(setupForm);
}

function setupForm(form) {
  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('button[type="submit"]');
  const success = form.parentElement.querySelector('[data-form-success]');

  on(form, 'submit', async (event) => {
    event.preventDefault();
    if (!validate(form)) {
      announce(status, 'Please check the highlighted fields.', 'error');
      focusFirstInvalid(form);
      return;
    }

    const payload = {
      form: form.dataset.form,
      page: window.location.pathname,
      submittedAt: new Date().toISOString(),
      ...serialize(form),
    };

    setSubmitting(submit, status, true);

    try {
      await sendToWebhook(payload);
      showSuccess(form, success);
      form.reset();
    } catch (error) {
      announce(status, 'Something went wrong. Please email us at cliffinnadventures@gmail.com or try again.', 'error');
      // eslint-disable-next-line no-console
      console.error('[form] submit failed:', error);
    } finally {
      setSubmitting(submit, status, false);
    }
  });

  // Clear invalid state as the user fixes fields
  on(form, 'input', (event) => {
    const field = event.target.closest('.field');
    if (field?.dataset.invalid === 'true') {
      field.dataset.invalid = 'false';
    }
  });
}

function focusFirstInvalid(form) {
  const firstInvalid = form.querySelector('.field[data-invalid="true"]');
  if (!firstInvalid) return;
  const control = firstInvalid.querySelector('input, textarea, select');
  if (control) control.focus();
}

function validate(form) {
  let valid = true;

  qsa('.field', form).forEach((field) => {
    field.dataset.invalid = 'false';
  });

  qsa('[required]', form).forEach((el) => {
    const field = el.closest('.field');
    if (!el.value.trim()) {
      if (field) field.dataset.invalid = 'true';
      valid = false;
    }
  });

  qsa('input[type="email"]', form).forEach((el) => {
    if (el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim())) {
      const field = el.closest('.field');
      if (field) field.dataset.invalid = 'true';
      valid = false;
    }
  });

  return valid;
}

function serialize(form) {
  const data = {};
  new FormData(form).forEach((value, key) => {
    data[key] = typeof value === 'string' ? value.trim() : value;
  });
  return data;
}

function setSubmitting(submitBtn, status, sending) {
  if (submitBtn) {
    submitBtn.disabled = sending;
    if (sending) {
      submitBtn.dataset.originalLabel = submitBtn.dataset.originalLabel || submitBtn.textContent;
      submitBtn.textContent = 'Sending…';
    } else if (submitBtn.dataset.originalLabel) {
      submitBtn.textContent = submitBtn.dataset.originalLabel;
    }
  }
  if (sending) announce(status, 'Sending your message…', 'sending');
}

function announce(status, message, state) {
  if (!status) return;
  status.textContent = message;
  status.dataset.state = state;
}

function showSuccess(form, panel) {
  const status = form.querySelector('[data-form-status]');
  if (status) {
    status.textContent = '';
    delete status.dataset.state;
  }
  form.hidden = true;
  if (panel) panel.hidden = false;
}

async function sendToWebhook(payload) {
  const url = config.WEBHOOK_URL;

  if (!url) {
    // Development mode — the deploy hasn't been configured yet.
    // Simulate a successful send so the UI can be exercised.
    // eslint-disable-next-line no-console
    console.warn('[form] WEBHOOK_URL is empty. Payload would be:', payload);
    await new Promise((resolve) => setTimeout(resolve, 400));
    return;
  }

  await fetch(url, {
    method: 'POST',
    mode: 'no-cors', // Apps Script Web Apps commonly return opaque responses
    redirect: 'follow',
    body: JSON.stringify(payload),
    headers: {
      // 'text/plain' avoids the CORS preflight for Apps Script deployments
      'Content-Type': 'text/plain;charset=utf-8',
    },
  });
}
