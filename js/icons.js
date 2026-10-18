// Internal local-SVG loader for the shared entry. No custom-element registration.
(() => {
  const key = Symbol.for('ui.icons.runtime');
  if (globalThis[key]) return;
  const doc = document, script = doc.currentScript, records = new Map(), cache = new Map(), pending = new Map(), stopped = new WeakSet();
  const namespace = 'http://www.w3.org/2000/svg', limit = 256 * 1024;
  const identifier = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
  const tags = new Set(['svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon']);
  const attributes = new Set(['viewBox', 'width', 'height', 'd', 'points', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'transform', 'fill', 'fill-rule', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-opacity', 'opacity', 'vector-effect']);
  let base = null, lifetime = null;
  try {
    base = script?.hasAttribute('data-ui-icons-base') ? new URL(script.getAttribute('data-ui-icons-base'), doc.baseURI) : new URL('../icons/', script?.src || doc.baseURI);
    if (!/^https?:$/.test(base.protocol) || base.origin !== globalThis.origin || base.username || base.password || base.search || base.hash || !base.pathname.endsWith('/')) base = null;
  } catch { /* Invalid deployment configuration keeps authored fallback. */ }
  function parse(source) {
    if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error('Unsupported SVG declaration.');
    const parsed = new DOMParser().parseFromString(source, 'image/svg+xml'), root = parsed.documentElement;
    if (root.localName !== 'svg' || root.namespaceURI !== namespace || parsed.querySelector('parsererror')) throw new Error('Invalid SVG.');
    const box = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    if (box.length !== 4 || box.some(value => !Number.isFinite(value)) || box[2] <= 0 || box[3] <= 0) throw new Error('Invalid SVG viewBox.');
    let drawings = 0;
    const copy = (node, depth = 0) => {
      if (depth > 32 || node.namespaceURI !== namespace || !tags.has(node.localName) || depth && node.localName === 'svg') throw new Error('Unsupported SVG element.');
      const result = doc.createElementNS(namespace, node.localName);
      for (const attribute of node.attributes) {
        const { name, value } = attribute;
        if (name === 'xmlns' && value === namespace) continue;
        if (!attributes.has(name) || attribute.namespaceURI || /url\s*\(|[<>&]/i.test(value)) throw new Error('Unsupported SVG attribute.');
        if (['fill', 'stroke'].includes(name) && !/^(?:[a-z]+|#[\da-f]{3,8}|(?:rgb|rgba|hsl|hsla)\([\d\s.,%+\/-]+\))$/i.test(value)) throw new Error('Unsupported SVG paint.');
        if (['fill-opacity', 'stroke-opacity', 'opacity', 'stroke-width', 'stroke-miterlimit', 'stroke-dashoffset'].includes(name) && (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?%?$/i.test(value) || !Number.isFinite(Number.parseFloat(value)))) throw new Error('Invalid numeric paint.');
        if (name === 'viewBox' && depth) throw new Error('Nested viewBox.');
        result.setAttribute(name, value);
      }
      if (!['svg', 'g'].includes(node.localName)) drawings++;
      for (const child of node.childNodes) {
        if (child.nodeType === 1) result.append(copy(child, depth + 1));
        else if (child.nodeType !== 8 && (child.nodeType !== 3 || child.textContent.trim())) throw new Error('Unsupported SVG content.');
      }
      return result;
    };
    const svg = copy(root);
    if (!drawings) throw new Error('Empty SVG.');
    if (!svg.hasAttribute('fill')) svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('width', '1em'); svg.setAttribute('height', '1em');
    svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false'); svg.setAttribute('data-ui-icon-svg', '');
    return svg;
  }
  function asset(url) {
    if (cache.has(url)) { const svg = cache.get(url); cache.delete(url); cache.set(url, svg); return Promise.resolve(svg); }
    if (pending.has(url)) return pending.get(url);
    if (pending.size >= 256) return Promise.reject(new Error('Too many pending icons.'));
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15000);
    const task = (async () => {
      const response = await fetch(url, { signal: controller.signal, credentials: 'same-origin', redirect: 'error' });
      if (!response.ok || !/^(?:image\/svg\+xml|application\/xml|text\/xml)(?:;|$)/i.test(response.headers.get('Content-Type') || '') || Number(response.headers.get('Content-Length')) > limit) throw new Error('Unavailable SVG.');
      // Bound streamed bytes too, including when Content-Length is absent or inaccurate.
      if (!response.body?.getReader) throw new Error('SVG streaming unavailable.');
      const reader = response.body.getReader(), decoder = new TextDecoder();
      let source = '', bytes = 0;
      try {
        for (;;) {
          const { value, done } = await reader.read(); if (done) break;
          bytes += value.byteLength;
          if (bytes > limit) { controller.abort(); throw new Error('SVG too large.'); }
          source += decoder.decode(value, { stream: true });
        }
        source += decoder.decode();
      } finally { reader.releaseLock(); }
      const svg = parse(source); cache.set(url, svg);
      if (cache.size > 256) cache.delete(cache.keys().next().value);
      return svg;
    })().finally(() => { clearTimeout(timer); pending.delete(url); });
    pending.set(url, task); return task;
  }
  function write(record, node, name, value) {
    let writes = record.writes.get(node);
    if (!writes) { writes = new Map(); record.writes.set(node, writes); }
    if (!writes.has(name)) writes.set(name, { before: node.getAttribute(name), last: value });
    else writes.get(name).last = value;
    if (node.getAttribute(name) === value) return;
    if (value === null) node.removeAttribute(name); else node.setAttribute(name, value);
  }
  function semantics(record) {
    const label = record.host.getAttribute('label')?.trim();
    write(record, record.host, 'aria-hidden', label ? null : 'true');
    write(record, record.host, 'role', label ? 'img' : null);
    write(record, record.host, 'aria-label', label || null);
  }
  function fallback(record) {
    record.svg?.remove(); record.svg = null;
    if (record.fallback) write(record, record.fallback, 'hidden', record.fallbackHidden);
  }
  function load(record, retry = false) {
    const { host } = record;
    semantics(record);
    const name = host.getAttribute('name') || '', explicitLibrary = host.hasAttribute('library'), library = host.getAttribute('library');
    const signature = JSON.stringify([name, explicitLibrary, library]);
    if (record.signature === signature && !retry) return;
    record.signature = signature; const version = ++record.version;
    fallback(record);
    if (!base || !identifier.test(name) || explicitLibrary && !identifier.test(library)) { write(record, host, 'data-ui-icon-state', 'error'); return; }
    write(record, host, 'data-ui-icon-state', 'loading');
    const current = () => records.get(host) === record && record.version === version && host.isConnected && host.ownerDocument === doc && host.getAttribute('name') === name && host.hasAttribute('library') === explicitLibrary && (!explicitLibrary || host.getAttribute('library') === library);
    asset(new URL(`${explicitLibrary ? `${library}/` : ''}${name}.svg`, base).href).then(template => {
      if (!current()) return;
      record.svg = template.cloneNode(true); host.append(record.svg);
      if (record.fallback) write(record, record.fallback, 'hidden', '');
      write(record, host, 'data-ui-icon-state', 'ready');
    }, () => { if (current()) write(record, host, 'data-ui-icon-state', 'error'); });
  }
  function release(record) {
    records.delete(record.host); record.version++; record.observer.disconnect(); record.svg?.remove();
    for (const [node, attrs] of record.writes) for (const [name, state] of attrs) {
      if (node.getAttribute(name) !== state.last) continue;
      if (state.before === null) node.removeAttribute(name); else node.setAttribute(name, state.before);
    }
    if (!records.size) { lifetime?.disconnect(); lifetime = null; }
  }
  const within = root => [...(root.nodeType === 1 && root.matches('ui-icon') ? [root] : []), ...root.querySelectorAll('ui-icon')];
  function enhance(root, automatic = false) {
    if (typeof fetch !== 'function' || typeof DOMParser !== 'function' || typeof MutationObserver !== 'function' || typeof AbortController !== 'function') return;
    for (const host of within(root)) {
      if (automatic && stopped.has(host)) continue;
      stopped.delete(host);
      if (!host.isConnected || host.ownerDocument !== doc) continue;
      const existing = records.get(host);
      if (existing) { load(existing, host.getAttribute('data-ui-icon-state') === 'error'); continue; }
      const children = [...host.childNodes];
      if (host.closest('svg') || host.parentElement?.closest('ui-icon') || children.some(node => node.nodeType !== 3 && (node.nodeType !== 1 || node.localName !== 'svg' || node.namespaceURI !== namespace) || node.nodeType === 3 && node.textContent.trim()) || host.children.length > 1 || host.querySelector('[data-ui-icon-svg]') || host.hasAttribute('aria-labelledby') || host.hasAttribute('tabindex') || host.querySelector('a,foreignObject,button,input,select,textarea,[tabindex],[contenteditable]')) continue;
      const record = { host, fallback: host.firstElementChild, fallbackHidden: host.firstElementChild?.getAttribute('hidden'), writes: new Map(), svg: null, signature: null, version: 0 };
      record.observer = new MutationObserver(() => load(record));
      record.observer.observe(host, { attributes: true, attributeFilter: ['name', 'library', 'label'] });
      records.set(host, record); load(record);
      if (!lifetime) {
        lifetime = new MutationObserver(() => { for (const record of records.values()) if (!record.host.isConnected || record.host.ownerDocument !== doc) release(record); });
        lifetime.observe(doc.documentElement, { childList: true, subtree: true });
      }
    }
  }
  function destroy(root) { for (const host of within(root)) stopped.add(host); for (const record of [...records.values()]) if (record.host === root || root.contains(record.host)) release(record); }
  globalThis[key] = Object.freeze({ enhance, destroy });
})();
