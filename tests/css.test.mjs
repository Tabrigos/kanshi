import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { root } from '../scripts/tokens.mjs';
import { literalColors, partsOutsideTheirShape, propertiesDefined, propertiesUsed, rules, ungatedLoops } from '../scripts/css-guard.mjs';

async function stylesheets() {
  const files = [];
  for (const dir of ['src', 'demo']) {
    for (const name of await readdir(path.join(root, dir))) {
      if (name.endsWith('.css')) files.push({ name: `${dir}/${name}`, css: await readFile(path.join(root, dir, name), 'utf8') });
    }
  }
  assert.ok(files.some((file) => file.name === 'src/base.css'), 'src/base.css was not found');
  assert.ok(files.length >= 4, `expected tokens, base, components and the demo sheet, found ${files.length}`);
  return files;
}

test('the guard sees a hand-written color, and ignores one in a comment', () => {
  assert.deepEqual(literalColors('a {\n  color: #ff9a1f;\n}'), [{ text: '#ff9a1f', line: 2 }]);
  assert.equal(literalColors('a { background: rgba(0, 0, 0, 0.2) }').length, 1);
  assert.deepEqual(literalColors('/* #ff9a1f */ a { color: var(--k-color-accent) }'), []);
});

test('hand-written stylesheets take every color from a token', async () => {
  const found = (await stylesheets())
    .filter((file) => file.name !== 'src/tokens.css')
    .flatMap((file) => literalColors(file.css).map((hit) => `${file.name}:${hit.line} ${hit.text}`));
  assert.deepEqual(found, []);
});

test('the guard sees a property that nobody defines', () => {
  const used = propertiesUsed('a { color: var(--k-color-txet) }');
  const defined = propertiesDefined(':root { --k-color-text: #fff }');
  assert.deepEqual([...used].filter((name) => !defined.has(name)), ['--k-color-txet']);
});

test('the loop guard sees an endless animation without its gates, and accepts a gated one', () => {
  const css = [
    '.a { animation: spin 1s linear infinite; }',
    '@media (prefers-reduced-motion: no-preference) { .b { animation: spin 1s infinite; } }',
    '@media (prefers-reduced-motion: no-preference) { .k-running .c { animation: spin 1s infinite; } }',
    '.k-running .d { animation: spin 1s infinite; }',
    '.e { animation: fade 1s ease-out; }',
  ].join('\n');
  assert.deepEqual(ungatedLoops(css).map((rule) => rule.selector), ['.a', '.b', '.k-running .d']);
});

test('every endless animation waits for the motion preference and the pause switch', async () => {
  const files = (await stylesheets()).filter((file) => file.name.startsWith('src/'));
  const loops = files.flatMap((file) => ungatedLoops(file.css).map((rule) => `${file.name}:${rule.line} ${rule.selector}`));
  assert.deepEqual(loops, []);
  const gated = files.map((file) => file.css).join('\n').match(/\binfinite\b/g) ?? [];
  assert.ok(gated.length >= 2, `expected the blink and the ticker loops, found ${gated.length}`);
});

// Found live on 2026-10-25: on a phone, a tap leaves :hover stuck on the
// ticker, which stayed paused until the next tap elsewhere.
test('a pause on :hover lives only where the pointer can hover, never on touch screens', async () => {
  const hoverPauses = (await stylesheets())
    .filter((file) => file.name.startsWith('src/'))
    .flatMap((file) => rules(file.css).map((rule) => ({ ...rule, file: file.name })))
    .filter((rule) => /:hover\b/.test(rule.selector) && /animation-play-state\s*:\s*paused/.test(rule.body));
  assert.ok(hoverPauses.length >= 1, 'the ticker pause on :hover was not found');
  const ungated = hoverPauses.filter((rule) => !rule.within.some((prelude) => /\(hover:\s*hover\)/.test(prelude)));
  assert.deepEqual(ungated.map((rule) => `${rule.file}:${rule.line} ${rule.selector}`), []);
});

test('the naming guard sees a part without the name of its shape, and accepts tones and switches', () => {
  const css = [
    '.k-card .k-title { }',
    '.k-card .k-card-title, .k-card > .k-card-body { }',
    '.k-running .k-ticker-track { }',
    '.k-led.k-tone-ok, .k-card .k-tone-critical { }',
  ].join('\n');
  assert.deepEqual(partsOutsideTheirShape(css).map((hit) => hit.part), ['k-title']);
});

test('the parts of a shape carry its name', async () => {
  const css = (await stylesheets()).find((file) => file.name === 'src/components.css').css;
  const nested = rules(css).filter((rule) => /\.k-[\w-]+[^,]*\s+[^,]*\.k-/.test(rule.selector));
  assert.ok(nested.length >= 3, `expected the nested parts of chart, hex grid and title card, found ${nested.length}`);
  assert.deepEqual(partsOutsideTheirShape(css).map((hit) => `components.css:${hit.line} ${hit.selector}`), []);
});

// A state that names a severity uses the words of the tones (k-tone-*), so
// the same alarm is not "critical" on a chip and something else on a hex.
const STATES = new Set(['off', 'ok', 'warning', 'critical']);
const statesOutsideTheList = (css) => [...css.matchAll(/\[data-state="([^"]*)"\]/g)].map((match) => match[1]).filter((value) => !STATES.has(value));

test('the state guard sees a value outside the list', () => {
  assert.deepEqual(statesOutsideTheList('.a[data-state="off"], .a[data-state="alert"] { }'), ['alert']);
});

test('every data-state value of the shapes is off, ok, warning or critical', async () => {
  const css = (await stylesheets()).find((file) => file.name === 'src/components.css').css;
  assert.ok(css.includes('[data-state="off"]'), 'the off state of the hex grid was not found');
  assert.deepEqual(statesOutsideTheList(css), []);
});

// The browser makes a th bold and centered and an h2 large with margins; these
// two shapes take elements that carry those defaults.
const selectorsOf = (css) => rules(css).flatMap((rule) => rule.selector.split(',').map((selector) => selector.trim()));
const ruleFor = (css, selector) => rules(css).find((rule) => rule.selector.split(',').map((part) => part.trim()).includes(selector));

test('a row header in the body of a table is styled as a cell, not as a column header', async () => {
  const css = (await stylesheets()).find((file) => file.name === 'src/components.css').css;
  const headerSelectors = selectorsOf(css).filter((selector) => /^\.k-table\b.*\bth\b/.test(selector));
  assert.ok(headerSelectors.length >= 1, 'no rule of .k-table styles a th');
  assert.deepEqual(headerSelectors.filter((selector) => !/\b(thead|tbody)\b.*\bth\b/.test(selector)), [], 'a th rule reaches both column and row headers');
  assert.equal(ruleFor(css, '.k-table tbody th')?.line, ruleFor(css, '.k-table td')?.line, 'a row header does not share the rule of the cells');
  const reset = rules(css).filter((rule) => /\.k-table tbody th\b/.test(rule.selector)).map((rule) => rule.body).join(';');
  assert.match(reset, /text-align\s*:\s*left/);
  assert.match(reset, /font-weight\s*:\s*inherit/);
});

test('a panel title can be a heading: it sets its own margin and size', async () => {
  const css = (await stylesheets()).find((file) => file.name === 'src/components.css').css;
  const title = ruleFor(css, '.k-panel-title');
  assert.ok(title, 'the .k-panel-title rule was not found');
  assert.match(title.body, /(^|;|\s)margin\s*:\s*0\s*(;|$)/);
  assert.match(title.body, /font-size\s*:\s*inherit/);
});

test('a stamp glows only when the page turns the effects on', async () => {
  const css = (await stylesheets()).find((file) => file.name === 'src/components.css').css;
  const halos = rules(css).filter((rule) => /\.k-stamp\b/.test(rule.selector) && /box-shadow\s*:/.test(rule.body));
  assert.ok(halos.length >= 1, 'the halo of .k-stamp was not found');
  assert.deepEqual(halos.filter((rule) => !/\.k-fx\b/.test(rule.selector)).map((rule) => `${rule.line} ${rule.selector}`), []);
});

test('every --k-* property used by a stylesheet is defined by one of them', async () => {
  const files = await stylesheets();
  const defined = new Set(files.flatMap((file) => [...propertiesDefined(file.css)]));
  const missing = files.flatMap((file) => [...propertiesUsed(file.css)].filter((name) => !defined.has(name)).map((name) => `${file.name}: ${name}`));
  assert.deepEqual(missing, []);
});
