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
import {
  createDirectivePathClasses,
  createDirectiveRelations,
  createJsdocDirectiveMappings,
  createMarkdownDirectiveMappings,
} from './directive-validation-test-helpers.js';
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
        {
          document_id: 'doc:docs/tasks/task.md',
          id: 'claim:doc:docs/tasks/task.md:3',
          name: 'unknown_field',
          origin: {
            column: 1,
            line: 3,
            path: 'docs/tasks/task.md',
          },
          type: 'directive',
          value: 'ignored',
        },
      ],
      ['docs/decisions/one.md', 'docs/plans/v0/plan.md', 'docs/tasks/task.md'],
    ),
  ).toEqual([]);
});

it('validates style-only markdown config during check', () => {
  expect(
    checkDirectiveMetadata(
      {
        document_node_ids: {
          'docs/tasks/task.md': 'doc:docs/tasks/task.md',
        },
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
        classes: {
          document: {
            builtin: true,
          },
          task: {
            label: 'Task',
            schema: {
              fields: {},
              markdown_styles: ['list_item'],
            },
          },
        },
        include: ['**/*'],
        queries: {},
      },
      [
        {
          document_id: 'doc:docs/tasks/task.md',
          id: 'claim:doc:docs/tasks/task.md:1',
          markdown_style: 'visible_line',
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
      ],
      ['docs/tasks/task.md'],
    ),
  ).toEqual([
    {
      code: 'directive.invalid_style',
      column: 1,
      level: 'error',
      line: 2,
      message:
        'Directive "status" uses markdown style "visible_line" but only "list_item" are allowed.',
      path: 'docs/tasks/task.md',
    },
  ]);
});

it('validates class schemas even without typed field config', () => {
  expect(
    checkDirectiveMetadata(
      {
        document_node_ids: {
          'docs/tasks/task.md': 'doc:docs/tasks/task.md',
        },
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
        classes: {
          document: {
            builtin: true,
          },
          task: {
            label: 'Task',
            schema: {
              fields: {
                status: {
                  presence: 'required',
                },
              },
            },
          },
        },
        include: ['**/*'],
        queries: {},
      },
      [
        {
          document_id: 'doc:docs/tasks/task.md',
          id: 'claim:doc:docs/tasks/task.md:1',
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
      ],
      ['docs/tasks/task.md'],
    ),
  ).toEqual([]);
});

it('ignores style validation for non-markdown directives', () => {
  expect(
    checkDirectiveMetadata(
      {
        document_node_ids: {
          'lib/task.js': 'doc:lib/task.js',
        },
        edges: [],
        nodes: {
          'doc:lib/task.js': {
            $class: 'task',
            id: 'doc:lib/task.js',
            path: 'lib/task.js',
            title: 'Example Task',
          },
        },
      },
      {
        classes: {
          document: {
            builtin: true,
          },
          task: {
            label: 'Task',
            schema: {
              fields: {},
              markdown_styles: ['list_item'],
            },
          },
        },
        include: ['**/*'],
        queries: {},
      },
      [
        {
          document_id: 'doc:lib/task.js',
          id: 'claim:doc:lib/task.js:1',
          name: 'status',
          origin: {
            column: 4,
            line: 2,
            path: 'lib/task.js',
          },
          parser: 'jsdoc',
          type: 'directive',
          value: 'pending',
        },
      ],
      ['lib/task.js'],
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

it('reports markdown directive style diagnostics', () => {
  const check_fixture = createCheckFixture(
    {
      'docs/decisions/one.md': '# Decision\n',
      'docs/plans/v0/plan.md': '# Plan\n',
      'docs/tasks/task.md': createTaskWithInvalidMarkdownStyles(),
    },
    createMarkdownStyleValidationConfig(),
  );

  expect(check_fixture.diagnostics).toEqual([
    {
      code: 'directive.invalid_style',
      column: 1,
      level: 'error',
      line: 6,
      message:
        'Directive "tracked_in" uses markdown style "list_item" but only "front_matter" are allowed.',
      path: 'docs/tasks/task.md',
    },
    {
      code: 'directive.invalid_style',
      column: 1,
      level: 'error',
      line: 7,
      message:
        'Directive "status" uses markdown style "hidden_tag" but only "front_matter", "list_item" are allowed.',
      path: 'docs/tasks/task.md',
    },
  ]);
});

it('reports mixed markdown directive styles when configured', () => {
  const check_fixture = createCheckFixture(
    {
      'docs/decisions/one.md': '# Decision\n',
      'docs/plans/v0/plan.md': '# Plan\n',
      'docs/tasks/task.md': createTaskWithMixedMarkdownStyles(),
    },
    createMarkdownMixedStylesConfig(),
  );

  expect(check_fixture.diagnostics).toEqual([
    {
      code: 'document.mixed_styles',
      column: 1,
      level: 'error',
      line: 4,
      message:
        'Document mixes markdown directive style "list_item" with "front_matter" while class "task" sets mixed_styles="error".',
      path: 'docs/tasks/task.md',
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
    path_classes: createDirectivePathClasses(),
    queries: {},
    relations: createDirectiveRelations(),
  };
}

/**
 * @returns {PatramRepoConfig}
 */
function createMarkdownStyleValidationConfig() {
  return {
    ...createDirectiveValidationConfig(),
    classes: {
      ...createDirectiveValidationConfig().classes,
      task: {
        ...createDirectiveValidationConfig().classes?.task,
        schema: {
          ...createDirectiveRulesSchema(),
          fields: {
            ...createDirectiveRules(),
            status: {
              markdown_styles: ['front_matter', 'list_item'],
              presence: 'required',
            },
          },
          markdown_styles: ['front_matter'],
        },
      },
    },
  };
}

/**
 * @returns {PatramRepoConfig}
 */
function createMarkdownMixedStylesConfig() {
  return {
    ...createDirectiveValidationConfig(),
    classes: {
      ...createDirectiveValidationConfig().classes,
      task: {
        ...createDirectiveValidationConfig().classes?.task,
        schema: {
          ...createDirectiveRulesSchema(),
          mixed_styles: 'error',
        },
      },
    },
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
 * @returns {Record<string, MappingDefinition>}
 */
function createDirectiveMappings() {
  return {
    ...createJsdocDirectiveMappings(),
    ...createMarkdownDirectiveMappings(),
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
 * @returns {string}
 */
function createTaskWithInvalidMarkdownStyles() {
  return [
    '---',
    'Kind: task',
    'Decided by: docs/decisions/one.md',
    '---',
    '# Example Task',
    '- Tracked in: docs/plans/v0/plan.md',
    '[patram status=pending]: #',
  ].join('\n');
}

/**
 * @returns {string}
 */
function createTaskWithMixedMarkdownStyles() {
  return [
    '---',
    'Kind: task',
    '---',
    '- Status: pending',
    'Decided by: docs/decisions/one.md',
    '- Tracked in: docs/plans/v0/plan.md',
    '# Example Task',
  ].join('\n');
}

/**
 * @returns {PatramRepoConfig}
 */
function createPathMappingOnlyConfig() {
  return {
    include: ['**/*'],
    mappings: {
      'markdown.directive.tracked_in':
        createMarkdownDirectiveMappings()['markdown.directive.tracked_in'],
    },
    queries: {},
    relations: {
      tracked_in: createDirectiveRelations().tracked_in,
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
