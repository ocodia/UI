// Trusted repository fixtures. Real input and assistive technology remain separate evidence.
async function runTabsChecks(load, frame) {
  const passed = [], check = (condition, message) => { if (!condition) throw new Error(message); passed.push(message); };
  const settle = () => new Promise(resolve => setTimeout(resolve, 80));
  let win, doc, group, tabs, panels, list;
  const open = async (route = '../docs/previews/tabs-0.html', nojs = false, setup = '') => {
    win = await load(route, nojs, setup); doc = win.document; group = doc.querySelector('ui-tabs');
    list = group.firstElementChild; tabs = [...list.children]; panels = [...group.children].slice(1);
  };
  const key = (node, value, options = {}) => { const event = new win.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...options }); node.dispatchEvent(event); return event.defaultPrevented; };
  const selected = index => tabs.every((tab, i) => tab.getAttribute('aria-selected') === String(index === i)) && panels.every((panel, i) => panel.hidden === (i !== index));
  await open();
  check(!group.hasAttribute('data-ui') && group.hasAttribute('data-ui-ready') && selected(0), 'The ui-tabs element bootstraps without a data-ui marker and selects exactly one panel.');
  win.UI.destroy(group); group.dataset.ui = 'tabs'; win.UI.enhance(group);
  check(group.hasAttribute('data-ui-ready') && selected(0), 'Legacy data-ui="tabs" markup remains compatible.');
  group.removeAttribute('data-ui'); await settle();
  check(group.hasAttribute('data-ui-ready') && selected(0), 'Removing the redundant marker leaves enhancement intact.');
  check(list.localName === 'nav' && !list.hasAttribute('data-ui-tablist'), 'Tabs enhance native navigation without a structural marker.');
  check(!win.customElements.get('ui-tabs') && !win.customElements.get('ui-tablist') && !win.customElements.get('ui-tab') && !win.customElements.get('ui-tab-panel'), 'No new custom-element registration.');
  win.UI.destroy(group);
  const legacyList = doc.createElement('div'); legacyList.setAttribute('data-ui-tablist', ''); legacyList.setAttribute('aria-label', list.getAttribute('aria-label')); legacyList.append(...list.childNodes); list.replaceWith(legacyList); list = legacyList; win.UI.enhance(group);
  check(group.hasAttribute('data-ui-ready') && list.getAttribute('role') === 'tablist' && selected(0), 'Legacy div[data-ui-tablist] remains compatible.');
  win.UI.destroy(group);
  const namedList = doc.createElement('ui-tablist'); namedList.setAttribute('aria-label', list.getAttribute('aria-label')); namedList.append(...list.childNodes); list.replaceWith(namedList); list = namedList; win.UI.enhance(group);
  check(group.hasAttribute('data-ui-ready') && list.getAttribute('role') === 'tablist' && selected(0), 'Replacing the legacy list with ui-tablist preserves native anchors and supports explicit enhancement.');
  const standalone = doc.createElement('ui-tablist'); standalone.innerHTML = '<a href="#visit-arrival">Getting here</a>'; doc.querySelector('main').append(standalone); win.UI.enhance(standalone);
  check(!standalone.hasAttribute('role') && !standalone.hasAttribute('data-ui-ready') && !standalone.firstElementChild.hasAttribute('role') && win.getComputedStyle(standalone).display === 'block', 'Standalone ui-tablist is readable block composition without invented widget behavior.'); standalone.remove();
  win.UI.destroy(group);
  const nativeNav = doc.createElement('nav'); nativeNav.setAttribute('aria-label', list.getAttribute('aria-label')); nativeNav.append(...list.childNodes); list.replaceWith(nativeNav); list = nativeNav; win.UI.enhance(group);
  check(group.hasAttribute('data-ui-ready') && list.getAttribute('role') === 'tablist' && selected(0), 'Native nav replaces the legacy structures without changing anchor ownership.');
  win.UI.destroy(group);
  check(list.localName === 'nav' && !list.hasAttribute('role') && list.getAttribute('aria-label') === 'Visit information' && panels.every(panel => !panel.hidden), 'Teardown restores the named native navigation landmark and readable sections.'); win.UI.enhance(group);
  check(list.getAttribute('role') === 'tablist' && tabs.every((tab, i) => tab.getAttribute('role') === 'tab' && tab.getAttribute('aria-controls') === panels[i].id && panels[i].getAttribute('aria-labelledby') === tab.id && panels[i].tabIndex === 0), 'Complete tab/panel relationships and panel focus stops.');
  let events = []; group.addEventListener('ui-select', event => events.push(event));
  tabs[0].focus();
  for (const [value, index] of [['ArrowRight', 1], ['End', 2], ['ArrowRight', 0], ['ArrowLeft', 2], ['Home', 0]]) check(key(doc.activeElement, value) && doc.activeElement === tabs[index] && selected(0), value + ': manual focus navigation and wrap without selection.');
  key(tabs[0], 'ArrowRight');
  check(tabs[1].tabIndex === 0 && tabs[0].tabIndex === -1 && key(tabs[1], ' ' ) && selected(1), 'Space activates the roving tab.');
  check(events.length === 1 && events[0].bubbles && events[0].composed && !events[0].cancelable && events[0].detail.previousTab === tabs[0] && events[0].detail.panel === panels[1] && events[0].detail.source === 'activation', 'One complete noncancelable selection event after actual change.');
  key(tabs[1], 'Enter'); tabs[1].click(); check(events.length === 1, 'Reselecting emits no duplicate event.');
  const hash = win.location.hash; tabs[2].click(); check(selected(2) && win.location.hash === hash && doc.activeElement === tabs[1], 'Programmatic click selects without focus or URL changes.');
  doc.querySelector('main > h1').setAttribute('tabindex', '-1'); doc.querySelector('h1').focus();
  check(tabs[2].tabIndex === 0 && tabs[1].tabIndex === -1, 'Leaving list restores selected tab as next entry point.');
  tabs[2].focus();
  for (const options of [{ shiftKey: true }, { altKey: true }, { ctrlKey: true }, { metaKey: true }, { isComposing: true }]) check(!key(tabs[2], 'ArrowRight', options) && doc.activeElement === tabs[2], 'Modified/composing keys remain native.');
  for (const value of ['ArrowUp', 'ArrowDown', 'Escape', 'Delete', 'Tab']) check(!key(tabs[2], value), value + ': unrelated key remains native.');
  const prevent = event => event.preventDefault(); tabs[2].addEventListener('keydown', prevent, { capture: true }); key(tabs[2], 'Home'); check(doc.activeElement === tabs[2], 'Already prevented keys are ignored.'); tabs[2].removeEventListener('keydown', prevent, { capture: true });
  doc.documentElement.dir = 'rtl'; key(tabs[2], 'ArrowRight'); check(doc.activeElement === tabs[1] && selected(2), 'Horizontal arrows follow live RTL without resetting selection.'); doc.documentElement.dir = 'ltr';
  const before = events.length; win.UI.enhance(group); win.UI.enhance(doc); check(selected(2) && events.length === before && doc.activeElement === tabs[1], 'Idempotent enhance preserves selection, focus and events.');
  tabs[0].click(); panels[0].querySelector('a').focus(); tabs[1].click(); check(selected(1) && doc.activeElement === tabs[1], 'Switching away from focused content recovers to destination tab.');
  tabs[0].click(); panels[0].querySelector('a').focus(); tabs[1].addEventListener('focus', () => win.UI.destroy(group), { once: true }); tabs[1].click();
  check(!group.hasAttribute('data-ui-ready') && panels.every(panel => !panel.hidden) && !tabs[1].hasAttribute('role'), 'Teardown during focus recovery cannot be followed by stale selection writes.'); win.UI.enhance(group);
  win.UI.destroy(group); check(!group.hasAttribute('data-ui-ready') && panels.every(panel => !panel.hidden && !panel.hasAttribute('role') && !panel.hasAttribute('tabindex')) && panels[0].getAttribute('aria-labelledby') === 'arrival-title' && tabs.every(tab => !tab.hasAttribute('role') && !tab.hasAttribute('tabindex')), 'Destroy restores all readable sections and authored names.');
  check(!key(tabs[0], 'ArrowRight'), 'Destroy releases key ownership.'); win.UI.enhance(group);
  win.UI.destroy(group); panels[0].querySelector('a').focus(); win.history.replaceState(null, '', '#visit-equipment'); win.UI.enhance(group);
  check(selected(0) && doc.activeElement === panels[0].querySelector('a'), 'Installation preserves focused panel ahead of a conflicting initial fragment.');
  win.history.replaceState(null, '', win.location.pathname);
  const target = doc.querySelector('#visit-equipment-note'); let scrolls = 0, focusCalls = 0;
  target.scrollIntoView = () => scrolls++;
  const originalFocus = win.HTMLElement.prototype.focus; win.HTMLElement.prototype.focus = function(...args) { focusCalls++; return originalFocus.apply(this, args); };
  doc.querySelector('h1').focus(); focusCalls = 0;
  win.history.replaceState(null, '', '#visit-equipment-note'); win.dispatchEvent(new win.HashChangeEvent('hashchange')); await settle();
  check(selected(1) && scrolls === 1 && focusCalls === 0, 'Fragment reveals one panel, scrolls once and makes no focus call when outside content.'); win.HTMLElement.prototype.focus = originalFocus;
  tabs[0].click(); win.UI.enhance(group); check(selected(0), 'Refresh does not replay the hash.');
  const unrelated = doc.createElement('ui-accordion'); unrelated.dataset.ui = 'accordion'; unrelated.innerHTML = '<details><summary>Separate topic</summary><p>More information</p></details>'; doc.querySelector('main').append(unrelated); win.UI.enhance(unrelated);
  check(selected(0), 'Installing an unrelated group does not replay another group’s fragment.'); win.UI.destroy(unrelated); unrelated.remove();
  win.dispatchEvent(new win.HashChangeEvent('hashchange')); win.UI.destroy(group); await settle(); check(scrolls === 1, 'Destroy cancels pending fragment scroll.');
  win.UI.enhance(group); doc.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Tab', bubbles: true })); await settle(); check(scrolls === 1, 'Intervening input cancels fragment scroll.');
  win.history.replaceState(null, '', win.location.pathname); tabs[0].click();
  for (const hash of ['#missing', '#%E0%A4%A']) { win.history.replaceState(null, '', hash); win.dispatchEvent(new win.HashChangeEvent('hashchange')); await settle(); check(selected(0), 'Invalid/missing fragment does not switch panels: ' + hash); }
  const duplicate = doc.createElement('p'); duplicate.id = target.id; doc.querySelector('main').append(duplicate);
  win.history.replaceState(null, '', '#' + target.id); win.dispatchEvent(new win.HashChangeEvent('hashchange')); await settle(); check(selected(0), 'Duplicate fragment destination is left to native navigation.'); duplicate.remove();
  target.hidden = true; win.dispatchEvent(new win.HashChangeEvent('hashchange')); await settle(); check(selected(0) && target.hidden, 'Fragments never remove authored hidden content.'); target.hidden = false;
  win.dispatchEvent(new win.HashChangeEvent('hashchange')); win.history.replaceState(null, '', '#missing'); await settle(); check(scrolls === 1, 'Superseding hash cancels stale scroll.');
  win.history.replaceState(null, '', win.location.pathname); tabs[0].click();
  const lateTab = doc.createElement('a'), latePanel = doc.createElement('section'); lateTab.id = 'late-tab'; lateTab.href = '#late-panel'; lateTab.textContent = 'Late'; latePanel.id = 'late-panel'; latePanel.textContent = 'Late content'; list.append(lateTab); group.append(latePanel); await settle();
  check(!group.hasAttribute('data-ui-ready') && panels.every(panel => !panel.hidden), 'Late pairs release stale enhancement to readable baseline.'); win.UI.enhance(group); check(group.hasAttribute('data-ui-ready') && latePanel.hidden, 'Explicit enhance accepts the complete late pair.');
  lateTab.click(); latePanel.focus(); lateTab.remove(); latePanel.remove(); await settle(); check(group.hasAttribute('data-ui-ready') && tabs[2].getAttribute('aria-selected') === 'true' && doc.activeElement === tabs[2], 'Atomic selected pair removal selects and focuses preceding survivor.');
  tabs[1].click(); tabs[1].remove(); panels[1].remove(); await settle(); check(group.hasAttribute('data-ui-ready') && tabs[2].getAttribute('aria-selected') === 'true', 'Selected middle pair removal selects following survivor.');
  group.setAttribute('data-orientation', 'vertical'); await settle(); check(!group.hasAttribute('data-ui-ready'), 'Configuration changes release ownership until explicit refresh.'); win.UI.enhance(group); check(list.getAttribute('aria-orientation') === 'vertical', 'Explicit refresh applies orientation.');
  group.setAttribute('data-activation', 'unknown'); group.setAttribute('data-orientation', 'unknown'); win.UI.enhance(group);
  check(list.getAttribute('aria-orientation') === 'horizontal', 'Invalid configuration values use horizontal/manual defaults.'); tabs[0].click(); tabs[0].focus(); key(tabs[0], 'ArrowRight'); check(tabs[0].getAttribute('aria-selected') === 'true', 'Invalid activation value keeps manual focus separate from selection.');
  panels[0].setAttribute('aria-labelledby', 'application-label'); await settle(); check(!group.hasAttribute('data-ui-ready') && panels[0].getAttribute('aria-labelledby') === 'application-label', 'Concurrent authored naming is preserved on release.');
  win.UI.enhance(group); group.remove(); await settle(); check(!group.hasAttribute('data-ui-ready') && [...group.querySelectorAll('section')].every(panel => !panel.hidden), 'Disconnect releases roles and hiding.'); doc.querySelector('main').append(group); await settle(); check(!group.hasAttribute('data-ui-ready'), 'Reinsertion requires enhance.'); win.UI.enhance(group);
  const foreign = doc.implementation.createHTMLDocument('Other'); foreign.body.append(foreign.adoptNode(group)); await settle(); check(!group.hasAttribute('data-ui-ready'), 'Adoption cleans old-document resources.');
  await open('../docs/previews/tabs-1.html'); tabs[0].focus(); key(tabs[0], 'ArrowDown'); check(selected(1) && doc.activeElement === tabs[1], 'Automatic vertical Down moves selection and focus together.');
  doc.documentElement.dir = 'rtl'; key(tabs[1], 'ArrowDown'); check(selected(0), 'Vertical wrapping stays in DOM order in RTL.'); check(!key(tabs[0], 'ArrowLeft'), 'Vertical list leaves horizontal arrows native.'); key(tabs[0], 'End'); check(selected(1), 'Automatic End selects final tab.');
  await open('../docs/previews/tabs-2.html');
  const form = doc.querySelector('form'), field = form.elements.context, outer = group, nested = doc.querySelectorAll('ui-tabs')[1], disclosure = doc.querySelector('details');
  check([...doc.querySelectorAll('ui-tabs')].every(node => node.hasAttribute('data-ui-ready')), 'Nested tabs initialize even under owned inactive panels.');
  form.requestSubmit(); const summary = doc.querySelector('ui-error-summary'); check(!summary.hidden && doc.activeElement === summary, 'Validation keeps summary as focus owner.'); summary.querySelector('a').click(); await settle();
  check(!panels[1].hidden && disclosure.open && doc.activeElement === field, 'Summary link reveals Tabs and Accordion before focusing field.');
  field.value = 'Low tide'; form.elements.observation.value = 'Rock pool'; tabs[0].click(); check(new win.FormData(form).get('context') === 'Low tide' && new win.FormData(form).get('reference') === 'COAST-01', 'Inactive panels preserve native successful values.'); form.reset(); check(selected(0) && field.value === '' && form.elements.observation.value === 'Tide pools', 'Reset restores answers, not selection.');
  tabs[1].click(); const innerTabs = [...nested.firstElementChild.children]; innerTabs[0].focus(); key(innerTabs[0], 'ArrowRight'); check(doc.activeElement === innerTabs[1] && selected(1) && innerTabs[0].getAttribute('aria-selected') === 'true', 'Nested manual navigation belongs only to inner group.'); check(!key(field, 'ArrowRight'), 'Content field keys are untouched.');
  win.location.hash = 'status-panel'; await settle(); check(!nested.lastElementChild.hidden && !panels[1].hidden && disclosure.open, 'Deep fragment reveals nested Tabs/details from outside in.');
  win.UI.destroy(outer); check([...doc.querySelectorAll('ui-tabs,ui-accordion')].every(node => !node.hasAttribute('data-ui-ready')), 'Scoped teardown releases nested patterns deepest first.');
  // External form ownership is independent of DOM containment.
  await open(); const externalForm = doc.createElement('form'); externalForm.id = 'external-owner'; doc.querySelector('main').append(externalForm); const external = doc.createElement('input'); external.id = 'external-answer'; external.name = 'answer'; external.required = true; external.setAttribute('form', externalForm.id); panels[2].append(external); await settle();
  check(!externalForm.reportValidity() && selected(2) && doc.activeElement === external && external.form === externalForm, 'Externally associated native form reveals and focuses its invalid field.'); external.value = 'Retained'; tabs[0].click(); check(new win.FormData(externalForm).get('answer') === 'Retained', 'External hidden-panel answer remains successful.');
  // Native validation does not use the ui-form summary path.
  await open(); const nativeForm = doc.createElement('form'); group.before(nativeForm); nativeForm.append(group); const one = doc.createElement('input'), two = doc.createElement('input'); one.required = two.required = true; one.name = 'one'; two.name = 'two'; panels[1].append(one); panels[2].append(two); await settle();
  check(!nativeForm.reportValidity() && selected(1) && doc.activeElement === one, 'Native reportValidity reveals and focuses the first invalid panel.'); await settle(); one.value = 'Ready'; check(!nativeForm.checkValidity() && selected(2), 'Later validation pass can reveal the next invalid panel.'); await settle();
  // An active native overlay cannot disappear behind a panel switch.
  tabs[0].click(); const dialog = doc.createElement('dialog'); dialog.innerHTML = '<button type="button">Close</button>'; panels[0].append(dialog); dialog.showModal(); tabs[1].click(); check(selected(0) && dialog.open, 'Open dialog blocks hiding its panel.'); dialog.close(); tabs[1].click(); check(selected(1), 'Selection resumes after application closes overlay.');
  win.UI.destroy(group); panels[2].append(dialog); dialog.setAttribute('open', ''); doc.querySelector('h1').setAttribute('tabindex', '-1'); doc.querySelector('h1').focus(); win.UI.enhance(group);
  check(!group.hasAttribute('data-ui-ready') && panels.every(panel => !panel.hidden) && dialog.open, 'Initialization leaves readable baseline when selection would hide an existing open task.'); dialog.close(); dialog.remove(); win.UI.enhance(group);
  // Invalid baseline markup must never gain partial roles or hidden content.
  win.UI.destroy(group); const baseline = group.outerHTML; group.remove(); const host = doc.createElement('div'); doc.querySelector('main').append(host);
  for (const mutate of [node => node.firstElementChild.remove(), node => node.lastElementChild.remove(), node => node.firstElementChild.removeAttribute('aria-label'), node => node.querySelector('a').href = '#%E0%A4%A', node => node.querySelector('a').setAttribute('role', 'button'), node => node.lastElementChild.hidden = true, node => node.querySelector('a').setAttribute('aria-disabled', 'true'), node => node.querySelector('a').append(doc.createElement('button')), node => node.children[2].id = node.children[1].id, node => node.firstElementChild.replaceWith(doc.createElement('div')), node => node.append(doc.createElement('ui-tablist'))]) {
    host.innerHTML = baseline; const invalid = host.firstElementChild; mutate(invalid); win.UI.enhance(invalid); check(!invalid.hasAttribute('data-ui-ready') && !invalid.querySelector('[data-ui-tabs-inactive]'), 'Invalid structure remains baseline without owned hiding.'); win.UI.destroy(invalid);
  }
  host.remove();
  // A wrapper without a data-ui marker still preserves its containing dialog's actions.
  win = await load('../docs/previews/enhancement-1.html'); doc = win.document;
  const modal = doc.querySelector('dialog'), close = modal.querySelector('button'), wrapper = doc.createElement('ui-tabs');
  wrapper.innerHTML = '<nav aria-label="Task views"><a id="task-actions-tab" href="#task-actions">Actions</a><a id="task-info-tab" href="#task-info">Information</a></nav><section id="task-actions"><h3>Actions</h3></section><section id="task-info"><h3>Information</h3><p>More task information.</p></section>';
  close.before(wrapper); wrapper.children[1].append(close); win.UI.enhance(modal); doc.querySelector('#enhance-open').click(); close.click();
  check(wrapper.hasAttribute('data-ui-ready') && !modal.open, 'A marker-free Tabs wrapper preserves containing dialog close ownership.');
  await open('../docs/previews/tabs-0.html', false, 'document.addEventListener("DOMContentLoaded",()=>UI.destroy(document.querySelector("ui-tabs")),{once:true});');
  check(!group.hasAttribute('data-ui-ready') && panels.every(panel => !panel.hidden), 'Destroy before automatic bootstrap suspends a marker-free wrapper.'); win.UI.enhance(group);
  check(group.hasAttribute('data-ui-ready'), 'Explicit enhance resumes a marker-free wrapper after suspension.');
  for (const setup of ['window.MutationObserver=undefined;', 'window.AbortController=undefined;', 'window.requestAnimationFrame=undefined;']) { await open('../docs/previews/tabs-0.html', false, setup); check(!group.hasAttribute('data-ui-ready') && panels.every(panel => !panel.hidden), 'Missing capability leaves all sections readable: ' + setup + ' / ' + typeof win.MutationObserver + '/' + typeof win.AbortController + '/' + typeof win.requestAnimationFrame); }
  await open('../docs/previews/tabs-0.html#visit-equipment-note'); await settle(); check(selected(1), 'Initial URL fragment selects its containing panel.');
  frame.style.inlineSize = '320px';
  for (const nojs of [false, true]) {
    await open('../docs/previews/tabs-0.html', nojs);
    if (nojs) {
      check(list.localName === 'nav' && !list.hasAttribute('role') && list.getAttribute('aria-label') === 'Visit information', 'Script-blocked baseline retains named native navigation.');
      tabs[1].click(); await settle(); check(win.location.hash === '#visit-equipment' && panels.every(panel => !panel.hidden), 'Baseline fragment links navigate to readable sections without JavaScript.');
    }
    for (const brand of ['', 'forest']) for (const theme of ['light', 'dark']) for (const dir of ['ltr', 'rtl']) {
      doc.documentElement.dataset.brand = brand; doc.documentElement.dataset.theme = theme; doc.documentElement.dir = dir; doc.documentElement.style.fontSize = '200%'; doc.body.style.cssText = 'line-height:1.5;letter-spacing:.12em;word-spacing:.16em'; await settle();
      check(doc.documentElement.scrollWidth <= doc.documentElement.clientWidth + 1 && (nojs ? panels.every(panel => !panel.hidden) : selected(0)), (nojs ? 'No script' : 'Enhanced') + '/' + (brand || 'default') + '/' + theme + '/' + dir + ': 320px enlarged-text reflow.');
    }
  }
  frame.style.inlineSize = '100%'; return passed;
}
document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('#run'), frame = document.querySelector('#tabs-frame'); if (!button || !frame) return;
  const load = async (route, nojs = false, setup = '') => {
    if (nojs) frame.setAttribute('sandbox', 'allow-same-origin'); else frame.removeAttribute('sandbox');
    if (setup) { const html = await (await fetch(route)).text(); await new Promise(resolve => { frame.onload = resolve; frame.srcdoc = html.replace('<head>', `<head><base href="${new URL(route, location.href).href}"><script>${setup}<\/script>`); }); }
    else await new Promise(resolve => { frame.onload = resolve; frame.src = route; frame.removeAttribute('srcdoc'); }); return frame.contentWindow;
  };
  button.addEventListener('click', async () => {
    button.disabled = true; document.querySelector('#assertions').replaceChildren();
    try { const passed = await runTabsChecks(load, frame); document.querySelector('#results').textContent = 'PASS: ' + passed.length + ' Tabs checks. ' + frame.contentWindow.navigator.userAgent; for (const message of passed) { const item = document.createElement('li'); item.textContent = message; document.querySelector('#assertions').append(item); } }
    catch (error) { document.querySelector('#results').textContent = 'FAIL: ' + error.message; }
    finally { button.disabled = false; frame.style.inlineSize = '100%'; document.querySelector('#results-title').focus(); }
  });
});
