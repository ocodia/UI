// Real native popover state/focus checks. Escape and outside pointer input are manual.
async function runPopoverChecks(load, frame) {
  const passed = [];
  const check = (condition, message) => { assert(condition, message); passed.push(message); };
  const settle = win => new Promise(resolve => win.setTimeout(resolve, 0));
  for (const index of [0, 1]) {
    const win = await load(`../docs/previews/popover-${index}.html`), doc = win.document;
    const opener = doc.querySelector('#help-open'), panel = doc.querySelector('#project-help'), fallback = doc.querySelector('#help-inline');
    const closers = [...panel.querySelectorAll('button')], field = doc.querySelector('#project-title');
    const open = () => panel.matches(':popover-open');
    check(!opener.hidden && !panel.hidden && fallback.hidden && !open() && doc.activeElement !== opener, `Popover ${index}: initialization exposes a working native action without opening or moving focus.`);
    check(panel.popover === 'auto' && opener.popoverTargetElement === panel && closers.every(button => button.popoverTargetElement === panel && button.popoverTargetAction === 'hide'), `Popover ${index}: trigger and both close actions retain native target relationships.`);
    check(!panel.hasAttribute('role') && !panel.hasAttribute('aria-modal') && !opener.hasAttribute('aria-expanded') && !panel.querySelector('[autofocus]'), `Popover ${index}: enhancement adds no compound roles, duplicate expanded state or autofocus.`);
    check([...fallback.querySelectorAll('h3,h4,p')].map(el => el.textContent).join('\n') === [...panel.querySelectorAll('h3,h4,p')].map(el => el.textContent).join('\n'), `Popover ${index}: inline fallback retains all help content and the real guide destination.`);
    opener.click();
    check(open() && doc.activeElement === opener && !panel.matches(':modal'), `Popover ${index}: native toggle opens non-modally while focus remains on its invoker.`);
    field.focus(); field.value = 'Edited while help is open';
    check(open() && doc.activeElement === field && field.value === 'Edited while help is open', `Popover ${index}: background editing stays available without forced dismissal or focus trapping.`);
    // Restore a focused invoker before testing native close-focus restoration.
    opener.click(); opener.click();
    closers[0].focus(); closers[0].click(); await settle(win);
    check(!open() && doc.activeElement === opener && field.value === 'Edited while help is open', `Popover ${index}: explicit close restores the opener without changing the background answer.`);
    opener.click(); opener.click();
    check(!open(), `Popover ${index}: the same native invoker also toggles closed.`);
    opener.disabled = true; opener.click();
    check(!open(), `Popover ${index}: a disabled invoker does not open help.`);
    opener.disabled = false;
    // Another independent auto popover exercises browser-owned exclusivity.
    const other = doc.createElement('div'); other.popover = 'auto'; other.textContent = 'Other optional help'; doc.querySelector('main').append(other);
    opener.click(); other.showPopover();
    check(!open() && other.matches(':popover-open'), `Popover ${index}: another auto popover dismisses this one through native ownership.`);
    other.hidePopover(); other.remove();
    const marker = doc.createComment('popover trigger position'); opener.before(marker); opener.remove(); marker.replaceWith(opener);
    opener.click(); closers[1].focus(); closers[1].click(); await settle(win);
    check(!open() && doc.activeElement === opener, `Popover ${index}: the same nodes retain native behavior after opener reinsertion.`);
  }
  const win = await load('../docs/previews/popover-1.html'), doc = win.document, root = doc.documentElement;
  const opener = doc.querySelector('#help-open'), panel = doc.querySelector('#project-help');
  const closers = [...panel.querySelectorAll('button')];
  for (const [width, height] of [[1280, 600], [320, 256]]) {
    frame.style.inlineSize = `${width}px`; frame.style.blockSize = `${height}px`;
    for (const brand of ['', 'forest']) for (const theme of ['light', 'dark']) for (const dir of ['ltr', 'rtl']) for (const enlarged of [false, true]) {
      root.dataset.brand = brand; root.dataset.theme = theme; root.dir = dir;
      root.style.fontSize = enlarged ? '200%' : '';
      doc.body.style.cssText = enlarged ? 'line-height:1.5;letter-spacing:.12em;word-spacing:.16em' : '';
      let spacing = doc.querySelector('#popover-test-spacing');
      if (!spacing) { spacing = doc.createElement('style'); spacing.id = 'popover-test-spacing'; doc.head.append(spacing); }
      spacing.textContent = enlarged ? 'p { margin-block-end: 2em; }' : '';
      const state = `${width}×${height} ${brand || 'default'}/${theme}/${dir}/${enlarged ? 'enlarged' : 'normal'}`;
      opener.click();
      let box = panel.getBoundingClientRect();
      check(panel.matches(':popover-open') && doc.activeElement === opener && box.left >= 0 && box.right <= win.innerWidth + 1 && box.top >= 0 && box.bottom <= win.innerHeight + 1, `${state}: open help fits the viewport without moving focus inside.`);
      check(panel.scrollWidth <= panel.clientWidth + 1 && panel.scrollHeight > panel.clientHeight && win.getComputedStyle(panel).overflowY === 'auto', `${state}: long help reflows inside one native vertical scroll area.`);
      for (const [position, close] of closers.entries()) {
        close.focus(); await settle(win); box = panel.getBoundingClientRect(); const control = close.getBoundingClientRect();
        check(doc.activeElement === close && control.top >= box.top && control.bottom <= box.bottom, `${state}: close action ${position + 1} is focusable and scrolls into view.`);
      }
      closers[1].click(); await settle(win);
      check(!panel.matches(':popover-open') && doc.activeElement === opener, `${state}: final close action dismisses and restores the invoker.`);
    }
  }
  frame.style.removeProperty('inline-size'); frame.style.removeProperty('block-size');
  for (const [name, setup] of [
    ['missing popover support', 'delete HTMLElement.prototype.popover;'],
    ['missing show method', 'HTMLElement.prototype.showPopover = undefined;'],
    ['missing hide method', 'HTMLElement.prototype.hidePopover = undefined;'],
    ['missing declarative invoker', 'delete HTMLButtonElement.prototype.popoverTargetElement;'],
    ['unresolved target', `Object.defineProperty(HTMLButtonElement.prototype, 'popoverTargetElement', { configurable: true, get() { return null; } });`]
  ]) {
    const win = await load('../docs/previews/popover-1.html', false, setup), doc = win.document;
    check(doc.querySelector('#help-open').hidden && doc.querySelector('#project-help').hidden && !doc.querySelector('#help-inline').hidden && doc.querySelector('#help-inline a').getAttribute('href') === '../forms.html', `Popover ${name}: complete inline help survives without an unusable opener.`);
  }
  frame.style.inlineSize = '320px';
  for (const index of [0, 1]) {
    const win = await load(`../docs/previews/popover-${index}.html`, true), doc = win.document;
    for (const dir of ['ltr', 'rtl']) {
      doc.documentElement.dir = dir;
      check(doc.querySelector('#help-open').hidden && doc.querySelector('#project-help').hidden && !doc.querySelector('#help-inline').hidden && doc.querySelector('#title-hint').textContent.includes('short title') && doc.querySelector('#project-title').value === 'Coastal field guide' && doc.documentElement.scrollWidth <= doc.documentElement.clientWidth + 1, `Popover ${index} no-script ${dir}: full inline help, persistent instructions and native answers reflow at 320px.`);
    }
  }
  frame.style.removeProperty('inline-size');
  return passed;
}
