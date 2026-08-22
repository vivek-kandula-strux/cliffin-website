const STORAGE_KEY = 'cliffinn-consent-v1';
const ALLOWED_CHOICES = new Set(['necessary', 'optional']);

function readChoice() {
  try {
    const choice = window.localStorage.getItem(STORAGE_KEY);
    return ALLOWED_CHOICES.has(choice) ? choice : null;
  } catch {
    return null;
  }
}

function saveChoice(choice) {
  try {
    window.localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // Consent still applies for this page view when storage is unavailable.
  }
}

function publishChoice(choice) {
  const analyticsAllowed = choice === 'optional';
  document.documentElement.dataset.analyticsConsent = analyticsAllowed ? 'granted' : 'denied';
  window.dispatchEvent(new CustomEvent('cliffinn:consent', {
    detail: { analytics: analyticsAllowed },
  }));
}

export function getConsentChoice() {
  return readChoice();
}

export function initConsent() {
  const banner = document.createElement('section');
  banner.className = 'consent-banner';
  banner.id = 'consent-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-labelledby', 'consent-title');
  banner.setAttribute('aria-describedby', 'consent-description');
  banner.innerHTML = `
    <div class="consent-banner__content">
      <div class="consent-banner__copy">
        <h2 class="consent-banner__title" id="consent-title">Your privacy choices</h2>
        <p class="consent-banner__description" id="consent-description">We use browser storage to remember this choice. Optional analytics never load unless you allow them.</p>
      </div>
      <div class="consent-banner__actions">
        <button class="btn btn--outline-dark btn--sm" type="button" data-consent-choice="necessary">Reject optional</button>
        <button class="btn btn--primary btn--sm" type="button" data-consent-choice="optional">Allow optional</button>
      </div>
    </div>
  `;

  const settings = document.createElement('button');
  settings.className = 'consent-settings';
  settings.type = 'button';
  settings.setAttribute('aria-controls', banner.id);
  settings.textContent = 'Cookie choices';

  const showBanner = ({ focus = false } = {}) => {
    banner.hidden = false;
    settings.hidden = true;
    if (focus) banner.querySelector('[data-consent-choice]')?.focus();
  };

  const hideBanner = () => {
    banner.hidden = true;
    settings.hidden = false;
  };

  banner.addEventListener('click', (event) => {
    const button = event.target.closest('[data-consent-choice]');
    if (!button) return;

    const choice = button.dataset.consentChoice;
    if (!ALLOWED_CHOICES.has(choice)) return;

    saveChoice(choice);
    publishChoice(choice);
    hideBanner();
    settings.focus();
  });

  settings.addEventListener('click', () => showBanner({ focus: true }));

  document.body.append(banner, settings);

  const existingChoice = readChoice();
  if (existingChoice) {
    publishChoice(existingChoice);
    hideBanner();
  } else {
    showBanner();
  }
}
