# Native popover recipe

Phase 1 native recipe with partial evidence. Native `popover="auto"` presents optional information while the surrounding page remains available. Use a visible label and concise persistent instructions beside the task. The help in these examples neither saves answers nor changes project access.

The [short help](previews/popover-0.html) and [long help](previews/popover-1.html) share the same page enhancement in [recipes.json](recipes.json). The browser owns toggle state, sequential keyboard navigation, Escape and light dismissal. There is no registered popover element; the library behavior still registers only ui-form and ui-error-summary. Read the [current API](reference.md) for those actual entry points.

## Markup and fallback

Each example starts with a hidden native opener, hidden popover and a complete visible inline copy of its help. The background fields have visible labels and persistent guidance. The inline copy includes the same headings, paragraphs and guide destination as the popover.

```html
<button id="help-open" type="button" popovertarget="project-help" hidden>
  Open project help
</button>
<div id="help-inline">
  <h3>Choosing a project title</h3>
  <p>Choose a short, specific title that your team can recognise.</p>
</div>
<div id="project-help" popover="auto" hidden>
  <button type="button" popovertarget="project-help" popovertargetaction="hide">
    Close project help
  </button>
  <h3>Choosing a project title</h3>
  <p>Choose a short, specific title that your team can recognise.</p>
</div>
```

The complete runnable sources appear in the examples below. Use their corresponding script with the authored IDs. The page script checks native show/hide methods, the popover mode, declarative invoker support, and actual opener/closer target relationships before changing visibility. An unsupported or incomplete structure stays inline, with no exposed unusable action. No script is needed to read that fallback or edit the fields.

After validating structure, the script installs its one opener-focus listener, exposes the closed popover, hides the inline duplicate and reveals the opener. Installation does not open help or move focus. Native declarative invokers can work without application JavaScript in supporting browsers; these examples deliberately retain the inline branch until their capability/relationship checks run. They do not add a polyfill.

## Interaction and focus ownership

| Operation | Recipe behavior |
| --- | --- |
| Open / toggle | Native button with popovertarget; its default action toggles the auto popover. The script focuses the activated opener consistently for pointer, keyboard and programmatic activation. |
| Initial focus | Remains on the opener. There is no autofocus content or forced move into the help. |
| Tab / Shift+Tab | Native traversal through the close actions, guide link and background fields. Background content remains available; no application focus trap or roving tabindex is installed. |
| Explicit close | Native popovertargetaction="hide" buttons at both ends. With focus inside the help, the tested browsers restore the opener. Background answers remain unchanged. |
| Escape / light dismissal | Native auto-popover behavior. Actual keyboard and outside pointer behavior is recorded in the dated evidence, separately from DOM assertions. |
| Another auto popover | Native auto-popover ownership dismisses the existing help when an independent auto popover opens. Nested popovers need their own ownership specification. |
| Disabled opener | Native disabled buttons do not activate. There is no read-only or field-invalid state on the popover container. |

The content is ordinary supplemental information. It supplies meaningful headings and real links; no menu/dialog roles, aria-modal, duplicate aria-expanded or live announcements are added. The native invoker relationship is the browser's source of disclosure semantics. Choosing richer task semantics requires the complete corresponding interaction contract.

Programmatically focusing a background field leaves help open, allowing continued editing. Escape from a focused background field closes help while preserving that destination in the tested browsers. Outside pointer activation dismisses it while focusing the selected field; do not force focus back to the opener after a user chooses a new destination. Safari keyboard preferences can require Option+Tab to reach buttons and links. Retain native browser navigation and test the actual platform settings.

## Long content and layout

The long example uses the foundation's existing popover geometry: a maximum width of 34rem, viewport-relative width/height bounds, native centering and one vertical scrolling surface. It keeps a close action at both ends. Native focus scrolling makes either close action reachable with enlarged text and in a short viewport. Persistent instructions and field labels stay outside the help.

The recipe does not reset reading position, scroll-lock the background or change any form value. Keep content shorter when possible. Essential instructions belong beside the task, and an ordinary page or disclosure may suit a long reading task better. Phase 2 Popup positioning has a separate scope and specification.

## Lifecycle and application limits

This is a once-per-static-page example. It adds one listener to its own opener and owns only its authored hidden states during installation. No observers, timers, document listeners, generated IDs or attribute synchronization are installed. The same nodes retain their listener and native target relationships when detached and reinserted. Replacing markup needs application initialization and cleanup; late children are not observed.

Before removing an open popover, its opener or the whole task, the application must choose a surviving focus destination and close the native popover as appropriate. Do not assume an opener that has disappeared can receive restored focus. Multiple triggers, nested overlays, asynchronous content and business rules require explicit application ownership. This recipe does not override beforetoggle cancellation or catch arbitrary failures in native declarative activation.

## Verification

The [focused browser checks](../tests/popover.html) and [complete harness](../tests/accessibility.html) cover native target relationships, initial focus, non-modal editing, explicit close/focus return, invoker toggle, disabled activation, another auto popover, reinsertion and complete fallback for missing capabilities or unresolved targets. The long-content matrix covers normal/enlarged text, default/forest, light/dark, LTR/RTL and requested 1280×600 / 320×256 frame sizes. These are rendered assertions and simulations, not native keyboard or touch input.

Directly verify Enter/Space opening, Tab and reverse traversal, Escape from inside help, outside pointer dismissal into a field, focus return, scrolling and actual browser zoom. Verify native announcements with screen readers, touch behavior, forced colors, mobile and disabled-user task completion. Read [ACCESSIBILITY.md](../ACCESSIBILITY.md) for actual results and open findings. Automated scores do not establish conformance or stable component status.
