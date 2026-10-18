# Documentation authoring

The full build regenerates `js/ui.js` from its three behavior sources before rendering examples. Preview URLs fingerprint the combined script and foundation CSS as well as recipe dependencies; rebuild after those sources change. Code drawers include the combined entry required for the markup.

The documentation site uses UI's own foundation: `css/ui.css`, `ui-sidebar`, `ui-stack`, `ui-grid`, `ui-panel`, `ui-cluster`, native controls and native details. The site-specific shell and example runner are application code in `css/site.css`, `js/docs.js` and `js/docs-preview.js`. They are not library entry points and register no elements.

## Sources and generated pages

Markdown in `docs/` remains the source for the complete guides, including controls, density, forms, theming, architecture and the current reference. Markdown specifications under `docs/specs/` render to matching `docs/specs/*.html` pages. Root accessibility, roadmap and contributing documents are rendered too. Pages contain static HTML, section links, a guide/component sidebar and an on-page contents list. Content does not depend on fetching Markdown in the browser.

`docs/components.json` owns component identity, status, contract and acceptance work. An optional repository-relative `specification` path links the rendered proposal and its source from the component page and catalogue. `tools/site_content.py` and `tools/component_contracts.py` add component-specific native integration notes and API tables. Every catalogue entry and existing UI primitive gets its own page in `docs/components/`. Native/foundation routes have authored live examples where assets are available. Planned entries show their proposal and acceptance work without pretending to be implemented.

`docs/recipes.json` owns each live example's title, HTML, optional application JavaScript and explanatory note. Each example generates a standalone file in `docs/previews/`; its source is also escaped into the code drawer. The same source drives the preview and the drawer. An optional `dependencies` array lists trusted repository-relative `js/*.js` files loaded synchronously before that recipe's application script; generated previews fingerprint those files. The code drawer shows those dependencies too. Rebuild after editing a dependency such as `js/popup.js`. Never edit generated HTML to change a recipe.

## Build and verify

```sh
python3 tools/build_docs.py
python3 tools/build_docs.py --check
python3 tools/check_docs.py
python3 -m http.server 8765
```

Rebuild after editing Markdown, recipe sources, generators or `js/docs-preview.js`; the preview script fingerprint is generated from its contents. Commit generated files with their sources. The static site can be served from a subdirectory; generated links are relative. `build_catalog.py` still builds the catalogue views and component/example pages; `build_docs.py` builds those plus the complete guides and About page. `check_docs.py` checks freshness for the whole site, local links, unique IDs and registration agreement.

The small Python renderer supports the Markdown used here: headings, paragraphs, lists, code fences, inline code/emphasis, links and tables. Raw HTML is escaped. It is a documentation renderer, not a general CommonMark engine or an untrusted-content service. Extend it deliberately when introducing a new syntax, then check the rendered page. Do not add a browser Markdown dependency to display checked-in guides.

## Example frame contract

Each live example has a named iframe, a native Code disclosure, a standalone destination and, after enhancement, a width slider, edge handle, reset and copy action. Frames load trusted, checked-in generated HTML only. The runner does not execute source typed or pasted by visitors. Preview CSS is isolated by the iframe; its markup uses the same UI stylesheet as the docs.

The frame sandbox allows same-origin access, scripts and forms for native behavior and accessibility checks, but does not grant top navigation or popups. These flags are not a security boundary for arbitrary same-origin code; reviewed repository examples are the trust boundary. Do not introduce untrusted scripts or remote user HTML into this runner.

Inside the documentation runner, the host example heading replaces the frame’s visually hidden document heading. Other embeddings, including test frames, retain that document heading inside the preview’s main landmark. Generated previews include a content fingerprint on the preview-script URL so changed markup and heading/submit behavior load together instead of reusing a cached older script.

The host synchronizes its root theme, brand, reading direction and explicit focus-token overrides into each loaded preview, including subsequent root changes. Other application CSS stays isolated. Standalone previews follow the system theme unless given their own root attributes.

The preview script handles ordinary valid form submissions locally and reports serialized native values. Preview-only CSS keeps those local submit actions hidden until that guard is installed, with a no-script explanation beside editable controls. It leaves dialog close forms alone and respects submissions already cancelled by a recipe application handler. A recipe can use preventDefault to render a task-specific local result, such as the newsletter preview, without an additional generic value report. There is no preview backend, upload or persistence. The frame height message is accepted only from that exact iframe window and the site's origin; height is bounded. Essential content is still in static HTML when scripts fail.

Width resizing works with a native range input or pointer drag. The handle also supports Left/Right, Shift for larger steps, and Home/End. RTL reverses pointer/arrow direction. Width stays within the available container; Reset returns it to full width. Resizing changes the iframe viewport, so actual viewport-responsive CSS responds too. A native CSS resize affordance remains when the host script is unavailable. The Code disclosure and source stay readable without JavaScript. Copy failure opens the source drawer and gives a selectable-code alternative.

The runner initializes once on a static page. It has no dynamic insertion API; its listeners and resize observers live for the page lifetime. Page navigation releases them. Future client-side routing must add explicit teardown before reusing this implementation.

## Navigation and compatibility

The top-level destinations are About, Components, Docs, Themes and Tests. Recipes, native gallery and Fieldwork are linked from Docs and the examples hub. `index.html` is now About; the original element gallery is retained at `gallery.html`. Existing gallery fragment destinations should use that path. Source Markdown remains available through each rendered guide's source link.

## Review checklist

- Keep all authored guide content visible in its rendered counterpart and preserve fragment names when rewriting local links.
- Keep planned and implemented surfaces distinct. Do not label a component stable without release evidence.
- Check source/preview agreement, native form behavior, Code disclosure, width controls, fallback and copy denial.
- Verify the shared navigation, 320px LTR/RTL reflow, light/dark modes, zoom, keyboard and platform settings.
- Run the repository browser checks and record actual outcomes in the accessibility evidence source. Automated checks do not certify conformance.
