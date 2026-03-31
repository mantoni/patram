/* eslint-disable max-lines, max-lines-per-function */
/**
 * @import { ParseClaimsInput, PatramClaim } from './parse-claims.types.ts';
 */
import { expect, it } from 'vitest';

import { parseSourceFile } from './parse-claims.js';

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
    {
      document_id: 'doc:docs/plain-title.md',
      id: 'claim:doc:docs/plain-title.md:2',
      origin: {
        column: 1,
        line: 1,
        path: 'docs/plain-title.md',
      },
      type: 'document.description',
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

it('extracts standalone YAML directives and ignores nested YAML content', () => {
  const parse_result = parseSourceFile(
    {
      path: 'docs/tasks/v0/query-command.yaml',
      source: createStandaloneYamlSource(),
    },
    createYamlParseOptions(),
  );

  expect(parse_result).toEqual({
    claims: createExpectedStandaloneYamlClaims(),
    diagnostics: [],
  });
});

it('extracts YAML-backed front matter directives and keeps the markdown body title', () => {
  const parse_result = parseSourceFile(
    {
      path: 'docs/tasks/v0/query-command.md',
      source: createYamlFrontMatterMarkdownSource(),
    },
    createYamlParseOptions(),
  );

  expect(parse_result).toEqual({
    claims: createExpectedYamlFrontMatterClaims(),
    diagnostics: [],
  });
});

it('reports invalid standalone YAML syntax', () => {
  const parse_result = parseSourceFile({
    path: 'docs/tasks/v0/query-command.yaml',
    source: ['kind: task', 'tracked_in: ['].join('\n'),
  });

  expect(parse_result).toEqual({
    claims: [],
    diagnostics: [
      {
        code: 'yaml.invalid_syntax',
        column: 14,
        level: 'error',
        line: 2,
        message:
          'Flow sequence in block collection must be sufficiently indented and end with a ]',
        path: 'docs/tasks/v0/query-command.yaml',
      },
    ],
  });
});

it('reports YAML roots that are not top-level mappings', () => {
  const parse_result = parseSourceFile({
    path: 'docs/tasks/v0/query-command.yaml',
    source: ['- task', '- plan'].join('\n'),
  });

  expect(parse_result).toEqual({
    claims: [],
    diagnostics: [
      {
        code: 'yaml.invalid_root',
        column: 1,
        level: 'error',
        line: 1,
        message: 'Patram YAML metadata must use one top-level mapping.',
        path: 'docs/tasks/v0/query-command.yaml',
      },
    ],
  });
});

it('reports standalone YAML with multiple documents', () => {
  const parse_result = parseSourceFile({
    path: 'docs/tasks/v0/query-command.yaml',
    source: ['kind: task', '---', 'status: accepted'].join('\n'),
  });

  expect(parse_result).toEqual({
    claims: [],
    diagnostics: [
      {
        code: 'yaml.multiple_documents',
        column: 1,
        level: 'error',
        line: 2,
        message: 'Patram YAML sources must contain exactly one document.',
        path: 'docs/tasks/v0/query-command.yaml',
      },
    ],
  });
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
    {
      document_id: 'doc:docs/tasks/v0/query-command.md',
      id: 'claim:doc:docs/tasks/v0/query-command.md:2',
      origin: {
        column: 1,
        line: 3,
        path: 'docs/tasks/v0/query-command.md',
      },
      type: 'document.description',
      value: 'kind: task status: pending',
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
        column: 1,
        line: 3,
        path: 'docs/patram.md',
      },
      type: 'document.description',
      value:
        'See [guide](./guide.md), [usage](#usage), and [clig.dev](https://clig.dev/).',
    },
    {
      document_id: 'doc:docs/patram.md',
      id: 'claim:doc:docs/patram.md:3',
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
        column: 1,
        line: 3,
        path: 'docs/patram.md',
      },
      type: 'document.description',
      value:
        'Read the [graph design](./graph-v0.md). Defined by: terms/patram.md',
    },
    {
      document_id: 'doc:docs/patram.md',
      id: 'claim:doc:docs/patram.md:3',
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
      id: 'claim:doc:docs/patram.md:4',
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
      origin: {
        column: 1,
        line: 7,
        path: 'docs/tasks/v0/query-command.md',
      },
      type: 'document.description',
      value: 'Body text.',
    },
    {
      document_id: 'doc:docs/tasks/v0/query-command.md',
      id: 'claim:doc:docs/tasks/v0/query-command.md:3',
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
      id: 'claim:doc:docs/tasks/v0/query-command.md:4',
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

/**
 * Create standalone YAML input for parser tests.
 *
 * @returns {string}
 */
function createStandaloneYamlSource() {
  return [
    'kind: task',
    'tracked_in:',
    '  - docs/roadmap/v0-dogfood.md',
    '  - docs/plans/v0/yaml-source-and-front-matter.md',
    'summary: Add YAML support.',
    'extra:',
    '  owner: team',
    'mixed:',
    '  - docs/tasks/v0/query-command.md',
    '  - owner: team',
  ].join('\n');
}

/**
 * Create the expected claims for standalone YAML parsing.
 */
function createExpectedStandaloneYamlClaims() {
  return [
    {
      document_id: 'doc:docs/tasks/v0/query-command.yaml',
      id: 'claim:doc:docs/tasks/v0/query-command.yaml:1',
      name: 'kind',
      origin: {
        column: 1,
        line: 1,
        path: 'docs/tasks/v0/query-command.yaml',
      },
      parser: 'yaml',
      type: 'directive',
      value: 'task',
    },
    {
      document_id: 'doc:docs/tasks/v0/query-command.yaml',
      id: 'claim:doc:docs/tasks/v0/query-command.yaml:2',
      name: 'tracked_in',
      origin: {
        column: 5,
        line: 3,
        path: 'docs/tasks/v0/query-command.yaml',
      },
      parser: 'yaml',
      type: 'directive',
      value: 'docs/roadmap/v0-dogfood.md',
    },
    {
      document_id: 'doc:docs/tasks/v0/query-command.yaml',
      id: 'claim:doc:docs/tasks/v0/query-command.yaml:3',
      name: 'tracked_in',
      origin: {
        column: 5,
        line: 4,
        path: 'docs/tasks/v0/query-command.yaml',
      },
      parser: 'yaml',
      type: 'directive',
      value: 'docs/plans/v0/yaml-source-and-front-matter.md',
    },
    {
      document_id: 'doc:docs/tasks/v0/query-command.yaml',
      id: 'claim:doc:docs/tasks/v0/query-command.yaml:4',
      name: 'summary',
      origin: {
        column: 1,
        line: 5,
        path: 'docs/tasks/v0/query-command.yaml',
      },
      parser: 'yaml',
      type: 'directive',
      value: 'Add YAML support.',
    },
  ];
}

/**
 * Create markdown input with YAML front matter.
 *
 * @returns {string}
 */
function createYamlFrontMatterMarkdownSource() {
  return [
    '---',
    'kind: task',
    'tracked_in:',
    '  - docs/plans/v0/yaml-source-and-front-matter.md',
    'summary: >-',
    '  Add YAML-backed',
    '  front matter.',
    'extra:',
    '  owner: team',
    '---',
    '# Implement query command',
    '',
    'Body text.',
  ].join('\n');
}

/**
 * Create the expected claims for YAML front matter parsing.
 */
function createExpectedYamlFrontMatterClaims() {
  return [
    {
      document_id: 'doc:docs/tasks/v0/query-command.md',
      id: 'claim:doc:docs/tasks/v0/query-command.md:1',
      origin: {
        column: 1,
        line: 11,
        path: 'docs/tasks/v0/query-command.md',
      },
      type: 'document.title',
      value: 'Implement query command',
    },
    {
      document_id: 'doc:docs/tasks/v0/query-command.md',
      id: 'claim:doc:docs/tasks/v0/query-command.md:2',
      origin: {
        column: 1,
        line: 13,
        path: 'docs/tasks/v0/query-command.md',
      },
      type: 'document.description',
      value: 'Body text.',
    },
    {
      document_id: 'doc:docs/tasks/v0/query-command.md',
      id: 'claim:doc:docs/tasks/v0/query-command.md:3',
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
      id: 'claim:doc:docs/tasks/v0/query-command.md:4',
      markdown_style: 'front_matter',
      name: 'tracked_in',
      origin: {
        column: 5,
        line: 4,
        path: 'docs/tasks/v0/query-command.md',
      },
      parser: 'markdown',
      type: 'directive',
      value: 'docs/plans/v0/yaml-source-and-front-matter.md',
    },
    {
      document_id: 'doc:docs/tasks/v0/query-command.md',
      id: 'claim:doc:docs/tasks/v0/query-command.md:5',
      markdown_style: 'front_matter',
      name: 'summary',
      origin: {
        column: 1,
        line: 5,
        path: 'docs/tasks/v0/query-command.md',
      },
      parser: 'markdown',
      type: 'directive',
      value: 'Add YAML-backed front matter.',
    },
  ];
}

/**
 * @returns {{ multi_value_directive_names: Set<string> }}
 */
function createYamlParseOptions() {
  return {
    multi_value_directive_names: new Set(['tracked_in']),
  };
}

/**
 * @param {ParseClaimsInput} parse_input
 * @param {{ multi_value_directive_names?: ReadonlySet<string> }} [parse_options]
 * @returns {PatramClaim[]}
 */
function parseClaims(parse_input, parse_options) {
  return parseSourceFile(parse_input, parse_options).claims;
}
