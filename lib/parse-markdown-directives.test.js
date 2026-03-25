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

it('matches visible and hidden markdown directives', () => {
  expect(
    matchVisibleDirectiveFields(
      'docs/tasks/example.md',
      '- Tracked In: docs/plans/v0/example.md',
      3,
    ),
  ).toEqual({
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
    matchHiddenDirectiveFields(
      'docs/tasks/example.md',
      '[patram status= ready ]: #',
      4,
    ),
  ).toEqual({
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

it('normalizes directive labels to snake case', () => {
  expect(normalizeDirectiveName('  Tracked In-Docs  ')).toBe('tracked_in_docs');
});
