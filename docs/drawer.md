# Modal Drawer

Experimental Phase 2 component. `ui-drawer` enhances a native dialog at a logical viewport edge. It is modal only: use `ui-sidebar` or an inline section when the page must remain interactive. Native dialog owns modality, Escape and form semantics; UI owns setup, edge geometry, task focus and readable recovery. See the [specification](specs/drawer.md) for the full acceptance contract.

## Markup and files

Load `css/ui.css` and optional `js/ui.js` once. The wrapper opts in by element name and adds no registration. Do not put `data-ui="dialog"` on its dialog or attach another overlay controller.

```html
<link rel="stylesheet" href="css/ui.css">
<script src="js/ui.js" defer></script>
<h2 id="visit-task" tabindex="-1">Plan your visit</h2>
<ui-drawer>
  <button type="button" data-ui-open="visit-briefing" hidden>Read briefing</button>
  <dialog id="visit-briefing" open aria-labelledby="visit-title"
    data-ui-return-focus="visit-task">
    <h3 id="visit-title" tabindex="-1" data-ui-focus>Visit briefing</h3>
    <p>Meet at the visitor centre at 09:30.</p>
    <button type="button" data-ui-close hidden>Close briefing</button>
  </dialog>
</ui-drawer>
```

One direct dialog and matching direct opening buttons are required. Give the dialog a unique ID, a name and exactly one usable initial focus target. Close buttons must be inside it, either type=button with data-ui-close or submit buttons in a separate method=dialog form. Keep opening/closing buttons hidden until setup; keep the dialog authored open as the single-copy inline fallback. Use no autofocus on the fallback. Nested forms and nested Drawers are invalid.

## Placement and styling

Set `data-placement="inline-start|inline-end|block-start|block-end"` on the wrapper; omitted means inline-end. Inline edges follow dir; block edges are top/bottom in the supported horizontal-tb writing mode. Invalid/empty placement or unsupported writing mode retains inline content. Direction changes update placement without reopening or moving focus.

The local `--ui-drawer-size` defaults to 24rem along the placement axis; `--ui-drawer-padding` defaults to `var(--ui-space-5)`. Each wrapper resets these defaults. Semantic colors and shared focus tokens inherit. The dialog is bounded by available viewport space and scrolls as one surface, with safe-area padding and no opening/closing animation. Long content has close controls at both ends. Applications must verify geometry overrides, mobile keyboards, real zoom and target sizes.

## Focus, dismissal and native state

Installation closes the inline dialog only after handlers and recovery are ready. It never moves focus on load; if the fallback already holds focus, enhancement defers until an explicit enhance call after focus leaves. Missing native dialog beforetoggle support, modal methods, MutationObserver or AbortController leaves readable content and hidden actions.

Opening records the actual invoker, clears stale returnValue, calls showModal and focuses data-ui-focus at the start of the scrolling surface. Repeated opening while modal preserves focus/scroll. Direct native showModal calls use the same initialization after the opening operation, through a guarded microtask; direct invalid calls keep native exceptions. UI opening exceptions/no-op calls return to inline content. Native cancelled opening remains retryable.

Escape uses native cancel; explicit close uses native close or method=dialog submission. Backdrop clicks do not dismiss. There is no extra key handler, focus trap, wrapper role, aria-expanded or custom event. Read dialog.open/:modal rather than writing a wrapper open state. Use close(), never remove open or call show() to switch modality.

Native focus return takes priority. If focus would be stranded, UI tries the available invoker and data-ui-return-focus survivor; otherwise it restores inline content and focuses the initial target. Intentional application focus movement is preserved. Invoker removal does not interrupt an open task. Applications choose the next focus destination before deliberately removing a whole task.

## Forms and task feedback

The [visit-note example](../examples/drawer.html) preserves native names/values, labels, validation, submitters and reset. ui-form summaries remain inside the modal. Closing does not submit, save or reset answers. Keep close forms separate from data forms. Use formnovalidate for native cancellation when needed.

The example simulates a pending preview, recoverable failure and successful retry; nothing is saved or sent while scripts run. Closing cancels its pending preview and preserves answers. Without script, its native GET destination is an unsaved example page. Applications own request cancellation, server validation and stale-response rejection. Loading feedback alone must not remove the only exit. See [form integration](forms.md).

## Lifecycle and composition

Use `UI.enhance(root)` after inserting or changing structure/configuration and `UI.destroy(root)` before replacement/removal. Valid refresh preserves open state, focus and scroll; narrow safety observation handles lost required structure, disconnect and adoption. Reconnection requires explicit enhance. Cleanup invalidates pending focus work, closes nested owned overlays inside out and restores owned authored states while preserving answers and later application writes. No generated IDs or reparenting are needed.

Native help/popovers and command menus can live inside the dialog subtree. Verify native innermost Escape order; the Drawer adds no parallel dismissal listener. Nested Drawers/dialog tasks and simultaneous modal tasks remain outside this first contract. Print preparation restores readable inline content and hides enhancement-only controls; after print, it resumes closed without opening the task.

## Verification and limits

Run [focused Drawer checks](../tests/drawer.html) or [the browser harness](../tests/accessibility.html). Fixtures cover native state and forms, lifecycle, fallback, focus recovery, four edges/RTL, nested help and narrow enlarged content. Real Escape/Tab, pointer/backdrop, touch, actual zoom, platform forced colors, print and screen-reader results require separate evidence in [ACCESSIBILITY.md](../ACCESSIBILITY.md). Experimental availability is not a stable release or accessibility certification.
