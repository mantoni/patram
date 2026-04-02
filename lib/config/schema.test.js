import { expect, it } from 'vitest';

import {
  isKnownMarkdownStyle,
  isMixedStyleValue,
  isReservedStructuralFieldName,
  patram_repo_config_schema,
} from './schema.js';

it('rejects metadata field names that start with a structural prefix', () => {
  const parse_result = patram_repo_config_schema.safeParse({
    fields: {
      $status: {
        type: 'string',
      },
    },
    include: ['docs/**/*.md'],
    queries: {},
  });

  expect(parse_result.success).toBe(false);
  expect(parse_result.error?.issues).toEqual([
    expect.objectContaining({
      message: 'Metadata field names must not start with "$".',
      path: ['fields', '$status'],
    }),
  ]);
});

it('rejects derived summaries entirely', () => {
  const parse_result = patram_repo_config_schema.safeParse({
    derived_summaries: {
      task_status: {
        classes: ['task'],
        fields: [
          {
            count: {
              traversal: 'in:tracked_in',
              where: '$class=task',
            },
            name: 'open_count',
          },
          {
            count: {
              traversal: 'in:tracked_in',
              where: '$class=task and status=done',
            },
            name: 'open_count',
          },
        ],
      },
    },
    include: ['docs/**/*.md'],
    queries: {},
  });

  expect(parse_result.success).toBe(false);
  expect(parse_result.error?.issues).toEqual([
    expect.objectContaining({
      message: 'Unrecognized key: "derived_summaries"',
      path: [],
    }),
  ]);
});

it('exposes schema helper predicates for config validation', () => {
  expect(isReservedStructuralFieldName('$class')).toBe(true);
  expect(isReservedStructuralFieldName('status')).toBe(false);
  expect(isKnownMarkdownStyle('front_matter')).toBe(true);
  expect(isKnownMarkdownStyle('heading')).toBe(false);
  expect(isMixedStyleValue('ignore')).toBe(true);
  expect(isMixedStyleValue('warn')).toBe(false);
});
