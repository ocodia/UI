# UI

An HTML-first UI system: native controls, accessible interaction patterns, `ui-` elements for composition, and CSS variables for theming.

UI is growing from a CSS foundation into a complete interface library. The foundation and form coordination work today. The full component suite is being designed and built in stages. **Planned components are not available APIs.**

For existing integrations, see the [rename and migration notes](docs/reference.md#migration).

## Start with HTML

```html
<link rel="stylesheet" href="css/ui.css">
<!-- Optional behavior for ui-form and ui-error-summary -->
<script src="js/ui.js" defer></script>

<ui-form>
  <form action="/projects" method="post">
    <ui-field>
      <label for="project">Project name</label>
      <ui-hint id="project-hint">Use a short, recognisable name.</ui-hint>
      <ui-error hidden>Error: Enter a project name</ui-error>
      <input id="project" name="project" aria-describedby="project-hint" required>
    </ui-field>
    <button type="submit">Create project</button>
  </form>
</ui-form>
```

The native form owns submission. UI adds linked errors and focus management. Basic controls and content work before JavaScript loads. There is no required build step, framework, runtime dependency, or package manager.

## What exists today

| Layer | Available now |
| --- | --- |
| Native HTML | Typography, lists, tables, media, form controls, disclosures, dialog and popover styling |
| Control presentation | Native button variants and control sizes; [contract](docs/controls.md). Comfortable/compact composition; [density](docs/density.md) |
| Composition | `ui-stack`, `ui-cluster`, `ui-grid`, `ui-sidebar`, `ui-panel` |
| Form structure | `ui-field`, `ui-hint`, `ui-error`, `ui-skip-link` |
| Optional behavior | Combined `js/ui.js`: forms/summaries, declarative dialog/popover/Popup setup and opt-in Accordion/Tabs; [shared API](docs/enhancement.md). Original smaller entries remain available. |
| Themes | System/light/dark, spacing/type/radius scales, semantic state/focus tokens, an optional forest brand |
| Examples | Element gallery, complete form, Fieldwork workspace, recipes, server error recovery, async form integration, native input values and theme workbench |

Only the two behavior elements are registered with `customElements`. CSS-only elements need no registration. Existing `.stack`, `.cluster`, `.grid`, and `.table-scroll` helpers remain supported.

## The complete system

The [roadmap](ROADMAP.md) covers every entry in the reviewed [Web Awesome catalogue](https://webawesome.com/docs/components), including companion items, media, helpers, and data visualization. Each maps to a native HTML recipe, an existing UI primitive, or a proposed enhancement. The ambition is comparable breadth with UI's own conventions; this is not API or feature parity.

- Native HTML supplies meaning, form values, and platform behavior.
- Light DOM throughout keeps content inspectable and application styling predictable.
- `ui-` elements add arrangement or compound behavior where it helps.
- Minimal classes; useful defaults; explicit variants only when needed.
- CSS variables separate brand, semantic states, and component geometry.
- Current Chrome, Edge, Firefox, and Safari, with progressive enhancement.
- Plain CSS and JavaScript first; optional packages and individual modules come later.

Accessibility is a component release requirement. The target is WCAG 2.2 AA, informed by GOV.UK and WAI-ARIA APG. Current automated results are partial evidence, not a completed accessibility audit. Read the [test record](ACCESSIBILITY.md#recorded-checks-16-october-2026).

## Documentation

Start with the [documentation guide](docs/README.md), then use:

For the website, open the [rendered documentation](docs/index.html). Every guide is available as a full HTML page; component pages include live, resizable examples and native Code drawers. Markdown remains the authoring source.

| Task | Read |
| --- | --- |
| Build a page | [Getting started](docs/getting-started.md) and [current API](docs/reference.md) |
| Choose a component | [Component coverage and contracts](docs/components.md) |
| Theme an interface | [Theming](docs/theming.md) |
| Design interactions | [UI conventions](docs/conventions.md) |
| Implement a component | [Architecture](docs/architecture.md), [component template](docs/component-template.md), [contributing](CONTRIBUTING.md) |
| Work with a coding agent | [AGENTS.md](AGENTS.md), [llms.txt](llms.txt), [machine-readable catalogue](docs/components.json) |

## Examples and checks

Run `python3 -m http.server 8765` from this directory. Open [the example hub](http://localhost:8765/examples/), [component explorer](http://localhost:8765/examples/components.html), or [browser checks](http://localhost:8765/tests/accessibility.html).

The existing [element gallery](gallery.html), [complete form](form.html), and [Fieldwork workspace](workspace.html) remain available. New examples use working features only; proposed components are described as contracts in the explorer.

Phase 1 starts with the [native dialog recipe](docs/dialog.md): [try opening and dismissing it](examples/patterns.html#modal), with inline information retained when enhancement is unavailable.

The [native-value recipe](examples/native-inputs.html) adds grouped hints/errors, date/time/file/range values and [server responsibilities](docs/forms.md#native-dates-times-files-and-ranges). It inspects values locally without uploading files.

The [survey briefing](examples/composition.html) combines nested panels, named table/notes scroll regions and native multiple selection. See its [composition contract](docs/reference.md#panels-scroll-regions-and-multiple-selection).

Run documentation checks with `python3 tools/check_docs.py`. After changing the catalogue, run `python3 tools/build_catalog.py`; generated files are committed so reading docs needs no generator.

The [long dialog briefing](docs/previews/dialog-1.html) demonstrates heading focus, native scrolling, close actions at both ends and full inline fallback. See the [dialog contract](docs/dialog.md#long-briefing-and-scrolling) and [focused checks](tests/dialog.html).

The [native popover recipe](docs/popover.md) adds short/long help, native disclosure and dismissal, background editing and complete inline fallback.

The [shared UI JavaScript guide](docs/enhancement.md) shows single-copy declarative overlays and `UI.enhance(root)` / `UI.destroy(root)` for dynamic applications. Load `js/ui.js` once; standard component examples need no per-instance initialization script.

The [lifecycle and ownership contract](docs/lifecycle.md) guides new behavior. The separate optional [Popup adapter](docs/popup.md) provides experimental anchored geometry with `js/popup.js`, native popover dismissal and complete inline fallback.

The [native family state audit](docs/native-states.md) maps native examples to relevant states and remaining platform verification.

After changing guides, live recipe sources, site generators or `js/docs-preview.js`, run `python3 tools/build_docs.py` to rebuild the complete static site, then `python3 tools/test_docs.py`. See [documentation authoring](docs/site.md). The shared navigation is About, Components, Docs, Themes and Tests; recipes and the gallery remain accessible through Docs and the examples hub.

## License

[MIT](LICENSE). Reference systems inform scope and interaction design; UI uses its own implementation, vocabulary, and documentation.

The experimental [Accordion pattern](docs/accordion.md) composes native `details`/`summary` inside `ui-accordion data-ui="accordion"`. The combined entry adds summary navigation, fragment reveal and focus recovery; expansion and optional single-open name groups remain native.

The experimental [Tabs pattern](docs/tabs.md) enhances real fragment links and readable sections inside `ui-tabs` with a named `ui-tablist`, with manual activation by default, optional automatic activation, nested error reveal and scoped cleanup.
