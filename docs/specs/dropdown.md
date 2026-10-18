# Dropdown / Dropdown Item specification

## Identity and purpose

**Status: experimental implementation. Phase: 2. Owner: UI behavior; commands, destinations and task results belong to the application.** Dropdown maps to a `ui-menu` wrapper; Dropdown Item remains a native button or anchor, with no item custom element. Follow the [shared lifecycle and ownership contract](../lifecycle.md). The shared entry initializes this wrapper by element name.

Use this family for a short contextual command list, such as report actions. Prefer visible buttons for a few frequent actions, a named native navigation list for site navigation, and native details for a navigation disclosure. A menu is not a select, combobox, toolbar or form containing arbitrary interactive fields.

The first slice is one vertical menu with one trigger and no submenus, checkable/radio items, horizontal menubar, hover opening or context-menu invocation. Those modes need separate specifications and evidence. Native auto popover owns visibility, Escape and light dismissal; the existing experimental [Popup adapter](../popup.md) owns anchored geometry; UI owns menu semantics, item navigation and focus recovery. No second overlay stack or duplicated open state is introduced.

## Minimal markup

This source markup uses `css/ui.css` and the optional combined `js/ui.js`. The illustrative server routes must exist in an application; a repository recipe must supply real working destinations before shipping.

```html
<link rel="stylesheet" href="css/ui.css">
<script src="js/ui.js" defer></script>

<form action="/projects/42/actions" method="post">
  <input type="hidden" name="csrf" value="server-issued-token">
  <ui-menu>
    <button id="project-actions" type="button" hidden>Project actions <ui-icon name="chevron-down" aria-hidden="true"></ui-icon></button>
    <ul id="project-commands" aria-labelledby="project-actions">
      <li><button type="submit" name="action" value="duplicate">Duplicate project</button></li>
      <li><a href="/projects/42/report.csv" download>Download report</a></li>
      <li><hr></li>
      <li><a href="/projects/42/activity">View activity</a></li>
    </ul>
  </ui-menu>
</form>
```

Require exactly two direct element children: the hidden native `button[type="button"]` trigger and a visible native `ul`, in that order. Whitespace/comments are allowed. Both have authored nonempty IDs unique in the document. The list's `aria-labelledby` points to the trigger; its nonempty visible label names the enhanced menu and the opening action. In the baseline, the hidden trigger is an explicit naming reference, not a focus stop; the actions retain their own visible labels. Keep essential instructions outside the list.

Each direct `li` contains exactly one native button with explicit type button/submit/reset, or one anchor with a nonempty useful href. Noninteractive label spans and decorative SVG are allowed inside an item; no nested controls, editable content, additional focus stops, nested lists or submenus in this slice. A dedicated `<li><hr></li>` separates nonempty command groups. It retains native separator semantics without a role override, tabindex, name, activation or keyboard stop; no leading, trailing or consecutive dividers are accepted. Native disabled buttons are allowed. Hidden/inert items, authored roles/tabindex, aria-disabled, aria-checked, aria-selected, aria-haspopup or conflicting expansion/ownership attributes make the structure ineligible. Native download, target, rel, form, name, value and submitter overrides retain their meaning. A button of type button still needs an application action; UI never invents one.

Do not author popover, popovertarget, hidden list content, menu roles or readiness markers. Install behavior and geometry before converting the existing list into the popover and revealing the trigger. Keep one copy of every command; never clone or reparent controls. Commands remain inline and native without scripts or required capabilities. If focus is already inside the list, defer conversion until focus leaves; initialization must not hide the active element.

## Public contract

The component-specific surfaces below are implemented experimentally. Existing shared methods and Popup remain governed by their current guides.

| Surface | Implemented decision |
| --- | --- |
| ui-menu | Light-DOM ownership boundary; shared-entry opt-in by element name, with no redundant data-ui marker and no new custom-element registration. |
| Children / IDs | Required native trigger/list/items as above. Authored IDs are never generated, rewritten or removed. |
| Configuration | No component attributes, reflected properties, open/value property, placement variants, size/orientation mode or JSON configuration in this slice. Native lang/dir remain effective. |
| Opening / closing | After readiness, use the trigger's native click() or the list's native showPopover()/hidePopover(). Opening is synchronous and can be cancelled through native beforetoggle; inspect native state afterward. No promise or success inference from calling an opener. Calls before readiness retain native behavior and limitations. |
| Shared lifecycle | UI.enhance(root) installs/reconciles; UI.destroy(root) releases, with existing synchronous/idempotent root rules and undefined return values. No menu-specific method. |
| Readiness | Owned data-ui-ready only after complete installation. It is an output, never an author setting or readiness promise. |
| Native state | List :popover-open owns visibility; trigger aria-expanded mirrors actual native state, including direct native calls and cancellation. No hidden/open Boolean used as a competing controller. |
| Events | Native click, beforetoggle, toggle, submit and reset only. No ui-select, command event, fake input/change or before-command event. Business listeners bind to native commands and actual form submission. |
| Disabled / busy | Native button disabled, including inherited fieldset disabling, stays native and unchanged. No disabled links or component read-only/busy mode. Application pending/error/status feedback stays outside the menu. |
| CSS variables | No new public tokens. Use existing spacing/radius/surface/border/text, disabled and focus tokens in the ui layer. Popup owns its documented measured geometry. |

Controlled updates change authored command content or native disabled state, then call `UI.enhance(menu)` to reconcile. They do not click a command or reopen the popover merely to mirror native toggle. Programmatic opening intentionally focuses an item just like user opening; positioning and reconciliation never move useful focus. Subscribe to native toggle and read current state rather than replaying it as another opening request.

## Interaction and accessibility

The [APG Menu Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) and [Menu keyboard pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) inform this contract. UI deliberately retains native disabled buttons, which cannot receive focus: keyboard navigation skips them rather than replacing disabled with an ARIA-only simulation. This differs from APG's focusable disabled menu items and requires explicit screen-reader and discoverability review before stable maturity. Important unavailability reasons stay visible outside the popup.

After listeners, rollback and geometry are ready, apply `popover="auto"` to the list, role=menu, and role=none to its direct li wrappers. Native hr dividers remain implicit separators inside role=none list items and are excluded from the command collection. Items receive role=menuitem and tabindex=-1; focus moves to actual native elements, without aria-activedescendant. The trigger receives native popovertarget for the list, aria-haspopup=menu, aria-controls and synchronized aria-expanded. Reveal the trigger last. No role on ui-menu, live region, positive tabindex, aria-selected, checked state or modal semantics. Keep native anchor destinations and button form behavior.

| Input | Required result |
| --- | --- |
| Trigger Enter / Space / primary click / touch | Native activation toggles the popover; successful opening focuses the first enabled item. A second trigger activation closes it. Avoid synthetic duplicate clicks. |
| Trigger ArrowDown / ArrowUp | Open and focus first/last enabled item respectively. If already open, focus that endpoint. Prevent only the replaced arrow behavior; failed/cancelled opening does not move focus. |
| Item ArrowDown / ArrowUp | Focus next/previous enabled item in DOM order, wrapping. Skip disabled buttons; never activate by moving focus. |
| Item Home / End | Focus first/last enabled item. |
| Item Enter | Native activation once, preserving actual anchor navigation or native submit/reset and submitter. |
| Item Space | Native button activation once. For an anchor, prevent page scrolling and request its native click once on keyup; clear pending activation on blur/close/removal. |
| Printable characters | Buffered typeahead as specified below; move focus only. |
| Tab / Shift+Tab | Leave the menu through native sequential navigation. Do not prevent Tab or loop focus; close after focus leaves, without restoring the trigger. |
| Escape | Native popover dismissal. Restore the trigger only when focus would otherwise be stranded inside the closing menu. |
| Left / Right, other keys | No submenu/menubar operation. Preserve native defaults. |

All menu items remain tabindex=-1: opening/arrow/typeahead directly focuses one; Tab leaves rather than visiting every item. Verify native popover invoker traversal: forward Tab must reach the next outside focus stop after the trigger/menu, and reverse Tab may reach the trigger. If platform behavior cannot satisfy entry/exit without trapping or stranding focus, retain the inline baseline on that platform until the interaction is corrected.

Handle keys only from an owned trigger/item or its noninteractive label descendant, never from an unrelated/nested widget. Ignore defaultPrevented, IME/composing events and Alt/Ctrl/Meta combinations. Shift is permitted for printable typeahead and Shift+Tab; ignore shifted navigation shortcuts. Do not stop propagation. Suppress modified/middle anchor activation neither by a keyboard alias nor a click cancellation; preserve context menus, copied URLs, download and target semantics.

Typeahead collects printable non-space characters for 500ms after the last character. Use the item's current accessible text label (aria-label, valid aria-labelledby, otherwise visible text), excluding decorative/hidden content; do not infer command identity from it. Normalize Unicode to NFC and locale-aware case using effective lang, falling back safely for invalid locale tags. Match prefixes in enabled DOM order starting after the focused item; a repeated single character cycles matching items. Multi-character buffers may retain the current matching item. An unmatched buffer leaves focus unchanged; do not strip diacritics or transliterate. Clear on timeout, non-typeahead navigation, focus leaving, close, reconcile or teardown. A pending Space activation is separate. RTL changes do not reverse vertical order; horizontal-tb writing in either direction is the first supported geometry scope.

### Activation, focus and dismissal

Native popover owns Escape and outside dismissal as defined by the [HTML popover contract](https://html.spec.whatwg.org/multipage/popover.html). Do not add a parallel document Escape or outside-pointer listener. Record a pending first/last opening intent only for the current opening attempt; invalidate it on cancellation/close. A direct showPopover() defaults to first enabled item. If native opening fails, restore the complete inline baseline and retain useful focus. Disabled trigger activation never opens. If no enabled items remain, restore inline commands and withhold the opener; show an application explanation for an empty or unavailable task.

After an ordinary enabled item click, allow native activation and all application handlers/default actions to complete before closing; use a guarded deferred step so native submission validation can reveal/focus an invalid field. Close even if the click was cancelled, without interpreting cancellation as task success. Native disabled items do nothing and remain open. Do not intercept submit or reset to implement a command; preserve FormData, actual submitter, external form ownership, cancelled reset, constraint/custom validity and existing ui-form behavior. No value, checked state, reset state or autofill surface is added by UI.

On command completion, keep focus if it moved to a dialog, invalid field, new document or other surviving task. Otherwise, if focus remains in the closing menu, return to the available trigger. On Escape, explicit hide or a trigger toggle, preserve successful native return and recover only stranded menu focus. Outside activation, Tab and deliberate application focus movement take priority over opener restoration. Never unconditionally focus after every toggle. Guard deferred close/focus work against a newer opening, replaced commands, disconnection or a changed active element.

If the trigger is missing, hidden, inert or disabled, the application must provide a meaningful surviving destination before deliberate task removal. Unexpected removal cancels work and releases ownership; UI cannot infer the next business task and never assumes body is a meaningful destination. Move focus to a surviving enabled neighbor (next, then previous) only when the removed/disabled item owned focus and the same open menu survives. If none remain, restore inline fallback, using a surviving visible command only if focusable; otherwise application focus recovery is required.

Menus inside a native dialog remain in its light-DOM subtree. Opening a dialog command closes the menu without taking focus back from the dialog. Independent sibling menus use native auto-popover coordination. Submenus and ui-menu nested within an item's content are invalid; a parent must never handle another instance's commands. Verify native Escape ordering inside dialogs; no extra key handler may close both layers from one Escape.

### Presentation and application feedback

Buttons and anchors share plain menu-item typography, padding, alignment, neutral text, transparent default background and identical hover/focus treatment. Menu-item presentation takes precedence over native action variants and control sizes; the trigger retains ordinary button styling. Visible labels wrap, including long translations; use content-driven width, logical properties and bounded local scrolling supplied by Popup rather than page overflow clipping. Scroll the focused item into the menu's visible area without jumping the document. Preserve shared focus outlines and at least 2.75rem item targets in both dimensions; density must not shrink targets. Check both brands/modes, forced colors, RTL, reduced motion, text spacing/resize, 320px reflow and actual zoom. No animation requirement or hover-only action discovery. Printing closes an open native menu so it leaves the top layer, restores the inline command list and hides the enhancement-only trigger without overriding authored hiding. Returning from print leaves the menu closed.

Applications localize labels, unavailability reasons and durable loading/error/success feedback. Opening, focus navigation and geometry do not announce success or start requests. A command may open a task dialog or start async work; keep one announcement owner and retry/persistent outcome outside the transient menu. Abort superseded work where available and reject stale responses after task removal. Permission checks and server validation remain application responsibilities.

## Lifecycle and failure

Use explicit structural refresh through `UI.enhance(menu)` for late/reordered/replaced items, label/state changes, IDs and relationships. Narrow observation handles disconnect/adoption cleanup and open trigger/item loss or native disabled changes so hidden focused content is not stranded between refreshes. Coalesce owned writes without loops. An unrecognized late item or invalid transient structure while open releases menu semantics to the readable inline baseline rather than presenting a partially enhanced menu. Observing removal for safety is not an undocumented general refresh API.

Reconciliation preserves a surviving focused item and native open state when the structure remains valid; it never replays the opening intent. Empty/all-disabled lists, duplicate IDs, missing names, unsupported writing mode, conflicting ownership, extra controls or unavailable native Popover/Popup capabilities leave the inline baseline and hidden trigger. Repeated enhance/destroy must acquire no duplicate listeners, observers, timers or geometry attachments. Unsupported APIs, Popup attachment exceptions and partial installation failures roll back synchronously before any inaccessible hidden state persists.

Track individual writes to trigger/list/li/item attributes and inline styles, plus listeners, observation, native toggle subscriptions, typeahead timer, pending Space and deferred command/focus work. Teardown invalidates queued work first, closes any owned native popover while relationships still exist, destroys geometry, and conditionally restores authored attributes/styles under the shared ownership rules. Restore ordinary list semantics, item Tab stops and the authored hidden trigger. If the trigger owns focus, reveal the inline list and move to its first enabled command before hiding it; if no destination exists, the application must recover focus. Preserve later authored changes, IDs, form values, handlers and unrelated ARIA tokens. Do not remove nodes or reparent commands.

Disconnected instances release all resources and acquire nothing until explicitly enhanced again after reconnect; rediscover the current document/relationships. Cross-document adoption releases old-document work and requires explicit enhancement in the receiving supported document. Scoped destroy/replacement follows existing shared-entry rules. No disconnect may submit, reset, activate a command or imply task completion. The implementation must document any unavoidable native-state reset on disconnect rather than claim open-state persistence.

## Examples and evidence

The [guide and runnable recipes](../dropdown.md) and [focused checks](../../tests/dropdown.html) exercise this experimental implementation. The acceptance matrix defines release work; existing Popover/Popup evidence does not prove menu behavior.

| Area | Required fixtures and assertions |
| --- | --- |
| Baseline / failure | Useful commands with scripts blocked/failed; unsupported Popover/Popup/writing mode, failed/cancelled opening, geometry loss, focused baseline deferral, malformed/duplicate relationships, zero/one/all-disabled commands and independent invalid/valid instances. |
| Keys / activation | Real Enter/Space including held/repeated keys, first/last opening, wrap/Home/End, exact Tab/Shift+Tab destinations, typeahead timeout/cycling/locales/IME, modified/middle anchors, download/target, native disabled skipping and exactly one action per activation. |
| Names / focus | Trigger/menu/item names and correct ready-only roles, expanded synchronization on direct native calls/cancellation, focus visibility/scroll, native Escape/outside dismissal, removed/disabled trigger or item, application focus movement, stale deferred close after reopening and no empty-menu focus trap. |
| Forms / tasks | Submitter/name/value/FormData and overrides, external association, native/ui-form invalid focus and summary, reset/cancelled reset, retained values/autofill, dialog commands, async busy/error/retry/success and stale-response rejection outside the library. |
| Lifecycle / nesting | Repeated enhance/destroy, late/replaced/removed children, ID/label/dir/lang edits, scoped teardown, authored writes during enhancement, detach/reinsert/adoption, resource counts, invalid nested menu and native dialog/sibling-popover dismissal order. |
| Presentation | Long labels, local scroll, both brands/modes, density, target size/touch, forced colors, RTL, reduced motion, 320px reflow, text resize/spacing, actual 400% zoom, print and no-script content. |

Ship a runnable report-command recipe with real local destinations, native server/form fallback where needed, visible unavailable reasons and an application-owned async failure/retry case. Add focused browser checks to the existing accessibility harness and documentation navigation/example/reflow checks. Record dates, versions and actual results in [ACCESSIBILITY.md](../../ACCESSIBILITY.md), including Chrome, Edge, Firefox, Safari, relevant mobile/touch, VoiceOver/Safari and NVDA/Firefox or Chrome. Review axe failures/incomplete results without exclusions; platform/manual and disabled-user task testing remain separate release evidence.

## Completion

The shared-entry family, minimal CSS, native fallback recipe and focused checks ship experimentally. Keep current reference, enhancement guide, README, catalogue, roadmap and dated evidence aligned. Regenerate js/ui.js and all affected documentation. No custom item registration, compatibility alias, module loader or placeholder API is needed. Experimental maturity requires actual implementation/evidence; stable maturity requires the [component release gate](../../ROADMAP.md#release-gate-for-every-component).
