# Kanshi reference

Contents: [Stylesheets](#stylesheets) · [Page switches](#page-switches) ·
[Shapes](#shapes) · [Tones](#tones) · [Data attributes](#data-attributes) ·
[Custom properties](#custom-properties) · [Emergency mode](#emergency-mode)

Every class, custom property and data attribute of Kanshi 0.1.0. A test
checks this file against the stylesheets: each name here exists, and each
name of the stylesheets is here.

## Stylesheets

| File | Holds | Needs |
|---|---|---|
| `node_modules/kanshi/src/tokens.css` | the `--k-*` tokens on `:root`, and the emergency mode | nothing |
| `node_modules/kanshi/src/base.css` | page defaults, fonts, focus ring, page switches, blink, reduced motion | tokens |
| `node_modules/kanshi/src/components.css` | the shapes | tokens and base |

## Page switches

### `.k-running`

On `<html>`. While present, `.k-blink` blinks and `.k-ticker` runs (both
only without `prefers-reduced-motion`). Remove it to pause every endless
animation (WCAG 2.2.2).

### `.k-blink`

On any element: blinks once per second (`--k-motion-duration-blink`), down
to 35% opacity, in hard steps. Gated by `.k-running` and the motion
preference; otherwise the element stays fully visible.

### `.k-fx`

On `<html>`: static scanlines over the page (`--k-scanline`), a glow on
`.k-glow` text and a halo around `.k-stamp`. Off unless the page opts in.

### `.k-glow`

On text: a glow (`--k-glow`), shown only under `.k-fx`.

### `.k-grid-bg`

On `<body>` or a large container: the faint monitor grid, cells of
`--k-frame-grid`, lines of `--k-grid-line`.

## Shapes

### `.k-label`

Uppercase, tracked caption in the interface face, caption size. Combine with
other classes (`.k-metric-label k-label`).

### `.k-tab`

A solid accent block with dark text: the name tag of a screen.

### `.k-button`

An outlined accent button. `aria-pressed="true"` fills it, for toggles.

### `.k-panel`

A framed screen with bright corner marks; a flex column.

- `.k-panel-head`: the top row, ruled below.
- `.k-panel-title`: the slanted accent tab; a `<span lang="ja">` inside is
  set in mincho. Usually an `<h2>`: it sets its own margin and size, so the
  heading looks like any other title tab.
- `.k-panel-meta`: small data text at the right of the head.
- `.k-panel-body`: the content, a flex column with gaps.

### `.k-chip`

A state in words with a square marker, framed in the current color. Takes a
tone.

### `.k-stamp`

The verdict of a screen in large type, framed with rounded corners in the
color of its tone (accent without one), next to what it judges. A `.k-chip`
stays the state of one line or one cell. Takes a tone and `.k-blink`; under
`.k-fx` it glows.

- `.k-stamp-label`: an optional small line above, saying what is judged.
- `.k-stamp-word`: the verdict.

### `.k-led`

A 10px square lamp in the color of its tone (accent without one). With
`data-off` it is unlit, a hollow square; with `.k-blink` it blinks. Place it
next to words that say the state.

### `.k-ticker`

A band of text running right to left. Holds `.k-ticker-track`, whose two
equal children (the second `aria-hidden="true"`) make a loop without a seam.
Runs only under `.k-running` and without reduced motion; pauses under focus,
and under the pointer where the pointer can hover. Speed: set
`--k-ticker-duration` on `.k-ticker` (16s by default, about 60 px/s for a
950px line).

### `.k-hazard`

Diagonal accent stripes around one child that holds a short notice.

### `.k-titlecard`

A framed box around an `<svg>` whose `<text>` lines are squeezed to their
width with `textLength` and `lengthAdjust="spacingAndGlyphs"`.

- `.k-titlecard-display`: a line in the mincho display face, weight 900.
- `.k-titlecard-ui`: a line in the condensed interface face.
- `.k-titlecard-rule`: a `<line>` drawn as a 3-unit rule.
- `data-accent` on a line: sets it in the accent color.

### `.k-hexgrid`

An `<svg>` that holds the hexagons, scaled to its container width.

### `.k-hex`

A `<g>` holding a `<polygon>` and up to two `<text>`: the first in mincho,
22px; `.k-hex-sub` is the small label below, in the interface face. States
in `data-state`:

- no value, or any other value such as `ok`: accent outline;
- `data-state="off"`: dashed border-colored outline, dim text;
- `data-state="critical"`: filled with `--k-color-critical`, text in
  `--k-color-on-critical`. Add `.k-blink` to make it blink.

### `.k-vote`

A three-column grid of voters.

### `.k-voter`

A framed voter: `.k-voter-sign` (a large mincho sign) and `.k-voter-name`
(dim data text), plus any `.k-label`. Its vote in `data-vote`:
`data-vote="yes"` (ok color), `data-vote="no"` (critical color, tinted
background), `data-vote="wait"` (warning color).

### `.k-verdict`

The row under a vote, ruled above. `.k-verdict-word` is the verdict in large
mincho; give it a tone.

### `.k-countdown`

A large data-face number in the accent color; a `<small>` inside sets the
fraction at 45%. `data-low` turns it critical.

### `.k-segments`

A bar of 20 segments, one child each. `data-on` on a child lights it in the
accent color; `data-low` on the bar lights them critical.

### `.k-metric`

A value with its label and unit, ruled at the left in the accent color, or
in the tone color with `.k-tone-ok` or `.k-tone-critical`.

- `.k-metric-label`: dim caption, usually with `.k-label`.
- `.k-metric-value`: the value, large and in tabular figures.
- `.k-metric-unit`: dim small data text.

### `.k-chart`

An `<svg>` chart whose marks the page draws:

- `.k-chart-grid`: horizontal grid lines;
- `.k-chart-axis`: axis text;
- `.k-chart-area`: the filled area under the line, an accent tint;
- `.k-chart-line`: the data line, accent, 2 units;
- `.k-chart-threshold`: a dashed critical line, with `.k-chart-threshold-label`
  for its text;
- `.k-chart-end`: the dot at the newest point.

### `.k-log`

A column of lines aligned to the bottom, at least about 8 lines tall; each
line is cut with an ellipsis. Lines are dim, the one with `data-newest` is
full color and is revealed from the left. `.k-log-tag` is the bracketed tag
of a line, accent, or a tone color with a tone class.

### `.k-table`

A data-face table, at least 560px wide, with accent-ruled headers and hover
rows. The column headers are the `<th>` of `<thead>`; a `<th scope="row">` in
`<tbody>` names its row and looks like the other cells. Wrap it in
`.k-table-wrap`, which scrolls sideways when the table is wider than its
panel.

## Tones

### `.k-tone-ok`, `.k-tone-warning`, `.k-tone-critical`

Set the color of a state: text and `currentColor` frames (`.k-chip`,
`.k-stamp`), the
lamp of `.k-led`, the rule of `.k-metric`, the color of `.k-verdict-word` and
`.k-log-tag`. The words of the state go in the element too.

## Data attributes

| Attribute | On | Effect |
|---|---|---|
| `data-mode="emergency"` | `<html>` | the emergency mode; `data-mode` with any other value does nothing |
| `data-state` | `.k-hex` | `data-state="off"`, `data-state="critical"` |
| `data-vote` | `.k-voter` | `data-vote="yes"`, `data-vote="no"`, `data-vote="wait"` |
| `data-off` | `.k-led` | unlit lamp |
| `data-low` | `.k-countdown`, `.k-segments` | critical color |
| `data-on` | a child of `.k-segments` | lit segment |
| `data-newest` | a line of `.k-log` | full color, revealed |
| `data-accent` | a line inside `.k-titlecard` | accent color |

## Custom properties

All are set on `:root` by the stylesheets; a page reads them with `var()`
and may override them in its own stylesheet.

### Color roles

| Property | Role |
|---|---|
| `--k-color-background` | page background |
| `--k-color-surface` | panel background |
| `--k-color-border` | frames and dividers, 3:1 on both backgrounds |
| `--k-color-text` | values and primary text, 4.5:1 |
| `--k-color-text-dim` | labels, units, secondary text, 4.5:1 |
| `--k-color-accent` | the signal color: tabs, active controls, data lines, 4.5:1 |
| `--k-color-on-accent` | text on an accent fill |
| `--k-color-ok` | ok state, 4.5:1 |
| `--k-color-warning` | warning state, 4.5:1 |
| `--k-color-critical` | critical state, 4.5:1 |
| `--k-color-on-critical` | text on a critical fill |

Derived in base.css from the roles, so they follow the emergency mode:

| Property | What |
|---|---|
| `--k-tint-accent` | accent at 14%: hover fills, chart area |
| `--k-tint-critical` | critical at 8%: the background of a `no` voter |
| `--k-rule-soft` | border at 50%: table row rules |
| `--k-grid-line` | accent at 10%: the background grid |
| `--k-glow` | a `text-shadow` value for `.k-glow` |
| `--k-scanline` | the dark band of the scanlines |

### Type

| Property | Value |
|---|---|
| `--k-font-family-display` | Matisse when installed, then Zen Old Mincho, Noto Serif JP, Hiragino Mincho ProN, serif |
| `--k-font-family-ui` | Barlow Condensed, Arial Narrow, Helvetica Neue, sans-serif |
| `--k-font-family-data` | M PLUS 1 Code, ui-monospace, Cascadia Mono, monospace |
| `--k-font-weight-display` | 900 |
| `--k-font-weight-ui` | 600 |
| `--k-font-weight-data` | 400 |
| `--k-font-weight-data-strong` | 700 |
| `--k-font-size-caption` | 0.75rem, the smallest text allowed |
| `--k-font-size-ui` | 0.95rem, the body |
| `--k-font-size-heading` | 1.15rem |
| `--k-font-size-value` | 2.6rem, a metric read from across the room |
| `--k-font-tracking-label` | 0.14em, the tracking of uppercase labels |

### Space and frame

| Property | Value |
|---|---|
| `--k-space-1` | 4px |
| `--k-space-2` | 8px |
| `--k-space-3` | 12px |
| `--k-space-4` | 16px |
| `--k-space-5` | 24px |
| `--k-space-6` | 40px |
| `--k-frame-line` | 1px, the panel border |
| `--k-frame-corner` | 10px, the bright corner marks of a panel |
| `--k-frame-grid` | 48px, the cell of `.k-grid-bg` |

### Motion

Durations, from the shortest; under reduced motion all but the blink are 0ms.

| Property | Value | For |
|---|---|---|
| `--k-motion-duration-tick` | 60ms | a counter stepping |
| `--k-motion-duration-step` | 90ms | one segment lighting up |
| `--k-motion-duration-swap` | 110ms | a shape changing state |
| `--k-motion-duration-draw` | 140ms | a line or log entry appearing |
| `--k-motion-duration-lock` | 180ms | a marker settling |
| `--k-motion-duration-sweep` | 260ms | a scan over a panel |
| `--k-motion-duration-trace` | 520ms | a plot drawing its line |
| `--k-motion-duration-blink` | 1000ms | the blink period, one flash per second |
| `--k-motion-easing-linear` | linear | scans and sweeps |
| `--k-motion-easing-out` | fast start, no overshoot | arrivals |

### Shape settings

| Property | Default | On |
|---|---|---|
| `--k-ticker-duration` | 16s | `.k-ticker` |

## Emergency mode

`data-mode="emergency"` on `<html>` redefines four roles and nothing else:
`--k-color-surface` (dark red glass), `--k-color-border`,
`--k-color-text-dim` and `--k-color-accent` (red). The state colors
`--k-color-ok`, `--k-color-warning` and `--k-color-critical` keep their
meaning, and every contrast promise holds in the mode too.
