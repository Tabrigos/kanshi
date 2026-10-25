# Changelog

All notable changes to Kanshi are recorded here, following
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- DTCG design tokens with a raw `palette` and `color` roles, each role stating the contrast it keeps; type, space and frame tokens.
- Motion tokens: eight durations from `tick` (60 ms) to `blink` (1 s) and two easings, `linear` and `out`, none elastic. Under `prefers-reduced-motion` every duration but `blink` drops to 0 ms, so states still change, at once.
- Transitions on `k-button`, `k-hex`, `k-voter` and `k-segments`; the newest `k-log` line is revealed from the left.
- `src/tokens.css`, generated from the tokens as `--k-*` properties.
- `src/base.css`: page defaults, Matisse through `local()` only, focus ring, `k-grid-bg`, the `k-fx` CRT layer, `k-blink` under `prefers-reduced-motion` and `k-running`.
- `src/components.css`: panel, tab, button, label, chip, tones, hazard band, title card, hex grid, vote, countdown, segments, metric, chart, log and table.
- A demo page with moving sample data.
