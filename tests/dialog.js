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
