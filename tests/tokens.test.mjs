import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { buildTokenFiles, root } from '../scripts/tokens.mjs';
import { contrastPromises } from '../scripts/contrast.mjs';

async function tokenTree() {
  const dir = path.join(root, 'tokens');
  const names = (await readdir(dir)).filter((name) => name.endsWith('.tokens.json'));
  assert.ok(names.length >= 3, `expected the three token files, found ${names.length}`);
  const tree = {};
  for (const name of names) {
    for (const [group, value] of Object.entries(JSON.parse(await readFile(path.join(dir, name), 'utf8')))) {
      assert.ok(!(group in tree), `group ${group} is defined in two token files`);
      tree[group] = value;
    }
  }
  return tree;
}

test('every committed generated file is exactly what the tokens produce', async () => {
  const files = await buildTokenFiles();
  assert.ok(files.some((file) => file.destination === 'src/tokens.css'), 'src/tokens.css is not among the outputs');
  for (const file of files) {
    const committed = await readFile(path.join(root, file.destination), 'utf8');
    assert.equal(committed, file.output, `${file.destination} differs from the tokens: run npm run tokens`);
  }
});

test('every generated CSS value is a real value, not an object Style Dictionary could not read', async () => {
  const [css] = (await buildTokenFiles()).filter((file) => file.destination.endsWith('.css'));
  const declarations = [...css.output.matchAll(/^\s*(--k-[\w-]+):\s*([^;]*);/gm)];
  assert.ok(declarations.length >= 20, `found only ${declarations.length} declarations`);
  for (const [, name, value] of declarations) {
    assert.doesNotMatch(value, /\[object|undefined|NaN|^\s*$/, `${name} has the value "${value}"`);
  }
});

test('the palette stays out of the CSS: components reach colors only through roles', async () => {
  const [css] = (await buildTokenFiles()).filter((file) => file.destination.endsWith('.css'));
  assert.match(css.output, /--k-color-text:/);
  assert.doesNotMatch(css.output, /--k-palette-/);
});

test('the hex of every color is the same color as its components', async () => {
  // Style Dictionary reads the components, the contrast check reads the hex:
  // the two copies must not drift apart.
  const colors = [];
  const walk = (node, trail) => {
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$') || !child || typeof child !== 'object') continue;
      if (child.$value?.colorSpace) colors.push({ name: [...trail, key].join('.'), value: child.$value });
      else walk(child, [...trail, key]);
    }
  };
  walk(await tokenTree(), []);
  assert.ok(colors.length >= 8, `found only ${colors.length} colors written as components`);
  const drifted = colors
    .filter(({ value }) => value.colorSpace !== 'srgb' || value.hex.toLowerCase() !== `#${value.components.map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`)
    .map(({ name, value }) => `${name}: ${value.hex} vs ${value.colorSpace} ${value.components.join(' ')}`);
  assert.deepEqual(drifted, []);
});

test('every color role keeps the contrast it promises', async () => {
  const promises = contrastPromises(await tokenTree());
  assert.ok(promises.length >= 15, `found only ${promises.length} contrast promises`);
  assert.ok(promises.some((p) => p.token === 'color.text' && p.on === 'color.background'));
  const broken = promises.filter((p) => p.ratio < p.min).map((p) => `${p.token} on ${p.on}: ${p.ratio.toFixed(2)} < ${p.min}`);
  assert.deepEqual(broken, []);
});
