# Buttons and control sizes

Use native controls. Optional `data-variant` and `data-size` attributes select CSS presentation; they do not register elements, add roles, change values or intercept events. No JavaScript is needed for styling.

## Button variants

```html
<button type="submit">Save project</button>
<button type="reset" data-variant="secondary">Reset answers</button>
<button type="button" data-variant="quiet">Clear filters</button>
<button type="button" data-variant="danger">Delete draft</button>
```

| `data-variant` | Purpose |
| --- | --- |
| omitted or `primary` | Main action; preserves the existing action palette |
| `secondary` | Supporting action with a surface and visible boundary |
| `quiet` | Lower emphasis, transparent surface and link-colored text |
| `danger` | A clearly labelled destructive action; uses its own action colors |

Applies to `button` and `input[type=submit|reset|button]` only. Links remain links, and a variant on another element does not turn it into a button. Missing, empty and unknown values use the primary appearance. Values are case-sensitive.

Prefer one primary action per task group. Use explicit verbs. A danger color does not implement confirmation, undo or deletion; the application owns the operation and recovery. If an action navigates, use a real anchor. Do not nest interactive elements inside buttons.

Native button type semantics are preserved: a button without `type` inside a form still submits. Use `type="button"` for other operations. Keep real `disabled`, `name`, `value`, `form`, `formaction` and `formnovalidate` attributes where appropriate. `aria-disabled` alone does not disable a native control. Native `input` button labels remain in `value`; use `button` when long labels need to wrap.

Hover and active use each variant's hover color. Keyboard focus retains the shared two-color indicator. Disabled controls use the common disabled palette regardless of variant. Styling does not set `aria-pressed`, `aria-busy` or disabled state on the application's behalf.

## Control sizes

```html
<label for="search">Find a project</label>
<input id="search" type="search" data-size="small">
<button type="submit" data-size="small">Search</button>

<label for="title">Project title</label>
<input id="title" name="title" data-size="large">
```

| `data-size` | Minimum block size | Text and spacing |
| --- | --- | --- |
| `small` | `2.5rem` (40px at a 16px root) | `1rem` text, `.375rem` block / `.625rem` inline padding |
| omitted or `default` | `2.75rem` (44px at a 16px root) | Inherited text; existing field `.6rem` / `.75rem` and button `.55rem` / `1rem` padding |
| `large` | `3.5rem` (56px at a 16px root) | `1.2rem` text, `.75rem` block / `1.25rem` inline padding |

These are minimums, not fixed heights. Line height, borders, content and native rendering may make controls taller. The small/large profiles share geometry across single-line controls; native rendering can differ slightly. Textareas remain multiline and resizable, and listboxes retain their native rows.

Supported: buttons, submit/reset/button inputs, text-like inputs (including number/date/time), select and textarea. Excluded: checkbox, radio, range, color, file, hidden and image inputs. A size on a wrapper or `ui-field` does not size its descendants. Unknown/empty values use the default profile. Native `size` on inputs/selects keeps its standard meaning; use `data-size` for this presentation API. Existing UI width rules still apply.

Smaller controls retain legible text and exceed WCAG's 24px minimum target dimension at the default root size. Prefer comfortable defaults for touch and important tasks; small is not a global density mode. Custom fonts, root sizes and token overrides must be checked in context. Keep content and focus visible at text resize/zoom. [WCAG target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

## Theme variables

Primary buttons keep `--ui-action-bg`, `--ui-action-hover` and `--ui-action-text`. Supporting variants use these triplets plus a border:

- `--ui-action-secondary-bg`, `--ui-action-secondary-hover`, `--ui-action-secondary-text`, `--ui-action-secondary-border`.
- `--ui-action-quiet-bg`, `--ui-action-quiet-hover`, `--ui-action-quiet-text`, `--ui-action-quiet-border`.
- `--ui-action-danger-bg`, `--ui-action-danger-hover`, `--ui-action-danger-text`, `--ui-action-danger-border`.

Secondary defaults to the surface/text/control-border palette and selected background on hover. Quiet defaults to transparent/link text with a surface hover. Danger defaults to `#b42318` / `#8a1c13` hover with white text in both modes; its border is transparent. Danger action colors are separate from inline error colors. Secondary/quiet aliases follow both brands' light/dark semantics.

Geometry variables:

| Tokens | Defaults |
| --- | --- |
| `--ui-control-min-size` | `2.75rem` |
| `--ui-control-padding-block`, `--ui-control-padding-inline` | `.6rem`, `.75rem` |
| `--ui-button-padding-block`, `--ui-button-padding-inline` | `.55rem`, `1rem` |
| `--ui-control-small-min-size`, `--ui-control-small-padding-block`, `--ui-control-small-padding-inline`, `--ui-control-small-font-size` | `2.5rem`, `.375rem`, `.625rem`, `var(--ui-font-size-md)` |
| `--ui-control-large-min-size`, `--ui-control-large-padding-block`, `--ui-control-large-padding-inline`, `--ui-control-large-font-size` | `3.5rem`, `.75rem`, `1.25rem`, `var(--ui-font-size-lg)` |

Normal geometry variables affect the default profile. Small/large read their corresponding profile variables. Set global values on `:root`, or override the appropriate profile variable on one control. Names beginning `--_ui-` are implementation details, not a public API. Shared `data-density="comfortable|compact"` scopes are implemented separately; they adjust composition spacing and preserve these control-size profiles. See [density](density.md).

In forced colors, buttons have a system-color boundary, disabled controls use system disabled colors, and focus uses the existing system outline. Print uses plain dark text/borders on white regardless of variant. Manual platform verification remains part of the release gate.

## Examples and checks

The [theme workbench](../examples/themes.html#action-variants) includes all variants, disabled states and small/default/large fields, selects, textareas and buttons. Appearance-preview buttons only report their label; they perform no project operations. The workspace and response recipes use the secondary reset action.

Browser assertions check actual form submission/reset/submitter behavior, supported/excluded size targets, contrast in both brands/modes, focus preservation, long-label reflow and doubled root text size. Use the [browser checks](../tests/accessibility.html), then complete the manual tests recorded in [ACCESSIBILITY.md](../ACCESSIBILITY.md). A passing style or contrast check does not complete an accessibility audit.
