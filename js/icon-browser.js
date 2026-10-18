// Documentation application: bounded results from the generated local name index.
(() => {
  const form = document.querySelector('#icon-search'), results = document.querySelector('#icon-results');
  if (!form || !results) return;
  const input = form.elements.query, library = form.elements.library, size = form.elements.size, variant = form.elements.variant;
  const status = document.querySelector('#icon-count'), next = document.querySelector('#icon-next'), previous = document.querySelector('#icon-previous');
  const selection = document.querySelector('#icon-code'), copy = document.querySelector('#icon-copy'), copied = document.querySelector('#icon-copied');
  let libraries = null, page = 0, names = [], current = '';
  const pageSize = 48;
  const choose = name => {
    current = `<ui-icon${library.value ? ` library="${library.value}"` : ''} name="${name}" aria-hidden="true"></ui-icon>`;
    selection.textContent = current; copy.disabled = false; copied.textContent = '';
  };
  function render(reset = true) {
    if (!libraries) return;
    if (reset) page = 0;
    const words = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    names = libraries[library.value || ''].filter(name => words.every(word => name.toLowerCase().includes(word)) && (!size.value || name.includes(`-${size.value}-`)) && (!variant.value || name.endsWith(`-${variant.value}`)));
    UI.destroy(results); results.replaceChildren();
    const start = page * pageSize;
    for (const name of names.slice(start, start + pageSize)) {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.variant = 'secondary';
      const icon = document.createElement('ui-icon'); icon.setAttribute('library', library.value); icon.setAttribute('name', name); icon.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span'); label.textContent = name;
      button.append(icon, label); button.addEventListener('click', () => choose(name)); results.append(button);
    }
    UI.enhance(results);
    status.textContent = names.length ? `${start + 1}–${Math.min(start + pageSize, names.length)} of ${names.length} icons. Select an icon to get its markup.` : 'No matching icons. Try another search or clear the size/style filters.';
    previous.disabled = page === 0; next.disabled = start + pageSize >= names.length;
  }
  form.addEventListener('submit', event => event.preventDefault());
  library.addEventListener('change', () => { if (library.value !== 'fluent') { size.value = ''; variant.value = ''; } render(); });
  form.addEventListener('input', () => render());
  form.addEventListener('reset', () => queueMicrotask(() => { if (!library.value) { size.value = ''; variant.value = ''; } render(); }));
  next.addEventListener('click', () => { page++; render(false); previous.focus(); });
  previous.addEventListener('click', () => { page--; render(false); if (previous.disabled) next.focus(); });
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(current); copied.textContent = 'Markup copied.'; }
    catch { copied.textContent = 'Copy unavailable. Select and copy the markup above.'; }
  });
  fetch(new URL('../icons/catalogue.json', document.currentScript.src)).then(response => { if (!response.ok) throw new Error(); return response.json(); }).then(data => {
    libraries = data;
    for (const name of Object.keys(data)) { const option = document.createElement('option'); option.value = name; option.textContent = name || 'icons/ (default)'; library.append(option); }
    library.value = ''; size.value = ''; variant.value = ''; form.hidden = false; render();
  }).catch(() => { status.textContent = 'The icon index could not load. Browse the local icons folder or reload this page to retry.'; });
})();
