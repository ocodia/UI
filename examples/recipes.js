// Demonstration application only. Persistence/server validation belong to the app.
(() => {
  const form = document.querySelector('#recipe-form');
  const output = document.querySelector('#recipe-output');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = new FormData(form);
    const formats = values.getAll('format');
    output.textContent = `Project checked: ${values.get('project')}. Visibility: ${values.get('visibility')}. Exports: ${formats.length ? formats.join(', ') : 'none'}. Nothing was sent.`;
  });
  form.addEventListener('input', () => { output.textContent = ''; });
  form.addEventListener('reset', (event) => queueMicrotask(() => { if (!event.defaultPrevented) output.textContent = ''; }));
  document.querySelector('#recipe-submit').hidden = false;
  const dialog = document.querySelector('#recipe-dialog');
  const opener = document.querySelector('#recipe-open-dialog');
  const fallback = document.querySelector('#recipe-dialog-fallback');
  const heading = document.querySelector('#modal-title');
  if (dialog && opener && fallback && heading && typeof dialog.showModal === 'function' && typeof dialog.close === 'function') {
    opener.addEventListener('click', () => {
      if (dialog.open) return;
      // Focus explicitly: pointer activation does not focus buttons on every platform.
      opener.focus();
      dialog.returnValue = '';
      try {
        dialog.showModal();
        if (dialog.open) return;
      } catch {
        // Leave the same information readable if the platform cannot open a modal.
      }
      fallback.hidden = false;
      opener.hidden = true;
      dialog.hidden = true;
      fallback.querySelector('h3').focus();
    });
    dialog.addEventListener('close', () => {
      // The browser restores normal focus. Supply a survivor if the trigger went away.
      if (!dialog.open && (!opener.isConnected || opener.disabled || opener.hidden)) heading.focus();
    });
    dialog.hidden = false;
    fallback.hidden = true;
    opener.hidden = false;
  }
})();
