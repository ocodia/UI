# Icon

The experimental `ui-icon` loads SVGs from `/icons/` into light DOM. Omit `library` for an asset at the folder root; set it to use a named library such as `fluent` or `fieldwork`. Load `css/ui.css` and optional `js/ui.js`. [Browse root and named icon libraries](../examples/icons.html), try the examples below, or read the [specification](specs/icon.md).

## Choose an icon

```html
<button type="button">
  <ui-icon name="route" aria-hidden="true"></ui-icon>
  Site visit route
</button>
<ui-icon library="fieldwork" name="route" aria-hidden="true"></ui-icon>
```

Without library, name resolves directly to `/icons/{name}.svg`; `route` uses `/icons/route.svg`. With library="fluent", it resolves to `/icons/fluent/{name}.svg`; library="fieldwork" resolves to `/icons/fieldwork/{name}.svg`. Names match filenames without .svg. Library/name accept ASCII letters, digits, hyphens and underscores, starting with a letter/digit. They are case-sensitive. An explicitly empty library is invalid.

Fluent's numeric suffix identifies an optical drawing size. The 16px and 24px variants can differ in detail and stroke weight. Every variant remains scalable: use font-size to set display size, and color for currentColor artwork. No automatic size selection, RTL mirroring or motion is added. Omitted root fill defaults to currentColor; explicit fills, including none and multicolor paints, remain intact.

## Labels and fallback

Decorative is the default. Keep useful visible text alongside unfamiliar or consequential actions. Name an icon-only native button using aria-label on the button; label on ui-icon names only the image. Icons do not add keyboard behavior, focus stops or loading announcements.

For an independently meaningful icon use label, and author role="img" aria-label with the same localized text for the no-script baseline. Prefer accompanying visible status text for essential information.

```html
<ui-icon library="fluent" name="checkmark-circle-20-regular" label="Approved"
         role="img" aria-label="Approved">
  <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="m3 10 4 4L17 4l1 1L7 16l-5-5z"/>
  </svg>
</ui-icon>
```

An optional single inline SVG fallback remains visible while loading, after failure and with scripts blocked. It is hidden only after the requested SVG is validated. Empty icons reserve 1em but have no visible fallback. Use an authored SVG for icon-only controls so they stay recognizable if loading fails. Text, interactive children, nested icons and aria-labelledby on the icon host are unsupported. Keep native control labeling outside ui-icon.

## Custom libraries and deployment

Place a default asset directly in `icons/` and omit library. Place named-library assets in `icons/MyChosenIconLibrary/`, then use library="MyChosenIconLibrary". Both root-level and Fieldwork demo route icons are original stroke-based artwork. Preserve each library's source, version and license; Fluent attribution is in [its README](../icons/fluent/README.md) and [MIT license](../icons/fluent/LICENSE). The supplied Fluent import version is unknown; its documented 20px canvas correction preserves drawing paths.

Icons resolve from the site-root `/icons/` directory, including on nested pages. When using a non-root deployment, the shared script-relative default resolves to its sibling icons directory; the optional base can override that path. To serve icons elsewhere on the same origin, configure the shared script before loading it:

```html
<script src="/assets/js/ui.js" data-ui-icons-base="/assets/icons/" defer></script>
```

The base must be an HTTP(S) directory URL with a trailing slash and no query, fragment or credentials. Remote origins and redirects are unsupported. Serve SVG/XML with the correct MIME type. Use HTTP(S), rather than file URLs. Copy only the assets your application needs; neither the catalogue nor all 20,240 icons are part of the JavaScript payload.

The curated SVG subset includes svg/g/path/circle/ellipse/rect/line/polyline/polygon, viewBox, transforms, geometry, fill/stroke and opacity. Use currentColor to inherit text color. Scripts, style, links, IDs, URL paints, use, gradients, external references, event handlers and foreignObject are rejected. This is a local asset loader, not an upload renderer. Runtime validation reconstructs allowed SVG nodes instead of inserting raw HTML. Assets have a 256 KiB response limit and a 15-second timeout.

Run `python3 tools/build_icons.py` after asset changes to validate files and refresh the icon browser's name index; `--check` verifies it. The runtime needs only individual SVG files. Validate and review custom multicolor artwork in forced colors separately.

## Dynamic use

Call UI.enhance(container) after inserting/reinserting icons. Existing hosts observe name, library and label changes. UI.destroy(container) releases observers, generated SVG and owned attributes; application attributes changed since enhancement are preserved on teardown. Destroy before editing fallback content. Explicit enhance retries failed icons; there is no automatic retry loop or fetch on label changes.

The read-only data-ui-icon-state attribute reports loading, ready or error. Failed requests are not cached; identical pending requests are shared and up to 256 validated templates are retained. Disconnect/adoption releases ownership; stale completions cannot update removed/destroyed hosts. Shared requests may finish for other consumers after one host is destroyed. No custom events or element properties are added.

[Focused browser checks](../tests/icon.html) cover loading, naming, lifecycle, hostile/invalid SVG, local paths and composition. Manual platform and assistive-technology release work remains open in [the evidence record](../ACCESSIBILITY.md).
