import { expect, it } from 'vitest';

import { validatePatramConfigValue } from './validate-patram-config-value.js';

const VALID_TYPES_FIELDS_CONFIG = {
  fields: {
    blocked_by: {
      many: true,
      on: ['task'],
      to: 'document',
      type: 'ref',
    },
    command: {
      hidden: true,
      on: ['command'],
      type: 'string',
    },
    status: {
      on: ['decision', 'task'],
      type: 'enum',
      values: ['accepted', 'blocked', 'ready'],
    },
    summary: {
      on: ['command'],
      type: 'string',
    },
  },
  include: ['docs/**/*.md'],
  queries: {
    blocked_tasks: {
      cypher: "MATCH (n:Task) WHERE n.status = 'blocked' RETURN n",
    },
  },
  types: {
    command: {
      defined_by: 'command',
    },
    decision: {
      in: 'docs/decisions/**/*.md',
    },
    task: {
      in: ['docs/tasks/**/*.md'],
      label: 'Task',
    },
  },
};

const EXPECTED_VALID_CONFIG = {
  ...VALID_TYPES_FIELDS_CONFIG,
  types: {
    ...VALID_TYPES_FIELDS_CONFIG.types,
    decision: {
      ...VALID_TYPES_FIELDS_CONFIG.types.decision,
      in: ['docs/decisions/**/*.md'],
    },
  },
};

const LEGACY_TYPES_FIELDS_CONFIG = {
  classes: {},
  fields: {},
  include: ['docs/**/*.md'],
  mappings: {},
  path_classes: {},
  queries: {},
  relations: {},
  types: {},
};

const EXPECTED_LEGACY_DIAGNOSTICS = {
  diagnostics: [
    {
      code: 'config.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message:
        'Invalid config at "classes": Top-level "classes" is not supported. Use "types".',
      path: '.patram.json',
    },
    {
      code: 'config.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message:
        'Invalid config at "mappings": Top-level "mappings" is not supported.',
      path: '.patram.json',
    },
    {
      code: 'config.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message:
        'Invalid config at "path_classes": Top-level "path_classes" is not supported.',
      path: '.patram.json',
    },
    {
      code: 'config.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message:
        'Invalid config at "relations": Top-level "relations" is not supported. Use ref fields.',
      path: '.patram.json',
    },
  ],
  success: false,
};

it('accepts the v2 types and fields config model', () => {
  const validation_result = validatePatramConfigValue(
    VALID_TYPES_FIELDS_CONFIG,
  );

  expect(validation_result).toEqual({
    config: EXPECTED_VALID_CONFIG,
    success: true,
  });
});

it('rejects legacy top-level config sections directly', () => {
  const validation_result = validatePatramConfigValue(
    LEGACY_TYPES_FIELDS_CONFIG,
  );

  expect(validation_result).toEqual(EXPECTED_LEGACY_DIAGNOSTICS);
});
