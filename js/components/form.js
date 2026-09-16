import { qsa, on } from '../utils/dom.js';
import { config } from '../config.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUDIENCE_CATEGORIES = {
  'School group': 'school programs',
  'Corporate / Group': 'corporate packages',
  'Independent / Family': 'camp sites',
};
const NOT_SURE_VALUE = 'Not sure — help me choose';

/**
 * Contact / interest form.
 *
 * Any <form> with data-form="contact", data-form="interest" or
 * data-form="modal-interest" is wired up:
 *   - Client-side required, contact-choice, email and phone validation
 *   - Honeypot field check (bots that fill the hidden field are rejected silently)
 *   - Submits as JSON to config.WEBHOOK_URL (Google Apps Script Web App)
 *   - Uses mode: 'no-cors' fallback if the server responds with an opaque
 *     type — Apps Script commonly does, so we treat any completed fetch as success
 *   - Announces status through an aria-live region
 *   - Swaps to a success panel on success (or shows an error message on failure)
 */
export function initForms() {
  qsa('form[data-form]').forEach((form, index) => setupForm(form, index));
}

function setupForm(form, formIndex) {
  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('button[type="submit"]');
  const success = findSuccessPanel(form);

  enhanceContactChoice(form);
  enhanceInterestChoices(form, formIndex);
  enhanceContactFormCopy(form);
  connectInlineErrors(form, formIndex);

  on(form, 'submit', async (event) => {
    event.preventDefault();

    if (isHoneypotFilled(form)) {
      // Silently reject bot submissions without revealing the trap.
      return;
    }

    if (!validate(form)) {
      announce(status, 'Please check the highlighted fields.', 'error');
      focusFirstInvalid(form);
      return;
    }

    const signatureCanvas = form.querySelector('[data-signature-pad]');
    if (signatureCanvas?.signaturePad?.isEmpty()) {
      const field = signatureCanvas.closest('.field');
      if (field) setFieldInvalid(field, true);
      announce(status, 'Please check the highlighted fields.', 'error');
      return;
    }

    const payload = {
      form: form.dataset.form,
      page: window.location.pathname,
      submittedAt: new Date().toISOString(),
      ...serialize(form),
      ...(signatureCanvas?.signaturePad ? { signature: signatureCanvas.signaturePad.getDataUrl() } : {}),
    };

    form.setAttribute('aria-busy', 'true');
    setSubmitting(submit, status, true);

    try {
      await sendToWebhook(payload, webhookUrlFor(form));
      showSuccess(form, success);
      form.reset();
    } catch (error) {
      announce(status, 'Something went wrong. Please email us at cliffinnadventures@gmail.com or try again.', 'error');
      // eslint-disable-next-line no-console
      console.error('[form] submit failed:', error);
    } finally {
      form.removeAttribute('aria-busy');
      setSubmitting(submit, status, false);
    }
  });

  // Once an error has been shown, clear it only when the value is valid.
  on(form, 'input', (event) => {
    const field = event.target.closest('.field');
    if (!field) return;

    if (event.target.matches('[data-contact-choice]')) {
      updateContactChoiceErrors(form);
      return;
    }

    if (field.dataset.invalid === 'true' && isFieldValid(field)) setFieldInvalid(field, false);
  });

  // A drawn signature clears the pad's error state (canvas input isn't covered above).
  on(form, 'signature:drawn', (event) => {
    const field = event.target.closest('.field');
    if (field?.dataset.invalid === 'true') setFieldInvalid(field, false);
  });

  // Validate completed fields on blur, not while the user is still typing.
  on(form, 'focusout', (event) => {
    const control = event.target;
    if (!control.matches('input, textarea, select') || control.type === 'checkbox' || control.type === 'radio') return;
    validateControlOnBlur(control, form);
  });

  on(form, 'reset', () => {
    requestAnimationFrame(() => {
      qsa('.field', form).forEach((field) => {
        restoreFieldMessage(field);
        setFieldInvalid(field, false);
      });
      qsa('[data-signature-pad]', form).forEach((canvas) => canvas.signaturePad?.clear());
      form.dispatchEvent(new CustomEvent('form:reset-ui'));
    });
  });
}

function enhanceContactChoice(form) {
  // The waiver requires both email (PDF is emailed) and phone, so it keeps
  // plain [required] validation instead of the either/or contact choice.
  if (form.dataset.form === 'waiver') return;

  const email = form.querySelector('input[type="email"]');
  const phone = form.querySelector('input[type="tel"]');
  if (!email || !phone) return;

  const emailField = email.closest('.field');
  const phoneField = phone.closest('.field');
  if (!emailField || !phoneField) return;

  email.required = false;
  phone.required = false;
  email.dataset.contactChoice = 'true';
  phone.dataset.contactChoice = 'true';

  stripRequiredMarker(emailField.querySelector('.field__label'));
  stripRequiredMarker(phoneField.querySelector('.field__label'));
}

function enhanceInterestChoices(form, formIndex) {
  const audience = form.querySelector('select[name="audience"]');
  const field = form.querySelector('.field[data-required-group]');
  const group = field?.querySelector('.checkbox-group');
  if (!audience || !field || !group) return;

  const categories = qsa('.checkbox-group__category', group);
  if (!categories.length) return;

  const label = field.querySelector('.field__label');
  const hint = document.createElement('p');
  hint.className = 'field__hint';
  hint.id = `form-${formIndex}-interest-hint`;
  hint.setAttribute('aria-live', 'polite');
  label?.after(hint);

  const fallback = document.createElement('div');
  fallback.className = 'checkbox-group__fallback';
  fallback.innerHTML = `
    <label class="checkbox-chip checkbox-chip--fallback">
      <input type="checkbox" name="experiences" value="${NOT_SURE_VALUE}">
      <span>${NOT_SURE_VALUE}</span>
    </label>`;
  group.prepend(fallback);
  const notSure = fallback.querySelector('input');

  const toggle = document.createElement('button');
  toggle.className = 'form__reveal-all';
  toggle.type = 'button';
  toggle.textContent = 'See all experiences';
  group.id ||= `form-${formIndex}-experience-options`;
  toggle.setAttribute('aria-controls', group.id);
  toggle.setAttribute('aria-expanded', 'false');
  group.after(toggle);

  let showAll = false;

  const update = ({ resetChoices = false } = {}) => {
    const preferredCategory = AUDIENCE_CATEGORIES[audience.value];

    if (resetChoices) {
      qsa('input[type="checkbox"]', group).forEach((input) => {
        input.checked = false;
      });
    }

    field.hidden = !preferredCategory;
    if (!preferredCategory) return;

    categories.forEach((category) => {
      const title = category.querySelector('.checkbox-group__title')?.textContent.trim().toLowerCase();
      category.hidden = !showAll && title !== preferredCategory;
    });

    hint.textContent = showAll
      ? 'Showing every experience. Choose one or more.'
      : 'Showing recommended options. Not sure? Choose “Not sure — help me choose”.';
    toggle.textContent = showAll ? 'Show recommended only' : 'See all experiences';
    toggle.setAttribute('aria-expanded', String(showAll));
    setFieldInvalid(field, false);
  };

  on(audience, 'change', () => {
    showAll = false;
    update({ resetChoices: true });
  });

  on(toggle, 'click', () => {
    showAll = !showAll;
    update();
  });

  on(group, 'change', (event) => {
    if (!event.target.matches('input[type="checkbox"]')) return;

    if (event.target === notSure && notSure.checked) {
      qsa('input[type="checkbox"]', group).forEach((input) => {
        if (input !== notSure) input.checked = false;
      });
    } else if (event.target.checked) {
      notSure.checked = false;
    }

    if (group.querySelector('input[type="checkbox"]:checked')) setFieldInvalid(field, false);
  });

  on(form, 'form:reset-ui', () => {
    showAll = false;
    update();
  });

  update();
}

function enhanceContactFormCopy(form) {
  if (form.dataset.form !== 'contact') return;

  form.classList.add('form--lead');

  const message = form.querySelector('textarea[name="message"]');
  const messageField = message?.closest('.field');
  const messageLabel = messageField?.querySelector('.field__label');
  if (message && messageField) {
    if (messageLabel) messageLabel.textContent = 'Anything else? (optional)';
    message.placeholder = 'Optional details';
    const hint = document.createElement('p');
    hint.className = 'field__hint';
    hint.id = 'contact-message-hint';
    hint.textContent = 'Group size, preferred dates, and anything else we should know.';
    message.after(hint);
    addDescribedBy(message, hint.id);
  }

  const submit = form.querySelector('button[type="submit"]');
  if (!submit) return;

  submit.innerHTML = 'Get My Tailored Plan <span aria-hidden="true">→</span>';
  const note = document.createElement('p');
  note.className = 'form__submit-note form__row-full';
  note.textContent = 'No payment. We’ll reply within 24 hours.';
  submit.before(note);
}

function connectInlineErrors(form, formIndex) {
  qsa('.field', form).forEach((field, fieldIndex) => {
    const error = field.querySelector('.field__error');
    if (!error) return;

    error.dataset.defaultText ||= error.textContent;
    error.id ||= `form-${formIndex}-field-${fieldIndex}-error`;
    const controls = field.dataset.requiredGroup
      ? field.querySelectorAll('input')
      : field.querySelectorAll('input, textarea, select');
    if (!controls.length) return;

    controls.forEach((control) => {
      addDescribedBy(control, error.id);
    });
  });
}

function addDescribedBy(control, id) {
  const describedBy = new Set((control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
  describedBy.add(id);
  control.setAttribute('aria-describedby', [...describedBy].join(' '));
}

function stripRequiredMarker(label) {
  if (!label) return;
  label.textContent = label.textContent.replace(/\s*\*\s*$/, '');
}

function setFieldInvalid(field, invalid) {
  field.dataset.invalid = invalid ? 'true' : 'false';
  const controls = field.querySelectorAll('input, textarea, select');
  controls.forEach((control) => {
    if (invalid) control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  });
}

function setFieldMessage(field, message) {
  const error = field?.querySelector('.field__error');
  if (!error) return;
  error.dataset.defaultText ||= error.textContent;
  error.textContent = message;
}

function restoreFieldMessage(field) {
  const error = field?.querySelector('.field__error');
  if (error?.dataset.defaultText) error.textContent = error.dataset.defaultText;
}

function findSuccessPanel(form) {
  // Success panel is typically a sibling of the form inside the same parent.
  return form.parentElement?.querySelector('[data-form-success]');
}

function isHoneypotFilled(form) {
  const honeypot = form.querySelector('[name="website"]');
  return honeypot && honeypot.value.trim() !== '';
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
    restoreFieldMessage(field);
    setFieldInvalid(field, false);
  });

  qsa('[required]', form).forEach((el) => {
    const field = el.closest('.field');
    // Checkboxes / radios are validated as a group below.
    if (el.type === 'checkbox' || el.type === 'radio') return;
    if (!el.value.trim()) {
      if (field) setFieldInvalid(field, true);
      valid = false;
    }
  });

  qsa('.field[data-required-group]', form).forEach((field) => {
    if (field.hidden) return;
    const checked = field.querySelector('input[type="checkbox"]:checked, input[type="radio"]:checked');
    if (!checked) {
      setFieldInvalid(field, true);
      valid = false;
    }
  });

  if (!validateContactChoice(form)) valid = false;

  qsa('input[type="email"]', form).forEach((el) => {
    if (el.value && !isValidEmail(el.value)) {
      const field = el.closest('.field');
      if (field) {
        setFieldMessage(field, 'Enter a valid email address.');
        setFieldInvalid(field, true);
      }
      valid = false;
    }
  });

  qsa('input[type="tel"]', form).forEach((el) => {
    if (!el.value.trim()) return;
    if (!isValidPhone(el.value)) {
      const field = el.closest('.field');
      if (field) {
        setFieldMessage(field, 'Enter a valid 10-digit mobile number.');
        setFieldInvalid(field, true);
      }
      valid = false;
    }
  });

  return valid;
}

function validateContactChoice(form) {
  const email = form.querySelector('input[data-contact-choice][type="email"]');
  const phone = form.querySelector('input[data-contact-choice][type="tel"]');
  if (!email || !phone || email.value.trim() || phone.value.trim()) return true;

  const emailField = email.closest('.field');
  const phoneField = phone.closest('.field');
  setFieldMessage(emailField, 'Enter an email or phone number.');
  setFieldMessage(phoneField, 'Enter an email or phone number.');
  setFieldInvalid(emailField, true);
  setFieldInvalid(phoneField, true);
  return false;
}

function updateContactChoiceErrors(form) {
  const email = form.querySelector('input[data-contact-choice][type="email"]');
  const phone = form.querySelector('input[data-contact-choice][type="tel"]');
  if (!email || !phone) return;

  const emailField = email.closest('.field');
  const phoneField = phone.closest('.field');
  const hasContact = email.value.trim() || phone.value.trim();

  if (!hasContact) return;

  restoreFieldMessage(emailField);
  restoreFieldMessage(phoneField);
  setFieldInvalid(emailField, Boolean(email.value.trim()) && !isValidEmail(email.value));
  setFieldInvalid(phoneField, Boolean(phone.value.trim()) && !isValidPhone(phone.value));
}

function validateControlOnBlur(control, form) {
  const field = control.closest('.field');
  if (!field) return;

  restoreFieldMessage(field);

  if (control.matches('[data-contact-choice]')) {
    if (control.value.trim()) {
      const valid = control.type === 'email' ? isValidEmail(control.value) : isValidPhone(control.value);
      if (!valid) {
        setFieldMessage(
          field,
          control.type === 'email' ? 'Enter a valid email address.' : 'Enter a valid 10-digit mobile number.'
        );
      }
      setFieldInvalid(field, !valid);
      return;
    }

    const phone = form.querySelector('input[data-contact-choice][type="tel"]');
    if (control === phone) validateContactChoice(form);
    return;
  }

  setFieldInvalid(field, !isControlValid(control));
}

function isFieldValid(field) {
  if (field.dataset.requiredGroup !== undefined) {
    return Boolean(field.querySelector('input[type="checkbox"]:checked, input[type="radio"]:checked'));
  }

  const control = field.querySelector('input, textarea, select');
  return control ? isControlValid(control) : true;
}

function isControlValid(control) {
  const value = control.value.trim();
  if (control.required && !value) return false;
  if (control.type === 'email' && value) return isValidEmail(value);
  if (control.type === 'tel' && value) return isValidPhone(value);
  return true;
}

function isValidEmail(value) {
  return EMAIL_PATTERN.test(value.trim());
}

function isValidPhone(value) {
  const digits = value.replace(/\D/g, '');
  const mobile = digits.length === 12 && digits.startsWith('91')
    ? digits.slice(2)
    : digits.length === 11 && digits.startsWith('0')
      ? digits.slice(1)
      : digits;
  return /^[6-9]\d{9}$/.test(mobile);
}

function serialize(form) {
  const data = {};
  new FormData(form).forEach((value, key) => {
    if (key === 'website') return; // honeypot — never send
    const clean = typeof value === 'string' ? value.trim() : value;
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      // Collect multiple values (e.g. multi-select or same-name checkboxes)
      data[key] = [].concat(data[key], clean);
    } else {
      data[key] = clean;
    }
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

function webhookUrlFor(form) {
  return form.dataset.form === 'waiver' ? config.WAIVER_WEBHOOK_URL : config.WEBHOOK_URL;
}

async function sendToWebhook(payload, url) {
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
