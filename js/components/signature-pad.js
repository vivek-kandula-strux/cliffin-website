/**
 * Signature pad — a <canvas data-signature-pad> the participant draws on with
 * a finger, stylus or mouse (unified via Pointer Events).
 *
 * Each pad exposes a small API on the canvas element:
 *   canvas.signaturePad.isEmpty()   -> boolean
 *   canvas.signaturePad.getDataUrl() -> PNG data URL ('' when empty)
 *   canvas.signaturePad.clear()      -> wipe the pad
 *
 * A [data-signature-clear] button inside the same .field resets the pad.
 * The pad dispatches bubbling 'signature:drawn' / 'signature:cleared' events
 * so form.js can clear its error state.
 */
import { qsa, on } from '../utils/dom.js';

export function initSignaturePads(root = document) {
  qsa('[data-signature-pad]', root).forEach((canvas) => setupPad(canvas));
}

function setupPad(canvas) {
  const ctx = canvas.getContext('2d');
  let drawing = false;
  let empty = true;
  let last = null;

  const fit = () => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = getComputedStyle(canvas).color || '#1a2b22';
  };

  fit();
  if (typeof ResizeObserver === 'function') {
    // Re-fit when the canvas becomes visible (e.g. a consent gate reveals the
    // form) — a hidden canvas measures 0×0 and fit() safely no-ops until then.
    const observer = new ResizeObserver(() => {
      if (empty) fit();
    });
    observer.observe(canvas);
  } else {
    on(window, 'resize', () => {
      // Only re-fit while untouched — resizing would wipe a drawn signature.
      if (empty) fit();
    });
  }

  const point = (event) => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  on(canvas, 'pointerdown', (event) => {
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    drawing = true;
    last = point(event);
  });

  on(canvas, 'pointermove', (event) => {
    if (!drawing) return;
    const current = point(event);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(current.x, current.y);
    ctx.stroke();
    last = current;
    if (empty) {
      empty = false;
      canvas.dispatchEvent(new CustomEvent('signature:drawn', { bubbles: true }));
    }
  });

  on(canvas, 'pointerup', () => {
    drawing = false;
  });

  on(canvas, 'pointercancel', () => {
    drawing = false;
  });

  const clear = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    empty = true;
    canvas.dispatchEvent(new CustomEvent('signature:cleared', { bubbles: true }));
  };

  on(canvas.closest('.field')?.querySelector('[data-signature-clear]'), 'click', clear);

  canvas.signaturePad = {
    isEmpty: () => empty,
    getDataUrl: () => (empty ? '' : canvas.toDataURL('image/png')),
    clear,
  };
}
