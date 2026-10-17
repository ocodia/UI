# Anchored Popup help

## Standard shared setup

Load `js/ui.js` once and use the [shared enhancement markup](enhancement.md). Standard opening, focus, fallback and cleanup are library-owned; no application initialization script is required. The [single-copy example](previews/enhancement-3.html) keeps its content readable without JavaScript. `UI.enhance(root)` / `UI.destroy(root)` cover dynamic insertion and teardown.

```html
<script src="js/ui.js" defer></script>
```

The first interactive example below uses this shared path. The remaining material documents the lower-level adapter or earlier manual recipe for advanced integration and compatibility.

## Advanced manual integration

Popup is an **experimental optional geometry adapter**, implemented in `js/popup.js`. It positions a native auto popover near an anchor. The browser owns visibility and dismissal; the application owns content, focus recovery and fallback. It registers no element and adds no menu/dialog roles. The existing [native popover recipes](popover.md) still work without this file.

The [anchored reference help](previews/popup-0.html) is the first consumer. Its complete source appears below; it preserves native field values and keeps full help inline without scripting or required capabilities. Read the [specification](specs/popup.md) and [lifecycle contract](lifecycle.md) before adding another consumer. Menus and tooltips require separate interaction specifications.

## Include and attach

Load `css/ui.css`, then the optional classic script before your application initialization. It does not require `js/components.js`, a module loader, a package or a custom-element registration.

```html
<link rel="stylesheet" href="css/ui.css">
<script src="js/popup.js" defer></script>
<script src="my-help.js" defer></script>
```

The script exposes `UIPopup.attach(options)`. Supply connected same-document nodes and a native `popover="auto"` surface. An invoker button must resolve its actual popover target to that surface. Install the consumer and positioner before revealing an opener or hiding useful inline fallback. Initialization never opens help or moves focus.

```js
const positioner = UIPopup.attach({
  anchor: document.querySelector('#reference-open'),
  surface: document.querySelector('#reference-help'),
  placement: 'block-end-start',
  gap: 8,
  padding: 8,
  onUnavailable(reason) {
    // Close the native popover and restore complete inline help.
    // Choose survivor focus only if the disappearing task currently owns it.
  }
});
// The consumer/native invoker owns opening. Geometry can be refreshed explicitly.
positioner.update();
// Before replacement or application removal:
positioner.destroy();
```

## Adapter contract

| Surface | Implemented behavior |
| --- | --- |
| anchor / surface | Required connected Element and auto-popover HTMLElement in the same document; the surface cannot contain its anchor. One positioner per surface. |
| placement | block-end-start (default) or block-start-start. Inline-start follows the anchor's current direction. |
| gap / padding | Finite non-negative CSS-pixel numbers, default 8 each. Padding bounds the usable viewport. |
| onUnavailable | Optional synchronous callback with anchor-unavailable, surface-unavailable or unsupported-context. Notified once per failure transition. It owns no native dismissal or focus by itself. |
| update() | Synchronous: true after placement, false when closed, unavailable or destroyed. No visibility, task result, focus or custom event changes. |
| destroy() | Idempotent synchronous cleanup; returns undefined. Preserves native visibility and restores owned styles conditionally. No callbacks or queued writes survive it. |
| Invalid attachment | TypeError before resource acquisition for invalid/unknown options, duplicate surface ownership, disconnected/cross-document nodes, unavailable required APIs or unsupported initial writing mode. |

Attachments can be created while closed. A closed update is dormant. Native toggle starts/stops geometry tracking; the consumer need not synchronize a second open Boolean. Cancellation of native opening remains native. Explicit update is useful after application layout changes that do not produce observed mutations or size changes.

## Placement and supported contexts

The measured backend tries the requested block side, flips when it cannot fit and the opposite side offers more room, then shifts inline placement inside the viewport. A partly clipped anchor uses its visible intersection. Fully clipped/hidden/disconnected anchors report unavailable. Long help retains one native scrolling surface and reachable close actions; measurement preserves the reading position established by native focus scrolling. If viewport/text changes would clip the control already holding focus, only the help surface scrolls to retain that control and clearance for its focus outline. An unfit focused target reports unavailable; geometry never refocuses it.

The implementation uses fixed CSS-pixel coordinates in the native top layer, intersecting layout and visual viewport bounds. It supports horizontal writing mode, LTR/RTL, window/ancestor scrolling and native dialog descendants. It creates no portal or global overlay stack. Authored transforms, individual translate/rotate/scale or CSS zoom on the anchor/its ancestors, clip-path/paint containment, and transforms or unsupported writing mode on the surface, are unsupported contexts. Ordinary browser zoom is distinct from authored CSS zoom.

CSS constraints that prevent the measured surface fitting its available viewport also report unavailable. The help consumer closes it, hides its opener and restores inline help rather than leaving unusable anchored content. This is deliberate progressive fallback, including very short viewports with large content. Essential instructions stay beside the field in both modes. The adapter does not test that arbitrary consumer content is semantically useful at every height; consumers must verify target reachability and may choose inline help earlier.

CSS Anchor Positioning is not required by this backend. Vertical writing modes, virtual anchors, cross-frame placement, animated anchor tracking, arrow geometry and alternate positioning backends remain outside this slice.

## Ownership and cleanup

Owned styles are position, top/right/bottom/left, the four physical margins, max-inline-size and max-block-size. Each original value/priority is recorded. Release restores it only if the current declaration still matches the last geometry write; unrelated styles and later application changes survive. New application geometry writes encountered during an update become the new restoration baseline. Geometry does not change form values, IDs, labels, roles, ARIA or native open state.

A document mutation observer watches child/text changes and relevant style/class/direction/visibility/target/size attributes. While closed it handles node removal/association loss without scheduling geometry. While open, size observation, capture-phase document scroll/load, window resize, visual-viewport scroll/resize and font-loading completion coalesce into at most one pending frame per attachment. There is no permanent frame loop. Own style writes are ignored by mutation reconciliation. CSS changes without an observed mutation/size event, such as some stylesheet media-state changes, need an explicit update.

Closing releases open-only listeners, size observers and scheduled frames, and restores styles. Destroy also releases native toggle/removal monitoring. Removed/adopted/retargeted nodes report unavailable; consumers destroy and explicitly attach again for reinsertion/replacement. Async business requests remain application-owned. The static help example initializes once and destroys on fallback or non-persisted page exit; it does not observe new replacement help markup.

## Interaction and evidence

The reference-help consumer focuses its activated opener, keeps background editing available, and uses native close actions at both ends. Escape/outside dismissal and native focus restoration remain browser-owned. When placement fails, it focuses the inline heading only if focus was on the opener or inside the disappearing help; it preserves an independently focused background field.

Run the [focused geometry harness](../tests/popup.html) or [complete browser harness](../tests/accessibility.html). Dated results and limits are in [ACCESSIBILITY.md](../ACCESSIBILITY.md). Geometry assertions are not proof of touch, native keyboard or screen-reader behavior. Experimental availability does not close the remaining platform/manual release gates.
