# Kanshi

**監視**, "monitoring". A frontend theme drawn from the monitor interfaces of
1990s Japanese mecha anime: amber signals on black glass, heavy mincho title
cards squeezed to fill their frame, hexagonal alarm grids, condensed uppercase
labels. Built for dashboards and monitoring screens, where every panel exists
to tell you what is happening.

> **Status: 0.0, not released.** The palette is provisional, chosen by eye: it
> will be replaced by colors sampled from frames of the original series. Names
> of classes and tokens may still change.

## What is in the box

- **Design tokens** in the [DTCG 2025.10](https://www.designtokens.org/) format
  (`tokens/*.tokens.json`): the single source. Colors come in two layers, a raw
  `palette` and the `color` roles that components use.
- **`src/tokens.css`**, generated from the tokens as `--k-*` custom properties.
- **`src/base.css`**: page defaults, the free font stack, focus, an optional
  background grid (`k-grid-bg`) and CRT layer (`k-fx` on the root), and the
  blink that stops when asked.
- **`src/components.css`**: framework-free shapes, such as panel, tab, button,
  chip, metric, hazard band, title card, hex grid, vote, countdown, chart, log
  and table.
- **`demo/index.html`**: every shape on one screen with moving sample data.
  Open it straight from the file system.

## Use it

```html
<link rel="stylesheet" href="kanshi/src/tokens.css">
<link rel="stylesheet" href="kanshi/src/base.css">
<link rel="stylesheet" href="kanshi/src/components.css">

<section class="k-panel">
  <div class="k-panel-head">
    <div class="k-panel-title">Power <span lang="ja">残存電力</span></div>
    <span class="k-panel-meta">INTERNAL</span>
  </div>
  <div class="k-panel-body">
    <span class="k-chip k-tone-critical">Low</span>
  </div>
</section>
```

Fonts are not bundled. The demo loads Zen Old Mincho, Barlow Condensed and
M PLUS 1 Code from Google Fonts, all under the SIL Open Font License. The title
face of the original series, Matisse EB by Fontworks, is not redistributable:
Kanshi uses it only when it is already installed on the viewer's machine.

## Accessibility

- Every color role states the contrast it must keep (WCAG 2.2: 4.5:1 for text,
  3:1 for frames) and the tests check it on every change.
- Alarms blink once per second, under the three-flashes limit of WCAG 2.3.1,
  only without `prefers-reduced-motion`, and only while the root carries
  `k-running`, so a page can offer a pause (WCAG 2.2.2).
- Scanlines and glow sit behind the `k-fx` class, so they can be switched off.

## Not affiliated

Kanshi borrows a visual language, not a property. It is not affiliated with or
endorsed by any studio, contains no logos, characters or names from any series,
and must not be presented as official merchandise.

## Develop

Node 24.

```bash
npm ci
npm run tokens   # tokens/*.tokens.json → src/tokens.css
npm test         # contrast promises, generated file, CSS guards, module boundaries
```

How to change it: [`AGENTS.md`](AGENTS.md).

## License

[MIT](LICENSE).
