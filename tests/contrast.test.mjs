import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  contrastRatio,
  contrastPromises,
  InvalidColorError,
  relativeLuminance,
  UnresolvedReferenceError,
} from '../scripts/contrast.mjs';

const color = (hex) => ({ $value: { colorSpace: 'srgb', components: [0, 0, 0], hex } });

test('white on black is 21:1 and a color on itself is 1:1', () => {
  assert.equal(contrastRatio('#ffffff', '#000000'), 21);
  assert.equal(contrastRatio('#ff9a1f', '#ff9a1f'), 1);
});

test('pure red on black matches the closed form (0.2126 + 0.05) / 0.05', () => {
  assert.ok(Math.abs(contrastRatio('#ff0000', '#000000') - 5.252) < 1e-9);
});

test('mid grey #808080 on white is the well-known 3.95:1', () => {
  assert.equal(contrastRatio('#808080', '#ffffff').toFixed(2), '3.95');
});

test('the order of the two colors does not matter', () => {
  assert.equal(contrastRatio('#000000', '#ff9a1f'), contrastRatio('#ff9a1f', '#000000'));
});

test('a color that is not #rrggbb is refused with its value', () => {
  assert.throws(() => relativeLuminance('#fff'), InvalidColorError);
  assert.throws(() => relativeLuminance('orange'), (error) => error instanceof InvalidColorError && error.value === 'orange');
});

test('promises follow aliases and report the ratio reached', () => {
  const tree = {
    palette: { ink: color('#ffffff'), night: color('#000000') },
    color: {
      background: { $value: '{palette.night}' },
      text: { $value: '{palette.ink}', $extensions: { 'kanshi.contrast': { on: ['color.background'], min: 4.5 } } },
    },
  };
  assert.deepEqual(contrastPromises(tree), [{ token: 'color.text', on: 'color.background', min: 4.5, ratio: 21 }]);
});

test('a promise that is not kept shows up with a ratio under its minimum', () => {
  const tree = {
    color: {
      background: color('#000000'),
      text: { ...color('#333333'), $extensions: { 'kanshi.contrast': { on: ['color.background'], min: 4.5 } } },
    },
  };
  const [promise] = contrastPromises(tree);
  assert.ok(promise.ratio < promise.min);
});

test('an alias to a missing token is refused, naming both ends', () => {
  const tree = { color: { text: { $value: '{palette.gone}', $extensions: { 'kanshi.contrast': { on: ['color.text'], min: 3 } } } } };
  assert.throws(
    () => contrastPromises(tree),
    (error) => error instanceof UnresolvedReferenceError && error.reference === 'palette.gone' && error.from === 'color.text',
  );
});
