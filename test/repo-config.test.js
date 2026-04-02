/* eslint-disable max-lines */
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
    classes: createExpectedClasses(),
    fields: createExpectedFields(),
    include: [
      'docs/**/*.md',
      'docs/**/*.yaml',
      'docs/**/*.yml',
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

function createExpectedClasses() {
  return {
    command: createExpectedLabeledClass('Command', {
      summary: createOptionalFieldRule(),
    }),
    convention: createExpectedLabeledDocumentClass(
      'Convention',
      'convention_docs',
    ),
    decision: createExpectedLabeledDocumentClass('Decision', 'decision_docs'),
    document: createExpectedDocumentClass(),
    idea: createExpectedLabeledDocumentClass('Idea', 'idea_docs'),
    plan: createExpectedLabeledDocumentClass('Plan', 'plan_docs'),
    roadmap: createExpectedLabeledDocumentClass('Roadmap', 'roadmap_docs'),
    task: createExpectedLabeledDocumentClass('Task', 'task_docs'),
    term: createExpectedLabeledClass('Term', {
      definition: createOptionalFieldRule(),
    }),
  };
}

/**
 * @param {string} label
 * @param {string} document_path_class
 */
function createExpectedLabeledDocumentClass(label, document_path_class) {
  return {
    label,
    schema: createExpectedDocumentClassSchema(document_path_class),
  };
}

/**
 * @param {string} label
 * @param {Record<string, { presence: 'optional' }>} fields
 */
function createExpectedLabeledClass(label, fields) {
  return {
    label,
    schema: createExpectedClassSchema(fields),
  };
}

function createExpectedDocumentClass() {
  return {
    builtin: true,
    schema: createExpectedClassSchema({
      description: createOptionalFieldRule(),
      kind: createOptionalFieldRule(),
      status: createOptionalFieldRule(),
    }),
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

function createExpectedRepoMappings() {
  return {
    ...createExpectedDocumentMappings(),
    ...createExpectedJsdocMappings(),
    ...createExpectedMarkdownMappings(),
    ...createExpectedYamlMappings(),
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

function createExpectedYamlMappings() {
  return {
    'yaml.directive.about_command': createTaxonomyRelationMapping(
      'about_command',
      'command',
    ),
    'yaml.directive.blocked_by': createRelationMapping('blocked_by'),
    'yaml.directive.command': createTaxonomyDefinitionMapping(
      'command',
      'title',
    ),
    'yaml.directive.command_summary': createTaxonomyNodeMapping(
      'command',
      'summary',
    ),
    'yaml.directive.decided_by': createRelationMapping('decided_by'),
    'yaml.directive.implements': createRelationMapping('implements'),
    'yaml.directive.implements_command': createTaxonomyRelationMapping(
      'implements_command',
      'command',
    ),
    'yaml.directive.kind': createDocumentNodeMapping('$class'),
    'yaml.directive.status': createDocumentNodeMapping('status'),
    'yaml.directive.term': createTaxonomyDefinitionMapping('term', 'title'),
    'yaml.directive.term_definition': createTaxonomyNodeMapping(
      'term',
      'definition',
    ),
    'yaml.directive.tracked_in': createRelationMapping('tracked_in'),
    'yaml.directive.uses_term': createTaxonomyRelationMapping(
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
    ...createExpectedWorktrackingQueries(),
    ...createExpectedTaxonomyQueries(),
    ...createExpectedSourceQueries(),
  };
}

function createExpectedWorktrackingQueries() {
  return {
    ...createExpectedWorktrackingDecisionQueries(),
    ...createExpectedWorktrackingTaskQueries(),
    ...createExpectedWorktrackingPlanQueries(),
  };
}

function createExpectedTaxonomyQueries() {
  return {
    'command-implementations': createStoredQuery(
      'MATCH (n) WHERE EXISTS { MATCH (n)-[:IMPLEMENTS_COMMAND]->(command:Command) } RETURN n',
      'Show source anchors that implement documented commands.',
    ),
    'command-taxonomy': createStoredQuery(
      'MATCH (n:Command) RETURN n',
      'Show canonical command reference nodes.',
    ),
    'term-taxonomy': createStoredQuery(
      'MATCH (n:Term) RETURN n',
      'Show canonical term reference nodes.',
    ),
    'term-usage': createStoredQuery(
      'MATCH (n) WHERE EXISTS { MATCH (n)-[:USES_TERM]->(term:Term) } RETURN n',
      'Show nodes that use canonical terms.',
    ),
  };
}

function createExpectedWorktrackingDecisionQueries() {
  return {
    'accepted-decisions': createStoredQuery(
      "MATCH (n:Decision) WHERE n.status = 'accepted' RETURN n",
      'Show accepted decisions.',
    ),
    'decision-review-queue': createStoredQuery(
      "MATCH (n:Decision) WHERE n.status = 'proposed' RETURN n",
      'Show proposed decisions awaiting review.',
    ),
    'decisions-needing-tasks': createStoredQuery(
      "MATCH (n:Decision) WHERE n.status = 'accepted' AND COUNT { MATCH (task:Task)-[:DECIDED_BY]->(n) } = 0 RETURN n",
      'Show accepted decisions that do not yet have tasks.',
    ),
    'decisions-with-open-tasks': createStoredQuery(
      "MATCH (n:Decision) WHERE n.status = 'accepted' AND EXISTS { MATCH (task:Task)-[:DECIDED_BY]->(n) WHERE task.status NOT IN ['done', 'dropped', 'superseded'] } RETURN n",
      'Show accepted decisions with unfinished tasks.',
    ),
  };
}

function createExpectedWorktrackingTaskQueries() {
  return {
    'blocked-tasks': createStoredQuery(
      "MATCH (n:Task) WHERE n.status = 'blocked' RETURN n",
      'Show blocked tasks.',
    ),
    ideas: createStoredQuery(
      "MATCH (n:Idea) WHERE n.status IN ['captured', 'exploring', 'planned'] RETURN n",
      'Show captured, exploring, and planned ideas.',
    ),
    'in-progress-tasks': createStoredQuery(
      "MATCH (n:Task) WHERE n.status = 'in_progress' RETURN n",
      'Show tasks currently in progress.',
    ),
    'pending-tasks': createStoredQuery(
      "MATCH (n:Task) WHERE n.status = 'pending' RETURN n",
      'Show tasks that have not started yet.',
    ),
    'ready-tasks': createStoredQuery(
      "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
      'Show tasks that are ready to start.',
    ),
  };
}

function createExpectedWorktrackingPlanQueries() {
  return {
    'active-plans': createStoredQuery(
      "MATCH (n:Plan) WHERE n.status = 'active' RETURN n",
      'Show active implementation plans.',
    ),
    'active-roadmaps': createStoredQuery(
      "MATCH (n:Roadmap) WHERE n.status = 'active' RETURN n",
      'Show active roadmaps.',
    ),
    'plans-with-open-tasks': createStoredQuery(
      "MATCH (n:Plan) WHERE n.status = 'active' AND EXISTS { MATCH (task:Task)-[:TRACKED_IN]->(n) WHERE task.status NOT IN ['done', 'dropped', 'superseded'] } RETURN n",
      'Show active plans with unfinished tasks.',
    ),
    'plans-without-decisions': createStoredQuery(
      "MATCH (n:Plan) WHERE n.status = 'active' AND NOT EXISTS { MATCH (decision:Decision)-[:TRACKED_IN]->(n) } RETURN n",
      'Show active plans that are missing linked decisions.',
    ),
  };
}

function createExpectedSourceQueries() {
  return {
    'source-cli': createStoredQuery(
      "MATCH (n) WHERE n.kind = 'cli' RETURN n",
      'Show CLI-related source anchors.',
    ),
    'source-config': createStoredQuery(
      "MATCH (n) WHERE n.kind = 'config' RETURN n",
      'Show config-related source anchors.',
    ),
    'source-entrypoints': createStoredQuery(
      "MATCH (n) WHERE n.kind = 'entrypoint' RETURN n",
      'Show documented entrypoint source anchors.',
    ),
    'source-graph': createStoredQuery(
      "MATCH (n) WHERE n.kind = 'graph' RETURN n",
      'Show graph-related source anchors.',
    ),
    'source-output': createStoredQuery(
      "MATCH (n) WHERE n.kind = 'output' RETURN n",
      'Show output-related source anchors.',
    ),
    'source-parse': createStoredQuery(
      "MATCH (n) WHERE n.kind = 'parse' RETURN n",
      'Show parse-related source anchors.',
    ),
    'source-release': createStoredQuery(
      "MATCH (n) WHERE n.kind = 'release' RETURN n",
      'Show release-related source anchors.',
    ),
    'source-scan': createStoredQuery(
      "MATCH (n) WHERE n.kind = 'scan' RETURN n",
      'Show scan-related source anchors.',
    ),
    'source-support': createStoredQuery(
      "MATCH (n) WHERE n.kind = 'support' RETURN n",
      'Show support source anchors.',
    ),
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
 * @param {string} cypher
 * @param {string} [description]
 */
function createStoredQuery(cypher, description) {
  /** @type {{ cypher: string, description?: string }} */
  const stored_query = { cypher };

  if (description) {
    stored_query.description = description;
  }

  return stored_query;
}
