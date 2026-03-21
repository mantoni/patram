/**
 * @import { PatramRepoConfig } from './load-patram-config.types.ts';
 * @import { PatramConfig } from './patram-config.types.ts';
 */

import { parsePatramConfig } from './patram-config.js';

/**
 * Built-in graph semantics.
 *
 * Merges repo-defined graph config with Patram's built-in document and link
 * semantics before graph materialization.
 *
 * Kind: config
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/graph-materialization.md
 * @patram
 * @see {@link ./load-patram-config.js}
 * @see {@link ../docs/graph-v0.md}
 */

const BUILT_IN_PATRAM_CONFIG = {
  kinds: {
    document: {
      builtin: true,
      label: 'Document',
    },
  },
  mappings: {
    'document.title': {
      node: {
        field: 'title',
        kind: 'document',
      },
    },
    'document.description': {
      node: {
        field: 'description',
        kind: 'document',
      },
    },
    'jsdoc.link': {
      emit: {
        relation: 'links_to',
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
  },
  relations: {
    links_to: {
      builtin: true,
      from: ['document'],
      to: ['document'],
    },
  },
};

/**
 * Merge built-in Patram graph semantics with repo-defined schema.
 *
 * @param {PatramRepoConfig} repo_config
 * @returns {PatramConfig}
 */
export function resolvePatramGraphConfig(repo_config) {
  return parsePatramConfig({
    kinds: {
      ...BUILT_IN_PATRAM_CONFIG.kinds,
      ...repo_config.kinds,
    },
    mappings: {
      ...BUILT_IN_PATRAM_CONFIG.mappings,
      ...repo_config.mappings,
    },
    relations: {
      ...BUILT_IN_PATRAM_CONFIG.relations,
      ...repo_config.relations,
    },
  });
}
