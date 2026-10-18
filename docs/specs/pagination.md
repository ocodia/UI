# Pagination specification

## Identity and purpose

**Status: experimental implementation. Phase: 2. Owner: UI foundation; navigation, data and state belong to the application.** Pagination connects pages of one result set using real URLs. Follow the [shared lifecycle and ownership contract](../lifecycle.md). Prefer one readable page when splitting content would make comparison or finding information harder. Infinite scrolling, virtual lists, page-size inputs and process steppers are separate patterns.

`ui-pagination` is an unregistered, CSS-only composition boundary. Its purpose is to scope wrapping layout, link targets, current-page presentation and spacing without styling every native navigation list. A native `nav` supplies the landmark, a native list supplies grouping, and anchors supply destinations. No JavaScript, data-ui marker, component loader, custom events or composite-widget roles are required.

## Minimal markup

Paths below illustrate application routes; applications must supply the matching pages. Only `css/ui.css` is required. All links and semantics exist without scripts.

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

Use one direct named `nav` and one direct `ul` or `ol`, with native `li` children. Every actionable item is an anchor with a useful href. Number-only links have an explicit localized page name. In a numbered pager, author exactly one `aria-current="page"`, on the current page's real link; it remains activatable. An ellipsis is ordinary text, never a link, button or disabled item. `role="list"` preserves explicit list semantics when CSS removes markers, including browser/assistive-technology combinations that otherwise suppress them. The wrapper adds no role or focus stop.

## Public contract

| Surface | Decision |
| --- | --- |
| ui-pagination | CSS-only block boundary; no registration, methods, properties, generated IDs, implicit landmark, readiness marker or initialization. |
| nav name | Authored aria-label or aria-labelledby names the result set. Different pagers have distinct names; identical top/bottom link sets may share a name. |
| ul / ol / li | Native grouping and DOM order. List role is authored, not installed by UI. No arbitrary child selector can repair invalid HTML. |
| a href | Native destination, including existing filters/sort parameters and an optional result-heading fragment. Never use href="#", javascript URLs or data-page as the only destination. |
| aria-current="page" | Authored current location and CSS state. It is not selection, pressed or disabled state. UI does not compute, validate or rewrite it. |
| rel="prev" / rel="next" | Optional native link relationships on actual adjacent-page links. They add no custom activation behavior. |
| Boundaries | Omit unavailable Previous/Next links at the first/last page. Do not render an actionable link to a nonexistent page or simulate disabled anchors. |
| Page totals | Application-owned; show accurate totals only when known. With unknown totals, use real previous/next destinations only when available; do not invent a last page. A previous/next-only pager has no current-page link. |
| Events and form state | Native link events/navigation only. No ui-change, fake native change, values, validation, submit/reset or form ownership. |
| CSS variables | No new public tokens. Reuse reference spacing, selected text/background/border and shared focus variables. Theme values inherit; labels wrap and targets have a 2.75rem minimum block/inline size. |

There is no current-page attribute/property on the wrapper, page-count configuration, JSON list or client-generated URL API. Applications render the current page and its links together, preserving query/filter/sort state and checking page bounds on the server. Invalid/duplicate current markers remain authored errors; CSS does not certify correctness.

## Interaction and accessibility

Follow the [APG navigation landmark guidance](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html). Pagination is ordinary navigation, not a tablist, toolbar, menu or listbox. Use native `nav` without a duplicate navigation role. Current-page styling includes a persistent border and weight as well as color. Focus remains distinct from current location and uses shared visible-focus treatment, including forced colors.

Tab and Shift+Tab visit anchors in DOM order and leave freely. Enter, pointer and touch activate the native URL. Modified activation, middle-click, copied URLs, context menus, reload and browser Back/Forward stay native. Space and arrow keys keep browser scrolling behavior; there is no roving tabindex, trap, Home/End handler, Escape handling or live announcement from the library. Disabled/read-only/busy are not pagination control modes. Use missing links or explanatory text for unavailable destinations; content-level loading/error feedback remains application-owned.

Localize visible Previous/Next and every page-link name; preserve the visible numeral in that name. Use logical layout and the authored reading direction. DOM order stays stable; do not reverse arrays or add a second arrow-key convention for RTL. Long labels wrap; wrapping adds no responsive hiding of destinations. Icons are optional decoration beside text, never the sole navigation cue.

### Destinations, loading and focus

The default is full-document navigation. A real result-heading fragment with authored tabindex=-1 gives the browser a meaningful arrival destination. Without a fragment, document navigation and browser history restoration retain their platform behavior; UI does not force focus. Runnable examples must use actual separate static pages with different results, not query parameters that display unchanged content.

If an application intercepts links, it must preserve native navigation for modified clicks, unavailable enhancement and failures where a real destination is still useful. Keep the old result set/current marker while loading; one application status region owns announcements. Associate each result with its request/revision, abort superseded transport where possible, reject stale responses, and update results, URLs, current marker and result count coherently. Only after a user-requested update succeeds should the application focus the surviving result heading and scroll it into view; background refresh should preserve useful focus. Close/cancel pending work on task teardown. On failure, retain old content/current state and provide persistent retry or the real destination. Library CSS starts no requests and cannot implement routing or async error recovery.

No-results pages omit pagination and explain the empty state. A one-page result set can omit it too; the demo includes a single-page fixture to verify the current link if retained. Loading/error/success/empty messages belong beside results, outside the list of page links. Pagination is not a form control and must not alter descendant controls, FormData, labels, validity, submission, reset or autofill.

## Lifecycle and failure

There is no enhancement lifecycle or owned mutation: `UI.enhance` and `UI.destroy` leave pagination alone. Static/dynamic content, late links, replacement, nesting, disconnect/reconnect and adoption use native HTML/CSS. The application owns valid markup and moving focus before removing a focused task. No observer, timer, global listener, generated node, pending scroll or application state is acquired by this pattern. Do not nest navigation landmarks inside one pager or put a custom wrapper between a list and its li children.

Without CSS the list, names, links and current-page state remain useful. Without JavaScript, real pages continue to navigate. Unsupported custom-element registration APIs are irrelevant: no registration is attempted. Empty/invalid markup gains no inferred semantics or synthetic behavior. Print preserves the links and text in document order; test actual target output rather than promising print conformance. Existing native nav, class helpers, components and entry points remain compatible.

## Examples and evidence

Required examples: first/middle/last pages with real destinations and distinct results, plain-text ellipses, accurate current page, long/localized labels, RTL, a one-page set and a no-results set. Loading/error/retry and unknown-total integration are documented application responsibilities, not invented runtime modes.

Focused browser checks must verify actual link navigation and resulting content/fragment destination, boundary omissions, current-page uniqueness, names/list semantics, native modified-key ownership, no-script operation, no initialization/registration, dynamic replacement and native form values. Check two brands/modes, LTR/RTL, wrapping at 320px with enlarged text/spacing, target sizes and distinct focus/current markers. Use the documentation browser harness for catalogue/guide/specification links, source drawers and no-script reflow. Record actual dated browser/manual results and remaining screen-reader, touch, forced-colors, print and zoom work in [ACCESSIBILITY.md](../../ACCESSIBILITY.md); this specification alone closes no release gate.

## Completion

The CSS-only wrapper, native-link recipes, guide and focused browser harness now ship with foundation availability and experimental maturity. Current reference, catalogue, examples hub, roadmap and generated outputs stay aligned. No new JavaScript entry or registration is added; stable maturity still requires the [component release gate](../../ROADMAP.md#release-gate-for-every-component). Applications migrate by wrapping an existing named native navigation list in ui-pagination; URLs and native behavior retain their ownership.
