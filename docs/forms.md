# Integrating forms

Use `js/ui.js` for the combined behavior entry, or keep the compatible form-only `js/components.js`. No per-form initialization is required. The [shared lifecycle API](enhancement.md) can suspend/resume existing forms and summaries while preserving native values; application validators, localization and transport remain configured here.

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
  <label><input name="updates" type="checkbox" value="news" aria-describedby="updates-hint">News</label>
  <label><input name="updates" type="checkbox" value="events" aria-describedby="updates-hint">Events</label>
</fieldset>
```

```js
editor.validator = (form) => new FormData(form).getAll('updates').length
  ? []
  : [{ control: form.elements.updates[0], message: 'Select at least one update' }];
```

A direct `ui-error` child opts this checkbox fieldset into shared feedback. Supply one error per group, targeting a validating representative; the summary link focuses that checkbox and the error describes the fieldset. Only the representative gets `aria-invalid`. Use separate `ui-field` children for independent checkbox questions with independent constraints/errors. Do not mix those individual questions with a shared group error. Repeated values stay native: use `FormData.getAll()`.

## Native dates, times, files and ranges

[Try the native-value recipe](../examples/native-inputs.html) and [read its application script](../examples/native-inputs.js). It combines two grouped questions with date/time fields, optional multiple files and a native range. It displays native FormData locally without a request, upload or persistence. UI's existing form API supplies errors; this recipe adds no library element or API.

### Hints, errors and recovery

A fieldset can provide context for several distinct answers, such as a date and time. Keep each answer in its own `ui-field` with a visible label, hint and error; do not reuse one error node for both answers. Explicitly describe each input with any relevant shared hint plus its own hint so guidance works before enhancement.

For a single radio question, use one shared direct error and same-name radios; `required` makes the native group required. For an at-least-one checkbox question, use one direct fieldset error and an application validator targeting an eligible checkbox. Associate the group hint explicitly with both the fieldset and its members. Do not put `required` on every checkbox. On failure, UI adds the error description to the fieldset, preserves authored hints and renders one linked summary entry per question. Radio members are marked invalid; the checkbox representative alone is marked invalid. The recipe's summary link focuses that representative without selecting an answer.

Correct answers and submit again to clear feedback. A native reset restores date/time defaults, radio/checkbox defaults and the range's initial value, clears file selection and managed errors, and restores the page title. A cancelled reset preserves answers, errors and the last inspected result. Editing clears the example's previously inspected entries so they are not mistaken for current answers. Existing field errors remain until validation or reset; the application does not announce each edit as an error.

### Values and constraints

| Native control | Submitted entry | Application and server contract |
| --- | --- | --- |
| Date | Calendar string such as `2026-10-20`; optional empty entry is `""` | Validate the actual calendar date, min/max and any step. Display locale does not change serialization. Do not convert a date-only answer into an implicit UTC timestamp. |
| Time | Local wall time such as `09:15`; seconds are included when applicable | The value contains no date, timezone or offset. Define these separately, recheck bounds/intervals, and resolve ambiguous or nonexistent daylight-saving times explicitly. The recipe's `step="900"` means 900 seconds, or 15 minutes, anchored by its `min="09:00"`. |
| Multiple files | Repeated `File` entries under the same name | Use `getAll()` and multipart form encoding for real uploads. With no selection, FormData includes an empty File entry with an empty name and zero bytes; a deliberately selected zero-byte file can still have a name. Do not use file size alone to detect absence. |
| Range | Numeric string such as `50` | The browser supplies a value even when untouched. `required` cannot make it an unanswered question. Recheck numeric bounds and step on the server; choose another input when an explicit answer is necessary. |
| Checkbox choices | One entry per checked, enabled member; no entry for unchecked members | Use `getAll()`, validate allowed values and the group count, and reject unexpected values. |
| Radio question | One entry for the checked, enabled member; none when unanswered | Validate one allowed value, including required membership and authorization. |

`new FormData(form, event.submitter)` includes the activated submit button's name/value. Read-only supported controls still serialize; disabled controls do not. Neither state makes a submitted value trustworthy. File, checkbox, radio and range controls do not support `readonly`; use their native semantics rather than a pretend read-only state. Date/time picker appearance and supported editing gestures vary by browser and platform. If a type falls back to text, the server still enforces the same value format and rules.

The recipe uses a fixed demonstration date window (2026–2027), a trusted venue context of Europe/London and a 0–100 range in steps of 5, initially 50. It demonstrates native constraints, not scheduling availability or a timezone resolver. A real service must derive the venue and its timezone from trusted application data and apply its own booking rules.

### Files and server responses

The recipe's synchronous validator checks a maximum of three files and 1 MiB (1,048,576 bytes) per file. `accept` suggests PDF/plain-text choices to the picker; it does not enforce content type. Browser-provided names and MIME types are untrusted metadata. The local inspector renders names with `textContent`, reads no bytes and exposes no local filesystem path. A real upload service checks actual file content/type, counts, byte limits, authorization and safe storage under its own policy. Client checks improve recovery but cannot replace server checks.

Browsers own file selection. Applications cannot repopulate a file input from a server path or a previous response. A response rendered as a new document must preserve ordinary answers, show escaped linked errors and explain that files need to be selected again; an async response updating the same document can retain the current native selection if it does not reset or replace the input. Never clear the whole form to show a rejection. Report a service-wide upload failure in task feedback rather than inventing a field error. Follow the [async integration contract](#asynchronous-submission) for cancellation and stale responses.

Without JavaScript, the recipe keeps editable native inputs, explicit hints, constraints and reset. Local inspection stays hidden with a visible explanation. It is not a server-backed form: replace its demonstration action and install a real submit button when adapting it for production. Native validation alone cannot enforce a checkbox minimum count, file limits, authorization or server rules.

## Multiple selection in composed layouts

The [survey briefing](../examples/composition.html) demonstrates native multiple selection inside nested panels, with named table/notes scroll regions. Its [composition and multiple-select contract](reference.md#panels-scroll-regions-and-multiple-selection) covers platform instructions, required errors, repeated `getAll()` values, disabled options/optgroups, selected defaults and cancelled reset. The browser owns selection and scrolling; local inspection sends nothing. Server validation must recheck allowed values and access rules.

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

## Fields in Tabs

The combined entry’s experimental [Tabs pattern](tabs.md) reveals containing panels and native disclosure ancestors before an error-summary link focuses its field. Summary focus/scroll remain form-owned; closing a panel never disables its controls or changes validation eligibility. Native validation reveals the first invalid destination in each synchronous validation task. Applications must reveal hidden destinations before focusing them directly. The original form-only entry keeps its native-details behavior; it cannot initialize Tabs.
