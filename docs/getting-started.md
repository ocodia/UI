# Getting started

Copy `css/ui.css` into your project. Include it before application styles. Add `js/components.js` only if using enhanced forms or error summaries. `js/examples.js` and `js/workspace.js` are demonstration application code, not library entry points.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="css/ui.css">
    <script src="js/components.js" defer></script>
    <title>Projects</title>
  </head>
  <body>
    <ui-skip-link><a href="#main">Skip to main content</a></ui-skip-link>
    <header><h1>Projects</h1></header>
    <main id="main" tabindex="-1">
      <ui-stack>
        <p>Your current projects.</p>
        <ui-grid>
          <ui-panel><article><h2>Field guide</h2><p>In progress</p></article></ui-panel>
          <ui-panel><article><h2>Trail notes</h2><p>Planning</p></article></ui-panel>
        </ui-grid>
      </ui-stack>
    </main>
  </body>
</html>
```

The body's direct children receive content widths and gutters. Use `ui-stack` for vertical rhythm, `ui-cluster` for a wrapping row, `ui-grid` for equal responsive columns, and `ui-sidebar` for two regions that wrap with available space. Components add no implicit landmarks. Supply native `main`, `nav`, `aside`, headings and sections yourself.

Use native buttons for actions and anchors for destinations. Give inputs real labels and names. `ui-field` groups one control and its descriptions; it is not a substitute for `label`. Multiple related choices use `fieldset` and `legend`. See [the exact current form API](reference.md#reusable-forms).

## Before and after enhancement

CSS-only layouts and native controls work without the behavior script. `ui-form` takes over the native validation presentation only when its summary is usable. It preserves valid native submissions. The server still owns validation and persistence. Standalone visible error summaries and native hint associations can be rendered on the server.

An enclosing `ui-form` also adopts explicit server-rendered field errors so correction and reset can clear them. Try the [server-response example](../examples/server-errors.html), then read its [markup contract](reference.md#server-rendered-errors). Enhancement does not move focus during adoption; applications can focus a response summary when their own submission workflow calls for it.

Future complex widgets must define a useful baseline: tabs expose linked sections, trees expose nested lists, charts expose tables. A new widget must not hide content or apply compound-widget roles before its behavior is ready. Task-specific fallback is part of its contract; this does not imply every future interaction works without JavaScript.

## Browser policy

Target the current stable Chrome, Edge, Firefox and Safari on desktop, plus current iOS Safari and Android Chrome. Test browser versions and assistive technology combinations are recorded per release. Feature-detect optional APIs and document fallback. No legacy-browser transpilation or polyfill bundle is currently shipped.

## Theme and scope

Use [semantic CSS variables](theming.md) to brand the interface. UI currently applies global native-element styles. Its cascade layer makes application overrides simple, but it is not a scoped/reset-free embed stylesheet. A scoped distribution is future work; review integration into an existing heavily styled application.

## Run this repository

```sh
python3 -m http.server 8765
```

Open `/examples/` for task-oriented examples or `/gallery.html` for the native-element gallery; `/index.html` is the About page. There is no npm install command today. Use `/tests/accessibility.html` for real-browser checks and `python3 tools/check_docs.py` for documentation integrity.
