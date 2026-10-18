// Shared opt-in lifecycle for shipped behaviors. No application data or async ownership.
(() => {
  const key = Symbol.for('ui.enhancement.runtime');
  if (globalThis[key]) { globalThis.UI = globalThis[key]; return; }
  const doc = document, records = new Map(), stopped = new WeakSet();
  let lifetime = null, accordionEvents = null, accordionScroll = null;
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
  // Accordion composes content inside overlays; it does not own their close/focus actions.
  const own = (node, surface) => node.closest('[data-ui]:not(ui-accordion[data-ui="accordion"])') === surface;
  const accordionARIA = ['role', 'aria-expanded', 'aria-controls', 'aria-hidden', 'aria-disabled'];
  function accordionStructure(surface) {
    if (surface.localName !== 'ui-accordion' || surface.getAttribute('data-ui') !== 'accordion' || !surface.isConnected || surface.ownerDocument !== doc || typeof HTMLDetailsElement !== 'function' || typeof MutationObserver !== 'function' || typeof AbortController !== 'function' || typeof requestAnimationFrame !== 'function' || typeof cancelAnimationFrame !== 'function') return null;
    const items = [...surface.children], summaries = items.map(item => item.firstElementChild);
    if (!items.length || [...surface.childNodes].some(node => node.nodeType === 3 && node.textContent.trim()) || items.some((item, index) => item.localName !== 'details' || summaries[index]?.localName !== 'summary' || [...item.children].filter(node => node.localName === 'summary').length !== 1 || !summaries[index].textContent.trim() || summaries[index].querySelector('a[href],button,input,select,textarea,[tabindex],[contenteditable]'))) return null;
    if ([surface, ...items, ...summaries].some(node => accordionARIA.some(name => node.hasAttribute(name)))) return null;
    const name = items[0].getAttribute('name');
    if (name === '' || items.some(item => item.getAttribute('name') !== name) || name !== null && [...doc.querySelectorAll('details[name]')].some(item => item.getAttribute('name') === name && !items.includes(item))) return null;
    return { kind: 'accordion', items, summaries, name };
  }
  function accordionVisible(node) {
    if (!visible(node)) return false;
    for (let parent = node.parentElement; parent; parent = parent.parentElement) {
      if (parent.localName === 'details' && !parent.open && !parent.querySelector(':scope > summary')?.contains(node)) return false;
    }
    return true;
  }
  function cancelAccordionScroll() {
    if (accordionScroll) cancelAnimationFrame(accordionScroll.frame);
    accordionScroll = null;
  }
  function revealAccordionFragment() {
    cancelAccordionScroll();
    const hash = location.hash;
    if (!hash || hash.includes(':~:')) return;
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const targets = [...doc.querySelectorAll('[id]')].filter(node => node.id === id);
    if (targets.length !== 1) return;
    const target = targets[0];
    if (target.closest('[hidden],[inert]')) return;
    let record = null;
    for (let parent = target; parent; parent = parent.parentElement) {
      const candidate = records.get(parent);
      if (candidate?.config.kind === 'accordion' && candidate.config.items.some(item => item.contains(target))) { record = candidate; break; }
    }
    if (!record) return;
    const ancestors = [];
    for (let parent = target.parentElement; parent; parent = parent.parentElement) {
      if (parent.localName === 'details' && !parent.querySelector(':scope > summary')?.contains(target)) ancestors.push(parent);
    }
    for (const item of ancestors.reverse()) item.open = true;
    const pending = { record, frame: 0 };
    accordionScroll = pending;
    pending.frame = requestAnimationFrame(() => {
      if (accordionScroll !== pending) return;
      accordionScroll = null;
      if (record.alive && same(record.config, accordionStructure(record.surface)) && location.hash === hash && target.isConnected && target.ownerDocument === doc && record.surface.contains(target) && accordionVisible(target)) target.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
  }
  function accordionMonitor() {
    const active = [...records.values()].some(record => record.config.kind === 'accordion');
    if (active && !accordionEvents) {
      accordionEvents = new AbortController();
      window.addEventListener('hashchange', revealAccordionFragment, { signal: accordionEvents.signal });
      for (const type of ['pointerdown', 'keydown']) doc.addEventListener(type, cancelAccordionScroll, { capture: true, signal: accordionEvents.signal });
    } else if (!active && accordionEvents) { accordionEvents.abort(); accordionEvents = null; cancelAccordionScroll(); }
  }
  function installAccordion(surface, config) {
    if (surface.hasAttribute('data-ui-ready')) return;
    const record = { surface, config, events: new AbortController(), alive: true };
    const current = () => record.alive && same(config, accordionStructure(surface));
    try {
      config.items.forEach((item, index) => {
        const summary = config.summaries[index];
        summary.addEventListener('keydown', event => {
          if (!current() || event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !summary.contains(event.target) || event.target.closest('a[href],button,input,select,textarea,[contenteditable]')) return;
          if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
          const candidates = config.summaries.filter(accordionVisible), index = candidates.indexOf(summary);
          if (index < 0 || !candidates.length) return;
          const destination = candidates[event.key === 'Home' ? 0 : event.key === 'End' ? candidates.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + candidates.length) % candidates.length];
          if (focus(destination)) event.preventDefault();
        }, { signal: record.events.signal });
        item.addEventListener('toggle', event => {
          if (event.target !== item || !current() || item.open) return;
          const active = doc.activeElement;
          if (active && item.contains(active) && !summary.contains(active) && accordionVisible(summary)) focus(summary);
        }, { signal: record.events.signal });
      });
      records.set(surface, record);
      surface.setAttribute('data-ui-ready', '');
      monitor();
      revealAccordionFragment();
    } catch { release(record, false); }
  }
  function structure(surface) {
    const kind = surface.getAttribute('data-ui'), id = surface.id;
    if (kind === 'accordion') return accordionStructure(surface);
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
    if (a?.kind === 'accordion' || b?.kind === 'accordion') return a?.kind === b?.kind && a?.name === b?.name && ['items', 'summaries'].every(key => a[key].length === b[key].length && a[key].every((node, index) => node === b[key][index]));
    return a && b && ['kind', 'initial', 'placement', 'returnId'].every(key => a[key] === b[key]) && ['openers', 'closers'].every(key => a[key].length === b[key].length && a[key].every((node, index) => node === b[key][index]));
  }
  function monitor() {
    accordionMonitor();
    if (records.size && !lifetime) {
      lifetime = new MutationObserver(() => {
        for (const record of [...records.values()].reverse()) {
          if (record.config.kind === 'accordion') {
            if (!same(record.config, accordionStructure(record.surface))) release(record, false);
            continue;
          }
          const missing = record.config.openers.filter(node => !node.isConnected || node.ownerDocument !== doc);
          if (!record.surface.isConnected || record.surface.ownerDocument !== doc || record.config.kind === 'popup' && missing.length || !record.config.modal && missing.length === record.config.openers.length) release(record, false);
        }
      });
      lifetime.observe(doc.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['name', 'data-ui', ...accordionARIA] });
    } else if (!records.size && lifetime) { lifetime.disconnect(); lifetime = null; }
  }
  function release(record, recover = true) {
    if (!record.alive) return;
    record.alive = false;
    const { surface, config } = record;
    if (config.kind === 'accordion') {
      record.events.abort();
      if (accordionScroll?.record === record) cancelAccordionScroll();
      if (surface.getAttribute('data-ui-ready') === '') surface.removeAttribute('data-ui-ready');
      records.delete(surface); monitor();
      return;
    }
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
    if (config.kind === 'accordion') { installAccordion(surface, config); return; }
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
          if (!record.alive || closer.disabled || event.defaultPrevented || !own(closer, surface)) return;
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
      if (previous && same(previous.config, config) && surface.hasAttribute('data-ui-ready') && (config.kind === 'accordion' || config.modal || surface.popover === 'auto')) continue;
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
