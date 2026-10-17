# Contributing to UI

Read [AGENTS.md](AGENTS.md), [architecture](docs/architecture.md) and [UI conventions](docs/conventions.md). Keep native HTML useful, behavior optional, all DOM light, and application concerns out of the library.

## A complete component change

1. Choose one catalogue entry or a closely related compound family. Define its contract using [the template](docs/component-template.md) before implementation.
2. Implement the minimal usable pattern and lifecycle; do not bulk-register placeholder elements for planned features.
3. Add examples with real states, labels and readable failure/fallback content.
4. Test the behavior that could fail: keyboard/focus, value/reset, dismissal, nested ownership, async races, reconnect or dynamic children as appropriate.
5. Update current API documentation, catalogue status, roadmap and evidence. Preserve migration notes for changed public behavior.

No npm toolchain is required. Serve the root with `python3 -m http.server 8765`.

## Checks

```sh
python3 tools/build_catalog.py --check
python3 tools/build_docs.py --check
python3 tools/test_docs.py
python3 tools/check_docs.py
```

Open `tests/accessibility.html` and run the component, no-JavaScript and axe checks for behavior/style changes. Axe loads pinned test-only code from jsDelivr and needs a network connection. A zero-violation report does not mean manual checks passed. The theme workbench includes both brands in light/dark audits.

Check Chrome/Edge/Firefox/Safari plus relevant mobile and screen-reader combinations for release readiness. Include 320px reflow, 200% text resize, 400% zoom, text spacing, forced colors, RTL, reduced motion and keyboard-only use. Record actual versions and outcomes in `ACCESSIBILITY.md` or the component specification. Do not claim unperformed tests.

Documentation changes need link/inventory checks. Reversible copy-only edits do not require new behavior tests. Add meaningful assertions when introducing or changing widget behavior.

## Catalogue maintenance

`docs/components.json` is the single source for reference coverage and UI-specific primitives. Every reference entry has a route, implementation status, delivery phase, original contract, acceptance work and source URL. `tools/build_catalog.py` generates `docs/components.md` and `examples/components.html`; do not hand-edit them. Changing the JSON never implements a runtime component.

Statuses track implementation scope, not release maturity. Names in planned entries remain proposals. Native recipes are not promises of another library's complete feature set. Revisit external scope at milestones; keep the reviewed date honest.

The complete site is generated with `python3 tools/build_docs.py`. Markdown guides stay the source; `docs/recipes.json` drives both live previews and their code drawers. Component API notes live in `tools/component_contracts.py`. Do not hand-edit generated guide, component or preview HTML. Use the [documentation authoring contract](docs/site.md) and run the documentation browser checks after changing navigation or the example runner.

## Dependencies and compatibility

Avoid runtime dependencies for native patterns. Evaluate optional dependencies separately for charts, Markdown, QR and other specialist work. Preserve plain-file usage while introducing optional modules or packages. Light DOM and low-specificity CSS are part of the public contract. Keep legacy class helpers and token fallback aliases until migration is documented.
