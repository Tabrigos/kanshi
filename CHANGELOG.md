# Changelog

All notable changes to Kanshi are recorded here, following
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.2.0] - 2026-10-30

### Added

- `k-stamp`: the verdict of a screen in large type, framed in the color of its tone, with an optional `k-stamp-label` above its `k-stamp-word`. It glows only under `k-fx`.
- `k-matrix`: a table of steps by targets, one `k-matrix-bar` per cell on the spine of its column, colored by the `data-state` of the cell (`ok`, `warning`, `critical`, `off` for waiting; none for in progress).
- Color roles `on-ok` and `on-warning`, the text set on an ok or warning fill, each with its contrast promise.
- Threshold bars: a segment of `k-segments` with a zone in `data-state` (`ok`, `warning`, `critical`) is lit in that tone, and the start of the warning and critical zones is marked across the bar.
- `data-cross` on `k-grid-bg`: a small cross in the middle of each cell instead of the lines, in `--k-grid-cross`, fit for a single box, a panel included.

### Changed

- `k-segments` holds as many segments as it has children, instead of 20. A bar of 20 looks as before; unlit segments are dimmed by a transparent color instead of `opacity`.

## [0.1.0] - 2026-10-29

### Added

- An agent skill in `skills/kanshi/`, shipped in the package and versioned with it: a short guide (which shape for which need, the rules, what not to do) and a reference of every class, custom property and data attribute, checked against the stylesheets by a test.
- A naming convention, checked by the tests: the parts of a shape carry its name (`k-titlecard-display`), and a state that names a severity uses the words of the tones (`data-state="critical"`).
- DTCG design tokens with a raw `palette` and `color` roles, each role stating the contrast it keeps; type, space and frame tokens.
- Motion tokens: eight durations from `tick` (60 ms) to `blink` (1 s) and two easings, `linear` and `out`, none elastic. Under `prefers-reduced-motion` every duration but `blink` drops to 0 ms, so states still change, at once.
- Emergency mode: `data-mode="emergency"` on the root turns the signal color and the frames red, while `ok`, `warning` and `critical` keep their meaning. Every contrast promise holds in the mode too.
- `k-led`: a square lamp in the color of its tone, unlit with `data-off`, blinking with `k-blink`.
- `k-ticker`: a running band of text that moves only with `k-running` and without `prefers-reduced-motion`, and stops under the focus and, where a pointer can hover, under the pointer, so a tap on a touch screen never leaves it stuck; `--k-ticker-duration` sets its speed (16 s by default, about 60 px/s for a 950 px line).
- Transitions on `k-button`, `k-hex`, `k-voter` and `k-segments`; the newest `k-log` line is revealed from the left.
- `src/tokens.css`, generated from the tokens as `--k-*` properties.
- `src/base.css`: page defaults, Matisse through `local()` only, focus ring, `k-grid-bg`, the `k-fx` CRT layer, `k-blink` under `prefers-reduced-motion` and `k-running`.
- `src/components.css`: panel, tab, button, label, chip, tones, hazard band, title card, hex grid, vote, countdown, segments, metric, chart, log and table.
- A demo page with moving sample data.
