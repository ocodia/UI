# Shared UI JavaScript

Load `js/ui.js` once for the behaviors UI currently ships. It includes forms/error summaries, native modal-dialog setup, native popover help anchored Popup help native-disclosure Accordion groups and linked-section Tabs. Static pages need HTML and this script; no per-example initialization code is required. Ordinary controls and CSS-only layouts keep working without JavaScript.

```html
<link rel="stylesheet" href="css/ui.css">
<script src="js/ui.js" defer></script>
```

The combined file registers only the existing `ui-form` and `ui-error-summary` elements. Native overlays and Accordion use explicit `data-ui` markers. The `ui-tabs` element itself opts into Tabs without a marker; menus, tooltips and other planned widgets remain unavailable. The shared API and overlay convenience patterns are experimental; existing component APIs retain their contracts.

## What UI initializes

| Pattern | Authoring | Ownership |
| --- | --- | --- |
| Forms and error summaries | Existing ui-form/ui-error-summary markup | Existing validation, linked errors, hints and native reset integration |
| Modal information/task | dialog open data-ui="dialog", named title, initial focus and matching hidden opener | Standard setup, native modal opening/close, inline recovery and cleanup |
| Supplemental help | One inline container with data-ui="popover"; native popovertarget buttons | Capability checks, native auto-popover setup, opener focus and inline recovery |
| Anchored supplemental help | Same structure with data-ui="popup" | Standard popover setup plus experimental Popup geometry |
| Accordion | ui-accordion data-ui="accordion" around direct native details/summary items | Optional summary navigation, fragment reveal and collapsed-content focus recovery; expansion stays native |
| Tabs | ui-tabs with a named direct ui-tablist, fragment anchors and paired sections | Selection, keyboard navigation, coordinated fragment/form-error reveal and readable teardown; see [Tabs](tabs.md) |
| Native controls, unmarked details, progress and CSS-only layouts | Existing native/UI markup | Native/CSS behavior; no new initialization or roles |
| Application tasks | Application scripts | Requests, storage, routing, permission checks, async ordering and business feedback |

Unknown data-ui values on native patterns stay unenhanced. The ui-tabs element is discovered by name and ignores data-ui; the earlier data-ui="tabs" marker remains compatible. Unmarked dialogs/popovers are left to their existing owner. The original manual recipes remain available for advanced integration and compatibility checks; use the declarative examples below for ordinary authoring.

## Single-copy help

Write readable help once and keep script-dependent native buttons hidden. Do not put a popover attribute on this inline baseline: UI adds it only after validating the complete structure. The existing native popovertarget relationship supplies the target; no JSON or custom open Boolean is needed.

```html
<button type="button" popovertarget="reference-help" hidden>Open reference help</button>
<div id="reference-help" data-ui="popup">
  <h2 tabindex="-1" data-ui-focus>Reference help</h2>
  <p>Keep the reference from the original visit with your field notes.</p>
  <button type="button" popovertarget="reference-help"
    popovertargetaction="hide" hidden>Close reference help</button>
</div>
```

Use data-ui="popover" when anchoring is unnecessary. Use data-ui-placement="block-start-start" for the alternative Popup preference; the default is block-end-start. Geometry uses existing defaults and tokens. Essential field instructions stay beside their controls. On missing capabilities or geometry failure, the same help stays inline and dead actions stay hidden. No content is duplicated, cloned or reparented.

Popover help can have multiple matching invokers; anchored Popup requires one unambiguous anchor. Native invokers must use type="button" and toggle action; close buttons use type="button" and popovertargetaction="hide". Keep an optional focusable data-ui-focus heading for inline recovery. The script focuses the activated opener but does not force focus into non-modal help. Native Escape, outside dismissal, traversal and restoration remain browser-owned.

## Single-copy native dialog

Author an open, named native dialog as readable fallback. UI's scoped baseline CSS keeps it in normal document flow before enhancement. It becomes a closed modal task only after setup succeeds. Keep its opening/closing buttons hidden until then. Use data-ui-focus with authored tabindex="-1" on a heading, or a native focusable control, for initial focus. Do not use autofocus merely to initialize the fallback.

```html
<h2 id="task" tabindex="-1">Survey arrangements</h2>
<button type="button" data-ui-open="briefing" hidden>Open survey briefing</button>
<dialog id="briefing" open data-ui="dialog"
  aria-labelledby="briefing-title" data-ui-return-focus="task">
  <h3 id="briefing-title" tabindex="-1" data-ui-focus>Survey briefing</h3>
  <p>Meet at the visitor centre at 09:30.</p>
  <button type="button" data-ui-close hidden>Close survey briefing</button>
</dialog>
```

Multiple matching invokers are supported. A native method="dialog" closing form can be used instead of an imperative close button; its submitter/result/cancellation remain native. Other close buttons must have type="button"; their value defaults to close. UI clears stale returnValue on opening, focuses the declared initial target and starts the native scrolling surface at the beginning. Repeated activation while open does nothing.

Escape and background inertness stay native; no duplicate focus trap or document key handler is installed. Normal close restores the actual invoker. If it disappears, data-ui-return-focus identifies a surviving focusable task destination. Without a usable survivor, UI restores the inline baseline and focuses its initial target. Removing an invoker does not prematurely close an active modal. Applications still choose meaningful focus before deliberately removing the whole task.

## Dynamic applications

The bundle initializes once after parsing. Newly connected ui-form/ui-error-summary elements continue using their native custom-element lifecycle. Newly inserted marked overlays/Accordion groups and ui-tabs elements require an explicit scoped call after insertion:

```js
container.append(newSection);
UI.enhance(newSection);

// Before replacing/removing a task, move focus to a surviving task destination.
UI.destroy(newSection);
newSection.remove();
```

| API | Contract |
| --- | --- |
| UI.enhance(root = document) | Synchronous, idempotent; returns undefined. Includes the root and descendants. Resumes/refreshes forms and summaries and installs/reconciles supported marked surfaces and ui-tabs elements. Unchanged active patterns remain open. |
| UI.destroy(root = document) | Synchronous, idempotent; returns undefined. Releases owned overlays and Accordion/Tabs groups deepest first, restores readable presentation and suspends contained form/summary automatic behavior. Answers remain on their native controls. |
| UI.popup.attach(options) | The same lower-level geometry adapter as UIPopup.attach; see the complete Popup contract. |

Roots must be a Document, Element or DocumentFragment from this runtime's document; invalid/foreign roots throw TypeError. Disconnected fragments are not initialized. Destroy also accepts detached subtrees for cleanup. If an invoker was added outside its surface, pass the surface or a shared ancestor/document to enhance; passing only the button does not include its target.

Call enhance again after changing invokers, required children or placement. Incomplete/ambiguous patterns keep their baseline; one broken pattern does not block another. A private lifetime observer cleans up already-owned removed/adopted nodes; it does not automatically initialize newly discovered overlays. Reinsertion after cleanup requires enhance. A deliberately destroyed form stays suspended across reconnect until enhance resumes it. Destroying an owned summary alone releases its link behavior and restores its form's native validation until resumed; destroy the ui-form root for complete validation-feedback teardown.

## Cleanup and limits

The experimental [Accordion guide](accordion.md) defines valid group structure, optional native name grouping and explicit refresh after child changes. Destroy keeps its current expansion and answers. The [Tabs guide](tabs.md) defines linked-section selection, validation reveal and teardown to readable sections. No new element is registered.

UI owns only its listeners, geometry and explicit initialization attributes: popover mode/readiness, baseline dialog open state and hidden action states. Readiness is exposed as data-ui-ready; it is not an application-controlled open attribute. Later application scalar writes are conditionally preserved. Author baseline open/hidden state and configure relationships before enhancement; do not have concurrent owners write native open/popover/readiness while active.

Dialog opening exceptions or calls returning without a modal restore readable baseline. Native opening cancellation on popovers remains retryable and creates no fake expanded state. Explicit teardown closes owned overlays and restores inline content; it focuses an inline target only if that task owned focus. Native values, labels, native form associations, submitters and reset remain unchanged. A readable baseline can briefly appear before deferred enhancement; do not hide essential content globally to conceal that transition.

Application requests, custom validation rules, asynchronous cancellation/response ordering, task completion and routing stay outside the initializer. Preserve [form ownership/localization](forms.md), [native dialog](dialog.md), [popover](popover.md), [Popup geometry](popup.md) and [lifecycle](lifecycle.md) contracts when extending a pattern.

## Entry points and build

Existing js/components.js and js/popup.js remain compatible. Loading them before or after ui.js does not replace registered constructors or geometry ownership, and repeated ui.js does not initialize twice. UI.popup.attach and UIPopup.attach are the same function. Pages using only form behavior can keep the smaller original entry; the combined entry includes every currently shipped behavior.

Edit js/components.js, js/popup.js and js/enhance.js; generate js/ui.js with python3 tools/build_ui.py, or use python3 tools/build_docs.py to rebuild both the bundle and documentation with matching fingerprints. There is no runtime script fetch, npm package, module import or component autoloader. Commit the generated file with its sources when committing changes.

## Verification

The [focused shared-entry harness](../tests/enhancement.html) and [full browser harness](../tests/accessibility.html) cover lifecycle, mixed/repeated loading, native form ownership, declarative overlays, fallback and reflow. The [specification](specs/enhancement.md) records the intended ownership boundaries. Dated browser results and open manual/platform release gates remain in [ACCESSIBILITY.md](../ACCESSIBILITY.md); the convenience API does not establish accessibility conformance.
