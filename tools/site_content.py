"""Component pages and trusted example documents for the UI documentation site."""
from html import escape
from hashlib import sha256
from site_shell import ROOT, document, sidebar, relative
from component_contracts import PURPOSE, api_table


LABELS = {'native': 'Native recipe', 'foundation': 'Foundation', 'planned': 'Planned'}


def example_markup(key, index, recipe, page):
    identity = f'{key}-{index}'
    source = recipe['code'] + ('\n<script>\n'+recipe['script']+'\n</script>' if recipe.get('script') else '')
    source = ('<link rel="stylesheet" href="css/ui.css">\n' if key in ['pagination', 'stepper', 'step'] else '<script src="js/ui.js" defer></script>\n') + ''.join(f'<script src="{path}"></script>\n' for path in recipe.get('dependencies', [])) + source
    path = relative(f'docs/previews/{identity}.html', page)
    return f'''<section aria-labelledby="{identity}-title">
<h3 id="{identity}-title">{escape(recipe['title'])}</h3>
{('<p>'+escape(recipe['note'])+'</p>') if recipe.get('note') else ''}
<div class="example" data-example>
  <div class="example-stage"><div class="example-viewport"><iframe src="{path}" title="{escape(recipe['title'], quote=True)} example" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms"></iframe><button type="button" class="example-handle" aria-label="Resize {escape(recipe['title'], quote=True)} example" aria-describedby="{identity}-resize-help" hidden><span aria-hidden="true">↔</span></button></div></div>
  <ui-cluster class="example-tools" hidden><label for="{identity}-width">Width <input id="{identity}-width" type="range" min="240" max="1200" value="1200"></label><output for="{identity}-width">Full width</output><button type="button" data-variant="quiet" data-reset>Reset width</button><button type="button" data-variant="quiet" data-copy>Copy code</button><span role="status" data-copy-status></span><span class="example-help" id="{identity}-resize-help">Drag the edge or use arrow keys; Shift changes by 50px. Home/End use minimum/full width.</span></ui-cluster>
  <details><summary>Code</summary><pre><code>{escape(source)}</code></pre></details>
  <p class="example-caption"><a href="{path}">Open example on its own</a> · Form previews send nothing.</p>
</div></section>'''


def previews(recipes):
    pages = {}
    preview_version = sha256((ROOT/'js/docs-preview.js').read_bytes()).hexdigest()[:12]
    ui_version = sha256((ROOT/'js/ui.js').read_bytes()).hexdigest()[:12]
    ui_style_version = sha256((ROOT/'css/ui.css').read_bytes()).hexdigest()[:12]
    for key, examples in recipes.items():
        for index, recipe in enumerate(examples):
            title = escape(recipe['title'])
            script = '<script>\n'+recipe['script']+'\n</script>' if recipe.get('script') else ''
            dependencies = ''
            for path in recipe.get('dependencies', []):
                if not path.startswith('js/') or not path.endswith('.js') or '..' in path.split('/') or not (ROOT/path).is_file():
                    raise ValueError(f'Invalid trusted recipe dependency: {path}')
                version = sha256((ROOT/path).read_bytes()).hexdigest()[:12]
                dependencies += f'<script src="{relative(path, f"docs/previews/{key}-{index}.html")}?v={version}"></script>'
            script = dependencies + script
            nojs = '<noscript><p>Enable JavaScript to inspect values locally. Inputs remain editable. A production form needs a real server action.</p></noscript>' if '<form' in recipe['code'] and 'method="dialog"' not in recipe['code'] else ''
            pages[f'docs/previews/{key}-{index}.html'] = f'''<!doctype html>
<!-- Generated from docs/recipes.json. Trusted repository examples only. -->
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{title} — UI example</title>
<link rel="stylesheet" href="../../css/ui.css?v={ui_style_version}"><link rel="stylesheet" href="../../themes/forest.css"><script src="../../js/ui.js?v={ui_version}" defer></script><script src="../../js/docs-preview.js?v={preview_version}" defer></script>
<style>body {{ padding: 1.5rem; padding-inline-end: 3rem; }} body > main {{ max-inline-size: none; inline-size: auto; margin: 0; padding: 0; }} h1 {{ position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%); }} output {{ display: block; margin-block-start: 1rem; }} .table-scroll table {{ min-inline-size: 38rem; }} :root:not([data-preview-ready]) form:not([method="dialog"]) :is(button:not([type]), button[type="submit"], input[type="submit"]) {{ display: none; }}</style></head>
<body><main aria-label="{title} example"><h1>{title}</h1>{recipe['code']}{nojs}</main>{script}</body></html>
'''
    return pages


FORM_NOTES = {
    'checkbox': ('Space toggles the focused checkbox. Use its checked property for current state; checked markup sets the reset default. Indeterminate is separate and must be set with JavaScript.', 'Only checked, enabled, named checkboxes serialize. An omitted value serializes as on; provide a meaningful value. Required applies to this checkbox, not a whole group.'),
    'checkbox-group': ('Use one fieldset and legend for a shared question. Tab reaches each enabled checkbox; Space toggles it independently. Associate shared hints with the controls as well as the group when needed.', 'Repeated names produce repeated form entries. Use FormData.getAll(). The application owns minimum-count rules and the shared error; do not add required to every box for an at-least-one rule.'),
    'radio': ('Same-name radios in the same native form form a question. Use a fieldset/legend. Native arrow keys move selection; Space checks the focused radio.', 'Only the checked, enabled named member serializes. Use value for the answer and checked for the reset default. UI renders one error per required native group.'),
    'radio-group': ('Use one fieldset/legend and a shared name. Keep the native arrow-key and Tab behavior. Give every choice a visible label and its own value.', 'Only the checked, enabled named member serializes. Required membership makes the native question required; grouped errors link to an eligible member. Read the grouped integration contract for dynamic membership.'),
    'date-input': ('The browser supplies date editing and its platform picker. Labels and format guidance remain visible. Do not depend on a particular calendar UI or locale display order.', 'The native value uses YYYY-MM-DD or an empty string, independently of display locale. Min/max and step express constraints; the server must recheck them. Treat a calendar date as a date, not an implicit UTC timestamp.'),
    'time-input': ('The browser supplies locale-specific time editing. Use step when seconds or a particular interval matters. Do not replace the native editor to match a screenshot.', 'Native values use HH:mm, with seconds where applicable, or an empty string. A time contains no date, location or timezone; the application must define those separately and validate on the server.'),
    'file-input': ('The native file picker owns selection. Give the field a visible label and explain permitted formats and limits before selection. It supports disabled, but not readonly.', 'Use multipart/form-data for uploads. Accept is a picker hint; the server checks file type/content, size and authorization. Selected File objects stay native; code cannot set an arbitrary local path. Reset clears the selection.'),
    'input': ('Use an appropriate native type, a visible label and useful autocomplete. Tab reaches editable controls. Keep hints visible and preserve authored aria-describedby relationships.', 'Name/value, validity, autofill, submitter and reset remain native. Readonly values serialize; disabled controls do not. Required does not replace server rules. UI form enhancement coordinates errors on submission.'),
    'number-input': ('Use number for quantities, not account IDs or postal codes. The browser supplies numeric editing and step controls. Explain units and bounds in text.', 'Min/max/step constrain a numeric answer; required separately controls emptiness. Locale editing varies. The value is a string for FormData; validate and convert deliberately on the server.'),
    'select': ('Keep native selection and platform keyboard shortcuts. Use a label, meaningful option text and option groups where helpful. Multiple selection must explain platform selection conventions.', 'A single select contributes one selected value. Multiple contributes repeated values; read getAll(). Disabled options cannot be chosen. Native size controls rows; data-size controls presentation. Select does not support readonly.'),
    'option': ('Options stay inside select or optgroup. Their label, selected and disabled states belong to the platform. Never register a wrapper element to replace option.', 'The value attribute supplies the serialized answer; selected markup supplies the reset default. A multiple select can contribute more than one option with the same name.'),
    'slider': ('Keep native arrow-key stepping and an accessible label with units. Min/max/step define its bounds; no custom slider role or key handler is needed.', 'A range has a numeric default rather than an unanswered state. Required is not a missing-answer rule for range. Named enabled controls serialize their numeric string; the application owns displayed status and server validation.'),
    'textarea': ('Use a visible label and explain a meaningful length limit. Native multiline editing, selection, paste and resize stay available. Do not make the field a single-line input.', 'Name/value remain native; newlines are preserved. Rows is initial geometry, not a length limit. Maxlength is a client constraint; the server rechecks it. Readonly values serialize; disabled values do not.'),
}


def component_page(item, data, recipes):
    key = item['id']
    page = f'docs/components/{key}.html'
    status = item.get('status', 'foundation')
    title = item.get('name', key)
    route = item.get('ui', key)
    body = f'<p class="eyebrow"><a href="../../examples/components.html">Components</a> / {escape(item.get("category", "UI primitives"))}</p><h1>{escape(title)}</h1><ui-cluster class="component-meta"><code>{escape(route)}</code><span>{LABELS[status]}</span><span>'+ (f'Phase {item["phase"]}' if 'phase' in item else escape(item['mode']))+f'</span></ui-cluster><p class="component-lead">{escape(PURPOSE.get(key,item["contract"]))}</p>'
    if item.get('maturity'):
        body += '<p>Implementation maturity: '+escape(item['maturity'])+'. See dated evidence and remaining release gates.</p>'
    sections = []
    def section(identity, title, content):
        sections.append((identity,title))
        return f'<h2 id="{identity}">{title}</h2>{content}'
    if status == 'planned':
        body += section('proposal', 'Proposed direction', '<ui-panel><p>This component is not implemented. Its proposed name is not a registered element or a supported API. There is no live demonstration to initialize.</p></ui-panel><p>Use the native or readable baseline described above while the component is specified. Delivery depends on the roadmap and a complete interaction contract.</p>')
        if item.get('specification'):
            spec = item['specification']
            body += '<p>Read the <a href="'+escape(relative(spec[:-3]+'.html', page), quote=True)+'">proposed specification</a> or its <a href="'+escape(relative(spec, page), quote=True)+'">Markdown source</a>. This is design work, not an implemented API.</p>'
        body += section('acceptance', 'Acceptance work', '<p>'+escape(item['acceptance'])+'</p><p>Before implementation, specify markup, keyboard/focus behavior, native value ownership, missing-API fallback, late children, nesting and cleanup. APIs, tokens and events will be documented only when implemented.</p>')
    else:
        if item.get('specification'):
            body += '<p>Read the <a href="'+escape(relative(item['specification'][:-3]+'.html', page), quote=True)+'">component specification</a> and its <a href="'+escape(relative(item['specification'], page), quote=True)+'">Markdown source</a>.</p>'
        shared_index = {'ui-form': 0, 'ui-error-summary': 0, 'dialog': 1, 'popover': 2, 'popup': 3}.get(key)
        if shared_index is not None:
            body += section('shared-setup', 'Shared UI setup', '<p>Load <code>js/ui.js</code> once. Use the <a href="../enhancement.html">shared enhancement API</a> for standard setup and scoped cleanup; application business rules remain separate.</p>'+example_markup('enhancement', shared_index, recipes['enhancement'][shared_index], page))
        body += section('examples', 'Examples', ''.join(example_markup(key,i,r,page) for i,r in enumerate(recipes.get(key, []))) or '<p>No verified media demo is shipped. The catalogue documents illustrative markup; supply verified media, captions and transcript before presenting a working example.</p>')
        keyboard, values = FORM_NOTES.get(key, (
            'Use native children for semantics and interaction. Layout wrappers add no keyboard behavior or implicit roles. Keep visual order consistent with DOM reading order, including in RTL.',
            'This primitive does not own application values, persistence or transport. Native descendants retain labels, values and form associations. Keep content readable before optional application behavior initializes.'
        ))
        if key == 'button':
            keyboard = 'Native buttons activate with Enter/Space and remain separate Tab stops. Use anchors for navigation and explicit button types for operations. Disabled controls cannot activate. Busy feedback and duplicate-operation handling belong to the application.'
            values = 'Preserve submit/reset, native submitter name/value, form ownership and formnovalidate. A button inside a form defaults to submit. data-variant and data-size affect CSS presentation only; unknown values use defaults.'
        if key == 'dialog':
            keyboard = 'The browser owns modal focus containment and inertness after showModal(). Choose initial focus, an explicit close action, Escape policy and a logical return target. The complete dialog guide covers these decisions and support failure.'
            values = 'A method=dialog form closes without network submission. Clear returnValue before opening; dismissal must not reuse a previous result. Closing is separate from resetting answers or saving data. Do not nest forms.'
        if key in ['accordion', 'accordion-item']:
            keyboard = 'Native Enter/Space toggles each summary. The wrapper adds Up/Down and Home/End navigation in DOM order without changing expansion. Tab remains native; nested groups own their own keys.'
            values = 'Native details owns open state and optional name groups. Closed fields retain native values and validation. Shared destroy preserves expansion; late children require explicit enhance. Read the Accordion guide for fragments, focus recovery and limits.'
        if key in ['tab-group', 'tab', 'tab-panel']:
            keyboard = 'Arrow keys and Home/End move within the list; Enter/Space activates in default manual mode. Automatic activation and vertical orientation are explicit alternatives. Tab leaves the list for the selected panel. RTL reverses horizontal arrows.'
            values = 'Readable fragment links and sections are the baseline. UI coordinates selection, fragment and form-error reveal without changing native values. Late pairs require explicit enhance; destroy restores all sections. Read the Tabs guide for validation and lifecycle limits.'
        if key == 'icon':
            keyboard = 'Icons have no keyboard behavior or focus stop. The containing native link/button owns its accessible name and activation.'
            values = 'A single authored inline SVG is the optional loading/error/no-script fallback. Observe name/library/label changes; explicitly enhance late icons and destroy before editing fallback content.'
        if key in ['dropdown', 'dropdown-item']:
            keyboard = 'Native trigger toggles a command menu. Arrows/Home/End navigate enabled items; localized typeahead moves focus; Tab exits and Escape dismisses natively. Native disabled buttons are skipped.'
            values = 'Native buttons and anchors retain form ownership, submitters, validation/reset and real destinations. UI installs roles only when ready, uses native popover dismissal and Popup geometry, and restores one inline list on failure/teardown. Applications own command tasks and durable feedback.'
        if key == 'pagination':
            keyboard = 'Named native nav, list and real anchors. Tab/Shift+Tab and Enter remain native; no arrow-key handler, roving focus or custom role. aria-current=page marks one current link.'
            values = 'CSS-only ui-pagination scopes wrapping and current-page presentation. Omit unavailable previous/next links; ellipses are text. Applications own URLs, totals, async loading and focus after updates.'
        if key in ['stepper', 'step']:
            keyboard = 'Native ordered steps with optional real links. Tab/Shift+Tab reaches only links; Enter navigates normally. Plain future/current text is not a focus stop. No composite roles, roving focus or progression handler.'
            values = 'CSS-only ui-steps scopes an ordered list; each step is a native li. Author aria-current=step on the current item and completed/error status as text. Applications own validation, saving, permissions, current location and focus after transitions.'
        if key == 'details': keyboard = 'Enter/Space toggles the native summary. The browser owns open state and the toggle event. Required instructions belong outside a closed disclosure. Keep summary text meaningful.'
        if key == 'popover': keyboard = 'Native popovertarget supplies non-modal disclosure. Content keeps its own semantics; do not add a menu role. Check Escape, light dismissal, trigger focus and a useful inline fallback in the actual supported browser.'
        body += section('behavior', 'Keyboard, focus & native state', '<p>'+escape(keyboard)+'</p>')
        body += section('integration', 'Values, validation & fallback', '<p>'+escape(values)+'</p><p>Keep labels and instructions available when JavaScript fails. Applications own async work, recovery and server validation. Test disabled, invalid, long-content and loading states where the task supports them.</p>')
        if key in ['checkbox-group', 'radio-group', 'date-input', 'time-input', 'file-input', 'slider']:
            body += '<p>Try the <a href="../../examples/native-inputs.html">native-value recipe</a> for grouped error recovery, date/time constraints, multiple file entries, range values and reset. The <a href="../forms.html#native-dates-times-files-and-ranges">integration contract</a> explains hints, serialization and server responsibilities.</p>'
        if key in ['card', 'page', 'scroller', 'select', 'option', 'ui-panel', 'ui-grid', 'ui-stack', 'ui-sidebar']:
            body += '<p>The <a href="../../examples/composition.html">survey briefing recipe</a> combines nested panels, native multiple selection and named scroll regions. Read its <a href="../reference.html#panels-scroll-regions-and-multiple-selection">composition and selection contract</a>.</p>'
        if key in PURPOSE:
            body += '<p>See the <a href="../native-states.html">native family state audit</a> for default, long-content, disabled/read-only, invalid, busy and fallback coverage, including states that do not apply.</p>'
        guide = 'forms' if key in FORM_NOTES or key in ['ui-form','ui-error-summary','ui-field','ui-hint','ui-error'] else key if key in ['dialog', 'popover', 'popup', 'accordion', 'pagination', 'icon'] else 'accordion' if key == 'accordion-item' else 'tabs' if key in ['tab-group', 'tab', 'tab-panel'] else 'dropdown' if key in ['dropdown', 'dropdown-item'] else 'stepper' if key in ['stepper', 'step'] else 'controls' if key in ['button','button-group'] else 'reference'
        body += section('api', 'API & styling', api_table(key)+f'<p>Use the <a href="../{guide}.html">implemented {guide} contract</a> for the full integration rules and supported cases. Native attributes retain their standard meanings. Only <code>ui-form</code> and <code>ui-error-summary</code> register behavior.</p><p>Styles come from <code>css/ui.css</code> in the <code>ui</code> layer. Geometry and semantic colors use <a href="../theming.html">UI theme variables</a>. <a href="../density.html">Density</a> and <a href="../controls.html">control sizes</a> have separate scopes; they do not apply to every element.</p>')
        if item.get('example'):
            body += section('minimal-markup', 'Catalogue markup', '<p>This minimal structure describes the route. Live examples above add the context needed to try it.</p><details><summary>Minimal markup</summary><pre><code>'+escape(item['example'])+'</code></pre></details>')
        body += section('evidence', 'Verification & known limits', '<p>'+escape(item.get('acceptance','Check native ownership, layout, focus, fallback and lifecycle in the actual application.'))+'</p><p>Native/foundation is an implementation route, not a stable-release or accessibility certification. See <a href="../accessibility.html">dated results and unresolved findings</a>; run the <a href="../../tests/accessibility.html">browser checks</a>. Manual platform and assistive-technology verification remains part of release readiness.</p>')
    body += section('related', 'Related documentation', '<ul><li><a href="../reference.html">Current UI API</a></li><li><a href="../conventions.html">Interaction conventions</a></li><li><a href="../roadmap.html">Delivery sequence and release gate</a></li><li><a href="../component-template.html">Component specification template</a></li></ul>')
    toc = '<aside class="docs-toc"><nav aria-label="On this page"><p>On this page</p><ul>'+''.join(f'<li><a href="#{slug}">{label}</a></li>' for slug,label in sections)+'</ul></nav></aside>'
    return document(page,title,body,'Components',sidebar(page,data),toc,scripts=['js/docs.js'])


def catalogue_pages(data, recipes):
    page = 'examples/components.html'
    entries = data['components']
    categories = ''.join(f'<option>{escape(category)}</option>' for category in dict.fromkeys(i['category'] for i in entries))
    cards = []
    for item in entries:
        key = item['id']
        cards.append(f'<ui-panel id="{key}" data-component data-category="{escape(item["category"])}" data-status="{item["status"]}"><article><p class="eyebrow">{escape(item["category"])} · {LABELS[item["status"]]} · Phase {item["phase"]}</p><h2><a href="../docs/components/{key}.html">{escape(item["name"])}</a></h2><p>{escape(item["contract"])}</p></article></ui-panel>')
    body = f'''<p class="eyebrow">Browse the system</p><h1>Components</h1><p class="component-lead">Native building blocks. Useful composition. Explicit contracts.</p><p>Search {len(entries)} reference entries by name or purpose, then open a component for examples, code and its contract. Planned entries describe future work.</p>
<form id="catalog-filter" role="search" aria-label="Filter component catalogue" hidden><ui-grid>
<ui-field><label for="query">Find a component</label><input id="query" type="search" placeholder="Try checkbox, dialog or grid"></ui-field>
<ui-field><label for="category">Category</label><select id="category"><option value="">All categories</option>{categories}</select></ui-field>
<ui-field><label for="status">Implementation</label><select id="status"><option value="">All statuses</option><option value="native">Native recipe</option><option value="foundation">Foundation</option><option value="planned">Planned</option></select></ui-field></ui-grid><button type="reset" data-variant="secondary">Clear filters</button></form>
<p id="catalog-count" role="status">{len(entries)} components shown.</p><p id="catalog-empty" hidden>No matching components. Change the search or clear the filters.</p>
<ui-grid class="catalog-grid">{''.join(cards)}</ui-grid>
<h2 id="ui-primitives">UI primitives</h2><p>These eleven shipped primitives are also documented individually.</p><ui-cluster>{''.join(f'<a href="../docs/components/{i["id"]}.html">{i["id"]}</a>' for i in data['uiComponents'])}</ui-cluster>'''
    pages = {page:document(page,'Components',body,'Components',scripts=['examples/catalog.js'])}
    pages.update({f'docs/components/{item["id"]}.html':component_page(item,data,recipes) for item in entries+data['uiComponents']})
    pages.update(previews(recipes))
    return pages
