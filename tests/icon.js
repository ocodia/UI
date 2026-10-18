// Trusted repository fixtures. Synthetic events do not establish manual AT evidence.
async function runIconChecks(load, frame) {
  const passed = [], check = (value, message) => { if (!value) throw new Error(`After ${passed.length}: ${message}`); passed.push(message); };
  const settle = () => new Promise(resolve => setTimeout(resolve, 40));
  let win, doc;
  const open = async (route = '../docs/previews/icon-0.html', nojs = false, setup = '', scriptAttributes = '') => { win = await load(route, nojs, setup, scriptAttributes); doc = win.document; };
  const wait = async predicate => { for (let i = 0; i < 100; i++) { if (predicate()) return; await settle(); } throw new Error(`After ${passed.length}: Icon did not settle.`); };
  const make = (name, markup = '') => { const node = doc.createElement('ui-icon'); node.setAttribute('name',name); node.innerHTML = markup; doc.querySelector('main').append(node); win.UI.enhance(node); return node; };
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill="currentColor" d="M2 2h16v16H2z"/></svg>';
  const fallback = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="5"/></svg>';
  const mock = (source = svg, init = {}) => { win.fetch = async () => new win.Response(source, {headers:{'Content-Type':'image/svg+xml'}, ...init}); };
  await open();
  let icon = doc.querySelector('ui-icon'), original = icon.firstElementChild;
  await wait(() => icon.dataset.uiIconState === 'ready');
  check(icon.querySelector('[data-ui-icon-svg]') && original.hasAttribute('hidden') && original.isConnected, 'Valid local SVG hides but preserves the original fallback node.');
  check(icon.getAttribute('aria-hidden') === 'true' && !icon.hasAttribute('role') && !icon.hasAttribute('tabindex'), 'Decorative host has no image role or focus stop.');
  const generated = icon.querySelector('[data-ui-icon-svg]');
  check(generated.namespaceURI === 'http://www.w3.org/2000/svg' && generated.getAttribute('aria-hidden') === 'true' && generated.getAttribute('focusable') === 'false' && !generated.hasAttribute('tabindex') && !icon.shadowRoot, 'Generated SVG stays in light DOM and out of the accessibility/focus tree.');
  check(generated.getAttribute('viewBox') === '0 0 20 20', 'Fluent 20px canvas uses the correct coordinate system.');
  const before = icon.querySelector('[data-ui-icon-svg]'); win.UI.enhance(doc); win.UI.enhance(icon); await settle();
  check(before === icon.querySelector('[data-ui-icon-svg]') && icon.querySelectorAll('[data-ui-icon-svg]').length === 1, 'Repeated enhancement preserves one generated SVG.');
  check(!win.customElements.get('ui-icon'), 'Icon uses element-name enhancement without registration.');
  let requests = 0; const nativeFetch = win.fetch; win.fetch = (...args) => { requests++; return nativeFetch(...args); };
  icon.setAttribute('label','Téléchargement'); await settle();
  check(icon.getAttribute('role') === 'img' && icon.getAttribute('aria-label') === 'Téléchargement' && !icon.hasAttribute('aria-hidden') && requests === 0, 'Localized label changes name immediately without fetching.');
  icon.setAttribute('label',' '); await settle(); check(icon.getAttribute('aria-hidden') === 'true' && !icon.hasAttribute('aria-label') && !icon.hasAttribute('role'), 'Empty labels restore decorative semantics.');
  icon.style.fontSize = '32px'; icon.style.color = 'rgb(150, 20, 40)';
  check(icon.getBoundingClientRect().width === 32 && generated.getBoundingClientRect().height === 32 && win.getComputedStyle(generated.querySelector('path')).fill === 'rgb(150, 20, 40)', 'Geometry follows font-size and currentColor follows inherited text color.');
  win.UI.destroy(icon);
  check(!icon.hasAttribute('data-ui-icon-state') && !icon.querySelector('[data-ui-icon-svg]') && !original.hasAttribute('hidden') && icon.firstElementChild === original, 'Destroy restores authored fallback identity, attributes and decorative baseline.');
  win.UI.enhance(icon); await wait(() => icon.dataset.uiIconState === 'ready'); icon.setAttribute('aria-label','Application update'); win.UI.destroy(icon);
  check(icon.getAttribute('aria-label') === 'Application update', 'Teardown preserves a newer application attribute write.');
  win.UI.enhance(icon); await wait(() => icon.dataset.uiIconState === 'ready'); icon.remove(); await settle();
  check(!icon.hasAttribute('data-ui-icon-state') && !icon.querySelector('[data-ui-icon-svg]') && !original.hasAttribute('hidden'), 'Disconnect releases observers, semantics and generated content.');
  doc.querySelector('main').append(icon); await settle(); check(!icon.hasAttribute('data-ui-icon-state'), 'Reconnect requires explicit enhancement.'); win.UI.enhance(icon); await wait(() => icon.dataset.uiIconState === 'ready');
  const foreign = doc.implementation.createHTMLDocument('Adopted'); foreign.body.append(icon); await settle(); check(!icon.hasAttribute('data-ui-icon-state'), 'Cross-document adoption releases old-document ownership.');
  await open(); await wait(() => doc.querySelector('ui-icon').dataset.uiIconState === 'ready');
  let resolve; requests = 0; win.fetch = () => { requests++; return new Promise(done => { resolve = done; }); };
  const a = make('shared-fixture',fallback), b = make('shared-fixture');
  check(requests === 1 && a.dataset.uiIconState === 'loading' && !a.firstElementChild.hasAttribute('hidden'), 'Concurrent identical requests share one fetch while fallback remains visible.');
  win.UI.destroy(a); resolve(new win.Response(svg,{headers:{'Content-Type':'image/svg+xml'}})); await wait(() => b.dataset.uiIconState === 'ready');
  check(!a.querySelector('[data-ui-icon-svg]') && !a.hasAttribute('data-ui-icon-state'), 'A destroyed consumer ignores completion while the shared consumer finishes.');
  const c = make('shared-fixture'); await wait(() => c.dataset.uiIconState === 'ready'); check(requests === 1 && c.firstElementChild !== b.firstElementChild, 'Cache reuses a template but gives each host its own SVG node.');
  const deferred = new Map(); win.fetch = url => new Promise(done => deferred.set(url.split('/').pop(),done));
  const race = make('old-fixture',fallback); race.setAttribute('name','new-fixture'); await settle();
  deferred.get('new-fixture.svg')(new win.Response(svg.replace('M2 2','M3 3'),{headers:{'Content-Type':'image/svg+xml'}})); await wait(() => race.dataset.uiIconState === 'ready');
  deferred.get('old-fixture.svg')(new win.Response(svg,{headers:{'Content-Type':'image/svg+xml'}})); await settle();
  check(race.querySelector('[data-ui-icon-svg] path').getAttribute('d').startsWith('M3 3'), 'An older response cannot overwrite a newer icon selection.');
  requests = 0; win.fetch = async () => { requests++; return new win.Response(svg,{headers:{'Content-Type':'image/svg+xml'}}); };
  for (const name of ['', '../secret','/root','https://remote/icon','icon.svg','%2e%2e','a?b','a#b','a\\b']) { const invalid = make(name,fallback); check(invalid.dataset.uiIconState === 'error' && !invalid.firstElementChild.hasAttribute('hidden'), `Invalid name ${JSON.stringify(name)} keeps fallback and does not fetch.`); }
  check(requests === 0, 'Invalid names produce no network requests.');
  const invalidLibrary = make('valid-fixture'); invalidLibrary.setAttribute('library','../outside'); await settle(); check(invalidLibrary.dataset.uiIconState === 'error', 'Invalid library cannot escape its base directory.');
  invalidLibrary.setAttribute('library',''); await settle(); check(invalidLibrary.dataset.uiIconState === 'error', 'Explicit empty library is invalid.');
  for (const [label, source] of [
    ['script',svg.replace('</svg>','<script>alert(1)</script></svg>')],
    ['event handler',svg.replace('<path','<path onload="alert(1)"')],
    ['external paint',svg.replace('currentColor','url(https://example.com/a.svg)')],
    ['local reference',svg.replace('currentColor','url(#paint)')],
    ['foreignObject',svg.replace('</svg>','<foreignObject/></svg>')],
    ['style',svg.replace('<path','<path style="fill:red"')],
    ['href',svg.replace('<path','<path href="https://example.com"')],
    ['ids',svg.replace('<path','<path id="collision"')],
    ['use',svg.replace('</svg>','<use/></svg>')],
    ['nested svg',svg.replace('</svg>','<svg viewBox="0 0 1 1"/></svg>')],
    ['doctype','<!DOCTYPE svg>'+svg],
    ['wrong namespace',svg.replace('http://www.w3.org/2000/svg','https://wrong.example/svg')],
    ['nonfinite paint',svg.replace('fill="currentColor"','fill="currentColor" opacity="1e999"')],
    ['bad geometry',svg.replace('0 0 20 20','0 0 0 20')],
    ['nonfinite geometry',svg.replace('0 0 20 20','0 0 Infinity 20')],
    ['empty drawing','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"/>'],
    ['malformed','<svg'],
    ['html','<html><body>Not an icon</body></html>']
  ]) {
    mock(source); const rejected = make('reject-'+passed.length,fallback); await wait(() => rejected.dataset.uiIconState === 'error');
    check(!rejected.querySelector('[data-ui-icon-svg]') && !rejected.firstElementChild.hasAttribute('hidden'), `Reject ${label}; preserve fallback.`);
  }
  mock(svg,{status:404}); const retry = make('retry-fixture',fallback); await wait(() => retry.dataset.uiIconState === 'error');
  mock(); win.UI.enhance(retry); await wait(() => retry.dataset.uiIconState === 'ready'); check(retry.querySelector('[data-ui-icon-svg]'), 'Explicit enhancement retries a failed request; failures are not cached.');
  mock(svg,{headers:{'Content-Type':'text/html'}}); const wrongMime = make('wrong-mime'); await wait(() => wrongMime.dataset.uiIconState === 'error'); check(!wrongMime.firstElementChild,'Wrong MIME type is rejected.');
  mock(svg,{headers:{'Content-Type':'image/svg+xml','Content-Length':'300000'}}); const oversized = make('oversize-header'); await wait(() => oversized.dataset.uiIconState === 'error'); check(!oversized.firstElementChild,'Oversized declared responses are rejected.');
  mock(' '.repeat(262145)+svg); const streamed = make('oversize-stream'); await wait(() => streamed.dataset.uiIconState === 'error'); check(!streamed.firstElementChild,'Streaming byte limit catches oversized responses without Content-Length.');
  mock(svg.replace('currentColor','#E62C46')); const colored = make('colored-fixture'); await wait(() => colored.dataset.uiIconState === 'ready'); check(colored.querySelector('path').getAttribute('fill') === '#E62C46','Explicit multicolor paint is preserved.');
  mock(svg.replace(' fill="currentColor"','')); const inherited = make('implicit-fill-fixture'); await wait(() => inherited.dataset.uiIconState === 'ready'); inherited.style.color='rgb(120, 30, 60)'; check(win.getComputedStyle(inherited.querySelector('path')).fill === 'rgb(120, 30, 60)','Omitted root paint defaults to currentColor; explicit paints remain unchanged.');
  const incomplete = doc.createElement('ui-icon'); incomplete.innerHTML = '<button type="button">Invalid child</button>'; doc.querySelector('main').append(incomplete); win.UI.enhance(incomplete); check(!incomplete.hasAttribute('data-ui-icon-state') && incomplete.firstElementChild.localName === 'button','Unsupported child markup stays untouched.');
  const named = doc.createElement('ui-icon'); named.setAttribute('aria-labelledby','external'); doc.querySelector('main').append(named); win.UI.enhance(named); check(!named.hasAttribute('data-ui-icon-state'),'Authored aria-labelledby is left untouched instead of competing for name ownership.');
  const originalTimeout = win.setTimeout; win.setTimeout = (callback, delay, ...args) => originalTimeout(callback, delay === 15000 ? 5 : delay, ...args);
  win.fetch = (url, options) => new Promise((resolve,reject) => options.signal.addEventListener('abort',()=>reject(new win.DOMException('Aborted','AbortError'))));
  const timedOut = make('timeout-fixture',fallback); await wait(() => timedOut.dataset.uiIconState === 'error');
  check(!timedOut.firstElementChild.hasAttribute('hidden'),'Timed-out requests retain visible fallback and end loading.'); win.setTimeout = originalTimeout;
  let pendingCount = 0; const completions = []; win.fetch = () => {pendingCount++; return new Promise(resolve=>completions.push(resolve));};
  const batch = [];
  for(let i=0;i<257;i++)batch.push(make('pending-bound-'+i));
  await wait(()=>batch.at(-1).dataset.uiIconState === 'error');
  check(pendingCount === 256 && batch.slice(0,256).every(node=>node.dataset.uiIconState === 'loading'),'Concurrent distinct requests are bounded; excess icons fail without starting another request.');
  completions.forEach(resolve=>resolve(new win.Response(svg,{headers:{'Content-Type':'image/svg+xml'}})));
  await wait(()=>batch.slice(0,256).every(node=>node.dataset.uiIconState === 'ready')); win.UI.enhance(batch.at(-1));
  await settle(); completions.at(-1)(new win.Response(svg,{headers:{'Content-Type':'image/svg+xml'}})); await wait(()=>batch.at(-1).dataset.uiIconState === 'ready');
  check(pendingCount === 257,'An excess request can retry after pending slots become available.');
  await open('../docs/previews/icon-4.html'); await wait(() => [...doc.querySelectorAll('ui-icon')].every(node => ['ready','error'].includes(node.dataset.uiIconState)));
  check(doc.querySelector('ui-icon').getAttribute('library') === null && doc.querySelector('ui-icon path').getAttribute('d') && doc.querySelector('ui-icon svg').getAttribute('stroke') === 'currentColor','Omitted library loads the root-level icon from /icons/.');
  check(doc.querySelectorAll('ui-icon')[1].getAttribute('library') === 'fieldwork' && doc.querySelectorAll('ui-icon')[1].querySelector('path').getAttribute('d'),'Explicit custom library loads a separate same-named stroke asset.');
  const missing = doc.querySelectorAll('ui-icon')[2]; check(missing.dataset.uiIconState === 'error' && !missing.firstElementChild.hasAttribute('hidden'),'Real root-level missing asset retains its authored fallback.');
  await open('../docs/previews/icon-1.html'); await wait(() => [...doc.querySelectorAll('ui-icon')].every(node => node.dataset.uiIconState === 'ready')); await settle();
  const menu = doc.querySelector('ui-menu'), trigger = menu.firstElementChild, list = menu.lastElementChild;
  check(menu.hasAttribute('data-ui-ready') && list.querySelector('hr') && [...list.querySelectorAll('a,button')].every(node => node.getAttribute('role') === 'menuitem'),'Async decorative SVG insertion preserves the command menu and hr dividers.');
  trigger.click(); await settle(); const first = list.querySelector('a'); first.dispatchEvent(new win.KeyboardEvent('keydown',{key:'d',bubbles:true,cancelable:true}));
  check(doc.activeElement.textContent.trim() === 'Download survey CSV','Menu typeahead uses command text after async icons load.');
  await open('../docs/previews/icon-3.html'); const dismiss = doc.querySelector('#dismiss-notice'); check(dismiss.getAttribute('aria-label') === 'Dismiss export notice','Icon-only native action owns its accessible name.'); dismiss.click(); check(doc.querySelector('#delivery-notice').hidden && doc.activeElement.id === 'restore-notice','Notice dismissal keeps focus on a visible action.'); doc.querySelector('#restore-notice').click(); check(!doc.querySelector('#delivery-notice').hidden && doc.activeElement === dismiss,'Restore returns focus before hiding its control.');
  await open('../docs/previews/icon-0.html',false,'window.fetch=undefined;'); check(!doc.querySelector('ui-icon').hasAttribute('data-ui-icon-state') && !doc.querySelector('ui-icon svg').hasAttribute('hidden'),'Missing fetch retains unenhanced fallback.');
  await open('../docs/previews/icon-0.html',false,"document.addEventListener('DOMContentLoaded',()=>UI.destroy(document.querySelector('ui-icon'))); ");
  check(!doc.querySelector('ui-icon').hasAttribute('data-ui-icon-state') && !doc.querySelector('ui-icon svg').hasAttribute('hidden'),'Destroy before the automatic pass suspends static icon enhancement.');
  await open('../docs/previews/icon-0.html',false,'', 'data-ui-icons-base="/icons/"'); await wait(() => doc.querySelector('ui-icon').dataset.uiIconState === 'ready'); check(true,'Explicit same-origin base directory loads the requested icon.');
  await open('../docs/previews/icon-0.html',false,'', 'data-ui-icons-base="https://example.com/icons/"'); check(doc.querySelector('ui-icon').dataset.uiIconState === 'error','Cross-origin base is rejected without loading remote assets.');
  for (const nojs of [false,true]) for (let index = 0; index < 5; index++) {
    frame.style.inlineSize = '320px'; await open(`../docs/previews/icon-${index}.html`,nojs);
    if (!nojs) await wait(() => [...doc.querySelectorAll('ui-icon')].every(node => ['ready','error'].includes(node.dataset.uiIconState)));
    else check(!doc.querySelector('ui-icon').hasAttribute('data-ui-icon-state'),'No-script preview retains its authored baseline.');
    for (const dir of ['ltr','rtl']) for (const theme of ['light','dark']) {
      doc.documentElement.dir = dir; doc.documentElement.dataset.theme = theme; doc.documentElement.dataset.brand = 'forest'; doc.documentElement.style.fontSize = '200%'; await settle();
      check(doc.documentElement.scrollWidth <= doc.documentElement.clientWidth + 1,`Icon example ${index}/${nojs?'no-script':'enhanced'}/${dir}/${theme}: 320px enlarged-text reflow.`);
    }
  }
  frame.style.inlineSize = '100%'; await open('../examples/icons.html'); await wait(() => doc.querySelectorAll('#icon-results button').length === 1 && doc.querySelector('#icon-library').options.length === 3);
  check(doc.querySelector('#icon-library').value === '' && doc.querySelector('#icon-results button').textContent === 'route','Icon browser starts with root-level assets as the implicit library.');
  doc.querySelector('#icon-results button').click(); check(doc.querySelector('#icon-code').textContent.includes('name="route"') && !doc.querySelector('#icon-code').textContent.includes('library=') && !doc.querySelector('#icon-copy').disabled,'Root-level selections copy markup with library omitted.');
  const search = doc.querySelector('#icon-query'), library = doc.querySelector('#icon-library'); library.value='fluent'; library.dispatchEvent(new win.Event('change',{bubbles:true})); await wait(()=>doc.querySelectorAll('#icon-results button').length===48);
  check(doc.querySelectorAll('ui-icon').length === 48,'Named library renders only one bounded page of icons.');
  search.value = 'arrow download'; search.dispatchEvent(new win.Event('input',{bubbles:true}));
  check([...doc.querySelectorAll('#icon-results button')].every(node=>node.textContent.toLowerCase().includes('arrow')&&node.textContent.toLowerCase().includes('download')),'Search filters filenames by all query words.');
  doc.querySelector('#icon-results button').click(); check(doc.querySelector('#icon-code').textContent.includes('library="fluent"') && !doc.querySelector('#icon-copy').disabled,'Named-library selections copy explicit library markup.');
  search.value=''; library.value='fieldwork'; library.dispatchEvent(new win.Event('change',{bubbles:true}));
  check(doc.querySelectorAll('#icon-results button').length === 1 && doc.querySelector('#icon-results').textContent === 'route','Switching libraries clears Fluent optical filters and displays custom artwork.');
  return passed;
}
document.addEventListener('DOMContentLoaded',()=>{
  const button = document.querySelector('#run'), frame = document.querySelector('#icon-frame'); if (!button || !frame) return;
  const load = async (route,nojs=false,setup='',attributes='') => {
    if (nojs) frame.setAttribute('sandbox','allow-same-origin'); else frame.removeAttribute('sandbox');
    let html = await (await fetch(route)).text();
    if (attributes) html=html.replace(/(<script src="[^\"]*js\/ui.js[^\"]*")/,`$1 ${attributes}`);
    html = html.replace('<head>',`<head><base href="${new URL(route,location.href).href}">${setup?`<script>${setup}<\/script>`:''}`);
    await new Promise(resolve=>{frame.onload=resolve;frame.srcdoc=html;}); return frame.contentWindow;
  };
  button.addEventListener('click',async()=>{
    button.disabled=true; document.querySelector('#results').textContent='Running…';document.querySelector('#assertions').replaceChildren();
    try {const passed=await runIconChecks(load,frame); document.querySelector('#results').textContent=`PASS: ${passed.length} Icon checks. ${frame.contentWindow.navigator.userAgent}`;for (const message of passed) {const li=document.createElement('li');li.textContent=message;document.querySelector('#assertions').append(li);}}
    catch(error){document.querySelector('#results').textContent='FAIL: '+error.message;}
    finally{button.disabled=false;frame.style.inlineSize='100%';document.querySelector('#results-title').focus();}
  });
  if(new URLSearchParams(location.search).has('autorun'))button.click();
});
