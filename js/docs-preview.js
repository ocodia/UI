// Trusted, generated documentation examples only; never a user HTML runner.
(() => {
  if (self !== top) document.querySelector('body > h1').hidden = true;
  document.addEventListener('submit', (event) => {
    if (event.target.method === 'dialog' || event.submitter?.formMethod === 'dialog') return;
    event.preventDefault();
    let result = document.querySelector('#preview-result');
    if (!result) {
      result = document.createElement('output'); result.id = 'preview-result'; result.setAttribute('role', 'status');
      document.querySelector('main').append(result);
    }
    result.textContent = 'Valid native values: ' + [...new FormData(event.target, event.submitter)].map(([key, value]) => `${key}=${value instanceof File ? value.name || '(no file)' : value}`).join(', ') + '. Nothing was sent.';
  });
  document.addEventListener('reset', (event) => queueMicrotask(() => {
    if (!event.defaultPrevented && document.querySelector('#preview-result')) document.querySelector('#preview-result').textContent = '';
  }));
  // Local-only submit actions become available after their transport guard is installed.
  document.documentElement.dataset.previewReady = '';
  const report = () => parent.postMessage({ type: 'ui-doc-preview-height', height: Math.ceil(document.body.getBoundingClientRect().height) }, location.origin);
  if (typeof ResizeObserver === 'function') new ResizeObserver(report).observe(document.body);
  window.addEventListener('load', report);
})();
