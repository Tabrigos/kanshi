import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { root } from '../scripts/tokens.mjs';
import { contrastPromises } from '../scripts/contrast.mjs';
import { modes, tokenTree, tokensUnder } from './token-tree.mjs';

test('every contrast promise holds in every mode', async () => {
  for (const mode of await modes()) {
    const promises = contrastPromises(mode.applied);
    assert.ok(promises.length >= 15, `${mode.name}: found only ${promises.length} promises`);
    const broken = promises.filter((p) => p.ratio < p.min).map((p) => `${p.token} on ${p.on}: ${p.ratio.toFixed(2)} < ${p.min}`);
    assert.deepEqual(broken, [], `mode ${mode.name}`);
  }
});

test('a mode only redefines color roles that exist, and changes at least one', async () => {
  const base = new Set(tokensUnder((await tokenTree()).color).map(([name]) => name));
  for (const mode of await modes()) {
    assert.deepEqual(Object.keys(mode.own), ['color'], `${mode.name} touches groups other than color`);
    const redefined = tokensUnder(mode.own.color).map(([name]) => name);
    assert.ok(redefined.length > 0, `${mode.name} redefines nothing`);
    assert.deepEqual(redefined.filter((name) => !base.has(name)), [], `${mode.name} invents roles`);
  }
});

test('tokens.css carries each mode under its data-mode selector, with exactly the roles it redefines', async () => {
  const css = await readFile(path.join(root, 'src', 'tokens.css'), 'utf8');
  for (const mode of await modes()) {
    const block = new RegExp(`:root\\[data-mode="${mode.name}"\\]\\s*\\{([^}]*)\\}`).exec(css);
    assert.ok(block, `no :root[data-mode="${mode.name}"] block in tokens.css`);
    const declared = [...block[1].matchAll(/(--k-[\w-]+)\s*:/g)].map((match) => match[1]).sort();
    const expected = tokensUnder(mode.own.color).map(([name]) => `--k-color-${name}`).sort();
    assert.deepEqual(declared, expected);
  }
});
