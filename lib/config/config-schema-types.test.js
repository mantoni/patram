/**
 * @import { ClassSchemaConfig, MetadataFieldConfig, PatramRepoConfig } from './load-patram-config.js';
 */

import { expect, it } from 'vitest';

it('exposes schema-derived config types for JSDoc consumers', () => {
  const repo_config = createRepoConfigFixture();

  expect(repo_config.queries.pending.cypher).toBe('MATCH (n:Task) RETURN n');
  expect(repo_config.classes?.task).toEqual(createRepoClassFixture());
  expect(createMetadataFieldFixture()).toEqual({
    query: {
      prefix: true,
    },
    type: 'string',
  });
});

/**
 * @returns {{ label: string, schema: ClassSchemaConfig }}
 */
function createRepoClassFixture() {
  return {
    label: 'Task',
    schema: {
      fields: {
        status: {
          presence: 'required',
        },
      },
      unknown_fields: 'error',
    },
  };
}

/**
 * @returns {MetadataFieldConfig}
 */
function createMetadataFieldFixture() {
  return {
    query: {
      prefix: true,
    },
    type: 'string',
  };
}

/**
 * @returns {PatramRepoConfig}
 */
function createRepoConfigFixture() {
  return {
    classes: {
      task: createRepoClassFixture(),
    },
    include: ['docs/**/*.md'],
    queries: {
      pending: {
        cypher: 'MATCH (n:Task) RETURN n',
      },
    },
  };
}

/** @type {MetadataFieldConfig} */
const invalid_field_definition = {
  type: 'string',
  // @ts-expect-error Metadata fields reject unknown properties.
  unknown_option: true,
};

void invalid_field_definition;
