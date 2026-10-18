# Stepper / Step specification

## Identity and purpose

**Status: experimental implementation. Phase: 2. Owner: UI foundation; workflow rules and data belong to the application.** This family describes the ordered stages of a task. Follow the [shared lifecycle and ownership contract](../lifecycle.md). Prefer a heading and ordinary form for a short single-stage task. Use Tabs for switching related views and Pagination for pages of results.

`ui-steps` is a CSS-only boundary around one native ordered list. Each Step is a native `li`. The wrapper scopes responsive layout and current-step presentation. Native list markers supply numbers; text supplies completed/error/unavailable status. A surrounding named `nav` is optional when the list contains actual navigation links; a noninteractive progress list does not need a navigation landmark.

## Minimal markup

Only `css/ui.css` is required. Application routes below are illustrative and must return the corresponding task state. Content remains readable without scripts or CSS.

```html
<link rel="stylesheet" href="css/ui.css">
<nav aria-label="Application progress">
  <ui-steps>
    <ol role="list">
      <li><a href="details.html#task">Project details</a><small>Completed</small></li>
      <li aria-current="step"><strong>Review</strong><small>Current step</small></li>
      <li><span>Confirmation</span><small>Available after review</small></li>
    </ol>
  </ui-steps>
</nav>
<h2 id="task" tabindex="-1">Review your application</h2>
```

Require a direct `ol` with direct `li` children; never put custom wrappers between the list and its items. A current task has exactly one `li[aria-current="step"]`. Current/completed/future are separate states: a completed workflow has no current marker and a clear completion message outside the list. Keep a visible label on every step. The optional native nav supplies the accessible name; otherwise name the ordered list with aria-label/aria-labelledby or put it in a headed section. Authored role=list retains explicit list grouping across presentation changes. Numbers are native markers, not generated content or duplicated label text.

## Public contract

| Surface | Decision |
| --- | --- |
| ui-steps | CSS-only block scope around one native ol. |
| Step | Native li, in task order. No ui-step placeholder or custom item role. |
| aria-current="step" | Authored on the current li, not also on its child link. UI styles it but does not infer, validate, rewrite or move it. One per active task, none after completion. |
| Completed / error status | Visible authored text, such as Completed or Needs attention: add a project title. No data-state/variant API, checkmark-only state, CSS-generated status or aria-invalid on a step. Actual invalid fields keep native/form-owned error semantics. |
| Reachable stages | Real anchors with useful URLs and optional task-heading fragments. Current stage may also be a real link if the task benefits. |
| Unavailable stages | Plain visible text with an explanation. No href=#, disabled anchor, aria-disabled, tabindex or fake permission boundary. |
| CSS variables | No new public variables. Existing reference spacing, border, surface, selected and focus tokens; logical layout and content-driven wrapping. Direct step anchors have minimum 2.75rem targets in each dimension. No direction, orientation, size or density API. |
| Native events / forms | Native navigation and control events only. No custom step/change/before event, fake input/change, form value, serialization, validation or reset policy. |

Native current location is not selected/pressed state or percent progress. Complete/error text is independent of current location: a reachable prior stage can need attention while a later stage is current. Include error meaning and recovery in text. Applications localize all labels and statuses; CSS never parses text to determine state or supplies translations.

## Interaction and accessibility

This is an ordered progress list with optional native links, not a composite widget. Use the [navigation landmark guidance](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html) when stages are links. Do not add tablist, menu, toolbar, progressbar or button roles to the wrapper/list/items. The native list supplies count/order; visible status supplies outcome. Do not add a live region merely to render the list.

Tab/Shift+Tab visits reachable links and leaves freely; plain current/future labels are not focus stops. Enter/pointer/touch follows real URLs. Space/arrows/Home/End/Escape remain browser-owned. Native modified activation, middle-click, context menus, copied URLs, Back/Forward and reload stay available. There is no roving focus, keyboard trap, custom dismissal or automatic progression. Focus styling is distinct from the current li's persistent border/weight/background; forced colors preserves the current marker and shared focus treatment.

The grid fits available space and falls to one column as content grows or the viewport narrows. Preserve DOM/reading order in LTR and RTL. Long/localized text wraps with no clipping, hidden future labels or fixed height. List numbering is authored/native: ol start and li value retain HTML meaning. No CSS counter reconstructs numbers. Nested task lists remain independent native content; direct-child selectors prevent a parent from turning nested ordinary list items into steps. Do not nest active workflows without clear separate names.

### Workflow, forms and focus

Applications own reachable stages, validation, URLs, permissions, persisted answers and task completion. A link can revisit a completed stage; it cannot submit a form or promise that a future task is authorized. Validation gates should use real native submit controls in the application form. Never fake a working wizard with a link that silently bypasses required fields or loses answers. Server-side checks remain necessary even when future steps are plain text.

For document navigation, a real task-heading fragment with tabindex=-1 gives the browser a meaningful arrival target. Without it, document/history focus remains platform-owned. UI calls no focus/scroll method. For application-rendered transitions, validate and save first, update the task body and step list coherently, then focus the surviving task heading after a user-requested success. On validation failure, keep the current stage and use existing form/error-summary behavior; only mark field controls invalid. Background updates preserve useful focus.

Async save/loading, retry and completion announcements belong to one application feedback owner outside the list. Preserve current task/answers on failure; abort superseded requests and reject stale responses after navigation/removal. Move focus to a logical survivor before removing a focused link or whole task. A busy form does not disable progress text or create a library busy state. Form labels/names/values, external association, FormData, submitter, validity, reset and autofill stay native; reset changes answers, not the current-step marker.

## Lifecycle and failure

No lifecycle state, observer, listener, mutation, generated ID, timer, routing or transport is acquired. UI.enhance/UI.destroy leave this pattern alone. Late items, replacement, disconnect/reconnect, adoption and nested tasks are native/application-owned.

Without JavaScript, readable status and real links remain available. Without CSS, the native numbered list and task still work. Empty/invalid markup or duplicate current markers are authored errors; UI invents no semantics and silently repairs nothing. For zero stages, omit the wrapper and explain the task state. A single stage may be omitted or shown as one current item; completion has no current marker. Print preserves authored order and status text; verify actual target output before claiming print readiness.

## Examples and evidence

Ship static snapshots for first/middle stage, recoverable prior-stage error, all-completed success, long/localized labels and single/zero-stage tasks. Reachable example URLs must lead to separate repository documents; label snapshots honestly and do not imply saved data or automatic validation/progression. Each page has a named task heading and enough distinct content to verify navigation.

Focused browser checks cover names/order/current uniqueness, links versus plain labels, explicit status/error text, real destination/focus with scripts enabled and blocked, no custom keyboard/events/registration, preserved form values/reset, dynamic replacement/adoption, native numbering and nested-list ownership. Check current/focus distinction, two brands/modes, RTL, 320px enlarged text/spacing and link targets. Documentation checks cover guide/specification/component pages, CSS-only source drawers and no-script reflow. Record dated browser/manual results in [ACCESSIBILITY.md](../../ACCESSIBILITY.md); browser/assistive-technology/touch, actual zoom, forced colors, print and disabled-user testing remain release work.

## Completion

The CSS-only wrapper, static state snapshots, guide and focused harness ship experimentally. Keep CSS, current reference, both catalogue entries, examples, roadmap and generated output aligned. Keep the two existing registrations and library JavaScript unchanged. Foundation availability can carry experimental maturity while platform evidence is gathered. Stable maturity requires the [component release gate](../../ROADMAP.md#release-gate-for-every-component). Existing native lists/links remain compatible; applications add only the composition wrapper and their authored current/status markup.
