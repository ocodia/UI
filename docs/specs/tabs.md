# Tabs specification

## Identity and purpose

**Status: experimental implementation. Phase: 2. Owner: UI behavior and foundation layers.** This specification covers Tab Group, Tab and Tab Panel together. The [integration guide](../tabs.md) documents the shipped shared-entry behavior and its limits. Follow the [shared lifecycle and ownership contract](../lifecycle.md).

Use tabs to switch between related views of one topic when readers need one view at a time. Prefer headings and visible sections for comparison, essential instructions or sequential forms. Use ordinary named navigation and real page URLs for site navigation. Tabs are neither a menu nor a stepper.

The `ui-tabs` is a light-DOM ownership boundary around native fragment links and sections. Its native `nav` child provides section navigation before enhancement; the parent installs tab-list behavior only when ready. A wrapper is useful for validating the complete family, coordinating one selected panel and isolating nested instances. Selection and keyboard behavior arrive together through shared-entry enhancement of the wrapper. Manual activation is the default; automatic activation is an explicit alternative for already available content. Routing, persistence, remote loading, closable/reorderable tabs and animation are outside the first slice.

## Minimal markup

Paths are relative to the repository root. Use `css/ui.css` and `js/ui.js` for enhancement; without scripts these links and sections retain their baseline. No script-dependent controls, hidden panels or compound roles are authored.

```html
<link rel="stylesheet" href="css/ui.css">
<script src="js/ui.js" defer></script>

<section aria-labelledby="visit-title">
  <h2 id="visit-title">Plan your visit</h2>
  <ui-tabs>
    <nav aria-label="Visit information">
      <a id="visit-arrival-tab" href="#visit-arrival">Getting here</a>
      <a id="visit-equipment-tab" href="#visit-equipment">What to bring</a>
    </nav>
    <section id="visit-arrival" aria-labelledby="visit-arrival-title">
      <h3 id="visit-arrival-title">Getting here</h3>
      <p>Meet at the visitor centre at 09:30.</p>
      <a href="/directions">Read the directions</a>
    </section>
    <section id="visit-equipment" aria-labelledby="visit-equipment-title">
      <h3 id="visit-equipment-title">What to bring</h3>
      <p>Bring waterproof clothing and drinking water.</p>
    </section>
  </ui-tabs>
</section>
```

The wrapper has exactly one direct native `nav`, followed by one or more direct `section` panels, with whitespace/comments allowed. The list contains only direct anchors plus whitespace/comments. Each anchor has meaningful visible text, a unique authored ID and a literal nonempty `#fragment` href resolving to exactly one direct panel in this group. Each panel has a unique authored ID and exactly one corresponding anchor; anchor order matches panel order. Resolve decoded IDs without constructing selectors. Duplicate IDs anywhere in the document, malformed encoding, text directives, extra/unpaired panels and cross-group destinations invalidate enhancement. Do not generate IDs in the first slice: authored links must already work without scripts.

The list needs either a nonempty `aria-label` or valid `aria-labelledby` resolving to visible authored text outside the tab anchors. Panels retain their baseline heading associations for cleanup. Nested tabs belong inside a panel, never inside a tab label or the tab list. No interactive descendants, editable content, download attribute or target attribute are allowed on a tab anchor. Rich panel content, including native controls, remains in place.

## Public contract

This experimental contract is implemented in the shared entry.

| Surface | Implemented decision |
| --- | --- |
| ui-tabs | Block composition and ownership boundary around native navigation and sections. |
| Enhancement opt-in | The shared entry enhances ui-tabs elements after parsing. |
| nav | Required direct native child containing fragment anchors. Native named navigation before enhancement and after teardown; UI temporarily applies role=tablist when ready. |
| data-activation | Wrapper string, manual by default; accepts manual or automatic. Missing, empty or unknown values use manual. No property reflection. Automatic is appropriate only when every panel is available without noticeable latency. |
| data-orientation | Wrapper string, horizontal by default; accepts horizontal or vertical. Missing, empty or unknown values use horizontal. No property reflection. Layout and key map must agree; no automatic orientation switch at a breakpoint. |
| href / id | Authored native fragment relationships. UI never rewrites them, navigates to another document or removes these IDs. |
| Selection | Exactly one ready panel is selected. UI writes aria-selected on tabs and hidden on inactive panels. Do not use authored aria-selected, hidden or tabindex as a second selection API. There is no value/selectedIndex property or selection configuration attribute. |
| Shared methods | Existing UI.enhance(root) installs/reconciles; UI.destroy(root) releases. Both remain synchronous, idempotent and return undefined with the existing root rules. No Tabs-specific method/property in this slice. |
| Programmatic activation | After readiness, call a paired anchor's native click() to request the same selection path as ordinary activation. It does not focus the tab unless focus would otherwise be hidden. Before readiness click() remains native fragment navigation. No asynchronous return value or readiness promise. |
| Readiness | Shared owned data-ui-ready is written only after successful installation. Authors must not configure it. Failed installation rolls back all partial changes. |
| Inactive marker | UI owns data-ui-tabs-inactive="" on each inactive panel alongside hidden; removes both on selection. Authors must not configure this marker. Print CSS uses it to expose only UI-hidden panels. Later authored hiding invalidates ownership and removes the marker without overriding that hiding. |
| Events | One ui-select CustomEvent after an actual post-install selection change, dispatched on ui-tabs; detail is { tab: HTMLAnchorElement, panel: HTMLElement, previousTab: HTMLAnchorElement, previousPanel: HTMLElement, source: "activation" or "fragment" or "reveal" or "reconcile" }. Bubbles and composed are true; cancelable is false. No before-event, initialization event, fake native input/change or event for reselecting the same panel. Nested event consumers check event.target. |
| Native state | Native controls own values, disabled/read-only state, validity and reset. Anchors have no native selected or disabled state. Tab selection is presentation state owned by this enhancement alone. |
| CSS variables | No new public tokens. Use existing spacing, radius, border, surface, selected and focus tokens; inherit semantic colors in both brands/modes. No fixed panel height, clipped labels or new density/size API. |

Configuration changes require `UI.enhance(group)` after the application update. Effective direction is read for each key interaction. Reconciliation retains a surviving selected pair rather than replaying the document fragment or selecting the first item. Repeated initialization does not emit selection events or move focus. An application can listen for `ui-select` to update its own task state; it must not click the selected anchor again merely to mirror the event. Requests remain outside the handler's synchronous selection operation. If a handler starts requests, it owns cancellation, stale-response checks and durable error/retry feedback.

## Interaction and accessibility

The [APG Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) informs the keyboard and relationship contract. Manual activation is UI's conservative default for all panels, including slow content; automatic activation requires an author decision that content is ready.

Install handlers and cleanup before applying `role="tablist"` and `aria-orientation` to the list, `role="tab"` plus `aria-controls` and `aria-selected` to anchors, and `role="tabpanel"` plus `aria-labelledby` pointing to the paired tab on panels. Preserve the list's authored accessible name. Store and conditionally restore each replaced panel heading association. Add no role to the wrapper, no `aria-current`, `aria-expanded`, `aria-hidden`, live region or positive tabindex. Keep visible panel headings.

Exactly one tab is in the sequential focus order. On entry from outside the list it is the selected tab. While navigating manually, the focused tab temporarily owns tabindex=0, even if not selected; other tabs use -1. On leaving the list, restore the selected tab as the next entry point. Selection and focus indicators must be visually distinct; selection uses a persistent marker as well as color. Each enhanced panel has owned tabindex=0 so the visible panel is reachable before its content; inactive hidden panels are outside the focus order. This deliberate extra panel stop keeps static introductory content reachable even when later content contains controls.

| Input on an owned tab | Result |
| --- | --- |
| Tab / Shift+Tab | Native entry/exit. No interception or trap; Tab from the list reaches the visible panel, then its content in DOM order. |
| Horizontal ArrowRight / ArrowLeft | Move to next/previous tab in LTR; reverse those directions in RTL. Wrap at both ends. In manual mode selection stays; in automatic mode select the destination. |
| Vertical ArrowDown / ArrowUp | Move next/previous in DOM order, wrapping; independent of RTL. Selection follows only in automatic mode. |
| Home / End | Focus first/last tab in DOM order; select it only in automatic mode. |
| Enter / Space | Activate the focused tab in either mode. Prevent Space scrolling and native duplicate Enter navigation; ensure one selection operation. |
| Primary unmodified click / touch activation | Select the paired panel and focus that tab. Prevent the replaced native fragment navigation only after successful ownership/validation. |
| Escape, Delete, other-axis arrows and other keys | Remain native; no dismissal, deletion, menus or interception of page scrolling on the unused axis. |

Handle keys only from the owned tab or its noninteractive label descendant. Ignore prevented/composing events and Alt/Ctrl/Meta/Shift combinations; leave modified clicks, middle-click, context menus and copied links native. Do not stop propagation. Never consume keys from content fields or nested tabs. Automatic activation follows focus on an owned tab, including programmatic focus, but not focus entering its panel. Support one paired item without special traps. Direction/orientation changes must not reset selection or steal focus. Vertical writing modes require explicit platform evidence before claiming support; the initial scope is horizontal writing with either tab-list orientation.

Installation never moves focus. Initial selection priority is: the panel containing current focus, then a valid initial fragment target's containing panel, then the first pair. Do not hide an ancestor of the active element to satisfy another initial choice. Ordinary user activation focuses its tab and does not focus the panel. Programmatic activation, fragment reveal and reconciliation preserve focus when it remains visible. If a switch would hide the currently focused content, focus the destination tab before hiding the old panel. If that destination cannot receive focus, abort the switch and release enhancement to the readable baseline rather than strand focus. Selection changes themselves do not scroll or announce through a live region.

There is no disabled/read-only tab or group mode in this slice. Authored disabled, aria-disabled, busy or hidden state on tab/list/panel structure makes it ineligible for enhancement rather than creating an undocumented skip policy. These states remain valid on panel content. Busy/loading/error/success/retry feedback is application content; keep a named loading explanation and retry action available in the selected panel. Do not disable tab navigation while a request runs. Automatic mode must not start requests on focus or be used for content requiring a wait. No localization parser, implicit label translation or typeahead is added.

### Fragments and navigation

Plain anchors and all panels remain useful without enhancement. Modified activations continue to open a document at its fragment. Once ready, ordinary tab activation changes selection without writing location.hash or adding history entries; tabs do not become routing. This also applies to click(). Applications needing page-level history should use ordinary navigation or own a separate routing integration.

At installation and on hashchange, resolve one ordinary decoded ID in the same document. A target may be the panel itself or a descendant. Malformed, missing or duplicate IDs and exposed text-fragment directives are left to the browser. Do not clear hashes, rewrite history or remove authored hidden/inert state. External links and Back/Forward hash changes reveal the containing selected panels from outside in; nested tab groups and native details ancestors must cooperate with the existing Accordion reveal behavior. Do not invoke native click() during reveal or generate extra fragment events.

Use a private shared reveal coordinator for Tabs, Accordion and form-summary destinations; it owns ancestor order and at most one pending scroll for a target. This is an implementation requirement, not a new public UI method/event. A fragment reveal never explicitly focuses its target; preserve browser navigation and apply the focus-safety rule if old content must close. After layout, scroll the resolved target into view only once, without smooth motion, after rechecking connection, current hash, ownership and visibility. Cancel queued scrolls on newer navigation, pointer/key interaction, teardown or adoption. Reconciliation does not replay the initial fragment. Conflicting ancestor states that prevent reveal leave the readable baseline rather than claiming a hidden destination is reachable.

### Forms and error recovery

Never clone, reparent, disable or reset controls to hide a panel. Names, labels, external form association, validation eligibility, native submitters, FormData, reset and autofill remain native. Reset resets values, not tab selection. Hidden panels still contain successful controls and can contain invalid controls; tabs confer no permission boundary.

Before the existing error-summary link focuses a field, the implementation must extend its native-details reveal path to synchronously reveal enclosing enhanced Tabs panels from outside in. The summary remains the owner of final field focus and scrolling. Tabs must neither focus a tab nor schedule a competing scroll during this path; reveal first so the focus-safety fallback is unnecessary. A generic focusin handler is insufficient because hidden fields cannot receive focus. This integration must also work through nested Tabs/Accordion and external form ownership. Preserve the original form-only entry: when no Tabs coordinator is present, its existing native-details behavior stays unchanged.

For native validation without ui-form, capture invalid events belonging to a control within owned panels and synchronously reveal its ancestor panels before the browser attempts focus. Do not cancel invalid, call reportValidity recursively or move focus; the form/browser owns reporting. Multiple invalid controls may occur in different panels: coalesce the synchronous validation task around its first invalid destination so subsequent events do not hide the field being reported. The first-destination lock lasts until the next microtask; applications issuing multiple validations in one synchronous task must coordinate their reporting. This ordering requires real browser tests; if reliable reveal cannot be delivered, form-containing groups must stay as readable sections for that configuration. Applications must reveal a destination before programmatically focusing hidden fields. Essential required questions are better presented visibly without tabs.

## Lifecycle and failure

Use the existing shared entry and explicit scoped lifecycle. Static ui-tabs groups initialize after parsing; late groups and late/replaced pairs require explicit `UI.enhance(group)`. An ownership observer watches only relevant structure, href/ID, configuration, naming and conflicting owned-state changes. It releases invalidated ownership and stale hidden/role state; it does not silently initialize late children or react to arbitrary panel text. Coalesce observation and ignore owned writes. Missing capabilities leave the baseline untouched.

Before ownership, validate the complete structure, unique same-document IDs, list name and absence of conflicting authored compound state. Reject authored roles/tabindex/selection/control ARIA on the list or tabs, and authored panel roles, tabindex, hidden (including until-found), inert or aria-hidden. Allow baseline panel aria-labelledby and content-level ARIA, preserving unrelated relationships. A hidden/inert wrapper or ancestor postpones enhancement; retry explicitly when available. An empty/incomplete/ambiguous wrapper has no readiness, roles or script-hidden panels. One invalid group must not block independent valid groups.

Reconcile a still-valid group without duplicate listeners or focus movement. Retain selection by the surviving paired elements. If only an inactive pair is removed, keep selection. If the selected pair is removed and valid pairs remain, select the following survivor at its old index, otherwise the preceding survivor. Recover focus to that tab only when focus was lost from the removed owned tab/panel and has not moved elsewhere. The observer must track prior focus ownership; document.body alone is not evidence. Deliberate task removal remains application-owned: move focus to a survivor before mutation. Removing the final pair releases enhancement and requires the application to choose an outside task destination. Unsupported temporary/mismatched structure releases to baseline; re-enhance after completing the edit. Never use stale pair references to infer a replacement.

Nested groups own only their direct list and panels. Outer groups ignore inner keys and selection events. Teardown runs deepest first; shared ancestor reveal coordinates both without duplicate focus/scroll actions. Native overlays inside panels keep their own dismissal/focus ownership. Before selecting away from a panel with an open modal or active top-layer task, applications must close it and settle focus. If an open dialog/popover remains in a panel that would be hidden, withhold that switch; do not hide an active overlay or invent a second dismissal stack. Form-summary/fragment reveal that conflicts with such a task must not steal modal focus; defer to the application and retain the existing visible selection.

Destroy/disconnect removes listeners and observers, releases shared document subscriptions when unused, cancels frames/scrolls, invalidates pending callbacks and releases references. Restore only owned roles, selection/control attributes, panel naming, tabindex, hidden state, inactive marker and readiness whose current values still match UI's last writes. Preserve later application writes, authored IDs/hrefs, content, answers, native state and current focus. Concurrent writes to owned presentation attributes invalidate enhancement and require explicit reconciliation; matching strings alone cannot prove ownership. No selection is persisted across full teardown. Reinserted/adopted nodes require explicit enhance in their current runtime/document and fresh validation.

No-script, script-load failure, unsupported APIs and initialization exceptions retain links plus all authored readable sections. CSS must never hide inactive panels or apply tab-only layout merely because ui-tabs exists. Only ready enhanced structure gets compound styling. Print must expose all panels using print CSS scoped to enhancement-owned inactive state, retain headings and suppress tab-only selected decoration; authored content hiding is preserved. Browser find-in-page cannot be promised to search/reveal script-hidden panels in this first slice; the integration guide must state that limit and recommend visible sections for searchable reference content. No automatic hide-until-found support is implied.

## Examples and evidence

The [focused harness](../../tests/tabs.html) and [runnable recipes](../tabs.md) cover an initial subset of this matrix. [ACCESSIBILITY.md](../../ACCESSIBILITY.md) records actual checks and remaining platform/assistive-technology work. This matrix defines acceptance requirements; it does not claim every case passed.

| Area | Required fixtures and assertions |
| --- | --- |
| Baseline and parsing | Scripts blocked/failed, empty/one pair, malformed fragments, missing/duplicate IDs, mismatched order/count, extra children, authored hiding/roles/conflicting state, missing name/capabilities and independent invalid/valid groups. No baseline content hidden by CSS. |
| Keys and selection | Real Enter/Space/click/touch, manual focus versus selection, automatic eager content, Tab/Shift+Tab reentry, wrapping/Home/End, both orientations/directions, runtime dir change, ignored modifiers/composition/prevented events, modified/middle click, content controls, nested ownership, no positive tabindex and distinct focus/selection markers. |
| Names and focus | Tablist name, complete unique controls/labelledby relationships, exactly one selected tab/visible panel, hidden-content exclusion, panel focus stop, focus-safe initialization/selection, externally moved focus, programmatic click/focus and selection event count/source/order. Verify actual screen-reader output. |
| Fragments and forms | Initial panel/descendant hash, Back/Forward, ordinary external link, nested Tabs/details/Accordion reveal, malformed/text fragments, one final scroll, interruption/stale work, retained input values, FormData/submitters/reset/cancelled reset/autofill, native invalid event ordering, error-summary focus, external form controls and original form-only compatibility. |
| Lifecycle | Repeated enhance/destroy, late/replaced pair, selected/focused removal and replacement, emptying, invalid transient edits, config/ID/href changes, authored writes during enhancement, nested/scoped teardown, disconnect/reinsert/adoption, shared subscriptions/resource counts and no stale callbacks. |
| Application content | Long/localized labels, empty panel, error/loading/retry/success, disabled/read-only controls, superseded requests and teardown during loading; open native overlay blocks hiding until application closes it. No fake disabled tab API. |
| Presentation | Both brands/modes, density nesting, forced colors, RTL, reduced motion, long labels wrapping without a horizontal page scroll, 320px reflow, actual text spacing/resize and 400% zoom, print of every panel, no-script presentation and documented find-in-page limit. |

Implement focused browser checks and wire them into the existing accessibility harness alongside documentation checks. Record dates, versions and actual results in [ACCESSIBILITY.md](../../ACCESSIBILITY.md), including VoiceOver/Safari, NVDA/Firefox or Chrome, other desktop browsers and mobile/touch. Review axe findings and incomplete results without exclusions; manual keyboard/focus, print, platform validation and disabled-user task testing remain separate requirements. Specification review and passing automated checks close no conformance or stable-release gate.

## Completion

The wrapper, shared-entry behavior, minimal CSS, recipes and focused harness ship experimentally. Current reference, catalogue, generated output and dated evidence must stay aligned. Applications opt in from readable linked sections. Stable maturity requires the [component release gate](../../ROADMAP.md#release-gate-for-every-component).
