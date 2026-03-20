import { expect, it } from 'vitest';

import repo_config from '../.patram.json' with { type: 'json' };

it('indexes repo docs and defines the documented stored queries', () => {
  expect(repo_config).toEqual(createExpectedRepoConfig());
});

/**
 * @returns {object}
 */
function createExpectedRepoConfig() {
  return {
    include: ['docs/**/*.md'],
    kinds: {
      document: {
        builtin: true,
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
    ...createExpectedRepoRelationMappings(),
    'markdown.directive.kind': {
      node: {
        field: 'kind',
        kind: 'document',
      },
    },
    'markdown.directive.status': {
      node: {
        field: 'status',
        kind: 'document',
      },
    },
    'markdown.directive.tracked_in': {
      emit: {
        relation: 'tracked_in',
        target: 'path',
        target_kind: 'document',
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

/**
 * @returns {object}
 */
function createExpectedRepoRelationMappings() {
  return {
    'markdown.directive.blocked_by': {
      emit: {
        relation: 'blocked_by',
        target: 'path',
        target_kind: 'document',
      },
    },
    'markdown.directive.decided_by': {
      emit: {
        relation: 'decided_by',
        target: 'path',
        target_kind: 'document',
      },
    },
    'markdown.directive.implements': {
      emit: {
        relation: 'implements',
        target: 'path',
        target_kind: 'document',
      },
    },
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
  };
}

/**
 * @returns {object}
 */
function createExpectedRepoRelations() {
  return {
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
    tracked_in: {
      from: ['document'],
      to: ['document'],
    },
  };
}
