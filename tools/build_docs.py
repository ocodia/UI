#!/usr/bin/env python3
"""Build the complete static docs site from Markdown, catalogue and example sources."""
import argparse
from html import escape
import json
from build_catalog import generate as catalogue
from site_shell import ROOT, document, sidebar, markdown, relative
from site_content import example_markup
from build_ui import generate as combined_ui
from build_icons import generate as icon_catalogue


def generate():
    data = json.loads((ROOT/'docs/components.json').read_text())
    recipes = json.loads((ROOT/'docs/recipes.json').read_text())
    pages = catalogue()
    sources = {p.stem: p.relative_to(ROOT).as_posix() for p in (ROOT/'docs').glob('*.md') if p.stem not in ['README','components']}
    sources.update({f'specs/{p.stem}': p.relative_to(ROOT).as_posix() for p in (ROOT/'docs/specs').glob('*.md')})
    sources.update({'index':'docs/README.md', 'accessibility':'ACCESSIBILITY.md', 'roadmap':'ROADMAP.md', 'contributing':'CONTRIBUTING.md'})
    for slug, source in sources.items():
        page = f'docs/{slug}.html'
        text = (ROOT/source).read_text()
        title = next(line[2:] for line in text.splitlines() if line.startswith('# '))
        body, toc = markdown(text, source, page)
        recipe_key = {'dialog':'dialog-guide'}.get(slug,slug)
        if recipe_key in recipes:
            shared_index = {'dialog': 1, 'popover': 2, 'popup': 3}.get(slug)
            shared_example = example_markup('enhancement', shared_index, recipes['enhancement'][shared_index], page) if shared_index is not None else ''
            body += '<h2 id="interactive-examples">Interactive examples</h2>'+shared_example+''.join(example_markup(recipe_key,i,r,page) for i,r in enumerate(recipes[recipe_key]))
            toc = toc.replace('</ul>', '<li><a href="#interactive-examples">Interactive examples</a></li></ul>')
        body += f'<p class="doc-source">Generated from <a href="{relative(source,page)}">{escape(source)}</a>. The source and this page share one contract.</p>'
        pages[page] = document(page,title,body,side=sidebar(page,data),toc=toc,scripts=['js/docs.js'])
    # The long machine catalogue remains available as a rendered reference too.
    page = 'docs/components.html'
    body,toc = markdown(pages['docs/components.md'],'docs/components.md',page)
    pages[page] = document(page,'Complete catalogue',body,'Components',sidebar(page,data),toc)
    page = 'index.html'
    body = '''<section class="hero"><p class="eyebrow">An HTML-first UI system</p><h1>Start with HTML.<br>Build with UI.</h1><p>Native controls, useful composition and optional light-DOM behavior. A small foundation for interfaces that keep the browser working for you.</p><ui-cluster><a href="docs/getting-started.html">Get started →</a><a href="examples/components.html">Explore components</a></ui-cluster></section>
<ui-grid class="home-grid"><ui-panel><article><h2>HTML owns meaning</h2><p>Real buttons, inputs and forms keep their labels, values and platform behavior. CSS-only wrappers add the arrangement.</p><a href="docs/reference.html">Read the current API</a></article></ui-panel><ui-panel><article><h2>Build a coherent interface</h2><p>Spacing, type, semantic colors and focus tokens share a theme contract. Comfortable and compact layouts keep control sizes independent.</p><a href="examples/themes.html">Try the theme workbench</a></article></ui-panel><ui-panel><article><h2>Read it. Try it. Inspect it.</h2><p>Every shipped guide is readable here. Component examples have source drawers and resizable previews.</p><a href="docs/components/checkbox.html">Try the checkbox examples</a></article></ui-panel></ui-grid>
<section><h2>What is available today</h2><p>UI ships as plain CSS and optional JavaScript. Eleven primitives cover layout and form coordination; native recipes cover the platform controls. The searchable catalogue also records planned components, clearly separated from implemented APIs.</p><p>This is a system in development. Browser checks provide partial evidence; broader accessibility and release verification remain open.</p><ui-cluster><a href="examples/index.html">Examples & recipes</a><a href="gallery.html">Native element gallery</a><a href="workspace.html">Fieldwork application</a><a href="docs/accessibility.html">Read the evidence</a></ui-cluster></section>'''
    pages[page] = document(page,'About',body,'About')
    return pages


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check',action='store_true')
    args = parser.parse_args()
    stale = []
    icons = ROOT/'icons/catalogue.json'
    icon_content = icon_catalogue()
    if args.check:
        if not icons.exists() or icons.read_text() != icon_content: stale.append('icons/catalogue.json')
    else:
        icons.write_text(icon_content)
    ui = ROOT/'js/ui.js'
    if args.check:
        if not ui.exists() or ui.read_text() != combined_ui(): stale.append('js/ui.js')
    else:
        ui.write_text(combined_ui())
    pages = generate()
    for name, content in pages.items():
        path = ROOT/name
        if args.check:
            if not path.exists() or path.read_text() != content: stale.append(name)
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
    if stale: raise SystemExit('Stale documentation output: '+', '.join(stale)+'. Run python3 tools/build_docs.py')
    print(f'{len(pages)} generated documentation files '+('are current.' if args.check else 'written.'))


if __name__ == '__main__': main()
