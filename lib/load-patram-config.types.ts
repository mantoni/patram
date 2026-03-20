export interface StoredQueryConfig {
  where: string;
}

export interface PatramRepoConfig {
  include: string[];
  queries: Record<string, StoredQueryConfig>;
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
