import { z } from 'zod';

import { DEFAULT_INCLUDE_PATTERNS } from './source-file-defaults.js';

export const CONFIG_FILE_NAME = '.patram.json';

const RESERVED_STRUCTURAL_FIELD_NAMES = new Set(['$class', '$id', '$path']);

/**
 * @typedef {z.output<typeof stored_query_schema>} StoredQueryConfig
 */
const stored_query_schema = z
  .object({
    cypher: z
      .string()
      .min(1, 'Stored query "cypher" must not be empty.')
      .optional(),
    description: z
      .string()
      .min(1, 'Stored query "description" must not be empty.')
      .optional(),
  })
  .strict()
  .superRefine((stored_query, refinement_context) => {
    if (stored_query.cypher !== undefined) {
      return;
    }

    refinement_context.addIssue({
      code: 'custom',
      message: 'Stored queries require "cypher".',
      path: ['cypher'],
    });
  });

const field_common_shape = {
  hidden: z.boolean().optional(),
  many: z.boolean().optional(),
  on: z.array(z.string().min(1)).min(1).optional(),
  order: z.number().int().nonnegative().optional(),
  required_on: z.array(z.string().min(1)).min(1).optional(),
};

/**
 * @typedef {z.output<typeof scalar_field_schema>} ScalarFieldConfig
 */
const scalar_field_schema = z.discriminatedUnion('type', [
  z
    .object({
      ...field_common_shape,
      type: z.literal('string'),
    })
    .strict(),
  z
    .object({
      ...field_common_shape,
      type: z.literal('integer'),
    })
    .strict(),
  z
    .object({
      ...field_common_shape,
      type: z.literal('enum'),
      values: z
        .array(z.string().min(1, 'Field enum values must not be empty.'))
        .min(1, 'Field enum values must contain at least one value.'),
    })
    .strict(),
  z
    .object({
      ...field_common_shape,
      type: z.literal('path'),
    })
    .strict(),
  z
    .object({
      ...field_common_shape,
      type: z.literal('glob'),
    })
    .strict(),
  z
    .object({
      ...field_common_shape,
      type: z.literal('date'),
    })
    .strict(),
  z
    .object({
      ...field_common_shape,
      type: z.literal('date_time'),
    })
    .strict(),
]);

/**
 * @typedef {z.output<typeof ref_field_schema>} RefFieldConfig
 */
const ref_field_schema = z
  .object({
    ...field_common_shape,
    to: z.string().min(1),
    type: z.literal('ref'),
  })
  .strict();

/**
 * @typedef {z.output<typeof metadata_field_schema>} MetadataFieldConfig
 */
const metadata_field_schema = z.discriminatedUnion('type', [
  ...scalar_field_schema.options,
  ref_field_schema,
]);

/**
 * @typedef {z.output<typeof type_definition_schema>} TypeDefinitionConfig
 */
const type_definition_schema = z
  .object({
    defined_by: z.string().min(1).optional(),
    in: z
      .union([z.string().min(1), z.array(z.string().min(1)).min(1)])
      .optional(),
    label: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((type_definition, refinement_context) => {
    const has_in = type_definition.in !== undefined;
    const has_defined_by = type_definition.defined_by !== undefined;

    if (has_in && has_defined_by) {
      refinement_context.addIssue({
        code: 'custom',
        message:
          'Type definitions must not declare both "in" and "defined_by".',
      });
      return;
    }

    if (has_in || has_defined_by) {
      return;
    }

    refinement_context.addIssue({
      code: 'custom',
      message:
        'Type definitions must declare exactly one of "in" or "defined_by".',
    });
  });

/**
 * @typedef {z.output<typeof patram_repo_config_schema>} PatramRepoConfig
 */
export const patram_repo_config_schema = z
  .object({
    fields: z.record(z.string().min(1), metadata_field_schema).optional(),
    include: z
      .array(z.string().min(1, 'Include globs must not be empty.'))
      .min(1, 'Include must contain at least one glob.')
      .default(DEFAULT_INCLUDE_PATTERNS),
    queries: z.record(z.string().min(1), stored_query_schema).default({}),
    types: z.record(z.string().min(1), type_definition_schema).optional(),
  })
  .strict()
  .superRefine(validateFieldDefinitionKeys);

/**
 * @param {{ fields?: Record<string, MetadataFieldConfig> }} repo_config
 * @param {import('zod').RefinementCtx} refinement_context
 */
function validateFieldDefinitionKeys(repo_config, refinement_context) {
  for (const field_name of Object.keys(repo_config.fields ?? {})) {
    if (!field_name.startsWith('$')) {
      continue;
    }

    refinement_context.addIssue({
      code: 'custom',
      message: 'Metadata field names must not start with "$".',
      path: ['fields', field_name],
    });
  }
}

/**
 * @param {string} field_name
 * @returns {boolean}
 */
export function isReservedStructuralFieldName(field_name) {
  return RESERVED_STRUCTURAL_FIELD_NAMES.has(field_name);
}
