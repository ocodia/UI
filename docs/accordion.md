# Accordion

Accordion is experimental native-disclosure composition. Each item stays a `details` with a first-child `summary`. Prefer headings and visible sections for essential instructions or content readers need to compare.

Load `css/ui.css` and the optional combined `js/ui.js` entry. Opt in with this light-DOM markup:

```html
<ui-accordion>
  <details open>
    <summary>Getting here</summary>
    <p>Meet at the visitor centre at 09:30.</p>
  </details>
  <details>
    <summary>What to bring</summary>
    <p id="equipment">Bring waterproof clothing and drinking water.</p>
  </details>
</ui-accordion>
```

## Native expansion and keyboard use

Without JavaScript, summaries remain native disclosures. `open` and the native `open` property are the only expanded state. UI never duplicates them with ARIA or restores old expansion on teardown. The wrapper supplies block layout; it introduces no new CSS variables or sizing/density modes.

Tab and Shift+Tab traverse summaries and reachable content controls. Enter/Space and pointer/touch activation remain native. When enhanced, unmodified Up/Down move between eligible direct-item summaries, wrapping; Home/End reach the first/last. Navigation changes focus without changing expansion. Hidden/inert items are skipped. Modified, composing and already prevented keys, content input keys, Left/Right and Escape remain native. No roving tabindex, live announcements or focus trap is added.

Multiple-open is the default. For single-open, put the same nonempty native `name` on every direct item and use a name unique to this group in the document. Author at most one open item. All may be closed. Matching names apply across wrappers; never reuse the group name in nested disclosures. Browsers without native exclusive grouping permit multiple open items. UI does not polyfill exclusivity.

## Content, fragments and forms

Put meaningful text in each summary and links/buttons/fields in the following content. Do not nest interactive controls inside summary. A containing section and heading identify the topic. Optional headings within summaries need browser/screen-reader verification. The wrapper accepts only direct details items plus whitespace/comments, and each item needs exactly one first-child summary. Empty/incomplete groups, conflicting roles/expansion ARIA and empty/mixed/colliding names remain unenhanced. Invalid naming can still affect native expansion.

Initial ordinary ID fragments and hash changes reveal disclosure ancestors of the unique target, then scroll after layout without scripted focus or URL changes. Nested groups coordinate one reveal. Explicit hidden/inert content, invalid/duplicate IDs and text directives exposed in the hash are left to the browser. Some browsers strip text directives before exposing the hash; a remaining ordinary ID is processed normally. Intervening key/pointer input, teardown and newer hashes cancel queued scrolling. The browser may apply its own fragment focus behavior. Refreshing an unchanged group does not reopen manually closed content.

On collapse, UI returns focus to that summary only while focus still lies inside its now-collapsed content. It does not take focus from another destination. Applications choose survivor focus before deliberately hiding/removing a focused task.

Closing content preserves labels, names, values, FormData, validation, submitters, native reset and autofill. Error-summary links already reveal ancestor details before focusing fields. Accordion adds no invalid listener. For native validation without the enhanced error summary, applications must reveal invalid controls before reporting/focusing them. Keep required questions visible when practical. Reset affects answers, not expansion. There is no disabled or read-only Accordion mode; individual controls retain those native states. Async work and loading/error/success feedback remain application-owned.

## Lifecycle

Static ui-accordion groups initialize after parsing. Use `UI.enhance(group)` after inserting a group or changing direct items, summaries or names. The shared document observer invalidates stale ownership after structural/role/name changes and detects outside name collisions; it does not initialize new items. Ordinary open/content changes preserve ownership. Nested groups only own their direct items.

`UI.destroy(group)` releases keyboard/toggle listeners, fragment subscriptions and pending scrolling for contained groups, deepest first. It removes owned readiness conditionally and preserves current expansion, focus, answers and later application writes. Removal/adoption releases ownership; reinsertion needs explicit enhance in the supported document. Shared fragment listeners exist only while needed. No IDs, content, controls, names or tabindex are generated.

Use the combined entry for this experimental opt-in enhancement. Print retains native disclosure behavior; provide complete printed instructions outside disclosures when required. Expand-all, find-in-page overrides, animation, persistence and routing are outside this slice.

The [specification](specs/accordion.md) gives the complete acceptance contract. Run the [focused checks](../tests/accordion.html) and read [dated evidence and remaining checks](../ACCESSIBILITY.md). Experimental status does not establish accessibility conformance.
