// Documentation application integration checks; run through tests/accessibility.html.
async function runDocumentationChecks(load, frame) {
  const passed = [];
  const check = (condition, message) => { assert(condition, message); passed.push(message); };
  const settle = (win) => new Promise((resolve) => win.setTimeout(resolve, 60));
  let win = await load('../docs/controls.html');
  let doc = win.document;
  check([...doc.querySelectorAll('[data-site-nav] a')].map(a=>a.textContent).join(',') === 'About,Components,Docs,Themes,Tests', 'Documentation uses the five shared top-level destinations.');
  check(doc.querySelector('[data-site-nav] [aria-current]').textContent === 'Docs' && doc.querySelector('.docs-sidebar [aria-current]').textContent === 'Buttons & control sizes', 'Primary and guide navigation identify the current location.');
  check(doc.querySelector('#theme-variables') && doc.querySelector('.docs-article').textContent.includes('--ui-control-large-min-size') && doc.querySelector('#control-sizes'), 'The complete control specification is rendered with token tables and section anchors.');
  check(doc.querySelector('.doc-source a').getAttribute('href') === 'controls.md' && !doc.querySelector('.docs-article > pre input'), 'The source Markdown remains linked and code samples are escaped.');
  check(doc.querySelector('.docs-toc a[href="#control-sizes"]') && doc.querySelector('.docs-sidebar a[href="forms.html"]'), 'Guides provide on-page contents and rendered cross-guide links.');
  win = await load('../docs/components/checkbox.html'); doc = win.document;
  const example = doc.querySelector('[data-example]');
  const viewport = example.querySelector('.example-viewport');
  const width = example.querySelector('input[type=range]');
  const code = example.querySelector('details');
  check(doc.querySelectorAll('[data-example]').length === 4 && !code.open && !example.querySelector('.example-tools').hidden, 'Checkbox documentation provides four live examples with initially closed native Code drawers.');
  code.querySelector('summary').click();
  check(code.open && code.querySelector('code').textContent.includes('type="checkbox"'), 'The Code disclosure opens its actual example markup.');
  const demo = example.querySelector('iframe');
  demo.loading = 'eager';
  if (demo.contentDocument?.readyState !== 'complete' || !demo.contentDocument.querySelector('input')) await new Promise(resolve=>demo.addEventListener('load',resolve,{once:true}));
  check(demo.contentDocument.querySelector('body > main > h1').hidden, 'Documentation embeds use the visible host example heading rather than a duplicate frame heading.');
  const checkbox = demo.contentDocument.querySelector('input'); checkbox.click();
  check(checkbox.checked && checkbox.type === 'checkbox', 'The live example uses a real independently toggleable native checkbox.');
  // The example is not a form: serialize its control using a temporary native form association.
  const nativeForm = demo.contentDocument.createElement('form'); nativeForm.id = 'value-check'; demo.contentDocument.body.append(nativeForm);
  checkbox.setAttribute('form','value-check');
  check(new demo.contentWindow.FormData(nativeForm).get('updates') === 'yes', 'The preview checkbox retains native name/value serialization.');
  checkbox.removeAttribute('form'); nativeForm.remove();
  doc.documentElement.dataset.theme='light'; doc.documentElement.dataset.brand='forest'; doc.documentElement.dir='rtl'; await settle(win);
  check(demo.contentDocument.documentElement.dataset.theme==='light' && demo.contentDocument.documentElement.dataset.brand==='forest' && demo.contentDocument.documentElement.dir==='rtl', 'Preview documents follow host theme, brand and reading direction.');
  doc.documentElement.dir='ltr';
  width.value = width.min; width.dispatchEvent(new win.Event('input', {bubbles:true})); await settle(win);
  check(Math.abs(viewport.getBoundingClientRect().width-Number(width.min)) < 2 && demo.contentWindow.innerWidth <= Number(width.min), 'Width control changes the real iframe viewport rather than only scaling its contents.');
  const handle = example.querySelector('.example-handle');
  handle.dispatchEvent(new win.KeyboardEvent('keydown',{key:'End',bubbles:true}));
  check(Number(width.value) === Number(width.max), 'Resize handle supports End for full width.');
  handle.dispatchEvent(new win.KeyboardEvent('keydown',{key:'Home',bubbles:true}));
  check(Number(width.value) === Number(width.min), 'Resize handle supports Home for minimum width.');
  doc.documentElement.dir = 'rtl';
  handle.dispatchEvent(new win.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));
  check(Number(width.value) > Number(width.min), 'Resize handle reverses horizontal keyboard direction in RTL.');
  example.querySelector('[data-reset]').click();
  check(Number(width.value) === Number(width.max), 'Reset returns the example to full available width.');
  const priorHeight = demo.style.blockSize;
  win.dispatchEvent(new win.MessageEvent('message',{source:win,origin:win.location.origin,data:{type:'ui-doc-preview-height',height:999}}));
  check(demo.style.blockSize === priorHeight, 'Preview sizing ignores messages from another window.');
  Object.defineProperty(win.navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('Denied'))}});
  code.open = false; example.querySelector('[data-copy]').click(); await settle(win);
  check(code.open && example.querySelector('[data-copy-status]').textContent.includes('Select the code'), 'Clipboard denial opens a selectable-code fallback with persistent feedback.');
  let copied=''; Object.defineProperty(win.navigator,'clipboard',{configurable:true,value:{writeText:async text=>{copied=text;}}});
  example.querySelector('[data-copy]').click(); await settle(win);
  check(copied === code.querySelector('code').textContent && example.querySelector('[data-copy-status]').textContent === 'Code copied.', 'Copy action uses the displayed example source and reports success.');
  win = await load('../docs/components/combobox.html'); doc=win.document;
  check(!doc.querySelector('[data-example]') && doc.querySelector('#proposal').nextElementSibling.textContent.includes('not implemented'), 'Planned component pages expose proposals without pretend live controls.');
  win = await load('../docs/components/popup.html'); doc=win.document;
  check(doc.querySelector('a[href="../specs/popup.html"]') && doc.querySelector('a[href="../specs/popup.md"]') && doc.querySelector('[data-example]'), 'Experimental Popup links its specification, source and actual anchored-help example.');
  win = await load('../docs/components/accordion.html'); doc=win.document;
  check(doc.querySelectorAll('[data-example]').length === 3 && doc.querySelector('a[href="../specs/accordion.html"]') && doc.querySelector('a[href="../accordion.html"]') && doc.querySelector('.component-meta').textContent.includes('Foundation'), 'Experimental Accordion exposes three runnable recipes, specification and implemented guide.');
  win = await load('../docs/components/tab-group.html'); doc=win.document;
  check(doc.querySelectorAll('[data-example]').length === 3 && doc.querySelector('a[href="../specs/tabs.html"]') && doc.querySelector('a[href="../tabs.html"]') && doc.querySelector('.component-meta').textContent.includes('Foundation'), 'Experimental Tabs links three runnable recipes, specification and implemented guide.');
  check([...doc.querySelectorAll('[data-example] details code')].every(code => code.textContent.includes('<ui-tablist') && !code.textContent.includes('data-ui-tablist')), 'Tabs source drawers use the named structural element without the legacy list marker.');
  win = await load('../docs/specs/popup.html'); doc=win.document;
  check(doc.querySelector('link[href="../../css/site.css"]') && doc.querySelector('a[href="../lifecycle.html"]') && doc.querySelector('.doc-source a[href="popup.md"]') && !doc.querySelector('.docs-sidebar a[href="../components/popup.html"][aria-current]'), 'Nested specifications retain site assets, shared contracts and source links without marking a different page current.');
  win = await load('../docs/enhancement.html'); doc=win.document;
  check(doc.querySelectorAll('[data-example]').length === 4 && [...doc.querySelectorAll('[data-example] details code')].every(code => code.textContent.includes('js/ui.js') && !code.textContent.includes('addEventListener') && !code.textContent.includes('UIPopup.attach')), 'Shared-entry examples use the combined script and declarative markup without application initialization code.');
  win = await load('../docs/previews/input-0.html'); doc=win.document;
  check(!doc.querySelector('body > main > h1').hidden && doc.querySelector('h1').closest('main'), 'Standalone previews keep their document heading within the main landmark when embedded outside the documentation runner.');
  const form=doc.querySelector('form'); form.requestSubmit();
  check(!doc.querySelector('ui-error-summary').hidden && doc.activeElement === doc.querySelector('ui-error-summary'), 'Standalone preview preserves enhanced required validation and summary focus.');
  form.elements.email.value='reader@example.com'; form.requestSubmit();
  check(doc.querySelector('#preview-result').textContent.includes('email=reader@example.com') && doc.querySelector('ui-error-summary').hidden, 'Preview host reports valid FormData locally without navigating away.');
  form.reset(); await settle(win);
  check(form.elements.email.value === '' && doc.querySelector('#preview-result').textContent === '', 'Preview reset clears native answers and application feedback.');
  win = await load('../docs/previews/select-1.html'); doc=win.document;
  const select=doc.querySelector('select'); select.options[1].selected=true; select.form.requestSubmit();
  check(select.multiple && select.size===4 && doc.querySelector('#preview-result').textContent.includes('region=coast, region=woodland'), 'Multiple-select preview retains native rows and repeated successful values.');
  win = await load('../docs/previews/slider-0.html'); doc=win.document;
  const range=doc.querySelector('input'); range.stepUp(); range.form.requestSubmit();
  check(range.value==='55' && doc.querySelector('#preview-result').textContent.includes('volume=55'), 'Range preview retains native stepping and numeric serialization.');
  frame.style.inlineSize='320px';
  for (const route of ['../index.html','../docs/index.html','../docs/controls.html','../docs/forms.html','../docs/native-states.html','../docs/components/checkbox.html','../docs/components/combobox.html','../docs/lifecycle.html','../docs/specs/popup.html','../docs/popup.html','../docs/enhancement.html','../docs/accordion.html','../docs/components/accordion.html','../docs/specs/accordion.html','../docs/tabs.html','../docs/components/tab-group.html','../docs/specs/tabs.html']) {
    win=await load(route,true); doc=win.document;
    for (const dir of ['ltr','rtl']) {
      doc.documentElement.dir=dir;
      check(doc.documentElement.scrollWidth <= doc.documentElement.clientWidth+1, `${route} reflows at 320px in ${dir} with scripts blocked.`);
    }
    check(doc.querySelector('main') && !doc.querySelector('main').hidden && doc.querySelector('[data-site-nav] a'), `${route} retains readable content and navigation without JavaScript.`);
    if (route.includes('checkbox.html')) check(!doc.querySelector('[data-example] summary').hidden && doc.querySelector('[data-example] pre').textContent.includes('checkbox') && doc.querySelector('[data-example] .example-tools').hidden, 'No-script component docs retain preview/source and hide script-only width/copy controls.');
  }
  frame.style.removeProperty('inline-size');
  passed.push(...await runNativeStateChecks(load, frame));
  return passed;
}

document.querySelector('#run-docs').addEventListener('click',async()=>{
  const frame=document.querySelector('#audit-frame');
  const buttons=[...document.querySelectorAll('main > ui-cluster button')];
  buttons.forEach(button=>{button.disabled=true;}); frame.hidden=false;
  async function load(route,nojs=false) {
    frame.removeAttribute('srcdoc');
    if(nojs) frame.setAttribute('sandbox','allow-same-origin'); else frame.removeAttribute('sandbox');
    const url = new URL(route, location.href);
    url.searchParams.set('ui-test', String(Date.now()));
    await new Promise(resolve=>{frame.onload=resolve;frame.src=url.href;}); return frame.contentWindow;
  }
  try {const passed=await runDocumentationChecks(load,frame); reportResults(`PASS: ${passed.length} documentation checks\n\n${passed.join('\n')}`);}
  catch(error) {reportResults(`FAIL: Documentation checks: ${error.message}`);}
  finally {buttons.forEach(button=>{button.disabled=false;}); frame.style.removeProperty('inline-size'); document.querySelector('#result-title').focus();}
});
