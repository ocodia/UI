function tokenLuminance(color) {
    const values = color.match(/[\d.]+/g)?.map(Number);
    if (!values || values.length < 3 || (values.length === 4 && values[3] !== 1)) throw new Error(`Expected opaque computed color: ${color}`);
    return values.slice(0, 3).map((value) => { value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
  }
function colorContrast(first, second) { const a = tokenLuminance(first), b = tokenLuminance(second); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); }

// Test rendered token consumers and contrast, including application/legacy overrides.
async function runThemeTokenChecks(win) {
  const doc = win.document;
  const root = doc.documentElement;
  const controls = ['brand', 'mode', 'focus-palette'].map((id) => doc.getElementById(id));
  const saved = controls.map((control) => control.value);
  const originalStyle = root.style.cssText;
  const passed = [];
  const check = (condition, message) => { if (!condition) throw new Error(message); passed.push(message); };
  const choose = (control, value) => { control.value = value; control.dispatchEvent(new win.Event('change', { bubbles: true })); };
  const fixture = doc.createElement('div');
  fixture.innerHTML = '<ui-stack><p>First</p><p>Second</p></ui-stack><ui-panel>Surface</ui-panel><h3>Heading</h3><label>Answer<input></label><a href="#main">Review project</a><ui-error>Error: Check the answer</ui-error><ui-error-summary><h2>There is a problem</h2><ul></ul></ui-error-summary><span></span>';
  doc.querySelector('main').append(fixture);
  const style = (element) => win.getComputedStyle(element);
  const probe = fixture.querySelector('span');
  const resolve = (token) => { probe.style.color = `var(${token})`; return style(probe).color; };
  const contrast = colorContrast;
  try {
    choose(controls[0], 'default');
    choose(controls[1], 'light');
    root.style.setProperty('--ui-space-4', '1.25rem');
    root.style.setProperty('--ui-radius-md', '.5rem');
    const rem = parseFloat(style(root).fontSize);
    check(parseFloat(style(fixture.querySelector('ui-stack > :last-child')).marginBlockStart) === rem * 1.25 && parseFloat(style(fixture.querySelector('ui-panel')).paddingBlockStart) === rem * 1.25, 'Reference spacing updates semantic rhythm and panel padding.');
    check(parseFloat(style(fixture.querySelector('ui-panel')).borderRadius) === rem * .5, 'Reference radius updates the existing radius alias.');
    root.style.setProperty('--ui-space', '1.5rem');
    root.style.setProperty('--ui-radius', '.75rem');
    check(parseFloat(style(fixture.querySelector('ui-panel')).paddingBlockStart) === rem * 1.5 && parseFloat(style(fixture.querySelector('ui-panel')).borderRadius) === rem * .75, 'Existing space and radius overrides take precedence over reference defaults.');
    root.style.setProperty('--ui-font-size-xl', '1.75rem');
    root.style.setProperty('--ui-font-weight-medium', '700');
    check(parseFloat(style(fixture.querySelector('h3')).fontSize) === rem * 1.75 && style(fixture.querySelector('label')).fontWeight === '700', 'Type scale and weight overrides reach real headings and labels.');
    root.style.setProperty('--interactive', '#531a87');
    check(style(fixture.querySelector('a')).color === 'rgb(83, 26, 135)', 'Legacy light link colors remain supported.');
    choose(controls[1], 'dark');
    root.style.setProperty('--dark-link-1', '#c7a8ef');
    check(style(fixture.querySelector('a')).color === 'rgb(199, 168, 239)', 'Legacy dark link colors remain supported.');
    root.style.setProperty('--ui-invalid', '#dfb2ef');
    check(style(fixture.querySelector('ui-error')).color === 'rgb(223, 178, 239)', 'Existing invalid-color overrides still control inline errors.');
    root.style.cssText = originalStyle;
    for (const brand of ['default', 'forest']) {
      choose(controls[0], brand);
      for (const mode of ['light', 'dark']) {
        choose(controls[1], mode);
        for (const card of doc.querySelectorAll('[data-token-state]')) {
          const computed = style(card);
          const text = contrast(computed.color, computed.backgroundColor);
          const border = contrast(computed.borderInlineStartColor, computed.backgroundColor);
          check(text >= 4.5 && (card.dataset.tokenState === 'disabled' || border >= 3), `${brand}/${mode}: ${card.dataset.tokenState} text meets 4.5:1 and its applicable state marker meets 3:1.`);
        }
        const disabled = style(doc.querySelector('#theme-disabled'));
        check(disabled.opacity === '1' && contrast(disabled.color, disabled.backgroundColor) >= 4.5, `${brand}/${mode}: disabled answers remain legible without an opacity wash.`);
        const checkbox = style(doc.querySelector('#theme-form [type="checkbox"]'));
        check(Math.abs(parseFloat(checkbox.inlineSize) - parseFloat(checkbox.blockSize)) < 1 && parseFloat(checkbox.inlineSize) >= 16, `${brand}/${mode}: theme form retains normal square checkbox dimensions.`);
      }
    }
    for (const palette of ['default', 'blue']) {
      choose(controls[2], palette);
      const fill = resolve('--ui-focus');
      const edge = resolve('--ui-focus-edge');
      check(contrast(fill, edge) >= 4.5, `${palette} focus palette has contrasting text and background.`);
      const input = fixture.querySelector('input');
      input.focus();
      check(style(input).outlineColor === fill && style(input).boxShadow.includes(edge), `${palette} palette reaches the native input focus ring.`);
      const link = fixture.querySelector('a');
      link.focus();
      check(link.matches(':focus-visible') && style(link).backgroundColor === fill && style(link).color === edge, `${palette} palette reaches keyboard-focused text links.`);
      input.focus();
      const header = doc.querySelector('body > header a');
      header.focus();
      check(header.matches(':focus-visible') && style(header).backgroundColor === fill && style(header).color === edge, `${palette} palette is retained inside the page header.`);
      const summary = fixture.querySelector('ui-error-summary');
      summary.focus();
      check(style(summary).outlineColor === fill && style(summary).boxShadow.includes(edge), `${palette} palette reaches programmatically focused error summaries.`);
      const skip = doc.querySelector('ui-skip-link a');
      skip.focus();
      check(style(skip).backgroundColor === fill && style(skip).color === edge && style(skip).outlineColor === edge, `${palette} palette reaches skip-link focus.`);
    }
    return passed;
  } finally {
    fixture.remove();
    controls.forEach((control, index) => choose(control, saved[index]));
    root.style.cssText = originalStyle;
  }
}
