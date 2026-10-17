const results = document.querySelector('#results');
const fixture = document.querySelector('#fixture');
const componentButton = document.querySelector('#run-components');
const auditButton = document.querySelector('#run-audit');
const nojsButton = document.querySelector('#run-nojs');
const axeSource = 'https://cdn.jsdelivr.net/npm/axe-core@4.14.0/axe.min.js';


function reportResults(message) {
  results.replaceChildren(...message.split('\n').map((line) => {
    const paragraph = document.createElement('p');
    paragraph.textContent = line;
    return paragraph;
  }));
}

function assert(condition, message) { if (!condition) throw new Error(message); }

componentButton.addEventListener('click', async () => {
  const passed = [];
  try {
    fixture.innerHTML = '<ui-error-summary hidden><h2>There is a problem</h2><ul></ul></ui-error-summary><details><summary>Answer</summary><ui-field><label for="check-name">Name</label><ui-hint id="check-hint">Use your full name.</ui-hint><input id="check-name" aria-describedby="check-hint"></ui-field></details>';
    const summary = fixture.querySelector('ui-error-summary');
    const control = fixture.querySelector('input');
    const details = fixture.querySelector('details');
    assert(summary.getAttribute('aria-labelledby') === summary.querySelector('h2').id, 'Summary needs a heading association');
    passed.push('Summary has an accessible heading and region.');
    summary.show([{ control, message: 'Enter a name <not HTML>' }]);
    assert(!summary.hidden && document.activeElement === summary, 'Summary must receive focus');
    assert(summary.querySelector('a').textContent === 'Enter a name <not HTML>' && !summary.querySelector('not'), 'Messages must be plain text');
    passed.push('Showing errors moves focus and safely renders message text.');
    summary.querySelector('a').click();
    assert(document.activeElement === control && details.open, 'Error link must reveal and focus the control');
    assert(control.getAttribute('aria-describedby') === 'check-hint', 'Authored descriptions must remain intact');
    passed.push('Error links reveal closed disclosures and focus their controls.');
    summary.clear();
    assert(summary.hidden && !summary.querySelector('li'), 'Clear must remove stale errors');
    passed.push('Clearing hides the summary and removes stale links.');
    summary.remove();
    fixture.prepend(summary);
    summary.show([{ control, message: 'Enter a name' }]);
    let focusCalls = 0;
    const nativeFocus = control.focus.bind(control);
    control.focus = () => { focusCalls++; nativeFocus(); };
    summary.querySelector('a').click();
    assert(focusCalls === 1, 'Reconnection must not duplicate listeners');
    passed.push('Reconnect cleans up listeners instead of duplicating actions.');
    summary.show([]);
    assert(summary.hidden, 'Empty summaries must stay hidden');
    passed.push('Empty error lists stay hidden.');
    passed.push(...await runFormChecks(fixture));
    passed.push(...await runServerErrorChecks(fixture));
    passed.push(...await runFormIntegrationChecks(fixture));
    reportResults(`PASS: ${passed.length} checks\n\n${passed.join('\n')}`);
  } catch (error) {
    reportResults(`FAIL after ${passed.length} checks: ${error.message}`);
  } finally {
    fixture.replaceChildren();
    document.querySelector('#result-title').focus();
  }
});

async function loadExample(frame, route) {
  await new Promise((resolve, reject) => {
    frame.onload = resolve;
    frame.onerror = reject;
    frame.src = route;
  });
  const win = frame.contentWindow;
  async function inject(targetWindow) {
    await new Promise((resolve, reject) => {
      const script = targetWindow.document.createElement('script');
      script.src = axeSource;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Could not load axe-core. Check the network connection.'));
      targetWindow.document.head.append(script);
    });
    for (const child of targetWindow.document.querySelectorAll('iframe')) {
      if (new URL(child.src).origin !== location.origin) continue;
      await new Promise((resolve) => {
        child.onload = resolve;
        child.loading = 'eager';
        child.src = child.src;
      });
      await inject(child.contentWindow);
    }
  }
  await inject(win);
  return win;
}

nojsButton.addEventListener('click', async () => {
  const frame = document.querySelector('#audit-frame');
  auditButton.disabled = true;
  componentButton.disabled = true;
  nojsButton.disabled = true;
  document.querySelector("#run-examples").disabled = true;
  document.querySelector("#run-docs").disabled = true;
  frame.hidden = false;
  frame.style.inlineSize = '320px';
  frame.setAttribute('sandbox', 'allow-same-origin');
  try {
    await new Promise((resolve) => { frame.onload = resolve; frame.src = '../workspace.html'; });
    const win = frame.contentWindow;
    const doc = win.document;
    assert(!doc.querySelector('#project-form').noValidate, 'Native validation must stay enabled without scripts');
    assert(doc.querySelector('#save-actions').hidden, 'Script-dependent actions must stay hidden');
    assert(typeof doc.querySelector('ui-error-summary').show === 'undefined', 'The sandbox must prevent component scripts');
    assert(win.getComputedStyle(doc.querySelector('ui-stack')).display === 'block', 'Stack needs to work without scripts');
    assert(win.getComputedStyle(doc.querySelector('ui-grid')).display === 'grid', 'Grid needs to work without scripts');
    for (const dir of ['ltr', 'rtl']) {
      doc.documentElement.dir = dir;
      assert(doc.documentElement.scrollWidth <= doc.documentElement.clientWidth + 1, `320px ${dir} layout must not overflow`);
    }
    const input = doc.querySelector('#project-name');
    assert(input.labels[0].textContent === 'Project name', 'Native label must remain associated');
    assert(doc.getElementById(input.getAttribute('aria-describedby')), 'Native hint association must remain valid');
    reportResults('PASS: No-JavaScript workspace\nNative labels, hints, validation, and layouts remain usable.\nScript-only actions stay hidden.\nNo horizontal page overflow at 320px in LTR or RTL.');
  } catch (error) {
    reportResults(`FAIL: No-JavaScript workspace: ${error.message}`);
  } finally {
    auditButton.disabled = false;
    componentButton.disabled = false;
    nojsButton.disabled = false;
    document.querySelector("#run-examples").disabled = false;
    document.querySelector("#run-docs").disabled = false;
    document.querySelector('#result-title').focus();
  }
});

auditButton.addEventListener('click', async () => {
  auditButton.disabled = true;
  componentButton.disabled = true;
  nojsButton.disabled = true;
  document.querySelector("#run-examples").disabled = true;
  document.querySelector("#run-docs").disabled = true;
  const frame = document.querySelector('#audit-frame');
  frame.removeAttribute('sandbox');
  frame.style.removeProperty('inline-size');
  const report = [];
  frame.hidden = false;
  try {
    for (const route of ['../index.html', '../gallery.html', '../docs/controls.html', '../docs/components/checkbox.html', '../form.html', '../workspace.html', '../examples/index.html', '../examples/components.html', '../examples/patterns.html', '../examples/themes.html', '../examples/server-errors.html', '../examples/form-integration.html', '../examples/native-inputs.html', '../examples/composition.html', '../docs/native-states.html', '../docs/dialog.html', '../docs/components/dialog.html', '../docs/previews/dialog-1.html', ...['date-input', 'time-input', 'number-input', 'select', 'option', 'textarea', 'slider', 'details', 'breadcrumb', 'breadcrumb-item', 'card'].map(key => `../docs/components/${key}.html`)]) {
      const win = await loadExample(frame, route);
      for (const brand of (route.endsWith('/themes.html') || route.endsWith('/dialog-1.html')) ? ['default', 'forest'] : ['default']) {
        if (brand === 'default') delete win.document.documentElement.dataset.brand;
        else win.document.documentElement.dataset.brand = brand;
        for (const theme of ['light', 'dark']) {
          win.document.documentElement.dataset.theme = theme;
          if (route.endsWith('/dialog-1.html')) win.document.documentElement.dir = 'ltr';
          for (const palette of route.endsWith('/themes.html') ? ['default', 'blue'] : ['default']) {
            if (route.endsWith('/themes.html')) {
              win.document.querySelector('#brand').value = brand;
              win.document.querySelector('#mode').value = theme;
              const focusPalette = win.document.querySelector('#focus-palette');
              focusPalette.value = palette;
              focusPalette.dispatchEvent(new win.Event('change', { bubbles: true }));
              win.document.querySelector('#theme-name').focus();
              win.document.querySelector('body > header a').focus();
            }
            // loadExample eagerly loads nested frames; let host palette mutations settle.
            const previews = [...win.document.querySelectorAll('[data-example] iframe')];
            if (previews.length) {
              await new Promise(resolve => win.setTimeout(resolve, 60));
              for (const preview of previews) {
                const root = preview.contentDocument.documentElement;
                for (const attribute of ['data-theme', 'data-brand', 'dir']) {
                  assert(root.getAttribute(attribute) === win.document.documentElement.getAttribute(attribute), `Preview ${attribute} must match its host before audit`);
                }
                assert(preview.contentWindow.getComputedStyle(root).getPropertyValue('--ui-canvas').trim() === win.getComputedStyle(win.document.documentElement).getPropertyValue('--ui-canvas').trim(), 'Preview must render the host canvas palette before audit');
              }
              report.push(`PASS: ${previews.length} loaded previews match host attributes and rendered canvas (${theme}).`);
            }
            const audit = await win.axe.run(win.document, {
              runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }
            });
            report.push(`${route} (${brand}, ${theme}, focus ${palette}): ${audit.violations.length} violations; ${audit.incomplete.length} need manual review`);
            for (const violation of audit.violations) {
              report.push(`  ${violation.id}: ${violation.help}`);
              for (const node of violation.nodes) report.push(`    ${JSON.stringify(node.target)}`);
            }
            for (const review of audit.incomplete) {
              report.push(`  REVIEW ${review.id}: ${review.help}`);
              for (const node of review.nodes) report.push(`    ${JSON.stringify(node.target)}`);
            }
            if (route.endsWith('/dialog-1.html')) {
              const dialog = win.document.querySelector('#briefing-dialog');
              for (const dir of ['ltr', 'rtl']) {
                win.document.documentElement.dir = dir;
                win.document.querySelector('#briefing-open').click();
                assert(dialog.matches(':modal') && win.document.activeElement === win.document.querySelector('#briefing-title'), 'Long dialog audit requires a real modal with heading focus');
                for (const position of ['start', 'end']) {
                  if (position === 'end') [...dialog.querySelectorAll('button')].at(-1).focus();
                  const longAudit = await win.axe.run(win.document, {
                    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }
                  });
                  report.push(`Long dialog ${position} (${brand}, ${theme}, ${dir}): ${longAudit.violations.length} violations; ${longAudit.incomplete.length} need manual review`);
                  for (const [label, findings] of [['', longAudit.violations], ['REVIEW ', longAudit.incomplete]]) {
                    for (const finding of findings) {
                      report.push(`  ${label}${finding.id}: ${finding.help}`);
                      for (const node of finding.nodes) report.push(`    ${JSON.stringify(node.target)}`);
                    }
                  }
                }
                await new Promise(resolve => { dialog.addEventListener('close', resolve, { once: true }); dialog.close(); });
              }
            }
            if (/\/docs\/components\/(date-input|time-input|number-input|select|option|textarea)\.html$/.test(route)) {
              const preview = previews.find(frame => frame.contentDocument.querySelector('ui-form'));
              const editor = preview.contentDocument.querySelector('ui-form');
              editor.form.requestSubmit();
              assert(preview.contentDocument.activeElement === editor.querySelector('ui-error-summary'), 'Native state preview errors must focus their summary');
              const invalidAudit = await win.axe.run(win.document, {
                runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }
              });
              report.push(`${route} invalid (${theme}): ${invalidAudit.violations.length} violations; ${invalidAudit.incomplete.length} need manual review`);
              for (const [label, findings] of [['', invalidAudit.violations], ['REVIEW ', invalidAudit.incomplete]]) {
                for (const finding of findings) {
                  report.push(`  ${label}${finding.id}: ${finding.help}`);
                  for (const node of finding.nodes) report.push(`    ${JSON.stringify(node.target)}`);
                }
              }
              editor.form.reset();
              await new Promise(resolve => win.setTimeout(resolve, 0));
            }
            if (route.endsWith('/native-inputs.html') || route.endsWith('/composition.html')) {
              const editor = win.document.querySelector(route.endsWith('/composition.html') ? '#brief-editor' : '#visit-editor');
              if (route.endsWith('/composition.html')) [...editor.form.elements.area.options].forEach(option => { option.selected = false; });
              editor.form.requestSubmit(win.document.querySelector(route.endsWith('/composition.html') ? '#brief-submit' : '#visit-submit'));
              assert(win.document.activeElement === editor.querySelector('ui-error-summary'), 'Native input errors must focus their summary');
              const errorAudit = await win.axe.run(win.document, {
                runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }
              });
              report.push(`${route.endsWith('/composition.html') ? 'Composition selection errors' : 'Native input errors'} (${theme}): ${errorAudit.violations.length} violations; ${errorAudit.incomplete.length} need manual review`);
              for (const [label, findings] of [['', errorAudit.violations], ['REVIEW ', errorAudit.incomplete]]) {
                for (const finding of findings) {
                  report.push(`  ${label}${finding.id}: ${finding.help}`);
                  for (const node of finding.nodes) report.push(`    ${JSON.stringify(node.target)}`);
                }
              }
              editor.form.reset();
              await new Promise(resolve => win.setTimeout(resolve, 0));
            }
            if (route.endsWith('/patterns.html')) {
              const dialog = win.document.querySelector('#recipe-dialog');
              win.document.querySelector('#recipe-open-dialog').click();
              assert(dialog.matches(':modal'), 'Dialog audit requires an open native modal');
              const dialogAudit = await win.axe.run(win.document, {
                runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }
              });
              report.push(`Native dialog open (${theme}): ${dialogAudit.violations.length} violations; ${dialogAudit.incomplete.length} need manual review`);
              for (const violation of dialogAudit.violations) {
                report.push(`  ${violation.id}: ${violation.help}`);
                for (const node of violation.nodes) report.push(`    ${JSON.stringify(node.target)}`);
              }
              for (const review of dialogAudit.incomplete) {
                report.push(`  REVIEW ${review.id}: ${review.help}`);
                for (const node of review.nodes) report.push(`    ${JSON.stringify(node.target)}`);
              }
              await new Promise((resolve) => {
                dialog.addEventListener('close', resolve, { once: true });
                dialog.close();
              });
            }
            if (route.endsWith('/themes.html')) {
              const densityEditor = win.document.querySelector('#density-compact-editor');
              const densityForm = densityEditor.form;
              densityForm.elements.project.value = '';
              densityForm.requestSubmit();
              assert(win.document.activeElement === densityEditor.querySelector('ui-error-summary'), 'Compact form errors must focus their summary');
              const densityAudit = await win.axe.run(win.document, {
                runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }
              });
              report.push(`Compact density error (${brand}, ${theme}, focus ${palette}): ${densityAudit.violations.length} violations; ${densityAudit.incomplete.length} need manual review`);
              for (const violation of densityAudit.violations) {
                report.push(`  ${violation.id}: ${violation.help}`);
                for (const node of violation.nodes) report.push(`    ${JSON.stringify(node.target)}`);
              }
              for (const review of densityAudit.incomplete) {
                report.push(`  REVIEW ${review.id}: ${review.help}`);
                for (const node of review.nodes) report.push(`    ${JSON.stringify(node.target)}`);
              }
              densityForm.reset();
              await new Promise((resolve) => win.setTimeout(resolve, 0));
            }
            reportResults(report.join('\n'));
          }
        }
      }
      if (route.endsWith('/form-integration.html')) {
        const doc = win.document;
        const editor = doc.querySelector('#delivery-editor');
        const form = editor.form;
        const french = doc.querySelector('#french-editor');
        const response = doc.querySelector('#delivery-outcome');
        const settle = () => new Promise((resolve) => win.setTimeout(resolve, 0));
        const complete = () => new Promise((resolve) => win.setTimeout(resolve, 850));
        async function recordState(label) {
          const audit = await win.axe.run(doc, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }
          });
          report.push(`Form integration ${label}: ${audit.violations.length} violations; ${audit.incomplete.length} need manual review`);
          for (const violation of audit.violations) {
            report.push(`  ${violation.id}: ${violation.help}`);
            for (const node of violation.nodes) report.push(`    ${JSON.stringify(node.target)}`);
          }
          for (const review of audit.incomplete) {
            report.push(`  REVIEW ${review.id}: ${review.help}`);
            for (const node of review.nodes) report.push(`    ${JSON.stringify(node.target)}`);
          }
          reportResults(report.join('\n'));
        }
        for (const theme of ['light', 'dark']) {
          doc.documentElement.dataset.theme = theme;
          [...form.elements.updates].forEach((control) => { control.checked = false; });
          form.requestSubmit();
          assert(!editor.querySelector('ui-error-summary').hidden, 'Group error state must be visible');
          await recordState(`group error (${theme})`);
          form.reset(); await settle();
          french.form.requestSubmit();
          assert(!french.querySelector('ui-error-summary').hidden, 'Localized error state must be visible');
          await recordState(`localized error (${theme})`);
          french.clear();
          response.value = 'failure';
          form.requestSubmit();
          assert(form.getAttribute('aria-busy') === 'true', 'Pending state must be exposed');
          await recordState(`pending (${theme})`);
          await complete();
          assert(!doc.querySelector('#delivery-failure').hidden, 'Service failure must be visible');
          await recordState(`service failure (${theme})`);
          form.reset(); await settle();
          response.value = 'field';
          form.requestSubmit(); await complete();
          assert(!editor.querySelector('ui-error-summary').hidden, 'Async field rejection must be visible');
          await recordState(`async field error (${theme})`);
          form.reset(); await settle();
        }
      }
      if (route.endsWith('workspace.html')) {
        win.document.querySelector('#project-name').value = '';
        win.document.querySelector('#project-summary').value = '';
        win.document.querySelector('#project-form').requestSubmit();
        const doc = win.document;
        const summary = doc.querySelector('#project-errors');
        assert(doc.activeElement === summary && !summary.hidden, 'Failed submission must focus its summary');
        assert(doc.title.startsWith('Error: '), 'Failed submission must mark the document title');
        assert(summary.querySelectorAll('li').length === 2, 'Both field errors must appear in the summary');
        assert(doc.querySelector('#project-name').getAttribute('aria-describedby').split(' ').includes('project-name-hint'), 'Validation must preserve hints');
        assert(doc.querySelector('#project-name').getAttribute('aria-describedby').split(' ').includes('project-name-error'), 'Validation must associate inline errors');
        const audit = await win.axe.run(win.document);
        report.push(`Workspace error state: ${audit.violations.length} violations; ${audit.incomplete.length} need manual review`);
        for (const violation of audit.violations) report.push(`  ${violation.id}: ${violation.help}`);
        for (const review of audit.incomplete) report.push(`  REVIEW ${review.id}: ${review.help}`);
        summary.querySelector('a').click();
        assert(doc.activeElement === doc.querySelector('#project-name'), 'Summary link must focus the invalid input');
        doc.querySelector('#project-form').reset();
        assert(summary.hidden && !doc.title.startsWith('Error: '), 'Reset must clear stale errors and restore the title');
        report.push('PASS: Workspace summary focus, linked errors, preserved hints, field focus, and reset cleanup.');
      }
    }
    const states = report.filter((line) => /: \d+ violations;/.test(line));
    const violations = states.reduce((total, line) => total + Number(line.match(/: (\d+) violations;/)[1]), 0);
    reportResults([`AUDIT COMPLETE: ${states.length} states; ${violations} violations. Review incomplete findings below.`, ...report].join('\n'));
  } catch (error) {
    reportResults([...report, `AUDIT INCOMPLETE: ${error.message}`].join('\n'));
  } finally {
    auditButton.disabled = false;
    componentButton.disabled = false;
    nojsButton.disabled = false;
    document.querySelector("#run-examples").disabled = false;
    document.querySelector("#run-docs").disabled = false;
    document.querySelector('#result-title').focus();
  }
});
