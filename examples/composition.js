// Static-page application only; the browser owns selection, scrolling and reset.
(() => {
  const editor = document.querySelector('#brief-editor');
  const form = document.querySelector('#brief-form');
  const result = document.querySelector('#brief-result');
  const values = document.querySelector('#brief-values');
  const status = document.querySelector('#brief-status');
  const clear = () => { result.hidden = true; values.replaceChildren(); status.textContent = ''; };
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form, event.submitter);
    values.replaceChildren();
    for (const [name, value] of data) {
      const item = document.createElement('li');
      item.textContent = `${name}=${value}`;
      values.append(item);
    }
    result.hidden = false;
    status.textContent = 'Selection inspected locally. Nothing was sent.';
  });
  if (typeof editor.validate !== 'function' || editor.form !== form) return;
  form.addEventListener('input', clear);
  form.addEventListener('change', clear);
  form.addEventListener('reset', event => queueMicrotask(() => { if (!event.defaultPrevented) clear(); }));
  document.querySelector('#brief-fallback').hidden = true;
  document.querySelector('#brief-submit').hidden = false;
})();
