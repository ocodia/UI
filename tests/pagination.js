// Native navigation fixtures are trusted repository pages with distinct results.
async function runPaginationChecks(frame) {
  const passed = [], check = (value, message) => { if (!value) throw new Error(message); passed.push(message); };
  const settle = () => new Promise(resolve => setTimeout(resolve, 60));
  let win, doc;
  const load = async (index, nojs = false) => {
    if (nojs) frame.setAttribute('sandbox', 'allow-same-origin'); else frame.removeAttribute('sandbox');
    await new Promise(resolve => { frame.onload = resolve; frame.src = '../docs/previews/pagination-' + index + '.html?ui-test=' + Date.now(); });
    win = frame.contentWindow; doc = win.document;
  };
  const navigate = async link => {
    await new Promise(resolve => { frame.onload = resolve; link.click(); }); win = frame.contentWindow; doc = win.document;
  };
  for (const nojs of [false, true]) {
    await load(0, nojs);
    for (let index = 0; index < 5; index++) {
      const pager = doc.querySelector('ui-pagination'), nav = pager.querySelector('nav'), links = [...nav.querySelectorAll('a')], current = nav.querySelectorAll('[aria-current="page"]');
      check(nav.getAttribute('aria-label') === 'Report pages' && nav.querySelector('ul').getAttribute('role') === 'list', 'Named native navigation and explicit list semantics on page ' + (index + 1) + (nojs ? ' without scripts.' : '.'));
      check(current.length === 1 && current[0].textContent === String(index + 1) && current[0].href.includes('pagination-' + index + '.html'), 'One real current-page link agrees with results.');
      check(doc.querySelector('#reports').textContent.includes('page ' + (index + 1) + ' of 5') && doc.querySelector('section > ul').children.length === 2, 'Destination contains its own result heading and records.');
      check(!!nav.querySelector('[rel="prev"]') === (index > 0) && !!nav.querySelector('[rel="next"]') === (index < 4), 'Unavailable previous/next links are omitted at boundaries.');
      check(links.every(link => link.getAttribute('href').startsWith('pagination-') && link.hash === '#reports') && !pager.querySelector('[aria-disabled],[disabled],[tabindex],[role="tab"],[role="menu"]'), 'Links retain real destinations without disabled/composite behavior.');
      check(links.filter(link => /^\d+$/.test(link.textContent)).every(link => link.getAttribute('aria-label') === 'Page ' + link.textContent), 'Number-only links have useful page names.');
      check([...nav.querySelectorAll('span')].every(span => span.textContent === '…' && !span.closest('a') && !span.hasAttribute('tabindex')), 'Ellipses remain text outside the focus order.');
      if (index < 4) {
        const oldResults = doc.querySelector('section > ul').textContent;
        await navigate(nav.querySelector('[rel="next"]'));
        check(doc.querySelector('section > ul').textContent !== oldResults && win.location.pathname.endsWith('pagination-' + (index + 1) + '.html'), 'Next opens a different real result document' + (nojs ? ' with scripts blocked.' : '.'));
        check(doc.activeElement === doc.querySelector('#reports'), 'The browser focuses the authored destination heading fragment.');
      }
    }
    await navigate(doc.querySelector('[rel="prev"]')); check(doc.querySelector('#reports').textContent.includes('page 4 of 5'), 'Previous navigates to the real preceding result page.');
  }
  await load(2); const pager = doc.querySelector('ui-pagination'), original = pager.outerHTML, current = pager.querySelector('[aria-current]');
  check(!win.customElements.get('ui-pagination') && !pager.hasAttribute('data-ui-ready'), 'No registration or enhancement readiness.');
  for (const value of ['ArrowLeft', 'ArrowRight', 'Home', 'End', ' ', 'Escape']) { const event = new win.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }); current.dispatchEvent(event); check(!event.defaultPrevented, value + ': browser keyboard behavior remains native.'); }
  win.UI.enhance(pager); win.UI.destroy(pager); check(pager.outerHTML === original, 'Shared lifecycle leaves authored pagination untouched.');
  const form = doc.createElement('form'); form.innerHTML = '<label for="answer">Reference</label><input id="answer" name="reference" value="COAST-01" required><button type="reset">Reset</button>'; doc.querySelector('main').append(form); form.append(pager); form.elements.reference.value = 'Retained'; win.UI.enhance(pager); win.UI.destroy(pager);
  check(new win.FormData(form).get('reference') === 'Retained' && form.elements.reference.willValidate, 'Pagination preserves native values and validation in its containing form.'); form.reset(); check(form.elements.reference.value === 'COAST-01', 'Native reset remains independent of current page.');
  const replacement = pager.cloneNode(true); pager.replaceWith(replacement); win.UI.enhance(replacement); check(replacement.outerHTML === original && !replacement.hasAttribute('data-ui-ready'), 'Replacement needs no component lifecycle or generated state.');
  const oldList = replacement.querySelector('ul'), ordered = doc.createElement('ol'); ordered.setAttribute('role', 'list'); ordered.append(...oldList.childNodes); oldList.replaceWith(ordered);
  check(win.getComputedStyle(ordered).display === 'flex' && ordered.querySelector('[aria-current="page"]'), 'Ordered native lists retain pagination layout and current-page semantics.');
  for (const link of [...ordered.querySelectorAll('a')]) if (!link.rel) link.parentElement.remove(); for (const span of [...ordered.querySelectorAll('span')]) span.parentElement.remove();
  check(ordered.querySelector('[rel="prev"]') && ordered.querySelector('[rel="next"]') && !ordered.querySelector('[aria-current]'), 'Unknown-total previous/next navigation needs no invented current-page destination.');
  await load(6); check(doc.querySelector('ui-pagination a').getAttribute('aria-current') === 'page' && !doc.querySelector('[rel="prev"],[rel="next"]'), 'Single-page fixture has one current link and no boundaries.'); check(!doc.querySelector('[aria-labelledby="empty-results"] ui-pagination'), 'No-results content omits unavailable navigation.');
  frame.style.inlineSize = '320px';
  for (const nojs of [false, true]) for (const index of [0, 2, 4, 5]) {
    await load(index, nojs);
    for (const brand of ['', 'forest']) for (const mode of ['light', 'dark']) for (const dir of ['ltr', 'rtl']) {
      doc.documentElement.dataset.brand = brand; doc.documentElement.dataset.theme = mode; doc.documentElement.dir = dir; doc.documentElement.style.fontSize = '200%'; doc.body.style.cssText = 'line-height:1.5;letter-spacing:.12em;word-spacing:.16em'; await settle();
      const pageLinks = [...doc.querySelectorAll('ui-pagination a')];
      check(doc.documentElement.scrollWidth <= doc.documentElement.clientWidth + 1 && pageLinks.every(link => { const r = link.getBoundingClientRect(); return r.width >= 43 && r.height >= 43; }), (nojs ? 'No script' : 'Hosted') + '/' + index + '/' + (brand || 'default') + '/' + mode + '/' + dir + ': enlarged 320px reflow and link targets.');
      const active = doc.querySelector('ui-pagination [aria-current]'), style = win.getComputedStyle(active); check(style.fontWeight >= 600 && parseFloat(style.borderBottomWidth) > 0 && style.borderBottomStyle === 'solid', 'Current-page marker remains persistent beyond color.');
    }
  }
  frame.style.inlineSize = '100%'; return passed;
}
document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('#run'), frame = document.querySelector('#pagination-frame');
  button.addEventListener('click', async () => {
    button.disabled = true; document.querySelector('#assertions').replaceChildren();
    try { const passed = await runPaginationChecks(frame); document.querySelector('#results').textContent = 'PASS: ' + passed.length + ' Pagination checks. ' + frame.contentWindow.navigator.userAgent; for (const message of passed) { const li = document.createElement('li'); li.textContent = message; document.querySelector('#assertions').append(li); } }
    catch (error) { document.querySelector('#results').textContent = 'FAIL: ' + error.message; }
    finally { button.disabled = false; frame.style.inlineSize = '100%'; document.querySelector('#results-title').focus(); }
  });
});
