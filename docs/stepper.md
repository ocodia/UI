# Stepper / Step

**Experimental CSS-only pattern.** `ui-steps` composes a native ordered list of task stages. Each Step is a native `li`, with a visible label and status. Real links revisit reachable stages; unavailable stages stay readable text. The [specification](specs/stepper.md) defines ownership and acceptance work; [focused checks](../tests/stepper.html) exercise native navigation and presentation. See [ACCESSIBILITY.md](../ACCESSIBILITY.md) for actual evidence and remaining platform work.

## Start with an ordered list

Only `css/ui.css` is required. Use one direct `ol` inside the wrapper and direct `li` steps. A named surrounding native nav is useful when there are actual links; a text-only progress list can use a headed section instead. Author exactly one `aria-current="step"` on the current `li` during an active task. Do not repeat it on the child link.

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

Replace illustrative URLs with routes that return the corresponding task. `ui-steps` adds layout and current-step presentation; the native list provides order/numbers and optional links provide navigation. The documentation preview host loads shared scripts for resizing/themes; copyable Stepper sources need CSS only.

## Current, completed, error and unavailable stages

Current location and outcome are separate. Mark the current li with `aria-current="step"` and include visible wording such as Current step. Completed stages have visible Completed text. A prior stage may have Needs attention: add a project title while a later stage is current; provide a real return link when reachable. Actual form errors belong to fields and the existing error summary, not aria-invalid on a step. Do not rely on color, checkmarks, generated content or inaccessible tooltips to convey status.

Unavailable stages are plain text with a useful explanation. Do not add a disabled anchor, href="#", tabindex, button role or aria-disabled to simulate gating. A completed task has no current marker and a persistent confirmation message outside the list. For a single-stage task, a heading alone is often sufficient; one current item is supported. For zero stages, omit the wrapper and explain how to start.

Applications render all statuses and localize their wording. UI does not parse text, infer completion, repair duplicate current markers or hide future items. Native ol start and li value retain their meaning. Direct-child styles keep ordinary nested lists independent of their containing step.

## Keyboard, direction and presentation

Tab/Shift+Tab reaches only real links; plain labels are not focus stops. Enter, pointer and touch follow native destinations. Space/arrows/Home/End/Escape keep browser behavior. Modified activation, middle-click, context menus, copied URLs and browser history stay native. This is not a tablist, toolbar, menu or progressbar, and it has no roving focus or live region.

The layout uses a content-driven grid that becomes one column at narrow widths or enlarged text. Native numbering and DOM order stay unchanged in LTR/RTL; labels/statuses wrap without clipping. Existing reference spacing, border/surface, selected and shared focus tokens provide presentation; no orientation, size, density or new public geometry API is added. Direct step links have minimum 2.75rem targets. Current location has a persistent border, background and label weight; keyboard focus on a link keeps the shared distinct focus indicator, including forced colors.

## Application progression and forms

A progress link navigates; it does not validate, save or submit answers. Applications own reachable stages, permissions, persistence, validation and task completion. Use native submit controls and server validation for a linear form. A future stage shown as text is not an authorization boundary. The runnable examples below are labelled static snapshots: they demonstrate stage presentation and links between distinct documents; they do not save answers or implement a wizard.

Native document navigation owns arrival focus. A real task-heading fragment with tabindex=-1 provides a meaningful destination, as in the examples. UI calls no focus or scroll methods. For an application-rendered transition, validate/save first, update the task and list coherently, then focus the surviving task heading after a user-requested success. Keep the stage and use the form error-summary path when validation fails. Background updates should preserve useful focus.

Loading/save/error/retry feedback belongs to one application announcement owner outside the list. Preserve answers and current stage on failure. Abort superseded requests and reject stale responses after navigation/removal; applications choose a surviving focus destination before removing a task. Native form labels, names, values, external ownership, FormData, submitters, validity, reset and autofill stay unchanged. Reset resets answers, not the current-stage marker.

## Lifecycle and fallback

`UI.enhance` and `UI.destroy` leave this CSS-only pattern unchanged. Late stages, replacement, detach/reconnect, adoption and nested tasks use native HTML/CSS. No observers, listeners, pending work, generated nodes or IDs are acquired. Invalid/empty markup gains no automatic roles or current state. Do not put a custom wrapper between ol and li.

Without JavaScript, real links and text work. Without CSS, the ordered list and task remain readable. Print retains authored order and state text; actual print/platform checks remain in the release gate.
