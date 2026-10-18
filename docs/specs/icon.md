# Icon specification

## Identity and purpose

Experimental Phase 2 media component. `ui-icon` loads a local SVG by filename into light DOM, using `/icons/{name}.svg` unless a library folder is supplied. It enhances by element name through `js/ui.js`; it adds no custom-element registration. Use native inline SVG directly when loading or switching assets is unnecessary. Applications own the meaning and action of containing buttons/links.

## Minimal markup

```html
<link rel="stylesheet" href="css/ui.css">
<script src="js/ui.js" defer></script>
<button type="button">
  <ui-icon library="fluent" name="arrow-download-20-regular" aria-hidden="true">
    <svg viewBox="0 0 20 20" focusable="false" aria-hidden="true"><path fill="currentColor" d="M9 2h2v10l3-3 1 1-5 5-5-5 1-1 3 3zM3 17h14v2H3z"/></svg>
  </ui-icon>
  Download CSV
</button>
```

The optional fallback is one authored inline SVG, plus whitespace. It remains in place while loading, on failure and without JavaScript. No interactive or text children, nested icons or authored `data-ui-icon-svg` markers are supported. Meaningful icons need an authored `role="img" aria-label="…"` for a named no-script baseline as well as `label="…"`. Prefer visible adjacent text for essential information.

## Public contract

| Surface | Contract |
| --- | --- |
| `name` | Required filename stem, case-sensitive ASCII letters/digits/underscore/hyphen, starting with a letter/digit. No extension, slash, dot or URL. |
| `library` | Optional same-syntax library folder. Omitted means `icons/{name}.svg`; explicit values (such as `fluent`) mean `icons/{library}/{name}.svg`. Empty or invalid values fail locally. |
| `label` | Trimmed nonempty text gives the host `role="img"` and `aria-label`; absent/empty means decorative `aria-hidden="true"`. Author other ARIA on the native containing control, not this host. |
| Script `data-ui-icons-base` | Optional directory URL on the shared script, relative to document base. Defaults to `../icons/` relative to that script's URL. Same-origin HTTP(S) only, no query/fragment/credentials. A trailing slash is required. |
| Properties/methods/events | No element properties, methods or custom events. Use attributes and synchronous, idempotent `UI.enhance(root)` / `UI.destroy(root)`; fetch completion is asynchronous. Explicit enhance retries errors. |
| State | Owned `data-ui-icon-state="loading|ready|error"`. `data-ui-icon-svg` marks only the generated SVG. No live region or busy announcement. |
| CSS | `1em` inline/block box aligned to text; change font-size/color with ordinary CSS. No icon-specific tokens. SVG fills/strokes using currentColor inherit text color. Omitted root fill defaults to currentColor; explicit none/multicolor paint remains explicit. |

Optical filename sizes identify separately drawn assets; CSS can scale any asset. Preserve viewBox/aspect ratio. No automatic RTL flipping, animation or icon-name aliases. Native controls own disabled state, focus, activation and form values.

## Interaction and accessibility

Icons never become focus stops, add keyboard handlers, move focus or announce loading. The generated SVG is always aria-hidden and focusable=false; the host owns meaningful naming. Use a visible text label for unfamiliar actions. An icon-only native button requires its own accessible name and an authored visual fallback. Label changes update immediately, without a request. Decorative icons do not contribute text to command menu typeahead. Icons inherit forced-colors text colors through currentColor; multicolor art needs its own design review. Direction follows authored artwork and filenames.

## Lifecycle and failure

Static icons initialize after parsing. Newly inserted/reinserted icons require UI.enhance; observed name/library changes reload existing instances, and label changes rename them. Empty/invalid attributes produce error without fetching. Removed/adopted hosts release ownership; explicit destroy restores fallback and enhancement-written attributes without overwriting newer application changes. Reconnect needs explicit enhance. Do not mutate fallback children while enhanced; destroy first. Unsupported markup stays untouched.

Only requested local assets are fetched. Concurrent identical requests share a promise; completed validated templates use an LRU cache of 256 assets. Pending requests are bounded to 256; excess requests fail and can be retried with enhance. Request timeout is 15 seconds and maximum response size is 256 KiB. Destroy or attribute change invalidates that host's result; a shared in-flight request may finish for other consumers. Older responses cannot overwrite newer names or reinsert into destroyed/detached hosts. Failed requests are not cached. Missing fetch/DOMParser/MutationObserver/AbortController leaves the baseline untouched.

SVG is reconstructed using an allowlist: svg, g, path, circle, ellipse, rect, line, polyline, polygon; geometry, transform, fill/stroke and opacity attributes only. Reject DOCTYPE/entities, script, style, foreignObject, event handlers, links, IDs, URL paints, external references and unsupported elements/attributes. Root must be an SVG-namespace svg with a finite positive viewBox. Only literal colors/currentColor/none and finite numeric paint values are allowed. No definitions/gradients/use references in this first contract. The library is curated local content, not a user SVG upload facility. Responses must stay same-origin, have an SVG/XML MIME type, and pass validation. Keep a useful fallback on all failures.

## Examples and evidence

See [the guide](../icon.md), generated component previews and [focused checks](../../tests/icon.html) for download actions, document commands with hr dividers, invoice statuses, icon-only controls, custom libraries, errors and a bounded searchable Fluent browser. Browser and manual/platform evidence is recorded separately in [ACCESSIBILITY.md](../../ACCESSIBILITY.md). No form, selection, key map or dismissal API is applicable to this noninteractive component.

## Completion

Keep current reference, architecture, catalogue, README, shared-entry source list, examples and roadmap synchronized. Experimental maturity remains until manual screen-reader, forced-colors and browser/platform release checks have evidence.
