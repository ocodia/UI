# Density

Density controls the spacing of composed interfaces. Native control sizes remain a separate choice. Comfortable is the default; compact is an explicit CSS-only scope. No JavaScript, classes, roles or custom-element registration are required.

```html
<ui-panel data-density="compact">
  <form action="/projects" method="post">
    <ui-stack>
      <ui-field>
        <label for="project">Project name</label>
        <input id="project" name="project">
      </ui-field>
      <ui-cluster>
        <button type="submit">Save project</button>
        <button type="reset" data-variant="secondary">Reset answers</button>
      </ui-cluster>
      <ui-panel data-density="comfortable">
        <p>A task that benefits from more space.</p>
      </ui-panel>
    </ui-stack>
  </form>
</ui-panel>
```


## Scope and nesting

| `data-density` | Effect |
| --- | --- |
| omitted | Inherit the enclosing density; comfortable when no scope exists |
| `comfortable` | Restore normal composition spacing inside any compact ancestor |
| `compact` | Apply the compact spacing profile to this element and its descendants |
| empty, unknown or differently cased | No new profile; inherit the enclosing scope |

Apply the attribute to `html` for a page-wide choice, or to a panel, section, form or layout for a local choice. The nearest recognized scope wins, and scopes can nest in either direction. Removing an attribute restores ancestor inheritance immediately. Density follows the actual DOM: controls associated with a form elsewhere through `form="…"` inherit their own ancestors' density. Put the marker on their common container or on the external field too. Portalled content likewise needs its own intended scope.

A scope affects itself when it consumes density spacing: `ui-panel data-density="compact"` has compact padding. An outer layout still owns the gap between its children; a comfortable child does not enlarge its parent's cluster/grid/stack gap. Density does not hide content, choose breakpoints, switch themes or change form ownership.

## What changes

Defaults at a 16px root:

| Consumer | Comfortable | Compact |
| --- | --- | --- |
| Stack, cluster, grid and sidebar default gap | `--ui-space` (normally `1rem` / 16px) | `.75rem` / 12px |
| Layout/panel outer end margin, `ui-field` and form end margin | `--ui-space` | `.75rem` |
| Default `ui-panel` padding | `--ui-space` | `.75rem` |
| Label end margin | `.35rem` | `.25rem` |
| Hint and inline-error end margin | `.5rem` | `.375rem` |
| Fieldset padding | `1rem` | `.75rem` |

Existing `.stack`, `.cluster` and `.grid` alternatives consume the same defaults. Layout rules such as stack child-margin normalization still apply; do not add the table's margins together when a layout already owns the gap.

Control font, line height, minimum dimensions and internal padding are unchanged. So are checkbox/radio dimensions and choice-label minimum targets, select-arrow clearance, textarea rows/resizing, error-summary emphasis, colors and focus indicators. Prose typography/paragraph margins, table cells, navigation, disclosures, media and application-specific spacing keep their existing rules. This first density contract is for composed layouts and forms; it is not a universal scale for every pixel on a page.

Use `data-size="small|default|large"` on an individual supported native control when its size needs to differ. Density does not imply small controls. A small button in either density keeps its `2.5rem` minimum; a default button keeps `2.75rem`, and a large button keeps `3.5rem`. See [buttons and control sizes](controls.md).

## Theme variables and overrides

| Compact profile variable | Default |
| --- | --- |
| `--ui-density-compact-space` | `var(--ui-space-3)` (`.75rem`) |
| `--ui-density-compact-label-gap` | `var(--ui-space-1)` (`.25rem`) |
| `--ui-density-compact-message-gap` | `.375rem` |
| `--ui-density-compact-fieldset-padding` | `var(--ui-space-3)` (`.75rem`) |

Set global profile variables on `:root`, or override them on the element carrying `data-density="compact"`:

```css
#inspector {
  --ui-density-compact-space: .875rem;
  --ui-density-compact-fieldset-padding: .875rem;
}

#inspector > ui-cluster {
  --ui-cluster-gap: 1rem;
}
```

Density supplies defaults to existing local `--ui-stack-gap`, `--ui-cluster-gap`, `--ui-grid-gap`, `--ui-sidebar-gap` and `--ui-panel-padding` variables. Explicit application overrides on each component still win through normal CSS. Nested layout components retain their own local geometry; overriding one cluster does not resize every nested cluster.

Density never rewrites `--ui-space`. Comfortable scopes recover that variable at the consuming component, including descendant overrides. Compact uses its profile values independently; a custom global space smaller than `.75rem` can therefore be smaller than the stock compact profile. Choose coherent values for your application.

Aliases resolve where declared. Overriding a reference scale below `:root` does not recompute an inherited root profile variable; override the compact profile variable on its density boundary instead. Changing a profile variable below that boundary does not recompute already inherited private density aliases. Names beginning `--_ui-` are implementation details; comfortable clears those inherited compact defaults without overwriting application tokens.

## Accessibility and examples

Prefer comfortable spacing for unfamiliar tasks, long forms and touch-first interfaces. Compact is a product choice for repeated tasks where reduced surrounding space helps; it must not be selected automatically from screen width or pointer capability. Keep all labels, hints and errors visible.

Density preserves UI's existing native control/choice-label minimum dimensions. This does not establish target-size conformance for every link or custom control placed in a compact layout. WCAG's minimum target criterion is 24 by 24 CSS pixels with specified exceptions; assess the actual interface and any overrides. [Target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

The [theme workbench](../examples/themes.html#density-examples) compares the same form in both profiles and shows nested scopes with independent control sizes. Browser assertions check geometry, nesting, local/reference overrides, native form behavior, both brands/modes, RTL select padding, focus and narrow long-label reflow with doubled root text plus spacing overrides. These simulations supplement manual browser zoom, touch and screen-reader testing. Follow [text-spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) and [reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html); see the dated [evidence record](../ACCESSIBILITY.md) for actual results and limits.
