# UI documentation

UI is a complete UI system in development, built around native HTML and optional light-DOM custom elements. Begin with shipped features; consult the catalogue before using any proposed element.

Every guide below is available as a rendered page in the documentation site. Browse the component sidebar or use the [component searcher](../examples/components.html) to find a specific control. Shipped component pages combine examples, inspectable code, native API tables and verification limits. Resize an example with its edge handle or width control to test actual viewport behavior.

## Use UI

1. [Getting started](getting-started.md): files, page structure, enhancement and examples.
2. [Current API](reference.md): exact layouts, CSS variables, forms and summary methods available today.
3. [Theming](theming.md): token layers, light/dark brands, scope and verification.
4. [UI conventions](conventions.md): navigation, commands, content, choices and feedback.
5. [Component catalogue](components.md): every reference component, UI approach, phase and acceptance work.

[Shared UI JavaScript](enhancement.md) provides one script, declarative overlay markup, automatic static initialization and scoped enhance/destroy methods. Existing form APIs and smaller entry points remain compatible.

[Buttons and control sizes](controls.md) documents the implemented `data-variant` and `data-size` attributes, native semantics and theme variables.

[Form integration](forms.md) covers external/dynamic ownership, checkbox/radio questions, localization and application-owned asynchronous submission.

[Density](density.md) documents comfortable/compact composition, nested scopes and independent control sizes.

[Native dialog](dialog.md) covers modal opening/closing, focus, forms, lifecycle and support-failure fallback, plus a [long briefing](previews/dialog-1.html) with heading focus and native scrolling.

The [native-value recipe](../examples/native-inputs.html) combines grouped errors with date, time, file and range inputs. Read the [native-input integration contract](forms.md#native-dates-times-files-and-ranges) for serialized values and server responsibilities.

The [survey briefing](../examples/composition.html) demonstrates nested panels, named scroll regions and native multiple selection. Its [composition contract](reference.md#panels-scroll-regions-and-multiple-selection) explains reading order, keyboard access, repeated values and reset.

See the [native family state audit](native-states.md) for authored default, long-content, disabled/read-only, invalid, busy and fallback examples and their verification limits.

[Native popover](popover.md) covers optional non-modal help, declarative invokers, focus and complete inline fallback, including long-content scrolling.

## Build UI

Read [architecture](architecture.md) and the [lifecycle and ownership contract](lifecycle.md) before implementation. The optional experimental [Popup adapter](popup.md) positions anchored help with native popover visibility, complete inline fallback and scoped cleanup. Its [specification](specs/popup.md) remains separate from richer menu/tooltip interactions. Use the [component template](component-template.md) to define behavior before adding code. Follow [contributing](../CONTRIBUTING.md) and the [accessibility contract](../ACCESSIBILITY.md). The [roadmap](../ROADMAP.md) defines sequence and dependencies, not release dates.

To change this site, read [documentation authoring](site.md). The pages use UI's own layouts, native controls and disclosures. Guide content, examples and code drawers remain readable without the documentation script.

## Understand status

- **Native recipe:** an existing HTML primitive styled by UI. It does not promise all features of another library's component.
- **Foundation:** an existing UI primitive or optional adapter used as the starting point for that component. Popup also carries experimental maturity; foundation is not a stable-release claim.
- **Planned:** no implementation is promised; names, attributes and methods are proposals.
- **Release readiness:** tracked separately through evidence. Native/foundation does not mean audited or stable v1.

The JSON field values are `native`, `foundation`, and `planned`. [components.json](components.json) is the scope inventory; [components.md](components.md) and [the browser explorer](../examples/components.html) are generated views of it.

## Examples

[Example hub](../examples/index.html) · [recipes](../examples/patterns.html) · [server error recovery](../examples/server-errors.html) · [theme workbench](../examples/themes.html) · [workspace](../workspace.html) · [browser checks](../tests/accessibility.html).

## For agents

Start with [AGENTS.md](../AGENTS.md), then the current API and JSON catalogue. [llms.txt](../llms.txt) provides a compact entry point. Do not generate code from a roadmap proposal as if the component were registered.

The experimental [Accordion guide](accordion.md) covers native disclosure groups, optional summary navigation, deep links, form-error reveal and scoped lifecycle.

The experimental [Tabs guide](tabs.md) covers linked sections, keyboard activation, nested fragment/form-error reveal and scoped cleanup.

The [Pagination guide](pagination.md) covers CSS-only native page links, boundaries, real static-page examples and application focus/loading ownership.

The [Stepper guide](stepper.md) covers CSS-only ordered task stages, current/completed/error text, reachable links and application progression ownership.

The experimental [Dropdown command menu guide](dropdown.md) covers native command lists, popover dismissal, keyboard/typeahead, form/link activation and inline fallback.

The experimental [Icon guide](icon.md) covers local SVG libraries, meaningful/decorative names, authored fallbacks and a [searchable Fluent browser](../examples/icons.html).
