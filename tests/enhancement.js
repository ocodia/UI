// Combined entry-point, opt-in patterns and scoped lifecycle checks.
async function runEnhancementChecks(load, frame) {
  const passed = [];
  const check = (value, message) => { assert(value, message); passed.push(message); };
  const settle = win => new Promise(resolve => win.setTimeout(resolve, 65));
  const route = index => `../docs/previews/enhancement-${index}.html`;
  let win = await load(route(0)), doc = win.document;
  const editor = doc.querySelector('ui-form'), form = editor.querySelector('form'), input = form.elements.project;
  check(typeof win.UI?.enhance === 'function' && typeof win.UI?.destroy === 'function' && win.UI.popup === win.UIPopup && form.noValidate, 'Combined entry initializes existing form/summary behavior and exposes shared geometry.');
  form.requestSubmit();
  check(!editor.querySelector('ui-error-summary').hidden && doc.activeElement === editor.querySelector('ui-error-summary'), 'Combined entry retains linked invalid-form summary focus.');
  win.UI.destroy(editor);
  check(!form.noValidate && editor.querySelector('ui-error-summary').hidden && !input.hasAttribute('aria-invalid'), 'Scoped destroy releases form interception, managed errors and native noValidate.');
  editor.remove(); doc.querySelector('main').append(editor); await settle(win);
  check(!form.noValidate, 'A deliberately suspended custom element remains suspended across reinsertion.');
  win.UI.enhance(editor); win.UI.enhance(editor); form.requestSubmit();
  check(form.noValidate && editor.querySelectorAll('ui-error-summary li').length === 1, 'Scoped resume restores one form/summary owner without duplicate errors.');
  input.value = 'Coastal guide'; const submitter = form.querySelector('[type="submit"]');
  check(new win.FormData(form, submitter).get('project') === 'Coastal guide' && new win.FormData(form, submitter).get('action') === 'save', 'Enhancement preserves native answers, successful entries and submitter values.');
  form.reset(); await settle(win);
  check(input.value === '' && editor.querySelector('ui-error-summary').hidden, 'Native reset clears managed feedback after lifecycle resume.');
  const Summary = win.customElements.get('ui-error-summary'), Form = win.customElements.get('ui-form'), api = win.UI, geometry = win.UIPopup;
  const scriptVersion = Date.now();
  async function script(path) { await new Promise((resolve, reject) => { const node = doc.createElement('script'); node.src = new URL(path + `?entry-check=${scriptVersion}`, win.location.href); node.onload = resolve; node.onerror = reject; doc.head.append(node); }); }
  for (const path of ['../../js/components.js', '../../js/popup.js', '../../js/ui.js', '../../js/ui.js']) await script(path);
  check(win.UI === api && win.UIPopup === geometry && win.UI.popup === geometry && win.customElements.get('ui-form') === Form && win.customElements.get('ui-error-summary') === Summary, 'Repeated/mixed entry loading preserves runtime, geometry ownership and registered constructors.');
  form.requestSubmit();
  check(editor.querySelectorAll('ui-error-summary li').length === 1, 'Mixed loading does not duplicate native submission listeners or summary entries.');
  const ownSummary = editor.querySelector('ui-error-summary'); win.UI.destroy(ownSummary);
  check(!form.noValidate, 'Suspending a summary restores native validation in its owning form.');
  win.UI.enhance(ownSummary); check(form.noValidate, 'Resuming a summary restores its owning form readiness.');
  win = await load('../tests/entry-points.html'); doc = win.document;
  check(win.entryBefore.form === win.customElements.get('ui-form') && win.entryBefore.summary === win.customElements.get('ui-error-summary') && win.entryBefore.popup === win.UI.popup, 'Legacy-first loading uses the same constructors and geometry as the combined entry.');
  check(doc.querySelector('#mixed-help').hasAttribute('data-ui-ready') && doc.querySelector('#mixed-editor form').noValidate, 'Legacy-first combined loading initializes declarative help and form behavior once.');
  let duplicateOwner = false;
  try { win.UI.popup.attach({ anchor: doc.querySelector('#mixed-open'), surface: doc.querySelector('#mixed-help') }); } catch (error) { duplicateOwner = error instanceof win.TypeError; }
  check(duplicateOwner, 'Mixed entry loading does not replace the geometry surface-ownership registry.');
  check(!doc.querySelector('#paused-help').hasAttribute('data-ui-ready'), 'Explicit destruction before automatic bootstrap remains suspended.');
  win.UI.enhance(doc.querySelector('#before-start'));
  check(doc.querySelector('#paused-help').hasAttribute('data-ui-ready'), 'Explicit scoped enhancement resumes a task paused before bootstrap.');
  for (const bad of [{}, null, doc.implementation.createHTMLDocument('Foreign document')]) {
    let threw = false; try { win.UI.enhance(bad); } catch (error) { threw = error instanceof win.TypeError; }
    check(threw, 'Foreign or invalid enhancement roots fail explicitly.');
  }
  const fragment = doc.createDocumentFragment(); win.UI.enhance(fragment); win.UI.destroy(fragment);
  check(!fragment.childNodes.length, 'Disconnected fragment lifecycle does not invent or reparent content.');

  for (const index of [1, 2, 3]) {
    win = await load(route(index)); doc = win.document;
    const modal = index === 1, surface = doc.querySelector('[data-ui]'), opener = doc.querySelector('#enhance-open');
    const heading = surface.querySelector('[data-ui-focus]'), close = surface.querySelector('button');
    const baselineText = surface.textContent, native = () => modal ? surface.matches(':modal') : surface.matches(':popover-open');
    check(surface.hasAttribute('data-ui-ready') && !opener.hidden && !close.hidden && !native() && doc.activeElement !== heading && doc.activeElement !== opener, `${index}: automatic installation exposes working actions without opening or moving focus.`);
    check(!surface.hasAttribute('role') && !opener.hasAttribute('aria-expanded') && !surface.hasAttribute('aria-modal'), `${index}: shared setup retains native semantics without redundant roles/state.`);
    win.UI.enhance(surface); win.UI.enhance(doc);
    opener.click(); await settle(win);
    check(native() && (modal ? doc.activeElement === heading : doc.activeElement === opener), `${index}: native opening follows the declared modal/non-modal focus policy.`);
    if (index === 3) check(surface.style.position === 'fixed', 'Declarative Popup acquires actual anchored geometry.');
    win.UI.enhance(surface);
    check(native(), `${index}: repeated enhancement does not close an active task.`);
    if (!modal) {
      const answer = doc.querySelector('#enhance-reference'); answer.focus(); answer.value = 'COAST-02';
      check(native() && doc.activeElement === answer, `${index}: background editing remains native and available.`);
    }
    let closed = 0; surface.addEventListener(modal ? 'close' : 'toggle', event => { if (event.target === surface && (modal || event.newState === 'closed')) closed++; });
    close.focus(); close.click(); await settle(win);
    check(!native() && doc.activeElement === opener && closed === 1, `${index}: one native close restores its own invoker with no duplicate handling.`);
    opener.click(); await settle(win); close.focus();
    win.UI.destroy(surface); win.UI.destroy(surface);
    check(!surface.hasAttribute('data-ui-ready') && (modal ? surface.open && !surface.matches(':modal') : !surface.hasAttribute('popover')) && opener.hidden && close.hidden && surface.textContent === baselineText && doc.activeElement === heading, `${index}: destroy restores one readable copy and fallback focus without changing content.`);
    if (!modal) check(doc.querySelector('#enhance-reference').value === 'COAST-02', `${index}: teardown preserves edited native answers.`);
    win.UI.enhance(surface); opener.click(); await settle(win);
    check(native(), `${index}: scoped reinitialization restores the same nodes and native relationships.`);
    surface.remove(); await settle(win);
    check(!surface.hasAttribute('data-ui-ready') && opener.hidden && !surface.style.position, `${index}: removal releases high-level ownership and geometry.`);
    doc.querySelector('main').append(surface); win.UI.enhance(surface); opener.click(); await settle(win);
    check(native(), `${index}: explicit reinsertion can be enhanced without stale state.`);
    if (modal) surface.close(); else surface.hidePopover(); await settle(win);
    const late = opener.cloneNode(true); late.id = 'late-opener'; opener.after(late);
    win.UI.enhance(surface);
    check(index === 3 ? !surface.hasAttribute('data-ui-ready') && opener.hidden : surface.hasAttribute('data-ui-ready') && !late.hidden, `${index}: late invokers reconcile explicitly; ambiguous positioned anchors keep baseline content.`);
    late.remove(); win.UI.enhance(surface);
    if (modal) {
      opener.click(); await settle(win); opener.remove(); await settle(win);
      check(surface.matches(':modal'), 'Removing a modal invoker does not prematurely end its task.');
      close.click(); await settle(win);
      check(doc.activeElement === doc.querySelector('#enhance-task'), 'Native modal close uses the authored surviving focus destination when its invoker disappears.');
    }
  }

  // Malformed and late markup: never reveal dead actions or hide the only content.
  win = await load(route(2)); doc = win.document; win.UI.destroy();
  let surface = doc.querySelector('[data-ui]'), opener = doc.querySelector('#enhance-open');
  const closes = [...surface.querySelectorAll('button')]; closes.forEach(button => button.remove());
  win.UI.enhance(surface);
  check(!surface.hasAttribute('popover') && opener.hidden && !surface.hasAttribute('data-ui-ready'), 'Missing close actions leave readable inline help and a hidden opener.');
  surface.append(...closes); win.UI.enhance(surface);
  check(surface.hasAttribute('data-ui-ready'), 'Late complete children can be explicitly enhanced.');
  win.UI.destroy(surface); const duplicate = doc.createElement('div'); duplicate.id = surface.id; doc.querySelector('main').append(duplicate); win.UI.enhance(surface);
  check(!surface.hasAttribute('data-ui-ready') && opener.hidden, 'Duplicate target IDs leave their pattern unenhanced.'); duplicate.remove();
  surface.dataset.ui = 'tabs'; win.UI.enhance(surface);
  check(!surface.hasAttribute('data-ui-ready') && !win.customElements.get('ui-tabs'), 'Unknown/planned widgets do not acquire placeholder behavior.');
  surface.dataset.ui = 'popover'; win.UI.enhance(surface); opener.setAttribute('hidden', 'application'); win.UI.destroy(surface);
  check(opener.getAttribute('hidden') === 'application', 'Teardown preserves later application writes to owned scalar attributes.');

  // Independent nested owners: parent modal keeps its own close actions and focus rules.
  win = await load(route(1)); doc = win.document;
  const dialog = doc.querySelector('dialog'), dialogOpen = doc.querySelector('#enhance-open');
  const nested = doc.createElement('section'); nested.innerHTML = '<button id="nested-open" type="button" popovertarget="nested-help" hidden>Open nested help</button><div id="nested-help" data-ui="popover"><h4 tabindex="-1" data-ui-focus>Nested help</h4><p>Keep the original notes.</p><button type="button" popovertarget="nested-help" popovertargetaction="hide" hidden>Close nested help</button></div>';
  dialog.append(nested); win.UI.enhance(dialog); dialogOpen.click(); await settle(win);
  nested.querySelector('button').click(); await settle(win); const child = nested.querySelector('[data-ui]');
  check(dialog.matches(':modal') && child.matches(':popover-open'), 'Nested marked help keeps independent native state inside its parent modal.');
  child.querySelector('button').click(); await settle(win);
  check(dialog.matches(':modal') && !child.matches(':popover-open'), 'Child close actions do not close the parent task.');
  win.UI.destroy(dialog);
  check(dialog.open && !dialog.matches(':modal') && !child.hasAttribute('popover') && !child.hasAttribute('data-ui-ready'), 'Scoped parent destruction releases nested ownership before restoring inline content.');

  for (const setup of ['HTMLDialogElement.prototype.showModal = undefined;', 'HTMLDialogElement.prototype.showModal = () => { throw new Error("Unavailable"); };', 'HTMLDialogElement.prototype.showModal = () => {};']) {
    win = await load(route(1), false, setup); doc = win.document;
    const button = doc.querySelector('#enhance-open'), dialog = doc.querySelector('dialog');
    if (!button.hidden) { button.click(); await settle(win); }
    check(dialog.open && !dialog.matches(':modal') && !dialog.hasAttribute('data-ui-ready') && button.hidden, 'Missing/throwing/no-op modal opening keeps the same readable native dialog baseline.');
  }
  for (const index of [2, 3]) {
    win = await load(route(index), false, 'HTMLElement.prototype.showPopover = undefined;'); doc = win.document;
    check(!doc.querySelector('[data-ui]').hasAttribute('popover') && doc.querySelector('#enhance-open').hidden, `${index}: missing native popover capability leaves the single content copy inline.`);
  }
  win = await load(route(3), false, 'window.ResizeObserver = undefined;'); doc = win.document;
  check(!doc.querySelector('[data-ui]').hasAttribute('popover') && doc.querySelector('#enhance-open').hidden, 'Missing geometry capabilities roll back only library-owned enhancement.');
  win = await load(route(2)); doc = win.document; surface = doc.querySelector('[data-ui]'); opener = doc.querySelector('#enhance-open');
  const cancel = event => { if (event.newState === 'open') event.preventDefault(); }; surface.addEventListener('beforetoggle', cancel); opener.click(); await settle(win);
  check(!surface.matches(':popover-open') && surface.hasAttribute('data-ui-ready'), 'Native opening cancellation preserves a ready declarative popover without fake state.');
  surface.removeEventListener('beforetoggle', cancel); opener.click(); await settle(win);
  check(surface.matches(':popover-open'), 'A cancelled native opening can be retried normally.');

  // Display coverage also verifies no-script single-content fallback in both directions.
  frame.style.inlineSize = '320px'; frame.style.blockSize = '600px';
  for (const index of [1, 2, 3]) {
    win = await load(route(index)); doc = win.document;
    for (const brand of ['', 'forest']) for (const theme of ['light', 'dark']) for (const dir of ['ltr', 'rtl']) {
      win.UI.destroy(); doc.documentElement.dataset.brand = brand; doc.documentElement.dataset.theme = theme; doc.documentElement.dir = dir; doc.documentElement.style.fontSize = '200%';
      doc.body.style.cssText = 'line-height:1.5;letter-spacing:.12em;word-spacing:.16em'; win.UI.enhance();
      const button = doc.querySelector('#enhance-open'), panel = doc.querySelector('[data-ui]');
      button.click(); await settle(win);
      const open = index === 1 ? panel.matches(':modal') : panel.matches(':popover-open');
      const r = panel.getBoundingClientRect();
      check(doc.documentElement.scrollWidth <= doc.documentElement.clientWidth + 1 && (open ? r.left >= -1 && r.right <= win.innerWidth + 1 : !panel.hasAttribute('data-ui-ready') && button.hidden), `${index}/${brand || 'default'}/${theme}/${dir}: enlarged narrow content has a bounded overlay or readable inline recovery.`);
    }
    win.UI.destroy();
    win = await load(route(index), true); doc = win.document;
    for (const dir of ['ltr', 'rtl']) {
      doc.documentElement.dir = dir;
      const panel = doc.querySelector('[data-ui]');
      check(!panel.hasAttribute('data-ui-ready') && doc.querySelector('#enhance-open').hidden && !panel.hasAttribute('popover') && (index !== 1 || panel.open && win.getComputedStyle(panel).position === 'static') && doc.documentElement.scrollWidth <= doc.documentElement.clientWidth + 1, `${index}/${dir}: script-blocked baseline remains readable once, in normal flow at 320px (${JSON.stringify({ready:panel.hasAttribute('data-ui-ready'),open:panel.open,position:win.getComputedStyle(panel).position,scroll:doc.documentElement.scrollWidth,client:doc.documentElement.clientWidth})}).`);
    }
  }
  frame.style.removeProperty('inline-size'); frame.style.removeProperty('block-size');
  return passed;
}
