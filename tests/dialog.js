// Native dialog recipe checks. Real Escape/Tab/backdrop input remains a manual check.
async function runDialogChecks(win) {
  const passed = [];
  const check = (condition, message) => { assert(condition, message); passed.push(message); };
  const doc = win.document;
  const dialog = doc.querySelector('#recipe-dialog');
  const opener = doc.querySelector('#recipe-open-dialog');
  const fallback = doc.querySelector('#recipe-dialog-fallback');
  const close = dialog.querySelector('button');
  const closed = () => new Promise((resolve) => dialog.addEventListener('close', resolve, { once: true }));
  check(!opener.hidden && fallback.hidden && !dialog.open && !dialog.hidden, 'Dialog enhancement exposes the working opener and keeps inline fallback out of the reading order.');
  check(doc.activeElement !== opener && !dialog.contains(doc.activeElement), 'Installing the dialog recipe does not move focus.');
  check(doc.getElementById(dialog.getAttribute('aria-labelledby')) === dialog.querySelector('h2') && !dialog.hasAttribute('aria-describedby'), 'Dialog uses its visible title and preserves structured content without a blanket description.');
  opener.click();
  check(dialog.open && dialog.matches(':modal') && doc.activeElement === close, 'showModal opens a real modal with initial focus on its explicit close action.');
  doc.querySelector('#recipe-name').focus();
  check(dialog.contains(doc.activeElement), 'Native modal inertness prevents background field focus.');
  opener.click();
  check(dialog.open && doc.activeElement === close, 'Repeated opener activation does not reopen or disturb the modal.');
  // Dispatching cancel tests event policy only; it does not simulate native Escape.
  check(dialog.dispatchEvent(new win.Event('cancel', { cancelable: true })), 'Recipe leaves the native cancel event uncancelled for Escape dismissal.');
  let done = closed();
  close.click();
  await done;
  check(!dialog.open && dialog.returnValue === 'close' && doc.activeElement === opener, 'method=dialog closes without navigation, returns the button value and restores trigger focus.');
  opener.click();
  check(dialog.returnValue === '' && doc.activeElement === close, 'Reopening clears the previous result and restores initial focus.');
  done = closed();
  dialog.close();
  await done;
  check(doc.activeElement === opener && dialog.returnValue === '', 'Programmatic close returns focus without reusing an earlier result.');
  for (const state of ['disabled', 'hidden', 'removed']) {
    opener.click();
    if (state === 'removed') opener.remove();
    else opener[state] = true;
    done = closed();
    dialog.close();
    await done;
    check(doc.activeElement === doc.querySelector('#modal-title'), `Closing with a ${state} trigger focuses the surviving section heading.`);
    if (state === 'removed') doc.querySelector('#modal').insertBefore(opener, fallback);
    else opener[state] = false;
  }
  opener.click();
  done = closed();
  close.click();
  await done;
  check(doc.activeElement === opener, 'The same nodes still open and close after trigger reinsertion.');
  return passed;
}

async function runDialogFallbackChecks(load) {
  const passed = [];
  for (const [name, setup] of [
    ['missing showModal', 'HTMLDialogElement.prototype.showModal = undefined;'],
    ['missing close', 'HTMLDialogElement.prototype.close = undefined;'],
    ['opening failure', 'HTMLDialogElement.prototype.showModal = function () { throw new Error("Unavailable"); };']
  ]) {
    const win = await load('../examples/patterns.html', false, setup);
    const doc = win.document;
    const opener = doc.querySelector('#recipe-open-dialog');
    const fallback = doc.querySelector('#recipe-dialog-fallback');
    if (name === 'opening failure') opener.click();
    assert(opener.hidden && !fallback.hidden && doc.querySelector('#recipe-dialog').hidden && !doc.querySelector('#recipe-dialog').open, `${name} must retain inline content and remove the unusable opener`);
    passed.push(`Dialog ${name} leaves readable inline information and no unusable modal action.`);
    if (name === 'opening failure') {
      assert(doc.activeElement === fallback.querySelector('h3'), 'Opening failure must focus the revealed information');
      passed.push('Opening failure focuses the revealed information heading.');
    }
  }
  return passed;
}

// Long information task. Geometry checks use real native modality and scrolling.
async function runLongDialogChecks(load, frame) {
  const passed = [];
  const check = (condition, message) => { assert(condition, message); passed.push(message); };
  let win = await load('../docs/previews/dialog-1.html');
  const doc = win.document, root = doc.documentElement;
  const dialog = doc.querySelector('#briefing-dialog'), opener = doc.querySelector('#briefing-open');
  const title = doc.querySelector('#briefing-title'), fallback = doc.querySelector('#briefing-fallback');
  const buttons = [...dialog.querySelectorAll('button')];
  const closed = () => new Promise(resolve => dialog.addEventListener('close', resolve, { once: true }));
  const settle = () => new Promise(resolve => win.setTimeout(resolve, 0));
  check(!opener.hidden && fallback.hidden && !dialog.hidden && !dialog.open && !dialog.contains(doc.activeElement), 'Long dialog installs without opening or moving focus.');
  check(dialog.getAttribute('aria-labelledby') === title.id && !dialog.hasAttribute('aria-describedby') && title.tabIndex === -1 && title.autofocus, 'Long dialog names its structured content and selects the heading for native initial focus.');
  check([...fallback.querySelectorAll('h3, p')].map(el => el.textContent).join('\n') === [...dialog.querySelectorAll(':scope > section :is(h3, p)')].map(el => el.textContent).join('\n'), 'No-script inline briefing contains the same section headings and paragraphs as the modal.');
  check(buttons.length === 2 && buttons.every(button => button.form.method === 'dialog' && button.value === 'close'), 'Close actions at both ends use native dialog forms without network submission.');
  for (const [width, height] of [[1280, 600], [320, 256]]) {
    frame.style.inlineSize = `${width}px`; frame.style.blockSize = `${height}px`;
    for (const brand of ['', 'forest']) for (const theme of ['light', 'dark']) for (const dir of ['ltr', 'rtl']) for (const enlarged of [false, true]) {
      root.dataset.brand = brand; root.dataset.theme = theme; root.dir = dir;
      root.style.fontSize = enlarged ? '200%' : '';
      doc.body.style.cssText = enlarged ? 'line-height:1.5;letter-spacing:.12em;word-spacing:.16em' : '';
      let spacing = doc.querySelector('#dialog-test-spacing');
      if (!spacing) { spacing = doc.createElement('style'); spacing.id = 'dialog-test-spacing'; doc.head.append(spacing); }
      spacing.textContent = enlarged ? 'p { margin-block-end: 2em; }' : '';
      const state = `${width}×${height} ${brand || 'default'}/${theme}/${dir}/${enlarged ? 'enlarged' : 'normal'}`;
      opener.click();
      const box = dialog.getBoundingClientRect(), headingBox = title.getBoundingClientRect();
      check(dialog.matches(':modal') && doc.activeElement === title && headingBox.top >= box.top && headingBox.top < box.bottom, `${state}: heading receives initial focus near the visible start.`);
      check(box.left >= 0 && box.right <= win.innerWidth + 1 && box.top >= 0 && box.bottom <= win.innerHeight + 1 && dialog.scrollWidth <= dialog.clientWidth + 1, `${state}: modal stays within its viewport without horizontal content overflow.`);
      check(dialog.scrollHeight > dialog.clientHeight && win.getComputedStyle(dialog).overflowY === 'auto', `${state}: long content has a native vertical scroll viewport.`);
      opener.focus();
      check(dialog.contains(doc.activeElement), `${state}: background opener cannot receive focus while modal.`);
      buttons[0].focus(); await settle();
      let closeBox = buttons[0].getBoundingClientRect();
      check(closeBox.top >= box.top && closeBox.bottom <= box.bottom, `${state}: first close action can be focused and scrolled into view.`);
      buttons[1].focus(); await settle(); closeBox = buttons[1].getBoundingClientRect();
      check(dialog.scrollTop > 0 && closeBox.top >= box.top && closeBox.bottom <= box.bottom, `${state}: final close action is reachable through native focus scrolling.`);
      let done = closed(); buttons[1].click(); await done;
      check(!dialog.open && dialog.returnValue === 'close' && doc.activeElement === opener, `${state}: final action closes and restores opener focus.`);
      opener.click();
      check(doc.activeElement === title && dialog.scrollTop < 2 && dialog.returnValue === '', `${state}: reopening resets scroll, heading focus and the old result.`);
      done = closed(); buttons[0].click(); await done;
      check(!dialog.open && doc.activeElement === opener, `${state}: first close action also restores opener focus.`);
    }
  }
  root.style.removeProperty('font-size'); doc.body.removeAttribute('style'); doc.querySelector('#dialog-test-spacing').remove();
  for (const state of ['disabled', 'hidden', 'removed']) {
    opener.click();
    if (state === 'removed') opener.remove(); else opener[state] = true;
    const done = closed(); dialog.close(); await done;
    check(doc.activeElement === doc.querySelector('#briefing-task-title'), `Long dialog with ${state} opener returns focus to the surviving task heading.`);
    if (state === 'removed') fallback.before(opener); else opener[state] = false;
  }
  frame.style.removeProperty('inline-size'); frame.style.removeProperty('block-size');
  for (const [name, setup] of [
    ['missing showModal', 'HTMLDialogElement.prototype.showModal = undefined;'],
    ['missing close', 'HTMLDialogElement.prototype.close = undefined;'],
    ['thrown opening', 'HTMLDialogElement.prototype.showModal = function () { throw new Error("Unavailable"); };'],
    ['opening without modal state', 'HTMLDialogElement.prototype.showModal = function () {};']
  ]) {
    win = await load('../docs/previews/dialog-1.html', false, setup);
    const doc = win.document, opener = doc.querySelector('#briefing-open'), fallback = doc.querySelector('#briefing-fallback');
    if (!name.startsWith('missing')) opener.click();
    check(opener.hidden && !fallback.hidden && doc.querySelector('#briefing-dialog').hidden && !doc.querySelector('#briefing-dialog').open, `Long dialog ${name} retains inline content and hides its unusable action.`);
    if (!name.startsWith('missing')) check(doc.activeElement === fallback.querySelector('h2'), `Long dialog ${name} focuses the inline heading.`);
  }
  frame.style.inlineSize = '320px';
  win = await load('../docs/previews/dialog-1.html', true);
  for (const dir of ['ltr', 'rtl']) {
    const doc = win.document; doc.documentElement.dir = dir;
    check(!doc.querySelector('#briefing-fallback').hidden && doc.querySelectorAll('#briefing-fallback section').length === 6 && doc.querySelector('#briefing-open').hidden && doc.querySelector('#briefing-dialog').hidden && doc.documentElement.scrollWidth <= doc.documentElement.clientWidth + 1, `Long dialog no-script ${dir} retains the full inline briefing at 320px.`);
  }
  frame.style.removeProperty('inline-size');
  return passed;
}
