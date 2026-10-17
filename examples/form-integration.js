// Application recipe only: replace simulate() with transport to your own server.
(() => {
  const editor = document.querySelector('#delivery-editor');
  const form = editor.form;
  const status = document.querySelector('#delivery-status');
  const failure = document.querySelector('#delivery-failure');
  const cancel = document.querySelector('#delivery-cancel');
  const outcome = document.querySelector('#delivery-outcome');
  let pending = null;
  let revision = 0;
  editor.validator = (owned) => new FormData(owned).getAll('updates').length ? []
    : [{ control: owned.elements.updates[0], message: 'Select at least one update' }];

  function finish() {
    form.removeAttribute('aria-busy');
    cancel.hidden = true;
    pending = null;
  }
  function invalidate(message) {
    revision++;
    if (pending) { pending.abort(); finish(); status.textContent = message; }
  }
  function simulate(data, response, signal) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', abort);
        resolve({ response, email: data.get('email') });
      }, 700);
      function abort() { clearTimeout(timer); reject(new DOMException('Request cancelled', 'AbortError')); }
      signal.addEventListener('abort', abort, { once: true });
    });
  }
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (pending) return;
    // Capture the successful submitter before changing any UI state.
    const data = new FormData(form, event.submitter);
    const ticket = ++revision;
    const controller = new AbortController();
    pending = controller;
    form.setAttribute('aria-busy', 'true');
    failure.hidden = true;
    cancel.hidden = false;
    status.textContent = 'Request in progress. You can cancel or edit your answers.';
    try {
      const result = await simulate(data, outcome.value, controller.signal);
      // A server can complete despite cancellation. Guard response application too.
      if (ticket !== revision || !editor.isConnected) return;
      if (result.response === 'field') {
        status.textContent = '';
        editor.showErrors([{ control: form.elements.email, message: 'Use a different email address for this project' }]);
      } else if (result.response === 'failure') {
        failure.hidden = false;
        status.textContent = 'Request failed. Your answers have been kept; try again.';
      } else {
        status.textContent = `Updates requested for ${result.email}. This was a local simulation; nothing was sent.`;
      }
    } catch (error) {
      if (ticket === revision && error.name !== 'AbortError' && editor.isConnected) {
        failure.hidden = false;
        status.textContent = 'Request failed. Your answers have been kept; try again.';
      }
    } finally {
      if (ticket === revision) finish();
    }
  });
  // External associated controls do not bubble input/change through the form.
  function edited(event) {
    if (event.target.form !== form && event.target !== outcome) return;
    invalidate('Answers changed. Submit again when ready.');
    status.textContent = 'Answers changed. Submit again when ready.';
    failure.hidden = true;
  }
  document.addEventListener('input', edited);
  document.addEventListener('change', edited);
  form.addEventListener('reset', (event) => queueMicrotask(() => {
    if (event.defaultPrevented) return;
    invalidate('Request cancelled. Answers reset.');
    failure.hidden = true;
    status.textContent = 'Answers reset.';
  }));
  cancel.addEventListener('click', () => {
    invalidate('Request cancelled. Your answers have been kept.');
    // The submitter is external, so find it through the native collection.
    [...form.elements].find((control) => control.type === 'submit')?.focus();
  });
  window.addEventListener('pagehide', () => invalidate(''));
  document.querySelector('#delivery-enhanced').hidden = false;

  const french = document.querySelector('#french-editor');
  french.message = (control, { reason, defaultMessage }) => {
    if (reason === 'valueMissing') return 'Saisissez le nom du projet';
    if (reason === 'tooLong') return `Utilisez ${control.maxLength} caractères maximum`;
    return defaultMessage;
  };
  french.form.addEventListener('submit', (event) => { event.preventDefault(); document.querySelector('#french-result').textContent = 'Le nom est valide. Aucune donnée n’a été envoyée.'; });
  document.querySelector('#french-submit').hidden = false;
})();
