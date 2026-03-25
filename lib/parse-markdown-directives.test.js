import { expect, it } from 'vitest';

import {
  matchHiddenDirectiveFields,
  matchVisibleDirectiveFields,
  normalizeDirectiveName,
  parseFrontMatterDirectiveFields,
} from './parse-markdown-directives.js';

it('parses front matter directive fields and skips unrelated lines', () => {
  expect(
    parseFrontMatterDirectiveFields('docs/tasks/example.md', [
      '---',
      'Kind: task',
      'Ignored line',
      'Tracked In: docs/plans/v0/example.md',
      '---',
      '# Example',
    ]),
  ).toEqual({
    body_start: 5,
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
          column: 1,
          line: 4,
          path: 'docs/tasks/example.md',
        },
        parser: 'markdown',
        value: 'docs/plans/v0/example.md',
      },
    ],
  });
});

it('returns an empty front matter result when the section is missing or unterminated', () => {
  expect(
    parseFrontMatterDirectiveFields('docs/tasks/example.md', ['# Example']),
  ).toEqual({
    body_start: 0,
    directive_fields: [],
  });
  expect(
    parseFrontMatterDirectiveFields('docs/tasks/example.md', [
      '---',
      'Kind: task',
    ]),
  ).toEqual({
    body_start: 0,
    directive_fields: [],
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
