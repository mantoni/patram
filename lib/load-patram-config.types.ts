import type {
  KindDefinition,
  MappingDefinition,
  RelationDefinition,
} from './patram-config.types.ts';

export interface StoredQueryConfig {
  where: string;
}

export interface PatramRepoConfig {
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
