/* eslint-disable max-lines-per-function */
import { expect, it } from 'vitest';

import {
  collectVisibleDirectiveFields,
  matchHiddenDirectiveFields,
  matchVisibleDirectiveFields,
  normalizeDirectiveName,
  parseFrontMatterDirectiveFields,
} from './parse-markdown-directives.js';

it('parses front matter directive fields and skips unrelated lines', () => {
  expect(
    parseFrontMatterDirectiveFields(
      'docs/tasks/example.md',
      [
        '---',
        'Kind: task',
        'Tracked In:',
        '  - docs/plans/v0/example.md',
        'Summary: >-',
        '  Example',
        '  summary.',
        'Ignored:',
        '  owner: team',
        '---',
        '# Example',
      ],
      {
        multi_value_directive_names: new Set(['tracked_in']),
      },
    ),
  ).toEqual({
    body_start: 10,
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
    diagnostics: [],
  });
});

it('returns an empty front matter result when the section is missing or unterminated', () => {
  expect(
    parseFrontMatterDirectiveFields('docs/tasks/example.md', ['# Example']),
  ).toEqual({
    body_start: 0,
    directive_fields: [],
    diagnostics: [],
  });
  expect(
    parseFrontMatterDirectiveFields('docs/tasks/example.md', [
      '---',
      'Kind: task',
    ]),
  ).toEqual({
    body_start: 0,
    directive_fields: [],
    diagnostics: [],
  });
});

it('reports invalid YAML front matter syntax', () => {
  expect(
    parseFrontMatterDirectiveFields('docs/tasks/example.md', [
      '---',
      'kind: task',
      'tracked_in: [',
      '---',
      '# Example',
    ]),
  ).toEqual({
    body_start: 4,
    directive_fields: [],
    diagnostics: [
      {
        code: 'yaml.invalid_syntax',
        column: 14,
        level: 'error',
        line: 3,
        message:
          'Flow sequence in block collection must be sufficiently indented and end with a ]',
        path: 'docs/tasks/example.md',
      },
    ],
  });
});

it('matches list-item markdown directives', () => {
  expect(
    matchVisibleDirectiveFields(
      'docs/tasks/example.md',
      '- Tracked In: docs/plans/v0/example.md',
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
});

it('collects wrapped list-item markdown directive values', () => {
  expect(
    collectVisibleDirectiveFields(
      'docs/reference/commands/check.md',
      [
        '# Check',
        '',
        '- Command Summary: Validate a project, directory, or file and report',
        '  diagnostics.',
        '',
        '`patram check [<path>...]` validates configuration.',
      ],
      2,
    ),
  ).toEqual({
    directive_fields: {
      markdown_style: 'list_item',
      name: 'command_summary',
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

it('matches hidden markdown directives and skips unsupported lines', () => {
  expect(
    matchHiddenDirectiveFields(
      'docs/tasks/example.md',
      '[patram status= ready ]: #',
      4,
    ),
  ).toEqual({
    markdown_style: 'hidden_tag',
    name: 'status',
    origin: {
      column: 1,
      line: 4,
      path: 'docs/tasks/example.md',
    },
    parser: 'markdown',
    value: 'ready',
  });
  expect(
    matchVisibleDirectiveFields('docs/tasks/example.md', 'Not a directive', 5),
  ).toBeNull();
  expect(
    matchHiddenDirectiveFields(
      'docs/tasks/example.md',
      '[note status=ready]: #',
      6,
    ),
  ).toBeNull();
});

it('distinguishes visible-line directives from list items', () => {
  expect(
    matchVisibleDirectiveFields('docs/tasks/example.md', 'Status: ready', 7),
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

it('normalizes directive labels to snake case', () => {
  expect(normalizeDirectiveName('  Tracked In-Docs  ')).toBe('tracked_in_docs');
});
