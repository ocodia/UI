#!/usr/bin/env python3
"""Validate curated local SVG libraries and generate the docs' searchable name index."""
import argparse
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NAMESPACE = 'http://www.w3.org/2000/svg'
TAGS = {'svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon'}
ATTRS = {'viewBox', 'width', 'height', 'd', 'points', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'transform', 'fill', 'fill-rule', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-opacity', 'opacity', 'vector-effect'}
IDENTIFIER = re.compile(r'[A-Za-z0-9][A-Za-z0-9_-]*\Z')
PAINT = re.compile(r'(?:[a-z]+|#[\da-f]{3,8}|(?:rgb|rgba|hsl|hsla)\([\d\s.,%+\/-]+\))\Z', re.I)

def validate(path):
    source = path.read_text()
    if len(source.encode()) > 256 * 1024 or re.search(r'<!DOCTYPE|<!ENTITY', source, re.I):
        raise ValueError('oversized SVG or unsupported declaration')
    svg = ET.fromstring(source)
    if svg.tag != '{'+NAMESPACE+'}svg': raise ValueError('expected SVG namespace/root')
    import math
    box = [float(v) for v in re.split(r'[\s,]+', svg.get('viewBox', '').strip())]
    if len(box) != 4 or not all(math.isfinite(v) for v in box) or min(box[2:]) <= 0: raise ValueError('invalid viewBox')
    if path.parent.name == 'fluent' and re.search(r'-20-(regular|filled)$', path.stem) and box == [0, 0, 100, 100]: raise ValueError('known oversized Fluent 20px canvas; run --repair-fluent')
    drawings = 0
    def walk(node, depth=0):
        nonlocal drawings
        tag = node.tag.removeprefix('{'+NAMESPACE+'}')
        if depth > 32 or node.tag != '{'+NAMESPACE+'}'+tag or tag not in TAGS or depth and tag == 'svg': raise ValueError('unsupported SVG element')
        if tag not in {'svg','g'}: drawings += 1
        for name, value in node.attrib.items():
            if name not in ATTRS or re.search(r'url\s*\(|[<>&]', value, re.I): raise ValueError('unsupported attribute/URL')
            if name in {'fill','stroke'} and not PAINT.fullmatch(value): raise ValueError('unsupported paint')
            if name in {'fill-opacity','stroke-opacity','opacity','stroke-width','stroke-miterlimit','stroke-dashoffset'} and (not re.fullmatch(r'[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?%?', value, re.I) or not math.isfinite(float(value.removesuffix('%')))): raise ValueError('invalid numeric paint')
            if name == 'viewBox' and depth: raise ValueError('nested viewBox')
        if node.text and node.text.strip() or node.tail and node.tail.strip(): raise ValueError('unexpected SVG text')
        for child in node: walk(child, depth+1)
    walk(svg)
    if not drawings: raise ValueError('empty SVG')

def generate():
    libraries = {}; errors = []
    for path in sorted((ROOT/'icons').glob('*.svg')):
        try:
            if not IDENTIFIER.fullmatch(path.stem): raise ValueError('invalid filename')
            validate(path); libraries.setdefault('', []).append(path.stem)
        except (ValueError, ET.ParseError) as error: errors.append(f'{path.relative_to(ROOT)}: {error}')
    for library in sorted((ROOT/'icons').iterdir()):
        if not library.is_dir(): continue
        if not IDENTIFIER.fullmatch(library.name): errors.append(f'{library}: invalid library name'); continue
        names = []
        for path in sorted(library.glob('*.svg')):
            try:
                if not IDENTIFIER.fullmatch(path.stem): raise ValueError('invalid filename')
                validate(path); names.append(path.stem)
            except (ValueError, ET.ParseError) as error: errors.append(f'{path.relative_to(ROOT)}: {error}')
        if names: libraries[library.name] = names
    if errors: raise ValueError('\n'.join(errors))
    return json.dumps(libraries, separators=(',', ':'))+'\n'

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--repair-fluent', action='store_true', help='Correct only known 100x100 canvases on Fluent 20px variants, without changing paths')
    args = parser.parse_args()
    if args.check and args.repair_fluent: parser.error('repair is a mutation; use separately from --check')
    if args.repair_fluent:
        count = 0
        for path in (ROOT/'icons/fluent').glob('*-20-*.svg'):
            if not re.search(r'-20-(regular|filled)$', path.stem): continue
            source = path.read_text()
            if 'viewBox="0 0 100 100"' not in source: continue
            source = source.replace('viewBox="0 0 100 100"', 'viewBox="0 0 20 20"').replace('width="100"', 'width="20"').replace('height="100"', 'height="20"')
            path.write_text(source); count += 1
        print(f'Repaired {count} Fluent 20px canvases; drawing paths unchanged.')
    result = generate(); path = ROOT/'icons/catalogue.json'
    if args.check:
        if not path.exists() or path.read_text() != result: raise SystemExit('Stale icon catalogue; run python3 tools/build_icons.py')
    else: path.write_text(result)
    data = json.loads(result)
    print(f'Validated {sum(map(len, data.values()))} SVGs in {len(data)} libraries; icon catalogue '+('is current.' if args.check else 'written.'))

if __name__ == '__main__': main()
