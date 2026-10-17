// Density is inherited composition spacing; it must not resize native targets.
async function runDensityChecks(win) {
  const doc = win.document;
  const root = doc.documentElement;
  const savedRootStyle = root.style.cssText;
  const savedDensity = root.getAttribute('data-density');
  const themeControls = ['brand', 'mode', 'focus-palette'].map((id) => doc.getElementById(id));
  const savedTheme = themeControls.map((control) => control.value);
  const passed = [];
  const check = (condition, message) => { if (!condition) throw new Error(message); passed.push(message); };
  const choose = (control, value) => { control.value = value; control.dispatchEvent(new win.Event('change', { bubbles: true })); };
  const css = (node) => win.getComputedStyle(node);
  const px = (node, property) => parseFloat(css(node)[property]);
  const near = (a, b) => Math.abs(a - b) < .15;
  // Let the preceding root text-resize check finish its rendered frame.
  await new Promise((resolve) => win.requestAnimationFrame(() => win.requestAnimationFrame(resolve)));
  const fixture = doc.createElement('div');
  const sample = (id, attribute = '') => `<ui-panel id="${id}" ${attribute}>
    <ui-field><label for="${id}-name">Project name with a longer translated label</label><ui-hint id="${id}-hint">Use a short, recognisable project name.</ui-hint><ui-error>Error: Enter a project name</ui-error><input id="${id}-name" name="${id}" value="Field guide" aria-describedby="${id}-hint"></ui-field>
    <label>Stage<select><option>In progress</option><option>Planning</option></select></label>
    <label>Notes<textarea rows="2"></textarea></label>
    <fieldset><legend>Updates</legend><label><input type="checkbox"> Send project updates with a long label that may wrap</label><label><input type="radio" name="${id}-route"> Email</label></fieldset>
    <p>Project updates remain readable when translated text wraps onto several lines.</p>
    <ui-stack data-stack><span>First</span><span>Second</span></ui-stack>
    <ui-cluster><button type="button">Review project</button><button type="button" data-size="small">Small action</button><button type="button" data-size="large">Large action</button></ui-cluster>
    <ui-grid><span>One</span><span>Two</span></ui-grid><ui-sidebar><div>Navigation</div><div>Content</div></ui-sidebar>
  </ui-panel>`;
  fixture.innerHTML = sample('density-baseline') + sample('density-comfortable', 'data-density="comfortable"') + sample('density-compact', 'data-density="compact"');
  doc.querySelector('main').append(fixture);
  const baseline = fixture.querySelector('#density-baseline');
  const comfortable = fixture.querySelector('#density-comfortable');
  const compact = fixture.querySelector('#density-compact');
  const rem = () => px(root, 'fontSize');
  const geometry = (panel) => [...panel.querySelectorAll('button, input:not([type="checkbox"],[type="radio"]), select, textarea')].map((node) => [css(node).fontSize, css(node).lineHeight, css(node).padding, css(node).minBlockSize, node.getBoundingClientRect().height].join('|'));
  try {
    root.removeAttribute('data-density');
    check(near(px(baseline, 'paddingBlockStart'), rem()) && near(px(baseline.querySelector('ui-cluster'), 'gap'), rem()), 'Pages with no density attribute retain the existing panel and layout defaults.');
    check(geometry(baseline).join() === geometry(comfortable).join() && css(baseline).padding === css(comfortable).padding, 'Explicit comfortable density preserves native control geometry and default panel padding.');
    check(near(px(compact, 'paddingBlockStart'), .75 * rem()) && near(px(compact.querySelector('ui-field'), 'marginBlockEnd'), .75 * rem()), 'Compact density reduces panel padding and field spacing.');
    check(near(px(compact.querySelector('ui-field label'), 'marginBlockEnd'), .25 * rem()) && near(px(compact.querySelector('ui-hint'), 'marginBlockEnd'), .375 * rem()) && near(px(compact.querySelector('ui-error'), 'marginBlockEnd'), .375 * rem()), 'Compact labels, hints and inline errors retain their documented spacing.');
    check(near(px(compact.querySelector('fieldset'), 'paddingBlockStart'), .75 * rem()), 'Compact fieldsets keep a separate reduced inset.');
    check(['ui-cluster', 'ui-grid', 'ui-sidebar'].every((selector) => near(px(compact.querySelector(selector), 'gap'), .75 * rem())) && near(px(compact.querySelector('[data-stack] > :last-child'), 'marginBlockStart'), .75 * rem()), 'Compact stack, cluster, grid and sidebar spacing use the inherited density profile.');
    check(geometry(compact).join() === geometry(comfortable).join(), 'Compact density leaves default, small and large control padding, type and target heights unchanged.');
    check(css(compact.querySelector('p')).fontSize === css(comfortable.querySelector('p')).fontSize && css(compact.querySelector('p')).lineHeight === css(comfortable.querySelector('p')).lineHeight && css(compact.querySelector('p')).marginBlockEnd === css(comfortable.querySelector('p')).marginBlockEnd, 'Compact composition preserves prose type, line height and paragraph spacing.');
    check([...compact.querySelectorAll('fieldset label')].every((label) => px(label, 'minBlockSize') >= 2.75 * rem()) && near(px(compact.querySelector('[type="checkbox"]'), 'inlineSize'), px(compact.querySelector('[type="checkbox"]'), 'blockSize')), 'Choice labels keep comfortable minimum targets and checkboxes stay square in compact scopes.');
    const nested = doc.createElement('div');
    nested.innerHTML = sample('density-reset', 'data-density="comfortable"') + sample('density-inherit', 'data-density="unknown"');
    compact.append(nested);
    const reset = nested.querySelector('#density-reset');
    const inherited = nested.querySelector('#density-inherit');
    check(near(px(reset, 'paddingBlockStart'), rem()) && near(px(reset.querySelector('ui-cluster'), 'gap'), rem()) && near(px(reset.querySelector('ui-field label'), 'marginBlockEnd'), .35 * rem()) && near(px(reset.querySelector('ui-hint'), 'marginBlockEnd'), .5 * rem()) && near(px(reset.querySelector('fieldset'), 'paddingBlockStart'), rem()), 'A nested comfortable scope resets every compact spacing channel.');
    check(near(px(inherited, 'paddingBlockStart'), .75 * rem()), 'Unknown density values inherit their enclosing scope rather than creating a new profile.');
    inherited.dataset.density = '';
    check(near(px(inherited, 'paddingBlockStart'), .75 * rem()), 'An empty density attribute is transparent to the surrounding compact scope.');
    reset.removeAttribute('data-density');
    check(near(px(reset, 'paddingBlockStart'), .75 * rem()), 'Removing a density marker immediately restores ancestor inheritance.');
    reset.dataset.density = 'comfortable';
    const again = doc.createElement('ui-panel');
    again.dataset.density = 'compact'; again.innerHTML = '<ui-cluster><span>First</span><span>Second</span></ui-cluster>';
    reset.append(again);
    check(near(px(again, 'paddingBlockStart'), .75 * rem()) && near(px(again.querySelector('ui-cluster'), 'gap'), .75 * rem()), 'Compact can be reapplied inside a nested comfortable scope.');
    const local = doc.createElement('ui-panel');
    local.style.setProperty('--ui-space', '1.5rem');
    local.innerHTML = '<ui-stack><span>First</span><span>Second</span></ui-stack>';
    reset.append(local);
    check(near(px(local, 'paddingBlockStart'), 1.5 * rem()) && near(px(local.querySelector('ui-stack > :last-child'), 'marginBlockStart'), 1.5 * rem()), 'Comfortable resets preserve descendant overrides of the legacy space variable.');
    compact.style.setProperty('--ui-panel-padding', '2rem');
    compact.querySelector('ui-cluster').style.setProperty('--ui-cluster-gap', '1.5rem');
    check(near(px(compact, 'paddingBlockStart'), 2 * rem()) && near(px(compact.querySelector('ui-cluster'), 'gap'), 1.5 * rem()) && near(px(compact.querySelector('ui-grid'), 'gap'), .75 * rem()), 'Local component geometry overrides win without changing other compact layout gaps.');
    compact.style.removeProperty('--ui-panel-padding');
    compact.querySelector('ui-cluster').style.removeProperty('--ui-cluster-gap');
    compact.style.setProperty('--ui-density-compact-space', '.875rem');
    compact.style.setProperty('--ui-density-compact-label-gap', '.3rem');
    compact.style.setProperty('--ui-density-compact-message-gap', '.4rem');
    compact.style.setProperty('--ui-density-compact-fieldset-padding', '.9rem');
    check(near(px(compact, 'paddingBlockStart'), .875 * rem()) && near(px(compact.querySelector('ui-field label'), 'marginBlockEnd'), .3 * rem()) && near(px(compact.querySelector('ui-hint'), 'marginBlockEnd'), .4 * rem()) && near(px(compact.querySelector('fieldset'), 'paddingBlockStart'), .9 * rem()), 'Compact profile variables can be themed at the density boundary.');
    compact.removeAttribute('style');
    root.style.setProperty('--ui-space-3', '.875rem');
    check(near(px(compact, 'paddingBlockStart'), .875 * rem()) && near(px(compact.querySelector('fieldset'), 'paddingBlockStart'), .875 * rem()), 'Root reference-scale overrides reach compact space and fieldset defaults.');
    root.style.cssText = savedRootStyle;
    root.dataset.density = 'compact';
    check(near(px(baseline, 'paddingBlockStart'), .75 * rem()) && near(px(comfortable, 'paddingBlockStart'), rem()), 'A root compact scope applies globally while explicit comfortable descendants remain isolated.');
    root.removeAttribute('data-density');
    const classes = doc.createElement('div');
    classes.innerHTML = '<div class="stack"><span>One</span><span>Two</span></div><div class="cluster"><span>One</span><span>Two</span></div><div class="grid"><span>One</span><span>Two</span></div>';
    compact.append(classes);
    check(near(px(classes.querySelector('.stack > :last-child'), 'marginBlockStart'), .75 * rem()) && ['.cluster', '.grid'].every((selector) => near(px(classes.querySelector(selector), 'gap'), .75 * rem())), 'Existing stack, cluster and grid class alternatives follow density too.');
    for (const brand of ['default', 'forest']) {
      choose(themeControls[0], brand);
      for (const mode of ['light', 'dark']) {
        choose(themeControls[1], mode);
        check(css(compact).backgroundColor === css(comfortable).backgroundColor && css(compact.querySelector('button')).color === css(comfortable.querySelector('button')).color && css(compact.querySelector('button')).backgroundColor === css(comfortable.querySelector('button')).backgroundColor, `${brand}/${mode}: density preserves semantic surface and action colors.`);
        const input = compact.querySelector('input');
        input.focus();
        const button = compact.querySelector('button');
        button.focus();
        check(button.matches(':focus-visible') && css(button).outlineWidth === css(comfortable.querySelector('button')).outlineWidth && css(button).boxShadow !== 'none' && px(compact.querySelector('ui-cluster'), 'gap') >= 2 * px(button, 'outlineWidth'), `${brand}/${mode}: compact actions retain keyboard focus and surrounding clearance.`);
      }
    }
    const select = compact.querySelector('select');
    compact.dir = 'rtl';
    check(css(select).direction === 'rtl' && px(select, 'paddingInlineEnd') >= 2.5 * rem() && near(parseFloat(css(select).backgroundPositionX), .75 * rem()), 'Compact RTL controls retain logical select-arrow clearance.');
    compact.dir = 'ltr';
    nested.remove();
    classes.remove();
    compact.style.inlineSize = '280px';
    const button = compact.querySelector('button');
    button.textContent = 'Review the translated project settings before continuing to the next step';
    root.style.fontSize = '200%';
    const overrides = doc.createElement('style');
    overrides.textContent = '#density-compact, #density-compact * { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } #density-compact p { margin-block-end: 2em !important; }';
    fixture.append(overrides);
    for (const dir of ['ltr', 'rtl']) {
      compact.dir = dir;
      check(compact.scrollWidth <= compact.clientWidth + 1 && button.scrollWidth <= button.clientWidth + 1 && button.scrollHeight <= button.clientHeight + 1 && button.getBoundingClientRect().height >= 2.75 * rem(), `Compact long labels and actions reflow in ${dir} with doubled root text and spacing overrides.`);
    }
    overrides.remove();
    root.style.cssText = savedRootStyle;
    for (const density of ['comfortable', 'compact']) {
      const editor = doc.querySelector(`#density-${density}-editor`);
      const form = editor.form;
      const input = form.elements.project;
      input.value = '';
      form.requestSubmit();
      check(!editor.querySelector('ui-error-summary').hidden && doc.activeElement === editor.querySelector('ui-error-summary'), `${density} example preserves validation and summary focus.`);
      input.value = 'New field guide';
      form.requestSubmit();
      check(editor.querySelector('ui-error-summary').hidden && doc.querySelector(`#density-${density}-result`).textContent.includes('Nothing was sent') && new win.FormData(form).get('updates') === 'yes', `${density} example preserves native form values and successful submission.`);
      form.reset();
      await new Promise((resolve) => win.setTimeout(resolve, 0));
      check(input.value === 'Field guide' && !input.hasAttribute('aria-invalid') && doc.querySelector(`#density-${density}-result`).textContent === '', `${density} example resets answers and application feedback.`);
    }
    return passed;
  } finally {
    fixture.remove();
    root.style.cssText = savedRootStyle;
    if (savedDensity === null) root.removeAttribute('data-density'); else root.setAttribute('data-density', savedDensity);
    themeControls.forEach((control, index) => choose(control, savedTheme[index]));
  }
}
