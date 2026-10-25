import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { root } from '../scripts/tokens.mjs';

function importsOf(source) {
  return [...source.matchAll(/^\s*import\s[^'"]*['"]([^'"]+)['"]/gm)].map((match) => match[1]);
}

async function scripts() {
  const dir = path.join(root, 'scripts');
  const names = (await readdir(dir)).filter((name) => name.endsWith('.mjs'));
  assert.ok(names.includes('contrast.mjs') && names.includes('tokens.mjs'), 'the scripts were not found');
  return Promise.all(names.map(async (name) => ({ name, imports: importsOf(await readFile(path.join(dir, name), 'utf8')) })));
}

test('the import reader sees an import', () => {
  assert.deepEqual(importsOf("import { readFile } from 'node:fs/promises';\nimport x from \"style-dictionary\";"), ['node:fs/promises', 'style-dictionary']);
});

test('only tokens.mjs knows Style Dictionary', async () => {
  const users = (await scripts()).filter((script) => script.imports.includes('style-dictionary')).map((script) => script.name);
  assert.deepEqual(users, ['tokens.mjs']);
});

test('the pure modules import nothing: no files, no Style Dictionary', async () => {
  const all = await scripts();
  for (const name of ['contrast.mjs', 'css-guard.mjs']) {
    assert.deepEqual(all.find((script) => script.name === name).imports, [], `${name} imports something`);
  }
});
