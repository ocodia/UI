# Interface conventions

These conventions guide every component. Use them when building applications or defining a new widget contract.

## Meaning and content

Use anchors for destinations and buttons for operations. Give headings a meaningful hierarchy and write action labels as verbs: “Save project”, “Export report”. Every icon-only action needs an accessible name; unfamiliar or consequential actions should also have visible text. Native elements keep their meaning regardless of appearance.

Ordinary navigation is a named `nav` with links and `aria-current="page"`. Nested navigation can use native disclosures. A tree is an explorer with hierarchical focus/selection. A menu is a set of commands with menu keyboard behavior. A cluster of buttons is not automatically a toolbar.

Tabs switch panels within one context; they are not page navigation or a step-by-step form. Enhance fragment links and readable sections only when the widget can supply the full keyboard/state contract. Arrow keys move within composite widgets; Tab moves between widgets. Never add a positive tabindex.

## Forms

Ask one question per `ui-field`. Use a fieldset/legend for related choices. Labels remain visible. State which answers are optional; keep hints concise and associate them with `aria-describedby`. Prefer meaningful autocomplete and input types. Use text rather than number inputs for identifiers, phone numbers and codes.

Validate on submission by default. Preserve values, show inline text and a linked summary, focus the summary, and identify errors in the page title. Do not announce every keystroke as an error. Applications own server rules, authorization, persistence and async validation. Follow the [form integration contract](forms.md) for external ownership, grouped feedback, localization and stale async responses. Describe required formats before the user makes a mistake.

Checkboxes collect choices, radios choose one from a set, selects conserve space, and a combobox adds search when a long list justifies it. Switches apply binary settings immediately and need pending/failure behavior. Use the simplest control that solves the task.

## Overlays and focus

Use native dialog for modal tasks and native popover for non-modal contextual content. Modal content has an accessible title, sensible initial focus, explicit close action, Escape policy, background inertness and focus return. Popover semantics follow its content. A positioning utility must never infer that content is a menu or dialog.

Tooltips add non-interactive supplemental descriptions; essential instructions stay visible. Menus, tooltips and drawers must work with keyboard, touch and pointer. Do not make hover the only discovery mechanism. Restore focus to a logical survivor when a focused item is removed.

## Visual states and variants

Distinguish default, hover, focus, active/pressed, selected, current, expanded, disabled, invalid and busy. Use persistent text/markers plus color for meaning. Never suppress the shared focus indicator to make a theme look cleaner.

Comfortable composition is the default. Opt into `data-density="compact"` where reduced surrounding spacing helps repeated tasks; restore comfortable spacing with a nested `data-density="comfortable"` scope. [Density](density.md) preserves native control sizes and readable text. Check actual target sizes, text resizing and focus after application overrides. Responsive layout follows content and container space; arbitrary breakpoint utility classes should not be required.

Native buttons use `data-variant="primary|secondary|quiet|danger"` for action emphasis. Supported native controls use `data-size="small|default|large"`; apply it to each control. See [buttons and control sizes](controls.md). Prefer native state attributes and keep native `size` semantics. Feedback component vocabulary **neutral**, **info**, **success**, **warning**, **danger** remains planned. Do not invent `variant`, custom `size` or responsive attributes.

## Feedback and data

Design empty, loading, error, success and populated states together. Keep current content while a background operation is pending when possible. Progress needs a name and value/text. Announce status concisely without moving focus; important or actionable notifications need a durable home.

Start data interfaces with semantic tables, real headers and named sorting buttons. Use `aria-sort` on the active header. Reserve ARIA grid for genuine cell-navigation/editing interfaces. CSS `ui-grid` is purely layout. Charts supplement accessible tables, units and summaries; tooltips and color cannot be the sole access to data.

Respect `lang`, `dir`, locale, timezones and reduced motion. Use logical CSS properties. Render long labels, translated text, empty lists and loading failures in examples. Never hide overflow at page level to conceal broken layouts.

## Rationale

UI follows native semantics and tests compound behaviors against [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/). GOV.UK informs content, validation, focus and progressive enhancement; it also demonstrates that production design systems need explicit integration guidance. See [GOV.UK production guidance](https://design-system.service.gov.uk/get-started/production/). These conventions are UI design decisions, not claims of another system's endorsement.
