// Shared by the complete example suite and the focused display-mode harness.
async function runCompositionChecks(win) {
  const doc = win.document;
  const root = doc.documentElement;
  const editor = doc.querySelector('#brief-editor');
  const form = editor.form;
  const select = form.elements.area;
  const submitter = doc.querySelector('#brief-submit');
  const summary = editor.querySelector('ui-error-summary');
  const result = doc.querySelector('#brief-result');
  const status = doc.querySelector('#brief-status');
  const table = doc.querySelector('#brief-table-region');
  const notes = doc.querySelector('#brief-notes');
  const passed = [];
  const check = (condition, message) => { if (!condition) throw new Error(message); passed.push(message); };
  const settle = () => new Promise(resolve => win.setTimeout(resolve, 60));
  const submit = () => form.requestSubmit(submitter);
  const entries = () => [...doc.querySelectorAll('#brief-values li')].map(item => item.textContent);
  check(select.multiple && select.size === 5 && select.required && select.options.length === 5, 'Native multiple-select retains rows, options and its required constraint.');
  check(!select.hasAttribute('role') && !doc.querySelector('ui-panel[role], ui-grid[role], ui-sidebar[role]'), 'Native select semantics and CSS-only composition remain intact.');
  check(select.labels[0].textContent === 'Survey areas' && select.getAttribute('aria-describedby') === 'brief-areas-hint brief-selection-help', 'The native list has a visible label and persistent selection instructions.');
  check(!submitter.hidden && doc.querySelector('#brief-fallback').hidden, 'Local submit inspection appears only after its guard is installed.');
  check(new win.FormData(form).getAll('area').join() === 'coast', 'Selected markup supplies the native initial value.');
  submit();
  check(entries().join('|') === 'area=coast|intent=inspect' && !result.hidden && status.textContent.includes('Nothing was sent'), 'Inspection preserves the initial option and successful submitter without navigation.');
  [...select.options].forEach(option => { option.selected = false; });
  select.dispatchEvent(new win.Event('change', { bubbles: true }));
  check(result.hidden && status.textContent === '', 'Changing selection clears obsolete submitted entries.');
  submit();
  check(select.validity.valueMissing && !summary.hidden && summary.querySelectorAll('li').length === 1 && doc.activeElement === summary, 'An empty required multiple-select creates one error and focuses the summary.');
  check(doc.title.startsWith('Error: ') && select.getAttribute('aria-describedby').includes('brief-selection-help'), 'Validation preserves native instructions and adds the error title.');
  check(parseFloat(win.getComputedStyle(summary).outlineWidth) >= 3 && win.getComputedStyle(summary).outlineStyle === 'solid', 'The focused summary retains a visible outline.');
  summary.querySelector('a').click();
  check(doc.activeElement === select && [...select.selectedOptions].length === 0, 'The error link focuses the native select without selecting an option.');
  select.options[2].selected = true; select.options[0].selected = true; submit();
  check(summary.hidden && !doc.title.startsWith('Error: ') && new win.FormData(form).getAll('area').join() === 'coast,valley', 'Recovery serializes multiple choices in option order and clears error/title state.');
  check(entries().join('|') === 'area=coast|area=valley|intent=inspect', 'The local inspector retains repeated area entries rather than joining them into one value.');
  check(select.getAttribute('aria-describedby') === 'brief-areas-hint brief-selection-help', 'Recovery removes only managed error descriptions.');
  select.options[3].selected = true;
  check(!new win.FormData(form).getAll('area').includes('marsh') && !new win.FormData(form).has('archived'), 'Disabled options and a disabled multiple-select are omitted from successful values.');
  select.options[3].selected = false;
  const group = select.querySelectorAll('optgroup')[1];
  group.disabled = true; select.options[4].selected = true;
  check(!new win.FormData(form).getAll('area').includes('island'), 'Disabled optgroups also exclude their selected options.');
  group.disabled = false; select.options[4].selected = false;
  const original = select.options[0].value;
  select.options[0].value = '<img src=x onerror=alert(1)>'; submit();
  check(doc.querySelector('#brief-values').textContent.includes('<img') && !doc.querySelector('#brief-values img'), 'Submitted values are displayed as text rather than markup.');
  select.options[0].value = original; submit();
  form.addEventListener('reset', event => event.preventDefault(), { once: true }); form.reset(); await settle();
  check(new win.FormData(form).getAll('area').join() === 'coast,valley' && !result.hidden, 'Cancelled reset preserves both current selection and inspection feedback.');
  form.reset(); await settle();
  check(new win.FormData(form).getAll('area').join() === 'coast' && result.hidden && summary.hidden && status.textContent === '', 'Native reset restores authored selected defaults and clears local feedback.');
  [...select.options].forEach(option => { option.selected = false; }); submit();
  form.addEventListener('reset', event => event.preventDefault(), { once: true }); form.reset(); await settle();
  check(!summary.hidden && doc.title.startsWith('Error: '), 'Cancelled reset retains invalid selection feedback.');
  if (win.matchMedia('(forced-colors: active)').matches) {
    const probe = doc.createElement('span'); probe.hidden = true; doc.body.append(probe);
    probe.style.color = 'Highlight';
    check(win.getComputedStyle(summary).outlineColor === win.getComputedStyle(probe).color && win.getComputedStyle(summary).boxShadow === 'none', 'Forced colors uses the system Highlight outline without a shadow.');
    probe.style.color = 'GrayText';
    check(win.getComputedStyle(form.elements.archived).color === win.getComputedStyle(probe).color, 'Forced colors retains system disabled text on the unavailable select.');
    check(win.getComputedStyle(select).appearance === 'auto' && win.getComputedStyle(select).backgroundImage === 'none', 'Forced colors preserves native select appearance without a custom arrow image.');
    probe.remove();
  }
  form.reset(); await settle();
  for (const region of [table, notes]) {
    check(region.tabIndex === 0 && region.getAttribute('role') === 'region' && doc.querySelectorAll(`[aria-labelledby="${region.getAttribute('aria-labelledby')}"]`).length === 1 && doc.getElementById(region.getAttribute('aria-labelledby'))?.textContent.trim() && doc.getElementById(region.getAttribute('aria-describedby')), `${region.id} is named, instructed and reachable as a native focus stop.`);
    region.focus();
    check(doc.activeElement === region, `${region.id} accepts focus without an enhancement or a custom keyboard handler.`);
  }
  check(notes.scrollHeight > notes.clientHeight && win.getComputedStyle(notes).overflowY === 'auto', 'Long field notes create a real bounded vertical scroll region.');
  notes.scrollTop = 80;
  check(notes.scrollTop > 0 && notes.querySelector('a[href="native-inputs.html"]'), 'The native notes viewport can scroll and retains its content links.');
  notes.scrollTop = 0;
  const frame = win.frameElement;
  const width = frame.style.inlineSize;
  const attrs = ['style','dir','data-brand','data-theme'].map(name => [name, root.getAttribute(name)]);
  try {
    frame.style.inlineSize = '1440px'; await settle();
    const layout = doc.querySelector('#brief-layout');
    check(layout.children[0].getBoundingClientRect().right <= layout.children[1].getBoundingClientRect().left, 'At wide widths the sidebar precedes the content in a separate column.');
    frame.style.inlineSize = '320px';
    for (const brand of ['default','forest']) {
      root.dataset.brand = brand;
      for (const theme of ['light','dark']) {
        root.dataset.theme = theme;
        for (const dir of ['ltr','rtl']) {
          root.dir = dir;
          root.style.fontSize = '200%'; root.style.letterSpacing = '.12em'; root.style.wordSpacing = '.16em';
          await settle();
          check(root.scrollWidth <= root.clientWidth + 1 && layout.children[1].getBoundingClientRect().top >= layout.children[0].getBoundingClientRect().bottom - 1, `Nested panels and sidebar reflow at 320px with doubled text in ${brand}/${theme}/${dir}.`);
        }
      }
    }
    check(table.scrollWidth > table.clientWidth && win.getComputedStyle(table).overflowX === 'auto', 'Wide table overflow stays in its named horizontal region.');
    check(doc.querySelector('#brief-table caption') && doc.querySelectorAll('#brief-table th[scope="row"]').length === 5 && doc.querySelectorAll('#brief-table th[scope="col"]').length === 6, 'The scrolled table retains its caption and native row/column headers.');
  } finally {
    frame.style.inlineSize = width;
    for (const [name,value] of attrs) { if (value === null) root.removeAttribute(name); else root.setAttribute(name,value); }
  }
  return passed;
}

const compositionButton = document.querySelector('#run-composition');
if (compositionButton) compositionButton.addEventListener('click', async () => {
  compositionButton.disabled = true;
  const results = document.querySelector('#composition-results');
  const frame = document.querySelector('#composition-frame');
  try {
    await new Promise(resolve => { frame.onload = resolve; frame.src = '../examples/composition.html'; });
    const win = frame.contentWindow;
    const passed = await runCompositionChecks(win);
    results.textContent = `PASS: ${passed.length} composition checks. Forced colors ${win.matchMedia('(forced-colors: active)').matches ? 'active; system-color checks passed' : 'inactive; system-color checks not run'}.\n\n${passed.join('\n')}`;
  } catch (error) { results.textContent = `FAIL: ${error.message}`; }
  finally { compositionButton.disabled = false; document.querySelector('#composition-results-title').focus(); }
});
