// Static response demonstration. A real application must check names on its server.
(() => {
  const editor = document.querySelector('#server-editor');
  const form = document.querySelector('#server-form');
  const output = document.querySelector('#server-result');
  editor.validator = () => form.elements.project.value.trim().toLowerCase() === 'coastal field guide'
    ? [{ control: form.elements.project, message: 'This project name is already in use. Choose another name' }]
    : [];
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    output.textContent = 'The replacement name passes this local check. Nothing was sent.';
  });
  form.addEventListener('input', () => { output.textContent = ''; });
  form.addEventListener('reset', (event) => queueMicrotask(() => { if (!event.defaultPrevented) output.textContent = ''; }));
  document.querySelector('#server-actions').hidden = false;
})();
