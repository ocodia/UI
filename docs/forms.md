# Integrating forms

`ui-form` coordinates native validation, field feedback, linked summaries and recovery. It does not own values, network requests, business rules or translations. Use [the current API](reference.md#reusable-forms) and the [working integration example](../examples/form-integration.html).

## Native ownership and dynamic markup

Wrap exactly one native form. A control belongs to that form according to its native `form` property, including explicit `form="project-form"` associations outside the wrapper. An external submit/reset button keeps its native event, submitter and successful name/value. Capture `new FormData(form, event.submitter)` before disabling anything. The platform defines [form ownership and submission](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html).

UI observes child insertion/removal and relevant association attributes throughout the document, filtering mutation records to the wrapper and current/new controls. After the mutation microtask, it discovers external fields, handles `form`/form-ID changes and removes stale errors for removed, reassigned, disabled or read-only controls. It does not revalidate every edit or infer that a server rule now passes. Call `refresh()` if immediate rediscovery is needed in the same task; `validate()` refreshes first.

One `ui-field` contains one native control. Enhancement associates its `ui-hint` children even when the field is external. Explicit `aria-describedby` IDs remain authored; UI removes only hint links it added when hints/fields move or disappear, the owner changes, or enhancement disconnects. Give related controls a native fieldset/legend and explicitly associate group hints for the no-JavaScript baseline. Prefer moving an entire `ui-field` rather than leaving its labels/error behind.

Two wrappers cannot simultaneously manage a control's errors. Reassignment releases the old owner's feedback before the new owner validates it. It does not copy domain errors to another form. IDs must be unique. External error nodes need explicit associations or an enclosing `ui-field`; one error node belongs to one question. Do not share error nodes between separate forms.

The observer is disconnected on removal. Native `noValidate` is restored, managed errors are cleared and enhancement-added hints are removed. Generated IDs/error nodes can remain in the DOM for reuse; generated errors are hidden. Reconnection rediscovers current markup.

## Grouped questions

Use one fieldset/legend per radio question, with same-name native radios belonging to the same form. UI renders one summary entry, marks eligible members invalid, and describes the containing fieldset when it contains the whole native group. If a group spans locations, the shared error describes its members instead. Removing the summary's representative retains feedback on a surviving member; disabled/read-only controls do not retain managed errors.

For checkbox groups, `required` means **this checkbox must be checked**, not “at least one of these”. An at-least-one rule belongs to the application/server:

```html
<fieldset aria-describedby="updates-hint">
  <legend>Which updates do you want?</legend>
  <ui-hint id="updates-hint">Choose at least one.</ui-hint>
  <ui-error hidden>Error: Select at least one update</ui-error>
  <label><input name="updates" type="checkbox" value="news">News</label>
  <label><input name="updates" type="checkbox" value="events">Events</label>
</fieldset>
```

```js
editor.validator = (form) => new FormData(form).getAll('updates').length
  ? []
  : [{ control: form.elements.updates[0], message: 'Select at least one update' }];
```

A direct `ui-error` child opts this checkbox fieldset into shared feedback. Supply one error per group, targeting a validating representative; the summary link focuses that checkbox and the error describes the fieldset. Only the representative gets `aria-invalid`. Use separate `ui-field` children for independent checkbox questions with independent constraints/errors. Do not mix those individual questions with a shared group error. Repeated values stay native: use `FormData.getAll()`.

## Localization

UI does not infer translations from `lang`. Set the document/section language, author translated labels, hints and summary heading, and configure prefixes on `ui-form`:

```html
<ui-form lang="fr" error-prefix="Erreur : " error-title-prefix="Erreur :">
  <ui-error-summary hidden><h2>Il y a un problème</h2><ul></ul></ui-error-summary>
  <form>
    <ui-field>
      <label for="nom">Nom du projet</label>
      <ui-error hidden>Erreur : Saisissez le nom du projet</ui-error>
      <input id="nom" name="project" required>
    </ui-field>
  </form>
</ui-form>
```

`error-prefix` defaults to `Error: ` and is prepended literally to generated inline text. Include your desired spacing. It is stripped from initially authored required/server messages when forming summary links. `error-title-prefix` defaults to `Error:`; it is trimmed and joined to the page title with one space. An empty prefix suppresses that prefix. Set these before initialization; changing them does not translate existing errors. Server-rendered errors and titles must use the same prefixes. Keep one title-prefix language for forms on the same page: the first active error owner establishes the shared prefix until all forms clear.

Hidden authored errors supply required-field text. For generated length/native messages, use the synchronous `message` property:

```js
editor.message = (control, { reason, label, defaultMessage }) => {
  if (reason === 'valueMissing') return 'Saisissez le nom du projet';
  if (reason === 'tooLong') return `Utilisez ${control.maxLength} caractères maximum`;
  return defaultMessage;
};
```

The callback runs for each failing constraint selected by UI. Reasons are `customError`, `valueMissing`, `tooLong`, `tooShort` or `native` (other browser constraints). `label` is the derived label/legend; `defaultMessage` is UI's otherwise selected text. Return a non-empty string synchronously; promises and empty/non-string results throw before existing feedback is replaced. Return `defaultMessage` to retain explicit `setCustomValidity()` text. Application/server messages passed to `showErrors()` or returned by `validator` are already final and are not passed through `message`.

Native constraint messages follow browser language and may differ from the document's `lang`. Supply explicit translations for every constraint used by your application; a translated summary heading alone does not translate validation. Built-in fallback wording remains English. Locale-specific dates/numbers and server-side validation remain application responsibilities.

## Asynchronous submission

Keep `validator` and `message` synchronous. A valid native submit reaches the application; prevent navigation there, capture values/submitter, then start transport. Do not call `requestSubmit()` recursively after the response unless you have an explicit bypass strategy. Direct `form.submit()` bypasses both native submit events and UI.

The [example script](../examples/form-integration.js) demonstrates the full sequence:

1. Prevent submission, ignore duplicates while pending and snapshot native FormData before UI state changes.
2. Give the task a persistent status region and `aria-busy` on the form. The status region sits outside the busy form so its updates are not held back.
3. Keep answers editable and offer cancellation. Observe edits through the document and check `event.target.form`, since external controls do not bubble through the form.
4. Abort superseded work and also compare a request/revision token before applying a response. Cancellation alone cannot guarantee that a remote operation stopped. Applications own idempotency and server outcomes.
5. Send field rejections to `showErrors()` and focus the summary. Keep service-wide failures in task feedback with a retry path; do not fabricate a field error for a network failure.
6. Preserve answers after failure. Clear pending state on every completion path. Ignore responses after the editor is removed. Invalidate work on edits, uncancelled reset, explicit cancellation and navigation.

The example uses a local timer, not a real endpoint. A production application must add real server validation, transport/error mapping, request authentication, duplicate-operation policy and lifecycle cleanup for its own listeners. Programmatic `.value` assignments do not emit input/change: the application must invalidate any pending snapshot when it changes values itself. If a form is moved/replaced during a request, cancel that request in the application lifecycle; UI does not own it.

`aria-busy` describes pending work but does not disable controls. The example keeps submitters enabled and guards duplicates in JavaScript, preserving focus and FormData. If your product disables controls, save their previous state, capture values first, and restore state/focus predictably. Announcements and cancellation semantics still need browser/screen-reader task testing.

These conventions follow the native platform and GOV.UK's [validation recovery](https://design-system.service.gov.uk/patterns/validation/) and [error summary](https://design-system.service.gov.uk/components/error-summary/) guidance. The [evidence record](../ACCESSIBILITY.md) distinguishes automated checks from outstanding manual verification.
