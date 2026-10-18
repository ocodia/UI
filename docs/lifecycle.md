# Lifecycle and ownership contract

This is the design contract for UI behavior and component specifications. The optional experimental [Popup adapter](popup.md) applies it to geometry; existing component APIs retain their documented contracts. The current library registers only `ui-form` and `ui-error-summary`; the [form contract](forms.md), [dialog recipe](dialog.md) and [popover recipe](popover.md) remain authoritative for their implemented behavior and limits.

The [shared entry](enhancement.md) now applies these rules to existing forms/summaries and declarative native dialog/popover/Popup setup. The experimental [Accordion pattern](accordion.md) also uses that shared entry, with native expansion and explicit structural refresh. Explicit scoped enhance/destroy calls manage dynamic applications; legacy manual recipes remain compatible.

## One owner for each responsibility

| Responsibility | Owner |
| --- | --- |
| Values, labels, submission, reset, validation eligibility | Native form controls and their actual native form |
| Modal state and background inertness | Native dialog |
| Auto-popover visibility, Escape and outside dismissal | Native popover |
| Widget selection, keyboard rules and required ARIA | The component whose specification defines that interaction |
| Anchored geometry | A positioner; the [Popup specification](specs/popup.md) defines its boundary |
| Routing, persistence, requests, permission checks and task completion | Application |
| Focus after deliberate task removal | Application, coordinated with native close behavior |

Do not create a second state variable that can disagree with native open/checked/selected state. Read the native state after an operation; a call can fail or opening can be cancelled. A geometry failure must not be treated as successful task completion.

## Installation and readiness

A new component must define these transitions: readable baseline, ready enhancement, temporary incomplete structure, disconnected instance, and reconnected instance. An overlay also has closed/open native state, independent of whether geometry is attached.

1. Discover required children and relationships within the declared ownership boundary. Resolve IDs in the correct document; ambiguous or missing required relationships leave the baseline usable.
2. Check required capabilities and valid configuration before changing presentation. Never expose an action that cannot perform its task.
3. Install the necessary listeners and cleanup path. Capture the authored state that those changes will replace.
4. Only then apply compound roles, hide inactive content or replace native validation UI. Preserve focus and values during installation.
5. Reconcile current markup without duplicating listeners, generated content or announcements. Publish readiness only where an actual API specifies it; there is no shared readiness attribute or event today.

A specification must choose whether late children are observed or require explicit refresh. For observed markup, restrict records to relevant nodes/attributes and coalesce work; do not react recursively to the component's own writes. A temporary incomplete structure must release obsolete ownership and preserve useful content without moving focus unexpectedly.

## Owned changes and cleanup

Maintain an ownership record for listeners, observers, scheduled frames/timers, generated nodes/IDs, token-list additions and individual attribute/style writes. Release resources when their scope ends, including when an overlay closes. Disconnect must invalidate queued work before it can write again. Reconnect must rediscover the current document and children rather than use stale references.

For new behavior, undo a scalar attribute/style write only when its current value still equals the component's last write. Otherwise preserve the later application value. For token lists such as `aria-describedby`, remove only tokens the component added and still owns; retain authored tokens. Concurrent writers of the same token or scalar value need explicit application coordination: matching strings alone cannot establish ownership.

Generated IDs must avoid document collisions. A specification must say whether IDs/nodes remain for reuse or are removed; never remove an ID while an authored relationship still needs it. Do not clone or reparent native inputs to simplify an overlay. Preserve native form ownership and DOM reading order.

The existing form implementation has a specific compatibility contract: disconnect clears managed errors, restores original native `noValidate`, removes enhancement-added hints and releases listeners/observers. Generated IDs and hidden error nodes may remain for reuse. `ui-error-summary` retains its heading associations and focusable region markup after disconnect. These existing rules are not replaced by a claim that all authored state is fully restored. Static dialog/popover recipes initialize once and do not observe replacement markup.

## Events and nested ownership

Handle an event only when its source belongs to the instance's declared boundary. A parent must not process a nested widget's keys or commands merely because they bubble through it. Native form association can cross wrapper boundaries: use the actual `control.form`, as the implemented form contract does, rather than treating DOM containment as form ownership.

Cancel only the native default that the component replaces, after checking ownership and whether the event was already cancelled. Keep ordinary input/change/submit/reset/toggle/close behavior native. Do not stop propagation as a general ownership mechanism. Existing form validation intentionally stops invalid submissions before application submit handlers; that documented exception stays in place.

New custom events require a specification of target, trigger, detail, bubbling, composed behavior and cancellation rollback. Initialization, rediscovery and programmatic value assignment must not manufacture user input events. Nested Escape handling belongs to the innermost active interaction; when native popover/dialog dismissal supplies it, avoid a parallel document key listener. A later custom overlay must specify nested dismissal before adding one.

## Focus and overlays

Opening, closing, positioning and task completion are distinct operations. Installation, positioning, resize, theme changes and ordinary reconciliation must not steal focus. A component that moves focus must name the destination, trigger and failure path in its specification.

Use the native [dialog contract](dialog.md) for modal tasks and [popover contract](popover.md) for supplemental non-modal help. Popup geometry supplies no role, accessible name, modal behavior, Tab trap, selection model, announcement or focus policy. A menu or tooltip consumer needs its own complete specification.

On explicit close or Escape from within an overlay, preserve native restoration where it succeeds. Outside activation or an intentional move to another destination must not be followed by unconditional opener focus. If the opener is unavailable, the application chooses a connected, visible, enabled destination in the surviving task; a heading may be programmatically focusable. Do not use the document body as an assumed meaningful fallback.

Before removing a focused/open task, the application chooses the survivor, closes owned overlays from the inside out, cancels its pending work, removes the task and verifies focus at the survivor. Coordinate this sequence with native close handlers so they do not overwrite the chosen destination. Unexpected removal must stop stale work; it cannot reconstruct the application's intended next task. Disconnection does not imply success, submission or reset.

A popover within a dialog must remain in that dialog's light-DOM subtree, so its content belongs to the same task. Keep native top-layer and dismissal behavior; do not implement a second global overlay stack. A new nested-overlay consumer must verify Escape order, outside activation, focus recovery and parent removal in real browsers. Existing static recipes do not claim nested-overlay support.

## Locale, direction and async work

Use authored labels and explicit messages; do not parse visible text to infer commands or state. Respect the effective `lang`, `dir` and writing mode. A specification must state whether configuration is read once or refreshed dynamically. Direction changes must update geometry without resetting selection or focus. Localization of application content remains application-owned.

Current form prefixes are configured before initialization; changing them does not translate existing errors. The synchronous `message` callback and validator must stay synchronous. Follow [form localization](forms.md#localization) and [async integration](forms.md#asynchronous-submission) for the actual supported API, cancellation and response ordering.

New async consumers must associate each result with its current task/request generation, reject stale results after replacement/disconnect, and define retry/cancellation feedback. Abort transport where available and still guard against late completion. Positioning and dismissal never start, cancel or retry a business request on their own.

## Evidence required for a new implementation

A component specification must map ownership rules to executable and manual checks: incomplete/late markup, nested events, repeated initialization, detach/reinsert, cross-document adoption, removal while open/focused, resource cleanup, authored changes during enhancement, cancellation and stale work. Form consumers also verify native names, values, submitters, reset and external association.

Overlay evidence must include real keyboard/pointer dismissal, focus destinations, long content, narrow/zoomed viewports, RTL, nested scroll containers and missing APIs. Record browser versions and dates, screen-reader results and unresolved findings in [ACCESSIBILITY.md](../ACCESSIBILITY.md). Existing results establish only the cases recorded there. These design rules alone close no manual release gate.
