import { expect, it } from 'vitest';

import repo_config from '../.patram.json' with { type: 'json' };

/**
 * Repo config contract coverage.
 *
 * Verifies `.patram.json` keeps the documented repo index boundary, schema,
 * mappings, and stored queries.
 *
 * Kind: support
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/source-anchor-dogfooding.md
 * @patram
 * @see {@link ./repo-source-anchors.test.js}
 * @see {@link ../docs/decisions/source-anchor-dogfooding.md}
 */

it('indexes repo docs and defines the documented stored queries', () => {
  expect(repo_config).toEqual(createExpectedRepoConfig());
});

function createExpectedRepoConfig() {
  return {
    class_schemas: createExpectedClassSchemas(),
    classes: createExpectedClasses(),
    derived_summaries: createExpectedDerivedSummaries(),
    fields: createExpectedFields(),
    include: [
      'docs/**/*.md',
      'bin/**/*.js',
      'lib/**/*.js',
      'scripts/**/*.js',
      'test/**/*.js',
    ],
    mappings: createExpectedRepoMappings(),
    path_classes: createExpectedPathClasses(),
    queries: createExpectedRepoQueries(),
    relations: createExpectedRepoRelations(),
  };
}

function createExpectedClassSchemas() {
  return {
    command: createExpectedClassSchema({
      summary: createOptionalFieldRule(),
    }),
    convention: createExpectedDocumentClassSchema('convention_docs'),
    decision: createExpectedDocumentClassSchema('decision_docs'),
    document: createExpectedClassSchema({
      description: createOptionalFieldRule(),
      kind: createOptionalFieldRule(),
      status: createOptionalFieldRule(),
    }),
    idea: createExpectedDocumentClassSchema('idea_docs'),
    plan: createExpectedDocumentClassSchema('plan_docs'),
    roadmap: createExpectedDocumentClassSchema('roadmap_docs'),
    task: createExpectedDocumentClassSchema('task_docs'),
    term: createExpectedClassSchema({
      definition: createOptionalFieldRule(),
    }),
  };
}

function createExpectedClasses() {
  return {
    command: {
      label: 'Command',
    },
    convention: {
      label: 'Convention',
    },
    decision: {
      label: 'Decision',
    },
    document: {
      builtin: true,
    },
    idea: {
      label: 'Idea',
    },
    plan: {
      label: 'Plan',
    },
    roadmap: {
      label: 'Roadmap',
    },
    task: {
      label: 'Task',
    },
    term: {
      label: 'Term',
    },
  };
}

function createExpectedDerivedSummaries() {
  return {
    decision_execution: {
      classes: ['decision'],
      fields: createExpectedExecutionFields('decided_by'),
    },
    plan_execution: {
      classes: ['plan'],
      fields: createExpectedExecutionFields('tracked_in'),
    },
  };
}

function createExpectedFields() {
  return {
    description: {
      display: {
        hidden: true,
      },
      type: 'string',
    },
    definition: {
      type: 'string',
    },
    kind: {
      type: 'enum',
      values: createExpectedSourceKinds(),
    },
    status: {
      type: 'enum',
      values: [
        'accepted',
        'active',
        'blocked',
        'captured',
        'done',
        'dropped',
        'exploring',
        'in_progress',
        'pending',
        'planned',
        'proposed',
        'ready',
        'superseded',
      ],
    },
    summary: {
      type: 'string',
    },
  };
}

function createExpectedSourceKinds() {
  return [
    'cli',
    'config',
    'discovery',
    'entrypoint',
    'graph',
    'output',
    'parse',
    'release',
    'scan',
    'support',
  ];
}

/**
 * @param {'decided_by' | 'tracked_in'} relation_name
 */
function createExpectedExecutionFields(relation_name) {
  return [
    {
      default: 'not_started',
      name: 'execution',
      select: [
        {
          value: 'done',
          when: `count(in:${relation_name}, $class=task) > 0 and none(in:${relation_name}, $class=task and status not in [done, dropped, superseded])`,
        },
        {
          value: 'blocked',
          when: `any(in:${relation_name}, $class=task and status not in [done, dropped, superseded]) and none(in:${relation_name}, $class=task and status not in [done, dropped, superseded] and not status=blocked)`,
        },
        {
          value: 'in_progress',
          when: `any(in:${relation_name}, $class=task and not status=pending)`,
        },
      ],
    },
    {
      count: {
        traversal: `in:${relation_name}`,
        where: '$class=task and status not in [done, dropped, superseded]',
      },
      name: 'open_tasks',
    },
    {
      count: {
        traversal: `in:${relation_name}`,
        where: '$class=task and status=blocked',
      },
      name: 'blocked_tasks',
    },
    {
      count: {
        traversal: `in:${relation_name}`,
        where: '$class=task',
      },
      name: 'total_tasks',
    },
  ];
}

function createExpectedRepoMappings() {
  return {
    ...createExpectedDocumentMappings(),
    ...createExpectedJsdocMappings(),
    ...createExpectedMarkdownMappings(),
  };
}

function createExpectedDocumentMappings() {
  return {
    'document.title': {
      node: {
        class: 'document',
        field: 'title',
      },
    },
    'markdown.link': createRelationMapping('links_to'),
  };
}

function createExpectedJsdocMappings() {
  return {
    'jsdoc.directive.about_command': createTaxonomyRelationMapping(
      'about_command',
      'command',
    ),
    'jsdoc.directive.blocked_by': createRelationMapping('blocked_by'),
    'jsdoc.directive.decided_by': createRelationMapping('decided_by'),
    'jsdoc.directive.implements': createRelationMapping('implements'),
    'jsdoc.directive.implements_command': createTaxonomyRelationMapping(
      'implements_command',
      'command',
    ),
    'jsdoc.directive.kind': createDocumentNodeMapping('kind'),
    'jsdoc.directive.status': createDocumentNodeMapping('status'),
    'jsdoc.directive.tracked_in': createRelationMapping('tracked_in'),
    'jsdoc.directive.uses_term': createTaxonomyRelationMapping(
      'uses_term',
      'term',
    ),
  };
}

function createExpectedMarkdownMappings() {
  return {
    'markdown.directive.about_command': createTaxonomyRelationMapping(
      'about_command',
      'command',
    ),
    'markdown.directive.blocked_by': createRelationMapping('blocked_by'),
    'markdown.directive.command': createTaxonomyDefinitionMapping(
      'command',
      'title',
    ),
    'markdown.directive.command_summary': createTaxonomyNodeMapping(
      'command',
      'summary',
    ),
    'markdown.directive.decided_by': createRelationMapping('decided_by'),
    'markdown.directive.implements': createRelationMapping('implements'),
    'markdown.directive.implements_command': createTaxonomyRelationMapping(
      'implements_command',
      'command',
    ),
    'markdown.directive.kind': createDocumentNodeMapping('$class'),
    'markdown.directive.status': createDocumentNodeMapping('status'),
    'markdown.directive.term': createTaxonomyDefinitionMapping('term', 'title'),
    'markdown.directive.term_definition': createTaxonomyNodeMapping(
      'term',
      'definition',
    ),
    'markdown.directive.tracked_in': createRelationMapping('tracked_in'),
    'markdown.directive.uses_term': createTaxonomyRelationMapping(
      'uses_term',
      'term',
    ),
  };
}

function createExpectedPathClasses() {
  return {
    convention_docs: {
      prefixes: ['docs/conventions/'],
    },
    decision_docs: {
      prefixes: ['docs/decisions/'],
    },
    idea_docs: {
      prefixes: ['docs/research/'],
    },
    plan_docs: {
      prefixes: ['docs/plans/'],
    },
    roadmap_docs: {
      prefixes: ['docs/roadmap/'],
    },
    task_docs: {
      prefixes: ['docs/tasks/'],
    },
  };
}

function createExpectedRepoQueries() {
  return {
    'accepted-decisions': createStoredQuery(
      '$class=decision and status=accepted',
    ),
    'active-plans': createStoredQuery('$class=plan and status=active'),
    'active-roadmaps': createStoredQuery('$class=roadmap and status=active'),
    'blocked-tasks': createStoredQuery('$class=task and status=blocked'),
    'command-implementations': createStoredQuery('implements_command:*'),
    'command-taxonomy': createStoredQuery('$id^=command:'),
    'decision-review-queue': createStoredQuery(
      '$class=decision and status=proposed',
    ),
    'decisions-needing-tasks': createStoredQuery(
      '$class=decision and status=accepted and count(in:decided_by, $class=task) = 0',
    ),
    'decisions-with-open-tasks': createStoredQuery(
      '$class=decision and status=accepted and any(in:decided_by, $class=task and status not in [done, dropped, superseded])',
    ),
    ideas: createStoredQuery(
      '$class=idea and status in [captured, exploring, planned]',
    ),
    'in-progress-tasks': createStoredQuery(
      '$class=task and status=in_progress',
    ),
    'pending-tasks': createStoredQuery('$class=task and status=pending'),
    'plans-with-open-tasks': createStoredQuery(
      '$class=plan and status=active and any(in:tracked_in, $class=task and status not in [done, dropped, superseded])',
    ),
    'plans-without-decisions': createStoredQuery(
      '$class=plan and status=active and none(in:tracked_in, $class=decision)',
    ),
    'ready-tasks': createStoredQuery('$class=task and status=ready'),
    ...createExpectedSourceQueries(),
    'term-taxonomy': createStoredQuery('$id^=term:'),
    'term-usage': createStoredQuery('uses_term:*'),
  };
}

function createExpectedSourceQueries() {
  return {
    'source-cli': createStoredQuery('kind=cli'),
    'source-config': createStoredQuery('kind=config'),
    'source-entrypoints': createStoredQuery('kind=entrypoint'),
    'source-graph': createStoredQuery('kind=graph'),
    'source-output': createStoredQuery('kind=output'),
    'source-parse': createStoredQuery('kind=parse'),
    'source-release': createStoredQuery('kind=release'),
    'source-scan': createStoredQuery('kind=scan'),
    'source-support': createStoredQuery('kind=support'),
  };
}

function createExpectedRepoRelations() {
  return {
    about_command: {
      from: ['document'],
      to: ['command'],
    },
    blocked_by: {
      from: ['document'],
      to: ['document'],
    },
    decided_by: {
      from: ['document'],
      to: ['document'],
    },
    defines: {
      from: ['document'],
      to: ['command', 'term'],
    },
    implements: {
      from: ['document'],
      to: ['document'],
    },
    implements_command: {
      from: ['document'],
      to: ['command'],
    },
    links_to: {
      builtin: true,
      from: ['document'],
      to: ['document'],
    },
    tracked_in: {
      from: ['document'],
      to: ['document'],
    },
    uses_term: {
      from: ['document'],
      to: ['term'],
    },
  };
}

/**
 * @param {Record<string, { presence: 'optional' | 'required' | 'forbidden' }>} fields
 * @param {string | undefined} [document_path_class]
 * @returns {{ document_path_class?: string, fields: Record<string, { presence: 'optional' | 'required' | 'forbidden' }>, unknown_fields: 'ignore' }}
 */
function createExpectedClassSchema(fields, document_path_class) {
  /** @type {{ document_path_class?: string, fields: Record<string, { presence: 'optional' | 'required' | 'forbidden' }>, unknown_fields: 'ignore' }} */
  const class_schema = {
    fields,
    unknown_fields: 'ignore',
  };

  if (document_path_class !== undefined) {
    class_schema.document_path_class = document_path_class;
  }

  return class_schema;
}

/**
 * @param {string} document_path_class
 */
function createExpectedDocumentClassSchema(document_path_class) {
  return createExpectedClassSchema(
    {
      status: createOptionalFieldRule(),
    },
    document_path_class,
  );
}

/**
 * @returns {{ presence: 'optional' }}
 */
function createOptionalFieldRule() {
  return {
    presence: 'optional',
  };
}

/**
 * @param {string} field
 */
function createDocumentNodeMapping(field) {
  return {
    node: {
      class: 'document',
      field,
    },
  };
}

/**
 * @param {string} relation
 */
function createRelationMapping(relation) {
  return {
    emit: {
      relation,
      target: 'path',
      target_class: 'document',
    },
  };
}

/**
 * @param {string} class_name
 * @param {string} field
 */
function createTaxonomyNodeMapping(class_name, field) {
  return {
    node: {
      class: class_name,
      field,
    },
  };
}

/**
 * @param {string} class_name
 * @param {string} field
 */
function createTaxonomyDefinitionMapping(class_name, field) {
  return {
    emit: {
      relation: 'defines',
      target: 'value',
      target_class: class_name,
    },
    node: {
      class: class_name,
      field,
      key: 'value',
    },
  };
}

/**
 * @param {string} relation
 * @param {string} target_class
 */
function createTaxonomyRelationMapping(relation, target_class) {
  return {
    emit: {
      relation,
      target: 'path',
      target_class,
    },
  };
}

/**
 * @param {string} where
 */
function createStoredQuery(where) {
  return { where };
}
