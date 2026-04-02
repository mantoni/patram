import { expect, it } from 'vitest';

import {
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

it('requires types to choose exactly one identity strategy', () => {
  const parse_result = patram_repo_config_schema.safeParse({
    include: ['docs/**/*.md'],
    queries: {},
    types: {
      task: {
        defined_by: 'task',
        in: 'docs/tasks/**/*.md',
      },
    },
  });

  expect(parse_result.success).toBe(false);
  expect(parse_result.error?.issues).toEqual([
    expect.objectContaining({
      message: 'Type definitions must not declare both "in" and "defined_by".',
      path: ['types', 'task'],
    }),
  ]);
});

it('exposes the reserved structural field-name predicate', () => {
  expect(isReservedStructuralFieldName('$class')).toBe(true);
  expect(isReservedStructuralFieldName('status')).toBe(false);
});
