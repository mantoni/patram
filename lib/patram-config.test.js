import { expect, it } from 'vitest';

import graph_v0_config from '../docs/graph-v0.config.json' with { type: 'json' };
import { parsePatramConfig } from './patram-config.js';

it('parses the documented v0 config example', () => {
  const config_json = parsePatramConfig(graph_v0_config);

  expect(config_json.kinds.term.label).toBe('Term');
  expect(config_json.mappings['markdown.directive.defined_by'].emit).toEqual({
    relation: 'defines',
    target: 'path',
    target_kind: 'term',
  });
});

it('rejects mappings that reference unknown relations', () => {
  const issues = getIssues(createMissingRelationConfig());

  expect(issues).toContainEqual(
    expect.objectContaining({
      message: 'Unknown relation "missing_relation".',
      path: ['mappings', 'markdown.link', 'emit', 'relation'],
    }),
  );
});

it('rejects mappings that reference unknown kinds', () => {
  const issues = getIssues(createUnknownKindConfig());

  expect(issues).toContainEqual(
    expect.objectContaining({
      message: 'Unknown kind "term".',
      path: [
        'mappings',
        'markdown.directive.defined_by',
        'emit',
        'target_kind',
      ],
    }),
  );
});

it('rejects mappings without semantic output', () => {
  const issues = getIssues(createEmptyMappingConfig());

  expect(issues).toContainEqual(
    expect.objectContaining({
      message: 'Mapping must define at least one of "emit" or "node".',
      path: ['mappings', 'document.title'],
    }),
  );
});

/**
 * Create a config with an unknown relation reference.
 *
 * @returns {object}
 */
function createMissingRelationConfig() {
  return {
    kinds: {
      document: {
        builtin: true,
      },
    },
    mappings: {
      'markdown.link': {
        emit: {
          relation: 'missing_relation',
          target: 'path',
          target_kind: 'document',
        },
      },
    },
    relations: {},
  };
}

/**
 * Create a config with an unknown kind reference.
 *
 * @returns {object}
 */
function createUnknownKindConfig() {
  return {
    kinds: {
      document: {
        builtin: true,
      },
    },
    mappings: {
      'markdown.directive.defined_by': {
        emit: {
          relation: 'links_to',
          target: 'path',
          target_kind: 'term',
        },
      },
    },
    relations: {
      links_to: {
        from: ['document'],
        to: ['document'],
      },
    },
  };
}

/**
 * Create a config with an empty mapping definition.
 *
 * @returns {object}
 */
function createEmptyMappingConfig() {
  return {
    kinds: {
      document: {
        builtin: true,
      },
    },
    mappings: {
      'document.title': {},
    },
    relations: {},
  };
}

/**
 * Parse config and return validation issues.
 *
 * @param {object} config_json
 * @returns {unknown[]}
 */
function getIssues(config_json) {
  try {
    parsePatramConfig(config_json);
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      return /** @type {{ issues: unknown[] }} */ (error).issues;
    }

    throw error;
  }

  throw new Error('Expected configuration parsing to fail.');
}
