import { expect, it } from 'vitest';

import {
  collectVisibleDirectiveFields,
  matchHiddenDirectiveFields,
  matchVisibleDirectiveFields,
  normalizeDirectiveName,
  parseFrontMatterDirectiveFields,
} from './parse-markdown-directives.js';

const FRONT_MATTER_LINES = [
  '---',
  'kind: task',
  'tracked_in:',
  '  - docs/plans/v0/example.md',
  'summary: >-',
  '  Example',
  '  summary.',
  'ignored:',
  '  owner: team',
  '---',
  '# Example',
];

const EXPECTED_FRONT_MATTER_FIELDS = {
  body_start: 10,
  diagnostics: [],
  directive_fields: [
    {
      markdown_style: 'front_matter',
      name: 'kind',
      origin: {
        column: 1,
        line: 2,
        path: 'docs/tasks/example.md',
      },
      parser: 'markdown',
      value: 'task',
    },
    {
      markdown_style: 'front_matter',
      name: 'tracked_in',
      origin: {
        column: 5,
        line: 4,
        path: 'docs/tasks/example.md',
      },
      parser: 'markdown',
      value: 'docs/plans/v0/example.md',
    },
    {
      markdown_style: 'front_matter',
      name: 'summary',
      origin: {
        column: 1,
        line: 5,
        path: 'docs/tasks/example.md',
      },
      parser: 'markdown',
      value: 'Example summary.',
    },
  ],
};

it('parses lower_snake_case front matter fields', () => {
  expect(
    parseFrontMatterDirectiveFields(
      'docs/tasks/example.md',
      FRONT_MATTER_LINES,
      {
        multi_value_directive_names: new Set(['tracked_in']),
      },
    ),
  ).toEqual(EXPECTED_FRONT_MATTER_FIELDS);
});

it('matches lower_snake_case visible directives', () => {
  expect(
    matchVisibleDirectiveFields(
      'docs/tasks/example.md',
      '- tracked_in: docs/plans/v0/example.md',
      3,
    ),
  ).toEqual({
    markdown_style: 'list_item',
    name: 'tracked_in',
    origin: {
      column: 1,
      line: 3,
      path: 'docs/tasks/example.md',
    },
    parser: 'markdown',
    value: 'docs/plans/v0/example.md',
  });
  expect(
    matchVisibleDirectiveFields('docs/tasks/example.md', 'status: ready', 7),
  ).toEqual({
    markdown_style: 'visible_line',
    name: 'status',
    origin: {
      column: 1,
      line: 7,
      path: 'docs/tasks/example.md',
    },
    parser: 'markdown',
    value: 'ready',
  });
});

it('collects wrapped list-item directive values', () => {
  expect(
    collectVisibleDirectiveFields(
      'docs/reference/commands/check.md',
      [
        '# Check',
        '',
        '- summary: Validate a project, directory, or file and report',
        '  diagnostics.',
        '',
        '`patram check [<path>...]` validates configuration.',
      ],
      2,
    ),
  ).toEqual({
    directive_fields: {
      markdown_style: 'list_item',
      name: 'summary',
      origin: {
        column: 1,
        line: 3,
        path: 'docs/reference/commands/check.md',
      },
      parser: 'markdown',
      value: 'Validate a project, directory, or file and report diagnostics.',
    },
    next_line_index: 4,
  });
});

it('does not support hidden markdown directives', () => {
  expect(
    matchHiddenDirectiveFields(
      'docs/tasks/example.md',
      '[patram status=ready]: #',
      4,
    ),
  ).toBeNull();
  expect(
    matchVisibleDirectiveFields('docs/tasks/example.md', 'Status: ready', 5),
  ).toBeNull();
});

it('only accepts exact lower_snake_case directive names', () => {
  expect(normalizeDirectiveName('tracked_in_docs')).toBe('tracked_in_docs');
  expect(normalizeDirectiveName('Tracked In Docs')).toBeNull();
});
