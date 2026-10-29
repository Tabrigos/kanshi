// The skill in skills/kanshi/ names only classes, properties and data
// attributes that the stylesheets define, and its reference lists every one
// of them. Kanshi has no JS entry, so tests/skill.test.mjs leaves the names
// to this file (its NAMES_TEST).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { root } from '../scripts/tokens.mjs';
import { attributesStyled, classesStyled, propertiesDefined } from '../scripts/css-guard.mjs';

const SKILL_DIR = path.join(root, 'skills', 'kanshi');

/** The code of a Markdown text: fenced blocks and backtick spans, where names are written as a page writes them. */
function codeOf(markdown) {
  const fences = [...markdown.matchAll(/^```[^\n]*\n([\s\S]*?)^```/gm)].map((m) => m[1]);
  const spans = [...markdown.replace(/^```[^\n]*\n[\s\S]*?^```/gm, '').matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);
  return [...fences, ...spans].join('\n');
}

/**
 * The names a Markdown text cites in its code: classes with or without the
 * dot, `--k-*` properties, data attributes with or without a value. A name
 * ending in `-*` is a prefix. Prose is skipped: "data-face" there is a word.
 */
function namesCited(text) {
  const markdown = codeOf(text);
  const classes = [...markdown.matchAll(/(?<![\w-])\.?(k-[a-z0-9]+(?:-[a-z0-9]+)*)(-\*)?/g)].map((m) => (m[2] ? `${m[1]}-*` : m[1]));
  const properties = [...markdown.matchAll(/(--k-[a-z0-9]+(?:-[a-z0-9]+)*)(-\*)?/g)].map((m) => (m[2] ? `${m[1]}-*` : m[1]));
  const attributes = [...markdown.matchAll(/(?<![\w-])(data-[a-z]+(?:-[a-z]+)*)(?:="([^"]*)")?/g)].map((m) => (m[2] === undefined ? m[1] : `${m[1]}="${m[2]}"`));
  return { classes: new Set(classes), properties: new Set(properties), attributes: new Set(attributes) };
}

/** Cited names that the stylesheets do not define; a prefix needs one name that starts with it. */
function unknown(cited, defined) {
  return [...cited].filter((name) => (name.endsWith('-*') ? ![...defined].some((d) => d.startsWith(name.slice(0, -1))) : !defined.has(name)));
}

/** The class names in the `###` headings of a reference. */
function headings(markdown) {
  return new Set(markdown.split('\n').filter((line) => /^###\s/.test(line)).flatMap((line) => [...line.matchAll(/`\.(k-[\w-]+)`/g)].map((m) => m[1])));
}

/** Classes that are not a part of another class: `k-panel`, not `k-panel-head`. */
function shapes(classes) {
  return [...classes].filter((name) => ![...classes].some((other) => other !== name && name.startsWith(`${other}-`)));
}

async function load() {
  const css = (await Promise.all(['tokens', 'base', 'components'].map((name) => readFile(path.join(root, 'src', `${name}.css`), 'utf8')))).join('\n');
  const defined = { classes: classesStyled(css), properties: propertiesDefined(css), attributes: attributesStyled(css) };
  assert.ok(defined.classes.has('k-panel') && defined.classes.size >= 40, `expected the k-* classes of the stylesheets, found ${defined.classes.size}`);
  assert.ok(defined.properties.has('--k-color-accent') && defined.properties.size >= 40, `expected the --k-* properties, found ${defined.properties.size}`);
  assert.ok(defined.attributes.has('data-mode="emergency"'), 'the emergency mode attribute was not found');
  const skill = await readFile(path.join(SKILL_DIR, 'SKILL.md'), 'utf8');
  const reference = await readFile(path.join(SKILL_DIR, 'references', 'api.md'), 'utf8');
  return { defined, skill, reference };
}

test('the guards read names the way a page writes them, and see a name that does not exist', () => {
  const cited = namesCited([
    'A data-face k-word in prose. Use `.k-panel` with `k-tone-*`, `--k-color-*` and `--k-space-2`; `--k-colour-text`.',
    '```html',
    '<g class="k-hex" data-state="critical" data-off>',
    '```',
  ].join('\n'));
  assert.deepEqual([...cited.classes], ['k-hex', 'k-panel', 'k-tone-*']);
  assert.deepEqual([...cited.properties], ['--k-color-*', '--k-space-2', '--k-colour-text']);
  assert.deepEqual([...cited.attributes], ['data-state="critical"', 'data-off']);
  assert.deepEqual(unknown(cited.properties, new Set(['--k-color-text', '--k-space-2'])), ['--k-colour-text']);
  assert.deepEqual(unknown(new Set(['k-tone-*', 'k-hue-*']), new Set(['k-tone-ok'])), ['k-hue-*']);
  assert.deepEqual(shapes(new Set(['k-panel', 'k-panel-head', 'k-vote', 'k-voter', 'k-grid-bg'])), ['k-panel', 'k-vote', 'k-voter', 'k-grid-bg']);
});

test('every class, property and data attribute the skill cites is defined by the stylesheets', async () => {
  const { defined, skill, reference } = await load();
  for (const [file, text] of [['SKILL.md', skill], ['references/api.md', reference]]) {
    const cited = namesCited(text);
    assert.ok(cited.classes.size >= 10, `${file}: expected to cite classes, found ${cited.classes.size}`);
    assert.deepEqual(unknown(cited.classes, defined.classes), [], `${file}: classes no stylesheet styles`);
    assert.deepEqual(unknown(cited.properties, defined.properties), [], `${file}: properties no stylesheet defines`);
    assert.deepEqual(unknown(cited.attributes, defined.attributes), [], `${file}: data attributes no stylesheet reads`);
  }
});

test('the reference lists every class, property and data attribute of the stylesheets', async () => {
  const { defined, reference } = await load();
  const cited = namesCited(reference);
  assert.deepEqual([...defined.classes].filter((name) => !cited.classes.has(name)), [], 'classes missing from references/api.md');
  assert.deepEqual([...defined.properties].filter((name) => !cited.properties.has(name)), [], 'properties missing from references/api.md');
  assert.deepEqual([...defined.attributes].filter((name) => !cited.attributes.has(name)), [], 'data attributes missing from references/api.md');
});

test('every shape has its heading in the reference, and every heading names a class', async () => {
  const { defined, reference } = await load();
  const titled = headings(reference);
  assert.deepEqual(shapes(defined.classes).filter((name) => !titled.has(name)), [], 'shapes without a ### heading in references/api.md');
  assert.deepEqual([...titled].filter((name) => !defined.classes.has(name)), [], 'headings that name no class');
});
