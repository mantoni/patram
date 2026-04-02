/**
 * @import { ClassDefinition } from './patram-config.js';
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
 * Tracked in: ../../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../../docs/decisions/graph-materialization.md
 * @patram
 * @see {@link ./load-patram-config.js}
 * @see {@link ../../docs/graph-v0.md}
 */

const BUILT_IN_PATRAM_CONFIG = {
  classes: {
    document: {
      builtin: true,
      label: 'Document',
    },
  },
  mappings: {
    'document.title': {
      node: {
        class: 'document',
        field: 'title',
      },
    },
    'document.description': {
      node: {
        class: 'document',
        field: 'description',
      },
    },
    'jsdoc.link': {
      emit: {
        relation: 'links_to',
        target: 'path',
        target_class: 'document',
      },
    },
    'markdown.link': {
      emit: {
        relation: 'links_to',
        target: 'path',
        target_class: 'document',
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
  const graph_config = parsePatramConfig({
    classes: {
      ...BUILT_IN_PATRAM_CONFIG.classes,
      ...collectGraphClassDefinitions(repo_config.classes),
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

  return {
    ...graph_config,
    classes: mergeResolvedClasses(graph_config.classes, repo_config.classes),
    fields: repo_config.fields,
    path_classes: repo_config.path_classes,
  };
}

/**
 * @param {PatramRepoConfig['classes']} classes
 * @returns {Record<string, ClassDefinition>}
 */
function collectGraphClassDefinitions(classes) {
  /** @type {Record<string, ClassDefinition>} */
  const graph_class_definitions = {};

  for (const [class_name, class_definition] of Object.entries(classes ?? {})) {
    graph_class_definitions[class_name] = {
      builtin: class_definition.builtin,
      label: class_definition.label,
    };
  }

  return graph_class_definitions;
}

/**
 * @param {Record<string, ClassDefinition>} graph_classes
 * @param {PatramRepoConfig['classes']} repo_classes
 * @returns {PatramConfig['classes']}
 */
function mergeResolvedClasses(graph_classes, repo_classes) {
  /** @type {PatramConfig['classes']} */
  const resolved_classes = {};

  for (const [class_name, class_definition] of Object.entries(graph_classes)) {
    resolved_classes[class_name] = {
      ...class_definition,
      identity: repo_classes?.[class_name]?.identity,
      schema: repo_classes?.[class_name]?.schema,
    };
  }

  return resolved_classes;
}
