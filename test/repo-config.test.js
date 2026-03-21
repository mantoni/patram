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

/**
 * @returns {object}
 */
function createExpectedRepoConfig() {
  return {
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

/**
 * @returns {object}
 */
function createExpectedRepoMappings() {
  return {
    'document.title': {
      node: {
        field: 'title',
        kind: 'document',
      },
    },
    'jsdoc.directive.about_command': createTaxonomyRelationMapping(
      'about_command',
      'command',
    ),
    ...createExpectedRepoDirectiveNodeMappings(),
    ...createExpectedRepoRelationMappings(),
    'jsdoc.directive.uses_term': createTaxonomyRelationMapping(
      'uses_term',
      'term',
    ),
    'markdown.directive.about_command': createTaxonomyRelationMapping(
      'about_command',
      'command',
    ),
    'markdown.directive.command': createTaxonomyNodeMapping('command', 'title'),
    'markdown.directive.command_summary': createTaxonomyNodeMapping(
      'command',
      'summary',
    ),
    'markdown.link': {
      emit: {
        relation: 'links_to',
        target: 'path',
        target_kind: 'document',
      },
    },
    'markdown.directive.term': createTaxonomyNodeMapping('term', 'title'),
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

/**
 * @returns {object}
 */
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

/**
 * @returns {object}
 */
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

/**
 * @returns {object}
 */
function createExpectedRepoQueries() {
  return {
    pending: {
      where: 'kind=task and status=pending',
    },
    blocked: {
      where: 'kind=task and status=blocked',
    },
    'accepted-decisions': {
      where: 'kind=decision and status=accepted',
    },
    'command-implementations': {
      where: 'implements_command:*',
    },
    'command-taxonomy': {
      where: 'kind=command and path^=docs/reference/commands/',
    },
    ...createExpectedSourceQueries(),
    'term-usage': {
      where: 'uses_term:*',
    },
    'term-taxonomy': {
      where: 'kind=term and path^=docs/reference/terms/',
    },
  };
}

/**
 * @returns {object}
 */
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
 * @returns {object}
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
 * @returns {object}
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
 * @returns {object}
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
 * @param {string} relation
 * @param {string} target_kind
 * @returns {object}
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

/**
 * @returns {object}
 */
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
