# Popup specification

## Identity and purpose

**Status: experimental implementation. Phase: 2. Owner: UI behavior layer.** Popup is an optional anchored-positioning adapter in `js/popup.js`, exposed as `UIPopup.attach`. It has no registered element, package or module import path. The [implemented integration guide](../popup.md) documents the exact available contract and its current limits. The [native Popover recipe](../popover.md) is implemented separately and remains usable without this utility.

Popup places an already-owned non-modal surface near its anchor. The consumer owns its interaction and fallback; the browser owns native popover visibility and dismissal. Follow the [lifecycle and ownership contract](../lifecycle.md). A native disclosure or ordinary inline content is preferable when anchoring adds no task benefit. Modal dialogs retain their existing layout and do not use this first slice.

The first implementation supports one anchor and one native `popover="auto"` surface in the same document, horizontal writing mode, LTR/RTL, and block-start/block-end placement with inline-start alignment. Menus, tooltips, arrows, hover intent, virtual anchors, cross-frame placement, vertical writing modes, portals and animation are separate work. No custom element is needed for geometry alone.

## Minimal markup

The baseline is ordinary light DOM using `css/ui.css`. Load optional `js/popup.js` before application initialization. This minimal structure keeps inline information visible and script-dependent actions hidden; the [complete runnable consumer](../previews/popup-0.html) supplies capability/target checks, two close actions and fallback focus.

```html
<section>
  <h2>Project reference</h2>
  <p>Keep the reference beside your field notes.</p>
  <button id="reference-open" type="button"
    popovertarget="reference-help" hidden>Open reference help</button>
  <div id="reference-inline">
    <h3>Finding the reference</h3>
    <p>Use the reference from the original visit record.</p>
  </div>
  <div id="reference-help" popover="auto" hidden>
    <h3>Finding the reference</h3>
    <p>Use the reference from the original visit record.</p>
    <button type="button" popovertarget="reference-help"
      popovertargetaction="hide">Close reference help</button>
  </div>
</section>
```

Required relationships are a unique native invoker target, its close action, a connected anchor and a surface in the same document. A consumer installs its behavior and positioner before hiding the inline duplicate or exposing its opener. The surface must not contain its own anchor. Inputs stay in their authored location with unchanged native form associations. Inside a modal dialog, keep both nodes within that dialog's subtree. Nested consumers require separate acceptance evidence.

## Public contract

The experimental classic-script API is `UIPopup.attach({ anchor, surface, placement, gap, padding, onUnavailable })`. It returns the update/destroy handle described below. The API is optional and not stable; it has no automatic loader or declarative custom element.

| Surface | Implemented decision |
| --- | --- |
| Element, attributes and properties | None. No ui-popup registration, active attribute or reflected open state. Native popover state remains authoritative. |
| UIPopup.attach(options) | Accept an anchor Element, native auto-popover HTMLElement, placement and numeric gap/padding options; return one handle. Invalid arguments, duplicate ownership, cross-document nodes or unsupported writing mode throw before acquiring resources or changing DOM. |
| Defaults and options | placement is block-end-start or block-start-start, default block-end-start. gap and viewport padding are finite non-negative CSS-pixel numbers, each defaulting to 8. Unknown options or invalid values throw TypeError. |
| Handle update() | Synchronous measurement/write when connected and open; return true after successful placement, false when closed or unavailable. No focus, visibility or events changed. A destroyed handle returns false. |
| Handle destroy() | Synchronous, idempotent resource release and conditional restoration of owned styles. Returns undefined. Does not close the popover or restore focus. |
| Failure callback | Optional synchronous onUnavailable(reason), once per transition into unavailable state; reason is anchor-unavailable, surface-unavailable or unsupported-context. It does not mean a task failed. The consumer decides whether to close or reveal inline content. No callback after destroy. |
| Events | No custom events. Observe native toggle for visibility reconciliation; do not synthesize beforetoggle, toggle, cancel or close. Do not cancel opening or dismissal. |
| CSS variables | No new public tokens. Preserve foundation surface, border, radius and focus tokens; consumer styling owns readable content and internal scrolling. gap/padding options control geometry only. |

An attachment may be created while the surface is closed. It remains dormant until opening; attach/update never opens it. Read actual native state after opening, including cancelled/failed opening. Repeated update does not duplicate resources. Replacing an anchor or surface requires destroy followed by a new attachment; there is no implicit retargeting.

## Positioning and fallback

The first implementation uses measured rectangles and fixed placement for a native top-layer surface. It does not reparent nodes or install a positioning dependency. The browser's [popover model](https://html.spec.whatwg.org/multipage/popover.html) supplies visibility and dismissal; this adapter supplies geometry decisions only.

1. Measure anchor, surface and usable viewport while open, before writing the new position. Use layout-viewport CSS-pixel coordinates consistently, intersected with visual-viewport bounds when available. Do not mix device pixels with CSS pixels or apply browser zoom twice.
2. Try the requested block side with inline-start alignment resolved from the anchor's effective direction. Keep the gap. Prefer that side if it fits; otherwise flip when the opposite side has more usable room. Ties retain the requested side.
3. Shift inline placement within the viewport padding. Constrain the surface's maximum available inline/block dimensions without enlarging smaller authored limits. Long content must wrap and scroll within the surface, with reachable close actions. If neither side fits at full size, use the side with more room and constrain its height.
4. If the anchor has no rendered box, is disconnected/hidden, or is fully outside the usable viewport or a clipping ancestor, stop writing and notify the consumer. Never leave an apparently anchored surface attached to an unrelated screen location. A partly visible anchor uses its visible intersection for placement.
5. When the context cannot produce a usable visible surface, report unavailable. The help consumer closes it and restores complete inline help; another consumer must specify its own useful fallback before implementation.

Owned placement styles are position, top/right/bottom/left, the four physical margins, max-inline-size and max-block-size, with original values and priorities recorded. Do not replace the entire style attribute, change theme variables, hide page overflow or override native display state. Author transforms or layout constraints that prevent the documented coordinate model are unsupported contexts, with fallback rather than guessed offsets.

[CSS Anchor Positioning](https://drafts.csswg.org/css-anchor-position-1/) is a future alternative backend, not a requirement or browser-support claim. It may replace measurements only after the same collision, direction, zoom and cleanup tests pass. Unsupported CSS must continue through the measured backend; unsupported core popover/measurement capabilities retain the inline baseline. No CSS-only detection is accepted as proof that geometry works.

## Interaction and accessibility

Popup adds no name, role, ARIA relationship, tabindex, key map, announcement, focus trap or background inertness. Its help consumer uses meaningful headings, native buttons and declarative popover targets. Native Enter/Space, Tab/Shift+Tab, Escape and outside activation remain browser-owned. Pointer/touch opening is consumer-owned; positioning installs no hover or global key/pointer dismissal handlers.

The first help consumer follows the implemented popover focus policy: opener focus on activation, no forced focus into supplemental help, native explicit-close restoration, and no focus theft after outside activation. A consumer must supply survivor focus before deliberate removal. Disabled native invokers do not activate. Busy/read-only/invalid are not geometry states; application feedback and native form behavior remain independent.

Placement follows effective direction on every update. Changes to direction, text, language, fonts or viewport can require another update without moving focus. Strings are authored; the positioner has no localization catalogue or label parsing. Reduced motion needs no animation because placement is immediate. Verify forced colors and visible focus on the actual consumer, including clipped edges and scroll positions. No APG role is applicable to geometry alone; richer consumers require their own pattern specifications.

## Lifecycle and failure

Keep only native toggle/removal monitoring while attached and closed. While open, observe relevant anchor/surface size and document changes, capture ancestor scrolling, and respond to window/visual-viewport resize and scroll. Schedule at most one pending animation frame per attachment; close releases open-only resources. If a required observation API is missing, attachment is unavailable and the consumer retains the baseline rather than promising automatic tracking.

Track anchor movement from relevant DOM/layout changes, including sibling expansion and font completion. Ignore/coalesce owned writes to avoid observer loops. Continuous animation tracking is outside this slice; applications moving anchors without observable changes call update explicitly. Observe effective direction changes without resetting content. The implementation must declare its exact observation boundary and prove idle closed attachments do not run frame loops.

Destroy cancels pending frames, listeners and observers and releases node references. A queued callback checks the current attachment generation before writing. Removal/adoption of either node reports unavailable; a consumer destroys and explicitly reattaches after reinsertion or cross-document movement. Retargeting native IDs must not silently keep the old anchor active. Closing alone preserves native reading position; geometry owns no scroll reset.

A second positioner must not acquire the same surface. Nested surfaces each own their geometry and native events; a parent's observer cannot handle a child's dismissal. Parent removal stops both attachments through their own consumer cleanup. Native close order and focus recovery remain consumer responsibilities. No global overlay stack is introduced.

Popup has no async transport or persistent values. Native input names, values, required/custom validity, submitters, reset and autofill remain unchanged; geometry updates cannot rebuild forms. Pending business work follows application cancellation and stale-response rules in the lifecycle contract.

## Examples and evidence

The [focused geometry harness](../../tests/popup.html) and [integration guide](../popup.md) accompany the implementation. Consult the dated evidence for actual results; acceptance requirements below are broader than that evidence. The earlier [popover evidence](../../ACCESSIBILITY.md#phase-1-native-popover-robustness-17-october-2026) covers the unpositioned native recipes only. The anchored-help consumer retains readable fallback. Verify these acceptance cases before stable maturity:

- Both block sides and directions, all viewport edges, partly clipped/offscreen/hidden anchors, nested scrolling, transformed/unsupported contexts, resize, font loading and moving siblings.
- Long/localized content, empty content, both close controls, disabled invoker, busy application feedback, real keyboard and touch, zoom/visual-viewport changes and 320px reflow across brands/modes.
- Opening cancellation/failure, no JavaScript, missing capabilities, invalid options, duplicate attachment, cancelled/default native dismissal and repeated closed/open cycles.
- Explicit destroy, remove while open/focused, reinsertion, cross-document adoption, retargeted IDs, nested dialog/popover tasks and preserving application style/description changes.
- Measured resource counts and no stale writes after close/destroy; native form serialization/reset and no synthesized input or task-completion events.

Record Chrome, Safari, Firefox, Edge and relevant mobile/assistive-technology versions and dates, actual focus/dismissal results and axe incomplete findings. These are acceptance requirements, not passed tests. No stable or conformance claim follows from a specification.

## Completion

The help consumer and adapter ship together as experimental foundation work. Require current reference, catalogue, examples, payload measurements and dated evidence to agree before claiming stable maturity or extracting another backend. Application integration must use the documented ownership/style list and supported contexts. Menus and tooltips remain separate specifications. The [release gate](../../ROADMAP.md#release-gate-for-every-component) still applies.
