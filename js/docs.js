// Documentation application only. All guide content and code drawers are static HTML.
(() => {
  // Keep the static navigation available without script; collapse it initially on small screens.
  const navigation = document.querySelector('.docs-navigation');
  if (navigation) {
    const compact = matchMedia('(max-width: 69.99rem)');
    navigation.open = !compact.matches;
    compact.addEventListener('change', (event) => { navigation.open = !event.matches; });
  }
  for (const example of document.querySelectorAll('[data-example]')) {
    const stage = example.querySelector('.example-stage');
    const viewport = example.querySelector('.example-viewport');
    const frame = example.querySelector('iframe');
    const tools = example.querySelector('.example-tools');
    const width = tools.querySelector('input');
    const output = tools.querySelector('output');
    const handle = example.querySelector('.example-handle');
    function syncPreview() {
      const target = frame.contentDocument?.documentElement;
      if (!target) return;
      for (const attribute of ['data-theme', 'data-brand', 'dir']) {
        const value = document.documentElement.getAttribute(attribute);
        if (value === null) target.removeAttribute(attribute);
        else target.setAttribute(attribute, value);
      }
      for (const token of ['--ui-focus', '--ui-focus-edge', '--ui-focus-width']) {
        const value = document.documentElement.style.getPropertyValue(token);
        if (value) target.style.setProperty(token, value);
        else target.style.removeProperty(token);
      }
    }
    frame.addEventListener('load', syncPreview);
    new MutationObserver(syncPreview).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-brand', 'dir', 'style'] });
    syncPreview();
    let chosen = null;
    function resize(value) {
      const max = Math.max(1, Math.floor(stage.clientWidth - parseFloat(getComputedStyle(stage).paddingInlineStart) - parseFloat(getComputedStyle(stage).paddingInlineEnd)));
      width.max = max;
      width.min = Math.min(240, max);
      const size = Math.max(Number(width.min), Math.min(max, value ?? max));
      viewport.style.inlineSize = `${size}px`;
      width.value = size;
      output.value = `${Math.round(size)} px`;
    }
    width.addEventListener('input', () => { chosen = Number(width.value); resize(chosen); });
    tools.querySelector('[data-reset]').addEventListener('click', () => { chosen = null; resize(null); });
    let drag = null;
    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      drag = { x: event.clientX, width: viewport.getBoundingClientRect().width };
      handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener('pointermove', (event) => {
      if (!drag) return;
      const direction = getComputedStyle(viewport).direction === 'rtl' ? -1 : 1;
      chosen = drag.width + (event.clientX - drag.x) * direction;
      resize(chosen);
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) handle.addEventListener(event, () => { drag = null; });
    handle.addEventListener('keydown', (event) => {
      const direction = getComputedStyle(viewport).direction === 'rtl' ? -1 : 1;
      const step = event.shiftKey ? 50 : 10;
      let value = Number(width.value);
      if (event.key === 'ArrowLeft') value -= step * direction;
      else if (event.key === 'ArrowRight') value += step * direction;
      else if (event.key === 'Home') value = Number(width.min);
      else if (event.key === 'End') value = Number(width.max);
      else return;
      event.preventDefault();
      chosen = value; resize(value);
    });
    tools.querySelector('[data-copy]').addEventListener('click', async () => {
      const status = example.querySelector('[data-copy-status]');
      try {
        await navigator.clipboard.writeText(example.querySelector('pre code').textContent);
        status.textContent = 'Code copied.';
      } catch {
        example.querySelector('details').open = true;
        status.textContent = 'Select the code to copy it.';
      }
    });
    window.addEventListener('message', (event) => {
      if (event.source !== frame.contentWindow || event.origin !== location.origin || event.data?.type !== 'ui-doc-preview-height') return;
      const height = Number(event.data.height);
      if (Number.isFinite(height)) frame.style.blockSize = `${Math.max(160, Math.min(1400, height))}px`;
    });
    if (typeof ResizeObserver === 'function') new ResizeObserver(() => resize(chosen)).observe(stage);
    else window.addEventListener('resize', () => resize(chosen));
    resize(null);
    handle.hidden = false;
    tools.hidden = false;
    example.dataset.enhanced = '';
  }
})();
