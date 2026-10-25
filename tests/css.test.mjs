import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { root } from '../scripts/tokens.mjs';
import { literalColors, propertiesDefined, propertiesUsed, ungatedLoops } from '../scripts/css-guard.mjs';

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

test('every --k-* property used by a stylesheet is defined by one of them', async () => {
  const files = await stylesheets();
  const defined = new Set(files.flatMap((file) => [...propertiesDefined(file.css)]));
  const missing = files.flatMap((file) => [...propertiesUsed(file.css)].filter((name) => !defined.has(name)).map((name) => `${file.name}: ${name}`));
  assert.deepEqual(missing, []);
});
