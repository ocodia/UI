// Trusted repository fixtures; synthetic events do not establish real keyboard/AT behavior.
async function runDropdownChecks(load, frame) {
  const passed = [], check = (condition, message) => { if (!condition) throw new Error(`After ${passed.length}: ${message}`); passed.push(message); };
  const settle = () => new Promise(resolve => setTimeout(resolve, 60));
  let win, doc, menu, trigger, list, items;
  const open = async (route = '../docs/previews/dropdown-0.html', nojs = false, setup = '') => {
    win = await load(route, nojs, setup); doc = win.document; menu = doc.querySelector('ui-menu'); trigger = menu.firstElementChild; list = menu.lastElementChild; items = [...list.querySelectorAll('li > a,li > button')];
  };
  const key = (node, value, options = {}, type = 'keydown') => { const event = new win.KeyboardEvent(type, { key: value, bubbles: true, cancelable: true, ...options }); node.dispatchEvent(event); return event.defaultPrevented; };
  const show = async () => { trigger.click(); await settle(); };
  await open();
  check(menu.hasAttribute('data-ui-ready') && !menu.hasAttribute('data-ui') && !trigger.hidden && list.popover === 'auto', 'Element-name bootstrap installs one ready native popover.');
  check(list.getAttribute('role') === 'menu' && trigger.getAttribute('aria-haspopup') === 'menu' && trigger.popoverTargetElement === list && trigger.getAttribute('aria-controls') === list.id, 'Named native trigger and list have complete menu relationships.');
  check(items.every(item => item.getAttribute('role') === 'menuitem' && item.tabIndex === -1) && [...list.children].every(row => row.getAttribute('role') === 'none'), 'Complete ready-only item roles, no positive or sequential item tabindex.');
  const divider = list.querySelector('hr');
  check(divider && divider.tabIndex === -1 && !divider.hasAttribute('role') && divider.parentElement.getAttribute('role') === 'none', 'Native hr dividers retain separator semantics without a keyboard stop.');
  check(!win.customElements.get('ui-menu') && !win.customElements.get('ui-menu-item'), 'No placeholder wrapper/item registration.');
  await show(); items[3].click(); await settle(); check(doc.querySelector('#report-state').textContent === 'Archived' && !doc.querySelector('#undo-archive').hidden && !list.matches(':popover-open'), 'Report archive changes the visible card and leaves Undo outside the closed menu.');
  const undo = doc.querySelector('#undo-archive'); undo.focus(); undo.click(); check(undo.hidden && !items[3].disabled && doc.querySelector('#report-state').textContent.includes('Draft') && doc.activeElement === trigger, 'Undo restores the report and moves focus before hiding its action.');
  await show();
  check(list.matches(':popover-open') && trigger.getAttribute('aria-expanded') === 'true' && doc.activeElement === items[0], 'Native trigger opening focuses first enabled item and mirrors expanded.');
  for (const [value, index] of [['ArrowDown', 1], ['ArrowDown', 3], ['ArrowDown', 0], ['ArrowUp', 3], ['Home', 0], ['End', 3]]) check(key(doc.activeElement, value) && doc.activeElement === items[index], value + ' moves/wraps and skips native disabled buttons.');
  divider.click(); check(list.matches(':popover-open') && !key(divider, 'Home'), 'Separators neither activate commands nor own navigation keys.');
  check(items[2].disabled && items[2].getAttribute('aria-disabled') === null, 'Native disabled state is retained without an ARIA simulation.');
  key(items[3], 'd'); check(doc.activeElement === items[1], 'Single-character typeahead finds the matching label.'); key(items[1], 'o'); check(doc.activeElement === items[1], 'Multi-character typeahead retains a matching current item.');
  await new Promise(resolve => setTimeout(resolve, 520)); key(items[1], 'e'); check(doc.activeElement === items[0], 'Typeahead timeout starts a fresh buffer.'); key(items[0], 'z'); check(doc.activeElement === items[0], 'Unmatched typeahead does not move focus.');
  key(items[0], 'Home');
  for (const options of [{ altKey: true }, { ctrlKey: true }, { metaKey: true }, { isComposing: true }, { shiftKey: true }]) check(!key(items[0], 'ArrowDown', options) && doc.activeElement === items[0], 'Modified/composing navigation remains native.');
  for (const value of ['Tab','Escape','ArrowLeft','ArrowRight']) check(!key(items[0], value), value + ' default remains native.');
  doc.documentElement.dir = 'rtl'; key(items[0], 'ArrowDown'); check(doc.activeElement === items[1], 'Vertical order stays native in live RTL.'); doc.documentElement.dir = 'ltr';
  win.UI.enhance(menu); win.UI.enhance(doc); check(list.matches(':popover-open') && doc.activeElement === items[1], 'Repeated scoped/document enhance preserves native open state and focus.');
  list.hidePopover(); await settle(); check(trigger.getAttribute('aria-expanded') === 'false' && doc.activeElement === trigger, 'Native imperative closing restores stranded focus and expanded state.');
  check(key(trigger, 'ArrowUp'), 'Trigger ArrowUp is owned.'); await settle(); check(doc.activeElement === items[3], 'ArrowUp opens at final enabled item.'); list.hidePopover(); await settle();
  key(trigger, 'ArrowDown'); await settle(); check(doc.activeElement === items[0], 'ArrowDown opens at first enabled item.'); list.hidePopover(); await settle();
  list.showPopover(); await settle(); check(doc.activeElement === items[0] && trigger.getAttribute('aria-expanded') === 'true', 'Direct native opening uses the same focus/expanded path.');
  const prevent = event => { if (event.newState === 'open') event.preventDefault(); }; list.hidePopover(); await settle(); list.addEventListener('beforetoggle', prevent); trigger.click(); await settle();
  check(!list.matches(':popover-open') && trigger.getAttribute('aria-expanded') === 'false' && menu.hasAttribute('data-ui-ready'), 'Cancelled native opening stays closed, honest and retryable.'); list.removeEventListener('beforetoggle', prevent);
  await show(); win.dispatchEvent(new win.Event('beforeprint')); check(!list.matches(':popover-open') && trigger.getAttribute('aria-expanded') === 'false', 'Print preparation closes the native top layer without reopening.');
  await show(); const outside = doc.querySelector('#after-menu'); outside.focus(); await settle(); check(!list.matches(':popover-open') && doc.activeElement === outside, 'Intentional outside focus closes without opener theft: ' + JSON.stringify({active:doc.activeElement.id,open:list.matches(':popover-open'),ready:menu.hasAttribute('data-ui-ready')}));
  await show(); let clicks = 0; const cancel = event => { event.preventDefault(); clicks++; }; items[0].addEventListener('click', cancel);
  key(items[0], ' '); key(items[0], ' ', { repeat: true }); key(items[0], ' ', {}, 'keyup'); await settle(); check(clicks === 1 && !list.matches(':popover-open'), 'Anchor Space activates exactly once on keyup, then closes.');
  await show(); key(items[0], ' '); items[1].focus(); key(items[1], ' ', {}, 'keyup'); check(clicks === 1, 'Blur cancels pending Space activation.');
  const newDividerRow = doc.createElement('li'); newDividerRow.innerHTML = '<hr>'; items[1].parentElement.before(newDividerRow); win.UI.enhance(menu); check(menu.hasAttribute('data-ui-ready') && list.matches(':popover-open') && newDividerRow.getAttribute('role') === 'none', 'Explicit divider insertion preserves the current menu and command focus model.'); newDividerRow.remove(); await settle(); check(menu.hasAttribute('data-ui-ready') && !newDividerRow.hasAttribute('role'), 'Divider removal releases only the obsolete row ownership.');
  // Keep a newer opening alive when an earlier command queued a deferred close.
  items[0].click(); list.hidePopover(); list.showPopover(); await settle(); check(list.matches(':popover-open'), 'An older command cannot close a newer opening.'); items[0].removeEventListener('click', cancel);
  items[1].focus(); items[1].parentElement.remove(); await settle(); check(menu.hasAttribute('data-ui-ready') && list.matches(':popover-open') && doc.activeElement === items[3], 'Focused command removal chooses the following enabled survivor.');
  win.UI.destroy(menu); check(trigger.hidden && !list.hasAttribute('popover') && !list.hasAttribute('role') && !menu.hasAttribute('data-ui-ready') && [...list.querySelectorAll('a,button')].every(item => !item.hasAttribute('tabindex') && !item.hasAttribute('role')), 'Destroy restores inline native list, hidden trigger and authored Tab stops.');
  check(!key(items[0], 'ArrowDown'), 'Destroyed menu releases key ownership.');
  items[0].focus(); win.UI.enhance(menu); check(!menu.hasAttribute('data-ui-ready') && !list.hasAttribute('popover') && doc.activeElement === items[0], 'Focused baseline defers conversion without hiding focus.'); outside.focus(); await settle(); check(menu.hasAttribute('data-ui-ready'), 'Leaving focused baseline completes deferred enhancement.');
  trigger.focus(); win.UI.destroy(menu); check(doc.activeElement === items[0] && trigger.hidden && !list.hasAttribute('popover'), 'Destroy of focused trigger recovers to visible inline commands.');
  outside.focus(); win.UI.enhance(menu); await show(); trigger.setAttribute('aria-controls', 'application-owned'); await settle(); check(!menu.hasAttribute('data-ui-ready') && trigger.getAttribute('aria-controls') === 'application-owned' && !list.hasAttribute('role'), 'Later application scalar writes survive safe release.'); trigger.removeAttribute('aria-controls'); outside.focus();
  win.UI.enhance(menu); const late = doc.createElement('li'); late.innerHTML = '<button type="button">Late command</button>'; list.append(late); await settle(); check(!menu.hasAttribute('data-ui-ready') && !list.hasAttribute('popover'), 'Unrefreshed insertion releases stale menu semantics to inline fallback.'); win.UI.enhance(menu); check(late.firstElementChild.getAttribute('role') === 'menuitem', 'Explicit enhance accepts late commands.');
  await show(); const extra = doc.createElement('li'); extra.innerHTML = '<button type="button">Inserted command</button>'; list.append(extra); win.UI.enhance(menu); check(menu.hasAttribute('data-ui-ready') && list.matches(':popover-open') && doc.activeElement === items[0] && extra.firstElementChild.getAttribute('role') === 'menuitem', 'Explicit atomic insertion preserves open state and existing focus.'); list.hidePopover(); await settle();
  menu.remove(); await settle(); check(!menu.hasAttribute('data-ui-ready') && !list.hasAttribute('popover'), 'Disconnect releases native/geometry ownership.'); doc.querySelector('main').append(menu); await settle(); check(!menu.hasAttribute('data-ui-ready'), 'Reinsertion requires explicit enhance.'); win.UI.enhance(menu); check(menu.hasAttribute('data-ui-ready'), 'Explicit reconnect installs once.');
  const foreign = doc.implementation.createHTMLDocument('Adopted'); foreign.body.append(menu); await settle(); check(!menu.hasAttribute('data-ui-ready') && !list.hasAttribute('popover'), 'Adoption releases old-document resources.');
  await open(); win.UI.destroy(menu); items[0].textContent = 'İncele'; items[1].textContent = 'İndir'; menu.lang = 'tr'; win.UI.enhance(menu); await show(); key(items[0], 'i'); check(doc.activeElement === items[1], 'Turkish locale case folding matches translated labels.'); key(items[1], 'i'); check(doc.activeElement === items[0], 'Repeated character typeahead cycles translated matches.'); list.hidePopover(); await settle();
  const parentDialog = doc.createElement('dialog'); parentDialog.innerHTML = '<h2>Report task</h2><button type="button" id="task-close">Close task</button>'; doc.querySelector('main').append(parentDialog); win.UI.destroy(menu); parentDialog.prepend(menu); parentDialog.showModal(); doc.querySelector('#task-close').focus(); win.UI.enhance(menu); await show(); check(parentDialog.contains(list) && list.matches(':popover-open') && parentDialog.matches(':modal') && doc.activeElement === items[0], 'Menu opens inside its native dialog without reparenting or losing modal ownership.'); list.hidePopover(); await settle(); check(parentDialog.matches(':modal') && doc.activeElement === trigger, 'Menu closing preserves its parent dialog and returns to the contained trigger.'); win.UI.destroy(parentDialog); parentDialog.close(); parentDialog.remove();
  await open(); trigger.focus(); trigger.disabled = true; await settle(); check(!menu.hasAttribute('data-ui-ready') && !list.hasAttribute('popover') && trigger.hidden && doc.activeElement === items[0], 'Disabling a focused trigger restores inline commands and useful focus.');
  await open(); win.UI.destroy(menu); const disabledGroup = doc.createElement('fieldset'); disabledGroup.disabled = true; doc.querySelector('main').append(disabledGroup); disabledGroup.append(menu); win.UI.enhance(menu); check(trigger.matches(':disabled') && !trigger.disabled && trigger.hidden && !list.hasAttribute('popover'), 'Inherited native fieldset disabling leaves commands inline without a dead opener.'); disabledGroup.disabled = false; doc.querySelector('#after-menu').focus(); win.UI.enhance(menu); await show(); disabledGroup.disabled = true; await settle(); check(!menu.hasAttribute('data-ui-ready') && !list.hasAttribute('popover') && doc.activeElement === items[0], 'Dynamic inherited disabling restores inline commands while retaining an enabled native link focus.');
  await open(); win.UI.destroy(menu); items.forEach(item => item.parentElement.remove()); win.UI.enhance(menu); check(trigger.hidden && !menu.hasAttribute('data-ui-ready') && !list.hasAttribute('popover'), 'Empty menu leaves no dead opener or compound semantics.');
  list.replaceChildren(); const row = doc.createElement('li'); row.innerHTML = '<button type="button" disabled>Unavailable</button>'; list.append(row); win.UI.enhance(menu); check(trigger.hidden && !menu.hasAttribute('data-ui-ready'), 'All-disabled menu retains the inline unavailable command.');
  await open('../docs/previews/dropdown-1.html');
  const form = doc.querySelector('form'), field = form.elements.subject, summary = doc.querySelector('ui-error-summary');
  await show();
  const appearance = node => { const style = win.getComputedStyle(node); return ['color','backgroundColor','fontSize','fontWeight','lineHeight','paddingBlockStart','paddingInlineStart','textAlign','textDecorationLine','borderWidth','borderRadius','minBlockSize'].map(name => style[name]).join('|'); };
  field.focus(); await settle();
  check(appearance(items[0]) === appearance(items[2]) && win.getComputedStyle(items[0]).textAlign === 'start' && win.getComputedStyle(items[2]).textDecorationLine === 'none', 'Buttons and links share neutral menu-item typography, spacing, alignment and decoration.');
  items[0].dataset.variant = 'danger'; items[0].dataset.size = 'large';
  check(appearance(items[0]) === appearance(items[2]), 'Native button variants and sizes cannot override menu-item presentation.');
  await show(); items[0].focus(); const buttonFocus = appearance(items[0]); items[2].focus(); check(buttonFocus === appearance(items[2]), 'Focused menu buttons and links share the same visible focus treatment.'); list.hidePopover(); await settle();

  field.value = ''; await show(); items[0].click(); await settle(); check(!summary.hidden && doc.activeElement === summary && !list.matches(':popover-open'), 'Native submitter keeps ui-form invalid-summary focus after closing.');
  field.value = 'Retained'; await show(); let submitter; form.addEventListener('submit', event => { submitter = event.submitter; }); items[0].click(); await settle();
  check(submitter === items[0] && !doc.querySelector('#newsletter-preview').hidden && doc.querySelector('#preview-subject').textContent === 'Retained' && new win.FormData(form, submitter).get('action') === 'preview' && doc.activeElement === trigger, 'Native submitter/name/value/FormData survive exactly one valid activation.');
  check(!doc.querySelector('#preview-result') && doc.querySelector('#newsletter-status').textContent.includes('No email was sent'), 'Application newsletter preview owns its outcome without the generic documentation value dump.');
  await show(); items[1].click(); await settle(); check(field.value === 'October field notes', 'Native menu reset restores authored answers.');
  check(doc.querySelector('#newsletter-preview').hidden && doc.querySelector('#newsletter-status').textContent === '', 'Reverting the subject clears the stale email preview and its feedback.');
  field.value = 'Keep'; const stopReset = event => event.preventDefault(); form.addEventListener('reset', stopReset); await show(); items[1].click(); await settle(); check(field.value === 'Keep', 'Cancelled native reset preserves answers.'); form.removeEventListener('reset', stopReset);
  // Native validation without ui-form remains browser-owned.
  win.UI.destroy(doc.querySelector('ui-form')); form.noValidate = false; win.UI.enhance(menu); field.value = ''; await show(); items[0].click(); await settle(); check(doc.activeElement === field && !list.matches(':popover-open'), 'Native constraint validation retains invalid-field focus.');
  field.value = 'External'; const external = doc.createElement('form'); external.id = 'external'; doc.querySelector('main').append(external); items[0].setAttribute('form', external.id); await show(); let externalSubmitter; external.addEventListener('submit', event => { event.preventDefault(); externalSubmitter = event.submitter; }); items[0].click(); await settle(); check(externalSubmitter === items[0] && items[0].form === external, 'External native form association remains authoritative.');
  await show(); items[0].disabled = true; await settle(); check(doc.activeElement === items[1] && list.matches(':popover-open'), 'Disabling the focused native command chooses its next enabled neighbor.');
  // Dialog focus wins over both menu native restoration and deferred command close.
  const dialog = doc.createElement('dialog'); dialog.innerHTML = '<button type="button">Close task</button>'; doc.querySelector('main').append(dialog); items[1].addEventListener('click', event => { event.preventDefault(); dialog.showModal(); }, { once: true }); items[1].click(); await settle(); check(dialog.open && doc.activeElement === dialog.firstElementChild && !list.matches(':popover-open'), 'A command dialog retains initial focus while its menu closes.'); dialog.close(); dialog.remove();
  await open(); win.UI.destroy(menu); const baseline = menu.outerHTML; menu.remove(); const host = doc.createElement('div'); doc.querySelector('main').append(host);
  for (const mutate of [node => node.firstElementChild.remove(), node => node.lastElementChild.remove(), node => node.lastElementChild.removeAttribute('aria-labelledby'), node => node.firstElementChild.id = node.lastElementChild.id, node => node.lastElementChild.hidden = true, node => node.querySelector('li a').tabIndex = 0, node => node.querySelector('li a').setAttribute('role','menuitem'), node => node.querySelector('li a').append(doc.createElement('input')), node => node.querySelector('li a').append(doc.createElement('ui-menu')), node => node.lastElementChild.setAttribute('popover','auto'), node => node.firstElementChild.disabled = true, node => node.lastElementChild.prepend(node.querySelector('hr').parentElement), node => node.lastElementChild.append(node.querySelector('hr').parentElement), node => node.querySelector('hr').parentElement.after(node.querySelector('hr').parentElement.cloneNode(true)), node => node.querySelector('li a').setAttribute('aria-disabled','true')]) {
    host.innerHTML = baseline; const invalid = host.firstElementChild; mutate(invalid); win.UI.enhance(invalid); check(!invalid.hasAttribute('data-ui-ready') && !invalid.querySelector('[role="menu"]'), 'Malformed/conflicting structure acquires no menu semantics.'); win.UI.destroy(invalid);
  }
  host.remove();
  for (const setup of ['window.ResizeObserver=undefined;', 'window.MutationObserver=undefined;', 'window.AbortController=undefined;', 'HTMLElement.prototype.showPopover=undefined;']) { await open('../docs/previews/dropdown-0.html', false, setup); check(!menu.hasAttribute('data-ui-ready') && trigger.hidden && !list.hasAttribute('popover') && !list.hasAttribute('role'), 'Missing capability rolls back to inline native commands: ' + setup); }
  await open('../docs/previews/dropdown-2.html'); const action = doc.querySelector('#send-reminder'), retry = doc.querySelector('#reminder-retry'), status = doc.querySelector('#reminder-status'); await show(); action.click(); await new Promise(resolve => setTimeout(resolve, 460)); check(!retry.hidden && status.textContent.includes('failed') && !list.matches(':popover-open'), 'Application failure/retry feedback persists outside closed menu.'); retry.focus(); retry.click(); check(!retry.hidden && retry.disabled && doc.activeElement === trigger, 'Retry remains visible while focus moves to an available invoice action during preparation.'); await new Promise(resolve => setTimeout(resolve, 460)); check(retry.hidden && status.textContent.includes('completed') && doc.activeElement === trigger, 'Application retry completes and restores focus before hiding its action.');
  frame.style.inlineSize = '320px';
  for (const nojs of [false, true]) {
    await open('../docs/previews/dropdown-0.html', nojs);
    check(nojs ? trigger.hidden && !list.hasAttribute('role') && !list.hasAttribute('popover') : menu.hasAttribute('data-ui-ready'), 'Script mode preserves the appropriate native/ready baseline.');
    for (const brand of ['', 'forest']) for (const theme of ['light','dark']) for (const dir of ['ltr','rtl']) {
      doc.documentElement.dataset.brand = brand; doc.documentElement.dataset.theme = theme; doc.documentElement.dir = dir; doc.documentElement.style.fontSize = '200%'; doc.body.style.cssText = 'line-height:1.5;letter-spacing:.12em;word-spacing:.16em';
      if (!nojs && !list.matches(':popover-open')) { trigger.click(); await settle(); }
      await settle(); check(doc.documentElement.scrollWidth <= doc.documentElement.clientWidth + 1, `${nojs ? 'Inline' : 'Menu'}/${brand || 'default'}/${theme}/${dir}: enlarged-text 320px reflow.`);
      if (!nojs) { const box = list.getBoundingClientRect(); check(box.left >= -1 && box.right <= win.innerWidth + 1 && items.every(item => item.getBoundingClientRect().height >= 44), 'Positioned menu stays in viewport with full command targets.'); }
    }
  }
  for (const nojs of [false,true]) for (const route of ['dropdown-0','dropdown-1','dropdown-2']) {
    await open('../docs/previews/'+route+'.html',nojs); doc.documentElement.style.fontSize='200%'; doc.body.style.cssText='line-height:1.5;letter-spacing:.12em;word-spacing:.16em';
    for (const dir of ['ltr','rtl']) { doc.documentElement.dir=dir; await settle(); check(doc.documentElement.scrollWidth <= doc.documentElement.clientWidth+1, route + '/' + (nojs?'inline':'enhanced') + '/' + dir + ': task card reflows at 320px with enlarged text.'); }
    if (nojs) check(!menu.hasAttribute('data-ui-ready') && trigger.hidden && [...doc.querySelectorAll('a[href]')].some(link=>link.getClientRects().length), route + ': task context and real destinations remain available without scripts.');
  }
  frame.style.inlineSize = '100%'; return passed;
}
document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('#run'), frame = document.querySelector('#dropdown-frame'); if (!button || !frame) return;
  const load = async (route, nojs = false, setup = '') => {
    if (nojs) frame.setAttribute('sandbox','allow-same-origin'); else frame.removeAttribute('sandbox');
    if (setup) { const html = await (await fetch(route)).text(); await new Promise(resolve => { frame.onload = resolve; frame.srcdoc = html.replace('<head>', `<head><base href="${new URL(route,location.href).href}"><script>${setup}<\/script>`); }); }
    else await new Promise(resolve => { frame.onload = resolve; frame.removeAttribute('srcdoc'); frame.src = route; });
    return frame.contentWindow;
  };
  button.addEventListener('click', async () => {
    button.disabled = true; document.querySelector('#assertions').replaceChildren(); document.querySelector('#results').textContent = 'Running…';
    try { const passed = await runDropdownChecks(load, frame); document.querySelector('#results').textContent = `PASS: ${passed.length} Dropdown checks. ${frame.contentWindow.navigator.userAgent}`; for (const message of passed) { const item = document.createElement('li'); item.textContent = message; document.querySelector('#assertions').append(item); } }
    catch (error) { document.querySelector('#results').textContent = 'FAIL: ' + error.message; }
    finally { button.disabled = false; frame.style.inlineSize = '100%'; document.querySelector('#results-title').focus(); }
  });
  if (new URLSearchParams(location.search).has('autorun')) button.click();
});
