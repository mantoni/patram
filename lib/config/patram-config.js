/**
 * @import { RefinementCtx } from 'zod';
 */

import { z } from 'zod';

const CLASS_NAME_SCHEMA = z.string().min(1);
const RELATION_NAME_SCHEMA = z.string().min(1);
const CLAIM_TYPE_SCHEMA = z.string().min(1);
const KEY_SOURCE_SCHEMA = z.enum(['path', 'value']);
const TARGET_SCHEMA = z.enum(['path', 'value']);

/**
 * @typedef {z.output<typeof class_definition_schema>} ClassDefinition
 */
const class_definition_schema = z
  .object({
    builtin: z.boolean().optional(),
    label: z.string().min(1).optional(),
  })
  .strict();

/**
 * @typedef {z.output<typeof relation_definition_schema>} RelationDefinition
 */
const relation_definition_schema = z
  .object({
    builtin: z.boolean().optional(),
    from: z.array(CLASS_NAME_SCHEMA).min(1),
    to: z.array(CLASS_NAME_SCHEMA).min(1),
  })
  .strict();

/**
 * @typedef {z.output<typeof mapping_node_schema>} MappingNodeDefinition
 */
const mapping_node_schema = z
  .object({
    class: CLASS_NAME_SCHEMA,
    field: z.string().min(1),
    key: KEY_SOURCE_SCHEMA.optional(),
  })
  .strict();

/**
 * @typedef {z.output<typeof mapping_emit_schema>} MappingEmitDefinition
 */
const mapping_emit_schema = z
  .object({
    relation: RELATION_NAME_SCHEMA,
    target: TARGET_SCHEMA,
    target_class: CLASS_NAME_SCHEMA,
  })
  .strict();

/**
 * @typedef {z.output<typeof mapping_definition_schema>} MappingDefinition
 */
const mapping_definition_schema = z
  .object({
    emit: mapping_emit_schema.optional(),
    node: mapping_node_schema.optional(),
  })
  .strict()
  .superRefine(validateMappingDefinition);

/**
 * @typedef {z.output<typeof patram_config_schema>} PatramGraphConfig
 */
const patram_config_schema = z
  .object({
    $schema: z.url().optional(),
    classes: z.record(CLASS_NAME_SCHEMA, class_definition_schema),
    mappings: z.record(CLAIM_TYPE_SCHEMA, mapping_definition_schema),
    relations: z.record(RELATION_NAME_SCHEMA, relation_definition_schema),
  })
  .strict()
  .superRefine(validatePatramConfigReferences);

/**
 * Parse and validate Patram JSON configuration.
 *
 * @param {unknown} config_json
 * @returns {PatramGraphConfig}
 */
export function parsePatramConfig(config_json) {
  return patram_config_schema.parse(config_json);
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
 * @param {PatramGraphConfig} config_json
 * @param {RefinementCtx} refinement_context
 */
function validatePatramConfigReferences(config_json, refinement_context) {
  validateRelationClasses(config_json, refinement_context);
  validateMappingClasses(config_json, refinement_context);
  validateMappingRelations(config_json, refinement_context);
}

/**
 * @param {PatramGraphConfig} config_json
 * @param {RefinementCtx} refinement_context
 */
function validateRelationClasses(config_json, refinement_context) {
  for (const [relation_name, relation_definition] of Object.entries(
    config_json.relations,
  )) {
    validateReferencedClasses(
      relation_definition.from,
      config_json.classes,
      ['relations', relation_name, 'from'],
      refinement_context,
    );
    validateReferencedClasses(
      relation_definition.to,
      config_json.classes,
      ['relations', relation_name, 'to'],
      refinement_context,
    );
  }
}

/**
 * @param {PatramGraphConfig} config_json
 * @param {RefinementCtx} refinement_context
 */
function validateMappingClasses(config_json, refinement_context) {
  for (const [mapping_name, mapping_definition] of Object.entries(
    config_json.mappings,
  )) {
    if (mapping_definition.emit) {
      validateReferencedClasses(
        [mapping_definition.emit.target_class],
        config_json.classes,
        ['mappings', mapping_name, 'emit', 'target_class'],
        refinement_context,
      );
    }

    if (mapping_definition.node) {
      validateReferencedClasses(
        [mapping_definition.node.class],
        config_json.classes,
        ['mappings', mapping_name, 'node', 'class'],
        refinement_context,
      );
    }
  }
}

/**
 * @param {PatramGraphConfig} config_json
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
 * @param {string[]} referenced_classes
 * @param {Record<string, unknown>} known_classes
 * @param {(string | number)[]} issue_path
 * @param {RefinementCtx} refinement_context
 */
function validateReferencedClasses(
  referenced_classes,
  known_classes,
  issue_path,
  refinement_context,
) {
  for (const referenced_class of referenced_classes) {
    if (known_classes[referenced_class]) {
      continue;
    }

    refinement_context.addIssue({
      code: 'custom',
      message: `Unknown class "${referenced_class}".`,
      path: issue_path,
    });
  }
}
