import type {
  KindDefinition,
  MappingDefinition,
  RelationDefinition,
} from './patram-config.types.ts';

export interface StoredQueryConfig {
  where: string;
}

export type DirectiveValueTypeName =
  | 'string'
  | 'integer'
  | 'enum'
  | 'path'
  | 'glob'
  | 'date'
  | 'date_time';

export interface StringDirectiveTypeConfig {
  path_class?: string;
  type: 'string';
}

export interface IntegerDirectiveTypeConfig {
  path_class?: string;
  type: 'integer';
}

export interface EnumDirectiveTypeConfig {
  path_class?: string;
  type: 'enum';
  values: string[];
}

export interface PathDirectiveTypeConfig {
  path_class?: string;
  type: 'path';
}

export interface GlobDirectiveTypeConfig {
  path_class?: string;
  type: 'glob';
}

export interface DateDirectiveTypeConfig {
  path_class?: string;
  type: 'date';
}

export interface DateTimeDirectiveTypeConfig {
  path_class?: string;
  type: 'date_time';
}

export type DirectiveTypeConfig =
  | StringDirectiveTypeConfig
  | IntegerDirectiveTypeConfig
  | EnumDirectiveTypeConfig
  | PathDirectiveTypeConfig
  | GlobDirectiveTypeConfig
  | DateDirectiveTypeConfig
  | DateTimeDirectiveTypeConfig;

export interface PathClassConfig {
  prefixes: string[];
}

export interface MetadataDirectiveRuleConfig {
  multiple?: boolean;
  presence: 'required' | 'optional' | 'forbidden';
  type?: DirectiveTypeConfig;
}

export interface MetadataSchemaConfig {
  directives: Record<string, MetadataDirectiveRuleConfig>;
  document_path_class?: string;
  unknown_directives?: 'ignore' | 'error';
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
  fields: DerivedSummaryFieldConfig[];
  kinds: string[];
}

export interface PatramRepoConfig {
  derived_summaries?: Record<string, DerivedSummaryConfig>;
  directive_types?: Record<string, DirectiveTypeConfig>;
  include: string[];
  kinds?: Record<string, KindDefinition>;
  mappings?: Record<string, MappingDefinition>;
  metadata_schemas?: Record<string, MetadataSchemaConfig>;
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
