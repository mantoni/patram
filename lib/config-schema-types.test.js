/**
 * @import { ClassDefinition } from './patram-config.js';
 * @import { MetadataFieldConfig, PatramRepoConfig } from './load-patram-config.js';
 */

import { expect, it } from 'vitest';

it('exposes schema-derived config types for JSDoc consumers', () => {
  const repo_config = createRepoConfigFixture();

  expect(repo_config.queries.pending.where).toBe('$class=task');
  expect(repo_config.classes?.task).toEqual(createClassDefinitionFixture());
  expect(createMetadataFieldFixture()).toEqual({
    query: {
      prefix: true,
    },
    type: 'string',
  });
});

/**
 * @returns {ClassDefinition}
 */
function createClassDefinitionFixture() {
  return {
    label: 'Task',
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
      task: createClassDefinitionFixture(),
    },
    include: ['docs/**/*.md'],
    queries: {
      pending: {
        where: '$class=task',
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
