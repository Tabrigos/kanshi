// Reads CSS text for the two rules of the hand-written stylesheets: colors
// come only from tokens, and every `--k-*` property used is defined somewhere.
// Pure: it takes CSS as a string and knows nothing about which files exist.
// Named colors (`black`, `red`) are not caught: too many false positives in
// property names and values; review keeps them out.

function withoutComments(css) {
  // Keep the newlines so that line numbers stay right.
  return css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

/** Hex colors and rgb()/hsl() functions written by hand. @returns {{ text: string, line: number }[]} */
export function literalColors(css) {
  const text = withoutComments(css);
  const pattern = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(/gi;
  return [...text.matchAll(pattern)].map((match) => ({ text: match[0], line: lineOf(text, match.index) }));
}

/** @returns {Set<string>} the `--k-*` names read through var() */
export function propertiesUsed(css) {
  return new Set([...withoutComments(css).matchAll(/var\(\s*(--k-[\w-]+)/g)].map((match) => match[1]));
}

/** @returns {Set<string>} the `--k-*` names given a value */
export function propertiesDefined(css) {
  return new Set([...withoutComments(css).matchAll(/(--k-[\w-]+)\s*:/g)].map((match) => match[1]));
}
