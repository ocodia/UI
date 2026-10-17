// Workbench application only. Theme choices are not persisted.
(() => {
  const root = document.documentElement;
  const brand = document.querySelector('#brand');
  const mode = document.querySelector('#mode');
  const focus = document.querySelector('#focus-palette');
  function update() {
    if (brand.value === 'default') delete root.dataset.brand;
    else root.dataset.brand = brand.value;
    if (mode.value === 'system') delete root.dataset.theme;
    else root.dataset.theme = mode.value;
    if (focus.value === 'blue') {
      root.style.setProperty('--ui-focus', '#bde9ff');
      root.style.setProperty('--ui-focus-edge', '#102a43');
    } else {
      root.style.removeProperty('--ui-focus');
      root.style.removeProperty('--ui-focus-edge');
    }
    document.querySelector('#theme-selection').textContent = `${brand.selectedOptions[0].textContent} · ${mode.selectedOptions[0].textContent} · ${focus.selectedOptions[0].textContent}.`;
  }
  brand.addEventListener('change', update);
  mode.addEventListener('change', update);
  focus.addEventListener('change', update);
  update();
  document.querySelector('#theme-controls').hidden = false;
  const form = document.querySelector('#theme-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    document.querySelector('#theme-result').textContent = 'The project name is complete. Nothing was sent.';
  });
  form.addEventListener('input', () => { document.querySelector('#theme-result').textContent = ''; });
  document.querySelector('#theme-submit').hidden = false;
  for (const density of ['comfortable', 'compact']) {
    const form = document.querySelector(`#density-${density}-form`);
    const result = document.querySelector(`#density-${density}-result`);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      result.textContent = `${new FormData(form).get('project')}: valid native answers. Nothing was sent.`;
    });
    form.addEventListener('input', () => { result.textContent = ''; });
    form.addEventListener('reset', (event) => queueMicrotask(() => { if (!event.defaultPrevented) result.textContent = ''; }));
    form.querySelector('[type="submit"]').hidden = false;
  }
  for (const [section, result] of [['#action-variants', '#variant-result'], ['#control-sizes', '#size-result']]) {
    document.querySelector(section).addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button || button.disabled) return;
      document.querySelector(result).textContent = `${button.textContent.trim()}: appearance preview only. No project data was changed.`;
    });
  }
})();
