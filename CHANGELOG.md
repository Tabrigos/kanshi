# Changelog

All notable changes to Kanshi are recorded here, following
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- DTCG design tokens with a raw `palette` and `color` roles, each role stating the contrast it keeps; type, space, frame and motion tokens.
- `src/tokens.css`, generated from the tokens as `--k-*` properties.
- `src/base.css`: page defaults, Matisse through `local()` only, focus ring, `k-grid-bg`, the `k-fx` CRT layer, `k-blink` under `prefers-reduced-motion` and `k-running`.
- `src/components.css`: panel, tab, button, label, chip, tones, hazard band, title card, hex grid, vote, countdown, segments, metric, chart, log and table.
- A demo page with moving sample data.
