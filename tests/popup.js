// Rendered geometry/lifecycle assertions. Native Escape and outside input are manual.
async function runPopupChecks(load, frame) {
  const passed = [];
  const check = (condition, message) => { assert(condition, message); passed.push(message); };
  const settle = win => new Promise(resolve => win.setTimeout(resolve, 80));
  let win = await load('../docs/previews/popup-0.html'), doc = win.document;
  let opener = doc.querySelector('#reference-open'), panel = doc.querySelector('#reference-help');
  check(!opener.hidden && !panel.hidden && doc.querySelector('#reference-inline').hidden && !panel.matches(':popover-open') && doc.activeElement !== opener, 'Popup consumer initializes without opening or moving focus.');
  check(!panel.hasAttribute('role') && !opener.hasAttribute('aria-expanded') && !panel.hasAttribute('aria-modal'), 'Geometry adds no compound semantics or duplicate native state.');
  opener.click(); await settle(win);
  check(panel.matches(':popover-open') && doc.activeElement === opener && panel.style.position === 'fixed', 'Native invoker opens positioned non-modal help without moving focus inside.');
  const field = doc.querySelector('#project-reference'); field.focus(); field.value = 'COAST-02';
  check(panel.matches(':popover-open') && doc.activeElement === field, 'Anchored help permits native background editing.');
  panel.querySelector('button').focus(); panel.querySelector('button').click(); await settle(win);
  check(!panel.matches(':popover-open') && doc.activeElement === opener && field.value === 'COAST-02' && !panel.style.position, 'Native close restores its invoker, preserves answers and releases placement styles.');
  opener.click(); await settle(win); opener.remove(); await settle(win);
  check(!doc.querySelector('#reference-inline').hidden && panel.hidden && !panel.matches(':popover-open'), 'Removing the consumer anchor closes help and restores complete inline content.');

  // Independent nodes exercise the adapter without the consumer's fallback policy.
  doc.querySelector('main').innerHTML = '<h1>Popup geometry fixture</h1><button id="anchor" type="button" popovertarget="surface">Reference help</button><div id="surface" popover="auto"><button type="button" popovertarget="surface" popovertargetaction="hide">Close help</button><h2>Reference notes</h2><p>Keep a readable reference with your original observations.</p><a href="#anchor">Review the reference</a><button type="button" popovertarget="surface" popovertargetaction="hide">Close help</button></div><form id="values"><label>Reference <input name="reference" value="COAST-01" required></label><button type="submit" name="action" value="save">Save locally</button><button type="reset">Reset</button></form>';
  const anchor = doc.querySelector('#anchor'), surface = doc.querySelector('#surface'), root = doc.documentElement;
  anchor.style.cssText = 'position:fixed;top:20px;left:20px;max-inline-size:45%;margin:0';
  surface.style.cssText = 'inline-size:22rem;max-inline-size:24rem;max-block-size:30rem';
  const options = { anchor, surface };
  const thrown = fn => { try { fn(); return false; } catch (error) { return error instanceof win.TypeError; } };
  for (const change of [{ gap: -1 }, { gap: NaN }, { padding: Infinity }, { padding: '8' }, { placement: 'left' }, { extra: true }, { onUnavailable: 1 }, { surface: anchor }, { anchor: doc.createElement('button') }]) {
    check(thrown(() => win.UIPopup.attach({ ...options, ...change })), `Popup rejects invalid configuration ${Object.keys(change).join(',')} before mutation.`);
  }
  anchor.style.writingMode = 'vertical-rl';
  check(thrown(() => win.UIPopup.attach(options)), 'Unsupported initial writing mode fails before attachment.');
  anchor.style.writingMode = '';
  let failures = [];
  let handle = win.UIPopup.attach({ ...options, onUnavailable: reason => failures.push(reason) });
  check(thrown(() => win.UIPopup.attach(options)), 'One surface cannot acquire a second positioner.');
  const initialStyle = surface.getAttribute('style');
  check(!handle.update() && surface.getAttribute('style') === initialStyle, 'Closed updates remain dormant and preserve authored styles.');
  anchor.focus(); anchor.click(); await settle(win);
  let a = anchor.getBoundingClientRect(), box = surface.getBoundingClientRect();
  check(handle.update() && Math.abs(box.top - a.bottom - 8) < 2 && Math.abs(box.left - a.left) < 2, 'Default placement aligns below the visible anchor with an 8px gap.');
  const beforeFocus = doc.activeElement;
  root.dir = 'rtl'; await settle(win); a = anchor.getBoundingClientRect(); box = surface.getBoundingClientRect();
  check(Math.abs(box.right - Math.max(a.right, box.width + 8)) < 2 && doc.activeElement === beforeFocus, 'Direction changes realign inline-start without changing focus.');
  root.dir = 'ltr';
  anchor.style.top = `${win.innerHeight - anchor.offsetHeight - 20}px`; await settle(win);
  a = anchor.getBoundingClientRect(); box = surface.getBoundingClientRect();
  check(Math.abs(a.top - box.bottom - 8) < 2, 'A bottom-edge anchor flips above when the requested side cannot fit.');
  surface.querySelector('p').textContent = 'Long translated observations and follow-up context. '.repeat(80); await settle(win);
  box = surface.getBoundingClientRect();
  check(box.top >= 7 && box.bottom <= win.innerHeight - 7 && surface.scrollHeight > surface.clientHeight, 'Long content retains bounded native scrolling.');
  [...surface.querySelectorAll('button')].at(-1).focus(); await settle(win);
  const close = [...surface.querySelectorAll('button')].at(-1).getBoundingClientRect(); box = surface.getBoundingClientRect();
  check(close.top >= box.top && close.bottom <= box.bottom, 'Native focus scrolling exposes the final close action.');
  root.style.fontSize = '200%'; await settle(win);
  const retained = [...surface.querySelectorAll('button')].at(-1), retainedRect = retained.getBoundingClientRect(), retainedBox = surface.getBoundingClientRect();
  check(handle.update() && doc.activeElement === retained && retainedRect.top >= retainedBox.top && retainedRect.bottom <= retainedBox.bottom, 'Enlarging text around an already-focused close control keeps it visible without changing focus.');
  root.style.fontSize = ''; await settle(win);
  surface.hidePopover(); await settle(win);
  check(surface.getAttribute('style') === initialStyle, 'Closing restores exact pre-attachment inline declarations.');

  for (const [width, height] of [[1280, 600], [320, 256]]) {
    frame.style.inlineSize = `${width}px`; frame.style.blockSize = `${height}px`;
    for (const brand of ['', 'forest']) for (const theme of ['light', 'dark']) for (const dir of ['ltr', 'rtl']) for (const enlarged of [false, true]) {
      root.dataset.brand = brand; root.dataset.theme = theme; root.dir = dir;
      root.style.fontSize = enlarged ? '200%' : '';
      doc.body.style.cssText = enlarged ? 'line-height:1.5;letter-spacing:.12em;word-spacing:.16em' : '';
      anchor.style.cssText = 'position:fixed;top:8px;left:8px;margin:0;max-inline-size:45%';
      anchor.click(); await settle(win);
      box = surface.getBoundingClientRect();
      const state = `${width}×${height}/${brand || 'default'}/${theme}/${dir}/${enlarged ? 'enlarged' : 'normal'}`;
      const placementFocus = doc.activeElement, placed = handle.update();
      if (placed) {
        box = surface.getBoundingClientRect();
        check(surface.matches(':popover-open') && box.left >= 7 && box.top >= 7 && box.right <= win.innerWidth - 7 && box.bottom <= win.innerHeight - 7 && surface.scrollWidth <= surface.clientWidth + 1, `${state}: anchored long help fits its viewport without horizontal overflow.`);
        for (const button of surface.querySelectorAll('button')) { button.focus(); await settle(win); }
        const end = [...surface.querySelectorAll('button')].at(-1), rect = end.getBoundingClientRect(); box = surface.getBoundingClientRect();
        check(rect.top >= box.top && rect.bottom <= box.bottom && doc.activeElement === end, `${state}: both close controls remain reachable through native focus scrolling.`);
        end.click(); await settle(win);
      } else {
        check(failures.at(-1) === 'unsupported-context' && !surface.style.position, `${state}: insufficient usable space reports failure and releases geometry.`);
        check(surface.matches(':popover-open') && doc.activeElement === placementFocus, `${state}: the adapter leaves visibility and focus policy with its consumer.`);
        surface.hidePopover(); await settle(win);
      }
    }
  }
  frame.style.inlineSize = '100%'; frame.style.blockSize = '600px'; root.style.fontSize = ''; doc.body.style.cssText = ''; root.dir = 'ltr';
  surface.querySelector('p').textContent = 'Short context';
  anchor.style.cssText = 'position:fixed;top:100px;left:40px;margin:0';
  handle.destroy(); handle = win.UIPopup.attach({ ...options, placement: 'block-start-start' });
  anchor.click(); await settle(win); a = anchor.getBoundingClientRect(); box = surface.getBoundingClientRect();
  check(Math.abs(a.top - box.bottom - 8) < 2 || Math.abs(box.top - a.bottom - 8) < 2, 'Explicit block-start placement fits or flips using the documented gap.');
  surface.style.left = '51px'; surface.style.color = 'rebeccapurple'; handle.destroy(); handle.destroy();
  check(surface.style.left === '51px' && surface.style.color === 'rebeccapurple' && !surface.style.position && surface.matches(':popover-open') && !handle.update(), 'Idempotent destroy preserves later author writes and native visibility, and stops future updates.');
  surface.hidePopover(); surface.style.left = ''; surface.style.color = '';

  // Partially clipped anchor, then scroll out of its named native region.
  const region = doc.createElement('div'); region.style.cssText = 'position:fixed;inset:20px auto auto 20px;inline-size:240px;block-size:180px;overflow:auto';
  const spacer = doc.createElement('div'); spacer.style.cssText = 'block-size:500px;padding-block-start:140px'; region.append(spacer); doc.querySelector('main').append(region); spacer.append(anchor);
  anchor.style.cssText = 'margin:0'; failures = [];
  handle = win.UIPopup.attach({ ...options, onUnavailable: reason => failures.push(reason) });
  anchor.click(); await settle(win); box = surface.getBoundingClientRect();
  check(handle.update() && box.top >= 8, 'A partially clipped anchor uses the surviving visible intersection.');
  region.scrollTop = 400; await settle(win);
  check(failures.at(-1) === 'anchor-unavailable' && surface.matches(':popover-open') && !surface.style.position, 'Clipping loss reports unavailable and releases geometry without owning dismissal.');
  handle.update();
  check(failures.length === 1, 'Repeated unavailable updates notify only once per failure transition.');
  region.scrollTop = 0; await settle(win); handle.update(); await settle(win);
  check(surface.style.position === 'fixed', 'A still-attached adapter can explicitly recover after an unavailable anchor becomes visible.');
  anchor.popoverTargetElement = null; await settle(win);
  check(failures.at(-1) === 'anchor-unavailable', 'Retargeting the native invoker cannot keep stale geometry active.');
  handle.destroy(); surface.hidePopover(); anchor.setAttribute('popovertarget', 'surface');
  region.before(anchor); region.remove(); anchor.style.cssText = 'position:fixed;top:20px;left:20px';

  for (const [property, value, reason] of [['hidden', true, 'anchor-unavailable'], ['remove', true, 'anchor-unavailable'], ['transform', 'translateX(10px)', 'unsupported-context']]) {
    failures = []; handle = win.UIPopup.attach({ ...options, onUnavailable: value => failures.push(value) });
    anchor.click(); await settle(win);
    if (property === 'hidden') anchor.hidden = value;
    else if (property === 'remove') anchor.remove();
    else anchor.style.transform = value;
    await settle(win);
    check(failures.at(-1) === reason && !surface.style.position, `Anchor ${property} stops placement and reports ${reason}.`);
    handle.destroy(); surface.hidePopover(); anchor.hidden = false; anchor.style.transform = ''; doc.querySelector('main').append(anchor);
  }
  // A queued update must not survive teardown. Track actual callbacks/resources.
  let requested = 0, activeObservers = 0;
  const request = win.requestAnimationFrame, Observer = win.ResizeObserver;
  win.requestAnimationFrame = callback => { requested++; return request.call(win, callback); };
  win.ResizeObserver = class extends Observer { constructor(callback) { super(callback); activeObservers++; this.active = true; } disconnect() { if (this.active) { activeObservers--; this.active = false; } super.disconnect(); } };
  handle = win.UIPopup.attach(options); await settle(win);
  check(requested === 0 && activeObservers === 0, 'Closed attachments have no resize observers or scheduled frames.');
  anchor.click(); await settle(win);
  check(activeObservers === 1, 'Open geometry acquires its scoped size observation.');
  surface.hidePopover(); await settle(win); const closedFrames = requested; await settle(win);
  check(activeObservers === 0 && requested === closedFrames, 'Closed geometry releases observers and reaches idle without a frame loop.');
  anchor.click(); await settle(win); win.dispatchEvent(new win.Event('resize')); handle.destroy(); const releasedStyle = surface.getAttribute('style'); await settle(win);
  check(activeObservers === 0 && surface.getAttribute('style') === releasedStyle, 'Destroy cancels queued resize work and prevents stale style writes.');
  win.requestAnimationFrame = request; win.ResizeObserver = Observer; surface.hidePopover();

  const form = doc.querySelector('#values'), input = form.elements.reference; let nativeEntries;
  form.addEventListener('submit', event => { event.preventDefault(); nativeEntries = [...new win.FormData(form, event.submitter)]; });
  handle = win.UIPopup.attach(options); anchor.click(); await settle(win); input.value = 'COAST-03'; form.requestSubmit(form.querySelector('[type="submit"]'));
  check(JSON.stringify(nativeEntries) === JSON.stringify([['reference', 'COAST-03'], ['action', 'save']]), 'Positioning preserves native values, submitters and serialization.');
  form.reset(); check(input.value === 'COAST-01', 'Native reset retains value ownership while help is open.'); handle.destroy(); surface.hidePopover();

  // Native cancellation and edge alignment use real default actions, not fake toggle events.
  const cancelOpen = event => { if (event.newState === 'open') event.preventDefault(); };
  handle = win.UIPopup.attach(options); surface.addEventListener('beforetoggle', cancelOpen);
  anchor.click(); await settle(win);
  check(!surface.matches(':popover-open') && !surface.style.position && !handle.update(), 'Cancelled native opening leaves geometry dormant.');
  surface.removeEventListener('beforetoggle', cancelOpen); handle.destroy();
  for (const dir of ['ltr', 'rtl']) for (const vertical of ['top', 'bottom']) for (const horizontal of ['left', 'right']) {
    root.dir = dir;
    anchor.style.cssText = `position:fixed;${vertical}:8px;${horizontal}:8px;margin:0`;
    handle = win.UIPopup.attach(options); anchor.click(); await settle(win);
    const r = surface.getBoundingClientRect();
    check(handle.update() && r.left >= 7 && r.right <= win.innerWidth - 7 && r.top >= 7 && r.bottom <= win.innerHeight - 7, `${dir}/${vertical}/${horizontal}: corner collision preserves viewport padding.`);
    handle.destroy(); surface.hidePopover();
  }
  root.dir = 'ltr'; anchor.style.cssText = 'margin:0';
  const preceding = doc.createElement('div'); preceding.style.blockSize = '20px'; anchor.before(preceding);
  handle = win.UIPopup.attach(options); anchor.click(); await settle(win); const originalTop = surface.getBoundingClientRect().top;
  preceding.style.blockSize = '60px'; await settle(win);
  check(Math.abs(surface.getBoundingClientRect().top - originalTop - 40) < 2, 'Observed sibling expansion tracks anchor movement without a resize of the anchor.');
  handle.destroy(); surface.hidePopover(); preceding.remove();
  failures = []; handle = win.UIPopup.attach({ ...options, onUnavailable: reason => failures.push(reason) });
  const destination = doc.implementation.createHTMLDocument('Other document'); destination.body.append(surface); await settle(win);
  check(failures.at(-1) === 'surface-unavailable' && thrown(() => win.UIPopup.attach(options)), 'Cross-document adoption releases old geometry and rejects a mismatched new attachment.');
  handle.destroy(); doc.querySelector('main').append(surface);
  handle = win.UIPopup.attach(options); anchor.click(); await settle(win);
  check(handle.update(), 'Reinserted nodes can be explicitly attached without stale ownership.'); handle.destroy(); surface.hidePopover();

  const dialog = doc.createElement('dialog'); dialog.innerHTML = '<h2 tabindex="-1" autofocus>Reference review</h2><form method="dialog"><button>Close review</button></form>';
  doc.querySelector('main').append(dialog); dialog.append(anchor, surface); dialog.showModal();
  handle = win.UIPopup.attach(options); anchor.focus(); anchor.click(); await settle(win);
  check(dialog.matches(':modal') && surface.matches(':popover-open') && handle.update(), 'Anchored help inside a native modal retains independent native popover state.');
  input.focus();
  check(dialog.contains(doc.activeElement), 'Positioning does not weaken native modal background inertness.');
  surface.querySelector('button').focus(); surface.querySelector('button').click(); await settle(win);
  check(dialog.matches(':modal') && !surface.matches(':popover-open') && doc.activeElement === anchor, 'Closing nested help preserves the parent modal and restores its own invoker.');
  handle.destroy(); dialog.close(); dialog.before(anchor, surface); dialog.remove();
  anchor.style.cssText = 'position:fixed;top:20px;left:20px;margin:0';
  const nestedAnchor = doc.createElement('button'); nestedAnchor.type = 'button'; nestedAnchor.textContent = 'More reference help'; nestedAnchor.setAttribute('popovertarget', 'nested-help');
  const nestedSurface = doc.createElement('div'); nestedSurface.id = 'nested-help'; nestedSurface.popover = 'auto'; nestedSurface.textContent = 'Keep the original notes.';
  surface.append(nestedAnchor, nestedSurface);
  handle = win.UIPopup.attach(options); const nested = win.UIPopup.attach({ anchor: nestedAnchor, surface: nestedSurface });
  anchor.click(); await settle(win); nestedAnchor.click(); await settle(win);
  check(surface.matches(':popover-open') && nestedSurface.matches(':popover-open') && nested.update(), 'Nested auto popovers each keep their own native target and geometry ownership.');
  nestedSurface.hidePopover(); await settle(win);
  check(surface.matches(':popover-open') && handle.update(), 'Child dismissal does not close or detach its parent positioner.');
  nested.destroy(); handle.destroy(); surface.hidePopover(); nestedAnchor.remove(); nestedSurface.remove();

  // The consumer must actually choose inline recovery when a short enlarged viewport cannot fit.
  frame.style.inlineSize = '320px'; frame.style.blockSize = '256px';
  win = await load('../docs/previews/popup-0.html'); doc = win.document;
  doc.documentElement.style.fontSize = '200%';
  opener = doc.querySelector('#reference-open'); panel = doc.querySelector('#reference-help'); opener.click(); await settle(win);
  check(panel.matches(':popover-open') || !doc.querySelector('#reference-inline').hidden, 'Short enlarged consumer has positioned help or a complete readable inline fallback.');
  opener.style.transform = 'translateX(1px)'; await settle(win);
  check(opener.hidden && panel.hidden && !doc.querySelector('#reference-inline').hidden, 'Unsupported consumer geometry restores full inline help and hides the unusable action.');
  frame.style.inlineSize = '100%'; frame.style.blockSize = '600px';

  for (const setup of ['window.ResizeObserver = undefined;', 'window.MutationObserver = undefined;', 'HTMLElement.prototype.showPopover = undefined;', 'Object.defineProperty(HTMLButtonElement.prototype, "popoverTargetElement", { configurable: true, get() { return null; } });']) {
    win = await load('../docs/previews/popup-0.html', false, setup); doc = win.document;
    check(doc.querySelector('#reference-open').hidden && !doc.querySelector('#reference-inline').hidden && doc.querySelector('#reference-help').hidden, 'Missing positioning/native capabilities preserve complete inline help.');
  }
  frame.style.inlineSize = '320px';
  win = await load('../docs/previews/popup-0.html', true); doc = win.document;
  for (const dir of ['ltr', 'rtl']) {
    doc.documentElement.dir = dir;
    check(doc.querySelector('#reference-open').hidden && !doc.querySelector('#reference-inline').hidden && doc.querySelector('#project-reference').value === 'COAST-01' && doc.documentElement.scrollWidth <= doc.documentElement.clientWidth + 1, `No-script ${dir} retains full inline help, native answers and 320px reflow.`);
  }
  frame.style.removeProperty('inline-size');
  return passed;
}
