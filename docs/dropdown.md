# Dropdown command menus

The experimental `ui-menu` family enhances one native list of commands. Dropdown Item is a native button or anchor; no item element is registered. Use a named native nav for site navigation, details for a navigation disclosure, and visible buttons for frequent actions. This first slice supports one vertical menu, without submenus, checkable items or hover opening. Native hr dividers separate groups.

Load `css/ui.css` and `js/ui.js`. The wrapper opts in by element name. UI installs complete behavior before hiding the list or exposing its trigger. Without JavaScript or required capabilities, commands stay inline. The [report editor](../examples/commands.html), [survey report](../examples/menu-report.html), [newsletter edition](../examples/menu-newsletter.html) and [invoice](../examples/menu-invoice.html) are real local destinations. Downloads contain the data shown in their examples.

```html
<link rel="stylesheet" href="css/ui.css">
<script src="js/ui.js" defer></script>
<h2>October shoreline survey</h2>
<p>Draft · Awaiting review</p>
<a href="examples/menu-report.html">Open report</a>
<ui-menu>
  <button id="report-actions" type="button" hidden>Report actions</button>
  <ul id="report-commands" aria-labelledby="report-actions">
    <li><a href="examples/commands.html#report-title">Edit report</a></li>
    <li><a href="examples/menu-report.csv" download>Download survey data</a></li>
    <li><hr></li>
    <li><a href="examples/menu-report.html#methods">Read survey methods</a></li>
  </ul>
</ui-menu>
```

Keep the main task visible: Open report, Read the current edition or View invoice. Put less frequent actions beside the specific item they affect. Menu labels should describe the task; use dividers to separate distinct groups rather than mixing unrelated documentation links into an application menu.

## Structure and ownership

Require exactly one direct hidden button of explicit type button, then one visible ul, both with authored IDs unique in the document. Name the list with aria-labelledby pointing to its trigger. Each direct li contains one anchor with a useful href or button with explicit type button/submit/reset. Item labels may contain noninteractive spans and decorative SVG. Use `<li><hr></li>` between nonempty command groups. A divider keeps native separator semantics, has no focus stop or activation behavior, and is skipped by arrows and typeahead. Do not author leading, trailing or consecutive dividers. Keep instructions and unavailable reasons outside the list.

UI owns role=menu on the list, role=none on li wrappers, role=menuitem and tabindex=-1 on commands, and the trigger's popovertarget, aria-haspopup, aria-controls and actual aria-expanded state. Native auto popover owns visibility, Escape and outside dismissal; experimental [Popup](popup.md) owns geometry. Buttons and links share plain, left-aligned menu-item styling: the same typography, padding, neutral text and hover/focus treatment. Native button variants and control sizes do not change menu-item presentation; the trigger retains ordinary button styling. No new methods, custom events, reflected properties, open Boolean or CSS variables are introduced. Use native click/submit/reset and beforetoggle/toggle events. Never infer task success from a closed menu.

Authored roles, tabindex, hidden/inert list/items, aria-disabled/checked/selected/haspopup, competing overlay attributes, extra controls, nested menus and missing/duplicate names/IDs prevent enhancement. Native disabled buttons, including inherited fieldset disabling, remain disabled and are skipped by keyboard navigation. This intentionally differs from APG's focusable disabled menu items; explain unavailability visibly outside the popup. No disabled-link API or read-only/busy menu state is provided.

## Keyboard and focus

| Input | Result |
| --- | --- |
| Trigger Enter/Space/click/touch | Native toggle; successful opening focuses first enabled command. |
| Trigger ArrowDown / ArrowUp | Open/focus first or last enabled command. |
| Item ArrowDown / ArrowUp | Next/previous enabled command, wrapping in DOM order. |
| Home / End | First/last enabled command. |
| Enter / Space | Activate once; Space on anchors uses native click on keyup. |
| Printable non-space characters | Locale-aware prefix typeahead with a 500ms buffer; repeated single characters cycle matches. |
| Tab / Shift+Tab | Native exit, followed by closing; no trap or traversal through every item. |
| Escape / outside activation | Native popover dismissal; useful outside focus is preserved. |

Opening intentionally focuses an enabled item, including direct native showPopover() calls after readiness. The trigger's click() supplies native invoker traversal. Native hidePopover() closes; beforetoggle cancellation remains retryable. Arrow navigation does not activate commands. Modified/middle anchor actions, target, download and context menus stay native. IME/prevented/modified navigation events are ignored. RTL preserves vertical DOM order; the measured geometry scope is horizontal writing.

The browser normally restores focus for Escape. UI recovers to an available trigger only when focus would remain stranded in the closing list. Tab, outside activation, invalid-form focus and command dialogs take priority. A guarded deferred close lets every click handler and native submission/reset/validation finish. Reopening invalidates an older deferred close. No document Escape or outside-pointer listener duplicates native dismissal.

All command tabindex values are -1: focus is direct, and Tab exits. Exact native traversal, touch, screen-reader output and platform dismissal require release evidence. Long labels wrap; focus navigation scrolls the menu itself. Existing theme/focus tokens and a minimum 2.75rem target in both dimensions apply regardless of density. Printing closes an open native menu, exposes the inline list and hides the script-only trigger; returning from print leaves it closed.

## Forms and application work

Native commands keep names, values, form associations and submitter overrides. UI does not submit/reset on behalf of a command, clone controls, or change native validity/autofill/serialization. Native and ui-form validation keep their own focus/summary paths. Reset changes answers; it does not select a menu value.

Applications own command handlers, permissions, routing, requests and durable loading/error/retry feedback outside the popup. The invoice example below simulates a reminder failure then retry locally; it sends no email or request. Cancelling a click does not keep a menu open or imply a successful operation. Move focus into a surviving task before removing an open/focused menu. UI cannot infer the next business destination when the trigger and commands are removed.

## Dynamic content and failure

Use UI.enhance(menu) after changing children, labels, IDs or state. Repeated calls preserve a valid open menu and surviving focus. A focused baseline list defers conversion until focus leaves. Removal/disabled safety observation recovers to the next enabled item (then preceding survivor); an invalid or newly inserted unrefreshed item releases stale roles to the inline list. Empty/all-disabled menus remain inline with their trigger hidden.

UI.destroy(menu) closes, cancels keyboard/deferred work, destroys geometry and conditionally restores owned attributes. Useful inline focus and native values remain. Later application scalar changes are preserved. Disconnect/adoption releases resources; explicit enhance is required on reinsertion in the appropriate document. Missing capabilities, unsupported geometry or installation failure retain readable commands. Opening cancellation creates no fake expanded state.

Menus inside a native dialog stay in that dialog's light-DOM subtree. Opening a dialog command must retain its focus. Sibling auto popovers coordinate natively; nested submenus are unsupported. Follow the [lifecycle contract](lifecycle.md) and [full family specification](specs/dropdown.md) for teardown, focus ownership and acceptance requirements.

## Examples and verification

The survey card keeps Open report visible and groups editing/export/publishing separately from Archive. Archive and Undo update the card for this visit; the unavailable publishing action explains why it cannot run.

The newsletter draft keeps its current edition visible while Draft actions previews an edited subject or reverts unsaved changes. Preview renders an email locally after validation; it does not save a draft or send mail.

The overdue invoice keeps View invoice visible and places reminders/export in Invoice actions. Its first reminder attempt fails; the persistent message and retry remain available after the menu closes. The retry completes locally without sending email.

Each menu uses native hr dividers. Without scripts, native links and downloads remain available; application-only actions stay hidden, and the report editor retains native GET/reset behavior.

Run the [focused menu checks](../tests/dropdown.html) and the [documentation harness](../tests/accessibility.html). Actual dated evidence and open manual/platform work are recorded in [ACCESSIBILITY.md](../ACCESSIBILITY.md). Experimental availability does not close stable-release or accessibility-conformance gates.
