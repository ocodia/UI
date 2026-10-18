# Pagination

**Experimental CSS-only pattern.** Wrap a named native navigation list in `ui-pagination` to get wrapping page links, useful target sizes and current-page presentation. Real URLs, native keyboard behavior and no-script navigation remain available. The [specification](specs/pagination.md) defines ownership and acceptance work; [focused checks](../tests/pagination.html) verify actual destinations and display. Dated evidence and remaining release work are in [ACCESSIBILITY.md](../ACCESSIBILITY.md).

## Native markup

Only `css/ui.css` is required. The wrapper scopes presentation; `nav` provides the landmark. Author a `ul` or `ol` with native list items, real links and, for numbered pagination, exactly one `aria-current="page"` on the current page link. Give number-only links localized names that include the visible number. Use `role="list"` to retain explicit list semantics where list-marker removal would suppress them.

```html
<link rel="stylesheet" href="css/ui.css">
<ui-pagination>
  <nav aria-label="Report pages">
    <ul role="list">
      <li><a href="reports-1.html#results" rel="prev">Previous</a></li>
      <li><a href="reports-1.html#results" aria-label="Page 1">1</a></li>
      <li><a href="reports-2.html#results" aria-label="Page 2" aria-current="page">2</a></li>
      <li><a href="reports-3.html#results" aria-label="Page 3">3</a></li>
      <li><span>…</span></li>
      <li><a href="reports-8.html#results" aria-label="Page 8">8</a></li>
      <li><a href="reports-3.html#results" rel="next">Next</a></li>
    </ul>
  </nav>
</ui-pagination>
<h2 id="results" tabindex="-1">Reports: page 2 of 8</h2>
```

Replace illustrative report URLs with application routes that return the corresponding results. The runnable examples below use separate repository pages with different report records. Their documentation host loads shared preview scripts for resizing and themes; Pagination itself uses CSS and native links. There is no page-count property, selected index, generated link set or custom event.

## Current page, boundaries and empty results

The application renders current location and result counts. Keep the current link real and mark it with `aria-current="page"`; it remains activatable. UI uses a persistent border and weight as well as color. Do not use selected/pressed/disabled state to mean current location. At the first/last page omit the unavailable Previous/Next link. Keep ellipses as plain text outside the focus sequence; they are neither a destination nor a disabled control.

For no results, omit the pager and explain the empty state. For one page, omission is usually simpler; a one-link pager is supported if the surrounding task needs it. With unknown totals, supply only available real previous/next links and avoid invented page totals or a fake last page. A previous/next-only pager has no current-page link. Invalid numbers, empty pages, filtering and permission checks are server/application responsibilities. Preserve filters, sort order and search state in every URL.

Different result sets need distinct navigation labels. Identical top/bottom pagination controls can share the same label. Follow the [navigation landmark guidance](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html). `ui-pagination` adds no landmark itself and no wrapper is allowed between a native list and its `li` children.

## Keyboard, direction and focus

Tab/Shift+Tab visits every link in DOM order. Enter, pointer and touch follow the real URL. Modified clicks, middle-click, context menus and browser history remain native. Space and arrows keep normal browser behavior. There is no roving tabindex, composite role, focus trap, dismissal key or library announcement.

Labels wrap at narrow widths. Localize Previous/Next and the accessible page names. Logical CSS follows `dir`; keep DOM order stable in RTL and avoid direction-specific arrow glyphs as the only cue. Shared focus tokens remain distinct from current-page styling. Existing selected text/background/border and reference spacing tokens provide the appearance; no new public geometry, size or density API is added. Every link has a minimum 2.75rem target in each dimension before application overrides.

Native document navigation owns arrival focus. A heading ID with `tabindex="-1"` and real destination fragment provides a useful result destination, as in the examples. Without that fragment, browser document/history focus behavior applies. Pagination never calls focus or scroll methods.

## Application loading and updates

For enhanced navigation, intercept only ordinary activations the application can handle, keeping the real href usable. Preserve the old results/current marker during loading. One application-owned status region announces progress; error and retry information stay persistent beside results. Associate responses with a request/revision, cancel superseded transport where possible and reject stale results after navigation or removal.

On success, update results, counts, current link and history together, then focus a surviving result heading for a user-requested page change. Background refresh should preserve useful focus. On failure, retain the old view and provide retry or a link to the real destination. Back/Forward behavior and focus restoration belong to the application router. UI supplies no fetch, persistence, announcement or async API; CSS does not implement this integration automatically. Do not disable links or manufacture disabled/read-only/busy pagination modes to conceal a pending request.

## Lifecycle and fallback

`UI.enhance` and `UI.destroy` leave Pagination unchanged. Late links, replacement, nesting, disconnect/reconnect and adoption need only native HTML/CSS; applications own valid markup and focus before removing a task. The pattern acquires no listeners, observers, generated IDs, mutations or pending work. Native controls elsewhere in the task keep their labels, values, form ownership, validation and reset behavior.

Without CSS the named list and destinations remain readable; without JavaScript the pages navigate normally. Invalid markup or duplicate current markers remain authoring errors rather than being silently repaired. Print retains navigation in document order. Actual forced-colors, zoom, print, touch and assistive-technology evidence remains in the component release gate.
