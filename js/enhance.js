// Shared opt-in lifecycle for shipped behaviors. Applications retain business data and async form ownership.
(() => {
  const key = Symbol.for('ui.enhancement.runtime');
  if (globalThis[key]) { globalThis.UI = globalThis[key]; return; }
  const doc = document, records = new Map(), stopped = new WeakSet(), printedDrawers = new Set();
  let lifetime = null, revealEvents = null, revealScroll = null, invalidTarget = null;
  function rootNode(root) {
    if (root !== doc && (!(root instanceof Element || root instanceof DocumentFragment) || root.ownerDocument !== doc)) throw new TypeError('UI needs a root from this document.');
    return root;
  }
  function within(root, selector) {
    return [...(root.nodeType === 1 && root.matches(selector) ? [root] : []), ...root.querySelectorAll(selector)];
  }
  function deepestRecords() {
    const depth = node => { let value = 0; for (; node; node = node.parentElement) value++; return value; };
    return [...records.values()].sort((a, b) => depth(b.surface) - depth(a.surface));
  }
  function visible(node) {
    return node?.isConnected && !node.disabled && node.getClientRects().length && getComputedStyle(node).visibility === 'visible' && !node.closest('[hidden], [inert]');
  }
  function focus(node) { if (visible(node)) { node.focus(); return doc.activeElement === node; } return false; }
  // Composition wrappers do not take over a containing overlay’s close/focus actions.
  const own = (node, surface) => node.closest('[data-ui]:not(ui-accordion):not(ui-tabs),ui-drawer,ui-menu') === surface;
  const revealKey = Symbol.for('ui.reveal');
  function write(record, node, name, value) {
    let attributes = record.writes.get(node);
    if (!attributes) { attributes = new Map(); record.writes.set(node, attributes); }
    if (!attributes.has(name)) attributes.set(name, { before: node.getAttribute(name), last: value });
    else attributes.get(name).last = value;
    if (node.getAttribute(name) === value) return;
    if (value === null) node.removeAttribute(name); else node.setAttribute(name, value);
  }
  function restore(record) {
    for (const [node, attributes] of record.writes) for (const [name, state] of attributes) {
      if (node.getAttribute(name) !== state.last) continue;
      if (state.before === null) node.removeAttribute(name); else node.setAttribute(name, state.before);
    }
  }
  function uniqueID(id) {
    if (!id) return null;
    const found = [...doc.querySelectorAll('[id]')].filter(node => node.id === id);
    return found.length === 1 ? found[0] : null;
  }
  function fragmentTarget() {
    if (!location.hash || location.hash.includes(':~:')) return null;
    try { return uniqueID(decodeURIComponent(location.hash.slice(1))); } catch { return null; }
  }
  function ownedHidden(node) {
    for (const record of records.values()) if (record.config.kind === 'tabs' && record.config.panels.includes(node) && record.writes.get(node)?.get('hidden')?.last === '' && node.getAttribute('hidden') === '') return true;
    return false;
  }
  function unavailable(node) {
    for (let parent = node; parent; parent = parent.parentElement) if (parent.hasAttribute('inert') || parent.hasAttribute('hidden') && !ownedHidden(parent)) return true;
    return false;
  }
  function tabsStructure(surface, record = records.get(surface)) {
    if (surface.localName !== 'ui-tabs' || !surface.isConnected || surface.ownerDocument !== doc || typeof MutationObserver !== 'function' || typeof AbortController !== 'function' || typeof requestAnimationFrame !== 'function' || typeof cancelAnimationFrame !== 'function' || typeof CustomEvent !== 'function') return null;
    // Validate the authored baseline through our own writes, without removing live roles.
    const attr = (node, name) => {
      const state = record?.writes?.get(node)?.get(name);
      return state && node.getAttribute(name) === state.last ? state.before : node.getAttribute(name);
    };
    if (record?.writes) for (const [node, attrs] of record.writes) for (const [name, state] of attrs) if (node.getAttribute(name) !== state.last) return null;
    const [list, ...panels] = surface.children, tabs = list ? [...list.children] : [];
    const text = node => [...node.childNodes].some(child => child.nodeType === 3 && child.textContent.trim());
    if (!list?.matches('nav') || !panels.length || panels.length !== tabs.length || text(surface) || text(list) || panels.some(panel => panel.localName !== 'section')) return null;
    const names = (list.getAttribute('aria-labelledby') || '').trim().split(/\s+/).filter(Boolean);
    const name = list.getAttribute('aria-label')?.trim();
    if (names.length ? names.some(id => { const label = uniqueID(id); return !label?.textContent.trim() || list.contains(label) || unavailable(label); }) : !name) return null;
    const forbidden = ['role', 'tabindex', 'aria-selected', 'aria-controls', 'aria-expanded', 'aria-current', 'aria-disabled', 'aria-busy', 'disabled', 'hidden', 'inert', 'aria-hidden', 'data-ui-tabs-inactive'];
    if ([surface, list, ...tabs, ...panels].some(node => forbidden.some(key => attr(node, key) !== null)) || unavailable(surface)) return null;
    if ([list, ...tabs].some(node => attr(node, 'aria-orientation') !== null) || tabs.some(node => node.hasAttribute('aria-labelledby'))) return null;
    for (let index = 0; index < tabs.length; index++) {
      const tab = tabs[index], panel = panels[index], href = tab.getAttribute('href');
      if (tab.localName !== 'a' || !tab.textContent.trim() || uniqueID(tab.id) !== tab || uniqueID(panel.id) !== panel || !href?.startsWith('#') || href.includes(':~:') || tab.hasAttribute('target') || tab.hasAttribute('download') || tab.isContentEditable || tab.querySelector('a,button,input,select,textarea,[tabindex],[contenteditable]')) return null;
      try { if (decodeURIComponent(href.slice(1)) !== panel.id) return null; } catch { return null; }
    }
    return { kind: 'tabs', list, tabs, panels, activation: surface.getAttribute('data-activation') === 'automatic' ? 'automatic' : 'manual', orientation: surface.getAttribute('data-orientation') === 'vertical' ? 'vertical' : 'horizontal', signature: JSON.stringify([name, names, tabs.map(tab => [tab.id, tab.getAttribute('href')]), panels.map(panel => panel.id)]) };
  }
  function tabStop(record, tab) {
    for (const candidate of record.config.tabs) write(record, candidate, 'tabindex', candidate === tab ? '0' : '-1');
  }
  function selectTab(record, index, source, { moveFocus = false, destinationFocus = false, silent = false } = {}) {
    if (!record.alive || !same(record.config, tabsStructure(record.surface))) return false;
    const { tabs, panels } = record.config, previous = record.selected;
    if (index < 0 || index >= tabs.length) return false;
    if (previous !== index && panels[previous]?.querySelector('dialog[open],:popover-open')) return false;
    if (moveFocus || !destinationFocus && previous !== index && panels[previous]?.contains(doc.activeElement)) {
      record.selecting = true;
      const focused = focus(tabs[index]);
      record.selecting = false;
      if (!focused) { release(record, false); return false; }
      if (!record.alive || !same(record.config, tabsStructure(record.surface))) { release(record, false); return false; }
    }
    record.selected = index;
    tabs.forEach((tab, i) => {
      write(record, tab, 'aria-selected', i === index ? 'true' : 'false');
      write(record, panels[i], 'hidden', i === index ? null : '');
      write(record, panels[i], 'data-ui-tabs-inactive', i === index ? null : '');
    });
    tabStop(record, record.config.list.contains(doc.activeElement) ? doc.activeElement.closest('a') : tabs[index]);
    if (!silent && previous !== index) record.surface.dispatchEvent(new CustomEvent('ui-select', { bubbles: true, composed: true, detail: { tab: tabs[index], panel: panels[index], previousTab: tabs[previous], previousPanel: panels[previous], source } }));
    return record.alive;
  }
  // One synchronous ancestor path for fragments, invalid controls and summary links.
  function revealTarget(target, source = 'reveal', destinationFocus = false, installing = false) {
    cancelRevealScroll();
    if (!target?.isConnected || target.ownerDocument !== doc || unavailable(target)) return false;
    const path = [];
    for (let parent = target; parent; parent = parent.parentElement) path.push(parent);
    const choices = [];
    for (const parent of path.slice().reverse()) {
      const record = records.get(parent);
      if (record?.config.kind === 'tabs') {
        const index = record.config.panels.findIndex(panel => panel === target || panel.contains(target));
        if (index >= 0) {
          if (installing && index !== record.selected && record.config.panels[record.selected].contains(doc.activeElement)) return false;
          if (!same(record.config, tabsStructure(parent)) || record.selected !== index && record.config.panels[record.selected].querySelector('dialog[open],:popover-open')) return false;
          choices.push([record, index]);
        }
      }
    }
    for (const parent of path.reverse()) {
      if (parent.localName === 'details' && !parent.querySelector(':scope > summary')?.contains(target)) parent.open = true;
      const choice = choices.find(([record]) => record.surface === parent);
      if (choice && !selectTab(choice[0], choice[1], source, { destinationFocus })) return false;
    }
    return !!accordionVisible(target);
  }
  function installTabs(surface, config, resume = null) {
    if (surface.hasAttribute('data-ui-ready')) return;
    const target = fragmentTarget(), focused = config.panels.findIndex(panel => panel.contains(doc.activeElement));
    const initial = resume ? resume.index : focused >= 0 ? focused : Math.max(0, config.panels.findIndex(panel => target && panel.contains(target)));
    const record = { surface, config, events: new AbortController(), writes: new Map(), alive: true, selected: initial, selecting: false, focused: surface.contains(doc.activeElement) ? doc.activeElement : null };
    const listen = (node, type, handler, capture = false) => node.addEventListener(type, handler, { capture, signal: record.events.signal });
    const current = () => record.alive && same(config, tabsStructure(surface));
    const getTab = event => { const tab = event.target.closest?.('a'); return config.tabs.includes(tab) ? tab : null; };
    const ignored = event => event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
    records.set(surface, record);
    try {
      if (config.panels.some((panel, index) => index !== initial && panel.querySelector('dialog[open],:popover-open'))) { release(record, false); return; }
      listen(config.list, 'keydown', event => {
        const tab = getTab(event);
        if (!tab || !current() || ignored(event)) return;
        let index = config.tabs.indexOf(tab), next = index;
        const rtl = getComputedStyle(config.list).direction === 'rtl';
        if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = config.tabs.length - 1;
        else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectTab(record, index, 'activation'); return; }
        else if (config.orientation === 'vertical' && ['ArrowDown', 'ArrowUp'].includes(event.key)) next += event.key === 'ArrowDown' ? 1 : -1;
        else if (config.orientation === 'horizontal' && ['ArrowRight', 'ArrowLeft'].includes(event.key)) next += (event.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1);
        else return;
        next = (next + config.tabs.length) % config.tabs.length;
        if (focus(config.tabs[next]) && current()) { tabStop(record, config.tabs[next]); event.preventDefault(); }
      });
      listen(config.list, 'click', event => {
        const tab = getTab(event);
        if (!tab || !current() || ignored(event) || event.button !== 0) return;
        event.preventDefault();
        selectTab(record, config.tabs.indexOf(tab), 'activation', { moveFocus: event.isTrusted });
      });
      listen(config.list, 'focusin', event => {
        const tab = getTab(event);
        if (!tab || !current()) return;
        tabStop(record, tab);
        if (!record.selecting && config.activation === 'automatic') selectTab(record, config.tabs.indexOf(tab), 'activation');
      });
      listen(config.list, 'focusout', event => { if (!config.list.contains(event.relatedTarget) && current()) tabStop(record, config.tabs[record.selected]); });
      listen(doc, 'focusin', event => { record.focused = surface.contains(event.target) ? event.target : null; });
      write(record, config.list, 'role', 'tablist');
      write(record, config.list, 'aria-orientation', config.orientation);
      config.tabs.forEach((tab, index) => {
        write(record, tab, 'role', 'tab'); write(record, tab, 'aria-controls', config.panels[index].id);
        write(record, config.panels[index], 'role', 'tabpanel'); write(record, config.panels[index], 'aria-labelledby', tab.id); write(record, config.panels[index], 'tabindex', '0');
      });
      selectTab(record, initial, 'reconcile', { silent: true });
      write(record, surface, 'data-ui-ready', '');
      monitor();
      if (resume?.recover) focus(config.tabs[initial]);
      if (!resume) revealFragment(true, surface);
    } catch { release(record, false); }
  }
  const accordionARIA = ['role', 'aria-expanded', 'aria-controls', 'aria-hidden', 'aria-disabled'];
  function accordionStructure(surface) {
    if (surface.localName !== 'ui-accordion' || !surface.isConnected || surface.ownerDocument !== doc || typeof HTMLDetailsElement !== 'function' || typeof MutationObserver !== 'function' || typeof AbortController !== 'function' || typeof requestAnimationFrame !== 'function' || typeof cancelAnimationFrame !== 'function') return null;
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
  function cancelRevealScroll() {
    if (revealScroll) cancelAnimationFrame(revealScroll.frame);
    revealScroll = null;
  }
  function revealFragment(installing = false, scope = null) {
    const hash = location.hash, target = fragmentTarget();
    if (scope && (!target || !scope.contains(target))) return;
    cancelRevealScroll();
    if (!target || unavailable(target)) return;
    let record = null;
    for (let parent = target; parent; parent = parent.parentElement) {
      const candidate = records.get(parent);
      if (candidate && ['accordion', 'tabs'].includes(candidate.config.kind) && (candidate.config.items || candidate.config.panels).some(item => item === target || item.contains(target))) { record = candidate; break; }
    }
    if (!record || !revealTarget(target, 'fragment', false, installing === true)) return;
    const pending = { record, frame: 0 };
    revealScroll = pending;
    pending.frame = requestAnimationFrame(() => {
      if (revealScroll !== pending) return;
      revealScroll = null;
      if (record.alive && same(record.config, structure(record.surface)) && location.hash === hash && target.isConnected && target.ownerDocument === doc && record.surface.contains(target) && accordionVisible(target)) target.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
  }

  function revealMonitor() {
    const active = [...records.values()].some(record => ['accordion', 'tabs'].includes(record.config.kind));
    if (active && !revealEvents) {
      revealEvents = new AbortController();
      window.addEventListener('hashchange', revealFragment, { signal: revealEvents.signal });
      doc.addEventListener('invalid', event => {
        if (![...records.values()].some(record => record.config.kind === 'tabs' && record.config.panels.some(panel => panel.contains(event.target)))) return;
        if (event.target.closest('ui-form')?.form === event.target.form && event.target.form?.noValidate) return;
        if (invalidTarget) return;
        invalidTarget = event.target;
        revealTarget(invalidTarget, 'reveal', true);
        queueMicrotask(() => { invalidTarget = null; });
      }, { capture: true, signal: revealEvents.signal });
      for (const type of ['pointerdown', 'keydown']) doc.addEventListener(type, cancelRevealScroll, { capture: true, signal: revealEvents.signal });
    } else if (!active && revealEvents) { revealEvents.abort(); revealEvents = null; cancelRevealScroll(); }
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
      revealFragment(true, surface);
    } catch { release(record, false); }
  }
  const menuDisabled = node => node.matches(':disabled');
  function menuStructure(surface, record = records.get(surface)) {
    if (surface.localName !== 'ui-menu' || !surface.isConnected || surface.ownerDocument !== doc || !globalThis.UIPopup?.attach || typeof MutationObserver !== 'function' || typeof AbortController !== 'function' || !('popoverTargetElement' in HTMLButtonElement.prototype)) return null;
    const attr = (node, name) => {
      const state = record?.writes.get(node)?.get(name);
      return state && node.getAttribute(name) === state.last ? state.before : node.getAttribute(name);
    };
    if (record) for (const [node, attrs] of record.writes) for (const [name, state] of attrs) if (node.getAttribute(name) !== state.last) return null;
    const [trigger, list] = surface.children;
    const strayText = node => [...node.childNodes].some(child => child.nodeType === 3 && child.textContent.trim());
    if (surface.children.length !== 2 || trigger?.localName !== 'button' || trigger.getAttribute('type') !== 'button' || attr(trigger, 'hidden') === null || menuDisabled(trigger) || list?.localName !== 'ul' || typeof list.showPopover !== 'function' || typeof list.hidePopover !== 'function' || strayText(surface) || strayText(list)) return null;
    if (uniqueID(trigger.id) !== trigger || uniqueID(list.id) !== list || list.getAttribute('aria-labelledby') !== trigger.id || !trigger.textContent.trim() || trigger.querySelector('a,button,input,select,textarea,[tabindex],[contenteditable]')) return null;
    const rows = [...list.children], entries = rows.map(row => row.firstElementChild), items = entries.filter(node => node?.localName !== 'hr'), dividers = entries.filter(node => node?.localName === 'hr');
    if (!items.length || rows.some((row, i) => row.localName !== 'li' || row.children.length !== 1 || strayText(row) || !entries[i]?.matches('button[type="button"],button[type="submit"],button[type="reset"],a[href],hr'))) return null;
    if (entries[0]?.localName === 'hr' || entries.at(-1)?.localName === 'hr' || entries.some((entry, i) => entry.localName === 'hr' && entries[i - 1]?.localName === 'hr')) return null;
    const forbidden = ['role', 'tabindex', 'inert', 'aria-hidden', 'aria-disabled', 'aria-checked', 'aria-selected', 'aria-haspopup', 'aria-expanded', 'aria-controls', 'popover', 'popovertarget', 'popovertargetaction', 'data-ui'];
    if ([surface, trigger, list, ...rows, ...entries].some(node => forbidden.some(name => attr(node, name) !== null) || node !== trigger && attr(node, 'hidden') !== null || node.isContentEditable)) return null;
    if (unavailable(surface) || surface.closest('ui-menu ui-menu') || getComputedStyle(trigger).writingMode !== 'horizontal-tb' || getComputedStyle(list).writingMode !== 'horizontal-tb') return null;
    if (items.some(item => !menuLabel(item) || item.localName === 'a' && !item.getAttribute('href')?.trim() || item.querySelector('ui-menu,a,button,input,select,textarea,[tabindex],[contenteditable],[hidden],[inert]'))) return null;
    if (!items.some(item => !menuDisabled(item))) return null;
    return { kind: 'menu', trigger, list, rows, items, dividers, signature: JSON.stringify([trigger.id, list.id]) };
  }
  function menuLabel(item) {
    const ids = item.getAttribute('aria-labelledby')?.trim().split(/\s+/).filter(Boolean);
    if (ids?.length) {
      const labels = ids.map(uniqueID);
      if (labels.some(node => !node || unavailable(node))) return '';
      return labels.map(node => node.textContent.trim()).join(' ');
    }
    if (item.hasAttribute('aria-label')) return item.getAttribute('aria-label').trim();
    const text = node => node.nodeType === 3 ? node.textContent : node.nodeType === 1 && !node.matches('[hidden],[aria-hidden="true"],svg') ? [...node.childNodes].map(text).join('') : '';
    return text(item).trim();
  }
  function clearMenuInput(record) {
    clearTimeout(record.typeTimer); record.typeTimer = null; record.buffer = ''; record.space = null;
  }
  function menuFocus(record, item) {
    if (!record.alive || !record.config.list.matches(':popover-open') || !focus(item) || !record.alive) return false;
    // Scroll only the local menu; scrollIntoView can also jump the document.
    const list = record.config.list, box = item.getBoundingClientRect(), bounds = list.getBoundingClientRect();
    if (box.top < bounds.top + list.clientTop) list.scrollTop -= bounds.top + list.clientTop - box.top;
    else if (box.bottom > bounds.top + list.clientTop + list.clientHeight) list.scrollTop += box.bottom - (bounds.top + list.clientTop + list.clientHeight);
    return true;
  }
  function menuState(record, opening = false) {
    if (!record.alive || record.deferred) return;
    const { list, trigger, items } = record.config, open = list.matches(':popover-open');
    write(record, trigger, 'aria-expanded', String(open));
    if (!open) { clearMenuInput(record); record.intent = null; return; }
    if (opening) {
      if (!record.positioner.update() || !record.alive) return;
      const enabled = items.filter(item => !menuDisabled(item));
      const item = record.intent === 'last' ? enabled.at(-1) : enabled[0];
      record.intent = null;
      if (!menuFocus(record, item)) release(record);
    }
  }
  function menuRoles(record) {
    const { surface, config } = record;
    write(record, config.list, 'role', 'menu');
    config.rows.forEach(row => write(record, row, 'role', 'none'));
    config.items.forEach(item => { write(record, item, 'role', 'menuitem'); write(record, item, 'tabindex', '-1'); });
    write(record, surface, 'data-ui-ready', '');
  }
  function reconcileMenu(record, explicit = false) {
    const next = menuStructure(record.surface), previous = record.config;
    if (!next || next.trigger !== previous.trigger || next.list !== previous.list || next.signature !== previous.signature || !explicit && (next.items.some(item => !previous.items.includes(item)) || next.rows.some(row => !previous.rows.includes(row)))) { release(record); return; }
    const active = record.focused, recover = active && (menuDisabled(active) || !active.isConnected) && (doc.activeElement === active || doc.activeElement === doc.body);
    if (explicit || !same(previous, next)) clearMenuInput(record);
    for (const node of [...previous.rows, ...previous.items]) if (!next.rows.includes(node) && !next.items.includes(node)) {
      const writes = record.writes.get(node);
      if (writes) { restore({ writes: new Map([[node, writes]]) }); record.writes.delete(node); }
    }
    record.config = next;
    if (!record.deferred) {
      menuRoles(record);
      if (recover && next.list.matches(':popover-open')) {
        const index = previous.items.indexOf(active), enabled = next.items.filter(item => !menuDisabled(item));
        menuFocus(record, next.items.slice(Math.max(0, index)).find(item => !menuDisabled(item)) || enabled.at(-1));
      }
    }
  }
  function installMenu(surface, config) {
    if (surface.hasAttribute('data-ui-ready')) return;
    const record = { surface, config, events: new AbortController(), writes: new Map(), alive: true, generation: 0, buffer: '', typeTimer: null, space: null, intent: null, focused: null, positioner: null, deferred: config.list.contains(doc.activeElement) };
    const listen = (node, type, handler, capture = false) => node.addEventListener(type, handler, { capture, signal: record.events.signal });
    const current = () => {
      if (!record.alive || record.deferred) return false;
      if (!same(record.config, menuStructure(surface))) { release(record); return false; }
      return true;
    };
    const close = () => {
      if (!record.alive) return;
      const { list, trigger } = record.config;
      const held = list.contains(doc.activeElement);
      try { if (list.matches(':popover-open')) list.hidePopover(); } catch { release(record); return; }
      menuState(record);
      if (held && list.contains(doc.activeElement)) focus(trigger);
    };
    records.set(surface, record);
    try {
      if (record.deferred) {
        listen(config.list, 'focusout', () => queueMicrotask(() => {
          if (!record.alive || config.list.contains(doc.activeElement)) return;
          release(record, false);
          const next = menuStructure(surface);
          if (next) installMenu(surface, next);
        }));
        monitor(); return;
      }
      listen(config.list, 'beforetoggle', event => {
        if (event.target !== config.list || !record.alive) return;
        const generation = ++record.generation;
        clearMenuInput(record);
        const opening = event.newState === 'open';
        record.pendingFocus = opening ? generation : null;
        queueMicrotask(() => {
          if (!record.alive || record.generation !== generation) return;
          // Real input can run a microtask checkpoint before the native open completes.
          // Only the native toggle notification confirms that opening has finished.
          if (opening && event.defaultPrevented) { record.intent = null; record.pendingFocus = null; }
        });
      });
      listen(config.list, 'toggle', () => {
        const opening = record.pendingFocus === record.generation && config.list.matches(':popover-open');
        record.pendingFocus = null;
        menuState(record, opening);
        if (record.alive && !config.list.matches(':popover-open') && config.list.contains(doc.activeElement)) focus(config.trigger);
      });
      listen(config.trigger, 'click', event => {
        if (event.defaultPrevented || !current() || menuDisabled(config.trigger)) return;
        // Native restoration records the active invoker, including pointer/programmatic opening.
        focus(config.trigger);
        const generation = record.generation;
        queueMicrotask(() => {
          if (record.alive && generation === record.generation) menuState(record);
        });
      });
      listen(surface, 'keydown', event => {
        if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || !current()) return;
        const { trigger, list, items } = record.config, item = event.target.closest?.('button,a');
        if (item === trigger && !event.shiftKey && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
          event.preventDefault(); record.intent = event.key === 'ArrowUp' ? 'last' : 'first';
          if (list.matches(':popover-open')) { menuState(record, true); return; }
          try { trigger.click(); } catch { release(record); }
          return;
        }
        if (!items.includes(item) || !list.matches(':popover-open')) return;
        if (event.key === 'Tab') { clearMenuInput(record); return; }
        if (event.shiftKey && ['ArrowDown', 'ArrowUp', 'Home', 'End', ' '].includes(event.key)) return;
        const enabled = items.filter(node => !menuDisabled(node)), index = enabled.indexOf(item);
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
          clearMenuInput(record); event.preventDefault();
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length;
          menuFocus(record, enabled[next]); return;
        }
        if (event.key === ' ' && item.localName === 'a') { event.preventDefault(); if (!event.repeat) record.space = item; return; }
        if (event.key.length !== 1 || event.key === ' ') { clearMenuInput(record); return; }
        let locale = item.closest('[lang]')?.lang || doc.documentElement.lang || undefined;
        try { new Intl.Collator(locale); } catch { locale = undefined; }
        const normalize = text => text.normalize('NFC').toLocaleLowerCase(locale);
        const character = normalize(event.key);
        record.buffer += character;
        const repeated = [...record.buffer].every(char => char === character), query = repeated ? character : record.buffer;
        const candidates = repeated || query.length === character.length ? [...enabled.slice(index + 1), ...enabled.slice(0, index + 1)] : [item, ...enabled.slice(index + 1), ...enabled.slice(0, index)];
        const match = candidates.find(node => normalize(menuLabel(node)).startsWith(query));
        if (match) menuFocus(record, match);
        event.preventDefault(); clearTimeout(record.typeTimer);
        record.typeTimer = setTimeout(() => { record.buffer = ''; record.typeTimer = null; }, 500);
      });
      listen(config.list, 'keyup', event => {
        const item = record.space;
        if (event.key !== ' ' || !item) return;
        record.space = null;
        if (!event.defaultPrevented && !event.isComposing && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.target === item && doc.activeElement === item && current()) { event.preventDefault(); item.click(); }
      });
      const activations = new WeakSet();
      listen(config.list, 'click', event => {
        const item = event.target.closest?.('a,button');
        if (record.config.items.includes(item) && !menuDisabled(item)) activations.add(event);
      }, true);
      listen(config.list, 'click', event => {
        const item = event.target.closest?.('a,button');
        if (!record.config.items.includes(item) || !activations.has(event) || !current()) return;
        const generation = record.generation;
        // A task allows native activation/default validation and every click listener to finish.
        const timer = setTimeout(() => {
          record.tasks.delete(timer);
          if (record.alive && record.generation === generation) close();
        }, 0);
        record.tasks.add(timer);
      });
      listen(doc, 'focusin', event => {
        if (record.config.items.includes(event.target)) record.focused = event.target;
        else if (!record.config.list.contains(event.target)) {
          record.focused = null;
          if (event.target !== config.trigger) record.pendingFocus = null;
        }
      });
      listen(config.list, 'focusout', event => {
        record.space = null;
        if (config.list.contains(event.relatedTarget)) return;
        const generation = record.generation;
        const timer = setTimeout(() => {
          record.tasks.delete(timer);
          if (record.alive && record.generation === generation && !config.list.contains(doc.activeElement)) { clearMenuInput(record); close(); }
        }, 0);
        record.tasks.add(timer);
      });
      // A native top-layer box cannot participate in printed document flow.
      listen(window, 'beforeprint', () => { if (record.alive) close(); });
      record.tasks = new Set();
      write(record, config.trigger, 'popovertarget', config.list.id);
      write(record, config.trigger, 'aria-haspopup', 'menu');
      write(record, config.trigger, 'aria-controls', config.list.id);
      write(record, config.trigger, 'aria-expanded', 'false');
      write(record, config.list, 'popover', 'auto');
      record.positioner = UIPopup.attach({ anchor: config.trigger, surface: config.list, onUnavailable: () => release(record) });
      menuRoles(record);
      write(record, config.trigger, 'hidden', null);
      monitor();
    } catch { release(record, false); }
  }
  function drawerStructure(host, refreshing = false) {
    const dialogs = [...host.children].filter(node => node.localName === 'dialog'), dialog = dialogs[0];
    const placement = host.getAttribute('data-placement') ?? 'inline-end';
    if (!host.isConnected || host.ownerDocument !== doc || unavailable(host) || host.closest('dialog') || host.parentElement?.closest('ui-drawer') || host.querySelector('ui-drawer') || dialogs.length !== 1) return null;
    if (dialog.querySelector('dialog') || dialog.hasAttribute('data-ui') || dialog.hasAttribute('popover') || dialog.hidden || dialog.inert || uniqueID(dialog.id) !== dialog) return null;
    if (typeof dialog.showModal !== 'function' || typeof dialog.close !== 'function' || !('onbeforetoggle' in dialog) || !globalThis.MutationObserver || !globalThis.AbortController) return null;
    if (!['inline-start', 'inline-end', 'block-start', 'block-end'].includes(placement) || getComputedStyle(host).writingMode !== 'horizontal-tb') return null;
    const named = dialog.getAttribute('aria-label')?.trim() || dialog.getAttribute('aria-labelledby')?.trim().split(/\s+/).every(id => { const node = uniqueID(id); return node && dialog.contains(node) && !unavailable(node) && node.textContent.trim(); });
    const targets = [...dialog.querySelectorAll('[data-ui-focus]')].filter(node => own(node, host));
    const initial = targets[0];
    const openers = [...host.children].filter(node => node.matches('button[data-ui-open]'));
    const closers = [...dialog.querySelectorAll('button[data-ui-close],form[method="dialog"] button')].filter(node => own(node, host));
    const usable = node => !node.matches(':disabled') && !node.closest('[inert]') && getComputedStyle(node).visibility === 'visible';
    const focusable = initial && (initial.matches('h1,h2,h3,h4,h5,h6') && initial.hasAttribute('tabindex') && initial.tabIndex === -1 || initial.matches('button,input:not([type="hidden"]),select,textarea,a[href]') && initial.tabIndex >= -1 && initial.tabIndex <= 0);
    const active = records.get(host)?.config.kind === 'drawer' && dialog.matches(':modal');
    if (!named || targets.length !== 1 || !focusable || !usable(initial) || unavailable(initial)) return null;
    if (!active && (!openers.length || !openers.some(usable)) || openers.some(node => node.type !== 'button' || node.getAttribute('data-ui-open') !== dialog.id)) return null;
    if (!closers.length || closers.some(node => node.type !== 'button' && node.form?.method !== 'dialog') || !closers.some(node => usable(node) && (refreshing || !node.hidden || !host.hasAttribute('data-ui-ready')))) return null;
    return { kind: 'drawer', dialog, openers, closers, initial, placement, returnId: dialog.getAttribute('data-ui-return-focus') || '' };
  }
  function sameDrawer(a, b) {
    return b && a.dialog === b.dialog && a.initial === b.initial && a.openers.length === b.openers.length && a.closers.length === b.closers.length && ['openers', 'closers'].every(key => a[key].every((node, i) => node === b[key][i]));
  }
  function releaseDrawer(record, recover) {
    const { surface, config } = record, dialog = config.dialog;
    const held = dialog.contains(doc.activeElement) || config.openers.includes(doc.activeElement);
    record.generation++;
    record.events.abort();
    for (const child of deepestRecords()) if (child !== record && dialog.contains(child.surface)) release(child, false);
    if (dialog.open && dialog.matches(':modal')) dialog.close();
    // Native open is jointly owned for the active modal's lifetime; baseline is authored open.
    const state = record.writes.get(dialog)?.get('open');
    if (state) state.last = dialog.getAttribute('open');
    restore(record); records.delete(surface); monitor();
    if (recover && held && (!visible(doc.activeElement) || doc.activeElement === doc.body || config.openers.includes(doc.activeElement))) focus(config.initial);
  }
  function installDrawer(surface, config) {
    const dialog = config.dialog;
    if (surface.hasAttribute('data-ui-ready') || !dialog.open || dialog.matches(':modal') || dialog.contains(doc.activeElement) || config.openers.some(node => !node.hidden) || config.closers.some(node => !node.hidden)) return;
    const record = { surface, config, events: new AbortController(), writes: new Map(), alive: true, generation: 0, opener: null, pendingOpener: null };
    const listen = (node, name, callback) => node.addEventListener(name, callback, { signal: record.events.signal });
    records.set(surface, record);
    const fail = () => release(record);
    try {
      listen(dialog, 'beforetoggle', event => {
        if (event.target !== dialog || !record.alive) return;
        const generation = ++record.generation;
        if (event.newState !== 'open') return;
        record.openEvent = event;
        record.opener = record.pendingOpener;
        record.previousFocus = doc.activeElement;
        queueMicrotask(() => {
          if (!record.alive || record.generation !== generation || !dialog.matches(':modal')) return;
          dialog.returnValue = '';
          focus(record.config.initial); dialog.scrollTop = 0;
        });
      });
      listen(surface, 'click', event => {
        const opener = event.target.closest?.('button');
        if (!record.config.openers.includes(opener) || !record.alive || event.defaultPrevented || opener.disabled || dialog.matches(':modal')) return;
        // Do not stack a second modal task or promote an independently opened non-modal dialog.
        if (dialog.open || doc.querySelector('dialog:modal')) return;
        opener.focus(); record.pendingOpener = opener; record.openEvent = null;
        try {
          dialog.showModal();
          if (dialog.matches(':modal')) { dialog.returnValue = ''; focus(record.config.initial); dialog.scrollTop = 0; }
          else if (dialog.open) fail();
          else if (!record.openEvent?.defaultPrevented) fail();
        } catch { fail(); }
        finally { record.pendingOpener = null; record.openEvent = null; }
      });
      listen(surface, 'click', event => {
        const closer = event.target.closest?.('button');
        if (!record.config.closers.includes(closer) || event.defaultPrevented || !record.alive || closer.disabled || !own(closer, surface) || closer.form?.method === 'dialog') return;
        if (dialog.matches(':modal')) dialog.close(closer.value || 'close');
      });
      listen(dialog, 'close', event => {
        if (event.target !== dialog || !record.alive || dialog.open) return;
        const active = doc.activeElement;
        if (dialog.contains(active) || active === doc.body || !visible(active)) {
          const destination = record.opener || record.previousFocus;
          if (!focus(destination) && !focus(uniqueID(record.config.returnId))) fail();
        }
        if (record.alive && !drawerStructure(surface)) release(record, false);
      });
      listen(globalThis, 'beforeprint', () => { printedDrawers.add(surface); release(record, false); });
      write(record, dialog, 'open', null);
      write(record, surface, 'data-ui-ready', '');
      for (const node of [...config.openers, ...config.closers]) write(record, node, 'hidden', null);
      monitor();
    } catch { release(record, false); }
  }
  function reconcileDrawer(record, explicit) {
    const config = drawerStructure(record.surface, explicit);
    if (sameDrawer(record.config, config)) { record.config = config; return; }
    if (explicit && config?.dialog === record.config.dialog) {
      const next = [...config.openers, ...config.closers];
      for (const node of [...record.config.openers, ...record.config.closers]) if (!next.includes(node)) {
        const state = record.writes.get(node)?.get('hidden');
        if (state && node.getAttribute('hidden') === state.last) {
          if (state.before === null) node.removeAttribute('hidden'); else node.setAttribute('hidden', state.before);
        }
        record.writes.delete(node);
      }
      for (const node of next) write(record, node, 'hidden', null);
      record.config = config;
      return;
    }
    // Losing invokers does not interrupt an active modal; close recovery uses a surviving target.
    if (!explicit && config?.dialog === record.config.dialog && config.initial === record.config.initial && config.closers.length === record.config.closers.length && config.closers.every((node, i) => node === record.config.closers[i]) && record.config.dialog.matches(':modal')) return;
    release(record);
    if (explicit && config) installDrawer(record.surface, config);
  }
  function structure(surface) {
    if (surface.localName === 'ui-drawer') return drawerStructure(surface);
    if (surface.localName === 'ui-menu') return menuStructure(surface);
    if (surface.localName === 'ui-tabs') return tabsStructure(surface);
    if (surface.localName === 'ui-accordion') return accordionStructure(surface);
    const kind = surface.getAttribute('data-ui'), id = surface.id;
    if (kind === 'dialog' && surface.parentElement?.localName === 'ui-drawer') return null;
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
    if (a?.kind === 'menu' || b?.kind === 'menu') return a?.kind === b?.kind && a?.trigger === b?.trigger && a?.list === b?.list && a?.signature === b?.signature && ['items', 'rows', 'dividers'].every(key => a[key].length === b[key].length && a[key].every((node, i) => node === b[key][i]));
    if (a?.kind === 'tabs' || b?.kind === 'tabs') return a?.kind === b?.kind && a?.list === b?.list && ['activation', 'orientation', 'signature'].every(key => a[key] === b[key]) && ['tabs', 'panels'].every(key => a[key].length === b[key].length && a[key].every((node, index) => node === b[key][index]));
    if (a?.kind === 'accordion' || b?.kind === 'accordion') return a?.kind === b?.kind && a?.name === b?.name && ['items', 'summaries'].every(key => a[key].length === b[key].length && a[key].every((node, index) => node === b[key][index]));
    return a && b && ['kind', 'initial', 'placement', 'returnId'].every(key => a[key] === b[key]) && ['openers', 'closers'].every(key => a[key].length === b[key].length && a[key].every((node, index) => node === b[key][index]));
  }
  function monitor() {
    revealMonitor();
    if (records.size && !lifetime) {
      lifetime = new MutationObserver(() => {
        for (const record of deepestRecords()) {
          if (record.config.kind === 'drawer') { reconcileDrawer(record, false); continue; }
          if (record.config.kind === 'menu') { reconcileMenu(record); continue; }
          if (record.config.kind === 'tabs') {
            if (!same(record.config, tabsStructure(record.surface))) reconcileTabs(record, false);
            continue;
          }
          if (record.config.kind === 'accordion') {
            if (!same(record.config, accordionStructure(record.surface))) release(record, false);
            continue;
          }
          const missing = record.config.openers.filter(node => !node.isConnected || node.ownerDocument !== doc);
          if (!record.surface.isConnected || record.surface.ownerDocument !== doc || record.config.kind === 'popup' && missing.length || !record.config.modal && missing.length === record.config.openers.length) release(record, false);
        }
      });
      lifetime.observe(doc.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['type', 'popover', 'popovertarget', 'popovertargetaction', 'aria-checked', 'aria-haspopup', 'lang', 'dir', 'name', 'id', 'href', 'hidden', 'inert', 'tabindex', 'target', 'download', 'contenteditable', 'disabled', 'aria-busy', 'aria-label', 'aria-labelledby', 'aria-selected', 'aria-orientation', 'aria-current', 'data-ui-tabs-inactive', 'data-ui-ready', 'data-activation', 'data-orientation', 'data-placement', 'data-ui-focus', 'data-ui-return-focus', 'data-ui-close', 'data-ui-open', 'data-ui', ...accordionARIA] });
    } else if (!records.size && lifetime) { lifetime.disconnect(); lifetime = null; }
  }
  function release(record, recover = true) {
    if (!record.alive) return;
    record.alive = false;
    const { surface, config } = record;
    if (config.kind === 'drawer') { releaseDrawer(record, recover); return; }
    if (config.kind === 'menu') {
      record.events.abort(); clearMenuInput(record);
      record.tasks?.forEach(clearTimeout);
      const held = config.list.contains(doc.activeElement) || doc.activeElement === config.trigger;
      try { if (config.list.matches(':popover-open')) config.list.hidePopover(); } catch { /* Detached native state is already unavailable. */ }
      record.positioner?.destroy();
      // Reveal inline content before a focused enhancement-only trigger disappears.
      const hidden = record.writes.get(config.trigger)?.get('hidden');
      if (hidden && config.trigger.getAttribute('hidden') === hidden.last) config.trigger.setAttribute('hidden', hidden.before);
      restore(record); records.delete(surface); monitor();
      if (recover && held && !config.list.contains(doc.activeElement)) focus(config.items.find(item => !menuDisabled(item)));
      return;
    }
    if (config.kind === 'tabs') {
      record.events.abort();
      if (revealScroll?.record === record) cancelRevealScroll();
      restore(record);
      records.delete(surface); monitor();
      return;
    }
    if (config.kind === 'accordion') {
      record.events.abort();
      if (revealScroll?.record === record) cancelRevealScroll();
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
  function reconcileTabs(record, explicit) {
    const { surface, config } = record, selectedTab = config.tabs[record.selected];
    const recover = record.focused && !record.focused.isConnected && doc.activeElement === doc.body;
    // Release first so validation sees the current authored baseline.
    release(record, false);
    const next = tabsStructure(surface);
    if (!next) return;
    const removedOnly = next.tabs.length < config.tabs.length && next.activation === config.activation && next.orientation === config.orientation && next.tabs.every((tab, i) => { const old = config.tabs.indexOf(tab); return old >= 0 && config.panels[old] === next.panels[i]; });
    if (!explicit && !removedOnly) return;
    const surviving = next.tabs.indexOf(selectedTab);
    const index = surviving >= 0 ? surviving : Math.min(record.selected, next.tabs.length - 1);
    installTabs(surface, next, { index, recover });
    const installed = records.get(surface);
    if (installed && surviving < 0) surface.dispatchEvent(new CustomEvent('ui-select', { bubbles: true, composed: true, detail: { tab: next.tabs[index], panel: next.panels[index], previousTab: selectedTab, previousPanel: config.panels[record.selected], source: 'reconcile' } }));
  }
  function install(surface, config) {
    if (config.kind === 'drawer') { installDrawer(surface, config); return; }
    if (config.kind === 'menu') { installMenu(surface, config); return; }
    if (config.kind === 'tabs') { installTabs(surface, config); return; }
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
    globalThis[Symbol.for('ui.icons.runtime')]?.enhance(root, automatic);
    for (const node of within(root, 'ui-error-summary,ui-form')) if (node.isConnected && (!automatic || !node._uiSuspended)) node._uiResume?.();
    for (const surface of within(root, '[data-ui],ui-tabs,ui-accordion,ui-menu,ui-drawer')) {
      if (automatic && stopped.has(surface)) continue;
      stopped.delete(surface);
      const config = structure(surface), previous = records.get(surface);
      if (previous?.config.kind === 'drawer') { reconcileDrawer(previous, true); continue; }
      if (previous?.config.kind === 'menu') { reconcileMenu(previous, true); continue; }
      if (previous && same(previous.config, config) && surface.hasAttribute('data-ui-ready') && (['accordion', 'tabs'].includes(config.kind) || config.modal || surface.popover === 'auto')) continue;
      if (previous?.config.kind === 'tabs') { reconcileTabs(previous, true); continue; }
      if (previous) release(previous, false);
      if (config) install(surface, config);
    }
  }
  function enhance(root = doc) { initialize(root); }
  function destroy(root = doc) {
    rootNode(root);
    for (const surface of printedDrawers) if (surface === root || root.contains(surface)) printedDrawers.delete(surface);
    globalThis[Symbol.for('ui.icons.runtime')]?.destroy(root);
    for (const surface of within(root, '[data-ui],ui-tabs,ui-accordion,ui-menu,ui-drawer')) stopped.add(surface);
    for (const record of deepestRecords()) if (record.surface === root || root.contains(record.surface)) release(record);
    for (const node of within(root, 'ui-form,ui-error-summary').reverse()) node._uiSuspend?.();
  }
  globalThis[revealKey] = target => revealTarget(target, 'reveal', true);
  globalThis.UI = globalThis[key] = Object.freeze({ enhance, destroy, popup: globalThis.UIPopup });
  globalThis.addEventListener('afterprint', () => {
    const surfaces = [...printedDrawers]; printedDrawers.clear();
    for (const surface of surfaces) if (surface.isConnected && surface.ownerDocument === doc && !stopped.has(surface)) initialize(surface);
  });
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', () => initialize(doc, true), { once: true });
  else queueMicrotask(() => initialize(doc, true));
})();
