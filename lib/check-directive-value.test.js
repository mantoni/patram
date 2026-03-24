/** @import * as $k$$l$load$j$patram$j$config$k$types$k$ts from './load-patram-config.types.ts'; */
/** @import * as $k$$l$parse$j$claims$k$types$k$ts from './parse-claims.types.ts'; */
import { expect, it } from 'vitest';

import { createClaim } from './claim-helpers.js';
import { checkDirectiveValue } from './check-directive-value.js';

it('reports enum validation diagnostics', () => {
  const diagnostics = checkDirectiveValue(
    createDirectiveClaim('status', 'blocked'),
    'status',
    {},
    {
      include: ['**/*'],
      queries: {},
    },
    {
      presence: 'required',
      type: {
        type: 'enum',
        values: ['pending', 'ready'],
      },
    },
    new Map(),
    new Set(['docs/tasks/task.md']),
  );

  expect(diagnostics).toEqual([
    {
      code: 'directive.invalid_enum',
      column: 1,
      level: 'error',
      line: 1,
      message: 'Directive "status" must be one of "pending", "ready".',
      path: 'docs/tasks/task.md',
    },
  ]);
});

it('reports invalid type diagnostics', () => {
  expect(
    checkDirectiveValue(
      createDirectiveClaim('priority', '4.2'),
      'priority',
      {},
      createBasePathConfig(),
      {
        presence: 'optional',
        type: {
          type: 'integer',
        },
      },
      new Map(),
      new Set(['docs/tasks/task.md']),
    ),
  ).toEqual([
    {
      code: 'directive.invalid_type',
      column: 1,
      level: 'error',
      line: 1,
      message: 'Directive "priority" must be a base-10 integer.',
      path: 'docs/tasks/task.md',
    },
  ]);
});

it('reports invalid path class diagnostics', () => {
  const base_path_config = createBasePathConfig();

  expect(
    checkDirectiveValue(
      createDirectiveClaim('tracked_in', 'docs/research/note.md'),
      'tracked_in',
      base_path_config.mappings ?? {},
      base_path_config,
      {
        presence: 'required',
        type: {
          path_class: 'plan_docs',
          type: 'path',
        },
      },
      new Map(),
      new Set(['docs/research/note.md', 'docs/tasks/task.md']),
    ),
  ).toEqual([
    {
      code: 'directive.invalid_path_class',
      column: 1,
      level: 'error',
      line: 1,
      message: 'Directive "tracked_in" must point to path class "plan_docs".',
      path: 'docs/tasks/task.md',
    },
  ]);
});

/**
 * @param {string} directive_name
 * @param {string} directive_value
 * @returns {$k$$l$parse$j$claims$k$types$k$ts.PatramClaim}
 */
function createDirectiveClaim(directive_name, directive_value) {
  return createClaim('docs/tasks/task.md', 1, 'directive', {
    name: directive_name,
    parser: 'markdown',
    value: directive_value,
  });
}

/**
 * @returns {$k$$l$load$j$patram$j$config$k$types$k$ts.PatramRepoConfig}
 */
function createBasePathConfig() {
  return {
    include: ['**/*'],
    mappings: {
      'markdown.directive.tracked_in': {
        emit: {
          relation: 'tracked_in',
          target: 'path',
          target_kind: 'document',
        },
      },
    },
    path_classes: {
      plan_docs: {
        prefixes: ['docs/plans/'],
      },
    },
    queries: {},
    relations: {
      tracked_in: {
        from: ['document'],
        to: ['document'],
      },
    },
  };
}
