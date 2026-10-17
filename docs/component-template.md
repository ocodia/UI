# Component specification template

Copy this structure into `docs/specs/<component>.md` before implementing a planned widget. Replace every placeholder with a decision. Link the resulting specification from the catalogue; a proposed name alone is not an API.

## Identity and purpose

Name, status (proposal / experimental / stable / deprecated), owner, roadmap phase, intended task and when a simpler native pattern is preferable. List baseline native HTML and supported modes. Explain why a custom element is needed.

## Minimal markup

Provide a complete, valid light-DOM example with real labels, IDs, controls and useful no-JavaScript content. Show required children, optional children and forbidden nesting. Mark script-dependent controls hidden until enhancement is ready. Include the exact CSS/JS files needed.

## Public contract

| Surface | Specify |
| --- | --- |
| Attributes | Name, type, default, valid values, reflection, invalid-value behavior |
| Properties | Type, initial value, relationship to attributes, framework use |
| Methods | Arguments, return type, side effects, failure/async behavior |
| Events | Name, trigger, target, detail schema, bubbling, composed, cancellation |
| Native state | Which element owns value, disabled, checked/selected, expanded and validity |
| CSS variables | Role, default, scope, inheritance, light/dark behavior |

Document no invented events for native operations. Include examples for controlled updates without event loops. Declare focus/selection behavior for programmatic changes.

## Interaction and accessibility

Specify accessible names, roles/states and relationships; exact key map; Tab entry/exit; pointer and touch; initial/return focus; Escape and dismissal; live announcements; disabled/busy/read-only behavior; localization and RTL. Link the appropriate APG pattern when applicable.

## Lifecycle and failure

Define incomplete markup, missing browser APIs, unavailable JavaScript, late children, nested instances, dynamic removal, disconnect/reconnect, generated IDs, owned DOM changes, cleanup and invalid configuration. For forms: name/value serialization, FormData, required/custom validity, reset, autofill and server errors. For async behavior: cancellation, stale responses, loading and retry.

## Examples and evidence

Supply default, long/localized content, disabled, busy, empty, invalid, error/success, narrow screen and nested cases where relevant. List keyboard assertions and browser/assistive technology results with dates and versions. Record axe incomplete findings and manual outcomes; no automatic conformance badges.

## Completion

Update the implementation, current API, catalogue status, example hub, roadmap and migration notes together. A component can be experimental while evidence is gathered; mark stable only after the [release gate](../ROADMAP.md#release-gate-for-every-component) is satisfied.
