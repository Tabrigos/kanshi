# Changelog

All notable changes to Kanshi are recorded here, following
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

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
