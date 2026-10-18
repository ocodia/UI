# Accessibility in UI

UI's target is WCAG 2.2 AA, with stronger defaults where practical. This is a development target, not a claim that UI or applications built with it have passed a full audit.

GOV.UK supplies useful design guidance. UI implements its own markup and behavior, so GOV.UK's research and conformance do not transfer automatically. Accessibility requires continued testing with disabled people and assistive technology. [GOV.UK accessibility strategy](https://design-system.service.gov.uk/accessibility/accessibility-strategy/).

## HTML first, custom elements around it

Custom elements provide composition and enhancement. Native elements provide labels, controls, form submission, headings, lists, and landmarks.

```html
<ui-field>
  <label for="name">Project name</label>
  <ui-hint id="name-hint">Use a short name, up to 100 characters.</ui-hint>
  <ui-error id="name-error" hidden>Error: Enter a project name</ui-error>
  <input id="name" name="name" maxlength="100"
         aria-describedby="name-hint" required>
</ui-field>
```

`ui-field`, `ui-hint`, and `ui-error` are CSS-only wrappers. They do not generate or replace the native label or input. An author's explicit IDs and associations work before JavaScript loads. Use a fieldset and legend for related controls; these wrappers do not replace their semantics. [GOV.UK text input guidance](https://design-system.service.gov.uk/components/text-input/).

Keep light DOM as the default. Do not move native controls behind a shadow boundary merely to encapsulate their styling. Add ARIA only when native HTML does not provide the required semantics. Layout elements remain non-interactive and receive no widget roles.

## Error recovery

Use specific messages that identify the answer and explain the correction. Keep the entered values. Show an inline message and a summary linking to every affected control. Add `aria-invalid="true"` and append the error ID to `aria-describedby`, preserving hint IDs. Prefix inline messages with real text such as “Error:”; color is not the only signal. [GOV.UK error messages](https://design-system.service.gov.uk/components/error-message/).

Place the summary near the top of main content. On unsuccessful submission, prefix the document title with “Error:”, show the summary, and focus it. Summary links focus the corresponding fields. The same error wording appears in the links and beside the fields. [GOV.UK error summary](https://design-system.service.gov.uk/components/error-summary/).

```html
<ui-error-summary hidden tabindex="-1"
                 role="region" aria-labelledby="errors-title">
  <h2 id="errors-title">There is a problem</h2>
  <ul></ul>
</ui-error-summary>
```

Load `js/components.js` to register the summary behavior. Its application API is:

```js
summary.show([{ control: nameInput, message: 'Enter a project name' }]);
summary.clear();
```

`show()` creates plain-text links and focuses the summary. It requires an `h2`, a `ul`, and controls with unique document IDs. Error links also reveal containing disclosures. `clear()` hides the summary and removes its links. The component cleans up its event listener when disconnected.

When used alone, the summary leaves validation, inline messages, field associations, and the document title to the application. An enclosing `ui-form` now coordinates those responsibilities for one native form. The component does not invent validation rules or alter those states. A server can render a visible summary and inline errors using the same HTML; links still navigate without JavaScript.

The workspace uses `ui-form` to demonstrate this contract. It validates on submission, preserves answers, retains errors until resubmission or reset, and restores the original title after correction. Native browser validation remains enabled unless the custom summary behavior is ready. Production applications must also validate submitted data on the server. [GOV.UK validation guidance](https://design-system.service.gov.uk/patterns/validation/).

Avoid combining focus movement with multiple assertive live announcements of the same errors. UI's summary uses a labelled region and programmatic focus. Routine save messages use a separate polite status. Announcements still need verification with screen readers.

## Navigation and focus

`ui-skip-link` wraps a real anchor. It becomes visible on focus and leads to a native `main` with `tabindex="-1"`. Keep it first in the body. No JavaScript is required. [GOV.UK skip link](https://design-system.service.gov.uk/components/skip-link/).

```html
<ui-skip-link><a href="#main">Skip to main content</a></ui-skip-link>
<main id="main" tabindex="-1">...</main>
```

UI defaults to a yellow-and-dark focus pair across controls, links, disclosures, summaries, skip links and header/workspace navigation. Focused text uses the pair for fill/text/edge; controls and error summaries retain the two-color outline treatment. Both colors and the shared 3px width use documented tokens. Forced-colors mode uses a system outline and system text/background colors. Form-control borders have a separate contrast token. Test customized themes independently. [GOV.UK focus guidance](https://design-system.service.gov.uk/get-started/focus-states/).

## Complexity must earn its place

Use headings and links before hiding content behind tabs. Tabs are suitable for related alternate panels, not sequential instructions or information users must compare. The future `ui-tabs` must preserve readable linked sections without JavaScript and support a readable narrow-screen fallback. [GOV.UK tabs guidance](https://design-system.service.gov.uk/components/tabs/).

Prefer disclosure navigation to trees for ordinary sidebars. Keep native select unless search is needed. Reserve command menus and ARIA grids for interfaces that need their complete interaction models. Follow the WAI-ARIA APG keyboard conventions for enhanced widgets.

## Component release checks

Every interactive component must document and check:

- Native markup, accessible names, descriptions, grouping, and states.
- Every keyboard operation, focus entry/exit, dismissal, and restoration.
- Behavior before JavaScript loads and when it fails.
- Empty, invalid, busy, disabled, long-content, and nested states.
- Text contrast, control contrast, and focus visibility in light/dark themes.
- 320 CSS-pixel reflow, 200% text resizing, 400% zoom, and user text spacing.
- Pointer targets, touch, right-to-left content, forced colors, reduced motion, and print.
- Chromium, Firefox, and Safari, with documented screen-reader/browser combinations.

Use automated checks to find defects, then perform manual checks and user testing. Do not hide audit findings with rule exclusions simply to obtain a passing score.

## Checks available now

Serve the repository and open `tests/accessibility.html`.

- **Run component checks** tests summary naming, focus, safe message rendering, error-link focus, disclosure opening, native submission, form validation and reset, server-error adoption, custom-validity precedence, incomplete-summary fallback, dynamic fields, reconnect behavior, and layout variables. It needs no network connection.
- **Run example checks** tests catalogue filtering/reset, real brand/mode changes, token aliases and legacy overrides, state contrast, focus palettes, checkbox sizing, form values/errors, parsed server-response recovery, native dialog state/focus/close results and support-failure fallback, and all six newer example pages at 320px in LTR/RTL with scripts blocked. It needs no network connection.
- **Run documentation checks** tests rendered specifications, shared navigation, native Code drawers, live checkbox values, actual iframe width, keyboard width handlers/RTL, copy success/denial, preview message ownership, local form validation/reset, multiple selects, range values and 320px no-script guide/component reflow. Host-to-preview theme/brand/direction synchronization is included in the current suite; its last added assertion awaits a browser rerun.
- **Check without JavaScript** loads the workspace with scripts blocked and checks native labels, hints, validation, and 320px LTR/RTL layout.
- **Audit examples with axe-core** loads pinned axe-core 4.14.0 from jsDelivr inside a test iframe. It checks twelve pages, including About, the retained gallery, rendered controls and checkbox documentation, in light/dark themes; the open native dialog; both brands/focus palettes on the theme workbench (with header-link focus); and the workspace's error state. This is a test-only dependency. Results include incomplete checks for manual review.

Manual checks still required include full keyboard traversal, actual screen-reader announcements, zoom/text-spacing behavior, forced colors, RTL, native control differences, and testing with disabled people. A passing automated run is not an accessibility certification.

The legacy audio/video examples still require verified transcripts, captions, and any necessary visual descriptions. Do not treat those media assets as a completed accessible-content example. Native select popup contrast also requires platform-specific manual review.

## Recorded checks: 16 October 2026

Safari on macOS, using the local HTTP examples:

- All 37 component checks passed, covering error summaries, native submission, grouping, reset, dynamic fields, reconnect, multiple forms, and layout behavior.
- No-JavaScript workspace checks passed, including 320px LTR/RTL page overflow.
- Axe-core 4.14.0 reported zero violations for index, form, and workspace in both light/dark themes, including the embedded form preview.
- The workspace error-state audit reported zero violations. Browser assertions passed for summary focus, error links, preserved hints, field focus, and reset cleanup.
- Axe left native select contrast for manual review on each page, plus video captions on the index. These are not counted as passed checks.
- Default control-border contrast calculates to 4.82:1 in light mode and 5.94:1 in dark mode. Focus yellow/dark contrast calculates to 14.55:1. These figures cover those token pairs, not every possible theme or native popup.

This is a partial test record. Chromium, Firefox, actual screen-reader output, text resizing/zoom, forced colors, and disabled-user testing have not yet been completed for this change.

## UI-system documentation and examples: 17 October 2026

Safari on macOS, served locally:

- All 37 existing component checks and 27 new example integration checks passed. New checks cover catalogue filters and reset, theme attributes and computed colors, validation and FormData, dialog focus return, and four no-JavaScript pages at 320px in both LTR and RTL.
- Axe-core 4.14.0 reported zero violations for seven pages in light/dark, including both default/forest brands on the workbench (16 page/brand/mode combinations), plus the workspace's invalid-form state.
- The new example hub had no incomplete axe findings. Native select contrast remains an incomplete manual finding on the explorer, recipes and workbench; the legacy gallery's video captions remain unresolved.
- HTML/CSS parsing, JavaScript syntax, local documentation links/anchors and generated catalogue consistency checks passed.

These results do not complete the manual release gate. The full-system roadmap makes browser/screen-reader evidence, theme/state testing and disabled-user task testing prerequisites for stable components. Planned components have no accessibility implementation claim.

## Reusable-form contract

`ui-form` wraps native HTML rather than replacing it. It automatically associates hints inside `ui-field`, preserves other description IDs, and groups radio errors through their native fieldset. Valid submissions keep their native event and submitter; invalid submissions are stopped before ordinary application handlers. Validation runs on submission, not on every keystroke.

Required whitespace-only text is rejected. Disabled and read-only controls retain native validation eligibility. Custom validity messages remain supported. Authors can supply synchronous domain rules or display server errors through the documented API. Native validation remains the fallback before initialization, after disconnect, or when a wrapper contains multiple forms. Async validation remains an application responsibility.

Visible server field errors with explicit `aria-invalid="true"` are adopted without replacing a visible authored summary or moving focus. Clearing/correcting/resetting removes the adopted field states and error descriptions while preserving hints and answers (reset restores default answers). An existing server `Error: ` title prefix is removed when the last managed form clears. Server domain messages are not cached as generic required-field text. Follow the [server-rendered error contract](docs/reference.md#server-rendered-errors), including its native-validation eligibility and application-owned server rules.

Layout gap variables are local to their components. `ui-sidebar` wraps in DOM order, and `ui-panel` adds no interactive behavior or landmark role. These additions retain the earlier manual-testing obligations.

## Server-error recovery checks: 17 October 2026

| Browser on macOS | Component checks | Example checks | Axe audit |
| --- | --- | --- | --- |
| Chrome 155.0.8059.80 | 53 passed | 38 passed | Zero violations in 18 page/brand/mode combinations plus the workspace invalid state |
| Safari 27.0.1 | 53 passed | Expanded response suite not rerun | Expanded audit not rerun |

The 16 added component checks cover initial server markup, preserved focus/answers/links, title cleanup, domain-message reuse prevention, custom-validity precedence, external error associations, radio-group cleanup, cancelled/native reset, and incomplete-summary fallback. Example checks also load an actual pre-rendered response before component registration, exercise correction/resubmission, and verify 320px LTR/RTL fallback with scripts blocked.

The response page had no incomplete axe findings in light or dark mode. Existing native select contrast and legacy video-caption manual findings remain. HTML parsing, JavaScript syntax and documentation/catalogue integrity checks passed. Chrome's response page was also visually reviewed.

This adds partial browser evidence; it does not complete Firefox/Edge/mobile, screen-reader, zoom/text-spacing, forced-colors or disabled-user testing. External ownership changes, complex grouping, localization and async integration remain explicit Phase 0 work.

## Token and focus checks: 17 October 2026

Chrome 155.0.8059.80 on macOS, served locally:

- All 53 component checks and 93 example checks passed. The 55 new token checks cover rendered spacing/radius/type aliases, direct and legacy overrides, seven semantic state triplets across two brands/modes, disabled text, checkbox sizing and both focus palettes on inputs, text links, header links, error summaries and skip links.
- Sample text met 4.5:1 and applicable state markers met 3:1 against their own backgrounds in the checked default/forest light/dark combinations. Disabled text met the same text target by design; no inactive-marker contrast claim is made.
- Axe-core 4.14.0 reported zero violations in 22 page/brand/mode/focus combinations plus the workspace invalid state. The workbench audit focuses a real header link in each palette. An initially reported scrolling code-region issue was fixed with explicit keyboard focus and accessible names, then the audit was rerun successfully.
- The no-JavaScript workspace check passed. The expanded example suite also checked 320px LTR/RTL pages with scripts blocked. State samples were visually reviewed in Chrome.
- Existing native select contrast and legacy media-caption manual findings remain. Safari/Firefox/Edge/mobile and manual forced-colors, zoom/text-spacing and screen-reader checks were not rerun for this token change.
- HTML/CSS parsing, changed JavaScript syntax, documentation links and generated catalogue checks passed. Foundation CSS measured 21,230 bytes raw / 4,682 bytes gzip at level 9 without minification (previously 3,983 bytes gzip); optional brand/example styles are separate. This is a measurement, not a regression-budget enforcement tool.

The scales and shared colors are implemented; variants, control sizes, density and the remaining accessibility release evidence are still Phase 0 work.


## Native action and size checks: 17 October 2026

Chrome 155.0.8059.80 on macOS, served locally:

- All 53 component checks and 168 example checks passed, including 75 new control checks. The new assertions cover four action variants in both brands/light-dark modes, normal/hover-token text contrast, shared disabled/focus styles, unknown-value fallback, native submitters/name-value/reset behavior and unchanged link semantics.
- Small/default/large controls met their configured minimum dimensions, small text stayed at least 1rem, selects retained arrow clearance in LTR/RTL, wrapper attributes did not resize descendants, checkboxes stayed square and native select rows remained usable. Long button labels wrapped without clipping in a 280px fixture with the root font doubled. This is a text-resize simulation, not a manual browser-zoom test.
- The no-JavaScript workspace check passed, including 320px LTR/RTL overflow checks. Dark-mode action and size examples were visually reviewed.
- Axe-core 4.14.0 completed all 23 states (22 page/brand/mode/focus combinations plus the workspace invalid state) with zero violations.
- Native select contrast remains a manual review finding, including the three new size examples. The legacy gallery video-caption finding remains unresolved. Safari/Firefox/Edge/mobile, screen readers, actual zoom/text-spacing, touch and forced colors were not verified for this change.
- HTML/CSS parsing, changed JavaScript syntax, documentation links and generated catalogue checks passed. Foundation CSS measures 25,525 bytes raw / 5,172 bytes gzip at level 9 without minification; optional brand/example styles are separate. The provisional 5 KB gzip goal remains an unconfirmed budget, and these measurements are not enforced automatically.

Action variants and individual control sizes are implemented. Shared density and feedback variants remain Phase 0 work; this evidence does not establish WCAG conformance or stable component status.


## Form integration audit: 17 October 2026

Safari 27.0.1 on macOS, served locally:

- All 85 component checks and 186 example checks passed. The 32 new component checks exercise external native ownership/submitters, late fields, `form` and form-ID reassignment, external control/error ID changes, removal, disabled/read-only fields and fieldsets, hint cleanup, radio-group membership/targets, shared checkbox rules, localized authored/server/constraint messages, invalid async message callbacks and title restoration.
- The example suite adds 15 application checks for pending/success/field rejection/service failure, preserved external answers and hints, retry, duplicate pending submission, cancellation/focus return, edit invalidation, cancelled/native reset, checkbox validation before transport, editor removal and French recovery. Three additional checks cover the new page's 320px LTR/RTL and readable-content fallback with scripts blocked. The separate no-JavaScript workspace check passed too.
- Axe-core 4.14.0 reported zero violations across 35 states: 24 page/brand/mode/focus combinations, the workspace invalid state, and 10 form-integration states covering grouped errors, French errors, pending work, service failure and async field rejection in both light/dark modes. The new page's native response select remains an incomplete contrast finding requiring manual review; existing native select and legacy video-caption findings remain unresolved.
- The new integration page was visually reviewed in dark-mode Safari. These checks do not establish screen-reader announcement quality, native autofill behavior, actual zoom/text-spacing, forced colors, mobile or disabled-user task success. The final expanded suite was not rerun in Chrome/Firefox/Edge; an earlier Chrome run passed the initial 80 component checks before the last five ID/fieldset regressions were added.
- Changed JavaScript syntax, repository HTML parsing, local documentation links, generated catalogue consistency and whitespace checks passed. Optional component JavaScript measures 20,141 bytes raw / 5,212 bytes gzip at level 9 without minification (previously 13,954 / 3,846); CSS is unchanged. Payload regression budgets remain roadmap work.

The implementation/integration portion of the Phase 0 form audit is complete. Async transport remains application-owned, and the example uses a local timer with no server request. Cross-browser, assistive-technology and manual release evidence remains open. See [the integration contract](docs/forms.md) for native ownership, grouping, localization, response ordering and lifecycle limits.


## Composition density checks: 17 October 2026

Safari 27.0.1 on macOS, served locally:

- All 85 component checks and 225 example checks passed. The 37 new density checks cover unchanged defaults/control geometry/prose, compact layout/form spacing, choice-label targets, nested resets/reapplication, empty/unknown attributes, root/local/reference token overrides, class alternatives, both brands/light-dark modes, keyboard focus, RTL select-arrow clearance and native form validation/submission/reset. Two additional checks verify distinct spacing and native form fallback with scripts blocked.
- A 280px compact fixture reflowed in LTR/RTL with doubled root text, 1.5 line height, .12em letter spacing, .16em word spacing and 2em paragraph spacing. Long labels/actions remained visible without horizontal overflow or clipped button text. The harness waits for rendered frames after the preceding root-text-resize test; these are automated simulations, not manual browser zoom or full text-spacing conformance evidence.
- Axe-core 4.14.0 reported zero violations across 43 states: the previous 35 page/theme/form states and eight compact-form error states across both brands, light/dark and both focus palettes. Compact errors focused their summary. Native select contrast, including the new density selects, remains incomplete and requires manual review; the legacy gallery's video-caption finding remains unresolved.
- The no-JavaScript workspace check passed. Comfortable/compact comparison and nested density examples were visually reviewed in dark-mode Safari. Chrome/Firefox/Edge/mobile, actual zoom, forced colors, touch, screen readers and disabled-user task testing were not completed for this change.
- HTML/CSS parsing, changed JavaScript syntax, local documentation links, generated catalogue consistency and whitespace checks passed. Foundation CSS measures 26,850 bytes raw / 5,405 bytes gzip at level 9 without minification (previously 25,525 / 5,172); library JavaScript is unchanged. Payload budgets remain unconfirmed roadmap work.

Density is an implemented composition contract for layouts and forms, independent of control sizes. It does not certify every interface placed within a scope. See [density](docs/density.md) for exact consumers, inheritance, override rules and remaining verification obligations.


## UI naming migration checks: 17 October 2026

Safari 27.0.1 on macOS, served locally on port 8765:

- All 85 component checks and 225 example checks passed after updating element selectors, generated IDs, CSS token names and stylesheet paths. The example suite includes both brands/light-dark modes, density, native submission/reset, dialog focus return, and 320px LTR/RTL fallback checks.
- The separate no-JavaScript workspace check passed: native labels, hints, validation and CSS layouts remained usable, script-only actions stayed hidden, and the page had no horizontal overflow at 320px in LTR/RTL.
- The test harness was visually inspected in dark-mode Safari. The example frame was scrolled into view to allow Safari's rendered-frame assertions to complete.
- JavaScript syntax checks passed for all 16 script files. Documentation links, catalogue generation/freshness, registration/catalogue agreement and whitespace checks passed. A source scan found no previous project names or element prefixes in project text files.
- This naming change does not complete Phase 0 or Phase 1 release gates. Axe, other browsers, screen readers, manual zoom, forced colors and touch were not rerun; earlier findings remain open.

## Phase 1 native dialog checks: 17 October 2026

Safari 27.0.1 (22625.1.29.11.28) on macOS, served locally on port 8765:

- All 85 component checks and 243 example checks passed. The expanded dialog coverage has 20 assertions replacing the previous two: enhancement without focus movement, accessible heading, real modal state, initial focus, blocked background focus, repeated activation, uncancelled cancel policy, close-form result, cleared result on reopening, programmatic close, disabled/hidden/removed trigger recovery, reinsertion, missing methods, thrown opening failure and no-script content/action fallback.
- The separate no-JavaScript workspace check passed. The example suite also verified all six newer example pages at 320px in LTR/RTL with scripts blocked, including readable inline dialog information and a working architecture destination.
- Direct keyboard/pointer checks on the recipe confirmed pointer opening, Space opening, initial close-button focus, Enter closing, Escape dismissal and focus return to the opener. Clicking the backdrop kept the modal open. Safari's current keyboard preferences skipped the link on ordinary Tab; Option+Tab reached the architecture link and then the close action. Full keyboard cycling across platform settings remains unverified. The dark-mode modal was visually inspected with a visible focus ring and readable content.
- Axe-core 4.14.0 reported zero violations across 45 states, adding open-dialog light/dark states to the existing 43-state audit. Both open states left paragraph contrast (`#recipe-dialog > p:nth-child(2)`) incomplete for manual review. Existing native select contrast and legacy video-caption findings remain unresolved. No exclusions were added.
- Documentation links, registration/catalogue agreement, generated catalogue freshness and whitespace checks passed. The changed scripts executed in the browser checks; a separate JavaScript CLI syntax check was unavailable because Node is not on this environment's PATH. Library CSS and component JavaScript are unchanged.
- Chrome/Firefox/Edge/mobile, screen-reader announcements, touch, forced colors, actual zoom/text spacing, long-content modal scrolling and disabled-user task testing were not completed for this slice. The Phase 1 dialog checklist and stable-release gates remain open. See the [dialog contract](docs/dialog.md) for application lifecycle limits and the remaining verification work.

## Documentation site checks: 17 October 2026

Safari 27.0.1 on macOS, served locally on port 8765:

- All 85 component checks and 243 existing example checks passed after introducing the shared site navigation and guide/component pages. All 42 documentation checks passed before the final theme-sync assertion was added. The separate no-JavaScript workspace check passed too. The current documentation suite contains 43 checks; do not report that final count as passed yet.
- Documentation assertions covered full rendered control specs/tokens and section anchors, guide/source links, current-location navigation, real checkbox behavior and serialized values, native Code disclosures, iframe viewport resizing, Home/End and RTL key-handler behavior, width reset, ignored foreign-window messages, clipboard success and denied-copy recovery, proposal-only planned pages, required-form summary focus and recovery/reset, native multiple-select repeated values and range stepping. About, guide and component pages reflowed at 320px in LTR/RTL with scripts blocked; the preview/source baseline and hidden script-only controls remained available.
- Direct Safari pointer inspection confirmed the checkbox preview edge could be dragged from 838px to 448px, with its width display updating. The Code disclosure opened the corresponding checkbox source at that width. The dark-mode component page, navigation, sidebar, contents links and example layout were visually inspected. AX exposed the handle as “Resize Single choice example”; icon-only handle-name audit findings remain recorded for further manual review.
- Axe-core 4.14.0 completed 51 states with zero violations after correcting shared-header accessible names/focus colors, distinct embedded navigation/banner names, named preview mains, reference table names and heading order. No audit exclusions were added. Incomplete findings include resize-handle label-content/name checks, some rendered-table contrast, existing native selects, open-dialog paragraph contrast and legacy media captions. These are not counted as passed manual checks.
- That completed audit preceded the final host-to-preview theme/brand/direction synchronization, compact example-footer adjustment and guard that hides local preview-submit actions until their handler is installed. At the time, embedded previews followed the system palette while their host pages were tested in light/dark modes. These final adjustments and the new synchronization assertion have not been rerun: computer use lost access with `cgWindowNotFound`; reconnecting Safari, trying Chrome and resetting the computer-use session did not restore it. Do not treat the recorded audit as proof of both embedded preview palettes in the final code.
- Six Python renderer/source-integrity tests passed, covering catalogue page coverage, proposal-only planned entries, source-fence retention, escaped code, pipes inside table code cells, rewritten guide links, nested lists, code link labels and shared preview/drawer sources. Complete-site/catalogue freshness, local links, duplicate IDs, current registration agreement and whitespace checks passed. There are 101 component/primitive pages and 54 authored preview documents. Library CSS and behavior remain unchanged.
- Chrome/Firefox/Edge/mobile, real screen-reader output, touch, forced colors, actual zoom/text spacing, comprehensive keyboard cycling and disabled-user task testing remain open. The docs/example runner is application code, not a stable library component or a conformance claim. Its source, trust, fallback and lifecycle contract is in [documentation authoring](docs/site.md).

## Documentation verification follow-up: 17 October 2026

Safari 27.0.1 (22625.1.29.11.28) on macOS, served locally on port 8765:

- All **43 documentation checks**, **85 component checks** and **243 example checks** passed. The separate no-JavaScript workspace check passed. This completes the previously unrun documentation assertion and reruns the suites against the final theme synchronization, example-footer and preview-submit guard changes.
- Strengthened the axe harness to wait for preview palette synchronization and assert matching host/preview theme, brand and direction attributes plus the computed canvas token before auditing. All two controls-guide previews and four checkbox previews passed these assertions in both light and dark modes. The documentation suite separately passed the forest/light/RTL synchronization assertion.
- Axe-core 4.14.0 completed **51 states with zero violations**, including the final embedded preview palettes. No exclusions were added. Incomplete findings remain for resize-handle label-content/name checks, rendered-table contrast, native selects, open-dialog paragraph contrast and legacy media captions; these still require manual review.
- Visually inspected the final dark-mode checkbox page, including the checked/disabled and indeterminate previews, width controls, Code disclosures and compact example footers. Safari needed the example frame scrolled into view for the rendered-frame regression assertions to finish.
- Six Python renderer/source-integrity tests, complete-site/catalogue freshness, documentation links, unique IDs, registration agreement and whitespace checks passed. Library CSS and behavior are unchanged; the only JavaScript change adds audit verification.
- This follow-up supersedes the earlier browser-access blocker for the final documentation changes. Other browsers, screen readers, actual zoom/text spacing, touch, forced colors and disabled-user task testing remain open; no stable-release or conformance gate is marked complete.

## Phase 1 grouped questions and native input checks: 17 October 2026

Safari 27.0.1 (22625.1.29.11.28) on macOS, served locally on port 8765:

- All **85 component checks**, **282 example checks** and **43 documentation checks** passed. The separate no-JavaScript workspace check passed. The example suite adds 33 native-input assertions and six fallback assertions to the previous 243 checks.
- The new [native-value recipe](examples/native-inputs.html) covers separate date/time errors, shared radio and checkbox hints/errors, linked summary focus, correction/title cleanup, native successful entries and submitter, repeated checkbox/file names, read-only inclusion, disabled omission, empty File entries, range defaults/stepping and result invalidation. Date bounds, time bounds/900-second step and explicit custom-validity precedence passed. File tests use synthetic File/DataTransfer selections, including too many files, a file over 1 MiB, the exact size/count boundaries, a selected zero-byte file and an HTML-like filename rendered as text. No file content is read or uploaded.
- Enhanced content and long file metadata reflowed at 320px in LTR/RTL with doubled root text and expanded line/letter/word spacing. Script-blocked checks also passed 320px LTR/RTL reflow, explicit group hints, native required validation, file selection attributes, reset and the hidden local-inspection action with its explanation. These are automated simulations, not actual browser zoom or complete text-spacing conformance evidence.
- Axe-core 4.14.0 completed **55 states with zero violations**. The four added states cover the new page in light/dark modes, before and after grouped validation errors; none had incomplete findings. Existing resize-handle naming, table/native-select/dialog contrast and legacy media-caption findings remain open. No exclusions were added.
- Direct Safari inspection confirmed pointer submission focused the four-entry summary, a checkbox error link focused its unchecked representative, Space checked it, and the native keyboard sequence reached the range where ArrowRight changed 50 to 55 with matching visible output. The summary, inline date feedback, file/range controls and read-only/disabled fields were visually reviewed in dark mode. These checks do not establish screen-reader announcements or full native-picker keyboard coverage.
- Six Python renderer/source-integrity tests, generated-site/catalogue freshness, local links, unique IDs, registration agreement, HTML parsing and whitespace checks passed. Changed application/test scripts executed in the browser suites. Library CSS and component JavaScript are unchanged; existing catalogue statuses and the two registered behavior elements remain unchanged. README, current reference, integration guide, relevant component-page links and roadmap now point to the recipe.
- Chrome/Firefox/Edge/mobile, actual file-picker selection from disk, native picker/platform behavior, screen readers, touch, forced colors, actual zoom/text spacing, timezone resolution and disabled-user task testing remain open. The recipe has no server transport or booking service. The Phase 1 checklist remains open for manual/platform evidence.

## Phase 1 composition and multiple-selection checks: 17 October 2026

Chrome 155.0.8059.80 on macOS, served locally on port 8765:

- All **85 component checks**, **324 example checks** and **43 documentation checks** passed. The separate no-JavaScript workspace check passed. The example suite adds 37 composition assertions and five fallback assertions to the previous 282 checks. The final example suite was rerun after correcting redundant landmark names.
- The [survey briefing](examples/composition.html) uses existing CSS-only layouts and panels, native landmarks and a native multiple-select. Checks cover selected defaults, explicit labels/instructions, required summary focus and recovery, repeated successful entries in option order, submitter values, disabled options/optgroups/selects, text-safe value display, uncancelled/cancelled reset, independent scroll-region focus and naming, bounded vertical notes and native table headers/caption. No library behavior or registration was added.
- At 1440px the aside and content occupied separate columns. At 320px the nested panels and sidebar reflowed in both brands, light/dark modes and LTR/RTL with doubled root text and expanded letter/word spacing. Wide table content overflowed only inside its named region; notes retained a native vertical scroll viewport. Scripts-blocked checks retained explicit hints, selected defaults, native validation/reset and both focus stops while hiding local inspection with its explanation. These are automated simulations, not actual zoom or comprehensive text-spacing evidence.
- The [focused display harness](tests/composition.html) passed **37 checks in normal mode** and **40 checks with Chrome DevTools forced-colors emulation active**. The final forced-color run also passed after the landmark correction. Additional assertions checked the system Highlight summary outline without a shadow, GrayText on the disabled select and native select appearance without an arrow image. Emulation was restored to its previous No emulation setting after testing. This is not Windows contrast-theme evidence.
- Direct keyboard checks in forced-color emulation confirmed Home then Shift+Down selected Coast and Woodland; inspection produced two separate area entries. A section link followed by Tab reached the table region. Right scrolled the table horizontally with a visible cyan system focus outline. Tab reached the notes region, Page Down was exercised there, and the next Tab reached its first content link. The system-colored table, notes, borders and focus outline were visually inspected. Full noncontiguous keyboard selection, touch selection, RTL key gestures and screen-reader announcements remain unverified.
- Axe-core 4.14.0 completed **59 states with zero violations**, including default and invalid multiple-selection states in light/dark modes. The first audit found duplicate landmark names on enclosing sections and their scroll regions; the enclosing labels were removed and the final audit passed without exclusions. The new page retains incomplete contrast findings on horizontally off-screen table cells and vertically clipped notes/links. These findings are still manual-review work, alongside existing table/native-select/dialog contrast, resize-handle naming and legacy media captions; they are not counted as passed checks.
- Six Python renderer/source-integrity tests, generated documentation/catalogue freshness, local links, unique IDs, registration agreement, HTML parsing and whitespace checks passed. Changed application/test scripts executed in Chrome. README, current reference, forms guide, relevant component pages and roadmap link the recipe and its contract. Library CSS and component JavaScript are unchanged; catalogue statuses and the two registered behavior elements remain unchanged.
- Safari/Firefox/Edge/mobile, Windows contrast themes, screen readers, touch, actual zoom/text spacing, print review and disabled-user task testing remain open. The page has no server transport or persistence; production code must recheck submitted choices and permissions. The Phase 1 checklist remains open for the remaining manual/platform evidence.

## Phase 1 native family state audit: 17 October 2026

Chrome 155.0.8059.80 on macOS, served locally on port 8765:

- All **85 component checks**, **324 example checks** and **280 documentation checks** passed. The separate no-JavaScript workspace check passed. The documentation suite adds 234 native-state checks and three no-script checks for the new guide to its previous 43 assertions.
- Added 11 authored previews: required date/time/number constraints, required select/option and textarea recovery, disabled range with persistent value, long open disclosure, long breadcrumb/item paths, and static empty/loading/failure panel content. Four existing read-only/disabled samples now have named controls, meaningful values and real native form ownership for local inspection. There are now 65 authored preview documents. The [state audit](docs/native-states.md) maps every Phase 1 family to applicable states, existing integrated recipes and unsupported native states; it does not define new component APIs.
- Browser assertions cover missing-answer summary focus, linked field focus, date bounds, time/number step mismatches, correction/hint/title cleanup, native normalized values/newlines, disabled omission, read-only serialization, reset and local feedback cleanup. They also cover native disclosure state and real ancestor fragment destinations with current-location text.
- All 17 added/changed or progress-related previews reflowed at 320px across default/forest, light/dark and LTR/RTL with doubled root text and expanded line/letter/word/paragraph spacing. Each also passed no-script LTR/RTL reflow. Form previews retained native missing-answer validation while hiding local-only submit actions and explaining the missing server action. These are automated simulations, not actual browser zoom or complete text-spacing evidence.
- The panel test initially exposed native progress overflowing its container with enlarged text. Added a low-specificity `max-inline-size: 100%` rule for progress; the regression and determinate/indeterminate preview checks then passed. Foundation CSS measures 26,066 bytes raw / 5,387 bytes gzip at level 9 without minification, compared with 26,018 / 5,381 immediately before this slice. These are measurements, not enforced budgets. Library JavaScript and the two behavior registrations are unchanged.
- Axe-core 4.14.0 completed **95 states with zero violations**. Added the audit guide and 11 component pages in light/dark, plus six component pages with their enhanced preview errors visible. Host/preview palette agreement is checked before auditing. The initial audit found four duplicate breadcrumb-landmark violations across the two pages and palettes; the long-path example received a distinct meaningful navigation name, then the full audit passed. No exclusions were added. Resize-handle naming, rendered-table/native-control/dialog contrast and legacy media-caption incomplete findings remain manual-review work, not passed checks.
- Direct pointer submission of the numeric example focused its summary. Following the error link, entering 4, then Tab/Enter submitted locally, cleared the error title and showed the native value. Direct Tab/Space closed the initially open long disclosure; Enter reopened it and Tab reached its content link. The dark-mode numeric preview and visible keyboard focus were visually inspected. This does not establish screen-reader output or comprehensive keyboard/platform coverage.
- Six Python renderer/source-integrity tests, generated-site/catalogue freshness, documentation links, unique IDs, registration agreement and whitespace checks passed. Sources and generated pages are kept together. The Phase 1 authored-state documentation item is complete; manual/platform verification and stable-release gates remain open.
- Safari/Firefox/Edge/mobile, real screen-reader announcements, native picker behavior, touch, Windows contrast themes, actual zoom/text spacing, long-content modal scrolling, print and disabled-user task testing were not completed for this slice. Existing unresolved media captions/transcripts and manual audit findings remain open.

## Phase 1 long-dialog robustness: 17 October 2026

Chrome 155.0.8059.80 and Safari 27.0.1 (22625.1.29.11.28) on macOS, served locally on port 8765:

- Both browsers passed **85 component checks**, **627 example checks** and the separate no-JavaScript workspace check. The example suite adds **303 long-dialog assertions** to its previous 324 checks. The [focused harness](tests/dialog.html) independently passed all 303 checks in each browser. Both browsers subsequently passed **282 documentation checks**, including two new preview-heading assertions against the final script; the full example runs preceded that last documentation-runner change.
- Added the [long survey briefing](docs/previews/dialog-1.html), surfaced on the dialog guide and component page from `docs/recipes.json`. The heading receives native initial focus. Two native closing forms sit before and after six structured sections. Equivalent content remains inline without scripts, missing native methods, an opening exception or a method returning without opening. The recipe uses the foundation's existing single scrolling surface, with no custom focus trap, key handler or new registration. Library CSS and component JavaScript are unchanged.
- Assertions cover actual modal state, accessible title without a blanket description, unchanged installation focus, complete inline/modal content parity, both closing forms/results, blocked background focus, scroll bounds, native focus scrolling, reset of old results and reading position on reopening, surviving focus after disabled/hidden/removed openers, and missing/throwing/no-op APIs. The display matrix uses 1280×600 and 320×256 requested iframe sizes, both brands, light/dark, LTR/RTL and normal/enlarged text with expanded line/letter/word/paragraph spacing. Native iframe borders and available parent width affect the content viewport. No-script fallback also reflows at 320px in LTR/RTL. These simulations do not establish comprehensive zoom or text-spacing conformance.
- The narrow/enlarged Chrome case caught a scroll-position problem in the new recipe: setting scrollTop while the dialog was closed did not reliably clear its previous position. The script now resets scrolling immediately after successful showModal(), retaining heading focus. Both browsers then passed the entire matrix, including reaching and closing from either end and reopening at the beginning.
- Direct Chrome checks confirmed pointer and Space opening, heading focus, Tab to the first and final close actions, Shift+Tab back to the first action, Enter closing and Escape dismissal with opener focus return. At the end of the sequence Chrome could move focus into browser chrome; Shift+Tab returned to the modal's last action. Background document content remained inert. The recipe preserves this native browser behavior rather than promising an application-owned focus cycle.
- Safari's current keyboard setting skipped buttons on ordinary Tab. Option+Tab reached both close actions; Option+Shift+Tab returned to the first, and Enter closed with opener focus return. Native Page Down from heading focus visibly scrolled the dialog's content. Clicking the backdrop at 300% kept the dialog open; Escape closed it and restored the opener. No keyboard preference was changed. Additional platform/keyboard settings remain unverified.
- Actual page zoom was confirmed through browser UI: Chrome at **200% and 400%**, Safari at **200% and 300%**. The final close action remained visible, readable and keyboard-reachable with a visible focus indicator; closing/Escape and heading focus on reopening were exercised. Dark-mode content and native scrolling were visually inspected. Both browsers were restored to 100%. This is partial manual zoom evidence for those desktop windows, not mobile, all zoom levels or every brand/direction combination.
- The expanded axe-core 4.14.0 audit initially completed **119 states with four violations**, all page-has-heading-one findings on the closed standalone preview loaded in a test iframe. Its **16 open long-dialog states** (two brands, two modes, two directions and start/end positions) had zero violations; end-position audits retained incomplete contrast findings for clipped/off-screen headings and paragraphs. Existing resize-handle naming, table/native-control/dialog contrast and legacy media-caption incomplete findings remain open. No exclusions were added.
- The heading findings exposed an overly broad preview rule that hid its document heading in every embedding. `js/docs-preview.js` now hides it only inside the actual documentation example runner, whose visible host heading supplies that context. Other embeddings retain their document heading. The two new browser assertions verify both contexts. Cached localhost preview assets initially caused stale-script failures; both browsers passed all 282 documentation checks from the fresh local 127.0.0.1 origin against the final behavior.
- A final 119-state axe rerun was started from that fresh origin, but its completion/result could not be read: computer use failed with `cgWindowNotFound`. Rebinding Chrome, resetting the computer-use session and selecting Safari did not restore access. Do not report the final expanded audit as zero violations or complete until its result is verified. The earlier four heading findings were addressed in code and regression checks; their final axe verification remains outstanding.
- Six Python renderer/source-integrity tests, generated-site/catalogue freshness, documentation links, duplicate-ID checks, registration agreement and whitespace checks passed. README, current reference, state audit, catalogue and roadmap link the long-content recipe. There are 67 authored preview documents; the two long-dialog preview files share the same authored recipe content.
- Firefox/Edge/mobile, VoiceOver/NVDA announcements, touch, Windows contrast themes, comprehensive platform keyboard/zoom/text-spacing combinations, print and disabled-user task testing remain open. The Phase 1 dialog item and stable-release gates remain open; this evidence does not establish accessibility conformance.

## Long-dialog audit and preview landmark follow-up: 17 October 2026

Chrome 155.0.8059.80 and Safari 27.0.1 (22625.1.29.11.28) on macOS, served locally on port 8765:

- Browser access was restored, allowing the pending Chrome audit to be reviewed. It had completed all 119 states with four `region` violations on the closed standalone long-dialog preview: the now-retained document h1 sat outside its main landmark. These were distinct from the earlier missing-heading findings. No finding was excluded or counted as passed.
- Moved the generated document heading inside each preview's native main element, updated its runner selector, and strengthened the standalone browser assertion to require landmark containment. All 67 previews are regenerated from the same source. A new structural source test checks every preview's document-heading containment, including the no-script markup.
- Added a content fingerprint to the generated preview-script URL so regenerated markup loads its matching script rather than a cached version with the old heading selector. Updated documentation and agent build instructions because editing `js/docs-preview.js` now changes generated preview URLs. Library CSS, component JavaScript, registrations and catalogue statuses are unchanged.
- Against the final structure, Chrome passed **627 example checks** and **282 documentation checks**; Safari passed **282 documentation checks** and all **303 focused long-dialog checks**. The example run includes that complete dialog matrix in Chrome. The previously recorded component and separate no-JavaScript workspace results remain applicable; those unchanged suites were not repeated for this markup-only follow-up.
- Axe-core 4.14.0 completed **119 states with zero violations** in Chrome. The run includes closed standalone, guide/component embeds and all 16 open long-dialog brand/mode/direction/scroll-position states. No exclusions were added. End-position contrast for clipped/off-screen content remains incomplete, alongside the existing resize-handle naming, rendered-table/native-control/dialog contrast and legacy media-caption manual findings.
- Seven Python renderer/source-integrity tests passed. Complete-site/catalogue freshness, local links, duplicate IDs, current registration agreement and whitespace checks passed. This follow-up supersedes the previous browser-access blocker and unconfirmed final axe result. Safari axe, other browsers/mobile, screen readers, touch, Windows contrast themes and the remaining manual release gates are still open; no conformance or stable-release claim is added.

## Phase 1 native-popover robustness: 17 October 2026

Chrome 155.0.8059.80 and Safari 27.0.1 (22625.1.29.11.28) on macOS, served locally on port 8765:

- The [focused native-popover harness](tests/popover.html) passed **191 checks in each browser**. Both browsers also passed **818 example checks**, including the new popover matrix and existing dialog checks. Both browsers passed **282 documentation checks**; Chrome also passed **85 component checks** and the separate no-JavaScript workspace check. Chrome's example run preceded the final removal of redundant section landmark labels; Safari's example run and the final Chrome axe audit used the corrected markup.
- Added short and long optional-help recipes, a [native popover guide](docs/popover.md), catalogue links and the focused harness. Capability and declarative-target checks expose native auto-popover actions only when usable; otherwise complete help remains inline. Persistent field instructions and native answers remain available in either mode. No custom element, role, focus trap, key handler or library runtime change was added. There are now **68 authored preview documents**.
- Assertions cover native toggle/close relationships, unchanged installation focus, non-modal background editing, explicit-close focus return, answer preservation, disabled invokers, browser-owned auto-popover coordination and opener reinsertion. The long-content matrix covers requested 1280×600 and 320×256 iframe sizes, default/forest, light/dark, LTR/RTL and normal/doubled root text with expanded line/letter/word/paragraph spacing. Both close controls scroll into view inside one bounded native scrolling surface. Missing capabilities/targets and script-blocked LTR/RTL pages retain full inline help. These simulations do not establish comprehensive zoom or text-spacing conformance.
- Direct checks in both browsers confirmed pointer and Space opening, sequential focus through the first close action, guide link, final close action and background field, reverse keyboard movement and Enter closing. Safari used Option+Tab with its existing keyboard preference; no preference was changed. Escape from the guide link closed help and returned focus to the opener. Editing the background title left help open; Escape then closed it while retaining field focus and the edited answer. Outside pointer activation dismissed help and focused the selected field without discarding that answer.
- Long-content keyboard scrolling and closing were exercised with actual page zoom: Chrome reached **200% and 400%**, and Safari's Page Menu confirmed **300%**. Safari's final close action was visually inspected with its visible focus outline at 300%; it remained readable and keyboard-reachable. Zoom can change the current scroll position, so keyboard movement was repeated after enlargement before closing. Both browsers were restored to 100%. These are partial desktop checks, not mobile or every brand/direction/zoom combination.
- Axe-core 4.14.0 initially completed **163 states with four landmark-unique violations**: the two embedded examples repeated the same named section landmark on the guide and component page in both palettes. Removed those unnecessary section labels while retaining visible native headings. The final full audit completed **163 states with zero violations**, without exclusions. It includes both standalone previews in both brands/modes and 32 open start/end/direction states. Incomplete contrast and resize-handle findings remain manual-review work, alongside existing native-control/table/dialog contrast and legacy media captions; they are not counted as passed checks.
- Seven Python renderer/source-integrity tests, complete-site/catalogue freshness, documentation links, duplicate IDs, current registration agreement and whitespace checks passed. Sources and generated pages are kept together. Library CSS, component JavaScript, the two registrations and catalogue statuses are unchanged.
- Firefox/Edge/mobile, VoiceOver/NVDA announcements, touch, Windows contrast themes, comprehensive keyboard/zoom/text-spacing combinations, print and disabled-user task testing remain open. Safari axe was not run. The Phase 1 popover item and stable-release gates remain open; this evidence does not establish accessibility conformance.

## Lifecycle contract and Popup proposal documentation: 17 October 2026

Chrome 155.0.8059.80 on macOS, served locally on port 8765:

- Added the shared lifecycle/ownership design contract and the proposed Phase 2 Popup specification. Existing form and static-recipe behavior is distinguished from requirements for future implementations. Popup remains planned; no library behavior, CSS, registration, public entry point or anchored runtime demo was added.
- The catalogue now links a rendered specification and its Markdown source. Nested specification pages retain relative assets, navigation, source links and links to the shared contract. Corrected sidebar current-page matching so a specification does not mark its separate component page as the current page.
- Chrome passed **290 documentation checks**, adding two proposal-navigation assertions and six no-script readability/reflow assertions to the previous 282. Both new documents reflowed at 320px in LTR/RTL with scripts blocked. The rendered Popup proposal and its explicit proposal status were visually reviewed in dark mode.
- **Eight Python renderer/source-integrity tests** passed, including specification rendering/source linkage. Catalogue/site freshness, documentation links, duplicate IDs, registration agreement and whitespace checks passed. The existing runtime suites and axe audit were not repeated for this documentation/generator slice. No new Popup implementation, accessibility or conformance evidence is claimed; manual release gates remain open.

## Phase 2 experimental anchored Popup: 17 October 2026

Chrome 155.0.8059.80 and Safari 27.0.1 (22625.1.29.11.28) on macOS, served locally on port 8765:

- Added optional `js/popup.js`, exposing experimental `UIPopup.attach` with synchronous update and idempotent destroy. The [anchored reference-help consumer](docs/previews/popup-0.html), [integration guide](docs/popup.md) and [specification](docs/specs/popup.md) keep measured geometry separate from native auto-popover visibility/dismissal and application focus/fallback. The catalogue records foundation availability with experimental maturity. No new custom element, compound role, module loader or dependency was added. Library CSS, `js/components.js` and its two registrations are unchanged.
- Both browsers passed **948 example checks** and **293 documentation checks** against the final implementation. The example suite includes **130 Popup assertions** added to the previous 818 checks; the [focused harness](tests/popup.html) independently passed its initial 129-check version in both browsers before the final focus-enlargement regression was added. The final full suites include that added assertion. Chrome also passed **85 component checks** and the separate no-JavaScript workspace check earlier in this slice; those unchanged suites preceded the final Popup-only focus correction.
- Assertions exercise native non-modal opening/close and answer preservation; preferred placement/flip/RTL; all four viewport corners; long-content bounds/focus scrolling; partial clipping and scrolling out of view; hidden/removed/transformed/retargeted anchors; sibling expansion; native opening cancellation; cross-document adoption and explicit reattachment; nested native dialog and nested auto-popover ownership; unknown/invalid options and duplicate ownership; conditional style restoration; native values/submitters/reset; and missing-capability/no-script fallback. Actual size-observer counts and scheduled-frame activity verify open acquisition, closed idle behavior and no stale writes after destroy. These are scoped resource checks, not a general memory-leak proof.
- The long-help display matrix requests 1280×600 and 320×256 frame sizes across default/forest, light/dark, LTR/RTL and normal/doubled text with expanded line/letter/word spacing. Usable surfaces stay within bounds and expose both close controls; insufficient usable space reports unavailable and releases geometry. The real consumer is checked for a positioned surface or complete inline recovery in a short enlarged viewport, and for inline recovery after an unsupported transform. Scripts-blocked 320px LTR/RTL retains full help and the native reference answer. These simulations do not establish full zoom/text-spacing conformance or mobile behavior.
- Testing caught two distinct scrolling issues. Temporary removal of maximum-size constraints for measurement could discard native focus scrolling; updates now preserve reading position through measurement. Actual 400% Chrome zoom then exposed an already-focused close control becoming clipped after viewport/text reflow. Geometry now scrolls only its own surface to keep the existing focused target and shared focus outline clear of clipping, without refocusing or scrolling the background task. The added browser regression enlarges text around an already-focused close action.
- Direct input in both browsers confirmed pointer/Space opening, native sequential traversal from first close through the guide/final close to the background field, Escape from help returning to its opener, and Escape from an edited background field preserving focus and its COAST-02 answer. Chrome outside pointer activation on the task heading dismissed help. Safari used Option+Tab with its existing keyboard preference; no preference was changed. Native Enter closing and opener focus return were exercised at enlarged sizes. These checks do not establish screen-reader announcements or complete nested-keyboard/touch behavior.
- Actual page zoom reached Chrome **200%/400%** and Safari **300%**; the zoom levels were confirmed in browser UI. The final Chrome 400% rerun kept the already-focused final close action and its complete focus outline visible after enlargement; Enter closed it. Safari's final close was visually reviewed and keyboard-activated at 300% during the earlier manual pass. Both browsers were restored to 100%. Final automated Safari checks include the subsequent focused-text-enlargement correction; its actual zoom pass preceded that last correction. These are partial desktop results, not every direction/brand/platform combination.
- Axe-core 4.14.0 completed **187 states with zero violations** in Chrome against the final code, without exclusions. The added 24 states cover the Popup guide/component, standalone closed help in both brands/modes and 16 open start/end/direction states with active anchored geometry. Existing incomplete contrast for clipped/offscreen content, resize-handle naming and legacy media-caption findings remain manual-review work; they are not counted as passed checks. Safari axe was not run.
- **Nine Python renderer/source-integrity tests** passed. Recipe dependencies now load before consumer initialization and carry content fingerprints in generated preview URLs; the source drawer exposes those dependencies. Catalogue/site freshness, local links, duplicate IDs, registration agreement and whitespace checks passed. There are **69 authored preview documents**. The optional Popup script measures **11,744 bytes raw / 3,516 bytes gzip** at level 9 without minification. The unchanged foundation CSS is 26,066 / 5,387 bytes; component behavior is 20,172 / 5,213 bytes. These are measurements, not enforced budgets.
- Experimental scope remains horizontal writing mode, same-document native auto popovers and measured block-start/end placement. Animated/virtual/cross-frame anchors, vertical writing modes and alternate positioning backends are outside scope. Authored transforms, CSS zoom, clip-path/paint containment and unfit constraints use unavailable/fallback behavior. Firefox/Edge/mobile, VoiceOver/NVDA, touch, Windows contrast themes, pinch/visual-viewport platform combinations, comprehensive nested manual tasks, font/media-state changes and disabled-user testing remain open. Popup is not stable and no accessibility conformance or release gate is claimed.

## Shared UI entry point and declarative enhancement: 17 October 2026

Chrome 155.0.8059.80 and Safari 27.0.1 (22625.1.29.11.28) on macOS, served locally on port 8765:

- Added generated `js/ui.js`, shared `UI.enhance(root)` / `UI.destroy(root)` lifecycle and the `UI.popup.attach` alias. The two existing form registrations remain the only custom-element registrations. Explicitly marked native dialog, popover and positioned Popup recipes now install from markup, with one inline content copy available before initialization. Native controls and CSS-only wrappers gain no placeholder behavior. Existing smaller entries and advanced manual recipes remain supported. See the [shared guide](docs/enhancement.md) and [specification](docs/specs/enhancement.md).
- Both browsers passed **85 component checks**, **1,051 example checks** and **297 documentation checks**. The example suite adds **103 shared enhancement assertions** to the previous 948; the [focused harness](tests/enhancement.html) independently passed all 103 in both browsers. Chrome also passed the separate no-JavaScript workspace check.
- New assertions cover scoped initialization/teardown, repeated and mixed entry loading in both orders, constructor/geometry identity, pre-bootstrap destruction, form and summary suspension/resumption, native validation and answer/submitter/reset preservation, nested ownership, changed or late invokers, removal/reinsertion, duplicate IDs and incomplete markup, unavailable native methods, canceled/no-op/throwing opening, authored attribute preservation and baseline recovery. The lifecycle observer releases removed tasks without discovering new marked overlays; applications explicitly enhance inserted content. These checks are scoped lifecycle evidence, not a general memory-leak proof.
- The declarative recipes were checked at 320px with doubled text across default/forest, light/dark and LTR/RTL, and with scripts blocked for readable single-copy dialog/popover/Popup fallbacks. Documentation checks verify the shared examples and code drawers require no per-instance initialization script. There are **73 authored preview documents**.
- Direct pointer and keyboard input checked modal initial heading focus, native Escape/opener return and Space/Enter activation in Chrome and Safari. Shared Popup checks exercised sequential help/link/close/background traversal and native Escape while retaining the background reference field's focus and edited value. Safari used Option+Tab with its existing preference. Actual browser zoom reached **400% in Chrome** and **300% in Safari**, confirmed in browser UI; the already-focused final close action and its complete focus outline remained visible after enlargement. Chrome Enter closed it and returned focus to the opener. Both browsers were restored to 100%. These are partial desktop checks, not full text-spacing, screen-reader or platform conformance.
- Axe-core 4.14.0 completed **255 states with zero violations** in Chrome, without exclusions. The 68 added states cover the shared guide/specification, form baseline/invalid states and all three declarative overlays closed/open across brands, modes, directions and initial/final focus positions. Existing incomplete contrast, resize-handle naming and legacy media-caption findings remain manual-review work; incomplete results are not passed checks. Safari axe was not run.
- **Eleven Python renderer/source-integrity tests** passed. Combined-script freshness is now checked alongside catalogue/site output. Preview CSS and scripts carry content fingerprints. Final catalogue/site freshness, local-link, duplicate-ID, registration-agreement and whitespace checks passed. Unminified payload measurements at gzip level 9 are **42,595 bytes raw / 11,017 gzip** for the combined entry, **20,956 / 5,345** for form behavior, **11,881 / 3,567** for geometry, **9,611 / 3,032** for shared enhancement, and **26,292 / 5,436** for foundation CSS. These measurements are not enforced budgets.
- The shared API and Popup remain experimental. Firefox/Edge/mobile, VoiceOver/NVDA, touch, Windows contrast themes, broader nested manual tasks and disabled-user testing remain open. No stable-release gate or accessibility certification is claimed.


## Experimental Accordion: 18 October 2026

The native-disclosure [Accordion family](docs/accordion.md) now has block composition, opt-in shared-entry navigation, fragment reveal and collapsed-content focus recovery. `details`/`summary` retain native expansion and optional `name` grouping. No custom element registration, replacement control, expansion ARIA, value ownership or runtime dependency was added. The two existing registrations remain unchanged. Unmarked disclosures and legacy form-only scripts retain their contracts; no migration is required.

Safari **27.0.1** on macOS, served over local HTTP:

- **88 focused Accordion checks passed**: native state, summary navigation/wrapping, modified/composing/prevented keys, hidden/inert items, collapse/coalesced-toggle focus recovery, initial/deep fragments, stale-scroll cancellation, duplicate/malformed IDs, explicit hiding, nested groups, dialog close ownership, form-error reveal, FormData/reset, repeated initialization, replacement/removal/adoption, document-wide name collisions, conflicting ARIA, missing capabilities and 320px enlarged-text/spacing reflow in both brands/modes/directions, including scripts blocked.
- **103 shared-entry regression checks**, **85 foundation/form checks** and **307 documentation checks passed**. Documentation coverage includes the new component/guide/specification links, runnable examples and script-blocked 320px LTR/RTL reflow.
- Direct native input checks verified pointer activation, Down navigation, Enter opening, Space closing, End navigation, wrapping and Tab traversal. Visual inspection confirmed the shared visible-focus treatment on the standalone dark-mode recipe. These checks do not establish a complete keyboard/platform audit.
- Safari strips text directives from the script-visible hash in the tested ID-plus-text case; UI therefore processes the remaining ordinary ID. When directives are exposed, UI leaves them to the browser. Native fragment navigation can also affect focus; assertions verify that UI does not call focus for fragment reveal.
- Eleven Python renderer/source-integrity tests, documentation/link/catalogue checks, generated-output freshness, changed JavaScript syntax and whitespace checks passed. Unminified gzip level-9 payloads: combined entry **49,682 raw / 12,524 gzip bytes**, shared enhancement **16,698 / 4,618**, foundation CSS **26,306 / 5,444**. These measurements are not enforced budgets.

No new axe audit was run for Accordion. Chrome/Edge/Firefox, mobile/touch, VoiceOver/Safari and NVDA/browser output, actual zoom/text spacing, forced colors, print behavior and disabled-user task testing remain open. The focused suite uses synthetic events for many ownership checks; doubled text is not browser zoom. Native name-group fallback on an engine without support, optional summary-heading exposure, autofill and external-form integration still need dedicated platform evidence. Accordion remains experimental; this record closes no stable-release or conformance gate.

## Tabs — 18 October 2026

The experimental [Tabs family](docs/tabs.md) now enhances marked linked sections through the combined entry, without adding registrations. Manual activation is the default; automatic eager activation and vertical orientation are explicit alternatives. Fragment navigation and error-summary links share ancestor reveal with Accordion. Unmarked content and the original form-only entry remain compatible.

Safari **27.0.1** on macOS, served over local HTTP:

- **102 focused Tabs checks passed**: unique names/relationships, selection versus focus, wrapping/navigation, modified/composing/prevented keys, manual/automatic modes, orientation/RTL, programmatic activation/events, initialization with conflicting focus/hash, nested Tabs/Accordion and summary reveal, native reportValidity focus (including external form ownership), first-invalid ordering, native values/reset, open-task initialization fallback, open-dialog blocking, atomic pair removal, late children, concurrent authored changes, disconnect/adoption, scoped cleanup and reentrant teardown. Fragment checks include missing/malformed/duplicate targets, authored hiding, cancellation, and unrelated-group installation without hash replay.
- Focused reflow fixtures passed at **320px** with enlarged text/spacing in both brands, modes and directions, with scripts enabled and blocked. These fixtures simulate enlarged text; they are not actual browser zoom.
- Direct input verified pointer selection, horizontal arrow focus without selection in manual mode, Enter and Space activation, End, Tab to the panel, Shift+Tab back to the selected tab, and Down selecting the next vertical automatic tab. Visual inspection confirmed the shared visible focus treatment in the standalone dark-mode recipe. These are partial keyboard checks, not a complete platform audit.
- Safari print preview of the manual recipe showed **all three panels** with the enhanced tab list omitted. No print job was sent. Native disclosure print limits still apply to groups nested inside closed details.
- Regression runs passed **88 Accordion**, **103 shared-entry**, **85 foundation/form** and **317 documentation** checks. Documentation includes the three Tabs component pages, runnable examples, guide/specification links and script-blocked narrow LTR/RTL layouts.
- Eleven Python renderer/source-integrity tests, documentation/link/catalogue validation, generated-output freshness and whitespace checks passed. Unminified gzip level-9 payloads: combined entry **64,715 raw / 15,567 gzip bytes**, shared enhancement **31,624 / 7,687**, foundation CSS **27,687 / 5,649**. These are measurements, not enforced budgets.

No new axe audit was run for Tabs. Chrome/Edge/Firefox, mobile/touch, VoiceOver/Safari, NVDA/browser output, actual zoom/text spacing, forced colors, broader print combinations, autofill and disabled-user task testing remain open. Browser find-in-page does not have a guaranteed inactive-panel reveal path; vertical writing, closable/reorderable tabs and remote loading remain outside this slice. Native invalid events are coalesced until the next microtask; applications running multiple validations in one synchronous task must coordinate their reporting. Tests use synthetic events for many ownership checks. Tabs remains experimental; this record closes no stable-release or conformance gate.

### Tabs element-name opt-in follow-up — 18 October 2026

`ui-tabs` now opts into shared-entry enhancement by element name, without `data-ui="tabs"`. The earlier marker remains compatible; removing it leaves enhancement intact. Runnable recipes and current documentation use the simpler wrapper. The native linked-section fallback, incomplete-markup behavior and two existing registrations are unchanged. Use ordinary linked sections without the wrapper when no Tabs enhancement is wanted.

Safari **27.0.1** on macOS over local HTTP passed **107 focused Tabs checks**, **103 shared-entry checks** and **317 documentation checks** after this change. New assertions cover marker-free bootstrap, legacy-marker compatibility, marker removal, containing-dialog close ownership, destroy before automatic bootstrap and explicit resume. Existing keyboard, form, fragment, lifecycle and no-script/reflow assertions now exercise marker-free recipes. Eleven Python renderer/source-integrity tests, documentation/catalogue validation, generated freshness and whitespace checks passed. Updated unminified gzip level-9 payloads: combined entry **64,685 raw / 15,568 gzip bytes**; shared enhancement **31,594 / 7,689**. The earlier platform/assistive-technology limitations and experimental maturity remain open.

### Named Tabs list follow-up — 18 October 2026

The standard Tabs structure is now `ui-tabs` with one named direct `ui-tablist`, native fragment anchors and paired sections. `ui-tablist` has CSS block layout and no registration or standalone widget behavior; the parent installs its tablist role and keyboard ownership only after successful setup. Existing `div[data-ui-tablist]` remains compatible. All runnable Tabs recipes, source drawers, current reference and catalogue use the named structural element.

Safari **27.0.1** on macOS over local HTTP passed **113 focused Tabs checks** and **318 documentation checks**. Added coverage verifies the named list without a marker, unchanged registration counts, legacy-list compatibility, replacing a legacy list while preserving anchors, standalone readable composition, and rejection of an unmarked ordinary div or duplicate list. Existing keyboard, focus, native form values, fragments, nested teardown and script-blocked reflow cases now exercise ui-tablist recipes. Documentation assertions verify the displayed source drawers; the test loader now requests fresh pages after Safari was observed serving a previous cached source drawer. Eleven Python renderer/source-integrity tests, documentation/catalogue validation, generated-output freshness and whitespace checks passed.

Updated unminified gzip level-9 payloads: combined entry **64,660 raw / 15,562 gzip bytes**; shared enhancement **31,569 / 7,685**; foundation CSS **27,699 / 5,652**. No new axe or assistive-technology audit was run. Experimental maturity and the earlier platform/release limitations remain open.

## Native Pagination — 18 October 2026

The experimental [Pagination pattern](docs/pagination.md) now provides CSS-only composition around a named native nav/list of real page links. The [specification](docs/specs/pagination.md) records current-page state, boundaries, ellipses, result focus and application loading/URL ownership. Five distinct static result pages plus long localized labels and single-page/no-results fixtures ship as runnable recipes. Source drawers require only CSS; shared scripts in preview documents belong to the documentation host. No library JavaScript, entry point or registration changed.

Safari **27.0.1** on macOS over local HTTP:

- **231 focused Pagination checks passed**. They cover real Next/Previous navigation to different result documents, current-page uniqueness and URL agreement, boundary omissions, localized number-only names, native lists, plain-text ellipses and result-heading fragment focus. The complete five-page route works with scripts enabled and blocked. Additional assertions cover unchanged native key defaults, no readiness/registration, enhance/destroy/replacement without mutations, native containing-form values/validation/reset, ordered lists, unknown-total previous/next-only links, one-page and no-results states.
- Reflow/target checks passed at **320px**, with doubled root text and expanded line/letter/word spacing, across first/middle/last/localized fixtures, default/forest brands, light/dark modes and LTR/RTL, with scripts enabled and blocked. Current-page borders/weight remain persistent beyond color. These fixtures simulate enlarged text; they are not browser zoom or a complete WCAG assessment.
- Direct pointer activation, Safari's native Option+Tab link traversal and Enter navigation were checked in the standalone recipe without changing browser preferences. Enter opened the distinct first result document and focused its authored result heading. Visual review confirmed the yellow shared focus treatment on page 1 while page 3 retained its separate current-page marker in dark mode. The first-page destination omitted Previous and retained a plain-text ellipsis.
- **328 documentation checks** passed, including the guide/specification/component links, seven runnable recipes, CSS-only copyable sources and script-blocked narrow LTR/RTL reflow. Eleven Python renderer/source-integrity tests, local documentation/catalogue checks, generated-output freshness and whitespace checks passed.
- Unminified foundation CSS measures **28,883 raw / 5,776 gzip bytes** at gzip level 9. This is a measurement, not an enforced budget. Library JavaScript is unchanged from the committed Tabs implementation.

No new axe or screen-reader audit was run. Chrome/Edge/Firefox, mobile/touch, VoiceOver/Safari, NVDA/browser output, actual zoom/text spacing, forced colors, print, browser-history focus restoration and disabled-user task testing remain open. Application interception, request cancellation/stale-response handling, loading/retry announcements and async focus updates are documented integration responsibilities, not shipped Pagination JavaScript. Pagination remains experimental and no stable-release or conformance gate is closed.
