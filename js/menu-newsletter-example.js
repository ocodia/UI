// Application-owned newsletter preview; native controls, submitters and reset stay native.
(() => {
  const form = document.querySelector('#newsletter-form'), preview = document.querySelector('#newsletter-preview');
  const subject = document.querySelector('#preview-subject'), status = document.querySelector('#newsletter-status');
  if (!form || !preview || !subject || !status) return;
  form.addEventListener('submit', event => {
    if (event.defaultPrevented) return;
    event.preventDefault();
    subject.textContent = new FormData(form, event.submitter).get('subject');
    preview.hidden = false;
    status.textContent = 'Newsletter preview updated. No email was sent.';
  });
  form.addEventListener('reset', event => queueMicrotask(() => {
    if (event.defaultPrevented) return;
    if (preview.contains(document.activeElement)) form.elements.subject.focus();
    preview.hidden = true;
    status.textContent = '';
  }));
})();
