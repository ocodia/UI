# Native dialog recipe

## Standard shared setup

Load `js/ui.js` once and use the [shared enhancement markup](enhancement.md). Standard opening, focus, fallback and cleanup are library-owned; no application initialization script is required. The [single-copy example](previews/enhancement-1.html) keeps its content readable without JavaScript. `UI.enhance(root)` / `UI.destroy(root)` cover dynamic insertion and teardown.

```html
<script src="js/ui.js" defer></script>
```

The first interactive example below uses this shared path. The remaining material documents the lower-level adapter or earlier manual recipe for advanced integration and compatibility.

## Advanced manual integration

Phase 1 native recipe, with partial evidence; not a new custom element or a stable-release claim. Use a modal for a short task that needs the user's attention before they continue. Prefer an inline section, details or a separate page when blocking the current task adds no value.

The [working recipe](../examples/patterns.html#modal) uses `css/ui.css` and application code in [recipes.js](../examples/recipes.js). It needs no component registration. The [HTML dialog contract](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element) supplies modal behavior; [APG's dialog guidance](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) informs content and focus decisions. Test the actual browser and assistive technology combination.

## Markup and enhancement

The recipe keeps equivalent information inline before enhancement. Its modal and opener start hidden so a failed or unavailable script leaves useful content. This also avoids exposing an unknown dialog element in an older browser.

```html
<link rel="stylesheet" href="../css/ui.css">
<!-- Application script installs the handlers described below before revealing the opener. -->
<section aria-labelledby="information-title">
  <h2 id="information-title" tabindex="-1">Project information</h2>
  <button id="open-information" type="button" hidden>Open project information</button>
  <section id="information-fallback" aria-labelledby="fallback-title">
    <h3 id="fallback-title" tabindex="-1">About this project</h3>
    <p>Your project answers stay on this page. Opening information sends nothing.</p>
  </section>
  <dialog id="information" aria-labelledby="dialog-title" hidden>
    <h2 id="dialog-title">About this project</h2>
    <p>Your project answers stay on this page. Opening information sends nothing.</p>
    <form method="dialog">
      <button type="submit" value="close" autofocus>Close information</button>
    </form>
  </dialog>
</section>
```

Use the implementation in `recipes.js` with its corresponding markup in `patterns.html`; the IDs above illustrate the structure. For a task with real data or actions, supply an inline form or a working page link as fallback rather than copying only explanatory text.

Installation checks the authored nodes and both `showModal` and `close` methods. It attaches handlers, reveals the closed dialog, hides the inline duplicate, then reveals the opener. It does not move focus. The script is a page recipe initialized once after parsing, not an autoloader for arbitrary dialogs.

## Interaction and ownership

| Operation | Recipe behavior |
| --- | --- |
| Open | Focus the activated button explicitly, clear the old `returnValue`, call `showModal()`. Repeated activation while open does nothing. |
| Initial focus | The close button has `autofocus` for this short information task. |
| Keyboard | Native button activation; Native sequential focus through modal controls; browser chrome remains available. Escape requests cancellation. No application key handler or focus trap. |
| Dismiss | Explicit `method="dialog"` close button or native Escape. No backdrop-click listener and no opt-in to light dismissal. |
| Close result | The button produces `returnValue="close"`. Every opening clears the previous result, so Escape/programmatic close cannot reuse it. |
| Return focus | Native restoration to the explicitly focused opener. If it has been removed, hidden or disabled, the close handler focuses the surviving section heading. |
| Open failure | If `showModal()` throws or returns without opening, hide the unusable action/dialog, reveal the inline information and focus its heading. |

Give the dialog a visible title with `aria-labelledby`. Keep its content structure; this recipe has no blanket `aria-describedby`, duplicate `role="dialog"`, `aria-modal`, `aria-expanded` or live region. The browser owns modal state and background inertness. The close button is always available. This informational task has no disabled, read-only, invalid or busy state; those belong to controls and application work inside a task dialog.

Safari's keyboard preferences affect whether Tab includes buttons and links. Use Option+Tab to include them when full keyboard navigation is off; verify both directions without changing native key behavior. Chrome may move sequential focus to browser chrome at the end of the dialog; Shift+Tab returns to its last control. Background document content stays inert. This recipe preserves native browser focus behavior rather than installing a custom trap.

For long or structured content, choose an initial focus target near the beginning, such as a heading with `tabindex="-1"`, and test scrolling. Do not focus the dialog container. Keep a short, explicit close action reachable. UI bounds the dialog and permits internal scrolling; translated content, narrow screens, RTL and text resizing still need verification. Labels and content belong to the application and can be localized without parsing button text.

## Long briefing and scrolling

The [long survey briefing](previews/dialog-1.html) is a separate information recipe, authored in [recipes.json](recipes.json) and included in the live examples below and on the [dialog component page](components/dialog.html). Use the standalone preview for keyboard and actual browser-zoom checks; a modal inside a documentation iframe makes only that frame inert. Run the [focused checks](../tests/dialog.html) or the complete browser suite for repeatable geometry and recovery checks.

The heading uses `tabindex="-1" autofocus`, so native initial focus starts at the beginning of the structured content. It has no blanket description: headings and paragraphs remain individually readable. Two ordinary `method="dialog"` forms offer the same explicit close action before and after the six briefing sections. There is no sticky header, separate inner scroller, custom focus trap or extra keyboard handler. Native focus scrolling brings either close action into view, even when enlarged content pushes the first action below the heading.

The entire dialog uses the foundation's existing maximum width/height and `overflow: auto`. At narrow widths its content reflows while the dialog scrolls vertically. Do not set a fixed content height, hide overflow or shrink the text to fit. Keep the closing forms separate; never nest them in another form.

Each opening focuses the real opener, clears the previous result and calls `showModal()`. Immediately after a successful opening, the application sets `dialog.scrollTop = 0` while retaining the native heading focus. Resetting scroll on a closed dialog alone did not reliably remove its previous position in the tested narrow/enlarged case. A repeated activation while open does nothing, preserving the current reading position.

Both close actions return the value `close`; Escape remains uncancelled. Native focus returns to the opener. If that opener has been disabled, hidden or removed, the close listener focuses the surviving task heading. The equivalent six-section briefing stays inline if scripts or native modal methods are unavailable. An opening exception or a method that returns without opening reveals that fallback and focuses its heading. The recipe initializes once for the static page and owns no observers or timers; replacement markup and removal of an open modal remain application responsibilities.

## Forms and asynchronous tasks

The close form uses `method="dialog"`: it closes the modal without a network submission. Its result is a task outcome, not saved form data. It does not submit or reset the separate project form. Escape is dismissal, not an affirmative action; never infer confirmation from a stale `returnValue`.

Do not nest forms. Put task inputs in one ordinary form with real names, labels, validation and server submission, or use one dialog form for an entirely local task. In a form with required fields, provide a cancel button that can bypass validation using `formnovalidate` and an appropriate dialog closing action. Keep reset separate from close: closing does not reset answers. Applications own serialization, server rules and explicit save/abandon decisions. Follow [form integration](forms.md) when coordinating validation or async work.

The recipe leaves `cancel` uncancelled. A task that blocks dismissal during pending work needs a separately documented cancellation/recovery policy and an available exit; busy feedback alone does not cancel a request. Success or failure must not move focus to a background error summary while a modal remains open. Place task feedback within the dialog, or close before moving focus to a logical destination.

## Lifecycle and failure

The example owns only its own listeners, hidden states and focus fallback; it generates no IDs or widget roles. Missing dialog markup leaves the modal recipe unenhanced. Late markup is not observed. The same trigger/dialog nodes retain their listeners if detached and reinserted; replacing nodes requires application initialization and cleanup. There are no document listeners, observers or timers for this recipe.

Keep the section heading available for fallback focus. Before removing an open dialog or its whole section, application code must close it and choose a surviving focus destination; removal is not treated as a completed task. Nested modals and multiple dynamic triggers are outside this recipe. An application that introduces them must track the actual opener, scope events to the owning dialog and define the focus path between tasks.

Never simulate modality with `open`, `show()`, an ARIA role or manual background hiding when `showModal()` is unavailable. Leave a useful inline task or destination. Do not remove `open` to close a dialog; use `close()` so the browser performs its closing steps.

## Verification

[Browser checks](../tests/accessibility.html) cover actual modal state, initial focus, blocked background focus, close-form result without navigation, repeated open/close, cleared results, focus after disabled/hidden/removed triggers, reinsertion, no-script fallback, missing methods and thrown opening failures. The long-briefing suite also covers heading focus, equivalent inline content, both closing forms, viewport bounds, vertical scrolling, focus scrolling to either close action, reopening at the start, missing-trigger recovery and unavailable/throwing/no-op opening methods. Its display matrix includes normal/enlarged text, default/forest, light/dark, LTR/RTL and narrow/short frames. A synthetic `cancel` assertion checks only that the recipe does not prevent cancellation; it does not prove Escape behavior.

Manual checks: open with keyboard and pointer, traverse forward/backward, activate the close button, press Escape, click the backdrop, check return focus and background inertness. Repeat with long content, both brands/light-dark modes, 320px LTR/RTL, zoom/text spacing, forced colors and touch. Verify title announcements and task completion with VoiceOver/Safari and NVDA/Firefox or Chrome. Record versions, dates and unresolved findings in [ACCESSIBILITY.md](../ACCESSIBILITY.md). Automated checks are partial evidence.
