# Drawer specification

## Identity and purpose

**Status: experimental implementation. Phase: 2. Owner: UI foundation for presentation and enhancement; application for task state and data.** A Drawer presents a supporting task at a viewport edge while preserving page context. Prefer an inline section, `ui-sidebar`, native details or a separate page when users need to compare content or continue using the page.

The first implementation is **modal only**, built on native `dialog.showModal()`. `ui-drawer` is a light-DOM ownership and geometry boundary around one native dialog and its opening buttons. It opts in by element name through the shared entry, with no redundant data-ui marker or new registration. Reuse the native-dialog adapter's ownership rules and extract shared code only as needed; never install two adapters on one dialog. Popup anchored geometry is unnecessary for viewport-edge placement.

Follow the [shared lifecycle contract](../lifecycle.md), [native dialog integration](../dialog.md) and [HTML dialog standard](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element). The [APG modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) informs naming and task focus; native dialog owns modality and browser keyboard behavior.

### Modal and non-modal scope

| Mode | Contract |
| --- | --- |
| Modal Drawer | First implementation scope. Native showModal/close, background inertness, initial focus inside the task, native Escape cancellation, explicit close and guarded focus return. |
| Non-modal panel | Outside the first implementation. Use an inline section/aside with ui-sidebar for simultaneous page interaction, or the existing native Popover recipe for supplemental transient help. A future non-modal Drawer requires a separate page/panel traversal, overlap, dismissal and focus contract. |

There is no mode/modal attribute, responsive modality switch, persistent docked mode, swipe gesture or nested Drawer support. Calling show() or adding a role does not select a supported non-modal mode. Viewport width must never silently change modality.

## Minimal markup

Load the following entries once. The [guide and runnable recipes](../drawer.md) use this structure. The open native dialog retains readable content without JavaScript; scoped baseline CSS puts it in normal flow without duplicating answers.

```html
<link rel="stylesheet" href="css/ui.css">
<script src="js/ui.js" defer></script>
<section aria-labelledby="survey-task">
  <h2 id="survey-task" tabindex="-1">Survey arrangements</h2>
  <ui-drawer>
    <button type="button" data-ui-open="survey-drawer" hidden>Read survey briefing</button>
    <dialog id="survey-drawer" open aria-labelledby="survey-drawer-title"
      data-ui-return-focus="survey-task">
      <h3 id="survey-drawer-title" tabindex="-1" data-ui-focus>Survey briefing</h3>
      <p>Meet at the visitor centre at 09:30. Bring waterproof clothing.</p>
      <button type="button" data-ui-close hidden>Close survey briefing</button>
    </dialog>
  </ui-drawer>
</section>
```

Require exactly one direct native dialog with a unique nonempty document ID, a visible title named through valid aria-labelledby or a nonempty aria-label, exactly one owned usable data-ui-focus target, at least one matching direct opening button and at least one usable explicit close control inside the dialog. Multiple direct opening buttons may target that dialog. Optional headings, layouts, native links and forms belong inside it. No cloned/reparented content, nested forms, nested ui-drawer, popover attribute on the dialog, data-ui="dialog" on the owned dialog or competing overlay controller.

Openers must be outside the dialog, type=button and initially hidden. Close controls are type=button data-ui-close buttons or submit buttons in a separate method=dialog form; author them hidden until ready. Do not wrap the Drawer in a form if it contains forms. Use data-ui-focus rather than autofocus so fallback rendering never moves focus on load. Never focus the dialog container. Authored hidden/inert content must not be revealed by enhancement.

## Public contract

These surfaces ship experimentally. Shared/native attributes retain their documented meanings.

| Surface | Decision |
| --- | --- |
| ui-drawer | Behavioral boundary; no role, value, focus stop, registration or imperative element API. |
| data-placement on wrapper | Optional case-sensitive enum: inline-start, inline-end, block-start, block-end. Absent defaults to inline-end. Empty/invalid values retain the baseline with hidden openers. First scope is horizontal-tb writing in LTR/RTL; unsupported writing modes retain baseline. |
| data-ui-open on direct buttons | Required owned dialog ID without #, resolving uniquely in the current document. Native disabled remains native; setup requires an enabled opener. |
| data-ui-close | Presence marker on owned type=button controls; activation calls native close(button.value or "close"). method=dialog forms instead retain native submitter/result behavior. |
| data-ui-focus | One presence marker on an owned heading with tabindex=-1 or usable native focusable control; initial target and inline focus recovery target. |
| data-ui-return-focus on dialog | Optional ID of a connected, visible, enabled, non-inert, programmatically focusable surviving task destination. Missing/invalid destinations use inline recovery when the invoker is unavailable. |
| data-ui-ready on wrapper | Enhancement-owned presence marker after successful setup. Not authored or an open command. Edge geometry additionally requires native :modal state. |
| Native state/properties | dialog.open and :modal own visibility/modality; returnValue remains native. No mirrored wrapper open/expanded/busy state or Drawer properties. Values, disabled and validity remain on native controls. |
| Methods | Existing synchronous/idempotent UI.enhance(root) / UI.destroy(root), returning undefined. No new element methods. Once enhanced, native showModal() / close(result) remain usable with the focus/scroll/result rules below. Direct invalid calls retain native exceptions. |
| Events | Native cancel/close on the dialog and native control/form events. No custom open/change/before/after events, redispatched native events or fake input/change. Respect native cancel and method=dialog submission cancellation. |
| --ui-drawer-size | Preferred extent: 24rem along the placement axis, bounded by available viewport space. Each wrapper resets its default; application CSS overrides locally. Invalid values follow normal CSS behavior. Never a minimum that forces overflow. |
| --ui-drawer-padding | Local padding: var(--ui-space-5), reset per wrapper. Semantic surface/text/border/focus tokens inherit from the theme. No Drawer color or motion tokens. |

Configure structural attributes before enhancement and explicitly call UI.enhance(drawer) after changes. A valid refresh preserves an open task and useful focus; placement-only updates never reopen or reset scroll. CSS resolves dir and token changes without moving focus. Application close listeners read native state rather than mirroring it back to a wrapper. Do not add/remove open to control an enhanced dialog or call show() to change mode.

## Interaction and accessibility

The native dialog owns its role and modal state. Add no wrapper role=dialog, redundant aria-modal, blanket aria-describedby for structured content, aria-expanded on openers, opening live region, second inert mechanism or custom focus trap. Applications localize visible titles, actions and feedback. Initial focus belongs near the beginning of long content; destructive tasks should choose the least destructive suitable action.

| Operation | Required behavior |
| --- | --- |
| Enter / Space on opener, pointer or touch | Native activation once. Ignore defaultPrevented activation. Record/focus the actual invoker, clear stale returnValue and attempt showModal. Only successful opening focuses the declared initial target and sets dialog.scrollTop to zero. |
| Repeated open while modal | No-op; retain focus, answers, result and reading position. |
| Tab / Shift+Tab | Native dialog traversal with background document inert. Browser chrome stays browser-owned. No custom Tab interception. |
| Escape | Native cancellation of the active modal. UI does not prevent cancel. Applications cancelling dismissal must explain their policy and retain a usable exit. |
| Explicit close | Native close operation or method=dialog submitter. Closing does not imply saving, resetting or successful completion. |
| Backdrop activation | Does not close. No outside-pointer listener or light-dismiss opt-in; verify on supported platforms. |
| Arrows / Home / End / scrolling | Native control/scroll behavior. No Drawer shortcuts, drag handle or resize interaction. |

Direct showModal() must also clear stale results and apply initial focus/scroll only after successful modality. It has no recorded user invoker: preserve native return where successful, then use the declared survivor if recovery is needed. Implementation must demonstrate this path rather than assuming click handlers cover every opening. Cancelled native opening, where supported, remains closed/retryable without hidden-content focus; thrown/no-op UI opening restores inline fallback.

After close, preserve successful native restoration and deliberate application focus movement. Recover only stranded/hidden task focus or focus lost through an unusable invoker: use the actual available invoker, then the declared survivor. If neither is usable, restore the same content inline and focus its initial target. A later opening invalidates queued recovery from a previous cycle. Disabling/removing an invoker while open does not cancel the task.

No wrapper disabled/read-only/invalid state is added. Empty, busy, error and success content belongs inside the task with one application announcement owner and durable recovery. Closing preserves answers. Never hide the only exit during a request.

### Placement, scrolling and composition

inline-end is right in LTR and left in RTL; inline-start reverses it. block-start/block-end are top/bottom in horizontal-tb. Side drawers use available block extent and preferred inline size; top/bottom drawers use available inline extent and preferred block size. Reset centered native margins/insets only while enhanced and modal. Use logical properties, viewport-unit fallback and safe-area padding where applicable.

At 320px/enlarged text, bound the Drawer to available space with wrapping and one vertically scrollable dialog surface. Keep initial content and close controls reachable. No fixed inner height, sticky-action requirement, hidden overflow to conceal defects or text shrinking. Check long words, tables, controls, mobile browser chrome and on-screen keyboards. Preserve background scroll position on close. Native inertness is not a claim of background scroll suppression on every platform: record actual wheel/touch results and resolve any additional scroll ownership before release.

The first implementation has no opening/closing animation, delayed accessibility removal or motion-dependent cleanup. Shared focus, forced-colors boundaries, light/dark themes and native target sizes remain intact under density changes.

Native Popover/Popup help and command menus may live inside the dialog subtree with independent ownership. One Escape must dismiss the innermost native layer without also closing the Drawer. Parent handlers exclude nested widget commands and another dialog's submissions. A menu opening a Drawer must not reclaim its initial focus. Nested Drawers/dialog tasks and opening a sibling modal while one is active are outside the first authoring contract; add no global overlay stack or silent closing of another task. Verify nested-help cleanup before claiming supported composition.

## Lifecycle and failure

Validate structure/capabilities and install listeners/rollback before closing the authored inline dialog or revealing actions. Require showModal/close, native dialog beforetoggle support, a reliable :modal check, MutationObserver and AbortController. Focus already inside baseline content defers enhancement until focus leaves or the application explicitly relocates it. Installation never hides a user's active task. Already-modal or independently controlled dialogs stay untouched.

Missing/failed JavaScript, APIs, required structure, names/IDs/focus/close controls, valid placement or supported writing mode retain readable baseline and hidden unavailable actions. Partial installation rolls back synchronously. Never simulate modality through open, show(), ARIA or manual background hiding.

Late/replaced structure and configuration require scoped UI.enhance. Narrow safety observation handles disconnection/adoption and loss of required active structure; it is not an autoloader. Invoker loss alone preserves the active task. Loss of the dialog, its name, initial target or last usable close action releases ownership to inline content, recovering focus only if this task held it. Removing a focused ordinary control inside a surviving task requires application recovery; do not reopen to repair focus.

Teardown invalidates queued work, releases nested owned overlays inside out, closes the owned modal while relationships exist, removes listeners/observation and conditionally restores authored inline open/hidden state under shared write-ownership rules. Preserve later application writes, authored IDs, handlers and answers. Generate no IDs; never move nodes, submit/reset or infer completion during cleanup. Recover focus to inline content only when teardown would otherwise strand focus. Applications deliberately removing a whole task choose a survivor and coordinate close/destroy before removal.

Disconnect/adoption releases old-document work. Reconnection needs explicit enhance and fresh discovery; it never reopens a former modal. Repeated enhance/destroy must not duplicate resources. Before print, close the owned modal without task completion, restore inline content and hide enhancement-only actions; afterward resume enhancement closed without focus theft or answer reset.

### Forms and asynchronous tasks

Preserve native labels, names, autocomplete, actual form associations, submitters/overrides, FormData, validity and cancelled reset, including external associations. Never nest forms; keep method=dialog close forms separate from data forms. Cancelling a validating dialog form needs appropriate native formnovalidate behavior. Reset changes answers, not visibility. ui-form errors/summary and validation focus must stay inside the modal; applications must not focus inert background summaries.

Applications own requests, server errors, save/abandon decisions and cancellation policy. Dismissal does not automatically abort/confirm requests. Abort superseded work where appropriate and reject stale responses after close/reopen/removal using task/request generations. A stale success must never close a newer task or move its focus. Follow [form integration](../forms.md) for grouped errors, localization and synchronous callback boundaries.

## Examples and evidence

The [guide and runnable recipes](../drawer.md) and [focused checks](../../tests/drawer.html) exercise the experimental implementation. Existing dialog evidence covers that implementation only; dated Drawer results belong in ACCESSIBILITY.md. This matrix defines applicable acceptance and remaining release work:

| Area | Required fixtures and assertions |
| --- | --- |
| Baseline / failure | Single-copy answers with scripts blocked/failed; missing APIs; failed/no-op/cancelled opening; malformed/duplicate relationships; unsupported placement/writing mode; focused-baseline deferral; independent valid/invalid instances. |
| Opening / dismissal | Real keyboard/pointer/touch; disabled/multiple invokers; repeated/direct opening; initial focus/scroll; actual Escape and cancelled cancel; close results; backdrop non-dismissal; stale result clearing; exact Tab destinations. |
| Focus / composition | Native return; removed/hidden/disabled/inert invoker; declared/missing survivor; application focus movement; close/reopen races; nested help/menu Escape order; menu-to-Drawer activation; focused child loss. |
| Forms / requests | Native/ui-form validation and summary; external association; submitter/overrides; FormData; custom validity; server errors; reset/cancelled reset; autofill; retained answers; busy/error/retry/success; stale response rejection. |
| Lifecycle | Repeated enhance/destroy; late/replaced controls; placement/dir/lang changes while open; authored concurrent writes; task removal; disconnect/reinsert/adoption; partial rollback; resource counts. |
| Display | Four edges in LTR/RTL; short/long/localized/empty tasks; nested scroll containers; background scroll; both brands/modes; density/targets; forced colors; reduced motion; 320px reflow; doubled text/spacing; actual 400% zoom; mobile keyboard/safe area; print. |

Add a focused Drawer harness to tests/accessibility.html and documentation navigation/source/reflow checks when runnable examples exist. Record dates, browser versions and actual results in [ACCESSIBILITY.md](../../ACCESSIBILITY.md), including Chrome, Edge, Firefox, Safari, relevant mobile/touch, VoiceOver/Safari and NVDA/Firefox or Chrome. Review axe failures/incomplete findings without exclusions. Manual task testing and disabled-user evidence remain separate release work.

## Completion

The modal wrapper, four-edge CSS, fallback/task recipes and focused checks ship experimentally through the existing shared entry. Current reference, enhancement guide, README, catalogue and roadmap describe the same implementation. No new registration, entry point or compatibility alias is added. Keep manual/platform evidence open and require the [release gate](../../ROADMAP.md#release-gate-for-every-component) before stable maturity.
