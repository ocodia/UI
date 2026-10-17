// Optional experimental geometry. Native popover state and consumer interaction stay native.
(() => {
  const key = Symbol.for('ui.popup.adapter');
  if (globalThis[key]) { globalThis.UIPopup = globalThis[key]; return; }
  const owners = new WeakMap();
  const placements = ['block-end-start', 'block-start-start'];
  function attach(options) {
    if (!options || typeof options !== 'object' || Object.keys(options).some(key => !['anchor', 'surface', 'placement', 'gap', 'padding', 'onUnavailable'].includes(key))) throw new TypeError('Invalid Popup options.');
    let { anchor, surface, placement = 'block-end-start', gap = 8, padding = 8, onUnavailable = null } = options;
    let doc = anchor?.ownerDocument, win = doc?.defaultView;
    if (!win || !(anchor instanceof win.Element) || !(surface instanceof win.HTMLElement) || surface.ownerDocument !== doc || surface === anchor || surface.contains(anchor) || !anchor.isConnected || !surface.isConnected || surface.popover !== 'auto' || owners.has(surface) || ('popoverTargetElement' in anchor && anchor.popoverTargetElement !== surface)
      || !placements.includes(placement) || ![gap, padding].every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0) || onUnavailable !== null && typeof onUnavailable !== 'function') throw new TypeError('Popup needs unique connected nodes, an auto popover and valid options.');
    if (!win.ResizeObserver || !win.MutationObserver || !win.requestAnimationFrame || !win.cancelAnimationFrame || typeof surface.showPopover !== 'function' || typeof surface.hidePopover !== 'function' || win.getComputedStyle(anchor).writingMode !== 'horizontal-tb' || win.getComputedStyle(surface).writingMode !== 'horizontal-tb') throw new TypeError('Popup capabilities or writing mode unavailable.');
    options = null;

    let destroyed = false, frame = 0, tracking = null, resize = null, failure = null, expectedStyle = surface.getAttribute('style');
    const writes = new Map();
    const open = () => surface.matches(':popover-open');
    const read = property => [surface.style.getPropertyValue(property), surface.style.getPropertyPriority(property)];
    const same = (a, b) => a[0] === b[0] && a[1] === b[1];
    function set(property, value) {
      const current = read(property);
      let record = writes.get(property);
      if (!record) { record = { before: current, last: current }; writes.set(property, record); }
      // A later author write becomes the value restored on release.
      if (!same(current, record.last)) record.before = current;
      if (!same(current, [value, ''])) surface.style.setProperty(property, value);
      record.last = read(property);
    }
    function restore(properties = [...writes.keys()]) {
      for (const property of properties) {
        const record = writes.get(property);
        if (!record) continue;
        if (same(read(property), record.last)) {
          if (record.before[0]) surface.style.setProperty(property, ...record.before);
          else surface.style.removeProperty(property);
        }
        writes.delete(property);
      }
      expectedStyle = surface.getAttribute('style');
    }
    function stop() {
      if (frame) win.cancelAnimationFrame(frame);
      frame = 0;
      tracking?.abort(); tracking = null;
      resize?.disconnect(); resize = null;
    }
    function unavailable(reason) {
      stop(); restore();
      const notify = failure !== reason; failure = reason;
      if (notify) onUnavailable?.(reason);
      return false;
    }
    function validNodes() {
      if (!anchor.isConnected || anchor.ownerDocument !== doc) return 'anchor-unavailable';
      if (!surface.isConnected || surface.ownerDocument !== doc || surface.popover !== 'auto') return 'surface-unavailable';
      if ('popoverTargetElement' in anchor && anchor.popoverTargetElement !== surface) return 'anchor-unavailable';
      return null;
    }
    function viewport() {
      const v = win.visualViewport;
      return { left: Math.max(0, v?.offsetLeft || 0) + padding, top: Math.max(0, v?.offsetTop || 0) + padding,
        right: Math.min(doc.documentElement.clientWidth, v ? v.offsetLeft + v.width : win.innerWidth) - padding,
        bottom: Math.min(doc.documentElement.clientHeight, v ? v.offsetTop + v.height : win.innerHeight) - padding };
    }
    function unsupported(element) {
      const style = win.getComputedStyle(element);
      return style.writingMode !== 'horizontal-tb' || style.transform !== 'none' || style.translate && style.translate !== 'none' || style.rotate && style.rotate !== 'none' || style.scale && style.scale !== 'none' || style.zoom && !['1', 'normal'].includes(style.zoom) || style.clipPath !== 'none' || /paint|strict|content/.test(style.contain);
    }
    function update() {
      if (destroyed) return false;
      const invalid = validNodes();
      if (invalid) return unavailable(invalid);
      if (!open()) { stop(); restore(); failure = null; return false; }
      const bounds = viewport();
      if (bounds.right <= bounds.left || bounds.bottom <= bounds.top || unsupported(surface)) return unavailable('unsupported-context');
      const rect = anchor.getBoundingClientRect();
      const visible = { left: Math.max(rect.left, bounds.left), right: Math.min(rect.right, bounds.right), top: Math.max(rect.top, bounds.top), bottom: Math.min(rect.bottom, bounds.bottom) };
      if (!anchor.getClientRects().length || win.getComputedStyle(anchor).visibility !== 'visible') return unavailable('anchor-unavailable');
      for (let node = anchor; node; node = node.parentElement) {
        if (unsupported(node)) return unavailable('unsupported-context');
        if (node === anchor) continue;
        const style = win.getComputedStyle(node), box = node.getBoundingClientRect();
        if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) { visible.left = Math.max(visible.left, box.left + node.clientLeft); visible.right = Math.min(visible.right, box.left + node.clientLeft + node.clientWidth); }
        if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) { visible.top = Math.max(visible.top, box.top + node.clientTop); visible.bottom = Math.min(visible.bottom, box.top + node.clientTop + node.clientHeight); }
      }
      if (visible.right <= visible.left || visible.bottom <= visible.top) return unavailable('anchor-unavailable');
      const readingTop = surface.scrollTop, readingLeft = surface.scrollLeft;
      // Recover authored limits before measuring, including changed rem/theme limits.
      restore(['max-inline-size', 'max-block-size']);
      const style = win.getComputedStyle(surface), inlineLimit = style.maxInlineSize, blockLimit = style.maxBlockSize;
      for (const property of ['margin-top', 'margin-right', 'margin-bottom', 'margin-left']) set(property, '0px');
      set('position', 'fixed'); set('right', 'auto'); set('bottom', 'auto'); set('left', '0px'); set('top', '0px');
      const cap = (limit, amount) => limit === 'none' ? `${Math.max(0, amount)}px` : `min(${limit}, ${Math.max(0, amount)}px)`;
      set('max-inline-size', cap(inlineLimit, bounds.right - bounds.left));
      set('max-block-size', cap(blockLimit, bounds.bottom - bounds.top));
      let box = surface.getBoundingClientRect();
      const before = Math.max(0, visible.top - gap - bounds.top), after = Math.max(0, bounds.bottom - visible.bottom - gap);
      let end = placement === 'block-end-start';
      const preferred = end ? after : before, opposite = end ? before : after;
      if (box.height > preferred && opposite > preferred) end = !end;
      const room = end ? after : before;
      set('max-block-size', cap(blockLimit, room));
      box = surface.getBoundingClientRect();
      const rtl = win.getComputedStyle(anchor).direction === 'rtl';
      const left = Math.max(bounds.left, Math.min(rtl ? visible.right - box.width : visible.left, bounds.right - box.width));
      const top = end ? visible.bottom + gap : visible.top - gap - box.height;
      set('left', `${left}px`); set('top', `${top}px`);
      // Temporary unconstrained measurement must not discard native focus scrolling.
      surface.scrollTop = readingTop; surface.scrollLeft = readingLeft;
      // A viewport/text change can clip the control that already owns focus.
      // Scroll this surface only; never refocus or scroll its background task.
      const focused = doc.activeElement;
      if (focused !== surface && surface.contains(focused)) {
        const target = focused.getBoundingClientRect(), outer = surface.getBoundingClientRect();
        const focusStyle = win.getComputedStyle(focused);
        const edge = Math.max(8, (parseFloat(focusStyle.outlineWidth) || 0) + Math.max(0, parseFloat(focusStyle.outlineOffset) || 0));
        const start = outer.top + surface.clientTop + edge, end = outer.top + surface.clientTop + surface.clientHeight - edge;
        if (target.height > end - start) return unavailable('unsupported-context');
        if (target.bottom > end) surface.scrollTop += target.bottom - end;
        else if (target.top < start) surface.scrollTop -= start - target.top;
      }
      expectedStyle = surface.getAttribute('style');
      box = surface.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0 || box.left < bounds.left - 1 || box.right > bounds.right + 1 || box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1 || win.getComputedStyle(surface).visibility !== 'visible') return unavailable('unsupported-context');
      failure = null;
      start();
      return true;
    }
    function schedule() {
      if (destroyed || frame) return;
      frame = win.requestAnimationFrame(() => { frame = 0; if (!destroyed) update(); });
    }
    function start() {
      if (tracking || destroyed) return;
      tracking = new win.AbortController();
      const config = { signal: tracking.signal };
      doc.addEventListener('scroll', schedule, { ...config, capture: true });
      doc.addEventListener('load', schedule, { ...config, capture: true });
      win.addEventListener('resize', schedule, config);
      win.visualViewport?.addEventListener('resize', schedule, config);
      win.visualViewport?.addEventListener('scroll', schedule, config);
      doc.fonts?.addEventListener('loadingdone', schedule, config);
      resize = new win.ResizeObserver(schedule); resize.observe(anchor); resize.observe(surface);
      const generation = tracking;
      doc.fonts?.ready.then(() => { if (!destroyed && tracking === generation) schedule(); });
    }
    const events = new win.AbortController();
    surface.addEventListener('toggle', event => { if (event.target === surface) update(); }, { signal: events.signal });
    const observer = new win.MutationObserver(records => {
      const invalid = validNodes();
      if (invalid) { unavailable(invalid); return; }
      if (open() && records.some(record => !(record.target === surface && record.type === 'attributes' && record.attributeName === 'style' && surface.getAttribute('style') === expectedStyle))) schedule();
    });
    observer.observe(doc.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['style', 'class', 'dir', 'lang', 'hidden', 'open', 'id', 'popovertarget', 'popover', 'width', 'height'] });
    const handle = { update, destroy() {
      if (destroyed) return;
      destroyed = true; stop(); observer.disconnect(); events.abort(); restore(); owners.delete(surface);
      anchor = surface = doc = win = onUnavailable = null;
    } };
    owners.set(surface, handle);
    // No initial focus/visibility change, and closed attachments allocate no frame loop.
    if (open()) {
      try { update(); } catch (error) { handle.destroy(); throw error; }
    }
    return Object.freeze(handle);
  }
  globalThis.UIPopup = globalThis[key] = Object.freeze({ attach });
})();
