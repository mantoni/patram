import { expect, it } from 'vitest';

import { parseClaims, parseSourceFile } from './parse-claims.js';

it('extracts title, description, directives, and links from an activated JSDoc block', () => {
  const claims = parseClaims({
    path: 'src/query-command.js',
    source: createPatramJsdocSource(),
  });

  expect(claims).toEqual(createExpectedPatramJsdocClaims());
});

it('extracts @see inline {@link ...} references from an activated JSDoc block', () => {
  const claims = parseClaims({
    path: 'src/query-command.js',
    source: createPatramInlineLinkJsdocSource(),
  });

  expect(claims).toEqual(createExpectedPatramJsdocClaims());
});

it('uses explicit labels from inline and plain @see links', () => {
  const inline_claims = parseClaims({
    path: 'src/query-command.js',
    source: createPatramInlineLabelJsdocSource(),
  });
  const plain_claims = parseClaims({
    path: 'src/query-command.js',
    source: createPatramPlainLabelJsdocSource(),
  });

  expect(inline_claims.at(-1)).toEqual({
    document_id: 'doc:src/query-command.js',
    id: 'claim:doc:src/query-command.js:6',
    origin: {
      column: 4,
      line: 11,
      path: 'src/query-command.js',
    },
    type: 'jsdoc.link',
    value: {
      target: '../docs/patram.md',
      text: 'Patram Guide',
    },
  });
  expect(plain_claims.at(-1)).toEqual({
    document_id: 'doc:src/query-command.js',
    id: 'claim:doc:src/query-command.js:6',
    origin: {
      column: 4,
      line: 11,
      path: 'src/query-command.js',
    },
    type: 'jsdoc.link',
    value: {
      target: '../docs/patram.md',
      text: 'Patram Guide',
    },
  });
});

it('ignores @see links that do not target repo-relative paths', () => {
  const claims = parseClaims({
    path: 'src/query-command.js',
    source: createInvalidPatramLinkJsdocSource(),
  });

  expect(claims).toEqual(createExpectedPatramJsdocClaims().slice(0, 5));
});

it('uses the first sentence of a long first JSDoc paragraph as the title', () => {
  const claims = parseClaims({
    path: 'src/query-command.js',
    source: createLongTitleJsdocSource(),
  });

  expect(claims).toEqual([
    {
      document_id: 'doc:src/query-command.js',
      id: 'claim:doc:src/query-command.js:1',
      origin: {
        column: 4,
        line: 2,
        path: 'src/query-command.js',
      },
      type: 'document.title',
      value:
        'This sentence becomes the title because the paragraph is intentionally much longer than one hundred and twenty characters.',
    },
    {
      document_id: 'doc:src/query-command.js',
      id: 'claim:doc:src/query-command.js:2',
      origin: {
        column: 4,
        line: 2,
        path: 'src/query-command.js',
      },
      type: 'document.description',
      value:
        'The remaining text stays in the description so the graph keeps a compact title while preserving the rest of the prose in one field.',
    },
    {
      document_id: 'doc:src/query-command.js',
      id: 'claim:doc:src/query-command.js:3',
      name: 'kind',
      origin: {
        column: 4,
        line: 4,
        path: 'src/query-command.js',
      },
      parser: 'jsdoc',
      type: 'directive',
      value: 'task',
    },
  ]);
});

it('returns no claims for JavaScript files without an activated Patram block', () => {
  const claims = parseClaims({
    path: 'bin/patram.js',
    source: '/**\n * Kind: task\n */\nconsole.log("Patram");\n',
  });

  expect(claims).toEqual([]);
});

it('reports a diagnostic when a file contains multiple activated Patram blocks', () => {
  const parse_result = parseSourceFile({
    path: 'src/query-command.js',
    source: createDuplicatePatramJsdocSource(),
  });

  expect(parse_result.claims).toEqual([
    {
      document_id: 'doc:src/query-command.js',
      id: 'claim:doc:src/query-command.js:1',
      origin: {
        column: 4,
        line: 2,
        path: 'src/query-command.js',
      },
      type: 'document.title',
      value: 'First block.',
    },
    {
      document_id: 'doc:src/query-command.js',
      id: 'claim:doc:src/query-command.js:2',
      name: 'kind',
      origin: {
        column: 4,
        line: 4,
        path: 'src/query-command.js',
      },
      parser: 'jsdoc',
      type: 'directive',
      value: 'task',
    },
  ]);
  expect(parse_result.diagnostics).toEqual([
    {
      code: 'jsdoc.multiple_patram_blocks',
      column: 4,
      level: 'error',
      line: 14,
      message:
        'File "src/query-command.js" contains multiple JSDoc blocks with "@patram".',
      path: 'src/query-command.js',
    },
  ]);
});

/**
 * Create activated JSDoc metadata input for parser tests.
 *
 * @returns {string}
 */
function createPatramJsdocSource() {
  return [
    '/**',
    ' * Implement query command.',
    ' *',
    ' * Query execution should load a graph and print matching documents.',
    ' *',
    ' * Kind: task',
    ' * Status: pending',
    ' * Tracked in: docs/roadmap/v0-dogfood.md',
    ' *',
    ' * @patram',
    ' * @see ../docs/patram.md',
    ' */',
    'export function runQuery() {}',
  ].join('\n');
}

/**
 * Create activated JSDoc metadata input that uses inline link syntax.
 *
 * @returns {string}
 */
function createPatramInlineLinkJsdocSource() {
  return [
    '/**',
    ' * Implement query command.',
    ' *',
    ' * Query execution should load a graph and print matching documents.',
    ' *',
    ' * Kind: task',
    ' * Status: pending',
    ' * Tracked in: docs/roadmap/v0-dogfood.md',
    ' *',
    ' * @patram',
    ' * @see {@link ../docs/patram.md}',
    ' */',
    'export function runQuery() {}',
  ].join('\n');
}

/**
 * Create activated JSDoc metadata input with an inline link label.
 *
 * @returns {string}
 */
function createPatramInlineLabelJsdocSource() {
  return [
    '/**',
    ' * Implement query command.',
    ' *',
    ' * Query execution should load a graph and print matching documents.',
    ' *',
    ' * Kind: task',
    ' * Status: pending',
    ' * Tracked in: docs/roadmap/v0-dogfood.md',
    ' *',
    ' * @patram',
    ' * @see {@link ../docs/patram.md Patram Guide}',
    ' */',
    'export function runQuery() {}',
  ].join('\n');
}

/**
 * Create activated JSDoc metadata input with a plain link label.
 *
 * @returns {string}
 */
function createPatramPlainLabelJsdocSource() {
  return [
    '/**',
    ' * Implement query command.',
    ' *',
    ' * Query execution should load a graph and print matching documents.',
    ' *',
    ' * Kind: task',
    ' * Status: pending',
    ' * Tracked in: docs/roadmap/v0-dogfood.md',
    ' *',
    ' * @patram',
    ' * @see ../docs/patram.md Patram Guide',
    ' */',
    'export function runQuery() {}',
  ].join('\n');
}

/**
 * Create activated JSDoc metadata input with a non-path see tag.
 *
 * @returns {string}
 */
function createInvalidPatramLinkJsdocSource() {
  return [
    '/**',
    ' * Implement query command.',
    ' *',
    ' * Query execution should load a graph and print matching documents.',
    ' *',
    ' * Kind: task',
    ' * Status: pending',
    ' * Tracked in: docs/roadmap/v0-dogfood.md',
    ' *',
    ' * @patram',
    ' * @see https://example.com/reference',
    ' */',
    'export function runQuery() {}',
  ].join('\n');
}

/**
 * Create a JSDoc source file with a long title paragraph.
 *
 * @returns {string}
 */
function createLongTitleJsdocSource() {
  return [
    '/**',
    ' * This sentence becomes the title because the paragraph is intentionally much longer than one hundred and twenty characters. The remaining text stays in the description so the graph keeps a compact title while preserving the rest of the prose in one field.',
    ' *',
    ' * Kind: task',
    ' *',
    ' * @patram',
    ' */',
    'export function runQuery() {}',
  ].join('\n');
}

/**
 * Create a JavaScript source file with two activated Patram blocks.
 *
 * @returns {string}
 */
function createDuplicatePatramJsdocSource() {
  return [
    '/**',
    ' * First block.',
    ' *',
    ' * Kind: task',
    ' *',
    ' * @patram',
    ' */',
    '',
    '/**',
    ' * Second block.',
    ' *',
    ' * Status: pending',
    ' *',
    ' * @patram',
    ' */',
    'export function runQuery() {}',
  ].join('\n');
}

/**
 * Create the expected claims for an activated JSDoc block.
 */
function createExpectedPatramJsdocClaims() {
  return [
    createExpectedTitleClaim(),
    createExpectedDescriptionClaim(),
    createExpectedDirectiveClaim(3, 'kind', 6, 'task'),
    createExpectedDirectiveClaim(4, 'status', 7, 'pending'),
    createExpectedDirectiveClaim(
      5,
      'tracked_in',
      8,
      'docs/roadmap/v0-dogfood.md',
    ),
    createExpectedLinkClaim(),
  ];
}

function createExpectedTitleClaim() {
  return {
    document_id: 'doc:src/query-command.js',
    id: 'claim:doc:src/query-command.js:1',
    origin: {
      column: 4,
      line: 2,
      path: 'src/query-command.js',
    },
    type: 'document.title',
    value: 'Implement query command.',
  };
}

function createExpectedDescriptionClaim() {
  return {
    document_id: 'doc:src/query-command.js',
    id: 'claim:doc:src/query-command.js:2',
    origin: {
      column: 4,
      line: 4,
      path: 'src/query-command.js',
    },
    type: 'document.description',
    value: 'Query execution should load a graph and print matching documents.',
  };
}

/**
 * @param {number} claim_number
 * @param {string} name
 * @param {number} line
 * @param {string} value
 */
function createExpectedDirectiveClaim(claim_number, name, line, value) {
  return {
    document_id: 'doc:src/query-command.js',
    id: `claim:doc:src/query-command.js:${claim_number}`,
    name,
    origin: {
      column: 4,
      line,
      path: 'src/query-command.js',
    },
    parser: 'jsdoc',
    type: 'directive',
    value,
  };
}

function createExpectedLinkClaim() {
  return {
    document_id: 'doc:src/query-command.js',
    id: 'claim:doc:src/query-command.js:6',
    origin: {
      column: 4,
      line: 11,
      path: 'src/query-command.js',
    },
    type: 'jsdoc.link',
    value: {
      target: '../docs/patram.md',
      text: '../docs/patram.md',
    },
  };
}
