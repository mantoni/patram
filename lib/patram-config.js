/**
 * @import { PatramConfig } from './patram-config.types.ts';
 * @import { RefinementCtx } from 'zod';
 */

import { z } from 'zod';

const KIND_NAME_SCHEMA = z.string().min(1);
const RELATION_NAME_SCHEMA = z.string().min(1);
const CLAIM_TYPE_SCHEMA = z.string().min(1);
const TARGET_SCHEMA = z.enum(['path']);

const kind_definition_schema = z
  .object({
    builtin: z.boolean().optional(),
    label: z.string().min(1).optional(),
  })
  .strict();

const relation_definition_schema = z
  .object({
    builtin: z.boolean().optional(),
    from: z.array(KIND_NAME_SCHEMA).min(1),
    to: z.array(KIND_NAME_SCHEMA).min(1),
  })
  .strict();

const mapping_node_schema = z
  .object({
    field: z.string().min(1),
    kind: KIND_NAME_SCHEMA,
  })
  .strict();

const mapping_emit_schema = z
  .object({
    relation: RELATION_NAME_SCHEMA,
    target: TARGET_SCHEMA,
    target_kind: KIND_NAME_SCHEMA,
  })
  .strict();

const mapping_definition_schema = z
  .object({
    emit: mapping_emit_schema.optional(),
    node: mapping_node_schema.optional(),
  })
  .strict()
  .superRefine(validateMappingDefinition);

export const patramConfigSchema = z
  .object({
    $schema: z.url().optional(),
    kinds: z.record(KIND_NAME_SCHEMA, kind_definition_schema),
    mappings: z.record(CLAIM_TYPE_SCHEMA, mapping_definition_schema),
    relations: z.record(RELATION_NAME_SCHEMA, relation_definition_schema),
  })
  .strict()
  .superRefine(validatePatramConfigReferences);

/**
 * Parse and validate Patram JSON configuration.
 *
 * @param {unknown} config_json
 * @returns {PatramConfig}
 */
export function parsePatramConfig(config_json) {
  return patramConfigSchema.parse(config_json);
}

/**
 * @param {{ emit?: unknown, node?: unknown }} mapping_definition
 * @param {RefinementCtx} refinement_context
 */
function validateMappingDefinition(mapping_definition, refinement_context) {
  if (mapping_definition.emit || mapping_definition.node) {
    return;
  }

  refinement_context.addIssue({
    code: 'custom',
    message: 'Mapping must define at least one of "emit" or "node".',
  });
}

/**
 * @param {PatramConfig} config_json
 * @param {RefinementCtx} refinement_context
 */
function validatePatramConfigReferences(config_json, refinement_context) {
  validateRelationKinds(config_json, refinement_context);
  validateMappingKinds(config_json, refinement_context);
  validateMappingRelations(config_json, refinement_context);
}

/**
 * @param {PatramConfig} config_json
 * @param {RefinementCtx} refinement_context
 */
function validateRelationKinds(config_json, refinement_context) {
  for (const [relation_name, relation_definition] of Object.entries(
    config_json.relations,
  )) {
    validateReferencedKinds(
      relation_definition.from,
      config_json.kinds,
      ['relations', relation_name, 'from'],
      refinement_context,
    );
    validateReferencedKinds(
      relation_definition.to,
      config_json.kinds,
      ['relations', relation_name, 'to'],
      refinement_context,
    );
  }
}

/**
 * @param {PatramConfig} config_json
 * @param {RefinementCtx} refinement_context
 */
function validateMappingKinds(config_json, refinement_context) {
  for (const [mapping_name, mapping_definition] of Object.entries(
    config_json.mappings,
  )) {
    if (mapping_definition.emit) {
      validateReferencedKinds(
        [mapping_definition.emit.target_kind],
        config_json.kinds,
        ['mappings', mapping_name, 'emit', 'target_kind'],
        refinement_context,
      );
    }

    if (mapping_definition.node) {
      validateReferencedKinds(
        [mapping_definition.node.kind],
        config_json.kinds,
        ['mappings', mapping_name, 'node', 'kind'],
        refinement_context,
      );
    }
  }
}

/**
 * @param {PatramConfig} config_json
 * @param {RefinementCtx} refinement_context
 */
function validateMappingRelations(config_json, refinement_context) {
  for (const [mapping_name, mapping_definition] of Object.entries(
    config_json.mappings,
  )) {
    if (!mapping_definition.emit) {
      continue;
    }

    if (config_json.relations[mapping_definition.emit.relation]) {
      continue;
    }

    refinement_context.addIssue({
      code: 'custom',
      message: `Unknown relation "${mapping_definition.emit.relation}".`,
      path: ['mappings', mapping_name, 'emit', 'relation'],
    });
  }
}

/**
 * @param {string[]} referenced_kinds
 * @param {Record<string, unknown>} known_kinds
 * @param {(string | number)[]} issue_path
 * @param {RefinementCtx} refinement_context
 */
function validateReferencedKinds(
  referenced_kinds,
  known_kinds,
  issue_path,
  refinement_context,
) {
  for (const referenced_kind of referenced_kinds) {
    if (known_kinds[referenced_kind]) {
      continue;
    }

    refinement_context.addIssue({
      code: 'custom',
      message: `Unknown kind "${referenced_kind}".`,
      path: issue_path,
    });
  }
}
