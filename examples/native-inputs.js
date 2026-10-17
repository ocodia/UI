// Local recipe application: UI owns field feedback; native controls own values.
(() => {
  const editor = document.querySelector('#visit-editor');
  const form = document.querySelector('#visit-form');
  const result = document.querySelector('#visit-result');
  const values = document.querySelector('#visit-values');
  const status = document.querySelector('#visit-status');
  const level = form.elements.level;
  const levelValue = document.querySelector('#visit-level-value');
  const clearResult = () => { result.hidden = true; values.replaceChildren(); status.textContent = ''; };
  const showLevel = () => { levelValue.value = `${level.value}%`; };

  // Install the local submit guard before exposing any submit action.
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form, event.submitter);
    values.replaceChildren();
    for (const [name, value] of data) {
      const term = document.createElement('dt');
      const detail = document.createElement('dd');
      term.textContent = name;
      detail.textContent = value instanceof File
        ? value.name ? `${value.name} — ${value.size} bytes; ${value.type || 'type not supplied'}` : 'No file selected (empty File entry)'
        : value;
      values.append(term, detail);
    }
    result.hidden = false;
    status.textContent = 'Values inspected locally. Nothing was sent.';
  });

  if (typeof editor.validate !== 'function' || editor.form !== form) return;
  editor.validator = () => {
    const errors = [];
    const formats = [...form.querySelectorAll('[name="format"]')];
    if (!formats.some(control => control.checked && !control.disabled)) {
      errors.push({ control: formats[0], message: 'Select at least one guide format' });
    }
    const files = [...form.elements.documents.files];
    if (files.length > 3) errors.push({ control: form.elements.documents, message: 'Select no more than 3 supporting documents' });
    else if (files.some(file => file.size > 1048576)) errors.push({ control: form.elements.documents, message: 'Each supporting document must be 1 MiB or smaller' });
    return errors;
  };
  // Keep authored required text; make other date/time constraint messages actionable.
  editor.message = (control, { reason, defaultMessage }) => {
    if (reason === 'customError') return defaultMessage;
    if (control.validity.rangeUnderflow || control.validity.rangeOverflow || control.validity.stepMismatch) {
      if (control.type === 'date') return 'Enter a date from 1 January 2026 to 31 December 2027';
      if (control.type === 'time') return 'Enter a time from 09:00 to 17:00 in 15-minute intervals';
    }
    return defaultMessage;
  };
  form.addEventListener('input', () => { clearResult(); showLevel(); });
  form.addEventListener('change', clearResult);
  form.addEventListener('reset', (event) => {
    queueMicrotask(() => {
      if (event.defaultPrevented) return;
      clearResult(); showLevel();
    });
  });
  showLevel();
  levelValue.hidden = false;
  document.querySelector('#visit-fallback').hidden = true;
  document.querySelector('#visit-submit').hidden = false;
})();
