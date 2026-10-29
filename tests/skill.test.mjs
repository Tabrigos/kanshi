// The agent skill shipped in this npm package is current, accurate and packed.
//   node --test tests/skill.test.mjs     (after the build: exports are read from TYPES)
// Each test fails for one precise reason, and none can pass on an empty input.
// A copy of the shared template (schema 1): only the constants above the line
// change from one library to another. Node >= 18, no dependencies.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SKILL_NAME = 'kanshi';
// Declarations of the package entry: every export needs a `### \`Name\`` heading
// in the reference, and every such heading must name an export. null for a
// library with no JS entry (CSS only): the two export tests skip.
const TYPES = null;
// With TYPES = null: the project test that checks the names SKILL.md cites
// against their source (CSS custom properties, classes, attributes).
const NAMES_TEST = 'tests/skill-reference.test.mjs';
const REFERENCE = 'references/api.md';
// PascalCase names or calls cited in SKILL.md that are not exports (DOM types,
// other libraries).
const NOT_EXPORTS = new Set([]);
// js/mjs blocks that SKILL.md must contain; all of them run, except those fenced
// ```js nocheck (a fragment, TypeScript, a call that needs a browser).
const MIN_EXAMPLES = 0;
// Relative to the package; in a monorepo with one changelog, '../../CHANGELOG.md'.
const CHANGELOG = 'CHANGELOG.md';

// ---- nothing below this line changes between libraries ----------------------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL_DIR = path.join(ROOT, 'skills', SKILL_NAME);
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
// Line endings normalised for parsing; the LF test reads the raw bytes.
const SKILL = fs.readFileSync(path.join(SKILL_DIR, 'SKILL.md'), 'utf8').replace(/\r\n/g, '\n');
const FENCE = /^```(\w*)([^\n]*)\n([\s\S]*?)^```[ \t]*$/gm;
const BODY = SKILL.split('\n---\n').slice(1).join('\n---\n');
const PROSE = BODY.replace(FENCE, '');
const PORTABLE = new Set(['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools']);
const IDENT = /^[A-Za-z_$][\w$]*$/;
// A file path in backticks: a slash and an extension; no spaces (commands), globs,
// placeholders or `:` (URLs).
const FILE_PATH = /^[^\s*?<>{}:]*\/[^\s*?<>{}:/]*\.[A-Za-z0-9]{1,8}$/;
const IN_REPOSITORY = /in the library's repository|nel repository della libreria/i;
// NAMES_TEST is read only when TYPES is null: a copy whose head predates it still runs.
const NO_JS_ENTRY = TYPES === null && `no JS entry: the names are checked by ${NAMES_TEST}`;

function skillFiles(dir = SKILL_DIR, base = SKILL_DIR) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...skillFiles(full, base));
    else out.push(path.relative(base, full).replace(/\\/g, '/'));
  }
  return out.sort();
}

function frontmatter() {
  const match = SKILL.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, 'SKILL.md must start with a --- frontmatter block');
  const fields = {};
  let key = '';
  for (const line of match[1].split('\n')) {
    const top = line.match(/^([A-Za-z][\w-]*):[ \t]*(.*)$/);
    if (top) {
      key = top[1];
      const value = top[2].trim();
      fields[key] = value === '' ? {} : ['>', '>-', '|', '|-'].includes(value) ? '' : value.replace(/^["']|["']$/g, '');
    } else if (key && /^[ \t]/.test(line)) {
      if (typeof fields[key] === 'object') {
        const pair = line.match(/^\s+([\w.-]+):\s*["']?(.*?)["']?\s*$/);
        assert.ok(pair, `metadata holds string pairs only: ${line}`);
        fields[key][pair[1]] = pair[2];
      } else {
        fields[key] = `${fields[key]} ${line.trim()}`.trim();
      }
    }
  }
  return fields;
}

function exportsOf(file, seen = new Set()) {
  const names = new Set();
  if (seen.has(file)) return names;
  seen.add(file);
  const text = fs.readFileSync(file, 'utf8');
  for (const [, list] of text.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const part of list.split(',')) {
      const name = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop().trim();
      if (name) names.add(name);
    }
  }
  const declared = /export\s+(?:declare\s+)?(?:abstract\s+)?(?:async\s+)?(?:function\*?|const|let|var|class|interface|type|enum|namespace)\s+([A-Za-z_$][\w$]*)/g;
  for (const [, name] of text.matchAll(declared)) names.add(name);
  for (const [, name] of text.matchAll(/export\s+\*\s+as\s+([A-Za-z_$][\w$]*)/g)) names.add(name);
  for (const [, from] of text.matchAll(/export\s+\*\s+from\s+['"](\.[^'"]+)['"]/g)) {
    const base = path.resolve(path.dirname(file), from);
    const candidates = [base.replace(/\.m?js$/, '.d.ts'), `${base}.d.ts`, path.join(base, 'index.d.ts'), base];
    const target = candidates.find(f => fs.existsSync(f) && fs.statSync(f).isFile());
    assert.ok(target, `cannot follow export * from '${from}' in ${file}`);
    for (const name of exportsOf(target, seen)) names.add(name);
  }
  names.delete('default');
  return names;
}

// Every .gitattributes from the package up to the repository root (the directory
// with .git): in a monorepo the rule usually sits at the root.
function gitattributes() {
  const found = [];
  for (let dir = ROOT; ; dir = path.dirname(dir)) {
    const file = path.join(dir, '.gitattributes');
    if (fs.existsSync(file)) found.push(fs.readFileSync(file, 'utf8'));
    if (fs.existsSync(path.join(dir, '.git')) || path.dirname(dir) === dir) return found;
  }
}

function npm(args) {
  const env = { ...process.env, npm_config_update_notifier: 'false', npm_config_fund: 'false' };
  const dir = path.dirname(process.execPath);
  const cli = [process.env.npm_execpath,
    path.join(dir, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(dir, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js')]
    .find(f => f && /npm-cli\.js$/.test(f) && fs.existsSync(f));
  return cli
    ? spawnSync(process.execPath, [cli, ...args], { cwd: ROOT, env, encoding: 'utf8' })
    : spawnSync('npm', args, { cwd: ROOT, env, encoding: 'utf8', shell: true });
}

// The paths of the files that `npm pack` puts in the tarball.
function packedFiles() {
  const r = npm(['pack', '--dry-run', '--json', '--ignore-scripts']);
  assert.equal(r.status, 0, r.stderr);
  return new Set(JSON.parse(r.stdout.slice(r.stdout.indexOf('[')))[0].files.map(f => f.path));
}

// --- frontmatter, size, layout ---------------------------------------------------

test('frontmatter is portable Agent Skills', () => {
  const fields = frontmatter();
  const extra = Object.keys(fields).filter(k => !PORTABLE.has(k));
  assert.deepEqual(extra, [], `not portable: ${extra}`);
  assert.equal(fields.name, SKILL_NAME);
  assert.ok(fields.name.length <= 64 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(fields.name), fields.name);
  assert.ok(!/claude|anthropic/.test(fields.name));
  const description = fields.description;
  assert.ok(description.length >= 50 && description.length <= 1024, `description: ${description.length}`);
  assert.ok(!/[<>]/.test(description), 'no XML in the description');
  assert.match(description, /\buse(?: it| this(?: skill)?)? when(?:ever)?\b|\busa(?:re|rla|la) (?:quando|ogni volta che)\b/i, "no 'Use when'");
});

test('the version is the package version and is in the changelog', () => {
  const version = frontmatter().metadata?.version;
  assert.equal(version, PKG.version);
  const changelog = fs.readFileSync(path.join(ROOT, CHANGELOG), 'utf8');
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(changelog, new RegExp(`^##\\s+\\[?${escaped}\\]?(\\s|$)`, 'm'), `CHANGELOG.md: no '## ${version}'`);
});

test('SKILL.md is short and references are one level deep, with an index when long', () => {
  assert.ok(SKILL.split('\n').length <= 500, 'SKILL.md over 500 lines');
  const files = skillFiles();
  assert.ok(files.length >= 2, 'SKILL.md and references/ expected');
  for (const rel of files) {
    assert.match(rel, /^(SKILL\.md|(references|assets|scripts)\/[^/]+)$/, rel);
    if (!rel.startsWith('references/') || !rel.endsWith('.md')) continue;
    const lines = fs.readFileSync(path.join(SKILL_DIR, rel), 'utf8').split('\n');
    if (lines.length > 100) assert.match(lines.slice(0, 20).join('\n'), /^(Contents|Exports|Modules|Sections|Indice)\b/m, `${rel}: index missing`);
  }
});

test('every reference is cited and every citation exists', () => {
  const cited = new Set([...BODY.matchAll(/\b((?:references|assets|scripts)\/[\w.-]+\w)/g)].map(m => m[1]));
  assert.ok(cited.size, 'SKILL.md points to no reference file');
  for (const rel of cited) assert.ok(fs.existsSync(path.join(SKILL_DIR, rel)), rel);
  for (const name of fs.readdirSync(path.join(SKILL_DIR, 'references'))) {
    assert.ok(cited.has(`references/${name}`), `references/${name} not cited`);
  }
});

// A project copies only the skill directory: a path of the repository does not
// open there. Paths of the consumer (.claude/, .agents/) are not the library's.
test('paths cited in SKILL.md open from the copy in a project', () => {
  const installed = `node_modules/${PKG.name}/`;
  let packed = null;
  let checked = 0;
  const broken = [];
  for (const line of PROSE.split('\n')) {
    for (const [, span] of line.matchAll(/`([^`\n]+)`/g)) {
      const rel = span.replace(/^\.\//, '');
      if (!FILE_PATH.test(span) || /^\.(claude|agents)\//.test(rel)) continue;
      checked++;
      if (fs.existsSync(path.join(SKILL_DIR, rel)) || IN_REPOSITORY.test(line)) continue;
      if (rel.startsWith(installed)) {
        packed ??= packedFiles();
        if (packed.has(rel.slice(installed.length))) continue;
      }
      broken.push(span);
    }
  }
  assert.ok(checked, 'no file path in backticks: SKILL.md should cite `references/api.md`');
  assert.deepEqual(broken, [], `paths that the copy in a project cannot open: cite a file of the skill, ${installed}<file> of the tarball, or say "in the library's repository" on the same line`);
});

test('skill files have LF line endings, and git keeps them so', () => {
  const crlf = skillFiles().filter(rel => fs.readFileSync(path.join(SKILL_DIR, rel)).includes(13));
  assert.deepEqual(crlf, [], "CRLF: add the lines of gitattributes-frammento (* text=auto eol=lf) to .gitattributes and renormalise");
  const attributes = gitattributes();
  assert.ok(attributes.length, 'no .gitattributes from the package up to the repository root');
  assert.ok(attributes.some(a => /^(\*\.md|\*|\S*skills\/\S*)\s.*eol=lf/m.test(a)), '.gitattributes must force LF on the skill');
});

// --- the reference matches the exports ---------------------------------------------

test('every export has a heading in the reference, and every heading is an export', { skip: NO_JS_ENTRY }, () => {
  const types = path.join(ROOT, TYPES);
  assert.ok(fs.existsSync(types), `${TYPES} missing: build first`);
  const exported = exportsOf(types);
  assert.ok(exported.size > 0, `no exports found in ${TYPES}`);
  const reference = fs.readFileSync(path.join(SKILL_DIR, REFERENCE), 'utf8');
  const headings = new Set([...reference.matchAll(/^#{2,4}\s+`([A-Za-z_$][\w$]*)/gm)].map(m => m[1]));
  const missing = [...exported].filter(n => !headings.has(n));
  const stale = [...headings].filter(n => !exported.has(n) && !NOT_EXPORTS.has(n));
  assert.deepEqual(missing, [], `exports without a heading in ${REFERENCE}`);
  assert.deepEqual(stale, [], `headings in ${REFERENCE} that are not exports`);
});

test('names that SKILL.md imports or cites exist', { skip: NO_JS_ENTRY }, () => {
  const exported = exportsOf(path.join(ROOT, TYPES));
  const cited = [];
  const imports = new RegExp(`import\\s+(?:type\\s+)?\\{([^}]*)\\}\\s+from\\s+['"]${PKG.name.replace(/[/.]/g, '\\$&')}['"]`, 'g');
  for (const [, list] of BODY.matchAll(imports)) {
    for (const part of list.split(',')) cited.push(part.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim());
  }
  for (const [, span] of PROSE.matchAll(/`([^`\n]+)`/g)) {
    const call = span.match(/^([A-Za-z_$][\w$]*)\(/);
    if (call) cited.push(call[1]);
    else if (IDENT.test(span) && /^[A-Z]/.test(span)) cited.push(span);
  }
  const names = cited.filter(Boolean);
  assert.ok(names.length > 0, 'SKILL.md neither imports nor cites any export');
  const unknown = names.filter(n => !exported.has(n) && !NOT_EXPORTS.has(n));
  assert.deepEqual([...new Set(unknown)], [], 'cited but not exported');
});

if (TYPES === null) {
  test('without a JS entry, a project test checks the names', () => {
    assert.ok(NAMES_TEST, 'TYPES is null: NAMES_TEST must name the project test that checks the names SKILL.md cites');
    assert.ok(fs.existsSync(path.join(ROOT, NAMES_TEST)), `${NAMES_TEST} missing`);
  });
}

// --- the examples ---------------------------------------------------------------------

test('the js examples of SKILL.md run', async () => {
  const offset = SKILL.length - BODY.length;
  const blocks = [...BODY.matchAll(FENCE)]
    .filter(([, kind, info]) => ['js', 'mjs'].includes(kind) && !info.trim().split(/\s+/).includes('nocheck'))
    .map(m => ({ code: m[3], line: SKILL.slice(0, offset + m.index).split('\n').length }));
  assert.ok(blocks.length >= MIN_EXAMPLES, `${blocks.length} js blocks to run, MIN_EXAMPLES is ${MIN_EXAMPLES}`);
  // The blocks import the package by name: a node_modules link in a temporary
  // directory resolves it to this package, through its "exports" or "main".
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-examples-'));
  try {
    const link = path.join(dir, 'node_modules', ...PKG.name.split('/'));
    fs.mkdirSync(path.dirname(link), { recursive: true });
    fs.symlinkSync(ROOT, link, process.platform === 'win32' ? 'junction' : 'dir');
    for (const { code, line } of blocks) {
      const file = path.join(dir, `line-${line}.mjs`);
      fs.writeFileSync(file, code);
      try {
        await import(pathToFileURL(file).href);
      } catch (error) {
        assert.fail(`SKILL.md js block at line ${line}: ${error && error.message}`);
      }
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// --- the packed tarball ----------------------------------------------------------------

test('"files" ships the skill and npm pack contains every file of it', () => {
  assert.ok((PKG.files || []).some(f => /^skills(\/|$)/.test(f)), '"files" in package.json must include "skills"');
  const packed = packedFiles();
  const expected = skillFiles().map(rel => `skills/${SKILL_NAME}/${rel}`);
  assert.deepEqual(expected.filter(f => !packed.has(f)), [], 'missing from the tarball');
});
