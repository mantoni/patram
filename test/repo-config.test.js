import { expect, it } from 'vitest';

import repo_config from '../.patram.json' with { type: 'json' };

/**
 * Repo config contract coverage.
 *
 * Verifies `.patram.json` keeps the documented repo index boundary, mappings,
 * and stored queries.
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
    derived_summaries: createExpectedDerivedSummaries(),
    include: [
      'docs/**/*.md',
      'bin/**/*.js',
      'lib/**/*.js',
      'scripts/**/*.js',
      'test/**/*.js',
    ],
    kinds: {
      command: {
        label: 'Command',
      },
      document: {
        builtin: true,
      },
      term: {
        label: 'Term',
      },
    },
    mappings: createExpectedRepoMappings(),
    queries: createExpectedRepoQueries(),
    relations: createExpectedRepoRelations(),
  };
}

function createExpectedDerivedSummaries() {
  return {
    decision_execution: createExpectedDecisionExecutionSummary(),
    plan_execution: createExpectedPlanExecutionSummary(),
  };
}

function createExpectedDecisionExecutionSummary() {
  return {
    fields: createExpectedExecutionFields('decided_by'),
    kinds: ['decision'],
  };
}

function createExpectedPlanExecutionSummary() {
  return {
    fields: createExpectedExecutionFields('tracked_in'),
    kinds: ['plan'],
  };
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
          when: `count(in:${relation_name}, kind=task) > 0 and none(in:${relation_name}, kind=task and status not in [done, dropped, superseded])`,
        },
        {
          value: 'blocked',
          when: `any(in:${relation_name}, kind=task and status not in [done, dropped, superseded]) and none(in:${relation_name}, kind=task and status not in [done, dropped, superseded] and not status=blocked)`,
        },
        {
          value: 'in_progress',
          when: `any(in:${relation_name}, kind=task and not status=pending)`,
        },
      ],
    },
    {
      count: {
        traversal: `in:${relation_name}`,
        where: 'kind=task and status not in [done, dropped, superseded]',
      },
      name: 'open_tasks',
    },
    {
      count: {
        traversal: `in:${relation_name}`,
        where: 'kind=task and status=blocked',
      },
      name: 'blocked_tasks',
    },
    {
      count: {
        traversal: `in:${relation_name}`,
        where: 'kind=task',
      },
      name: 'total_tasks',
    },
  ];
}

function createExpectedRepoMappings() {
  return {
    ...createExpectedDocumentMappings(),
    ...createExpectedJsdocTaxonomyMappings(),
    ...createExpectedRepoDirectiveNodeMappings(),
    ...createExpectedRepoRelationMappings(),
    ...createExpectedMarkdownTaxonomyMappings(),
  };
}

function createExpectedDocumentMappings() {
  return {
    'document.title': {
      node: {
        field: 'title',
        kind: 'document',
      },
    },
    'markdown.link': {
      emit: {
        relation: 'links_to',
        target: 'path',
        target_kind: 'document',
      },
    },
  };
}

function createExpectedJsdocTaxonomyMappings() {
  return {
    'jsdoc.directive.about_command': createTaxonomyRelationMapping(
      'about_command',
      'command',
    ),
    'jsdoc.directive.uses_term': createTaxonomyRelationMapping(
      'uses_term',
      'term',
    ),
  };
}

function createExpectedMarkdownTaxonomyMappings() {
  return {
    'markdown.directive.about_command': createTaxonomyRelationMapping(
      'about_command',
      'command',
    ),
    'markdown.directive.command': createTaxonomyDefinitionMapping(
      'command',
      'title',
    ),
    'markdown.directive.command_summary': createTaxonomyNodeMapping(
      'command',
      'summary',
    ),
    'markdown.directive.term': createTaxonomyDefinitionMapping('term', 'title'),
    'markdown.directive.term_definition': createTaxonomyNodeMapping(
      'term',
      'definition',
    ),
    'markdown.directive.uses_term': createTaxonomyRelationMapping(
      'uses_term',
      'term',
    ),
  };
}

function createExpectedRepoDirectiveNodeMappings() {
  return {
    'jsdoc.directive.kind': createNodeMapping('kind'),
    'jsdoc.directive.status': createNodeMapping('status'),
    'jsdoc.directive.tracked_in': createRelationMapping('tracked_in'),
    'markdown.directive.kind': createNodeMapping('kind'),
    'markdown.directive.status': createNodeMapping('status'),
    'markdown.directive.tracked_in': createRelationMapping('tracked_in'),
  };
}

function createExpectedRepoRelationMappings() {
  return {
    'jsdoc.directive.blocked_by': createRelationMapping('blocked_by'),
    'jsdoc.directive.decided_by': createRelationMapping('decided_by'),
    'jsdoc.directive.implements': createRelationMapping('implements'),
    'jsdoc.directive.implements_command': createTaxonomyRelationMapping(
      'implements_command',
      'command',
    ),
    'markdown.directive.blocked_by': createRelationMapping('blocked_by'),
    'markdown.directive.decided_by': createRelationMapping('decided_by'),
    'markdown.directive.implements': createRelationMapping('implements'),
    'markdown.directive.implements_command': createTaxonomyRelationMapping(
      'implements_command',
      'command',
    ),
  };
}

function createExpectedRepoQueries() {
  return {
    ...createExpectedWorktrackingQueries(),
    ...createExpectedTaxonomyQueries(),
    ...createExpectedSourceQueries(),
  };
}

function createExpectedWorktrackingQueries() {
  return {
    ...createExpectedWorktrackingLifecycleQueries(),
    ...createExpectedWorktrackingTaskQueries(),
  };
}

function createExpectedWorktrackingLifecycleQueries() {
  return {
    'accepted-decisions': createStoredQuery(
      'kind=decision and status=accepted',
    ),
    'active-plans': createStoredQuery('kind=plan and status=active'),
    'active-roadmaps': createStoredQuery('kind=roadmap and status=active'),
    'decision-review-queue': createStoredQuery(
      'kind=decision and status=proposed',
    ),
    'decisions-needing-tasks': createStoredQuery(
      'kind=decision and status=accepted and count(in:decided_by, kind=task) = 0',
    ),
    'decisions-with-open-tasks': createStoredQuery(
      'kind=decision and status=accepted and any(in:decided_by, kind=task and status not in [done, dropped, superseded])',
    ),
    ideas: createStoredQuery(
      'kind=idea and status in [captured, exploring, planned]',
    ),
    'plans-with-open-tasks': createStoredQuery(
      'kind=plan and status=active and any(in:tracked_in, kind=task and status not in [done, dropped, superseded])',
    ),
    'plans-without-decisions': createStoredQuery(
      'kind=plan and status=active and none(in:tracked_in, kind=decision)',
    ),
  };
}

function createExpectedWorktrackingTaskQueries() {
  return {
    'blocked-tasks': createStoredQuery('kind=task and status=blocked'),
    'in-progress-tasks': createStoredQuery('kind=task and status=in_progress'),
    'pending-tasks': createStoredQuery('kind=task and status=pending'),
    'ready-tasks': createStoredQuery('kind=task and status=ready'),
  };
}

function createExpectedTaxonomyQueries() {
  return {
    'command-implementations': createStoredQuery('implements_command:*'),
    'command-taxonomy': createStoredQuery('id^=command:'),
    'term-usage': createStoredQuery('uses_term:*'),
    'term-taxonomy': createStoredQuery('id^=term:'),
  };
}

function createExpectedRepoRelations() {
  return {
    defines: {
      from: ['document'],
      to: ['command', 'term'],
    },
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
    implements: {
      from: ['document'],
      to: ['document'],
    },
    links_to: {
      builtin: true,
      from: ['document'],
      to: ['document'],
    },
    implements_command: {
      from: ['document'],
      to: ['command'],
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
 * @param {string} field
 */
function createNodeMapping(field) {
  return {
    node: {
      field,
      kind: 'document',
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
      target_kind: 'document',
    },
  };
}

/**
 * @param {string} kind
 * @param {string} field
 */
function createTaxonomyNodeMapping(kind, field) {
  return {
    node: {
      field,
      kind,
    },
  };
}

/**
 * @param {string} kind
 * @param {string} field
 */
function createTaxonomyDefinitionMapping(kind, field) {
  return {
    emit: {
      relation: 'defines',
      target: 'value',
      target_kind: kind,
    },
    node: {
      field,
      key: 'value',
      kind,
    },
  };
}

/**
 * @param {string} relation
 * @param {string} target_kind
 */
function createTaxonomyRelationMapping(relation, target_kind) {
  return {
    emit: {
      relation,
      target: 'path',
      target_kind,
    },
  };
}

function createExpectedSourceQueries() {
  return {
    'source-entrypoints': createStoredQuery('kind=entrypoint'),
    'source-cli': createStoredQuery('kind=cli'),
    'source-config': createStoredQuery('kind=config'),
    'source-scan': createStoredQuery('kind=scan'),
    'source-parse': createStoredQuery('kind=parse'),
    'source-graph': createStoredQuery('kind=graph'),
    'source-output': createStoredQuery('kind=output'),
    'source-support': createStoredQuery('kind=support'),
    'source-release': createStoredQuery('kind=release'),
  };
}

/**
 * @param {string} where
 * @returns {{ where: string }}
 */
function createStoredQuery(where) {
  return {
    where,
  };
}
