"""Authored native API notes for component reference pages (documentation only)."""
from html import escape

PURPOSE = {
    'button': 'Buttons perform actions. Use their emphasis and size to make the next step clear while keeping native activation, submission and reset behavior.',
    'button-group': 'Keep related actions together in a wrapping row. Each button keeps its own label, focus stop and native behavior.',
    'checkbox': 'A checkbox toggles an independent choice. Several checkboxes can collect multiple answers to one question; an indeterminate appearance can represent a partial selection.',
    'checkbox-group': 'A fieldset and legend connect independent checkbox answers to one question. Shared instructions and errors describe the question without replacing the individual labels.',
    'date-input': 'Collect a calendar date with the native date editor. The browser handles localized entry while the submitted value has a consistent date format.',
    'file-input': 'Let the user choose local files through the browser picker. The native input owns the selection; the application owns upload rules and transport.',
    'input': 'Collect a single-line answer with a native input, a visible label and concise guidance. Choose the type and autocomplete that fit the information requested.',
    'number-input': 'Collect a quantity with native numeric editing and explicit bounds. Use a text input for identifiers that happen to contain digits.',
    'radio': 'A radio represents one answer in an exclusive named question. Keep the option inside its native fieldset and radio group.',
    'radio-group': 'Let the user choose one answer from a small set of visible options. A shared name connects the radio controls; the legend names the question.',
    'select': 'Offer a native list of answers when a compact choice control fits the task. Single and multiple selection retain the platform’s interaction model.',
    'option': 'An option supplies one answer inside a native select. Option groups add meaningful categories without changing value ownership.',
    'slider': 'Choose a number within known bounds using a native range input. Always explain the quantity and its units.',
    'textarea': 'Collect multiline text with native editing, selection and resizing. Give longer answers room and describe any limits before entry.',
    'card': 'Use a panel to group related content visually. Its native article or section supplies the meaning, with explicit links and actions inside.',
    'details': 'Reveal optional supporting content with the browser’s disclosure. The summary remains visible when the content is closed.',
    'dialog': 'Present a focused modal task using the native dialog. The browser supplies modality; application code chooses the opening, closing and recovery policy.',
    'divider': 'A native horizontal rule marks a thematic break between topics. Use a CSS border for a purely decorative boundary.',
    'page': 'Compose a page from native landmarks and responsive UI layouts. Keep navigation, headings and content order meaningful at every width.',
    'scroller': 'Keep wide content inside a named local scroll region. The surrounding page continues to reflow, and keyboard users can reach the scrolling area.',
    'breadcrumb': 'Show the current location within a hierarchy using a named navigation list. Ancestors are real destinations; the current location is identified explicitly.',
    'breadcrumb-item': 'An item contributes one step in a breadcrumb path. It remains a native list item, with a link for an ancestor or current-location text.',
    'progress-bar': 'Show measurable progress with a named native progress element, or omit its value when the task has no known total.',
    'popover': 'Reveal non-modal supporting content with the native popover API. The content determines its semantics; disclosure alone does not make it a menu.',
}

COMMON = [('name / value','Use a meaningful form key and answer. An enabled successful native control contributes its value.'),('disabled','Boolean presence disables interaction and excludes the control from form submission.'),('required','Where supported, the native control must satisfy its missing-value constraint before submission.'),('form','Associate with a native form by ID when outside its subtree. Labels and DOM layout stay independent of ownership.'),('aria-describedby','Space-separated hint/error IDs. Preserve existing descriptions when adding feedback.')]
EXTRA = {
    'checkbox':[('checked / defaultChecked','checked is the current Boolean property; checked markup sets the reset default.'),('indeterminate','JavaScript-only property; changes appearance independently of checked. It is not a custom HTML attribute.'),('value','Defaults to on when omitted. Only a checked, enabled checkbox contributes it.')],
    'checkbox-group':[('fieldset / legend','Native grouping and the question’s visible name.'),('name','Repeat the same key on individual inputs to collect several values.'),('validator','Optional ui-form application callback can enforce a group rule. This is not an attribute of fieldset.')],
    'radio':[('name / value','Group by the same name and native form owner; give each answer a distinct value.'),('checked','Initial selection in markup; current selection is the checked property.')],
    'radio-group':[('fieldset / legend','Native grouping and question name; inputs still need individual labels.'),('name / checked','Same-name radios share selection. checked markup sets the initial/reset selection.')],
    'date-input':[('min / max','Date strings in YYYY-MM-DD form constrain the allowed interval.'),('step','Step in days; default is one day.'),('readonly','Prevents editing while retaining the value as a successful control.')],
    'time-input':[('min / max','Native normalized time strings constrain entry.'),('step','Step is in seconds; default is 60. Use an appropriate value when collecting seconds.'),('readonly','Prevents editing while retaining the value as a successful control.')],
    'number-input':[('min / max / step','Numeric constraints. Default step is 1; use step="any" when arbitrary fractional values are appropriate.'),('valueAsNumber','Native numeric property; can be NaN when there is no usable number.'),('readonly','Prevents editing; unlike disabled, it does not omit the value.')],
    'file-input':[('accept','Comma-separated file extensions or media types for picker guidance.'),('multiple','Allows more than one selected file.'),('files','Native FileList containing the chosen files. Do not assign an arbitrary local path.'),('enctype','Use multipart/form-data on a form that uploads files.')],
    'input':[('type / autocomplete','Choose native entry and autofill semantics that match the question.'),('minlength / maxlength / pattern','Text constraints where supported by the selected input type.'),('readonly','Prevents supported input types from editing without excluding the value.'),('data-size','small, default or large on supported native input types. Unknown/empty values use default geometry.')],
    'select':[('multiple','Allows several selected options; serialize with FormData.getAll().'),('size','Native visible row count, independent of CSS data-size.'),('options / selectedOptions','Native collections of all options or the currently selected options.'),('data-size','small, default or large presentation; does not replace native size.')],
    'option':[('value','Serialized answer. If omitted, the browser derives it from the option text.'),('selected / defaultSelected','Current selection property versus the authored/reset default.'),('disabled','Disables this option; optgroup can disable a whole group.'),('label','Optional native label; keep meaningful visible text.')],
    'slider':[('min / max / step','Defaults are 0, 100 and 1. Choose bounds and a step suitable for the quantity.'),('value / valueAsNumber','Current native numeric string or number; range supplies a default even without an authored value.'),('disabled','Disables interaction and excludes the value. Range does not support readonly or a missing-answer required state.')],
    'textarea':[('rows / cols','Native initial geometry. CSS and resizing may change the rendered area.'),('minlength / maxlength','Text length constraints; rows does not limit the answer length.'),('readonly','Keeps the answer selectable and successful while preventing edits.'),('data-size','small, default or large styling with multiline behavior preserved.')],
    'button':[('type','submit, reset or button. Inside a form the default is submit.'),('disabled','Native Boolean disabled state; aria-disabled alone does not prevent activation.'),('name / value / form','Preserve native submitter identity, successful value and external form association.'),('formnovalidate','A submitter may bypass validation for its own submission.'),('data-variant','primary (default), secondary, quiet or danger. Unknown values use primary.'),('data-size','small, default or large. Minimum geometry remains content-sensitive.')],
    'details':[('open','Native Boolean disclosure state.'),('toggle','Native state-change event. Do not synthesize it during initial rendering.'),('summary','The first summary supplies the disclosure label and activation target.')],
    'dialog':[('showModal()','Native method that opens a modal and makes the surrounding document inert.'),('close(result)','Native method to close and optionally set the result string.'),('returnValue','Result string. Clear it before each opening so dismissal cannot reuse stale confirmation.'),('cancel','Cancelable native dismissal request. The recipe leaves it uncancelled.'),('close','Native close notification; use it for task completion/focus recovery when necessary.')],
    'progress-bar':[('max','Positive total; the native default is 1.'),('value','Progress from 0 to max. Omit for an indeterminate state.'),('label','Associate a native label with the progress element’s ID.'),('status','The application supplies persistent progress text and any live announcements; progress does not announce an entire workflow by itself.')],
    'popover':[('popover','Native auto/manual behavior. The example uses the default auto mode.'),('popovertarget','Trigger button points to the popover ID.'),('popovertargetaction','Use show, hide or toggle; toggle is the native default.'),('showPopover() / hidePopover() / togglePopover()','Optional native imperative methods. Feature-detect before use.'),('beforetoggle / toggle','Native state notifications. Semantics still follow the content.')],
    'scroller':[('tabindex="0"','Makes the local scroll container keyboard-reachable.'),('role="region" / aria-labelledby','Name the region using a visible caption or heading.'),('class="table-scroll"','Existing UI helper for local horizontal overflow; the content keeps native table semantics.')],
    'breadcrumb':[('nav / aria-label','Name the navigation, for example Breadcrumb.'),('ol / li','Keep the path as a native ordered list.'),('aria-current="page"','Identify the current location. Use real anchors for ancestor destinations.')],
    'breadcrumb-item':[('li','Keep each step inside its parent ol.'),('href / aria-current','Use a real destination for ancestors; identify the current page separately.')],
}
GEOMETRY = {
    'ui-stack':[('--ui-stack-gap','var(--ui-space), or the inherited density spacing default.')],
    'ui-cluster':[('--ui-cluster-gap','var(--ui-space), or density spacing.'),('--ui-cluster-align','center')],
    'ui-grid':[('--ui-grid-min','16rem preferred minimum; tracks can shrink to the container.'),('--ui-grid-gap','var(--ui-space), or density spacing.')],
    'ui-sidebar':[('--ui-sidebar-width','13rem'),('--ui-sidebar-content-min','36rem'),('--ui-sidebar-gap','var(--ui-space), or density spacing.')],
    'ui-panel':[('--ui-panel-padding','var(--ui-space), or density spacing.')],
}
GEOMETRY['card']=GEOMETRY['ui-panel']
FORM_API = [('form','Read-only native form reference, or null for incomplete/ambiguous markup.'),('validate({ focus })','Validate and render; returns Boolean. focus defaults to true.'),('showErrors(errors, { focus })','Render application field errors without replacing answers. Each entry has control and message.'),('clear()','Clear managed error presentation and title state, preserving values.'),('refresh()','Rediscover native ownership, children and descriptions immediately.'),('validator','JavaScript-only synchronous callback returning additional error objects.'),('message','JavaScript-only synchronous constraint-message callback; must return a non-empty string.'),('error-prefix / error-title-prefix','Localized inline/title prefixes; see the complete form integration contract.')]


def api_table(key):
    rows = []
    if key in ['checkbox','radio','date-input','time-input','number-input','file-input','input','select','textarea']:
        rows.extend(COMMON)
    rows.extend(EXTRA.get(key,[]))
    if key=='ui-form': rows.extend(FORM_API)
    if key=='ui-error-summary': rows.extend([('show(errors, { focus })','Render plain-text error links; focus defaults to true. Requires a heading, list and real control targets.'),('clear()','Clear the list and hide the summary.'),('refresh()','Update heading association when children arrive later.')])
    if key in ['ui-field','ui-hint','ui-error']:
        rows.append(('id / aria-describedby','Explicit native relationships remain usable before enhancement.'))
    if key=='ui-error': rows.append(('hidden','Authored initial error state. ui-form can show or clear managed feedback; visible server errors need explicit control relationships.'))
    if key=='ui-hint': rows.append(('Text content','Concise visible guidance. Native control aria-describedby points to this hint’s ID.'))
    if key=='ui-field': rows.append(('Native children','Group one control and its hint/error; use fieldset/legend for grouped questions.'))
    if key=='ui-skip-link': rows.extend([('a[href]','A native anchor points to the main-content fragment.'),('tabindex="-1"','The destination can receive focus without adding a sequential Tab stop.'),('Focus','The wrapper reveals its link when focused, using the shared focus tokens.')])
    if key in GEOMETRY: rows.extend(GEOMETRY[key])
    if not rows: return ''
    return '<div class="table-scroll" tabindex="0" role="region" aria-label="API reference"><table><thead><tr><th scope="col">Surface</th><th scope="col">Contract</th></tr></thead><tbody>'+''.join(f'<tr><td><code>{escape(name)}</code></td><td>{escape(detail)}</td></tr>' for name,detail in rows)+'</tbody></table></div>'
