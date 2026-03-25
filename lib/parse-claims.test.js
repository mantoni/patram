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
    markdown_style: 'list_item',
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

it('extracts directives from visible non-list markdown lines', () => {
  const claims = parseClaims({
    path: 'docs/tasks/v0/query-command.md',
    source: ['# Implement query command', '', 'Kind: task'].join('\n'),
  });

  expect(claims).toContainEqual({
    document_id: 'doc:docs/tasks/v0/query-command.md',
    id: 'claim:doc:docs/tasks/v0/query-command.md:2',
    markdown_style: 'visible_line',
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

it('extracts directives from top-of-file front matter and keeps the first body line as the title', () => {
  const claims = parseClaims({
    path: 'docs/tasks/v0/query-command.md',
    source: createFrontMatterMarkdownSource(),
  });

  expect(claims).toEqual(createExpectedFrontMatterClaims());
});

it('extracts directives from hidden markdown reference tags', () => {
  const claims = parseClaims({
    path: 'docs/tasks/v0/query-command.md',
    source: [
      '# Implement query command',
      '',
      '[patram kind=task]: #',
      '[patram tracked-in=docs/roadmap/v0-dogfood.md]: #',
    ].join('\n'),
  });

  expect(claims).toContainEqual({
    document_id: 'doc:docs/tasks/v0/query-command.md',
    id: 'claim:doc:docs/tasks/v0/query-command.md:2',
    markdown_style: 'hidden_tag',
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

  expect(claims).toContainEqual({
    document_id: 'doc:docs/tasks/v0/query-command.md',
    id: 'claim:doc:docs/tasks/v0/query-command.md:3',
    markdown_style: 'hidden_tag',
    name: 'tracked_in',
    origin: {
      column: 1,
      line: 4,
      path: 'docs/tasks/v0/query-command.md',
    },
    parser: 'markdown',
    type: 'directive',
    value: 'docs/roadmap/v0-dogfood.md',
  });
});

it('does not treat lowercase body prose as metadata directives', () => {
  const claims = parseClaims({
    path: 'docs/tasks/v0/query-command.md',
    source: [
      '# Implement query command',
      '',
      'kind: task',
      'status: pending',
    ].join('\n'),
  });

  expect(claims).toEqual([
    {
      document_id: 'doc:docs/tasks/v0/query-command.md',
      id: 'claim:doc:docs/tasks/v0/query-command.md:1',
      origin: {
        column: 1,
        line: 1,
        path: 'docs/tasks/v0/query-command.md',
      },
      type: 'document.title',
      value: 'Implement query command',
    },
  ]);
});

it('ignores fenced-example links and non-path markdown targets', () => {
  const claims = parseClaims({
    path: 'docs/patram.md',
    source: [
      '# Patram',
      '',
      'See [guide](./guide.md), [usage](#usage), and [clig.dev](https://clig.dev/).',
      '',
      '```json',
      '{"source":"See [query language](./query-language-v0.md)."}',
      '```',
    ].join('\n'),
  });

  expect(claims).toEqual([
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
        column: 5,
        line: 3,
        path: 'docs/patram.md',
      },
      type: 'markdown.link',
      value: {
        target: './guide.md',
        text: 'guide',
      },
    },
  ]);
});

it('ignores visible directives and hidden tags inside fenced code blocks', () => {
  const claims = parseClaims({
    path: 'docs/patram.md',
    source: [
      '# Patram',
      '',
      '```md',
      'Kind: task',
      '[patram status=pending]: #',
      '```',
    ].join('\n'),
  });

  expect(claims).toEqual([
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
  ]);
});

it('returns no claims for unsupported file types', () => {
  const claims = parseClaims({
    path: 'notes.txt',
    source: 'Patram notes',
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
      markdown_style: 'visible_line',
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

/**
 * Create markdown input with front matter directives.
 *
 * @returns {string}
 */
function createFrontMatterMarkdownSource() {
  return [
    '---',
    'kind: task',
    'tracked-in: docs/roadmap/v0-dogfood.md',
    '---',
    '# Implement query command',
    '',
    'Body text.',
  ].join('\n');
}

/**
 * Create the expected claims for front matter parsing.
 */
function createExpectedFrontMatterClaims() {
  return [
    {
      document_id: 'doc:docs/tasks/v0/query-command.md',
      id: 'claim:doc:docs/tasks/v0/query-command.md:1',
      origin: {
        column: 1,
        line: 5,
        path: 'docs/tasks/v0/query-command.md',
      },
      type: 'document.title',
      value: 'Implement query command',
    },
    {
      document_id: 'doc:docs/tasks/v0/query-command.md',
      id: 'claim:doc:docs/tasks/v0/query-command.md:2',
      markdown_style: 'front_matter',
      name: 'kind',
      origin: {
        column: 1,
        line: 2,
        path: 'docs/tasks/v0/query-command.md',
      },
      parser: 'markdown',
      type: 'directive',
      value: 'task',
    },
    {
      document_id: 'doc:docs/tasks/v0/query-command.md',
      id: 'claim:doc:docs/tasks/v0/query-command.md:3',
      markdown_style: 'front_matter',
      name: 'tracked_in',
      origin: {
        column: 1,
        line: 3,
        path: 'docs/tasks/v0/query-command.md',
      },
      parser: 'markdown',
      type: 'directive',
      value: 'docs/roadmap/v0-dogfood.md',
    },
  ];
}
