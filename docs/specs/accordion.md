# Accordion specification

## Identity and purpose

**Status: experimental implementation. Phase: 2. Owner: UI behavior and foundation layers.** This specification covers Accordion and Accordion Item together. The [integration guide](../accordion.md) documents the shipped shared-entry behavior and its limits.

Use an accordion for related sections that readers may independently reveal. Prefer ordinary headings and visible sections for essential instructions, comparison tasks or a sequential form. One optional disclosure needs only native `details` and `summary`. Follow the [lifecycle and ownership contract](../lifecycle.md).

The `ui-accordion` is a light-DOM composition boundary around native disclosures. Each item is a native `details`. Optional enhancement by element name through the existing shared entry adds summary navigation, fragment reveal and collapsed-content focus recovery. Native HTML owns expansion, including optional exclusive groups. No custom expansion controller, animation, expand-all action, persistence or async loader is included in this slice.

## Minimal markup

The native disclosures work without JavaScript. Paths are relative to the repository root. `css/ui.css` adds block layout for `ui-accordion`; `js/ui.js` supplies opt-in enhancement.

```html
<link rel="stylesheet" href="css/ui.css">
<script src="js/ui.js" defer></script>

<section aria-labelledby="visit-title">
  <h2 id="visit-title">Plan your visit</h2>
  <ui-accordion>
    <details open>
      <summary>Getting here</summary>
      <p id="arrival">Meet at the visitor centre at 09:30.</p>
      <a href="/directions">Read the directions</a>
    </details>
    <details>
      <summary>What to bring</summary>
      <p id="equipment">Bring waterproof clothing and drinking water.</p>
    </details>
  </ui-accordion>
</section>
```

The wrapper accepts direct `details` children plus whitespace/comments. Each item has exactly one `summary`, its first element child, with a meaningful visible label. Put links, buttons and form fields in the content after the summary, rather than inside the summary. No required panel wrapper, generated button or duplicate content is needed. A containing section and heading name the topic; the wrapper adds no region role or focus stop. Authors may use one appropriate native heading within a summary, but must verify its heading and disclosure exposure with assistive technology; plain summary text is the default recipe.

Multiple-open is the default: omit `name` on every direct item. For optional single-open, give every direct item the same nonempty native `name`, unique to that group in the document, and author at most one `open` item. For example, both items can have `name="visit-sections"`. All items may be closed; this is not an always-one-open policy. The [HTML details contract](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-details-element) defines native grouping. A wrapper does not scope matching names. Nested groups must use different names; never give a descendant the same group name as an ancestor. In browsers without native exclusive grouping, the useful fallback permits multiple open disclosures; UI will not polyfill exclusivity.

## Public contract

The following experimental contract is implemented in the shared entry.

| Surface | Implemented decision |
| --- | --- |
| ui-accordion | Block composition boundary around direct details items. |
| Element opt-in | The shared entry enhances ui-accordion elements after parsing. |
| details open / open property | Native boolean expanded state, default absent/false. Presence, including open="false", means open. Native property and attribute reflection remain authoritative. |
| details name / name property | Native grouping string. All direct items omit name, or share a nonempty name with no outside members. Empty/mixed/colliding names make the group ineligible for UI enhancement; UI never rewrites names or reverses native grouping effects. |
| Shared methods | Existing UI.enhance(root) installs/reconciles this pattern; UI.destroy(root) releases it. Existing argument, root-inclusion, synchronous undefined return and idempotence rules apply. No accordion-specific methods or properties. |
| Readiness | Use the shared initializer's owned data-ui-ready only after successful installation. It is not expansion state or an author configuration attribute. Conditional restoration follows the shared contract. |
| Events | Listen directly to each native details toggle; it does not bubble. Native events are noncancelable, have no custom detail and may be coalesced. Read current open state, including after script writes. Emit no synthetic toggle, input, change or custom before/after events. |
| CSS variables | No new public tokens in the first slice. Reuse native details spacing, surface, border, radius and shared summary focus styling. Wrapper layout adds no fixed height, clipped content or size/density API. Semantic theme tokens inherit normally. |

Applications control an item with `item.open = true` or `item.open = false`; they read `item.open` in a directly attached `toggle` listener. Initialization and reconciliation never replay initial `open` states. Do not write `open` back merely to mirror a toggle event. UI does not restore old expansion on destroy, translate labels or write expansion ARIA. Changes to the group structure or names require `UI.enhance(group)` after the application update; ordinary `open` changes require no refresh.

## Interaction and accessibility

The [APG accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/) informs the optional summary navigation. This native-disclosure design retains native semantics instead of installing the APG example's separate heading/button/panel structure. No role=button, aria-expanded, aria-controls, aria-hidden, aria-disabled or panel region is generated. No roving tabindex or live region is added. Verify actual names, states and heading exposure in the release matrix.

| Input | Result |
| --- | --- |
| Tab / Shift+Tab | Native sequence through every summary and reachable controls in open content; enter/leave freely. No trap or positive tabindex. |
| Enter / Space on summary | Native activation toggles that item; do not intercept or synthesize a click. |
| Unmodified ArrowDown / ArrowUp on an owned summary | Enhancement focuses the next/previous direct-item summary, wrapping at the ends. Expansion is unchanged. |
| Unmodified Home / End on an owned summary | Enhancement focuses the first/last eligible direct-item summary. Expansion is unchanged. |
| Left / Right, Escape and other keys | Remain native; no collapse-all, dismissal or horizontal navigation behavior. |
| Pointer / touch | Native summary activation, without whole-panel click handlers or pointer-only affordances. |

Handle navigation only when the event target is the owned summary or its noninteractive label descendant. Ignore already prevented events, composing input and any Alt/Ctrl/Meta/Shift modifier. Never handle content-field keys or nested-group summaries. Prevent default only for a navigation key with an eligible destination; do not stop propagation. Skip summaries/items hidden or inert through authored state or closed ancestors. Direction and language changes need no label parsing or arrow reversal: navigation follows DOM order. Preserve native focus and the disclosure marker, long-label wrapping and shared forced-color focus treatment.

Installation, refresh, opening and theme changes never move focus. On a native toggle to closed, recover focus to that item's summary only if the current active element is still in its newly collapsed content. If focus has already moved elsewhere, leave it there. Read current state when the event runs; queued/coalesced toggle events must not undo a later reopening. If an outer item hides a nested focused item, recover to the outer summary. With exclusive grouping, opening a sibling may close the old item before the event runs; do not take focus from the newly activated summary. A removed/hidden/inert summary cannot be a recovery target; applications choose a survivor before deliberately hiding or removing the task. Unexpected removal releases resources without guessing another destination.

### Fragments and forms

On successful installation and document hashchange, resolve an ordinary decoded fragment to one unique authored ID in the same document. Invalid encoding, absent/duplicate IDs and text-fragment directives exposed in location.hash are left to the browser. Browsers can strip text directives before exposing the hash; any remaining ordinary ID is processed as an ID fragment. Do not build a CSS selector from a fragment. If the target lies within an owned item, reveal its closed details ancestors from outside in, including native disclosure ancestors, then schedule one scrollIntoView after layout. Only the innermost enhanced group containing the target coordinates this work; other groups ignore it. Recheck connection, hash, ownership and target visibility before scrolling. Explicit hidden/inert content remains unavailable; do not remove authored hiding to satisfy a link. Never change the URL, history or focus, and never force smooth scrolling. Cancel pending scrolling on destroy, superseding hashchange or intervening user pointer/key interaction. Reveal on refresh only for a newly installed group, rather than reopening items on every reconciliation.

Opening ancestors can close other native name-group members; do not reclose revealed content or attempt a second expansion policy. Fragment targets must not require two same-name items to be open. If revealing a target fails because authored structure prevents visibility, leave browser navigation and readable disclosure controls intact.

Controls inside disclosures retain native labels, names, values, validation eligibility, FormData, submitters, reset and autofill. Closing an item must not disable, reset, clone or reparent them. Form reset resets controls, not disclosure expansion. Error-summary links already reveal native disclosure ancestors before focusing fields; Accordion must preserve that path, including nested and single-open cases. Opening on validation is owned by the form/summary or application, not by an Accordion invalid listener. Keep required questions and blocking errors visible where practical. Applications using native validation must reveal invalid controls before browser focus/reporting; do not claim closed required controls work automatically across platforms.

There is no disabled/read-only accordion state because native details has neither mode. Do not simulate one using aria-disabled or suppress native activation. Individual content controls retain their actual disabled/read-only semantics. Busy, error, success, loading and retry feedback belong to the content/application and must remain discoverable without a forced expansion or announcement. UI starts no requests and owns no pending business work.

## Lifecycle and failure

Use the shared entry's explicit scoped lifecycle. Static ui-accordion groups initialize after parsing. New groups and late/replaced summaries/items require `UI.enhance(group)`; no automatic discovery of new items is promised. A small ownership observer may release removed/adopted items and invalidate an already-owned group's structure, but must not silently activate late children. Observe only relevant child structure and name changes, not arbitrary content or open mutations. Coalesce validation, ignore owned writes and install no perpetual frame loop.

Before acquiring ownership, validate connected same-document markup, summaries and grouping, and check required listener/observation capabilities. An empty wrapper is inert, without readiness. Invalid/incomplete structure leaves every native disclosure usable and releases stale enhancement, while independent valid groups continue. Conflicting authored roles or expansion ARIA on the wrapper, details or summaries are ineligible rather than overwritten. No IDs, content, tabindex or native names are generated. A nested ui-accordion belongs inside an item's content and owns only its own direct items; an outer group never consumes its keys or toggle handling.

Repeated enhance reconciles without duplicated listeners or focus/expansion changes. After relevant structure changes, temporarily release obsolete navigation/reveal ownership until explicit enhance validates the current group. Open-state changes alone remain native and do not invalidate enhancement. Native document-wide name collisions can change expansion even when UI enhancement is withheld; documentation and fixtures must expose that authoring error rather than suggest wrapper isolation.

Destroy removes per-item toggle/key listeners, shared fragment subscriptions and ownership observers, cancels scheduled scrolling, invalidates queued work and releases references. Shared document listeners exist only while groups need them. Remove only the owned readiness value conditionally; preserve later authored writes. Keep current open/name state, focus, answers and content. Removed/adopted groups are cleaned up by shared lifetime monitoring; reinsertion requires explicit enhance in the supported document. Foreign-document adoption remains native until that document's own UI runtime initializes it. Disconnect is not submission, reset, success or cancellation of application work.

Without JavaScript, missing capabilities or failed initialization, native summary activation and authored open/name states remain available. No content is hidden by UI CSS or script beyond native details behavior. Unsupported native name grouping falls back to multiple-open content. Print uses the native disclosure baseline in the first slice; complete printed instructions must be supplied outside disclosures when needed. Opening every item for print, find-in-page overrides and cross-page routing are outside this slice and must not be implied by the fragment support.

## Examples and evidence

The [focused harness](../../tests/accordion.html) and [runnable recipes](../accordion.md) cover an initial subset of this matrix. [ACCESSIBILITY.md](../../ACCESSIBILITY.md) records actual checks and remaining platform/assistive-technology work. The matrix below states acceptance requirements, not a claim that every case passed.

| Area | Required fixtures and assertions |
| --- | --- |
| Baseline and groups | No script, script failure, plain unwrapped disclosures, empty group, multiple-open, all-closed exclusive group, native-name support fallback, mixed/empty/colliding names and invalid same-name nesting. No UI mutation of open/name on install or destroy. |
| Keyboard and focus | Real Enter/Space, Tab/Shift+Tab, four navigation keys, wrap, one item, hidden/inert items, modified/composing/prevented keys, nested groups, content inputs, programmatic collapse while focused, rapid close/reopen and sibling opening without focus theft. |
| Navigation and forms | Initial fragment, hash changes, nested closed ancestors, malformed/duplicate/missing IDs, text fragments, superseded/cancelled scrolling, field-error reveal/focus, native/custom validity, external form ownership, FormData, reset/cancelled reset and retained server errors. |
| Lifecycle | Repeated enhance/destroy, initially incomplete/late items, summary replacement, name changes, removal while focused/open, detach/reinsert, adoption, scoped root inclusion, nested teardown, application attribute writes, listener/resource counts and no stale scrolling. |
| Content and presentation | Long/localized summaries, optional summary heading, rich content links/fields, empty content, content-owned busy/error/retry/success, disabled/read-only fields, two brands/light/dark, density scopes, RTL, reduced motion, forced colors, 320px reflow, text spacing/resize, 400% zoom and print limits. |

Verify native names/states, reading order, optional headings, collapsed-content exclusion and focus recovery with VoiceOver/Safari and NVDA/Firefox or Chrome, plus the browser/mobile/touch combinations in the release gate. Review axe incomplete findings without exclusions. Tests must assert native toggle ordering/coalescing and actual focus destinations, rather than assume one event per write. Automated checks alone do not establish conformance.

## Completion

The wrapper, shared-entry behavior, minimal CSS, recipes and focused harness ship experimentally. Applications use ui-accordion with the combined entry; plain details remain native. Keep the current reference, catalogue, generated output, payload measurements and dated evidence aligned. Stable maturity still requires the [component release gate](../../ROADMAP.md#release-gate-for-every-component).
