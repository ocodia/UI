#!/usr/bin/env python3
"""Source/rendering integrity checks for the documentation generator."""
from html.parser import HTMLParser
import json
import re
import unittest
from build_docs import generate
from site_shell import ROOT, markdown


class Content(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.text = []; self.tags = []
        self.in_main = False; self.heading_in_main = []
        self.feed(text)
    def handle_data(self, text): self.text.append(text)
    def handle_starttag(self, tag, attrs):
        self.tags.append((tag,dict(attrs)))
        if tag == 'main': self.in_main = True
        if tag == 'h1': self.heading_in_main.append(self.in_main)
    def handle_endtag(self, tag):
        if tag == 'main': self.in_main = False


class DocumentationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.pages = generate()

    def test_every_catalogue_entry_has_a_page_and_no_planned_demo(self):
        data = json.loads((ROOT/'docs/components.json').read_text())
        for item in data['components']+data['uiComponents']:
            page = self.pages[f'docs/components/{item["id"]}.html']
            self.assertIn(item.get('name',item['id']), page)
            if item['status'] == 'planned':
                self.assertNotIn('data-example',page)
                self.assertIn('not implemented',page)

    def test_full_guides_retain_source_text_and_fences(self):
        # Rendering must preserve authored content, including every code fence.
        for source in (ROOT/'docs').glob('*.md'):
            body,_ = markdown(source.read_text(),source.relative_to(ROOT).as_posix(),'docs/test.html')
            rendered = ' '.join(Content(body).text)
            for fence in re.findall(r'```[^\n]*\n(.*?)```',source.read_text(),re.S):
                self.assertIn(fence.rstrip(),rendered,source.name)
            self.assertNotIn('\x00',body,source.name)

    def test_code_is_escaped_and_table_code_pipes_are_preserved(self):
        body,_ = markdown('# Guide\n\n```html\n<input required>\n```\n\n| Value | Meaning |\n| --- | --- |\n| `small|large` | Size |','docs/controls.md','docs/controls.html')
        parsed=Content(body)
        self.assertNotIn('input',[tag for tag,attrs in parsed.tags])
        self.assertEqual(2,len([tag for tag,attrs in parsed.tags if tag=='td']))
        self.assertIn('small|large',''.join(parsed.text))

    def test_local_guide_links_rewrite_but_source_code_does_not(self):
        body,_=markdown('[Forms](forms.md#localization)\n\n```html\n<a href="forms.md">Source</a>\n```','docs/controls.md','docs/controls.html')
        self.assertIn('href="forms.html#localization"',body)
        self.assertIn('href=&quot;forms.md&quot;',body)

    def test_every_preview_and_drawer_use_the_same_recipe(self):
        recipes=json.loads((ROOT/'docs/recipes.json').read_text())
        for key, examples in recipes.items():
            for index,recipe in enumerate(examples):
                preview=self.pages[f'docs/previews/{key}-{index}.html']
                self.assertIn(recipe['code'],preview)
                if recipe.get('script'): self.assertIn(recipe['script'],preview)
                self.assertNotIn('customElements.define',preview)

    def test_preview_document_headings_belong_to_main(self):
        # Standalone and no-script previews need a document heading in a landmark.
        for path, page in self.pages.items():
            if path.startswith('docs/previews/'):
                self.assertEqual([True], Content(page).heading_in_main, path)

    def test_nested_lists_and_code_link_labels(self):
        body,_ = markdown('- Parent\n  - Child\n- Next\n\n[`controls`](controls.md)','docs/index.md','docs/index.html')
        self.assertIn('<li>Parent<ul><li>Child</li></ul></li>',body)
        self.assertIn('<a href="controls.html"><code>controls</code></a>',body)


if __name__ == '__main__': unittest.main()
