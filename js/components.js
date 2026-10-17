// Optional light-DOM behavior. Native labels, controls, and hints stay in HTML.
(() => {
  let nextId = 0;
  const documentErrors = new WeakMap();
  const authoredMessages = new WeakMap();
  const errorOwners = new WeakMap();
  const hintOwners = new WeakMap();

  function identify(element, prefix) {
    if (!element.id) {
      do { element.id = `ui-${prefix}-${++nextId}`; }
      while (element.ownerDocument.getElementById(element.id) !== element);
    }
    return element.id;
  }

  function describe(control, id, add = true) {
    const ids = new Set((control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
    if (add) ids.add(id); else ids.delete(id);
    const value = [...ids].join(' ');
    if (value && control.getAttribute('aria-describedby') !== value) control.setAttribute('aria-describedby', value);
    else if (!value && control.hasAttribute('aria-describedby')) control.removeAttribute('aria-describedby');
  }

  class UIErrorSummary extends HTMLElement {
    connectedCallback() {
      this._events?.abort();
      this._events = new AbortController();
      this.refresh();
      this.addEventListener('click', (event) => {
        const link = event.target.closest?.('a[href^="#"]');
        if (!link || !this.contains(link)) return;
        let id;
        try { id = decodeURIComponent(link.hash.slice(1)); } catch { return; }
        const target = this.ownerDocument.getElementById(id);
        if (!target) return;
        event.preventDefault();
        for (let parent = target.parentElement; parent; parent = parent.parentElement) {
          if (parent.localName === 'details') parent.open = true;
        }
        target.focus();
        target.scrollIntoView({ block: 'center' });
      }, { signal: this._events.signal });
    }

    disconnectedCallback() { this._events?.abort(); }

    refresh() {
      this.setAttribute('tabindex', '-1');
      const heading = this.querySelector('h2');
      if (!this.hasAttribute('role')) this.setAttribute('role', 'region');
      if (heading && (!this.hasAttribute('aria-labelledby') || this.getAttribute('aria-labelledby') === this._headingId)) {
        this._headingId = identify(heading, 'error-summary');
        this.setAttribute('aria-labelledby', this._headingId);
      }
    }

    show(errors, { focus = true } = {}) {
      this.refresh();
      const list = this.querySelector('ul');
      if (!list || !this.querySelector('h2')) throw new Error('ui-error-summary needs an h2 and a ul.');
      const items = errors.map(({ control, message }) => {
        const doc = this.ownerDocument;
        if (!control?.id || doc.getElementById(control.id) !== control) throw new Error('Error controls need unique IDs in the document.');
        const item = doc.createElement('li');
        const link = doc.createElement('a');
        link.href = `#${encodeURIComponent(control.id)}`;
        link.textContent = message;
        item.append(link);
        return item;
      });
      list.replaceChildren(...items);
      this.hidden = items.length === 0;
      if (items.length && focus) this.focus();
    }

    clear() { this.hidden = true; this.querySelector('ul')?.replaceChildren(); }
  }

  class UIForm extends HTMLElement {
    connectedCallback() {
      this._managed = new Map();
      this._errorElements = new WeakMap();
      this._errors = [];
      this._hints = new Map();
      this._knownControls = new Set();
      // Form ownership is document-wide. Filter records before rediscovery.
      this._observer = new MutationObserver((records) => {
        if (records.some((record) => this._affectsForm(record))) this.refresh();
      });
      this._observer.observe(this.ownerDocument.documentElement, {
        childList: true, subtree: true, attributes: true,
        attributeFilter: ['form', 'id', 'name', 'type', 'disabled', 'readonly', 'aria-describedby']
      });
      this.refresh();
      // Child custom elements may upgrade after their parent's connected callback.
      queueMicrotask(() => { if (this.isConnected) this.refresh(); });
    }

    disconnectedCallback() {
      this._observer?.disconnect();
      this.clear();
      for (const control of this._hints.keys()) this._removeHints(control);
      this._unbind();
    }

    get form() { return this._form || null; }

    _unbind() {
      this._events?.abort();
      if (this._form) this._form.noValidate = this._nativeNoValidate;
      this._form = null;
    }

    refresh() {
      if (!this.isConnected) return;
      const forms = [...this.querySelectorAll('form')].filter((form) => form.closest('ui-form') === this);
      const form = forms.length === 1 ? forms[0] : null;
      if (form !== this._form) {
        this.clear();
        this._unbind();
        for (const control of this._hints.keys()) this._removeHints(control);
        this._knownControls.clear();
        if (!form) return;
        this._form = form;
        this._nativeNoValidate = form.noValidate;
        this._events = new AbortController();
        form.addEventListener('submit', (event) => {
          if (!this._ready || event.submitter?.formNoValidate) return;
          try {
            if (this.validate()) return;
          } catch (error) {
            event.preventDefault();
            event.stopImmediatePropagation();
            throw error;
          }
          event.preventDefault();
          event.stopImmediatePropagation();
        }, { capture: true, signal: this._events.signal });
        form.addEventListener('reset', (event) => {
          queueMicrotask(() => { if (!event.defaultPrevented) this.clear(); });
        }, { signal: this._events.signal });
      }
      if (!form) return;
      let summary = [...this.querySelectorAll('ui-error-summary')].find((item) => item.closest('ui-form') === this);
      if (!summary) {
        summary = this.ownerDocument.createElement('ui-error-summary');
        summary.hidden = true;
        summary.innerHTML = '<h2>There is a problem</h2><ul></ul>';
        this.prepend(summary);
      }
      this._summary = summary;
      summary.refresh?.();
      // Do not turn off the browser's UI unless the replacement can render errors.
      this._ready = typeof summary.show === 'function' && !!summary.querySelector('h2') && !!summary.querySelector('ul');
      form.noValidate = this._ready ? true : this._nativeNoValidate;
      this._syncHints();
      for (const control of this._controls()) {
        const previous = errorOwners.get(control);
        if (previous && previous !== this) previous._release(control);
      }
      this._adoptErrors();
      const retained = this._errors.map(({ control, message }) => {
        if (control.form === form && control.isConnected && control.willValidate) return { control, message };
        const error = this._managed.get(control)?.error;
        const replacement = [...this._managed].find(([other, state]) => state.error === error && other.form === form && other.isConnected && other.willValidate)?.[0];
        return replacement ? { control: replacement, message } : null;
      }).filter(Boolean);
      const expected = new Set(retained.flatMap(({ control }) => this._members(control)));
      const changed = [...expected].some((control) => {
        const state = this._managed.get(control);
        return !state || state.target !== this._errorTarget(control) || state.id !== state.error.id || state.controlId !== control.id;
      });
      if (retained.length !== this._errors.length || retained.some((item, index) => item.control !== this._errors[index].control)
          || expected.size !== this._managed.size || changed) {
        if (this._ready) this.showErrors(retained, { focus: false });
      } else if (this._errors.length && summary.hidden && this._ready) {
        summary.show(this._errors, { focus: false });
      }
      this._knownControls = new Set(this._controls());
    }

    _affectsForm(record) {
      if (this.contains(record.target) || [...this._managed.values()].some((state) => state.error === record.target || state.target === record.target)) return true;
      const relevant = (node) => node.nodeType === 1 && (
        this._knownControls.has(node) || node.form === this._form && !!this._form
        || [...node.querySelectorAll('input, select, textarea')].some((control) => this._knownControls.has(control) || control.form === this._form && !!this._form));
      const field = record.target.closest?.('ui-field, fieldset');
      return relevant(field || record.target) || [...record.addedNodes, ...record.removedNodes].some(relevant);
    }

    _removeHints(control) {
      if (hintOwners.get(control) === this) {
        for (const id of this._hints.get(control) || []) describe(control, id, false);
        hintOwners.delete(control);
      }
      this._hints.delete(control);
    }

    _syncHints() {
      const controls = this._controls();
      for (const control of this._hints.keys()) if (!controls.includes(control)) this._removeHints(control);
      for (const control of controls) {
        const previous = hintOwners.get(control);
        if (previous && previous !== this) previous._removeHints(control);
        const field = control.closest('ui-field');
        const wanted = new Set(field ? [...field.querySelectorAll('ui-hint')]
          .filter((hint) => hint.closest('ui-field') === field).map((hint) => identify(hint, 'hint')) : []);
        const owned = this._hints.get(control) || new Set();
        for (const id of owned) if (!wanted.has(id)) { describe(control, id, false); owned.delete(id); }
        const existing = new Set((control.getAttribute('aria-describedby') || '').split(/\s+/));
        for (const id of wanted) if (!existing.has(id)) { describe(control, id); owned.add(id); }
        this._hints.set(control, owned);
        hintOwners.set(control, this);
      }
    }

    _controls() {
      return [...(this._form?.elements || [])].filter((control) => ['input', 'select', 'textarea'].includes(control.localName));
    }

    _members(control) {
      return control.type === 'radio' && control.name
        ? this._controls().filter((other) => other.type === 'radio' && other.name === control.name && other.willValidate)
        : [control];
    }

    _errorTarget(control) {
      const group = control.closest('fieldset');
      if (!group) return control;
      if (control.type === 'radio' && this._members(control).every((member) => group.contains(member))) return group;
      // An explicit direct group error opts checkbox questions into shared feedback.
      if (control.type === 'checkbox' && !control.closest('ui-field') && [...group.children].some((child) => child.localName === 'ui-error')) return group;
      return control;
    }

    _prefix() { return this.getAttribute('error-prefix') ?? 'Error: '; }
    _stripPrefix(message) {
      const prefix = this._prefix().trim();
      return prefix && message.toLowerCase().startsWith(prefix.toLowerCase()) ? message.slice(prefix.length).trim() : message;
    }

    _findError(control) {
      const target = this._errorTarget(control);
      const ids = `${control.getAttribute('aria-describedby') || ''} ${target.getAttribute('aria-describedby') || ''}`.split(/\s+/);
      const linked = ids.map((id) => this.ownerDocument.getElementById(id)).find((item) => item?.localName === 'ui-error');
      if (linked) return linked;
      const field = control.closest('ui-field');
      const container = field || (target !== control ? target : null);
      const error = container && [...container.querySelectorAll('ui-error')].find((item) =>
        field ? item.closest('ui-field') === field : !item.closest('ui-field') && item.closest('fieldset') === container);
      const cached = this._errorElements.get(control);
      const reusable = cached?.isConnected && (container ? container.contains(cached) : cached.previousElementSibling === control);
      return error || (reusable ? cached : null);
    }

    _adoptErrors() {
      let adopted = false;
      for (const control of this._controls()) {
        if (this._managed.has(control) || !control.willValidate || control.getAttribute('aria-invalid') !== 'true') continue;
        const error = this._findError(control);
        if (!error || error.hidden || !error.textContent.trim()) continue;
        this._claim(control);
        identify(control, 'control');
        identify(error, 'error');
        // A server's domain error is not a reusable required-field message.
        if (!authoredMessages.has(error)) authoredMessages.set(error, '');
        this._errorElements.set(control, error);
        const target = this._errorTarget(control);
        describe(target, error.id);
        this._managed.set(control, { error, target, id: error.id, controlId: control.id });
        if (!control.name || control.type !== 'radio' || !this._errors.some(({ control: other }) => other.type === 'radio' && other.name === control.name)) {
          this._errors.push({ control, message: this._stripPrefix(error.textContent.trim()) });
        }
        adopted = true;
      }
      if (adopted) this._title(true, { fromMarkup: true });
    }

    _errorElement(control) {
      const target = this._errorTarget(control);
      const field = control.closest('ui-field') || (target !== control ? target : null);
      let error = this._findError(control);
      if (!error) {
        error = this.ownerDocument.createElement('ui-error');
        error.hidden = true;
        if (field) field.append(error); else control.insertAdjacentElement('afterend', error);
      }
      identify(error, 'error');
      this._errorElements.set(control, error);
      if (!authoredMessages.has(error)) authoredMessages.set(error, error.hidden ? this._stripPrefix(error.textContent.trim()) : '');
      return error;
    }

    _title(invalid, { fromMarkup = false } = {}) {
      const doc = this.ownerDocument;
      let state = documentErrors.get(doc);
      if (invalid && !state) {
        const prefix = (this.getAttribute('error-title-prefix') ?? 'Error:').trim();
        const base = fromMarkup && prefix && doc.title.startsWith(`${prefix} `) ? doc.title.slice(prefix.length + 1) : doc.title;
        state = { base, prefix, owners: new Set() };
        documentErrors.set(doc, state);
      }
      if (!state) return;
      if (invalid) state.owners.add(this); else state.owners.delete(this);
      const errorTitle = !state.prefix || state.base.startsWith(`${state.prefix} `) ? state.base : `${state.prefix} ${state.base}`;
      if (state.owners.size) doc.title = errorTitle;
      else {
        if (doc.title === errorTitle) doc.title = state.base;
        documentErrors.delete(doc);
      }
    }

    _claim(control) {
      const previous = errorOwners.get(control);
      if (previous && previous !== this) previous._release(control);
      errorOwners.set(control, this);
    }

    _release(control) {
      const state = this._managed.get(control);
      this._managed.delete(control);
      if (!state || errorOwners.get(control) !== this) return;
      errorOwners.delete(control);
      const { error, target, id } = state;
      control.removeAttribute('aria-invalid');
      if (target !== control) describe(control, id, false);
      if (![...this._managed.values()].some((other) => other.error === error && other.target === target)) describe(target, id, false);
      if (![...this._managed.values()].some((other) => other.error === error)) error.hidden = true;
    }

    clear() {
      for (const control of this._managed?.keys() || []) this._release(control);
      this._errors = [];
      this._summary?.clear?.();
      this._title(false);
    }

    showErrors(errors, { focus = true } = {}) {
      if (!this._form) throw new Error('ui-form needs exactly one native form.');
      if (!this._ready) throw new Error('ui-form needs a usable error summary before displaying errors.');
      const unique = new Map();
      for (const { control, message } of errors) {
        if (control?.form !== this._form || !control.willValidate || typeof message !== 'string' || !message.trim()) {
          throw new Error('Each error needs a validating control in this form and a message.');
        }
        identify(control, 'control');
        const key = control.type === 'radio' && control.name ? this._members(control)[0] : control;
        unique.set(key, { control, message });
      }
      this.clear();
      this._errors = [...unique.values()];
      for (const { control, message } of this._errors) {
        const members = this._members(control);
        for (const member of members) this._claim(member);
        const error = this._errorElement(control);
        error.textContent = `${this._prefix()}${message}`;
        error.hidden = false;
        for (const member of members) {
          member.setAttribute('aria-invalid', 'true');
          const target = this._errorTarget(member);
          describe(target, error.id);
          this._managed.set(member, { error, target, id: error.id, controlId: member.id });
        }
      }
      this._title(this._errors.length > 0);
      this._summary.show(this._errors, { focus });
    }

    validate({ focus = true } = {}) {
      this.refresh();
      if (!this._form || !this._ready) return false;
      const errors = [];
      const radios = new Set();
      for (const control of this._controls()) {
        if (!control.willValidate) continue;
        const textual = control.localName === 'textarea' || ['text', 'search', 'email', 'url', 'tel', 'password'].includes(control.type);
        const empty = control.required && textual && !control.value.trim();
        const tooLong = control.maxLength >= 0 && control.value.length > control.maxLength;
        const tooShort = control.minLength > 0 && control.value.length > 0 && control.value.length < control.minLength;
        if (!empty && !tooLong && !tooShort && control.validity.valid) continue;
        if (control.type === 'radio' && control.name) {
          if (radios.has(control.name)) continue;
          radios.add(control.name);
        }
        const legend = control.type === 'radio' ? control.closest('fieldset')?.querySelector('legend') : null;
        const label = legend?.textContent.trim() || control.labels?.[0]?.textContent.trim() || control.name || 'This answer';
        const authored = authoredMessages.get(this._errorElement(control));
        let message = control.validationMessage;
        if (control.validity.customError) {
          // Keep the application's explicit message even when another rule fails.
          message = control.validationMessage;
        }
        else if (empty || control.validity.valueMissing) {
          const verb = control.localName === 'select' || ['checkbox', 'radio', 'file'].includes(control.type) ? 'Select' : 'Enter';
          message = authored || `${verb} ${label.toLowerCase()}`;
        }
        else if (tooLong) message = `${label} must be ${control.maxLength} characters or fewer`;
        else if (tooShort) message = `${label} must be ${control.minLength} characters or more`;
        if (this.message) {
          const reason = control.validity.customError ? 'customError' : empty || control.validity.valueMissing ? 'valueMissing' : tooLong ? 'tooLong' : tooShort ? 'tooShort' : 'native';
          message = this.message(control, { reason, label, defaultMessage: message });
          if (typeof message !== 'string' || !message.trim()) throw new TypeError('ui-form message must return a non-empty string synchronously.');
        }
        errors.push({ control, message });
      }
      if (this.validator) {
        const extra = this.validator(this._form);
        if (!Array.isArray(extra)) throw new TypeError('ui-form validator must return an array of errors synchronously.');
        errors.push(...extra);
      }
      this.showErrors(errors, { focus });
      return this._errors.length === 0;
    }
  }

  if (!customElements.get('ui-error-summary')) customElements.define('ui-error-summary', UIErrorSummary);
  if (!customElements.get('ui-form')) customElements.define('ui-form', UIForm);
})();
