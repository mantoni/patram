/**
 * @import { PatramRepoConfig } from './load-patram-config.types.ts';
 * @import { PatramConfig } from './patram-config.types.ts';
 */

import { parsePatramConfig } from './patram-config.js';

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
