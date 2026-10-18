# UI system roadmap

UI will cover complete application interfaces while keeping native HTML, minimal classes, light DOM and optional behavior. Comparable breadth to Web Awesome is the scope reference; UI's vocabulary and implementation remain its own.

Reviewed on **16 October 2026**: [Web Awesome component catalogue](https://webawesome.com/docs/components). The [component inventory](docs/components.md) maps **90 reference entries**, including child items and the shared chart adapter, to a UI route, implementation status, phase, contract and acceptance work. It also records UI's 11 existing primitives. No reference entry is silently excluded because it is advanced, experimental or commercial in the reference system.

The [JSON catalogue](docs/components.json) is the source of truth for coverage. This roadmap defines order and dependencies. Phase numbers are sequencing, not delivery dates. Planned names and APIs are proposals. Native/foundation status describes a starting point, not equivalent features or completed accessibility verification.

## Confirmed product direction

- Current major desktop/mobile browsers, progressively enhanced.
- Plain CSS and JavaScript first; optional packages and individual modules later.
- Light DOM throughout; native controls retain semantics and form value ownership.
- `ui-` elements for useful composition/compound behavior; no wrapper required for every native control.
- Accessible defaults and meaningful content conventions; WCAG 2.2 AA is the release target.
- Semantic theme variables, coherent light/dark brands, local component geometry and low-specificity CSS.
- First-class human and agent documentation with a machine-readable component inventory.

## Delivered foundation

- [x] Native content/control styles in a named cascade layer, light/dark themes and optional root theme choice.
- [x] Responsive widths, logical layout, print defaults, visible focus and select padding/arrow clearance.
- [x] `ui-stack`, `ui-cluster`, `ui-grid`, `ui-sidebar`, `ui-panel` plus compatible class helpers.
- [x] `ui-field`, `ui-hint`, `ui-error`, `ui-skip-link` markup patterns.
- [x] `ui-form` and `ui-error-summary`: error links, hints, title/focus, native submitters/reset, custom/server error APIs, reconnect and dynamic fields.
- [x] Native element gallery, complete form and Fieldwork workspace.
- [x] Repeatable browser checks and optional axe audits with partial dated evidence.
- [x] Rewritten README, architecture/convention/theme guides, agent guide and component specification template.
- [x] Full reference coverage inventory with generated documentation and browser explorer.
- [x] Example hub, native/composed recipes and a live theme workbench with an optional forest brand.

These ticks record implementation/documentation, not an accessibility certification or a stable v1 release.

## Phase 0 — foundation contracts and evidence

This phase begins now and runs ahead of higher-level widgets.

- [ ] Complete browser/assistive-technology matrix and manual foundation testing. Resolve legacy media captions/transcripts before presenting them as complete examples.
- [x] Adopt initial server-rendered field errors without losing messages, answers or focus; clear their state after correction/reset with browser assertions and a real response example.
- [x] Preserve explicit custom-validity messages when native constraints also fail; keep valid native submissions usable with an incomplete summary.
- [x] Audit external/dynamic native form ownership, shared radio/checkbox feedback, localization and async application integration; implement ownership cleanup and translation hooks, document limits and add browser assertions plus a working cancellation/retry recipe. Manual browser/assistive-technology evidence remains in the release gate.
- [x] Add reference spacing/type/radius scales, semantic status/selection/disabled/busy tokens and existing geometry aliases while preserving current variable fallbacks.
- [x] Implement native action variants and per-control small/default/large sizes, with theme, submit/reset, target-size, RTL, focus and text-resize browser assertions; document the [controls contract](docs/controls.md).
- [x] Implement comfortable/compact density scopes for composed layouts and forms, with nested reset, local token precedence and independent control sizes; document the [density contract](docs/density.md) and browser evidence.
- [ ] Define shared feedback component variants. Complete manual zoom, touch/target and platform verification before a stable release.
- [x] Make focus tokens consistent across controls, links, header/workspace navigation, summaries and skip links; add shared width and system-color overrides with rendered palette/contrast checks. Manual forced-colors and assistive-technology verification remains in the release gate.
- [x] Specify reusable lifecycle, event, focus, locale and overlay ownership rules in the [shared contract](docs/lifecycle.md), with existing implementation limits distinguished from requirements for new components. Extract helpers only as actual implementations need them.
- [ ] Measure CSS/JS payload and choose regression budgets; retain the earlier 5 KB gzip CSS-foundation goal as a proposal, not a claimed current measurement. Optional features get separate budgets.
- [ ] Establish per-component maturity (proposal/experimental/stable), dated evidence and migration notes before v1.

Exit: one coherent foundation contract, honest test coverage, token compatibility and repeatable checks.

## Phase 1 — native component completeness

Finish recipes and verification for existing platform building blocks. These already have native/foundation routes; this phase does not imply replacing them with custom controls.

| Family | Coverage |
| --- | --- |
| Actions | Button, Button Group |
| Forms | Checkbox, Checkbox Group, Date Input, File Input, Input, Number Input, Radio Group, Radio, Select, Option, Slider, Textarea, Time Input |
| Layout | Card through `ui-panel`, Details, Dialog, Divider, Page composition, Scroller baseline |
| Navigation | Breadcrumb and Breadcrumb Item |
| Feedback / helpers | Progress Bar and native Popover |

- [x] Document each family with default, long-label, disabled/read-only, invalid, busy and fallback cases as relevant.
  - The [native family state audit](docs/native-states.md) maps component previews and integrated recipes, identifies inapplicable native states, and separates authored coverage from the open manual/platform release gates.
- [ ] Complete native dialog opening/closing/focus-return recipes and support failure behavior; do not add a duplicate modal implementation.
  - Implemented the [dialog recipe](docs/dialog.md) with explicit initial focus, native close/Escape policy, stale-result cleanup, missing-trigger focus recovery and inline no-script/unsupported/open-failure fallback. Added the [long briefing](docs/dialog.md#long-briefing-and-scrolling) with heading focus, native scrolling and two close actions. Browser/manual evidence, including the completed 119-state axe follow-up, is recorded in [ACCESSIBILITY.md](ACCESSIBILITY.md); remaining platform and assistive-technology checks keep this item open.
- [ ] Complete grouped hint/error contracts and date/time/file/range examples, including serialized form values and server responsibilities.
  - Implemented the [native-value recipe](examples/native-inputs.html) and [integration contract](docs/forms.md#native-dates-times-files-and-ranges), with separate date/time errors, shared choice feedback, file metadata/limits, native serialization and reset. Browser evidence is recorded in [ACCESSIBILITY.md](ACCESSIBILITY.md); manual/platform checks remain open.
- [ ] Verify panel composition, named scroll regions, native multiple-select behavior, nested layouts, RTL and forced colors.
  - Implemented the [survey briefing](examples/composition.html) and [composition contract](docs/reference.md#panels-scroll-regions-and-multiple-selection), with local repeated-value inspection and focused display checks. Dated browser/emulation results and remaining platform work are recorded in [ACCESSIBILITY.md](ACCESSIBILITY.md).

- [ ] Complete native popover dismissal, non-modal focus and fallback verification.
  - The [short/long help recipe](docs/popover.md) adds native invokers, complete inline fallback, background editing and focused browser checks. Remaining platform and assistive-technology evidence keeps this item open.

Exit: native primitives have reusable recipes and evidence, rather than merely matching visual screenshots.

## Phase 2 — common application interfaces

Depends on Phase 0 state/focus contracts and Phase 1 recipes. Build one compound family at a time.

1. Shared positioning utility (**Popup**), implemented experimentally in `js/popup.js` with the [anchored-help consumer](docs/popup.md) and [specification](docs/specs/popup.md). Native visibility/dismissal and consumer semantics/focus retain separate owners; readable fallback remains required.
2. **Accordion / Accordion Item**, **Tab Group / Tab / Tab Panel**, **Pagination**, **Stepper / Step**.
3. **Dropdown / Dropdown Item** command menus, **Drawer**, **Tooltip**, **Copy Button**, **Switch**.
4. **Badge**, **Callout**, **Progress Ring**, **Skeleton**, **Spinner**, **Tag**, **Toast / Toast Item**.
5. **Avatar** and **Icon** conventions, including SVG source/licensing policy and meaningful/decorative naming.

- [ ] Specify each family before code using [the component template](docs/component-template.md).
  - The [Accordion / Accordion Item proposal](docs/specs/accordion.md) defines native disclosure and name-group ownership, optional summary navigation, fragment/form-error reveal, focus recovery and lifecycle acceptance work. The wrapper, opt-in shared-entry behavior, runnable recipes and focused checks now ship experimentally; manual/platform evidence remains open.
  - The [Tab Group / Tab / Tab Panel proposal](docs/specs/tabs.md) defines linked-section fallback, manual/automatic activation, keyboard and focus ownership, fragment/form-error reveal, dynamic removal and lifecycle acceptance work. The shared-entry behavior, recipes and focused checks now ship experimentally; manual/platform release evidence remains open.
  - The [Pagination specification](docs/specs/pagination.md) defines native navigation ownership, current-page state, boundaries, ellipses, destination/focus behavior and application loading responsibilities. The CSS-only pattern and real-page recipes ship experimentally.
  - The [Stepper / Step specification](docs/specs/stepper.md) defines native ordered stages, current/completed/error state, reachable links and application-owned validation/progression. The CSS-only pattern and static state recipes ship experimentally.
- [ ] Keep tabs' linked sections and navigation URLs useful before enhancement. Keep native disclosures as the accordion baseline.
- [ ] Implement menu arrows/typeahead/Escape and focus restoration without applying menu semantics to ordinary site navigation.
- [ ] Give feedback one announcement owner and persistent alternatives for important/actionable messages.
- [ ] Add realistic app examples with error/loading/empty states and nested widget removal.

Exit: common settings, navigation, commands and feedback compose reliably with forms and themes.

## Phase 3 — rich choices and hierarchical interfaces

Depends on reusable keyboard, focus, locale and form contracts.

- [ ] **Tree / Tree Item**: single selection, visible-node navigation, expansion versus activation, typeahead and dynamic children. Multi-select and virtualization require separate specifications.
- [ ] **Combobox**: single selection first, filtering and async race policy, IME, native form submission and reset; then multi-selection only when separately proven.
- [ ] **Color Picker**, **Date Picker**, **Known Date**, **OTP Input**, **Rating**, **Tag Input**.
- [ ] Richer Date Input and Time Input editing only when the native baseline cannot meet defined needs; keep normalized native form values.
- [ ] Verify every input enhancement with autofill, FormData, required/custom validity, cancelled reset, server errors and screen readers.

Exit: rich input/explorer behavior remains compatible with the form system and keyboard/touch access.

## Phase 4 — specialist layout and media

Keep optional payload separate. Dependencies and media assets require explicit review.

- [ ] **Split Panel**: keyboard separator resizing, bounds, RTL, touch and readable static fallback.
- [ ] **Animated Image**, **Carousel / Carousel Item**, **Comparison**, **QR Code**, **Video**, **Video Playlist**, **Zoomable Frame**.
- [ ] Video starts with native controls plus verified captions, transcript and required descriptions. Add custom controls only for defined missing functionality.
- [ ] Motion defaults respect reduced motion; no autoplay in initial carousel/video recipes.
- [ ] Preserve originals, direct destinations and keyboard alternatives for visual comparison, scanning and zooming.

Exit: media tasks work beyond visual/pointer interaction and fail usefully when an optional dependency is unavailable.

## Phase 5 — data, helpers and distribution

These remain optional extensions, not mandatory dependencies of the foundation.

| Family | Coverage |
| --- | --- |
| Data | Data Grid; Bar, Bubble, Doughnut, Line, Pie, Polar Area, Radar and Scatter charts; Sparkline; shared Chart / Advanced Usage adapter |
| Formatting | Format Bytes, Format Date, Format Number, Relative Time |
| Helpers | Animation, Include, Intersection Observer, Mutation Observer, Random Content, Resize Observer; Popup is delivered earlier |
| Content | Markdown |

- [ ] Start data work with semantic table sorting/filtering and accessible summaries. Define cell-navigation/editing before any ARIA grid. Treat virtualization as its own high-risk accessibility milestone.
- [ ] Prototype one table-backed bar chart before committing to a renderer; verify theme changes, resize, data parity and non-color encodings, then expand chart types.
- [ ] Use Intl and readable server fallback text for formatting. Define timezone, locale and hydration policy.
- [ ] Prefer native CSS/JS APIs for observers and animation. Keep helper elements optional; specify timer/observer teardown and loop protection.
- [ ] Markdown and Include need explicit sanitization, trusted-origin, failure and script policies. Do not add remote content execution as a default.
- [ ] Ship per-component modules while preserving copyable CSS/JS. The combined classic-script entry `js/ui.js` and [shared initialization API](docs/enhancement.md) are implemented; module distribution remains planned.
- [ ] Add versioned npm distribution, generated custom-element metadata, token metadata, SSR/framework integration recipes and release automation after the actual public entry points exist.
- [ ] Produce stable v1 documentation, migration guidance, complete release evidence and a public accessibility statement with known limitations.

Exit: specialist packages are independently useful and the core remains small and understandable.

## Release gate for every component

A component becomes stable only with all applicable evidence:

- [ ] Purpose, minimal valid markup, native baseline, API, events, tokens and supported modes are documented.
- [ ] Keyboard, focus, pointer/touch, names/states, error/loading/empty and dismissal behavior work as specified.
- [ ] Form controls preserve values, validation eligibility, submission, reset, autofill and labels; async behavior handles cancellation and stale work.
- [ ] Late children, nested ownership, dynamic removal, disconnect/reconnect and missing APIs have defined outcomes.
- [ ] Light/dark brands, forced colors, RTL, reduced motion, 320px reflow, text resize/spacing and zoom pass applicable checks.
- [ ] Chrome, Edge, Firefox, Safari and relevant mobile/screen-reader combinations are recorded with versions and dates. Include VoiceOver/Safari and NVDA/Firefox or Chrome; choose additional combinations from audience needs.
- [ ] Automated checks have no unexplained failures; incomplete audit findings are reviewed manually. Representative task testing with disabled users informs release readiness.
- [ ] Current reference, catalogue, examples, agent entry points and migration notes agree with the runtime.

The target is [WCAG 2.2 AA](https://www.w3.org/WAI/WCAG22/quickref/). [APG](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/) guides widget interaction, but it explicitly requires browser/assistive-technology testing. GOV.UK informs content, validation and recovery conventions. No roadmap item or automated score establishes conformance alone.

## Next implementation slice

The [shared UI entry and declarative setup](docs/enhancement.md) now cover existing forms/summaries, native dialogs, popovers and anchored Popup help, including scoped teardown/resume. Experimental ui-accordion and ui-tabs initialize by element name without extra markers; other planned widgets are not initialized.

The first **Phase 2 Popup geometry utility** and anchored-help consumer are implemented experimentally; follow the [integration guide](docs/popup.md), [specification](docs/specs/popup.md) and [lifecycle and ownership contract](docs/lifecycle.md). Native Popover remains an implemented Phase 1 recipe; Popup adds anchored placement rather than replacing its semantics or dismissal. Keep remaining geometry/platform evidence open before stable maturity. The [Accordion family](docs/accordion.md) now ships experimentally with native-disclosure composition, opt-in shared-entry behavior, runnable recipes and focused checks. Keep its manual/platform release evidence open. The [Tabs family](docs/tabs.md) now ships experimentally through the shared entry, with coordinated fragment/form-error reveal, recipes and focused checks. Keep its manual/platform release evidence open. The [Pagination pattern](docs/pagination.md) now provides CSS-only native link composition and real static result-page recipes; keep manual/platform evidence open. The [Stepper / Step pattern](docs/stepper.md) now provides CSS-only ordered task stages with native reachable links and explicit status text; keep manual/platform evidence open. Next specify Dropdown / Dropdown Item command menus before adding their compound behavior.

Continue the remaining Phase 0/1 manual browser, assistive-technology, touch, forced-colors and release evidence alongside this work. Shared feedback, payload budgets and maturity/migration work remain open. Other compound widgets still require their own specifications before implementation.
