# Tabs

**Experimental.** Tabs enhance related linked sections into one selected panel. Use headings and visible sections when readers need comparison, essential instructions, search across all content or a sequential form. For site navigation, keep ordinary links and real page URLs. The [family specification](specs/tabs.md) records ownership and acceptance work; [focused checks](../tests/tabs.html) exercise the implementation. Remaining platform evidence is in [ACCESSIBILITY.md](../ACCESSIBILITY.md).

## Start with linked sections

Load `css/ui.css` and `js/ui.js`. Author a `ui-tabs` with one direct native `nav`, followed by matching direct sections. Links and panels need unique authored IDs; each literal fragment href points to one panel in the same order. Give the list a visible-text `aria-labelledby` or an `aria-label`. Keep all panels readable and omit compound roles, tabindex and hidden state: UI installs behavior before adding them.

```html
<link rel="stylesheet" href="css/ui.css">
<script src="js/ui.js" defer></script>

<ui-tabs>
  <nav aria-label="Visit information">
    <a id="arrival-tab" href="#arrival-panel">Getting here</a>
    <a id="equipment-tab" href="#equipment-panel">What to bring</a>
  </nav>
  <section id="arrival-panel">
    <h2>Getting here</h2><p>Meet at the visitor centre at 09:30.</p>
  </section>
  <section id="equipment-panel">
    <h2>What to bring</h2><p>Bring waterproof clothing and water.</p>
  </section>
</ui-tabs>
```

The element name opts into enhancement. Use ordinary linked sections without a `ui-tabs` wrapper when no Tabs behavior is wanted. The named native `nav` supplies section navigation before enhancement. UI overrides its navigation role with `role="tablist"` only after setup succeeds, then restores the native navigation landmark on teardown. Original form-only and Popup entries cannot initialize Tabs. Failed scripts, incomplete/ambiguous markup and missing capabilities retain native linked sections. CSS never hides baseline content. Keep labels free of interactive children; put nested groups inside panels. UI generates no IDs, moves no content and adds no live region.

## Activation and focus

Manual activation is the default: Left/Right moves focus, Home/End reaches the first/last tab, and Enter/Space activates. Arrows wrap; horizontal arrows reverse in RTL. Tab leaves the list for the selected panel and then its native content. Shift+Tab leaves freely. Focus and selection have separate visible indicators. Only one tab is a sequential focus stop; after focus leaves the list, the selected tab becomes its next entry point.

Use `data-orientation="vertical"` for a stacked list with Up/Down navigation. Use `data-activation="automatic"` only when every panel is already available without a wait; focus then selects immediately. Missing, empty and unknown values use horizontal/manual defaults. Changing direction does not reset selection. Other-axis arrows, Escape, Delete, modified/composing/prevented keys and content-field keys remain native. There is no tab deletion, disabled/read-only tab mode, typeahead or animation.

Pointer/touch activation selects and focuses the tab. Native `anchor.click()` selects programmatically without moving focus that can remain visible. A switch that would hide focused panel content first focuses the destination tab. Installation/reconciliation preserve visible focus; initial selection prefers the panel containing focus, then the current fragment, then the first pair. An open dialog/popover blocks switching away from its panel: applications close that task and settle focus first.

## Selection events and application work

`ui-select` fires on the wrapper after an actual post-install selection change. It bubbles, is composed and is not cancelable. Its detail contains `tab`, `panel`, `previousTab`, `previousPanel` (the actual DOM nodes) and `source`: `activation`, `fragment`, `reveal` or `reconcile`. Check `event.target` when listening around nested groups. Initialization, unchanged selection and ordinary refresh emit nothing. No synthetic native `input` or `change` is emitted.

```js
const group = document.querySelector('ui-tabs');
group.addEventListener('ui-select', event => {
  if (event.target !== group) return;
  console.log(event.detail.panel.id, event.detail.source);
});
// Once ready, select an existing pair without mirroring selection attributes.
group.querySelector('a[href="#equipment-panel"]').click();
```

No Tabs-specific methods, properties, selection attribute or readiness promise exists. Applications own remote requests, permissions, persistence and routing. For slow content, use manual activation, leave named loading/error/retry feedback in its selected panel, and guard stale responses after replacement or teardown. Automatic focus must not start network requests. Content controls retain their native disabled/read-only state; no group busy/disabled switch is provided.

## Fragments and forms

Ordinary tab activation changes selection without modifying the URL/history. Copied fragment links, modified/middle clicks and context-menu navigation stay native. Initial fragments and hash changes, including Back/Forward, reveal containing Tabs panels and native disclosures from outside in. One shared coordinator handles Accordion/Tabs and schedules at most one final scroll, cancelled by newer navigation, user input or teardown. It does not explicitly focus the fragment target; focus recovery applies if old content would be hidden. Missing, ambiguous or malformed IDs, exposed text directives and authored hiding remain browser/application-owned. A browser may strip text directives before exposing its ordinary hash.

With the combined entry, error-summary links reveal enclosing panels/disclosures synchronously before focusing the field. The summary owns final focus and scrolling. Native validation outside `ui-form` reveals the first invalid control's panel during each synchronous validation task; subsequent invalid events in that task do not hide that destination. Applications must activate the paired tabs of hidden ancestors before directly calling focus. Native invalid events share a first-destination lock until the next microtask; coordinate multiple validations issued within one synchronous task. Required questions are often clearer in visible sections. Actual native reporting, autofill and assistive-technology behavior still require platform verification.

Closing a panel never disables, resets, clones or reparents fields. Native labels, names, external form association, FormData, submitters and validation eligibility remain intact. Reset resets answers, not selection. Hidden panels can still contain successful and invalid controls; they are not a permission boundary. The original form-only entry retains its existing native-details reveal behavior.

## Lifecycle and cleanup

New groups and late/replaced pairs require `UI.enhance(group)` after the application update. Repeated calls preserve selection/focus and install no duplicate handlers. Configure relationships and modes before enhancement. UI owns roles, selection/control relationships, panel naming/tabindex/hidden state, the internal `data-ui-tabs-inactive` marker and shared `data-ui-ready`. Do not write these while enhanced; use native anchor activation. Later application attribute writes are preserved when ownership is released.

Invalidating edits release stale roles/hiding to the readable baseline. A complete atomic removal of paired items can reconcile the survivors automatically: retain selection if possible, otherwise use the following pair at the old index or the preceding last pair. Recover focus only when tracked focus was lost with the removed pair and has not moved elsewhere. Applications choose focus before deliberate task removal. Emptying a group leaves baseline content and needs an application-owned outside destination.

`UI.destroy(group)` releases nested patterns deepest first, restores owned presentation and authored panel naming, cancels pending work, and preserves answers/current focus. No selection persists across full teardown. Detached/adopted groups release resources; reinsertion needs explicit enhance in the current document. Unknown/invalid structure never gains partial roles. See the [shared lifecycle](lifecycle.md) and [enhancement guide](enhancement.md).

## Presentation and limits

Tabs use existing spacing, border, surface, selected and focus tokens, with wrapping labels, no fixed panel heights and no new public variables. They inherit brands/modes and shared forced-colors focus styling. Vertical orientation stacks the list above the content; it does not promise a side rail. Print CSS shows all UI-hidden panels and omits the enhanced tab list while preserving authored hiding. Native disclosure print behavior still applies when Tabs is nested inside closed details. Verify print output in the target browser.

Browser find-in-page is not guaranteed to find or reveal inactive panels. Use visible sections for searchable reference content. Vertical writing modes, closable/reorderable tabs, cross-page routing, lazy loaders and stable-release accessibility claims are outside this experimental slice. The [release gate](../ROADMAP.md#release-gate-for-every-component) remains open.
