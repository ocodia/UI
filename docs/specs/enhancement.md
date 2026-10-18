# Shared enhancement specification

## Identity and purpose

Status: experimental implementation of the shared UI entry point. UI behavior owns initialization and teardown for its existing forms/error summaries and explicitly marked native dialog, popover positioned-help patterns and the experimental native-disclosure [Accordion pattern](../accordion.md). CSS-only layouts and native buttons/fields/unmarked details/progress retain their native behavior. Other planned compound widgets are not registered or initialized.

The combined classic script is generated as `js/ui.js` from `js/components.js`, `js/popup.js` and `js/enhance.js`. Existing entry points remain usable. Repeated or mixed loading shares the same registered constructors, geometry ownership and high-level runtime. No runtime fetching, modules, package or arbitrary plugin registry is introduced.

## Minimal markup

One help copy remains readable before JavaScript. The native invoker is initially hidden. `data-ui="popover"` adds unpositioned native help; `data-ui="popup"` adds anchored geometry. The library sets popover state only after validating and installing the pattern.

```html
<script src="js/ui.js" defer></script>
<button type="button" popovertarget="help" hidden>Open project help</button>
<div id="help" data-ui="popup">
  <h2 tabindex="-1" data-ui-focus>Project help</h2>
  <p>Keep the original field notes.</p>
  <button type="button" popovertarget="help"
    popovertargetaction="hide" hidden>Close project help</button>
</div>
```

Dialogs use a native `dialog open data-ui="dialog"` baseline with an explicit accessible title. Foundation CSS keeps this unenhanced open dialog in normal document flow. A hidden native button with `data-ui-open="dialog-id"` opens it after initialization. Explicit close buttons use `data-ui-close` and are hidden before enhancement. A heading with `data-ui-focus` and authored tabindex=-1 supplies initial/fallback focus. No autofocus is required in the readable baseline.

## Public contract

| Surface | Decision |
| --- | --- |
| UI.enhance(root = document) | Synchronous, idempotent, returns undefined. Include the root and its descendants. Initialize marked supported patterns; resume/refresh existing ui-form/ui-error-summary elements. Invalid/incomplete pattern markup stays readable. Invalid root arguments throw TypeError. |
| UI.destroy(root = document) | Synchronous, idempotent, returns undefined. Release owned patterns within the root, deepest first, and suspend form/summary automatic behavior without removing nodes. Restore baseline presentation, preserve answers, and do not cancel application requests. |
| Roots | Document, Element or DocumentFragment from this runtime's document. Disconnected fragments are not enhanced; destroy can clean a detached subtree. Foreign-document roots require that document's runtime. |
| UI.popup.attach | Alias of existing UIPopup.attach, retaining the lower-level geometry contract and compatibility alias. |
| data-ui | Exact values dialog, popover or popup on the actual surface; accordion on a ui-accordion wrapper (see its separate specification). No implicit enhancement of unmarked native overlays. |
| data-ui-open | Native button target ID for dialogs; popover/popup use native popovertarget instead. Multiple distinct invokers are supported for unpositioned help/dialogs. Positioned help requires one unambiguous invoker. |
| data-ui-focus | At most one focus destination owned by this surface. For dialogs, a focusable target is required; content needs an explicit accessible title. For popovers it is optional and supplies inline recovery only. |
| data-ui-return-focus | Optional surviving focus destination ID for a dialog whose invoker becomes unavailable. Destination must be visible/focusable and outside nested unrelated tasks. |
| data-ui-close | Native dialog close button; value defaults to close. Native method=dialog forms retain their own default action. Popover close buttons use native target/hide attributes. |
| data-ui-placement | Popup only: block-end-start (default) or block-start-start. No JSON configuration or implicit semantic role. |
| data-ui-ready | Library-owned empty readiness marker on enhanced overlays and Accordion groups. It is not open state or a signal for business success. |
| Events | Keep native toggle/beforetoggle/close/cancel/submit/reset. No new custom event or synthetic input/change. Application close listeners own result display or persistence. |

The bundle initializes once after parsing, or in a microtask when loaded after parsing. Newly inserted marked overlays and Accordion groups require explicit enhance(root); there is no automatic global discovery loop. Existing custom elements keep their native connection lifecycle. destroy suspends them until enhance is explicitly called, including across subsequent detach/reinsert.

## Interaction and accessibility

Installation never moves focus or changes form values. Invoker activation normalizes opener focus. Native auto-popover toggle, Escape, light dismissal and keyboard traversal remain native. Modal dialogs use showModal(), an explicit initial target, native inertness and native cancellation. Opening resets the native returnValue and starts long dialog reading at the initial target; repeated activation of an open dialog does nothing. No key trap, roving tabindex, menu role, duplicate expanded state or blanket announcement is installed.

Use native close forms or owned close buttons. Native focus restoration wins when it reaches a valid destination. If a dialog invoker disappears, use the authored surviving destination or readable inline focus target. Do not override deliberate outside activation/background focus. Never redirect a modal task's focus into an unrelated background summary.

Unavailable/throwing/no-op native opening returns the pattern to readable baseline, hides its unusable invokers/close actions and focuses inline content only if the failed task owned focus. Popover/popup baseline removes only the library-added popover attribute; dialog baseline restores authored open. Geometry failure follows the same recovery policy. No content is cloned/reparented or duplicated.

## Lifecycle and failure

Track exact owned attribute values; conditionally restore only the last library-written scalar state. Preserve later application writes and all native values/labels/form associations. A private registry makes repeated initialization/mixed loading idempotent. Explicit enhance reconciles changed invokers/configuration by releasing and attaching anew; unchanged patterns keep their open state and listeners.

A scoped lifetime document observer detects removal/adoption of already-owned surfaces or invokers. For Accordion it also revalidates owned structure and native name-group boundaries after relevant child/name/role/marker changes; invalidated groups require explicit enhancement. It does not initialize new content. Destroy releases listeners, geometry, scheduled work and registry references; it closes owned open overlays before restoring baseline. Removed tasks cannot infer a meaningful application successor, so applications still choose survivor focus before removal. Reinsertion after cleanup requires enhance(root).

The existing form/summary cleanup behavior remains authoritative: native noValidate is restored, managed feedback/hints are released, generated IDs/nodes may remain. Shared lifecycle suspension is internal; existing validate/showErrors/clear/refresh methods and synchronous localization hooks remain the component APIs. Business async work stays application-owned.

Missing/ambiguous IDs, unsupported markers/capabilities, invalid placement, unsafe initial structure or incomplete close/focus relationships preserve baseline content and hidden actions. One broken pattern must not prevent independent valid patterns from initializing. Normal light/dark brands, RTL, focus tokens, long content and reduced motion remain native/foundation-owned.

## Examples and evidence

Add declarative examples for forms, dialogs, popovers and Popup without application initialization code. Retain advanced/manual recipes as compatibility coverage. Verify both entry-point orders, repeated loading, automatic and scoped enhancement, root inclusion, invalid roots/markup, explicit destroy/resume, late invokers, detached/reinserted/adopted nodes, nested ownership, cancelled/failed opening, survivor focus and no stale geometry.

Verify native values/submitters/reset/validation with combined and legacy scripts. Add no-script/missing-capability checks and display matrices for single-content fallback, 320px, enlarged/long labels, RTL/brands/modes. Direct keyboard/pointer, zoom, screen readers, touch and browser/platform evidence remain dated release work, not conformance claims.

## Completion

Update API, catalogue links, guides, README, AGENTS, source/build instructions, examples and browser evidence together. Generate and commit the combined file with its sources when a commit is requested. No stable release or planned-widget maturity is implied by this entry point.
