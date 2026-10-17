// Native component-page recipes: keep browser assertions on native behavior and recovery.
async function runNativeStateChecks(load, frame) {
  const passed = [];
  const check = (condition, message) => { assert(condition, message); passed.push(message); };
  const settle = win => new Promise(resolve => win.setTimeout(resolve, 0));
  const cases = [
    ['date-input-2', '2026-09-30', '2026-10-17', 'rangeUnderflow'],
    ['time-input-2', '09:10', '09:30', 'stepMismatch'],
    ['number-input-2', '3', '4', 'stepMismatch'],
    ['select-2', '', 'woodland', 'valueMissing'],
    ['option-2', '', 'coast', 'valueMissing'],
    ['textarea-2', '', 'Meet at the visitor centre.\nUse the woodland route.', 'valueMissing'],
  ];
  for (const [route, invalid, valid, constraint] of cases) {
    const win = await load(`../docs/previews/${route}.html`);
    const doc = win.document, editor = doc.querySelector('ui-form'), form = editor.form;
    const control = form.querySelector('input, select, textarea');
    const hint = control.getAttribute('aria-describedby');
    const defaults = control.value;
    form.requestSubmit();
    const summary = editor.querySelector('ui-error-summary');
    check(!summary.hidden && doc.activeElement === summary && control.validity.valueMissing, `${route}: empty submission focuses the missing-answer summary.`);
    summary.querySelector('a').click();
    check(doc.activeElement === control, `${route}: summary link focuses the native answer.`);
    control.value = invalid; form.requestSubmit();
    check(control.validity[constraint] && control.getAttribute('aria-invalid') === 'true', `${route}: native ${constraint} retains inline error state.`);
    control.value = valid; form.requestSubmit();
    check(summary.hidden && control.getAttribute('aria-describedby') === hint && !doc.title.startsWith('Error: '), `${route}: correction clears errors and preserves the authored hint.`);
    const data = new win.FormData(form);
    check(data.get(control.name) === valid && doc.querySelector('#preview-result').textContent.includes(valid), `${route}: valid native answer is inspected locally without navigation.`);
    if (form.elements.archived) check(!data.has('archived'), `${route}: disabled select is omitted.`);
    form.reset(); await settle(win);
    check(control.value === defaults && summary.hidden && doc.querySelector('#preview-result').textContent === '', `${route}: reset restores defaults and clears local feedback.`);
  }
  for (const key of ['date-input', 'time-input', 'number-input', 'textarea']) {
    const win = await load(`../docs/previews/${key}-1.html`), doc = win.document, form = doc.querySelector('form');
    form.requestSubmit();
    check(form.elements.retained.readOnly && form.elements.omitted.disabled && new win.FormData(form).get('retained') === form.elements.retained.value && !new win.FormData(form).has('omitted'), `${key}: read-only answer serializes and disabled answer is omitted.`);
  }
  let win = await load('../docs/previews/slider-1.html');
  check(win.document.querySelector('input').disabled && !new win.FormData(win.document.querySelector('form')).has('volume') && win.document.querySelector('#volume-hint').textContent.includes('50 percent'), 'Disabled range keeps a persistent readable value and is omitted from submission.');
  win = await load('../docs/previews/details-1.html');
  const details = win.document.querySelector('details');
  details.querySelector('summary').click();
  check(!details.open, 'Initially open long disclosure closes using the native summary.');
  details.querySelector('summary').click();
  check(details.open && details.querySelector('a').hash === '#contact', 'Long disclosure reopens with its native content destination intact.');
  for (const key of ['breadcrumb', 'breadcrumb-item']) {
    win = await load(`../docs/previews/${key}-1.html`);
    const doc = win.document;
    check(doc.querySelector('[aria-current="page"]').tagName === 'LI' && [...doc.querySelectorAll('nav a')].every(link => doc.querySelector(link.hash)), `${key}: long path retains real ancestors and current-location text.`);
  }
  // Review every added or changed sample across real iframe widths and authored palettes.
  const routes = [...cases.map(item => item[0]), 'date-input-1', 'time-input-1', 'number-input-1', 'textarea-1', 'slider-1', 'details-1', 'breadcrumb-1', 'breadcrumb-item-1', 'card-1', 'progress-bar-0', 'progress-bar-1'];
  frame.style.inlineSize = '320px';
  for (const route of routes) {
    win = await load(`../docs/previews/${route}.html`);
    const doc = win.document, root = doc.documentElement;
    root.style.fontSize = '200%';
    doc.body.style.cssText = 'line-height:1.5;letter-spacing:.12em;word-spacing:.16em';
    const spacing = doc.createElement('style'); spacing.textContent = 'p { margin-block-end: 2em; }'; doc.head.append(spacing);
    for (const brand of ['', 'forest']) for (const theme of ['light', 'dark']) for (const dir of ['ltr', 'rtl']) {
      root.dataset.brand = brand; root.dataset.theme = theme; root.dir = dir;
      check(root.scrollWidth <= root.clientWidth + 1, `${route}: 320px ${brand || 'default'}/${theme}/${dir} with doubled text and spacing reflows.`);
    }
    win = await load(`../docs/previews/${route}.html`, true);
    for (const dir of ['ltr', 'rtl']) {
      win.document.documentElement.dir = dir;
      check(win.document.documentElement.scrollWidth <= win.document.documentElement.clientWidth + 1, `${route}: no-script 320px ${dir} reflows.`);
    }
    const form = win.document.querySelector('form');
    if (form) {
      check(!form.noValidate && [...form.querySelectorAll('[type="submit"]')].every(button => win.getComputedStyle(button).display === 'none') && win.document.querySelector('noscript').textContent.includes('real server action'), `${route}: no-script preview retains native validation and explains its local-only actions.`);
      const required = form.querySelector('[required]');
      if (required) check(!required.checkValidity(), `${route}: native missing-answer validation survives without enhancement.`);
    }
  }
  frame.style.removeProperty('inline-size');
  return passed;
}
