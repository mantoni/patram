/* eslint-disable max-lines, max-lines-per-function */
/**
 * @import { BuildGraphResult } from './build-graph.types.ts';
 * @import { ClassFieldRuleConfig, MetadataFieldConfig, PatramDiagnostic, PatramRepoConfig } from './load-patram-config.types.ts';
 * @import { MappingDefinition } from './patram-config.types.ts';
 * @import { PatramClaim } from './parse-claims.types.ts';
 */

import { expect, it } from 'vitest';

import { buildGraph } from './build-graph.js';
import { checkDirectiveMetadata } from './check-directive-metadata.js';
import { checkGraph } from './check-graph.js';
import { parseSourceFile } from './parse-claims.js';
import { resolvePatramGraphConfig } from './resolve-patram-graph-config.js';

it('reports markdown directive validation diagnostics', () => {
  const check_fixture = createCheckFixture({
    'docs/decisions/one.md': '# Decision\n',
    'docs/plans/v0/plan.md': '# Plan\n',
    'docs/research/note.md': '# Note\n',
    'docs/research/task.md': createInvalidMarkdownTaskSource(),
  });

  expect(check_fixture.diagnostics).toEqual(
    createExpectedMarkdownDiagnostics(),
  );
});

it('reports JSDoc directive validation diagnostics', () => {
  const check_fixture = createCheckFixture({
    'docs/plans/v0/plan.md': '# Plan\n',
    'lib/misc.js': createInvalidJsdocTaskSource(),
  });

  expect(check_fixture.diagnostics).toEqual(createExpectedJsdocDiagnostics());
});

it('skips validation when the repo has no configured metadata fields or schemas', () => {
  expect(
    checkDirectiveMetadata(
      {
        document_node_ids: {},
        edges: [],
        nodes: {},
      },
      {
        classes: {
          document: {
            builtin: true,
          },
        },
        include: ['**/*'],
        queries: {},
      },
      [],
      [],
    ),
  ).toEqual([]);
});

it('ignores unmapped directives without names or configured rules', () => {
  expect(
    checkDirectiveMetadata(
      {
        document_node_ids: {},
        edges: [],
        nodes: {},
      },
      createDirectiveValidationConfig(),
      [
        {
          document_id: 'doc:docs/tasks/task.md',
          id: 'claim:doc:docs/tasks/task.md:1',
          origin: {
            column: 1,
            line: 1,
            path: 'docs/tasks/task.md',
          },
          parser: 'markdown',
          type: 'directive',
          value: 'ignored',
        },
        {
          document_id: 'doc:docs/tasks/task.md',
          id: 'claim:doc:docs/tasks/task.md:2',
          name: 'unknown_field',
          origin: {
            column: 1,
            line: 2,
            path: 'docs/tasks/task.md',
          },
          parser: 'markdown',
          type: 'directive',
          value: 'ignored',
        },
      ],
      ['docs/decisions/one.md', 'docs/plans/v0/plan.md', 'docs/tasks/task.md'],
    ),
  ).toEqual([]);
});

it('skips placement diagnostics when no path class is configured or the path already matches', () => {
  const check_fixture = createCheckFixture({
    'docs/tasks/task.md': [
      '# Example Task',
      '- Kind: task',
      '- Status: pending',
      '- Tracked in: docs/plans/v0/plan.md',
      '- Decided by: docs/decisions/one.md',
    ].join('\n'),
    'docs/plans/v0/plan.md': '# Plan\n',
    'docs/decisions/one.md': '# Decision\n',
  });

  expect(check_fixture.diagnostics).toEqual([]);
  expect(
    checkDirectiveMetadata(
      {
        document_node_ids: {},
        edges: [],
        nodes: {
          'doc:docs/tasks/task.md': {
            $class: 'task',
            id: 'doc:docs/tasks/task.md',
            path: 'docs/tasks/task.md',
            title: 'Example Task',
          },
        },
      },
      {
        ...createDirectiveValidationConfig(),
        classes: {
          ...createDirectiveValidationConfig().classes,
          task: {
            ...createDirectiveValidationConfig().classes?.task,
            schema: {
              ...createDirectiveRulesSchema(),
              document_path_class: undefined,
            },
          },
        },
      },
      [
        {
          document_id: 'doc:docs/tasks/task.md',
          id: 'claim:doc:docs/tasks/task.md:1',
          name: 'decided_by',
          origin: {
            column: 1,
            line: 1,
            path: 'docs/tasks/task.md',
          },
          parser: 'markdown',
          type: 'directive',
          value: 'docs/decisions/one.md',
        },
        {
          document_id: 'doc:docs/tasks/task.md',
          id: 'claim:doc:docs/tasks/task.md:2',
          name: 'status',
          origin: {
            column: 1,
            line: 2,
            path: 'docs/tasks/task.md',
          },
          parser: 'markdown',
          type: 'directive',
          value: 'pending',
        },
        {
          document_id: 'doc:docs/tasks/task.md',
          id: 'claim:doc:docs/tasks/task.md:3',
          name: 'tracked_in',
          origin: {
            column: 1,
            line: 3,
            path: 'docs/tasks/task.md',
          },
          parser: 'markdown',
          type: 'directive',
          value: 'docs/plans/v0/plan.md',
        },
      ],
      ['docs/decisions/one.md', 'docs/plans/v0/plan.md', 'docs/tasks/task.md'],
    ),
  ).toEqual([]);
});

it('reports missing front-matter directive path targets', () => {
  const check_fixture = createCheckFixture({
    'docs/decisions/one.md': '# Decision\n',
    'docs/tasks/task.md': createFrontMatterTaskWithMissingPlan(),
  });

  expect(check_fixture.diagnostics).toEqual([
    {
      code: 'directive.path_not_found',
      column: 1,
      level: 'error',
      line: 5,
      message:
        'Directive "tracked_in" points to missing file "docs/plans/v0/missing.md".',
      path: 'docs/tasks/task.md',
    },
  ]);
});

it('reports missing directive path targets for path-emitting mappings without typed fields', () => {
  const check_fixture = createCheckFixture(
    {
      'docs/tasks/task.md': createFrontMatterTaskWithMissingPlan(),
    },
    createPathMappingOnlyConfig(),
  );

  expect(check_fixture.diagnostics).toEqual([
    {
      code: 'directive.path_not_found',
      column: 1,
      level: 'error',
      line: 5,
      message:
        'Directive "tracked_in" points to missing file "docs/plans/v0/missing.md".',
      path: 'docs/tasks/task.md',
    },
  ]);
});

it('reports missing JSDoc directive path targets', () => {
  const check_fixture = createCheckFixture({
    'docs/decisions/one.md': '# Decision\n',
    'docs/tasks/task.js': createJsdocTaskWithMissingPlan(),
  });

  expect(check_fixture.diagnostics).toEqual([
    {
      code: 'directive.path_not_found',
      column: 4,
      level: 'error',
      line: 6,
      message:
        'Directive "tracked_in" points to missing file "docs/plans/v0/missing.md".',
      path: 'docs/tasks/task.js',
    },
  ]);
});

/**
 * @param {Record<string, string>} source_text_by_path
 * @param {PatramRepoConfig} [repo_config]
 * @returns {{ claims: PatramClaim[], diagnostics: PatramDiagnostic[], existing_file_paths: string[], graph: BuildGraphResult }}
 */
function createCheckFixture(
  source_text_by_path,
  repo_config = createDirectiveValidationConfig(),
) {
  /** @type {PatramClaim[]} */
  const claims = [];
  const existing_file_paths = Object.keys(source_text_by_path).sort();

  for (const source_file_path of existing_file_paths) {
    const parse_result = parseSourceFile({
      path: source_file_path,
      source: source_text_by_path[source_file_path],
    });

    expect(parse_result.diagnostics).toEqual([]);
    claims.push(...parse_result.claims);
  }

  const graph = buildGraph(resolvePatramGraphConfig(repo_config), claims);

  return {
    claims,
    diagnostics: checkGraph(graph, existing_file_paths, repo_config, claims),
    existing_file_paths,
    graph,
  };
}

/**
 * @returns {PatramRepoConfig}
 */
function createDirectiveValidationConfig() {
  return {
    classes: {
      document: {
        builtin: true,
      },
      task: {
        label: 'Task',
        schema: {
          document_path_class: 'task_docs',
          fields: createDirectiveRules(),
          unknown_fields: 'ignore',
        },
      },
    },
    fields: createFieldDefinitions(),
    include: ['**/*'],
    mappings: createDirectiveMappings(),
    path_classes: createPathClasses(),
    queries: {},
    relations: createDirectiveRelations(),
  };
}

/**
 * @returns {Record<string, MetadataFieldConfig>}
 */
function createFieldDefinitions() {
  return {
    decided_by: {
      multiple: true,
      path_class: 'decision_docs',
      type: 'path',
    },
    execution: {
      type: 'string',
    },
    status: {
      type: 'enum',
      values: ['pending', 'ready'],
    },
    tracked_in: {
      path_class: 'plan_docs',
      type: 'path',
    },
  };
}

/**
 * @returns {Record<string, ClassFieldRuleConfig>}
 */
function createDirectiveRules() {
  return {
    decided_by: {
      presence: 'required',
    },
    execution: {
      presence: 'forbidden',
    },
    status: {
      presence: 'required',
    },
    tracked_in: {
      presence: 'required',
    },
  };
}

/**
 * @returns {{ document_path_class: string, fields: Record<string, { presence: 'required' | 'optional' | 'forbidden' }>, unknown_fields: 'ignore' }}
 */
function createDirectiveRulesSchema() {
  return {
    document_path_class: 'task_docs',
    fields: createDirectiveRules(),
    unknown_fields: 'ignore',
  };
}

/**
 * @returns {Record<string, { prefixes: string[] }>}
 */
function createPathClasses() {
  return {
    decision_docs: {
      prefixes: ['docs/decisions/'],
    },
    plan_docs: {
      prefixes: ['docs/plans/'],
    },
    task_docs: {
      prefixes: ['docs/tasks/'],
    },
  };
}

/**
 * @returns {Record<string, { from: string[], to: string[] }>}
 */
function createDirectiveRelations() {
  return {
    decided_by: {
      from: ['document'],
      to: ['document'],
    },
    tracked_in: {
      from: ['document'],
      to: ['document'],
    },
  };
}

/**
 * @returns {Record<string, MappingDefinition>}
 */
function createDirectiveMappings() {
  return {
    ...createJsdocMappings(),
    ...createMarkdownMappings(),
  };
}

/**
 * @returns {Record<string, MappingDefinition>}
 */
function createJsdocMappings() {
  return {
    'jsdoc.directive.decided_by': createRelationMapping('decided_by'),
    'jsdoc.directive.kind': createNodeMapping('$class'),
    'jsdoc.directive.status': createNodeMapping('status'),
    'jsdoc.directive.tracked_in': createRelationMapping('tracked_in'),
  };
}

/**
 * @returns {Record<string, MappingDefinition>}
 */
function createMarkdownMappings() {
  return {
    'markdown.directive.decided_by': createRelationMapping('decided_by'),
    'markdown.directive.kind': createNodeMapping('$class'),
    'markdown.directive.status': createNodeMapping('status'),
    'markdown.directive.tracked_in': createRelationMapping('tracked_in'),
  };
}

/**
 * @param {string} field_name
 * @returns {MappingDefinition}
 */
function createNodeMapping(field_name) {
  return {
    node: {
      class: 'document',
      field: field_name,
    },
  };
}

/**
 * @param {string} relation_name
 * @returns {MappingDefinition}
 */
function createRelationMapping(relation_name) {
  return {
    emit: {
      relation: relation_name,
      target: 'path',
      target_class: 'document',
    },
  };
}

/**
 * @returns {string}
 */
function createInvalidMarkdownTaskSource() {
  return [
    '# Example Task',
    '- Kind: task',
    '- Status: blocked',
    '- Tracked in: docs/research/note.md',
    '- Tracked in: docs/plans/v0/plan.md',
    '- Execution: done',
  ].join('\n');
}

/**
 * @returns {string}
 */
function createInvalidJsdocTaskSource() {
  return [
    '/**',
    ' * Example task anchor.',
    ' * Kind: task',
    ' * Status: pending',
    ' * Status: pending',
    ' * Tracked in: docs/plans/v0/plan.md',
    ' * Decided by: docs/plans/v0/plan.md',
    ' * @patram',
    ' */',
    'export function runTask() {}',
  ].join('\n');
}

/**
 * @returns {string}
 */
function createFrontMatterTaskWithMissingPlan() {
  return [
    '---',
    'Kind: task',
    'Status: pending',
    'Decided by: docs/decisions/one.md',
    'Tracked in: docs/plans/v0/missing.md',
    '---',
    '# Example Task',
  ].join('\n');
}

/**
 * @returns {string}
 */
function createJsdocTaskWithMissingPlan() {
  return [
    '/**',
    ' * Example task anchor.',
    ' * Kind: task',
    ' * Status: pending',
    ' * Decided by: docs/decisions/one.md',
    ' * Tracked in: docs/plans/v0/missing.md',
    ' * @patram',
    ' */',
    'export function runTask() {}',
  ].join('\n');
}

/**
 * @returns {PatramRepoConfig}
 */
function createPathMappingOnlyConfig() {
  return {
    include: ['**/*'],
    mappings: {
      'markdown.directive.tracked_in': createRelationMapping('tracked_in'),
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

/**
 * @returns {PatramDiagnostic[]}
 */
function createExpectedMarkdownDiagnostics() {
  return [
    createMarkdownDiagnostic(
      3,
      1,
      'directive.invalid_enum',
      'Directive "status" must be one of "pending", "ready".',
    ),
    createMarkdownDiagnostic(
      4,
      1,
      'directive.invalid_path_class',
      'Directive "tracked_in" must point to path class "plan_docs".',
    ),
    createMarkdownDiagnostic(
      6,
      1,
      'directive.forbidden',
      'Directive "execution" is forbidden for class "task".',
    ),
    createMarkdownDiagnostic(
      1,
      1,
      'directive.missing_required',
      'Missing required directive "decided_by" for class "task".',
    ),
    createMarkdownDiagnostic(
      1,
      1,
      'document.invalid_placement',
      'Document class "task" must be placed in path class "task_docs".',
    ),
  ];
}

/**
 * @returns {PatramDiagnostic[]}
 */
function createExpectedJsdocDiagnostics() {
  return [
    createDiagnostic(
      'lib/misc.js',
      5,
      4,
      'directive.duplicate',
      'Directive "status" must appear at most once for class "task".',
    ),
    createDiagnostic(
      'lib/misc.js',
      7,
      4,
      'directive.invalid_path_class',
      'Directive "decided_by" must point to path class "decision_docs".',
    ),
    createDiagnostic(
      'lib/misc.js',
      1,
      1,
      'document.invalid_placement',
      'Document class "task" must be placed in path class "task_docs".',
    ),
  ];
}

/**
 * @param {number} line
 * @param {number} column
 * @param {string} code
 * @param {string} message
 * @returns {PatramDiagnostic}
 */
function createMarkdownDiagnostic(line, column, code, message) {
  return createDiagnostic('docs/research/task.md', line, column, code, message);
}

/**
 * @param {string} path
 * @param {number} line
 * @param {number} column
 * @param {string} code
 * @param {string} message
 * @returns {PatramDiagnostic}
 */
function createDiagnostic(path, line, column, code, message) {
  return {
    code,
    column,
    level: 'error',
    line,
    message,
    path,
  };
}
