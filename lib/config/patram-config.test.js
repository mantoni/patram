import { expect, it } from 'vitest';

import { parsePatramConfig } from './patram-config.js';

it('parses the field-model graph config vocabulary', () => {
  const config_json = parsePatramConfig(createGraphConfigFixture());

  expect(config_json.classes.term.label).toBe('Term');
  expect(config_json.mappings['markdown.directive.command']).toEqual({
    emit: {
      relation: 'defines',
      target: 'value',
      target_class: 'command',
    },
    node: {
      class: 'command',
      field: 'title',
      key: 'value',
    },
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

it('rejects mappings that reference unknown classes', () => {
  const issues = getIssues(createUnknownClassConfig());

  expect(issues).toContainEqual(
    expect.objectContaining({
      message: 'Unknown class "term".',
      path: [
        'mappings',
        'markdown.directive.defined_by',
        'emit',
        'target_class',
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

function createMissingRelationConfig() {
  return {
    classes: {
      document: {
        builtin: true,
      },
    },
    mappings: {
      'markdown.link': {
        emit: {
          relation: 'missing_relation',
          target: 'path',
          target_class: 'document',
        },
      },
    },
    relations: {},
  };
}

function createGraphConfigFixture() {
  return {
    classes: {
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
    mappings: {
      'document.title': {
        node: {
          class: 'document',
          field: 'title',
        },
      },
      'markdown.directive.command': {
        emit: {
          relation: 'defines',
          target: 'value',
          target_class: 'command',
        },
        node: {
          class: 'command',
          field: 'title',
          key: 'value',
        },
      },
    },
    relations: {
      defines: {
        from: ['document'],
        to: ['command', 'term'],
      },
    },
  };
}

function createUnknownClassConfig() {
  return {
    classes: {
      document: {
        builtin: true,
      },
    },
    mappings: {
      'markdown.directive.defined_by': {
        emit: {
          relation: 'links_to',
          target: 'path',
          target_class: 'term',
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

function createEmptyMappingConfig() {
  return {
    classes: {
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
