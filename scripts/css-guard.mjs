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

/**
 * Every rule of a stylesheet with the at-rule preludes around it, enough to
 * tell where a declaration lives. Not a full parser: it relies on balanced
 * braces, which the stylesheets of this repo have.
 * @returns {{ selector: string, body: string, within: string[], line: number }[]}
 */
export function rules(css) {
  const text = withoutComments(css);
  const found = [];
  const stack = [];
  let start = 0;
  for (let index = 0; index < text.length; index++) {
    if (text[index] === '{') {
      stack.push({ prelude: text.slice(start, index).trim(), open: index });
      start = index + 1;
    } else if (text[index] === '}') {
      const block = stack.pop();
      if (block && !block.prelude.startsWith('@')) {
        found.push({
          selector: block.prelude,
          body: text.slice(block.open + 1, index),
          within: stack.map((outer) => outer.prelude),
          line: lineOf(text, block.open),
        });
      }
      start = index + 1;
    } else if (text[index] === ';' && stack.length === 0) {
      start = index + 1;
    }
  }
  return found;
}

/**
 * Rules that start an endless animation without the two gates WCAG asks for:
 * the viewer's motion preference (2.3.3) and the page's pause switch (2.2.2).
 * @returns {{ selector: string, line: number }[]}
 */
export function ungatedLoops(css) {
  return rules(css)
    .filter((rule) => /\banimation\s*:[^;]*\binfinite\b|animation-iteration-count\s*:\s*infinite/.test(rule.body))
    .filter((rule) => !(rule.within.some((prelude) => /prefers-reduced-motion:\s*no-preference/.test(prelude)) && /\.k-running\b/.test(rule.selector)))
    .map(({ selector, line }) => ({ selector, line }));
}

/** @returns {Set<string>} the `--k-*` names given a value */
export function propertiesDefined(css) {
  return new Set([...withoutComments(css).matchAll(/(--k-[\w-]+)\s*:/g)].map((match) => match[1]));
}
