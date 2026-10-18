// Optional local GET preview. Use textContent so query parameters remain plain text.
(() => {
  const title = new URLSearchParams(location.search).get('title')?.trim();
  if (!title) return;
  document.querySelector('#report').textContent = title;
  document.querySelector('#report-preview-note').textContent = 'Preview · Unsaved title';
  document.title = title + ' — Report preview';
})();
