# Architecture

## Decisions

UI targets current major browsers with progressive enhancement. Distribution starts as plain CSS and JavaScript. All components use light DOM. These choices were confirmed for the complete UI system on 16 October 2026.

Use `ui-` as the project prefix. Keep native controls inside compound elements; do not create `ui-button`, `ui-input`, or `ui-option` merely to restyle an existing native element. Prefix availability in the wider ecosystem must be checked before publishing a package, without changing existing documents silently.

## Layers and ownership

| Layer | Responsibility | Current files |
| --- | --- | --- |
| Foundation | Tokens, native styles, layouts, focus, print | `css/ui.css` |
| Behavior | Optional light-DOM enhancement, lifecycle, state coordination | `js/ui.js` combined entry; sources `js/components.js`, `js/popup.js`, `js/icons.js`, `js/enhance.js` |
| Brand | Semantic palette overrides for system/light/dark | `themes/forest.css` |
| Application | Persistence, routing, data loading, permissions, business rules | `js/workspace.js`, `css/workspace.css` |
| Documentation | Current APIs, planned contracts, recipes and reference scope | `docs/`, `examples/` |

The combined and form-only entries register only `ui-form` and `ui-error-summary`. The original nine additional `ui-` elements are CSS-only: stack, cluster, grid, sidebar, panel, field, hint, error and skip-link. The experimental `ui-accordion` and `ui-tabs` wrappers also have CSS block layout and optional shared-entry enhancement by element name. Tabs use a native named `nav` followed by sibling sections: navigation is readable before enhancement, and the parent installs tab-list semantics only when ready. The experimental `ui-menu` wrapper enhances native command lists through the shared entry by element name, with native popover visibility and Popup geometry. The CSS-only `ui-pagination` boundary composes native navigation links without registration or initializer. The CSS-only `ui-steps` boundary composes a native ordered list of task stages; no ui-step registration or progression controller is added. Native form values stay on input/select/textarea. Standard labels, autofill, FormData, submitter, reset and validation eligibility remain platform-owned.

Do not wrap native elements in custom elements where HTML's content model forbids it: `option` stays inside `select`, `li` stays inside lists, and table rows/cells retain native parents. A wrapper surrounds a valid structure rather than replacing its required children.

## Enhancement contract

1. Read authored light DOM without destroying application content or native event listeners.
2. Validate required structure. Incomplete/ambiguous markup stays usable as its native baseline.
3. Generate only necessary IDs, hints, messages or controls; merge authored descriptions without overwriting unrelated IDs.
4. Install interaction behavior before applying roles, hiding inactive content or disabling native validation.
5. Keep only one owner for focus, selection, expansion, dismissal and form value. State attributes are the styling source of truth.
6. Disconnect listeners, observers and timers; restore enhancement-owned changes. Reconnect must not duplicate work.
7. Define nested-component event ownership and child insertion/removal before calling a widget complete.

The form observes relevant document mutations because native `form` associations can cross wrapper boundaries. Ownership and enhancement-added hint/error cleanup follow the native control’s current form; see [the integration contract](forms.md). Async request lifecycle stays in the application.

The existing form implementation is the first behavior module, not a universal base class. Extract shared ID, focus, keyboard, locale and positioning helpers only after a second implementation establishes a real need. Keep low-level popup geometry separate from modal/dialog/menu semantics.

The [lifecycle and ownership contract](lifecycle.md) defines initialization, reconciliation, nested events, cleanup, focus recovery, locale and async boundaries for new implementations. It records existing form and static-recipe limits separately from future requirements. The [Popup specification](specs/popup.md) applies that contract to the optional experimental `UIPopup.attach` geometry adapter in `js/popup.js`. It adds no registration; the [integration guide](popup.md) documents the actual API.

## Public API conventions for new components

These are design rules for future work; they do not add APIs to existing elements.

- Native attributes keep their standard meanings. Boolean attributes use presence/absence; `disabled="false"` is still disabled.
- Use HTML children for labels, rich content, and item lists. Do not require JSON configuration for ordinary markup.
- Configuration attributes express meaningful alternatives, not redundant defaults. Document default values, parsing, reflection and invalid-value behavior.
- Use methods for imperative work; return values and failures must be specified. Keep event handlers out of configuration objects.
- Prefer native `input`, `change`, `submit`, `reset`, `toggle`, `close` and `cancel` when their actual operation matches. Do not emit fake native changes on initialization.
- A genuinely custom event uses `ui-<operation>` (for example a proposed `ui-select`) and documented `detail`; it bubbles and is composed for framework compatibility. Cancelable before-events use `ui-before-<operation>` only where cancellation has a supported rollback.
- Properties accepting objects/functions need a documented attribute relationship; callbacks such as the current `ui-form.validator` stay JavaScript-only.
- Selection, focus, current location, pressed and expansion are separate states. Reflect only the semantics a component owns.

## Delivery shape

Keep the current copyable files working. The generated `js/ui.js` combines existing form behavior, geometry and opt-in enhancement without runtime loading. `UI.enhance` and `UI.destroy` provide the [shared lifecycle API](enhancement.md); implemented native overlays and ui-accordion/ui-tabs/ui-menu/ui-icon/ui-drawer elements are initialized. Later split behavior into optional per-component ES modules, publish versioned packages and generated manifests, and support SSR markup without requiring a framework. Do not advertise imports, CDN URLs, package names, autoloaders or a `dist/` directory before they exist.

All visual tokens remain in the named `ui` cascade layer; unlayered application CSS can override them. Future sublayers and component styles must have declared order. Dependency selection requires a concrete benefit, license review, payload measurement and fallback plan; optional charts/Markdown/QR libraries must not enter the CSS foundation bundle.

## Evidence and evolution

Keep current APIs in [reference.md](reference.md), scope in [components.json](components.json), sequence in [the roadmap](../ROADMAP.md), and results in [ACCESSIBILITY.md](../ACCESSIBILITY.md). Proposed names can change until implemented and documented. Before v1, record breaking changes and migration instructions; after v1 use semantic versioning with deprecations. A checklist tick means implemented, not independently audited.

The experimental [Icon loader](icon.md) also enhances ui-icon by element name through the shared entry. Its internal js/icons.js source owns bounded local SVG fetching, validation, naming, fallback and teardown. It adds no custom-element registration. Local SVG libraries are separate assets under icons/ and stay outside the JavaScript bundle.

The experimental [Drawer](drawer.md) enhances ui-drawer around a native dialog, sharing the native overlay ownership rules without a second dialog adapter. Four logical viewport edges use CSS; modality, dismissal and native form values stay platform-owned. No registration or entry file is added.
