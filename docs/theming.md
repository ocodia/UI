# Theming

UI has three token levels: reference scales, semantic roles and local component geometry. All defaults live in the `ui` cascade layer. Unlayered application CSS overrides them without specificity battles. Native HTML and interaction semantics stay the same when a theme changes.

## Reference scales

Set reference overrides on `:root`. Lengths use rem so they respect the user's root font size. These scales are available now:

| Family | Names | Defaults, in order |
| --- | --- | --- |
| Spacing | `--ui-space-0` through `--ui-space-8` | `0`, `.25rem`, `.5rem`, `.75rem`, `1rem`, `1.5rem`, `2rem`, `3rem`, `4rem` |
| Radius | `--ui-radius-none`, `-sm`, `-md`, `-lg`, `-pill` | `0`, `.125rem`, `.375rem`, `.75rem`, `999px` |
| Font size | `--ui-font-size-xs`, `-sm`, `-md`, `-lg`, `-xl`, `-2xl`, `-3xl` | `.75rem`, `.875rem`, `1rem`, `1.2rem`, `1.4rem`, `2.25rem`, `3rem` |
| Weight | `--ui-font-weight-normal`, `-medium`, `-bold` | `400`, `600`, `700` |
| Line height | `--ui-line-height-body`, `--ui-line-height-heading` | `1.6`, `1.2` |

Suffixes in the tables share the full prefix of the first name. For example, radius `-sm` means `--ui-radius-sm`.

The existing `--ui-space` defaults to `var(--ui-space-4)` and `--ui-radius` to `var(--ui-radius-md)`. Existing application overrides still win. Global spacing controls the established margins/layout gaps and default panel padding; it does not rescale every control's padding.

Body text uses `--ui-font-size-body`, defaulting to `clamp(var(--ui-font-size-md), .96rem + .2vw, 1.125rem)`. Heading 1 uses `--ui-font-size-heading-1`, defaulting to `clamp(2rem, 1.5rem + 2vw, var(--ui-font-size-3xl))`; heading 2 uses `--ui-font-size-heading-2`, defaulting to `clamp(1.65rem, 1.35rem + 1vw, var(--ui-font-size-2xl))`. Headings 3–6 use xl, lg, md and sm. These preserve the previous default sizes. Inline small text and code retain relative em sizing.

```css
:root {
  --ui-space-4: 1.125rem;
  --ui-radius-md: .5rem;
  --ui-font-size-xl: 1.5rem;
  --ui-content-width: 80rem;
}
```

## Semantic roles

| Purpose | Available variables |
| --- | --- |
| Text and backgrounds | `--ui-text`, `--ui-heading`, `--ui-muted`, `--ui-canvas`, `--ui-surface` |
| Boundaries and errors | `--ui-border`, `--ui-control-border`, `--ui-invalid` |
| Links | `--ui-link`, `--ui-link-hover` |
| Actions | `--ui-action-bg`, `--ui-action-hover`, `--ui-action-text` |
| Focus | `--ui-focus`, `--ui-focus-edge`, `--ui-focus-width` |
| Header and highlights | `--ui-header-bg`, `--ui-header-border`, `--ui-mark-bg`, `--ui-mark-text` |
| Typography | `--ui-font-sans`, `--ui-font-mono`, plus size/weight/line-height tokens above |
| Geometry | `--ui-space`, `--ui-radius`, `--ui-content-width`, `--ui-reading-width`, `--ui-gutter` |

Each of **info**, **success**, **warning**, **danger**, **selected**, **disabled** and **busy** has a `--ui-<role>-text`, `--ui-<role>-bg` and `--ui-<role>-border` triplet. For example, `--ui-warning-text`, `--ui-warning-bg` and `--ui-warning-border`. All have coordinated light/dark defaults.

`--ui-invalid` defaults to `var(--ui-danger-border)`, preserving its previous colors and independent override. Selection text defaults to the heading color; its marker defaults to the link color. Busy colors default to the information triplet. Disabled native controls now use the disabled colors at full opacity so text remains legible. Native disabled behavior is unchanged.

State colors alone do not implement widgets or semantics. Use visible state wording, a marker, and the appropriate native/ARIA state. The workspace uses selection colors with `aria-current`; workbench samples use explicit headings. Native button variants and control sizes are implemented in [the controls contract](controls.md). Comfortable/compact composition is implemented in [the density contract](density.md). Callout, badge and toast APIs remain planned.

```css
:root {
  --ui-success-text: #14532d;
  --ui-success-bg: #edf8f0;
  --ui-success-border: #287a45;
}
```

Define foreground/background/marker pairs together, including separate dark values. Colors are semantic roles rather than a requirement to reuse the brand action color for every status.

## Focus is one coordinated pair

The default pair is yellow `--ui-focus: #ffdd00` and dark `--ui-focus-edge: #0b0c0c`, with `--ui-focus-width: 3px`. Controls/error summaries use the pair as an outline and outer edge. Focused links/disclosures use the focus fill, dark text and edge. Skip links use the same colors. Header and workspace navigation no longer hard-code a separate palette.

```css
:root {
  --ui-focus: #bde9ff;
  --ui-focus-edge: #102a43;
  --ui-focus-width: 3px;
}
```

Keep the width at least 3px and verify both colors together. A light color remains distinct against dark surfaces and a dark edge against light surfaces; focused text must also contrast with its fill. Changing only one color can destroy that relationship. The workbench offers both pairs for inspection.

In forced-colors mode, focused controls, summaries and skip links use a system `Highlight` outline with an offset and no box shadow. Focused text uses `LinkText` on `Canvas`. The browser's contrast palette takes precedence over the brand pair. Follow the [GOV.UK focus rationale](https://design-system.service.gov.uk/get-started/focus-states/) and verify custom surfaces in their actual context.

## Component scope and precedence

Layout variables are listed in [the current reference](reference.md#layout-elements). Set local geometry on the component itself:

```css
#projects {
  --ui-grid-min: 20rem;
  --ui-grid-gap: var(--ui-space-5);
}
```

Each nested layout declares its own geometry defaults. Global semantic colors inherit. CSS aliases resolve where they are declared: changing a reference token on a descendant does not recompute an inherited root alias. Override references on `:root`, or override the local semantic/component variable directly.

Precedence follows normal CSS: an explicit application `--ui-space` overrides its default reference alias; a root reference override updates aliases that still use the default. Legacy light/dark color and font fallbacks remain supported. `--interactive` continues to control links only; actions have separate tokens.

Global light/dark modes are root-scoped. An embedded light panel on a dark page requires explicit local semantic values, including aliases that need recomputation. `data-theme` on an arbitrary descendant is not a complete theme switch.

## Use the forest brand

```html
<html lang="en" data-brand="forest">
  <!-- in head, after UI -->
  <link rel="stylesheet" href="css/ui.css">
  <link rel="stylesheet" href="themes/forest.css">
</html>
```

The optional stylesheet supplies light/dark link, action, selection and header colors. It keeps shared text, surfaces, feedback and focus defaults. Paths above are relative to a project root.

Set `data-theme="light"` or `data-theme="dark"` on `html` to force a mode; remove it for system preference. For another brand, start from [forest.css](../themes/forest.css): declare light values, a `prefers-color-scheme: dark` override excluding explicit light, and an explicit-dark override. Verify hover, invalid, selected and disabled states as well as the default palette.

## Verify a theme

The [theme workbench](../examples/themes.html) shows real controls, disabled/read-only states, semantic color samples and selectable focus palettes. Its state sample selectors are demonstration application CSS, not a public variant API.

Browser checks exercise computed token overrides, legacy fallbacks, text/marker contrast in two brands and modes, checkbox dimensions, and focused controls/text/header/summary/skip links. Default state text is checked against 4.5:1; applicable sample markers against 3:1. Disabled text is held to the same text target as a design choice, even though inactive controls are exempt from the relevant contrast criteria. [WCAG non-text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

Test forced colors, text resizing/spacing, zoom, reflow, print and actual screen-reader behavior separately. Contrast calculations are partial evidence. Applications that override tokens must verify the resulting combinations. Dated results and remaining work are in [ACCESSIBILITY.md](../ACCESSIBILITY.md).

## Still planned

Full palette ramps, elevation/motion scales, feedback variants, nested theme switching and token JSON export remain roadmap work. Comfortable/compact density scopes and their four profile variables are documented in [density](density.md). Native action variants and control-size profiles are available; their tokens and scope are documented in [buttons and control sizes](controls.md).
