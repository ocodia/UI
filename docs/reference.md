# Current UI API

This reference describes the implementation that exists today. For the complete system direction, see [the roadmap](../ROADMAP.md). Proposed catalogue entries are not public APIs. The [lifecycle and ownership contract](lifecycle.md) guides future implementations; the optional experimental [Popup adapter](popup.md) implements anchored geometry separately from native popover semantics.

The current HTML-first foundation and optional form behavior. No classes required for documents, forms, and native elements.

```html
<link rel="stylesheet" href="css/ui.css">
```

Open [the examples](../examples/index.html) or [the complete form](../form.html). To preview locally, run `python3 -m http.server 8765` from this directory and visit `http://localhost:8765`.

UI ships as plain CSS. There is no required build step, JavaScript, or dependency.

See the [roadmap](../ROADMAP.md) for planned custom elements and interface conventions.

## Shared JavaScript entry

Load optional `js/ui.js` once for all currently shipped behavior. It registers the same two form elements and exposes `UI.enhance(root = document)` and `UI.destroy(root = document)`. Both are synchronous/idempotent and return undefined. Roots include their descendants and must belong to the current document. The bundle initializes static marked patterns after parsing; applications explicitly enhance newly inserted overlays and destroy before removal/replacement. Forms retain their native custom-element connection lifecycle.

Use `data-ui="dialog"` on an authored open native dialog, or `data-ui="popover|popup"` on one readable inline help container. Hidden native buttons provide the opening/closing relationships. UI installs standard focus/fallback/cleanup before hiding baseline content or revealing actions. `UI.popup.attach` aliases the existing lower-level `UIPopup.attach` geometry API. See [shared UI JavaScript](enhancement.md) for exact markup, lifecycle, limits and no-script fallback. The experimental [Accordion pattern](accordion.md) uses `ui-accordion data-ui="accordion"` around native disclosures for summary navigation, fragment reveal and focus recovery. The experimental [Tabs pattern](tabs.md) uses `ui-tabs` with a named `ui-tablist` around fragment anchors and paired sections, with manual/automatic activation, keyboard navigation, deep links and form-error reveal. No additional custom elements are registered. Other planned widgets gain no placeholder behavior.

`js/components.js` and `js/popup.js` remain smaller compatible entries. Mixed/repeated loading keeps one set of constructors and geometry ownership. Generate the combined file from its sources with `tools/build_ui.py` or the full documentation build; there is no runtime loader or module import.

## HTML conventions

Use elements for their meaning: links navigate, buttons perform actions, and labels identify controls. UI styles headings, text, lists, tables, code, media, forms, `details`, `dialog`, and `[popover]`.

```html
<form>
  <p>
    <label for="email">Email</label>
    <input id="email" name="email" type="email" autocomplete="email" required>
  </p>
  <button type="submit">Subscribe</button>
</form>
```

Controls use native checked, disabled, read-only, and validation states. `:user-invalid` marks invalid controls after interaction. Applications can set `aria-invalid="true"` and associate an error message with `aria-describedby`. Color alone does not explain an error.

Native progress bars are constrained to their container width, including inside narrow panels with enlarged text. Their value and indeterminate state remain native.

UI supplies keyboard focus outlines and preserves native controls. It does not turn arbitrary elements into interactive widgets.

## Layout

The body provides a full-width canvas. Its direct children share a content width and gutters; the direct header has a full-width background. Pages without a `main` still receive content widths. Images shrink to fit without stretching.

Most pages need no classes. Four optional helpers cover explicit arrangements:

- `stack`: consistent vertical spacing between children.
- `cluster`: a horizontal group that wraps.
- `grid`: columns that adapt to available width.
- `table-scroll`: local horizontal scrolling for wide tables.

```html
<div class="grid">
  <section><h2>First</h2><p>First item.</p></section>
  <section><h2>Second</h2><p>Second item.</p></section>
</div>
```

For a keyboard-scrollable table wrapper, add `tabindex="0"`, `role="region"`, and an accessible name through `aria-labelledby`. Articles and sections receive no automatic card treatment.

## Layout elements

`ui-stack`, `ui-cluster`, and `ui-grid` provide the same layouts as their class alternatives. `ui-sidebar` and `ui-panel` add composition primitives. They are CSS-only, use light DOM, and require no registration or JavaScript. The `ui-` prefix identifies UI elements.

```html
<ui-stack>
  <h2>Project details</h2>
  <ui-grid>
    <p>First item.</p>
    <p>Second item.</p>
  </ui-grid>
  <ui-cluster>
    <button type="submit">Save changes</button>
    <a href="/projects">Cancel</a>
  </ui-cluster>
</ui-stack>
```

- **Stack:** block layout with `--ui-stack-gap` between direct children. Their block margins reset so element defaults do not double the spacing.
- **Cluster:** a wrapping flex row, centered on its cross axis, with `--ui-cluster-gap` gaps. Long labels wrap within the available width.
- **Grid:** equal flexible columns with a preferred minimum of 16rem. Columns collapse as space decreases; a single column can shrink below that minimum to fit its container.

Use native elements inside the layouts for headings, lists, forms, and landmarks. Layout elements add no ARIA roles or keyboard behavior. Visual order follows DOM order in both left-to-right and right-to-left documents. Keep that reading order when customizing the CSS.

Each layout has a trailing `--ui-space` margin; a parent layout resets child margins to prevent duplicate gaps. `--ui-space` remains the global spacing default. Component variables let one layout change without altering the spacing of its nested layouts.

| Element | CSS variables and defaults |
| --- | --- |
| `ui-stack` | `--ui-stack-gap: var(--ui-space)` |
| `ui-cluster` | `--ui-cluster-gap: var(--ui-space)`, `--ui-cluster-align: center` |
| `ui-grid` | `--ui-grid-min: 16rem`, `--ui-grid-gap: var(--ui-space)` |
| `ui-sidebar` | `--ui-sidebar-width: 13rem`, `--ui-sidebar-content-min: 36rem`, `--ui-sidebar-gap: var(--ui-space)` |
| `ui-panel` | `--ui-panel-padding: var(--ui-space)` |

Set overrides on the element using application CSS or its style attribute. Defaults reset on each nested component. Invalid CSS values follow normal browser behavior.

`ui-sidebar` expects two direct children: sidebar first, content second. It wraps based on available container space, not viewport breakpoint classes. Its content can shrink to the container width on small screens. Use native `nav`, `aside`, `main`, or `section` as appropriate. `ui-panel` supplies presentation and adds no ARIA role.

Grid and cluster children can shrink within their tracks. Preformatted code and wide tables still need their own scrolling regions. A layout never hides page overflow to conceal content.

The class alternatives remain supported: `<div class="stack">`, `<div class="cluster">`, and `<div class="grid">`. Both forms share the same CSS rules. No new configuration attributes are required. Application CSS can override the arrangement for a specific context.

### Application example

[Fieldwork](../workspace.html) combines a sidebar, action group, project content, form, and detail panel without layout classes. Its sidebar is ordinary disclosure navigation, not a tree widget. Its action group is a wrapping cluster, not an ARIA toolbar.

The example has a separate application stylesheet and an optional script. Project changes and task progress save to local browser storage; export downloads the saved data as JSON. Revert restores the saved project details. It has no backend. If storage is unavailable, edits remain usable for the current visit and the page reports the limitation.

The layouts, content, disclosure navigation, and native form controls work without JavaScript. Save and export controls appear only after the optional script initializes. UI supplies the layout primitives; application shell choices stay in `css/workspace.css`.

## Panels, scroll regions and multiple selection

The [survey briefing recipe](../examples/composition.html) combines an ordinary aside, `ui-sidebar`, nested `ui-panel`/`ui-grid`/`ui-stack`, a native multiple-select and two independent scroll regions. [Read its application script](../examples/composition.js). Its only application behavior is local FormData inspection and feedback cleanup; selection, scrolling and form reset remain native. It initializes once for the static page; client-side routing or dynamic form replacement would need application-owned teardown and initialization.

### Composition and reading order

`ui-panel` supplies a surface, padding and a border. Its native section/article/aside supplies meaning; the panel itself gains no role, focus stop or click handler. Use real headings and explicit links/buttons. Avoid making a whole card clickable around other interactive children.

`ui-sidebar` has two direct children: the aside first and the content second. It wraps when its content minimum cannot fit beside the aside. `ui-grid` fits its tracks to available space; neither wrapper creates ARIA grid semantics. The recipe sets existing local geometry tokens, keeping reading order unchanged across widths and in RTL:

```css
#brief-layout {
  --ui-sidebar-width: 15rem;
  --ui-sidebar-content-min: 42rem;
}
#brief-selection-grid { --ui-grid-min: 18rem; }
```

Keep intrinsic minimums under control inside nested layouts. UI layout children already allow shrinking; wide content still needs its own local overflow container. Do not hide page overflow, reverse visual order, lock the whole page to a fixed height or shrink text to force columns to fit.

### Named native scroll regions

A table can need two-dimensional layout while the surrounding page reflows. The existing `.table-scroll` helper provides horizontal overflow, not a custom scrolling widget. Name its region, make it focusable and explain how to scroll:

```html
<h2 id="access-title">Access comparison</h2>
<p id="access-help">Focus the table region and use horizontal arrow keys.
  Tab moves to the next control.</p>
<div class="table-scroll" role="region" tabindex="0"
     aria-labelledby="access-title" aria-describedby="access-help">
  <table>
    <caption>Route access information</caption>
    <thead><tr><th scope="col">Route</th><th scope="col">Distance</th></tr></thead>
    <tbody><tr><th scope="row">Coast</th><td>3 km</td></tr></tbody>
  </table>
</div>
```

Keep the caption and native row/column headers. Avoid giving an enclosing section the same landmark name as the scroll region; the region is the named scrolling destination. A focusable scroll container needs an accessible name even when its table also has a caption. Instructions stay outside the scroll area. Browser scrollbars may be transient; the visible instructions and table layout provide a persistent cue. No custom keyboard handler, drag-only control, roving tabindex or scrollbar role is installed. Native arrows scroll the focused region; Tab leaves it and reaches any links within it in DOM order. Platform keyboard behavior still needs testing.

The recipe also bounds an ordinary field-notes region with application CSS (`max-block-size: 16rem; overflow: auto`) and the same naming/focus pattern. This is an application example, not a new general scroller API. Bound a prose region only when the task benefits; do not nest it inside another scroll region or hide essential content. Allow links inside it, keep focus indicators clear of clipping, and retain native pointer/touch scrolling. The recipe releases its height limit for print. UI's shared focus rules also apply to these native focus stops, including the system Highlight outline in forced colors; it does not use `forced-color-adjust: none`.

### Native multiple-select contract

The recipe's `select multiple size="5" required` remains one native control with native options/optgroups, a visible label, instructions and its own inline error. `size` sets visible rows; `data-size` only selects supported CSS geometry. Do not give it an extra listbox role, replace options with custom wrappers, or install a duplicate arrow-key selection handler. It has no `readonly` mode.

Multiple-select gestures vary by browser and platform. Shift with arrows commonly extends a contiguous selection; Command-click on macOS or Control-click on Windows commonly toggles separate options. Noncontiguous keyboard selection and touch choosers require platform testing. Keep all option labels concise; the adjacent descriptions disclosure supplies full route context when a native row truncates. For a short list needing simpler independent selection, use [native checkboxes](components.md#checkbox-group).

An empty required selection produces one UI error. The linked summary focuses the select without choosing an option. Correction and resubmission clear the error and retain authored hint descriptions. Selecting alone does not navigate, submit or announce a new result. The example clears obsolete inspection feedback on input/change and reports submitted entries only on explicit submission.

`new FormData(form, event.submitter).getAll('area')` returns repeated successful values in option order, not the sequence of clicks. `select.value` exposes only the first selected value, so do not use it to collect all answers. Selected disabled options, selected options in a disabled optgroup, and disabled selects do not contribute entries. `required` is a missing-answer check, not authorization: the server must check the allowed values, permissions and selection count. Do not use client-disabled choices as an access-control boundary.

Authored `selected` attributes define reset defaults; the current `selected` properties define current answers. An uncancelled native reset restores Coast, clears managed errors/title state and clears application inspection feedback. A cancelled reset leaves the current selection and feedback intact. Without JavaScript, selection, reset, landmarks, source order and both scroll regions remain available; only the local inspector stays hidden. A production form requires a real server action and submit button.

Run [the complete browser checks](../tests/accessibility.html) or [focused composition display checks](../tests/composition.html). The focused page reports whether forced colors is active and only counts system-color checks when it is. Browser emulation does not replace Windows contrast themes, screen readers, touch, real zoom or platform keyboard evidence. See [the dated record](../ACCESSIBILITY.md).

See the [native family state audit](native-states.md) for authored default, long-content, disabled/read-only, invalid, busy and fallback examples and their verification limits.

## Reusable forms

Load `js/ui.js` (or the smaller compatible `js/components.js`) and wrap exactly one native form in `ui-form`. An optional summary can sit anywhere inside that wrapper, including above the page heading. Without a supplied summary, UI creates one with the English heading “There is a problem”. Supply an authored summary to choose another heading or language.

```html
<ui-form>
  <form action="/projects" method="post">
    <ui-field>
      <label for="project">Project name</label>
      <ui-hint id="project-hint">Use a short name.</ui-hint>
      <ui-error hidden>Error: Enter a project name</ui-error>
      <input id="project" name="project" aria-describedby="project-hint" required>
    </ui-field>
    <button type="submit">Save project</button>
  </form>
</ui-form>
```

The element validates on submission and leaves valid native `submit` events intact. Invalid submissions stop before ordinary application submit handlers. It manages inline errors, descriptions, summary focus, the error title, and native reset cleanup. Your application still owns persistence and server validation. Explicit hints and native labels remain usable without JavaScript; missing hint/control/error IDs can be generated during enhancement.

Use one control per `ui-field`, or a native fieldset for a radio group. Missing error elements are generated. Existing hint descriptions are preserved. Required messages use initially hidden authored `ui-error` text when available; visible server messages are not reused as required-field defaults. Other constraints use native messages or label-based length messages. Explicit `setCustomValidity()` messages take precedence when more than one constraint fails. Applications can supply translated messages with custom validity or a synchronous validator; use `error-prefix`, `error-title-prefix` and the synchronous `message` callback for generated feedback. Defaults remain English. See [form integration](forms.md) for localization and grouped-field contracts.

```js
const editor = document.querySelector('ui-form');
editor.validator = (form) => {
  const input = form.elements.project;
  return input.value === 'Reserved'
    ? [{ control: input, message: 'Choose a different project name' }]
    : [];
};
```

| API | Behavior |
| --- | --- |
| `editor.form` | The owned native form, or `null` when markup is incomplete/ambiguous |
| `editor.validate({ focus: false })` | Validate and render errors; return a boolean; focus defaults to true |
| `editor.showErrors([{ control, message }], { focus: false })` | Display application/server errors without replacing answers |
| `editor.clear()` | Clear managed errors and restore the title; preserve values |
| `editor.refresh()` | Rediscover markup/hints immediately; relevant document mutations and form association changes also trigger this automatically |
| `editor.message(control, { reason, label, defaultMessage })` | Optional synchronous callback returning a non-empty translated constraint message; see [localization](forms.md#localization) |
| `error-prefix`, `error-title-prefix` | Optional attributes on `ui-form` for inline/title prefixes; defaults `Error: ` and `Error:` |
| `editor.validator` | Optional synchronous callback returning additional error objects; no network validation is implied |

Use `form.requestSubmit()` for programmatic submissions. Native `form.submit()` bypasses submission events and therefore this enhancement. `formnovalidate` is respected. For asynchronous checks, prevent native submission in the application and later use `showErrors()` or continue the application workflow. Follow [the async integration recipe](forms.md#asynchronous-submission) for pending feedback, snapshots, cancellation, retry and stale responses.

A cancelled reset keeps its errors. If your application cancels reset to implement a custom revert action, call `editor.clear()` after restoring the values. Disconnect restores the form's original `noValidate` value and removes listeners. Dynamic controls and reconnects are supported. Multiple forms coordinate the document error title.

`ui-error-summary.show(errors, { focus: false })` also supports rendering without moving focus. Its `refresh()` method updates heading associations when its children arrive later.

### Server-rendered errors

Render the user's answer, a visible `ui-error`, `aria-invalid="true"` on the native control, and explicit hint/error descriptions. A visible summary uses real fragment links. Prefix the server response title with `Error: `. This markup works before JavaScript loads:

```html
<ui-form>
  <ui-error-summary role="region" aria-labelledby="errors-title" tabindex="-1">
    <h2 id="errors-title">There is a problem</h2>
    <ul><li><a href="#project-name">This name is already in use</a></li></ul>
  </ui-error-summary>
  <form action="/projects" method="post">
    <ui-field>
      <label for="project-name">Project name</label>
      <ui-hint id="project-hint">Choose a recognisable name.</ui-hint>
      <ui-error id="project-error">Error: This name is already in use</ui-error>
      <input id="project-name" name="project" value="Field guide" required
             aria-invalid="true" aria-describedby="project-hint project-error">
    </ui-field>
    <button type="submit">Save project</button>
  </form>
</ui-form>
```

Enhancement adopts visible errors for validation-eligible controls without replacing an authored visible summary or moving focus. It creates a missing summary if needed. `clear()`, successful client validation and uncancelled native reset clear adopted field states and error descriptions while retaining other hints. The last managed form restores the title without the initial `Error: ` prefix. Only explicit server error states are adopted; a visible decorative message alone does not make a control invalid.

For radios, use a shared fieldset error and mark the affected radio control(s) invalid; the summary contains one error per same-name group. Error nodes must belong to one question. General form-wide/server failures without a control remain application-owned; `showErrors()` is for field errors.

Adopted messages are presentation state, not persistent native validity rules. Successful client validation permits another submission; it does not prove a server rule now passes. Recheck on the server, or retain an applicable application validator/custom-validity rule. The [response example](../examples/server-errors.html) demonstrates this using an explicitly local rule.

Controls associated through `form="…"` can use explicitly described `ui-error` nodes outside the wrapper. Relevant document mutations and ownership attributes are observed automatically; `refresh()` supports immediate rediscovery. See [form integration](forms.md) for external controls, grouped questions, localization, lifecycle limits and async response ordering. Server text must be escaped by the application before writing HTML.

The [native-value recipe](../examples/native-inputs.html) and [date/time/file/range contract](forms.md#native-dates-times-files-and-ranges) cover grouped hints/errors, native serialization, file selection recovery and server responsibilities using this existing API.

## Themes and customization

UI follows the system light or dark theme. Set `data-theme="light"` or `data-theme="dark"` on `html` to force a theme. Remove the attribute to return to the system preference. Theme persistence is the application's choice.

All defaults live inside the `ui` cascade layer. Normal unlayered application CSS can override them with simple selectors. Most defaults use `:where()` to keep specificity low.

```css
:root {
  --ui-content-width: 72rem;
  --ui-reading-width: 68ch;
  --ui-gutter: clamp(1rem, 3vw, 2rem);
  --ui-space: 1rem;
  --ui-radius: .375rem;
  --ui-action-bg: #005cc5;
  --ui-action-hover: #004799;
  --ui-action-text: #fff;
}
```

Color variables include `--ui-text`, `--ui-heading`, `--ui-canvas`, `--ui-surface`, `--ui-muted`, `--ui-border`, `--ui-link`, `--ui-link-hover`, `--ui-focus`, and `--ui-invalid`. Fonts use `--ui-font-sans` and `--ui-font-mono`. Set readable foreground/background pairs for each theme, including hover states.

Reference spacing (`--ui-space-0` through `-8`), radius, font-size, line-height and weight scales are available. `--ui-space` and `--ui-radius` now default to the reference aliases `--ui-space-4` and `--ui-radius-md`; their values and direct application overrides remain compatible. Native heading/body sizes consume the type tokens.

Semantic info/success/warning/danger/selected/disabled/busy roles each provide `--ui-<role>-text`, `-bg` and `-border` triplets. Disabled native controls use opaque semantic colors; selection colors are used in the workspace. `--ui-invalid` defaults to the danger border but still accepts an independent override.

Focus uses `--ui-focus`, `--ui-focus-edge` and `--ui-focus-width` (3px) throughout controls, links, disclosures, summaries, skip links and header/workspace navigation. Forced colors substitutes system colors. See [the full token contract](theming.md) for names, defaults, alias resolution and the supported scope. Native buttons support `data-variant="primary|secondary|quiet|danger"`; supported native controls support `data-size="small|default|large"`. These are CSS-only presentation choices. See [buttons and control sizes](controls.md) for exact scope, fallback values, tokens and native behavior. CSS-only `data-density="comfortable|compact"` scopes adjust composition spacing independently of control size. See [density](density.md) for consumers, nesting, tokens and precedence; unknown/empty values inherit the surrounding profile.

The original `--text`, `--headings`, `--body-bg`, `--details`, `--borders`, font, header, highlight, and dark-theme variables remain supported as fallback values. `--interactive` and `--interactive-alt` now control links only. Use the separate `--ui-action-*` variables for buttons. This prevents bright dark-mode links from also setting an unsuitable button background.

## Native interactions

`details` and `summary` provide disclosures. Popover controls use normal HTML:

```html
<button type="button" popovertarget="help">Help</button>
<div id="help" popover>Helpful content.</div>
```

A modal dialog can be opened with the browser's `showModal()` API. Close it with a `form method="dialog"` button. Supply an accessible title through `aria-labelledby`. Popovers are not modal dialogs.

The [native dialog recipe](dialog.md) documents initial/returned focus, Escape and backdrop policy, close results, form ownership, lifecycle limits and readable no-script/unsupported/open-failure behavior. [Try it](../examples/patterns.html#modal). The recipe is application code; it adds no library element or registration.

`js/examples.js` powers only the native gallery's theme selector, dialog opener, and validation demonstration. Do not include it in an application. The CSS does not depend on it. The [native popover recipe](popover.md) supplies short and long optional help with capability checks, complete inline fallback, native dismissal and non-modal background editing. Its page script installs before revealing the native opener; without it, the help remains inline. See the [focused checks](../tests/popover.html) and dated evidence.

## Optional anchored geometry

Load `js/popup.js` separately to use the experimental `UIPopup.attach({ anchor, surface, placement, gap, padding, onUnavailable })` adapter. It returns `update()` and idempotent `destroy()` methods. Defaults are block-end-start placement and 8 CSS pixels for gap/padding. It adds no custom element, semantic role, open state, focus policy or dismissal listener. Native popover visibility remains authoritative.

See the [Popup integration guide](popup.md) for complete option validation, capability requirements, style ownership, observation/teardown, unsupported-context fallback and the anchored-help consumer. The original unpositioned native popover recipe remains independent. This optional classic script has no module import, package or per-component loader.

## Migration

The documentation site now renders the source guides as static pages at `docs/*.html`, with individual component pages under `docs/components/`. The About page is `index.html`; the previous native-element gallery is retained at `gallery.html`. Update gallery fragment links such as `index.html#layouts` to `gallery.html#layouts`. Source Markdown remains available. See [documentation authoring](site.md) for the generator and example-runner contract.

The library is now named UI. Update stylesheet paths to `css/ui.css`, custom-element tags and selectors to the `ui-` prefix, CSS custom properties to `--ui-*`, and cascade-layer references to `ui`. Generated IDs also use `ui-`. The machine catalogue advances to `schemaVersion: 2` and uses `ui` route fields and `uiComponents` for existing primitives. The previous names are replaced without compatibility aliases; update markup, scripts and styles together.

The Fieldwork example now stores project data under `ui-fieldwork-project-v1`. Data saved under the previous demo key is not loaded automatically; export it from an existing copy before upgrading and retain the export as a backup.

Earlier foundation changes affected layout, spacing, and the cascade. When migrating from those versions, review pages that depend on the old constrained body, full-width images, per-element bottom margins, or button colors shared with links. The obsolete `.button` selector and invalid nested `a button` pattern are no longer styled as an API.

The stylesheet includes print styles and adds no decorative animation. Use current browsers with cascade layers and `:where()` support; `:has()`, `:user-invalid`, and popovers enhance supported browsers. Older browsers without cascade layers do not receive these layered styles.

## Accessibility

UI learns from GOV.UK’s form, error-recovery, focus, and progressive-enhancement patterns. `ui-field`, `ui-hint`, and `ui-error` wrap native form markup. Optional `ui-error-summary` behavior links errors to their fields. `ui-skip-link` preserves a native skip anchor.

Read the [accessibility contract](../ACCESSIBILITY.md) for markup, APIs, sources, and release checks. The target is WCAG 2.2 AA; a complete audit and assistive-technology testing remain outstanding. Run the [browser checks](../tests/accessibility.html) through the local server.

## Checks

When changing UI, check both HTML examples, light and dark themes, keyboard focus, native validation, dialog focus return, popover dismissal, narrow screens, zoom, print, and right-to-left content. Keep ordinary element examples class-free and reserve layout classes for explicit arrangements.

## License

[MIT](../LICENSE).

## Long information dialogs

The [long survey briefing](previews/dialog-1.html) uses a native dialog with initial focus on its heading, close forms at both ends, one native scrolling surface and complete inline fallback. Its application script resets scrolling after successful opening and supplies a surviving focus target when the opener disappears. See the [dialog contract](dialog.md#long-briefing-and-scrolling) and [focused browser checks](../tests/dialog.html). This adds a recipe, not a new registered element or library API.
