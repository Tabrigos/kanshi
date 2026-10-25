import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { root } from '../scripts/tokens.mjs';
import { tokenTree, tokensUnder } from './token-tree.mjs';

async function motion() {
  const tree = await tokenTree();
  assert.ok(tree.motion?.duration && tree.motion?.easing, 'tokens motion.duration and motion.easing are missing');
  const durations = tokensUnder(tree.motion.duration);
  const easings = tokensUnder(tree.motion.easing);
  assert.ok(durations.length >= 6, `found only ${durations.length} durations`);
  assert.ok(easings.length >= 2, `found only ${easings.length} easings`);
  return { durations, easings };
}

const milliseconds = ({ $value }) => ($value.unit === 's' ? $value.value * 1000 : $value.value);

test('the blink keeps under three flashes per second (WCAG 2.3.1)', async () => {
  const { durations } = await motion();
  const blink = durations.find(([name]) => name === 'blink');
  assert.ok(blink, 'motion.duration.blink is missing');
  assert.ok(milliseconds(blink[1]) >= 1000 / 3, `blink period ${milliseconds(blink[1])} ms is shorter than a third of a second`);
});

test('every duration is in ms or s, and none is longer than 1.2 s', async () => {
  const { durations } = await motion();
  const wrong = durations
    .filter(([, token]) => !['ms', 's'].includes(token.$value?.unit) || milliseconds(token) < 0 || milliseconds(token) > 1200)
    .map(([name, token]) => `${name}: ${JSON.stringify(token.$value)}`);
  assert.deepEqual(wrong, []);
});

test('no easing overshoots: the motion is mechanical, never elastic', async () => {
  const { easings } = await motion();
  const elastic = easings
    .filter(([, token]) => token.$value.length !== 4 || token.$value.some((n) => n < 0 || n > 1))
    .map(([name, token]) => `${name}: ${token.$value}`);
  assert.deepEqual(elastic, []);
});

test('under reduced motion every transition duration drops to zero, so states change at once', async () => {
  const { durations } = await motion();
  const base = await readFile(path.join(root, 'src', 'base.css'), 'utf8');
  const block = /@media \(prefers-reduced-motion: reduce\)\s*\{\s*:root\s*\{([^}]*)\}/.exec(base);
  assert.ok(block, 'base.css has no reduced-motion block on :root');
  const zeroed = new Set([...block[1].matchAll(/(--k-motion-duration-[\w-]+)\s*:\s*0ms/g)].map((match) => match[1]));
  // The blink is not a transition: it stops altogether (see k-blink).
  const expected = durations.filter(([name]) => name !== 'blink').map(([name]) => `--k-motion-duration-${name}`);
  assert.deepEqual(expected.filter((name) => !zeroed.has(name)), []);
});
