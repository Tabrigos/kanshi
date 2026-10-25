// WCAG 2.2 contrast between two sRGB colors, and the contrast promises the
// color tokens make in their `kanshi.contrast` extension. Pure: it takes
// strings and token trees, and knows nothing about files or Style Dictionary.
// Formulas: WCAG 2.2, definitions of "relative luminance" and "contrast ratio".

export class InvalidColorError extends Error {
  constructor(value) {
    super(`expected a #rrggbb color, got ${JSON.stringify(value)}`);
    this.name = 'InvalidColorError';
    this.value = value;
  }
}

export class UnresolvedReferenceError extends Error {
  constructor(reference, from) {
    super(`token ${from} refers to ${reference}, which does not resolve to a color`);
    this.name = 'UnresolvedReferenceError';
    this.reference = reference;
    this.from = from;
  }
}

const HEX = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

/** @param {string} hex `#rrggbb` @returns {number} 0 for black, 1 for white */
export function relativeLuminance(hex) {
  const match = HEX.exec(hex);
  if (!match) throw new InvalidColorError(hex);
  const [r, g, b] = match.slice(1).map((pair) => {
    const channel = parseInt(pair, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** @returns {number} from 1 (same luminance) to 21 (black on white); order does not matter */
export function contrastRatio(hexA, hexB) {
  const [lighter, darker] = [relativeLuminance(hexA), relativeLuminance(hexB)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

// An alias chain longer than this is a loop or a mistake, not a design.
const MAX_ALIAS_DEPTH = 8;

function tokenAt(tree, dottedPath) {
  return dottedPath.split('.').reduce((node, key) => (node && typeof node === 'object' ? node[key] : undefined), tree);
}

/** Resolves a color token (following `{group.token}` aliases) to its `#rrggbb` hex. */
export function resolveHex(tree, dottedPath, depth = 0) {
  const token = tokenAt(tree, dottedPath);
  const value = token?.$value;
  if (depth > MAX_ALIAS_DEPTH || value === undefined) throw new UnresolvedReferenceError(dottedPath, dottedPath);
  if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
    const target = value.slice(1, -1);
    if (tokenAt(tree, target)?.$value === undefined) throw new UnresolvedReferenceError(target, dottedPath);
    return resolveHex(tree, target, depth + 1);
  }
  if (typeof value === 'object' && typeof value.hex === 'string') return value.hex;
  throw new UnresolvedReferenceError(dottedPath, dottedPath);
}

/**
 * Every promise found in the tree, with the ratio it actually reaches.
 * @returns {{ token: string, on: string, min: number, ratio: number }[]}
 */
export function contrastPromises(tree) {
  const found = [];
  const walk = (node, trail) => {
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('$') || !child || typeof child !== 'object') continue;
      const dottedPath = [...trail, key].join('.');
      const promise = child.$extensions?.['kanshi.contrast'];
      if (promise) {
        for (const on of promise.on) {
          const ratio = contrastRatio(resolveHex(tree, dottedPath), resolveHex(tree, on));
          found.push({ token: dottedPath, on, min: promise.min, ratio });
        }
      }
      walk(child, [...trail, key]);
    }
  };
  walk(tree, []);
  return found;
}
