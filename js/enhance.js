// Shared opt-in lifecycle for shipped behaviors. No application data or async ownership.
(() => {
  const key = Symbol.for('ui.enhancement.runtime');
  if (globalThis[key]) { globalThis.UI = globalThis[key]; return; }
  const doc = document, records = new Map(), stopped = new WeakSet();
  let lifetime = null;
  function rootNode(root) {
    if (root !== doc && (!(root instanceof Element || root instanceof DocumentFragment) || root.ownerDocument !== doc)) throw new TypeError('UI needs a root from this document.');
    return root;
  }
  function within(root, selector) {
    return [...(root.nodeType === 1 && root.matches(selector) ? [root] : []), ...root.querySelectorAll(selector)];
  }
  function visible(node) {
    return node?.isConnected && !node.disabled && node.getClientRects().length && getComputedStyle(node).visibility === 'visible' && !node.closest('[hidden], [inert]');
  }
  function focus(node) { if (visible(node)) { node.focus(); return doc.activeElement === node; } return false; }
  const own = (node, surface) => node.closest('[data-ui]') === surface;
  function structure(surface) {
    const kind = surface.getAttribute('data-ui'), id = surface.id;
    if (!['dialog', 'popover', 'popup'].includes(kind) || !id || !surface.isConnected || surface.ownerDocument !== doc || doc.getElementById(id) !== surface || [...doc.querySelectorAll('[id]')].filter(node => node.id === id).length !== 1) return null;
    const modal = kind === 'dialog';
    if (modal && (surface.localName !== 'dialog' || typeof surface.showModal !== 'function' || typeof surface.close !== 'function')) return null;
    if (!modal && (typeof surface.showPopover !== 'function' || typeof surface.hidePopover !== 'function' || !('popoverTargetElement' in HTMLButtonElement.prototype))) return null;
    const openers = [...doc.querySelectorAll(modal ? 'button[data-ui-open]' : 'button[popovertarget]')].filter(button => modal ? button.getAttribute('data-ui-open') === id : button.popoverTargetElement === surface && button.popoverTargetAction === 'toggle');
    const closers = [...surface.querySelectorAll(modal ? 'button[data-ui-close], form[method="dialog"] button' : 'button[popovertarget]')].filter(button => own(button, surface) && (modal || button.popoverTargetElement === surface && button.popoverTargetAction === 'hide'));
    const targets = [...surface.querySelectorAll('[data-ui-focus]')].filter(node => own(node, surface));
    const initial = targets[0] || null;
    if (!openers.length || openers.some(button => surface.contains(button) || button.type !== 'button') || !closers.length || closers.some(button => button.type !== 'button' && (!modal || button.form?.method !== 'dialog')) || targets.length > 1 || modal && (!initial || !initial.hasAttribute('tabindex') && !initial.matches('button,input,select,textarea,a[href]') || !(surface.getAttribute('aria-label')?.trim() || surface.getAttribute('aria-labelledby')?.split(/\s+/).some(id => doc.getElementById(id)?.textContent.trim())))) return null;
    const placement = surface.getAttribute('data-ui-placement') || 'block-end-start';
    if (kind === 'popup' && (openers.length !== 1 || !globalThis.UIPopup?.attach || !['block-end-start', 'block-start-start'].includes(placement))) return null;
    return { kind, modal, openers, closers, initial, placement, returnId: surface.getAttribute('data-ui-return-focus') || '' };
  }
  function same(a, b) {
    return a && b && ['kind', 'initial', 'placement', 'returnId'].every(key => a[key] === b[key]) && ['openers', 'closers'].every(key => a[key].length === b[key].length && a[key].every((node, index) => node === b[key][index]));
  }
  function monitor() {
    if (records.size && !lifetime) {
      lifetime = new MutationObserver(() => {
        for (const record of [...records.values()].reverse()) {
          const missing = record.config.openers.filter(node => !node.isConnected || node.ownerDocument !== doc);
          if (!record.surface.isConnected || record.surface.ownerDocument !== doc || record.config.kind === 'popup' && missing.length || !record.config.modal && missing.length === record.config.openers.length) release(record, false);
        }
      });
      lifetime.observe(doc.documentElement, { childList: true, subtree: true });
    } else if (!records.size && lifetime) { lifetime.disconnect(); lifetime = null; }
  }
  function release(record, recover = true) {
    if (!record.alive) return;
    record.alive = false;
    const { surface, config } = record;
    const heldFocus = surface.contains(doc.activeElement) || config.openers.includes(doc.activeElement);
    record.events.abort(); record.positioner?.destroy();
    if (config.modal) { if (surface.open) surface.close(); }
    else if (surface.matches(':popover-open')) surface.hidePopover();
    // Open is native-owned while enhanced; release returns to the authored inline baseline.
    if (config.modal) record.lastOpen = surface.getAttribute('open');
    for (const [node, attributes] of record.writes) for (const [name, state] of attributes) {
      if (node.getAttribute(name) !== state.last && !(node === surface && name === 'open' && node.getAttribute(name) === record.lastOpen)) continue;
      if (state.before === null) node.removeAttribute(name); else node.setAttribute(name, state.before);
    }
    records.delete(surface); monitor();
    if (recover && heldFocus) focus(config.initial);
  }
  function install(surface, config) {
    // Do not silently take over an already-open native task or an authored hidden fallback.
    if (surface.hidden || config.modal && (!surface.open || surface.matches(':modal')) || !config.modal && surface.hasAttribute('popover') || surface.hasAttribute('data-ui-ready')) return;
    const record = { surface, config, events: new AbortController(), writes: new Map(), alive: true, opener: null, positioner: null };
    function write(node, name, value) {
      let attributes = record.writes.get(node);
      if (!attributes) { attributes = new Map(); record.writes.set(node, attributes); }
      if (!attributes.has(name)) attributes.set(name, { before: node.getAttribute(name), last: value });
      else attributes.get(name).last = value;
      if (value === null) node.removeAttribute(name); else node.setAttribute(name, value);
    }
    const fail = () => release(record);
    const listen = (node, name, callback) => node.addEventListener(name, callback, { signal: record.events.signal });
    records.set(surface, record);
    try {
      for (const opener of config.openers) listen(opener, 'click', () => {
        if (!record.alive || opener.disabled) return;
        if (!config.modal) { opener.focus(); return; }
        if (surface.open) return;
        opener.focus(); record.opener = opener; surface.returnValue = '';
        try {
          surface.showModal();
          if (surface.matches(':modal')) { focus(config.initial); surface.scrollTop = 0; return; }
        } catch { /* Failed native opening returns to the readable authored baseline. */ }
        fail();
      });
      if (config.modal) {
        for (const closer of config.closers) listen(closer, 'click', event => {
          if (!record.alive || closer.disabled || event.defaultPrevented || closer.closest('[data-ui]') !== surface) return;
          const form = closer.form;
          if (form && form.method === 'dialog') return;
          if (surface.open) surface.close(closer.value || 'close');
        });
        listen(surface, 'close', event => {
          if (!record.alive || event.target !== surface || surface.open) return;
          if (record.opener && !visible(record.opener)) {
            if (!focus(doc.getElementById(config.returnId))) { release(record, false); focus(config.initial); }
          }
        });
        write(surface, 'open', null);
      } else {
        write(surface, 'popover', 'auto');
        if (config.kind === 'popup') record.positioner = UIPopup.attach({ anchor: config.openers[0], surface, placement: config.placement, onUnavailable: fail });
      }
      write(surface, 'data-ui-ready', '');
      for (const button of [...config.openers, ...config.closers]) write(button, 'hidden', null);
      monitor();
    } catch { release(record, false); }
  }
  function initialize(root, automatic = false) {
    rootNode(root);
    for (const node of within(root, 'ui-error-summary,ui-form')) if (node.isConnected && (!automatic || !node._uiSuspended)) node._uiResume?.();
    for (const surface of within(root, '[data-ui]')) {
      if (automatic && stopped.has(surface)) continue;
      stopped.delete(surface);
      const config = structure(surface), previous = records.get(surface);
      if (previous && same(previous.config, config) && surface.hasAttribute('data-ui-ready') && (config.modal || surface.popover === 'auto')) continue;
      if (previous) release(previous, false);
      if (config) install(surface, config);
    }
  }
  function enhance(root = doc) { initialize(root); }
  function destroy(root = doc) {
    rootNode(root);
    for (const surface of within(root, '[data-ui]')) stopped.add(surface);
    for (const record of [...records.values()].reverse()) if (record.surface === root || root.contains(record.surface)) release(record);
    for (const node of within(root, 'ui-form,ui-error-summary').reverse()) node._uiSuspend?.();
  }
  globalThis.UI = globalThis[key] = Object.freeze({ enhance, destroy, popup: globalThis.UIPopup });
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', () => initialize(doc, true), { once: true });
  else queueMicrotask(() => initialize(doc, true));
})();
