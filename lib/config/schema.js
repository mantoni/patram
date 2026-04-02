import { z } from 'zod';

import {
  class_definition_schema,
  mapping_definition_schema,
  relation_definition_schema,
} from './patram-config.js';
import { DEFAULT_INCLUDE_PATTERNS } from './source-file-defaults.js';

export const CONFIG_FILE_NAME = '.patram.json';

const RESERVED_STRUCTURAL_FIELD_NAMES = new Set(['$class', '$id', '$path']);
const MARKDOWN_STYLE_NAMES = [
  'front_matter',
  'visible_line',
  'list_item',
  'hidden_tag',
];
const MARKDOWN_STYLE_NAME_SET = new Set(MARKDOWN_STYLE_NAMES);
const MIXED_STYLE_VALUES = new Set(['ignore', 'error']);

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

/**
 * @typedef {z.output<typeof field_display_schema>} FieldDisplayConfig
 */
const field_display_schema = z
  .object({
    hidden: z.boolean().optional(),
    order: z.number().optional(),
  })
  .strict();

/**
 * @typedef {z.output<typeof field_query_schema>} FieldQueryConfig
 */
const field_query_schema = z
  .object({
    contains: z.boolean().optional(),
    prefix: z.boolean().optional(),
  })
  .strict();

const field_base_shape = {
  display: field_display_schema.optional(),
  multiple: z.boolean().optional(),
  path_class: z.string().min(1).optional(),
};

/**
 * @typedef {z.output<typeof metadata_field_schema>} MetadataFieldConfig
 */
const metadata_field_schema = z.discriminatedUnion('type', [
  z
    .object({
      ...field_base_shape,
      query: field_query_schema.optional(),
      type: z.literal('string'),
    })
    .strict(),
  z
    .object({
      ...field_base_shape,
      type: z.literal('integer'),
    })
    .strict(),
  z
    .object({
      ...field_base_shape,
      type: z.literal('enum'),
      values: z
        .array(z.string().min(1, 'Field enum values must not be empty.'))
        .min(1, 'Field enum values must contain at least one value.'),
    })
    .strict(),
  z
    .object({
      ...field_base_shape,
      type: z.literal('path'),
    })
    .strict(),
  z
    .object({
      ...field_base_shape,
      type: z.literal('glob'),
    })
    .strict(),
  z
    .object({
      ...field_base_shape,
      type: z.literal('date'),
    })
    .strict(),
  z
    .object({
      ...field_base_shape,
      type: z.literal('date_time'),
    })
    .strict(),
]);

/**
 * @typedef {z.output<typeof class_field_rule_schema>} ClassFieldRuleConfig
 */
const class_field_rule_schema = z
  .object({
    markdown_styles: z.array(z.string().min(1)).optional(),
    presence: z.enum(['required', 'optional', 'forbidden']),
  })
  .strict();

/**
 * @typedef {z.output<typeof class_schema_schema>} ClassSchemaConfig
 */
const class_schema_schema = z
  .object({
    document_path_class: z.string().min(1).optional(),
    fields: z.record(z.string().min(1), class_field_rule_schema).default({}),
    markdown_styles: z.array(z.string().min(1)).optional(),
    mixed_styles: z.string().min(1).optional(),
    unknown_fields: z.enum(['ignore', 'error']).optional(),
  })
  .strict();

const repo_class_definition_schema = class_definition_schema.extend({
  schema: class_schema_schema.optional(),
});

/**
 * @typedef {z.output<typeof path_class_schema>} PathClassConfig
 */
const path_class_schema = z
  .object({
    prefixes: z
      .array(z.string().min(1, 'Path class prefixes must not be empty.'))
      .min(1, 'Path classes must contain at least one prefix.'),
  })
  .strict();

/**
 * @typedef {z.output<typeof patram_repo_config_schema>} PatramRepoConfig
 */
export const patram_repo_config_schema = z
  .object({
    classes: z
      .record(z.string().min(1), repo_class_definition_schema)
      .optional(),
    fields: z.record(z.string().min(1), metadata_field_schema).optional(),
    include: z
      .array(z.string().min(1, 'Include globs must not be empty.'))
      .min(1, 'Include must contain at least one glob.')
      .default(DEFAULT_INCLUDE_PATTERNS),
    mappings: z.record(z.string().min(1), mapping_definition_schema).optional(),
    path_classes: z.record(z.string().min(1), path_class_schema).optional(),
    queries: z.record(z.string().min(1), stored_query_schema).default({}),
    relations: z
      .record(z.string().min(1), relation_definition_schema)
      .optional(),
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

/**
 * @param {string} markdown_style
 * @returns {boolean}
 */
export function isKnownMarkdownStyle(markdown_style) {
  return MARKDOWN_STYLE_NAME_SET.has(markdown_style);
}

/**
 * @param {string} mixed_styles
 * @returns {boolean}
 */
export function isMixedStyleValue(mixed_styles) {
  return MIXED_STYLE_VALUES.has(mixed_styles);
}
