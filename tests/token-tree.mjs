// Test helper: all token files merged into one tree, as Style Dictionary
// sees them. Shared by the tests that check promises made by the tokens.

import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { root } from '../scripts/tokens.mjs';

export async function tokenTree() {
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

function mergeInto(target, override) {
  for (const [key, value] of Object.entries(override)) {
    const isGroup = value && typeof value === 'object' && !Array.isArray(value) && !('$value' in value);
    if (isGroup && target[key] && typeof target[key] === 'object') mergeInto(target[key], value);
    else if (value && typeof value === 'object' && '$value' in value && target[key]) target[key] = { ...target[key], ...value };
    else target[key] = value;
  }
  return target;
}

/** The modes in tokens/modes/: name, its own tree, and the base tree with it applied. */
export async function modes() {
  const dir = path.join(root, 'tokens', 'modes');
  const names = (await readdir(dir)).filter((name) => name.endsWith('.tokens.json'));
  assert.ok(names.includes('emergency.tokens.json'), 'tokens/modes/emergency.tokens.json was not found');
  return Promise.all(
    names.map(async (file) => {
      const own = JSON.parse(await readFile(path.join(dir, file), 'utf8'));
      return { name: file.replace('.tokens.json', ''), own, applied: mergeInto(await tokenTree(), structuredClone(own)) };
    }),
  );
}

/** Every token under a group, as [dotted path, token]. */
export function tokensUnder(group, trail = []) {
  return Object.entries(group).flatMap(([key, child]) => {
    if (key.startsWith('$') || !child || typeof child !== 'object') return [];
    return '$value' in child ? [[[...trail, key].join('.'), child]] : tokensUnder(child, [...trail, key]);
  });
}
