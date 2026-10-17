#!/usr/bin/env python3
"""Check catalogue freshness and local documentation/example links (stdlib only)."""
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit
from build_docs import ROOT, generate

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids=set()
        self.duplicates=[]
        self.links=[]
        self.custom=set()
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        if tag.startswith('ui-'): self.custom.add(tag)
        attrs=dict(attrs)
        if 'id' in attrs:
            if attrs['id'] in self.ids: self.duplicates.append(attrs['id'])
            self.ids.add(attrs['id'])
        for attribute in ['href','src','poster']:
            if attrs.get(attribute): self.links.append(attrs[attribute])


def markdown_content(path):
    return re.sub(r'```.*?```', '', path.read_text(), flags=re.S)


def anchors(path):
    if path.suffix=='.html': return Page(path.read_text()).ids
    if path.suffix=='.md':
        result=set()
        counts={}
        for title in re.findall(r'^#+\s+(.+)$',markdown_content(path),flags=re.M):
            slug=re.sub(r'[^\w\- ]','',title.lower()).replace(' ','-')
            suffix=counts.get(slug,0)
            counts[slug]=suffix+1
            result.add(slug+(f'-{suffix}' if suffix else ''))
        return result
    return None


def main():
    errors=[]
    data=json.loads((ROOT/'docs/components.json').read_text())
    implemented={item['id'] for item in data['uiComponents']}
    registered=set(re.findall(r"customElements\.define\(['\"]([^'\"]+)", (ROOT/'js/components.js').read_text()))
    documented={item['id'] for item in data['uiComponents'] if item['mode']=='Optional JS'}
    if registered != documented:
        errors.append('Behavior registrations and the machine-readable current API disagree.')
    for name, expected in generate().items():
        path=ROOT/name
        if not path.exists() or path.read_text()!=expected:
            errors.append(f'{name}: stale output; run python3 tools/build_docs.py')
    paths=sorted([*ROOT.rglob('*.md'), *ROOT.rglob('*.html'), ROOT/'llms.txt'])
    for path in paths:
        if any(part.startswith('.') for part in path.relative_to(ROOT).parts): continue
        if path.suffix=='.html':
            page=Page(path.read_text())
            links=page.links
            errors.extend(f'{path.relative_to(ROOT)}: duplicate id {value}' for value in page.duplicates)
            errors.extend(f'{path.relative_to(ROOT)}: unimplemented live custom element {tag}' for tag in page.custom-implemented)
        else:
            links=re.findall(r'\]\(([^)]+)\)',markdown_content(path))
        for raw in links:
            raw=raw.strip('<>')
            url=urlsplit(raw)
            if url.scheme or url.netloc: continue
            target=(ROOT/unquote(url.path.lstrip('/'))) if url.path.startswith('/') else (path.parent/unquote(url.path) if url.path else path)
            if target.is_dir(): target=target/'index.html'
            if not target.exists():
                errors.append(f'{path.relative_to(ROOT)}: missing {raw}')
            elif url.fragment:
                available=anchors(target)
                if available is not None and unquote(url.fragment) not in available:
                    errors.append(f'{path.relative_to(ROOT)}: missing anchor {raw}')
    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'Documentation checks passed: {len(paths)} documents/pages, {len(data["components"])} reference entries, {len(data["uiComponents"])} UI primitives; generated views current.')

if __name__=='__main__': main()
