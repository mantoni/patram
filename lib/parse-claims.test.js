import { expect, it } from 'vitest';

import { parseClaims } from './parse-claims.js';

it('extracts markdown title, links and directives as neutral claims', () => {
  const claims = parseClaims({
    path: 'docs/patram.md',
    source: createMarkdownSource(),
  });

  expect(claims).toEqual(createExpectedMarkdownClaims());
});

it('uses the first line as a plain markdown title', () => {
  const claims = parseClaims({
    path: 'docs/plain-title.md',
    source: ['Patram Plain Title', '', 'Body text.'].join('\n'),
  });

  expect(claims).toEqual([
    {
      document_id: 'doc:docs/plain-title.md',
      id: 'claim:doc:docs/plain-title.md:1',
      origin: {
        column: 1,
        line: 1,
        path: 'docs/plain-title.md',
      },
      type: 'document.title',
      value: 'Patram Plain Title',
    },
  ]);
});

it('extracts directives from markdown list items', () => {
  const claims = parseClaims({
    path: 'docs/tasks/v0/query-command.md',
    source: ['# Implement query command', '', '- Kind: task'].join('\n'),
  });

  expect(claims).toContainEqual({
    document_id: 'doc:docs/tasks/v0/query-command.md',
    id: 'claim:doc:docs/tasks/v0/query-command.md:2',
    name: 'kind',
    origin: {
      column: 1,
      line: 3,
      path: 'docs/tasks/v0/query-command.md',
    },
    parser: 'markdown',
    type: 'directive',
    value: 'task',
  });
});

it('returns no claims for unsupported file types', () => {
  const claims = parseClaims({
    path: 'bin/patram.js',
    source: 'console.log("Patram");',
  });

  expect(claims).toEqual([]);
});

it('returns no claims for extensionless files', () => {
  const claims = parseClaims({
    path: 'README',
    source: '# Patram',
  });

  expect(claims).toEqual([]);
});

/**
 * Create markdown input for parser tests.
 *
 * @returns {string}
 */
function createMarkdownSource() {
  return [
    '# Patram',
    '',
    'Read the [graph design](./graph-v0.md).',
    'Defined by: terms/patram.md',
  ].join('\n');
}

/**
 * Create the expected markdown claims.
 *
 * @returns {object[]}
 */
function createExpectedMarkdownClaims() {
  return [
    {
      document_id: 'doc:docs/patram.md',
      id: 'claim:doc:docs/patram.md:1',
      origin: {
        column: 1,
        line: 1,
        path: 'docs/patram.md',
      },
      type: 'document.title',
      value: 'Patram',
    },
    {
      document_id: 'doc:docs/patram.md',
      id: 'claim:doc:docs/patram.md:2',
      origin: {
        column: 10,
        line: 3,
        path: 'docs/patram.md',
      },
      type: 'markdown.link',
      value: {
        target: './graph-v0.md',
        text: 'graph design',
      },
    },
    {
      document_id: 'doc:docs/patram.md',
      id: 'claim:doc:docs/patram.md:3',
      name: 'defined_by',
      origin: {
        column: 1,
        line: 4,
        path: 'docs/patram.md',
      },
      parser: 'markdown',
      type: 'directive',
      value: 'terms/patram.md',
    },
  ];
}
