// Real DOM checks: native submission, accessibility state, and layout behavior.
async function runFormChecks(fixture) {
  const passed = [];
  const check = (condition, message) => { if (!condition) throw new Error(message); passed.push(message); };
  const settle = async () => { await Promise.resolve(); await Promise.resolve(); };
  fixture.innerHTML = `<ui-form>
    <ui-error-summary hidden><h2>There is a problem</h2><ul></ul></ui-error-summary>
    <p id="extra-description">Existing description.</p>
    <form id="check-form">
      <ui-field><label for="form-name">Project name</label><ui-hint id="form-hint">A useful name.</ui-hint><ui-error id="form-error" hidden>Error: Enter a project name</ui-error><input id="form-name" name="project" value="Initial name" required aria-describedby="extra-description"></ui-field>
      <ui-field><label for="form-email">Email</label><input id="form-email" name="email" type="email"></ui-field>
      <ui-field><label><input id="form-agree" name="agree" type="checkbox" required checked> Agree to the terms</label></ui-field>
      <fieldset><legend>Contact route</legend><label><input name="route" type="radio" value="email" required checked>Email</label><label><input name="route" type="radio" value="phone">Phone</label></fieldset>
      <button name="intent" value="save">Save</button>
      <button type="submit" formnovalidate>Save draft</button>
    </form>
  </ui-form>`;
  await settle();
  const host = fixture.querySelector('ui-form');
  const form = host.form;
  const summary = host.querySelector('ui-error-summary');
  const name = form.elements.project;
  const email = form.elements.email;
  const checkbox = form.elements.agree;
  const radios = [...form.elements.route];
  const button = form.querySelector('button');
  let submits = 0;
  let submitter;
  form.addEventListener('submit', (event) => { event.preventDefault(); submits++; submitter = event.submitter; });
  check(form.noValidate && host.form === form, 'Enhancement discovers one native form and takes over its validation UI.');
  check(name.getAttribute('aria-describedby').split(' ').includes('form-hint') && name.getAttribute('aria-describedby').includes('extra-description'), 'Field hints augment existing descriptions.');
  name.value = '';
  form.requestSubmit(button);
  check(submits === 0 && document.activeElement === summary && !summary.hidden, 'Invalid submission stops application handlers and focuses the summary.');
  check(summary.querySelector('a').textContent === 'Enter a project name' && name.getAttribute('aria-describedby').includes('form-error'), 'Authored required messages and inline error associations are used.');
  name.focus();
  host.validate({ focus: false });
  check(document.activeElement === name, 'Validation can update errors without stealing focus.');
  name.value = 'Saved name';
  form.requestSubmit(button);
  check(submits === 1 && submitter === button && summary.hidden, 'Valid submission preserves the native event and submitter.');
  name.value = '   ';
  check(!host.validate({ focus: false }), 'Whitespace-only required text is rejected.');
  form.reset();
  await settle();
  check(summary.hidden && name.value === 'Initial name' && !document.title.startsWith('Error: '), 'Native reset restores values and clears errors and the error title.');
  checkbox.checked = false;
  check(!host.validate({ focus: false }) && checkbox.getAttribute('aria-invalid') === 'true', 'Required checkboxes use their native validity.');
  checkbox.disabled = true;
  check(host.validate({ focus: false }), 'Disabled controls do not block submission.');
  checkbox.disabled = false;
  checkbox.checked = true;
  radios.forEach((radio) => { radio.checked = false; });
  host.validate({ focus: false });
  check(summary.querySelectorAll('li').length === 1 && radios[0].closest('fieldset').hasAttribute('aria-describedby'), 'A required radio group produces one error associated with its fieldset.');
  radios[0].checked = true;
  email.setCustomValidity('Use your studio email address');
  host.validate({ focus: false });
  check(summary.querySelector('a').textContent === 'Use your studio email address', 'Native custom validity messages are respected.');
  email.setCustomValidity('');
  host.validator = () => [{ control: name, message: 'Choose a different project name' }];
  check(!host.validate({ focus: false }) && summary.querySelector('a').textContent === 'Choose a different project name', 'Application validators add domain rules without replacing native controls.');
  host.validator = null;
  const field = document.createElement('ui-field');
  field.innerHTML = '<label for="added-control">Added answer</label><ui-hint>Added hint.</ui-hint><input id="added-control" required>';
  form.append(field);
  await settle();
  const added = field.querySelector('input');
  check(!host.validate({ focus: false }) && added.hasAttribute('aria-describedby'), 'Dynamically inserted fields receive hints and validation.');
  field.remove();
  await settle();
  check(summary.hidden && !name.hasAttribute('aria-invalid'), 'Removing an invalid field clears stale summary links.');
  host.showErrors([{ control: name, message: 'This name is already in use' }], { focus: false });
  check(!summary.hidden && name.value === 'Initial name', 'Server errors can be displayed without clearing answers.');
  form.addEventListener('reset', (event) => event.preventDefault(), { once: true });
  form.reset();
  await settle();
  check(!summary.hidden, 'A cancelled native reset preserves errors.');
  host.clear();
  name.value = '';
  form.requestSubmit(form.querySelector('[formnovalidate]'));
  check(submits === 2, 'An explicit formnovalidate submitter bypasses enhanced validation.');
  name.value = 'Initial name';
  let validationCalls = 0;
  host.validator = () => { validationCalls++; return []; };
  host.remove();
  check(!form.noValidate, 'Disconnect restores the original native validation setting.');
  fixture.append(host);
  await settle();
  form.requestSubmit(button);
  check(validationCalls === 1 && submits === 3, 'Reconnect installs exactly one submission handler.');
  host.validator = null;
  const external = document.createElement('input');
  external.setAttribute('form', form.id);
  external.required = true;
  fixture.append(external);
  host.validate({ focus: false });
  host.validate({ focus: false });
  check(external.getAttribute('aria-invalid') === 'true' && external.nextElementSibling?.localName === 'ui-error' && external.nextElementSibling.nextElementSibling?.localName !== 'ui-error', 'Externally associated controls reuse one generated error.');
  external.remove();
  await settle();
  host.clear();
  const second = document.createElement('ui-form');
  second.innerHTML = '<form><label>Second answer<input required></label></form>';
  fixture.append(second);
  await settle();
  name.value = '';
  host.validate({ focus: false });
  second.validate({ focus: false });
  host.clear();
  check(document.title.startsWith('Error: '), 'One form cannot clear another form’s error title.');
  second.clear();
  check(!document.title.startsWith('Error: '), 'The last cleared form restores the document title.');
  fixture.replaceChildren();
  const late = document.createElement('ui-form');
  fixture.append(late);
  late.innerHTML = '<form><label>Late answer<input required></label></form>';
  await settle();
  check(late.form?.noValidate && late.querySelector('ui-error-summary h2'), 'Late children initialize with a useful default summary.');
  const original = late.form;
  late.append(document.createElement('form'));
  await settle();
  check(late.form === null && !original.noValidate, 'Ambiguous multiple forms fall back to native validation.');
  fixture.replaceChildren();
  fixture.innerHTML = '<ui-grid style="inline-size:300px;--ui-grid-min:250px;--ui-grid-gap:24px"><div>One</div><div>Two</div></ui-grid><ui-cluster style="--ui-cluster-gap:8px"><span>One</span><span>Two</span></ui-cluster><ui-sidebar style="inline-size:900px;max-inline-size:none"><div>Sidebar</div><div>Content</div></ui-sidebar>';
  const grid = fixture.querySelector('ui-grid');
  check(grid.children[1].getBoundingClientRect().top > grid.children[0].getBoundingClientRect().top && getComputedStyle(grid).gap === '24px', 'Grid minimum and gap variables control layout.');
  check(getComputedStyle(fixture.querySelector('ui-cluster')).gap === '8px', 'Cluster gap is independently adjustable.');
  const sidebar = fixture.querySelector('ui-sidebar');
  check(Math.abs(sidebar.children[0].getBoundingClientRect().top - sidebar.children[1].getBoundingClientRect().top) < 1, 'A roomy sidebar stays alongside its content.');
  sidebar.style.inlineSize = '300px';
  check(sidebar.children[1].getBoundingClientRect().top > sidebar.children[0].getBoundingClientRect().top && sidebar.scrollWidth <= 301, 'A narrow sidebar stacks without hiding overflow.');
  fixture.innerHTML = '<ui-grid style="--ui-grid-gap:36px"><ui-grid><div>Nested</div></ui-grid></ui-grid><div class="grid"><div>Default</div></div><ui-stack style="--ui-stack-gap:28px"><p>One</p><p>Two</p></ui-stack>';
  const outer = fixture.querySelector('ui-grid');
  check(getComputedStyle(outer).gap === '36px' && getComputedStyle(outer.querySelector('ui-grid')).gap === getComputedStyle(fixture.querySelector('.grid')).gap, 'A local grid gap does not leak into nested grids; class alternatives share defaults.');
  check(getComputedStyle(fixture.querySelector('ui-stack > :last-child')).marginBlockStart === '28px', 'Stack rhythm has its own local variable.');
  fixture.replaceChildren();
  return passed;
}
