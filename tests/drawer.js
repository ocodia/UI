// Trusted fixtures: synthetic activation is partial evidence, not real keyboard/AT testing.
async function runDrawerChecks(load, frame) {
  const passed = [], check = (value, message) => { if (!value) throw new Error(`After ${passed.length}: ${message}`); passed.push(message); };
  const settle = () => new Promise(resolve => setTimeout(resolve, 70));
  let win, doc, host, dialog, trigger, initial, close;
  async function open(index = 0, nojs = false, setup = '') {
    win = await load(`../docs/previews/drawer-${index}.html`, nojs, setup); doc = win.document;
    host = doc.querySelector('ui-drawer'); dialog = host.querySelector('dialog'); trigger = host.querySelector('[data-ui-open]'); initial = dialog.querySelector('[data-ui-focus]'); close = dialog.querySelector('[data-ui-close]');
  }
  const show = async () => { trigger.click(); await settle(); };
  await open();
  check(host.hasAttribute('data-ui-ready') && !host.hasAttribute('data-ui') && !dialog.hasAttribute('data-ui') && !trigger.hidden && !dialog.open, 'Element-name setup owns one closed native dialog without redundant markers.');
  check(!win.customElements.get('ui-drawer') && !host.hasAttribute('role') && !trigger.hasAttribute('aria-expanded') && !dialog.hasAttribute('aria-modal'), 'No new registration, wrapper semantics or mirrored expanded/modal state.');
  await show();
  check(dialog.matches(':modal') && doc.activeElement === initial && dialog.scrollTop === 0, 'Opening is truly modal with heading focus at the start.');
  const outside = doc.querySelector('#after-drawer'); outside.focus(); check(dialog.contains(doc.activeElement), 'Native modal inertness blocks background focus.');
  const before = doc.activeElement; trigger.click(); win.UI.enhance(host); win.UI.enhance(doc); await settle();
  check(dialog.matches(':modal') && doc.activeElement === before, 'Repeated open/enhance does not restart the task or move focus.');
  let cancelled = false; dialog.addEventListener('cancel', event => { cancelled = !event.defaultPrevented; }, { once: true }); dialog.dispatchEvent(new win.Event('cancel', { cancelable: true })); check(cancelled, 'UI leaves native cancellation uncancelled (synthetic event only).');
  close.click(); await settle(); check(!dialog.open && dialog.returnValue === 'close' && doc.activeElement === trigger, 'Explicit close retains native result and actual-invoker focus return.');
  dialog.returnValue = 'stale'; dialog.showModal(); await settle(); check(dialog.matches(':modal') && dialog.returnValue === '' && doc.activeElement === initial, 'Direct showModal clears stale results and initializes declared task focus.');
  dialog.close('direct'); outside.focus(); await settle(); check(doc.activeElement === outside && dialog.returnValue === 'direct', 'Direct close preserves deliberate application focus movement.');
  trigger.disabled = true; await settle(); trigger.click(); check(!dialog.matches(':modal'), 'Native disabled opener cannot open a task.');
  trigger.disabled = false; win.UI.enhance(host); await show();
  dialog.querySelector('[method="dialog"] button').click(); await settle(); check(!dialog.open && dialog.returnValue === 'finished', 'Native method=dialog submitter closes once with its authored value.');
  await show(); trigger.remove(); await settle(); check(dialog.matches(':modal'), 'Removing the last invoker does not interrupt an active modal.'); close.click(); await settle(); check(doc.activeElement === doc.querySelector('#survey-task'), 'Removed invoker uses the declared surviving task heading.');
  await open(); await show(); trigger.disabled = true; await settle(); close.click(); await settle(); check(doc.activeElement === doc.querySelector('#survey-task'), 'Disabled invoker uses the declared surviving task heading.');
  await open(); dialog.removeAttribute('data-ui-return-focus'); win.UI.enhance(host); await show(); trigger.hidden = true; close.click(); await settle(); check(!host.hasAttribute('data-ui-ready') && dialog.open && !dialog.matches(':modal') && doc.activeElement === initial, 'Missing invoker/survivor restores inline content and meaningful focus.');
  await open(); await show(); const help = dialog.querySelector('[data-ui="popover"]'), helpTrigger = dialog.querySelector('[popovertarget="route-help"]'); helpTrigger.click(); await settle(); check(help.matches(':popover-open') && dialog.matches(':modal'), 'Native help remains in the modal subtree with independent ownership.');
  win.UI.destroy(host); await settle(); check(!help.matches(':popover-open') && !dialog.matches(':modal') && dialog.open && trigger.hidden && close.hidden && !host.hasAttribute('data-ui-ready'), 'Scoped destroy closes nested help and modal and restores single-copy inline actions/content.');
  win.UI.destroy(host); win.UI.enhance(host); await settle(); check(host.hasAttribute('data-ui-ready'), 'Idempotent destroy/enhance installs one fresh owner.');
  await show(); host.setAttribute('data-placement', 'block-start'); win.UI.enhance(host); await settle(); check(dialog.matches(':modal') && doc.activeElement === initial, 'Placement refresh preserves the current modal and focus.');
  const second = trigger.cloneNode(true); second.hidden = true; dialog.before(second); win.UI.enhance(host); await settle(); check(dialog.matches(':modal') && !second.hidden && doc.activeElement === initial, 'Explicit late-opener refresh preserves the active task and focus.');
  close.click(); await settle(); second.click(); await settle(); close.click(); await settle(); check(doc.activeElement === second, 'Late opener uses the same handler once and becomes the actual return destination.');
  second.remove(); win.UI.enhance(host); await show();
  for (const node of dialog.querySelectorAll('[data-ui-close],form[method="dialog"] button')) { const replacement = node.cloneNode(true); replacement.hidden = true; node.replaceWith(replacement); }
  win.UI.enhance(host); close = dialog.querySelector('[data-ui-close]'); await settle(); check(dialog.matches(':modal') && !close.hidden && doc.activeElement === initial, 'Explicit replacement of hidden close controls preserves the modal and installs their behavior.');
  close.click(); await settle(); check(!dialog.open && doc.activeElement === trigger, 'Replacement close control retains native dismissal and focus return.'); await show();
  host.remove(); await settle(); check(!host.hasAttribute('data-ui-ready') && !dialog.matches(':modal'), 'Disconnect releases old modal ownership.'); doc.querySelector('main').append(host); await settle(); check(!host.hasAttribute('data-ui-ready'), 'Reconnection does not silently reacquire ownership.'); win.UI.enhance(host); check(host.hasAttribute('data-ui-ready'), 'Explicit reconnect enhancement rediscovers current relationships.');
  win.UI.destroy(host); const otherDoc = doc.implementation.createHTMLDocument('Receiving document'); otherDoc.body.append(otherDoc.adoptNode(host)); win.UI.enhance(doc); check(!host.hasAttribute('data-ui-ready') && dialog.open, 'Cross-document adoption retains baseline rather than old-document work.');
  await open(); await show(); initial.remove(); await settle(); check(!host.hasAttribute('data-ui-ready') && dialog.open && !dialog.matches(':modal') && trigger.hidden, 'Loss of required initial structure safely releases the modal.');
  await open(); await show(); for (const node of dialog.querySelectorAll('[data-ui-close],form[method="dialog"] button')) node.disabled = true; await settle(); check(!host.hasAttribute('data-ui-ready') && dialog.open && !dialog.matches(':modal'), 'Loss of every usable close action restores readable fallback.');
  await open(); await show(); win.dispatchEvent(new win.Event('beforeprint')); check(!host.hasAttribute('data-ui-ready') && dialog.open && !dialog.matches(':modal') && trigger.hidden, 'Print preparation restores the inline task without implying completion.'); doc.querySelector('#survey-task').focus(); win.dispatchEvent(new win.Event('afterprint')); await settle(); check(host.hasAttribute('data-ui-ready') && !dialog.open && doc.activeElement === doc.querySelector('#survey-task'), 'After print resumes closed without stealing focus.');
  await open(1); await show(); dialog.scrollTop = dialog.scrollHeight; const scroll = dialog.scrollTop; trigger.click(); check(scroll > 0 && dialog.scrollTop === scroll, 'Repeated opening preserves a long task reading position.'); close.click(); await settle(); await show(); check(dialog.scrollTop === 0 && doc.activeElement === initial, 'Reopening long content restores heading focus and scroll start.');
  await open(2); await show(); const form = doc.querySelector('#drawer-form'), field = form.elements.note, summary = form.querySelector('ui-error-summary'); const submit = form.querySelector('[type="submit"]'), status = form.querySelector('[role="status"]');
  form.requestSubmit(submit); check(!summary.hidden && doc.activeElement === summary && dialog.matches(':modal'), 'ui-form invalid summary remains inside the open modal.'); summary.querySelector('a').click(); check(doc.activeElement === field, 'Error link focuses the native invalid field inside the modal.');
  field.value = 'Coastal route'; check(new win.FormData(form, submit).get('note') === 'Coastal route' && new win.FormData(form, submit).get('action') === 'preview', 'Native names/values and actual submitter serialize unchanged.');
  form.requestSubmit(submit); check(form.getAttribute('aria-busy') === 'true' && !close.disabled, 'Pending task feedback retains an explicit usable exit.'); await new Promise(resolve => setTimeout(resolve, 350)); check(status.textContent.includes('failed') && field.value === 'Coastal route', 'Recoverable application failure preserves answers.');
  form.requestSubmit(submit); await new Promise(resolve => setTimeout(resolve, 350)); check(status.textContent.includes('Preview ready: Coastal route') && dialog.matches(':modal'), 'Retry produces durable task feedback without library dismissal.');
  form.requestSubmit(submit); close.click(); await settle(); await show(); await new Promise(resolve => setTimeout(resolve, 350)); check(status.textContent === '' && field.value === 'Coastal route' && dialog.matches(':modal'), 'Close/reopen rejects stale completion and retains native answers.');
  const stopReset = event => event.preventDefault(); form.addEventListener('reset', stopReset); form.reset(); await settle(); check(field.value === 'Coastal route', 'Cancelled native reset preserves answers.'); form.removeEventListener('reset', stopReset); form.reset(); await settle(); check(field.value === '' && summary.hidden && status.textContent === '' && dialog.matches(':modal'), 'Native reset clears values/feedback without closing the task.');
  const external = doc.createElement('form'); external.id = 'external-note'; doc.querySelector('main').append(external); field.setAttribute('form', external.id); check(field.form === external && new win.FormData(external).get('note') === '', 'External native form association remains authoritative.');
  for (const setup of ['HTMLDialogElement.prototype.showModal=undefined;', 'HTMLDialogElement.prototype.close=undefined;', 'window.MutationObserver=undefined;', 'window.AbortController=undefined;', "delete HTMLElement.prototype.onbeforetoggle;"]) {
    await open(0, false, setup); check(!host.hasAttribute('data-ui-ready') && trigger.hidden && dialog.open, 'Missing capability retains useful inline content: ' + setup);
  }
  for (const setup of ["HTMLDialogElement.prototype.showModal=function(){throw new Error('unavailable')}", 'HTMLDialogElement.prototype.showModal=function(){}']) {
    await open(0, false, setup); trigger.click(); await settle(); check(!host.hasAttribute('data-ui-ready') && dialog.open && trigger.hidden && doc.activeElement === initial, 'Failed/no-op UI opening recovers inline content and focus.');
  }
  await open(); const prevent = event => { if (event.newState === 'open') event.preventDefault(); }; dialog.addEventListener('beforetoggle', prevent); await show(); check(!dialog.open && host.hasAttribute('data-ui-ready'), 'Cancelled native opening remains closed and retryable.'); dialog.removeEventListener('beforetoggle', prevent); await show(); check(dialog.matches(':modal'), 'A subsequent native opening can succeed.');
  await open(); win.UI.destroy(host); const baseline = host.outerHTML; host.remove(); const box = doc.createElement('section'); doc.querySelector('main').append(box);
  for (const mutate of [node => node.dataset.placement='', node => node.dataset.placement='left', node => node.style.writingMode='vertical-rl', node => node.querySelector('dialog').removeAttribute('aria-labelledby'), node => node.querySelector('[data-ui-focus]').removeAttribute('tabindex'), node => node.querySelector('dialog').setAttribute('popover','auto'), node => node.querySelector('dialog').dataset.ui='dialog', node => node.querySelector('dialog').id='survey-task', node => node.append(doc.createElement('ui-drawer')), node => node.querySelector('[data-ui-open]').disabled=true]) {
    box.innerHTML = baseline; const invalid = box.firstElementChild; mutate(invalid); win.UI.enhance(invalid); check(!invalid.hasAttribute('data-ui-ready') && invalid.querySelector('dialog').open, 'Malformed/conflicting configuration acquires no modal ownership.'); win.UI.destroy(invalid);
  }
  box.remove();
  await open(); win.UI.destroy(host); initial.focus(); win.UI.enhance(host); check(!host.hasAttribute('data-ui-ready') && dialog.open && doc.activeElement === initial, 'Focused baseline defers enhancement without hiding active content.'); doc.querySelector('#survey-task').focus(); win.UI.enhance(host); check(host.hasAttribute('data-ui-ready'), 'Explicit enhancement succeeds after baseline focus leaves.');
  await open();
  for (const dir of ['ltr','rtl']) for (const edge of ['inline-start','inline-end','block-start','block-end']) {
    doc.documentElement.dir = dir; host.dataset.placement = edge; win.UI.enhance(host); await show();
    const rect = dialog.getBoundingClientRect();
    const atStart = edge === 'inline-start' && dir === 'ltr' || edge === 'inline-end' && dir === 'rtl';
    check(edge.startsWith('inline') ? Math.abs(atStart ? rect.left : rect.right - win.innerWidth) < 1 && Math.abs(rect.height - win.innerHeight) < 1 : Math.abs(edge === 'block-start' ? rect.top : rect.bottom - win.innerHeight) < 1 && Math.abs(rect.width - win.innerWidth) < 1, edge + '/' + dir + ': logical edge and cross-axis extent match the viewport.');
    close.click(); await settle();
  }
  // Rendering matrix: same content, every edge and direction, both brands/modes, enlarged text/spacing.
  frame.style.inlineSize = '320px';
  for (const nojs of [false, true]) {
    await open(1, nojs);
    for (const brand of ['', 'forest']) for (const theme of ['light','dark']) for (const dir of ['ltr','rtl']) {
      doc.documentElement.dataset.brand = brand; doc.documentElement.dataset.theme = theme; doc.documentElement.dir = dir; doc.documentElement.style.fontSize = '200%'; doc.body.style.cssText = 'line-height:1.5;letter-spacing:.12em;word-spacing:.16em';
      for (const edge of ['inline-start','inline-end','block-start','block-end']) {
        host.dataset.placement = edge;
        if (!nojs) { win.UI.enhance(host); if (!dialog.matches(':modal')) await show(); }
        await settle();
        check(doc.documentElement.scrollWidth <= doc.documentElement.clientWidth + 1, `${nojs?'Inline':'Modal'}/${brand||'default'}/${theme}/${dir}/${edge}: 320px enlarged-text reflow.`);
        if (!nojs) { const rect = dialog.getBoundingClientRect(); check(rect.left >= -1 && rect.right <= win.innerWidth + 1 && rect.top >= -1 && rect.bottom <= win.innerHeight + 1 && dialog.clientWidth >= dialog.scrollWidth - 1, 'Modal surface stays bounded with no internal horizontal content loss.'); }
      }
    }
    if (nojs) check(trigger.hidden && dialog.open && !host.hasAttribute('data-ui-ready') && doc.querySelectorAll('dialog').length === 1, 'Scripts blocked retains one readable copy and no unusable opening action.');
  }
  frame.style.inlineSize = '100%'; return passed;
}
document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('#run'), frame = document.querySelector('#drawer-frame'); if (!button || !frame) return;
  const load = async (route, nojs = false, setup = '') => {
    if (nojs) frame.setAttribute('sandbox','allow-same-origin'); else frame.removeAttribute('sandbox');
    if (setup) { const html = await (await fetch(route)).text(); await new Promise(resolve => { frame.onload = resolve; frame.srcdoc = html.replace('<head>', `<head><base href="${new URL(route,location.href).href}"><script>${setup}<\/script>`); }); }
    else await new Promise(resolve => { frame.onload = resolve; frame.removeAttribute('srcdoc'); frame.src = route; });
    return frame.contentWindow;
  };
  button.addEventListener('click', async () => {
    button.disabled = true; document.querySelector('#assertions').replaceChildren(); document.querySelector('#results').textContent = 'Running…';
    try { const passed = await runDrawerChecks(load, frame); document.querySelector('#results').textContent = `PASS: ${passed.length} Drawer checks. ${frame.contentWindow.navigator.userAgent}`; for (const message of passed) { const item = document.createElement('li'); item.textContent = message; document.querySelector('#assertions').append(item); } }
    catch (error) { document.querySelector('#results').textContent = 'FAIL: ' + error.message; }
    finally { button.disabled = false; frame.style.inlineSize = '100%'; document.querySelector('#results-title').focus(); }
  });
  if (new URLSearchParams(location.search).has('autorun')) button.click();
});
