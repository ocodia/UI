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
