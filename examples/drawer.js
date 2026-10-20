(() => {
  const form = document.querySelector('#drawer-form'), dialog = form.closest('dialog');
  const status = form.querySelector('[role="status"]');
  let generation = 0, attempts = 0, timer;
  const cancel = () => { generation++; clearTimeout(timer); form.removeAttribute('aria-busy'); };
  form.addEventListener('submit', event => {
    event.preventDefault(); cancel();
    const request = generation, note = new FormData(form, event.submitter).get('note');
    attempts++; status.textContent = 'Preparing preview…'; form.setAttribute('aria-busy', 'true');
    // Keep the focused submitter usable; request generations reject superseded attempts.
    timer = setTimeout(() => {
      if (generation !== request || !form.isConnected || !dialog.open) return;
      form.removeAttribute('aria-busy');
      status.textContent = attempts === 1 ? 'Preview failed. Your note is unchanged. Select Preview note to retry.' : 'Preview ready: ' + note + '. Nothing was saved or sent.';
    }, 300);
  });
  form.addEventListener('reset', event => { queueMicrotask(() => { if (!event.defaultPrevented) { cancel(); attempts = 0; status.textContent = ''; } }); });
  dialog.addEventListener('close', () => { cancel(); status.textContent = ''; });
})();
