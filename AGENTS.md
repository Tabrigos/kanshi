# AGENTS.md: working on Kanshi

A guide for whoever works on Kanshi, human or agent. `README.md` presents the
theme; this file says how to change it. If a document and the code disagree,
the code wins and the document gets fixed.

## 1. What you are touching

Kanshi is a frontend theme: DTCG design tokens and plain CSS, with no
framework and no runtime dependency. One source, the tokens, will feed several
outputs: today the CSS, later editor and terminal themes and a theme for
plancia-ui.

```
tokens/*.tokens.json   SINGLE SOURCE (DTCG 2025.10): palette (raw) and color roles, type, space, motion
src/tokens.css         GENERATED from the tokens (npm run tokens); committed
src/base.css           page defaults, Matisse via local() only, focus, k-grid-bg, k-fx, blink rules
src/components.css     the k-* shapes; no page layout
demo/                  the demo page: its own layout (demo.css) and sample data (demo.js)
scripts/tokens.mjs     the only module that knows Style Dictionary; builds the outputs in memory
scripts/build-tokens.mjs  writes what tokens.mjs builds
scripts/contrast.mjs   pure: WCAG contrast and the contrast promises of the tokens
scripts/css-guard.mjs  pure: literal colors and --k-* references in CSS text
tests/                 node:test, one file per module or rule
```

Who may import whom: `tokens.mjs` imports Style Dictionary; `contrast.mjs` and
`css-guard.mjs` import nothing; tests import any script.
`tests/boundaries.test.mjs` enforces it.

### Language

Everything in the repository is in English: identifiers, classes, comments,
documents, commit messages. American spelling.

## 2. Getting started

Node 24.

```bash
npm ci
npm run tokens   # regenerate src/tokens.css after changing a token
npm test         # the whole suite, under a second
```

Open `demo/index.html` in a browser to look at a change. **A change to a shape
counts as done only after it has been looked at in the demo**, at desktop and
at phone width: the tests read CSS text, they do not see layout.

## 3. Rules

- **Colors only from roles.** Components and base use `var(--k-color-*)`;
  a transparency is `color-mix(in srgb, var(--k-color-x) N%, transparent)`.
  No hex, `rgb()` or `hsl()` outside the tokens: `tests/css.test.mjs` fails on
  one. The `palette` group never reaches the CSS.
- **Every color written as components carries the same color as `hex`.** Style
  Dictionary reads the components, the contrast check reads the hex; a test
  keeps them equal.
- **A color role states its contrast** in `$extensions["kanshi.contrast"]`
  (`on`: the backgrounds it sits on, `min`: 4.5 for text, 3 for frames). A new
  role gets its promise in the same change.
- **The generated CSS is never edited by hand**: change the tokens, run
  `npm run tokens`, commit both. A test rebuilds it in memory and compares.
- **Every `--k-*` property used is defined** by tokens.css or by a stylesheet.
- **Motion**: anything that blinks uses `k-blink`, so it obeys
  `prefers-reduced-motion` and the `k-running` switch. No more than three
  flashes per second, ever.
- **No borrowed property**: no logos, characters, names or quoted text from
  any series, in code, demo or documents. Matisse is never shipped or
  downloaded, only named in `local()`.
- **No page layout in `src/`**: grids and page skeletons belong to the page.
- **No runtime dependency.** Style Dictionary is a development tool, pinned to
  an exact version.

## 4. Tests

`npm test` runs `node --test` on `tests/*.test.mjs`. Each guard also proves it
can fail: a planted violation in the same file must be caught. Expected values
come from closed forms (white on black is 21:1), never from the code under
test. A new rule arrives with its test, seen red before the fix.

## 5. Commit messages

Light and clean: the subject says what changes, the body only what is needed
to understand it. Kept out of a commit message:

- **personal data**: names, surnames, e-mail addresses. If a choice needs an
  owner, "decided by the maintainer" is enough;
- **references to AI assistants**: no mention of any assistant, and **no
  `Co-Authored-By` trailer**;
- **the chronicle**: no reconstruction of the reasoning, the order in which
  things happened or the alternatives discarded.

The reason is one: **this repository can become public**, and git history is
the part that never gets cleaned up.

## 6. What not to do

- do not write a color by hand, or use a palette token in CSS;
- do not edit `src/tokens.css`;
- do not add a runtime dependency, or raise Style Dictionary to a version
  published less than two weeks ago;
- do not rename a token or a class "for cleanliness" once a version is out.
