import type {
  KindDefinition,
  MappingDefinition,
  RelationDefinition,
} from './patram-config.types.ts';

export interface StoredQueryConfig {
  where: string;
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
  include: string[];
  kinds?: Record<string, KindDefinition>;
  mappings?: Record<string, MappingDefinition>;
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
