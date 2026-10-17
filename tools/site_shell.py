"""Shared static documentation shell and a renderer for this repository's Markdown.

No runtime fetches or third-party Markdown dependency. Raw HTML is escaped; fenced
examples are never executed by the renderer. Live examples are separately authored.
"""
from html import escape
from pathlib import Path
import posixpath
import re
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
GUIDES = [
    ('Start here', [('index', 'Documentation'), ('getting-started', 'Getting started'), ('reference', 'Current API')]),
    ('Build interfaces', [('controls', 'Buttons & control sizes'), ('forms', 'Form integration'), ('native-states', 'Native family states'), ('dialog', 'Native dialog'), ('popover', 'Native popover'), ('density', 'Density'), ('conventions', 'Interaction conventions')]),
    ('Customize', [('theming', 'Theming & tokens')]),
    ('Project', [('architecture', 'Architecture'), ('accessibility', 'Accessibility & evidence'), ('roadmap', 'Roadmap'), ('contributing', 'Contributing'), ('component-template', 'Specification template'), ('site', 'Documentation authoring')]),
]
TOP = [('About', 'index.html'), ('Components', 'examples/components.html'), ('Docs', 'docs/index.html'), ('Themes', 'examples/themes.html'), ('Tests', 'tests/accessibility.html')]


def relative(target, page):
    return posixpath.relpath(target, posixpath.dirname(page) or '.')


def navigation(page, active):
    links = ''.join(f'<li><a href="{relative(path, page)}"'+(' aria-current="page"' if label == active else '')+f'>{label}</a></li>' for label, path in TOP)
    return f'<nav aria-label="Primary" data-site-nav><ul>{links}</ul></nav>'


def sidebar(page, data):
    groups = []
    for title, items in GUIDES:
        links = ''.join(f'<li><a href="{relative("docs/"+slug+".html", page)}"'+(' aria-current="page"' if page == 'docs/'+slug+'.html' else '')+f'>{label}</a></li>' for slug, label in items)
        groups.append(f'<details open><summary>{title}</summary><ul>{links}</ul></details>')
    groups.append(f'<p><a href="{relative("examples/index.html", page)}">Examples & recipes</a></p>')
    for category in dict.fromkeys(item['category'] for item in data['components']):
        items = [item for item in data['components'] if item['category'] == category]
        links = ''.join(f'<li><a href="{relative("docs/components/"+item["id"]+".html", page)}"'+(' aria-current="page"' if page.endswith('/'+item['id']+'.html') else '')+f'>{item["name"]}'+(' <small>Planned</small>' if item['status'] == 'planned' else '')+'</a></li>' for item in items)
        opened = ' open' if any(page.endswith('/'+i['id']+'.html') for i in items) else ''
        groups.append(f'<details{opened}><summary>{category}</summary><ul>{links}</ul></details>')
    links = ''.join(f'<li><a href="{relative("docs/components/"+item["id"]+".html", page)}"'+(' aria-current="page"' if page.endswith('/'+item['id']+'.html') else '')+f'>{item["id"]}</a></li>' for item in data['uiComponents'])
    groups.append(f'<details open><summary>UI primitives</summary><ul>{links}</ul></details>')
    return '<details class="docs-navigation"><summary>Browse documentation</summary><nav aria-label="Documentation" class="docs-sidebar">'+''.join(groups)+'</nav></details>'


def document(page, title, body, active='Docs', side='', toc='', description='Native HTML, light-DOM composition and optional behavior.', scripts=()):
    style = relative('css/site.css', page)
    script_tags = ''.join(f'<script src="{relative(path, page)}" defer></script>' for path in scripts)
    content = f'<div class="docs-reading"><article class="docs-article">{body}</article>{toc}</div>' if side else body
    content = f'<ui-sidebar class="docs-layout">{side}{content}</ui-sidebar>' if side else content
    return f'''<!doctype html>
<!-- Generated documentation. See tools/build_docs.py and tools/build_catalog.py. -->
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{escape(description, quote=True)}">
  <title>{escape(title)} — UI</title>
  <link rel="stylesheet" href="{relative('css/ui.css', page)}">
  <link rel="stylesheet" href="{style}">
{script_tags}
</head>
<body>
  <ui-skip-link><a href="#main">Skip to content</a></ui-skip-link>
  <header class="site-header"><a class="site-wordmark" href="{relative('index.html', page)}">UI <span>HTML first</span></a>{navigation(page, active)}</header>
  <main id="main" tabindex="-1" aria-label="{escape(title, quote=True)} documentation">{content}</main>
  <footer class="site-footer"><p>UI · Native HTML. Useful composition.</p><p><a href="{relative('docs/accessibility.html', page)}">Accessibility & evidence</a> · <a href="{relative('docs/roadmap.html', page)}">Roadmap</a> · <a href="{relative('examples/index.html', page)}">Examples</a></p></footer>
</body>
</html>
'''


def rewrite_link(raw, source, page):
    url = urlsplit(raw)
    if url.scheme or url.netloc or not url.path:
        return raw
    target = posixpath.normpath(posixpath.join(posixpath.dirname(source), url.path))
    root_docs = {'ACCESSIBILITY.md': 'docs/accessibility.html', 'ROADMAP.md': 'docs/roadmap.html', 'CONTRIBUTING.md': 'docs/contributing.html'}
    if target in root_docs:
        target = root_docs[target]
    elif target.startswith('docs/') and target.endswith('.md'):
        target = target[:-3]+'.html' if target != 'docs/README.md' else 'docs/index.html'
    return relative(target, page)+('?' + url.query if url.query else '')+('#' + url.fragment if url.fragment else '')


def inline(value, source, page):
    tokens = []
    def keep(html):
        tokens.append(html)
        return f'\x00{len(tokens)-1}\x00'
    def token(match):
        if match[1] is not None: return keep('<code>'+escape(match[1])+'</code>')
        return keep(f'<a href="{escape(rewrite_link(match[3].strip("<>"), source, page), quote=True)}">{inline(match[2], source, page)}</a>')
    value = re.sub(r'`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)', token, value)
    value = escape(value)
    value = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', value)
    value = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'<em>\1</em>', value)
    return re.sub(r'\x00(\d+)\x00', lambda m: tokens[int(m[1])], value)


def markdown(text, source, page):
    lines = text.splitlines()
    output, headings, counts = [], [], {}
    current_section, table_count = 'Reference', 0
    i = 0
    def fmt(s): return inline(s, source, page)
    def list_at(start, indent):
        position = start
        first = re.match(r'^(\s*)([-*]|\d+\.)\s+(.+)', lines[start])
        kind = 'ol' if first[2][0].isdigit() else 'ul'
        items = []
        while position < len(lines):
            m = re.match(r'^(\s*)([-*]|\d+\.)\s+(.+)', lines[position])
            if not m or len(m[1]) != indent or ('ol' if m[2][0].isdigit() else 'ul') != kind: break
            value = re.sub(r'^\[([ x])\]\s*', lambda c: '✓ ' if c[1] == 'x' else '○ ', m[3])
            item = '<li>'+fmt(value)
            position += 1
            while position < len(lines):
                child = re.match(r'^(\s*)([-*]|\d+\.)\s+(.+)', lines[position])
                if not child or len(child[1]) <= indent: break
                html,position = list_at(position,len(child[1]))
                item += html
            items.append(item+'</li>')
        return f'<{kind}>'+''.join(items)+f'</{kind}>',position
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.startswith('```'):
            language = line[3:].strip()
            code = []
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                code.append(lines[i]); i += 1
            output.append(f'<pre><code data-language="{escape(language)}">'+escape('\n'.join(code))+'</code></pre>')
            i += 1
            continue
        heading = re.match(r'^(#{1,6})\s+(.+)$', line)
        if heading:
            level, title = len(heading[1]), heading[2]
            current_section = title
            slug = re.sub(r'[^\w\- ]', '', title.lower()).replace(' ', '-')
            count = counts.get(slug, 0); counts[slug] = count + 1
            slug += '-'+str(count) if count else ''
            output.append(f'<h{level} id="{slug}">{fmt(title)}</h{level}>')
            if level == 2: headings.append((slug, title))
            i += 1
            continue
        if line.startswith('|') and i+1 < len(lines) and re.match(r'^\|[\s:|\-]+\|?$', lines[i+1]):
            table_count += 1
            def cells(row):
                # Pipes inside inline code (e.g. data-size) belong to the cell.
                return re.split(r'\|(?=(?:[^`]*`[^`]*`)*[^`]*$)', row.strip().strip('|'))
            headers = cells(line)
            rows = []
            i += 2
            while i < len(lines) and lines[i].startswith('|'):
                rows.append(cells(lines[i])); i += 1
            table_name = escape(f'{current_section} reference table {table_count}', quote=True)
            output.append(f'<div class="table-scroll" tabindex="0" role="region" aria-label="{table_name}"><table><thead><tr>'+''.join('<th scope="col">'+fmt(c.strip())+'</th>' for c in headers)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+fmt(c.strip())+'</td>' for c in row)+'</tr>' for row in rows)+'</tbody></table></div>')
            continue
        match = re.match(r'^(\s*)([-*]|\d+\.)\s+(.+)', line)
        if match:
            html,i = list_at(i,len(match[1]))
            output.append(html)
            continue
        if line.startswith('<!--'):
            i += 1
            continue
        paragraph = [line]
        i += 1
        while i < len(lines) and lines[i].strip() and not re.match(r'^(#{1,6} |```|\||\s*[-*] |\s*\d+\. )', lines[i]):
            paragraph.append(lines[i]); i += 1
        output.append('<p>'+fmt(' '.join(paragraph))+'</p>')
    toc = '<aside class="docs-toc"><nav aria-label="On this page"><p>On this page</p><ul>'+''.join(f'<li><a href="#{slug}">{fmt(title)}</a></li>' for slug, title in headings)+'</ul></nav></aside>' if headings else ''
    return '\n'.join(output), toc
