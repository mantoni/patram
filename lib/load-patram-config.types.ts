import type {
  ClassDefinition,
  MappingDefinition,
  RelationDefinition,
} from './patram-config.types.ts';

export interface StoredQueryConfig {
  where: string;
}

export type FieldValueTypeName =
  | 'string'
  | 'integer'
  | 'enum'
  | 'path'
  | 'glob'
  | 'date'
  | 'date_time';

export interface FieldDisplayConfig {
  hidden?: boolean;
  order?: number;
}

export interface FieldQueryConfig {
  contains?: boolean;
  prefix?: boolean;
}

export interface StringFieldConfig {
  display?: FieldDisplayConfig;
  multiple?: boolean;
  query?: FieldQueryConfig;
  type: 'string';
}

export interface IntegerFieldConfig {
  display?: FieldDisplayConfig;
  multiple?: boolean;
  type: 'integer';
}

export interface EnumFieldConfig {
  display?: FieldDisplayConfig;
  multiple?: boolean;
  type: 'enum';
  values: string[];
}

export interface PathFieldConfig {
  display?: FieldDisplayConfig;
  multiple?: boolean;
  path_class?: string;
  type: 'path';
}

export interface GlobFieldConfig {
  display?: FieldDisplayConfig;
  multiple?: boolean;
  type: 'glob';
}

export interface DateFieldConfig {
  display?: FieldDisplayConfig;
  multiple?: boolean;
  type: 'date';
}

export interface DateTimeFieldConfig {
  display?: FieldDisplayConfig;
  multiple?: boolean;
  type: 'date_time';
}

export type MetadataFieldConfig =
  | DateFieldConfig
  | DateTimeFieldConfig
  | EnumFieldConfig
  | GlobFieldConfig
  | IntegerFieldConfig
  | PathFieldConfig
  | StringFieldConfig;

export interface ClassFieldRuleConfig {
  presence: 'required' | 'optional' | 'forbidden';
}

export interface ClassSchemaConfig {
  document_path_class?: string;
  fields: Record<string, ClassFieldRuleConfig>;
  unknown_fields?: 'ignore' | 'error';
}

export interface PathClassConfig {
  prefixes: string[];
}

export type DerivedSummaryScalar = boolean | number | string | null;

export interface DerivedSummaryCountFieldConfig {
  count: {
    traversal: string;
    where: string;
  };
  name: string;
}

export interface DerivedSummarySelectCaseConfig {
  value: DerivedSummaryScalar;
  when: string;
}

export interface DerivedSummarySelectFieldConfig {
  default: DerivedSummaryScalar;
  name: string;
  select: DerivedSummarySelectCaseConfig[];
}

export type DerivedSummaryFieldConfig =
  | DerivedSummaryCountFieldConfig
  | DerivedSummarySelectFieldConfig;

export interface DerivedSummaryConfig {
  classes: string[];
  fields: DerivedSummaryFieldConfig[];
}

export interface PatramRepoConfig {
  class_schemas?: Record<string, ClassSchemaConfig>;
  classes?: Record<string, ClassDefinition>;
  derived_summaries?: Record<string, DerivedSummaryConfig>;
  fields?: Record<string, MetadataFieldConfig>;
  include: string[];
  mappings?: Record<string, MappingDefinition>;
  path_classes?: Record<string, PathClassConfig>;
  queries: Record<string, StoredQueryConfig>;
  relations?: Record<string, RelationDefinition>;
}

export interface PatramDiagnostic {
  code: string;
  column: number;
  level: 'error';
  line: number;
  message: string;
  path: string;
}

export interface LoadPatramConfigResult {
  config: PatramRepoConfig | null;
  config_path: string;
  diagnostics: PatramDiagnostic[];
}
