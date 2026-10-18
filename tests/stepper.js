// CSS-only stages use native lists, links, forms and current-location state.
async function runStepperChecks(frame) {
  const passed = [], check = (value, message) => { if (!value) throw new Error(message); passed.push(message); };
  const settle = () => new Promise(resolve => setTimeout(resolve, 60));
  let win, doc;
  const load = async (index, nojs = false) => {
    if (nojs) frame.setAttribute('sandbox', 'allow-same-origin'); else frame.removeAttribute('sandbox');
    await new Promise(resolve => { frame.onload = resolve; frame.src = '../docs/previews/stepper-' + index + '.html?ui-test=' + Date.now(); }); win = frame.contentWindow; doc = win.document;
  };
  for (const nojs of [false, true]) for (let index = 0; index < 4; index++) {
    await load(index, nojs);
    const steps = doc.querySelector('ui-steps'), list = steps.firstElementChild, items = [...list.children], current = list.querySelectorAll('[aria-current="step"]');
    check(list.localName === 'ol' && list.getAttribute('role') === 'list' && items.length === 3 && items.every(item => item.localName === 'li'), 'Native ordered stages retain valid list parents: ' + index + (nojs ? ' without scripts.' : '.'));
    check(current.length === (index === 3 ? 0 : 1) && (!current.length || current[0] === items[index === 0 ? 0 : 1]), 'Current location matches the active task; completed task has no current marker.');
    check(items.every(item => item.querySelector('small')?.textContent.trim()) && !steps.querySelector('[aria-disabled],[disabled],[tabindex],[aria-selected],[role="tab"],[role="button"],ui-step'), 'Every stage has explicit outcome text with no fake unavailable controls or composite roles.');
    check(items[2].querySelector('a') === null && !steps.hasAttribute('data-ui-ready'), 'Unavailable/complete text adds no focus stop or readiness.');
    check(index === 0 ? !!doc.querySelector('#progress-title') : doc.querySelector('nav')?.getAttribute('aria-label') === 'Project application progress', 'Progress has a visible heading or named native navigation.');
    if (index > 0) {
      const label = items[0].querySelector('a'); check(label.hash === '#task' && label.getAttribute('href') === 'stepper-0.html#task', 'Reachable prior stage has a real task destination.');
      await new Promise(resolve => { frame.onload = resolve; label.click(); }); win = frame.contentWindow; doc = win.document;
      check(win.location.pathname.endsWith('stepper-0.html') && doc.querySelector('#task').textContent === 'Project details' && doc.activeElement === doc.querySelector('#task'), 'Native link opens the prior-stage document and focuses its authored task heading.');
    }
  }
  await load(2); check(doc.querySelector('ui-steps li small').textContent.includes('Needs attention: add a project title') && !doc.querySelector('ui-steps [aria-invalid]'), 'Prior-stage error remains actionable text, separate from current location and field validity.');
  await load(3); check(doc.querySelector('#task').textContent.includes('complete') && [...doc.querySelectorAll('ui-steps small')].every(node => node.textContent === 'Completed'), 'Completion has persistent task feedback and explicit outcomes.');
  await load(1); let steps = doc.querySelector('ui-steps'); const original = steps.outerHTML, list = steps.firstElementChild, anchor = steps.querySelector('a');
  check(!win.customElements.get('ui-steps') && !win.customElements.get('ui-step'), 'No wrapper/item registration.');
  for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End', ' ', 'Escape']) { const event = new win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }); anchor.dispatchEvent(event); check(!event.defaultPrevented, key + ': browser key behavior stays native.'); }
  win.UI.enhance(steps); win.UI.destroy(steps); check(steps.outerHTML === original, 'Shared lifecycle changes no stage markup.');
  list.start = 4; list.children[1].value = 7; check(list.start === 4 && list.children[1].value === 7 && win.getComputedStyle(list.children[0]).listStyleType === 'decimal', 'Numbering remains native ol start / li value, not CSS counters.');
  const nested = doc.createElement('ol'); nested.innerHTML = '<li>First detail</li><li>Second detail</li>'; list.children[0].append(nested);
  check(win.getComputedStyle(nested).display !== 'grid' && parseFloat(win.getComputedStyle(nested.children[0]).borderInlineStartWidth) === 0, 'Nested ordinary list is not restyled as another set of steps.'); nested.remove();
  const form = doc.createElement('form'); form.innerHTML = '<label for="reference">Reference</label><input id="reference" name="reference" value="COAST-01" required><button type="reset">Reset</button>'; doc.querySelector('main').append(form); form.append(steps); form.elements.reference.value = 'Retained'; win.UI.enhance(steps); win.UI.destroy(steps);
  check(new win.FormData(form).get('reference') === 'Retained' && form.elements.reference.willValidate, 'Task stages preserve native form values and eligibility.'); form.reset(); check(form.elements.reference.value === 'COAST-01' && list.children[1].getAttribute('aria-current') === 'step', 'Reset changes answers, not application current location.');
  anchor.focus(); list.children[1].removeAttribute('aria-current'); list.children[0].setAttribute('aria-current', 'step'); check(doc.activeElement === anchor, 'Application current-state changes do not move focus.');
  const replacement = steps.cloneNode(true); steps.replaceWith(replacement); win.UI.enhance(replacement); check(!replacement.hasAttribute('data-ui-ready') && replacement.querySelector('[aria-current="step"]'), 'Replacement requires no component lifecycle.');
  replacement.remove(); form.append(replacement); win.UI.enhance(replacement); check(!replacement.hasAttribute('data-ui-ready'), 'Reconnect retains authored native state without initialization.');
  const foreign = doc.implementation.createHTMLDocument('Other'); foreign.body.append(foreign.adoptNode(replacement)); check(replacement.querySelector('[aria-current="step"]') && !replacement.hasAttribute('data-ui-ready'), 'Adoption preserves native text/current state without owned resources.');
  await load(5); check(doc.querySelectorAll('ui-steps > ol > li').length === 1 && !doc.querySelector('[aria-labelledby="empty-title"] ui-steps'), 'Single-stage and zero-stage tasks have honest native content.');
  frame.style.inlineSize = '320px';
  for (const nojs of [false, true]) for (const index of [0, 1, 2, 3, 4, 5]) {
    await load(index, nojs);
    for (const brand of ['', 'forest']) for (const mode of ['light', 'dark']) for (const dir of ['ltr', 'rtl']) {
      doc.documentElement.dataset.brand = brand; doc.documentElement.dataset.theme = mode; doc.documentElement.dir = dir; doc.documentElement.style.fontSize = '200%'; doc.body.style.cssText = 'line-height:1.5;letter-spacing:.12em;word-spacing:.16em'; await settle();
      const items = [...doc.querySelectorAll('ui-steps > ol > li')], links = [...doc.querySelectorAll('ui-steps a')];
      check(doc.documentElement.scrollWidth <= doc.documentElement.clientWidth + 1 && links.every(link => { const r = link.getBoundingClientRect(); return r.width >= 43 && r.height >= 43; }), (nojs ? 'No script' : 'Hosted') + '/' + index + '/' + (brand || 'default') + '/' + mode + '/' + dir + ': enlarged 320px reflow and link targets.');
      check(items.every((item, i) => i === 0 || item.getBoundingClientRect().top >= items[i - 1].getBoundingClientRect().bottom - 1), 'Narrow stages preserve top-to-bottom DOM order.');
    }
  }
  frame.style.inlineSize = '100%'; return passed;
}
document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('#run'), frame = document.querySelector('#stepper-frame');
  button.addEventListener('click', async () => {
    button.disabled = true; document.querySelector('#assertions').replaceChildren();
    try { const passed = await runStepperChecks(frame); document.querySelector('#results').textContent = 'PASS: ' + passed.length + ' Stepper checks. ' + frame.contentWindow.navigator.userAgent; for (const message of passed) { const li = document.createElement('li'); li.textContent = message; document.querySelector('#assertions').append(li); } }
    catch (error) { document.querySelector('#results').textContent = 'FAIL: ' + error.message; }
    finally { button.disabled = false; frame.style.inlineSize = '100%'; document.querySelector('#results-title').focus(); }
  });
});
