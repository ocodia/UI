// Native behavior and rendered presentation must agree across variants and sizes.
async function runControlChecks(win) {
  const doc = win.document;
  const root = doc.documentElement;
  const savedStyle = root.style.cssText;
  const controls = ['brand', 'mode', 'focus-palette'].map((id) => doc.getElementById(id));
  const saved = controls.map((control) => control.value);
  const passed = [];
  const check = (condition, message) => { if (!condition) throw new Error(message); passed.push(message); };
  const choose = (control, value) => { control.value = value; control.dispatchEvent(new win.Event('change', { bubbles: true })); };
  const css = (element) => win.getComputedStyle(element);
  const fixture = doc.createElement('div');
  const variants = ['primary', 'secondary', 'quiet', 'danger'];
  fixture.innerHTML = `<form id="control-test-form"><label>Answer<input name="answer" value="Initial answer" required></label>
    ${variants.map((variant) => `<button type="submit" data-variant="${variant}" name="intent" value="${variant}">${variant} action</button><button type="button" data-variant="${variant}" disabled>Unavailable ${variant}</button>`).join('')}
    <input type="submit" name="intent" value="Input action" data-variant="secondary">
    <button type="reset" data-variant="quiet">Reset answers</button></form>
    <div id="control-size-fixture">${['small', 'default', 'large'].map((size) => `<div data-profile="${size}"><button type="button" data-size="${size}">Preview action</button><label>Title ${size}<input data-size="${size}" value="Answer"></label><label>Stage ${size}<select data-size="${size}"><option>Planning</option><option>In progress</option></select></label><label>Notes ${size}<textarea data-size="${size}" rows="2"></textarea></label></div>`).join('')}</div>
    <button id="control-default" type="button">Default action</button><button id="control-unknown" type="button" data-variant="unknown" data-size="unknown">Default action</button><span></span>`;
  doc.querySelector('main').append(fixture);
  const probe = fixture.querySelector('span');
  const resolve = (value) => { probe.style.color = value; return css(probe).color; };
  try {
    for (const brand of ['default', 'forest']) {
      choose(controls[0], brand);
      for (const mode of ['light', 'dark']) {
        choose(controls[1], mode);
        const canvas = resolve('var(--ui-canvas)');
        const surface = resolve('var(--ui-surface)');
        for (const variant of variants) {
          const button = fixture.querySelector(`button[data-variant="${variant}"]:enabled`);
          const computed = css(button);
          const bg = computed.backgroundColor === 'rgba(0, 0, 0, 0)' ? canvas : computed.backgroundColor;
          const hover = resolve(computed.getPropertyValue('--_ui-button-hover'));
          check(colorContrast(computed.color, bg) >= 4.5 && colorContrast(computed.color, hover) >= 4.5 && (variant !== 'quiet' || colorContrast(computed.color, surface) >= 4.5), `${brand}/${mode}: ${variant} normal/hover token pairs retain 4.5:1 text contrast.`);
          const disabled = fixture.querySelector(`button[data-variant="${variant}"]:disabled`);
          check(css(disabled).backgroundColor === resolve('var(--ui-disabled-bg)') && css(disabled).color === resolve('var(--ui-disabled-text)'), `${brand}/${mode}: disabled ${variant} uses the common disabled palette.`);
          fixture.querySelector('input').focus();
          button.focus();
          check(button.matches(':focus-visible') && css(button).outlineColor === resolve('var(--ui-focus)') && css(button).boxShadow.includes(resolve('var(--ui-focus-edge)')), `${brand}/${mode}: ${variant} preserves visible keyboard focus.`);
        }
        const base = fixture.querySelector('#control-default');
        const unknown = fixture.querySelector('#control-unknown');
        check(css(base).backgroundColor === css(unknown).backgroundColor && css(base).padding === css(unknown).padding && css(base).fontSize === css(unknown).fontSize, `${brand}/${mode}: unknown variant/size values fall back to the normal primary control.`);
      }
    }
    const form = fixture.querySelector('form');
    let submitter;
    let submits = 0;
    form.addEventListener('submit', (event) => { event.preventDefault(); submits++; submitter = event.submitter; });
    for (const variant of variants) {
      const button = form.querySelector(`button[data-variant="${variant}"]:enabled`);
      button.click();
      check(submitter === button && new win.FormData(form, submitter).get('intent') === variant, `${variant} preserves native submission, submitter and successful name/value.`);
    }
    const inputButton = form.querySelector('[type="submit"][value="Input action"]');
    inputButton.click();
    check(submitter === inputButton && css(inputButton).backgroundColor === css(form.querySelector('button[data-variant="secondary"]')).backgroundColor, 'Native input submit buttons share variant styling and submission behavior.');
    const before = submits;
    form.querySelector('button:disabled').click();
    check(submits === before, 'A disabled variant cannot submit the native form.');
    form.elements.answer.value = 'Changed answer';
    form.querySelector('[type="reset"]').click();
    check(form.elements.answer.value === 'Initial answer' && submits === before, 'Secondary/quiet presentation does not intercept native reset.');
    const rem = parseFloat(css(root).fontSize);
    const heights = [];
    for (const [index, size] of ['small', 'default', 'large'].entries()) {
      const group = fixture.querySelector(`[data-profile="${size}"]`);
      const button = group.querySelector('button');
      const field = group.querySelector('input');
      const select = group.querySelector('select');
      const minimum = [2.5, 2.75, 3.5][index] * rem;
      check([button, field, select, group.querySelector('textarea')].every((control) => control.getBoundingClientRect().height >= minimum - .1) && button.getBoundingClientRect().width >= minimum - .1, `${size} supported controls retain their minimum target dimensions.`);
      check(parseFloat(css(field).fontSize) >= rem && parseFloat(css(select).paddingInlineEnd) >= 2.5 * rem, `${size} fields keep legible text and native-select arrow clearance.`);
      group.dir = 'rtl';
      check(css(select).direction === 'rtl' && parseFloat(css(select).paddingInlineEnd) >= 2.5 * rem, `${size} select sizing retains logical end padding in RTL.`);
      group.dir = 'ltr';
      heights.push(button.getBoundingClientRect().height);
    }
    check(heights[0] < heights[1] && heights[1] < heights[2], 'Small, default and large controls have increasing rendered sizes.');
    const group = fixture.querySelector('[data-profile="default"]');
    group.dataset.size = 'large';
    group.querySelector('button').removeAttribute('data-size');
    check(Math.abs(group.querySelector('button').getBoundingClientRect().height - heights[1]) < .1, 'A size on a wrapper does not resize descendant controls.');
    const checkbox = doc.querySelector('#theme-form [type="checkbox"]');
    const checkboxWidth = checkbox.getBoundingClientRect().width;
    checkbox.dataset.size = 'large';
    check(checkbox.getBoundingClientRect().width === checkboxWidth && Math.abs(checkbox.getBoundingClientRect().height - checkboxWidth) < 1, 'Checkboxes keep their existing square dimensions when a size attribute is present.');
    checkbox.removeAttribute('data-size');
    const list = doc.createElement('select');
    list.size = 4;
    list.dataset.size = 'small';
    list.setAttribute('aria-label', 'Four-row list');
    list.innerHTML = '<option>One</option><option>Two</option><option>Three</option><option>Four</option>';
    fixture.append(list);
    check(list.size === 4 && list.getBoundingClientRect().height >= 4 * parseFloat(css(list).fontSize), 'Native select size still produces a multi-row listbox.');
    const link = doc.createElement('a');
    link.href = '#main';
    link.textContent = 'A real destination';
    link.dataset.variant = 'danger';
    fixture.append(link);
    check(css(link).backgroundColor === 'rgba(0, 0, 0, 0)' && css(link).color === resolve('var(--ui-link)'), 'Variant attributes do not turn links into action buttons.');
    fixture.style.inlineSize = '280px';
    const long = group.querySelector('button');
    long.textContent = 'Review the translated project settings before continuing to the next step';
    long.dataset.size = 'large';
    root.style.fontSize = '200%';
    check(long.scrollWidth <= long.clientWidth + 1 && long.scrollHeight <= long.clientHeight + 1 && long.getBoundingClientRect().height >= 3.5 * parseFloat(css(root).fontSize), 'Long button labels wrap without clipping at doubled root text size.');
    const demo = doc.querySelector('#action-variants [data-variant="danger"]:enabled');
    demo.click();
    check(doc.querySelector('#variant-result').textContent.includes('No project data was changed'), 'Danger preview only reports feedback; it does not mutate project data.');
    return passed;
  } finally {
    fixture.remove();
    controls.forEach((control, index) => choose(control, saved[index]));
    root.style.cssText = savedStyle;
  }
}
