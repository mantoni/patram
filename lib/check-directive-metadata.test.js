/**
 * @import { BuildGraphResult } from './build-graph.types.ts';
 * @import { DirectiveTypeConfig, MetadataDirectiveRuleConfig, PatramDiagnostic, PatramRepoConfig } from './load-patram-config.types.ts';
 * @import { MappingDefinition } from './patram-config.types.ts';
 * @import { PatramClaim } from './parse-claims.types.ts';
 */

import { expect, it } from 'vitest';

import { buildGraph } from './build-graph.js';
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

/**
 * @param {Record<string, string>} source_text_by_path
 * @returns {{ claims: PatramClaim[], diagnostics: PatramDiagnostic[], existing_file_paths: string[], graph: BuildGraphResult }}
 */
function createCheckFixture(source_text_by_path) {
  const repo_config = createDirectiveValidationConfig();
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
    directive_types: createDirectiveTypes(),
    include: ['**/*'],
    mappings: createDirectiveMappings(),
    metadata_schemas: {
      task: {
        directives: createDirectiveRules(),
        document_path_class: 'task_docs',
        unknown_directives: 'ignore',
      },
    },
    path_classes: createPathClasses(),
    queries: {},
    relations: createDirectiveRelations(),
  };
}

/**
 * @returns {Record<string, DirectiveTypeConfig>}
 */
function createDirectiveTypes() {
  return {
    decided_by: {
      path_class: 'decision_docs',
      type: 'path',
    },
    status: {
      type: 'string',
    },
    tracked_in: {
      path_class: 'plan_docs',
      type: 'path',
    },
  };
}

/**
 * @returns {Record<string, MetadataDirectiveRuleConfig>}
 */
function createDirectiveRules() {
  return {
    decided_by: {
      multiple: true,
      presence: 'required',
    },
    execution: {
      presence: 'forbidden',
    },
    status: {
      presence: 'required',
      type: {
        type: 'enum',
        values: ['pending', 'ready'],
      },
    },
    tracked_in: {
      presence: 'required',
    },
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
    'jsdoc.directive.kind': createNodeMapping('kind'),
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
    'markdown.directive.kind': createNodeMapping('kind'),
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
      field: field_name,
      kind: 'document',
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
      target_kind: 'document',
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
    ' * Status: ready',
    ' * Tracked in: docs/plans/v0/plan.md',
    ' * Decided by: docs/plans/v0/plan.md',
    ' * @patram',
    ' */',
    'export function runTask() {}',
  ].join('\n');
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
      5,
      1,
      'directive.duplicate',
      'Directive "tracked_in" must appear at most once for kind "task".',
    ),
    createMarkdownDiagnostic(
      6,
      1,
      'directive.forbidden',
      'Directive "execution" is forbidden for kind "task".',
    ),
    createMarkdownDiagnostic(
      1,
      1,
      'directive.missing_required',
      'Missing required directive "decided_by" for kind "task".',
    ),
    createMarkdownDiagnostic(
      1,
      1,
      'document.invalid_placement',
      'Document kind "task" must be placed in path class "task_docs".',
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
      'Directive "status" must appear at most once for kind "task".',
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
      'Document kind "task" must be placed in path class "task_docs".',
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
