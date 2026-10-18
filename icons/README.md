# Local SVG libraries

Omit `library` to load `icons/{name}.svg` directly. Set `library="fluent"` to load `icons/fluent/{name}.svg`, or use a custom folder such as `library="MyChosenIconLibrary"`. Names are case-sensitive and contain ASCII letters, digits, hyphens or underscores, starting with a letter/digit. Serve files over same-origin HTTP(S) with image/svg+xml MIME type. Copy only the libraries/assets an application uses; the shared JavaScript does not bundle this directory.

Run `python3 tools/build_icons.py` after adding/changing assets. It validates the curated SVG contract and regenerates catalogue.json for the documentation icon browser. Run with --check in verification. The runtime does not need the catalogue. Keep source/version/license information in every redistributed library. See [the icon guide](../docs/icon.md) for the supported SVG subset, deployment paths, accessibility and fallback markup.
