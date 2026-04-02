export type StoredQueryConfig = import('./schema.js').StoredQueryConfig;
export type FieldDisplayConfig = import('./schema.js').FieldDisplayConfig;
export type FieldQueryConfig = import('./schema.js').FieldQueryConfig;
export type FieldValueTypeName =
  import('./schema.js').MetadataFieldConfig['type'];
export type MetadataFieldConfig = import('./schema.js').MetadataFieldConfig;
export type StringFieldConfig = Extract<
  MetadataFieldConfig,
  { type: 'string' }
>;
export type IntegerFieldConfig = Extract<
  MetadataFieldConfig,
  { type: 'integer' }
>;
export type EnumFieldConfig = Extract<MetadataFieldConfig, { type: 'enum' }>;
export type PathFieldConfig = Extract<MetadataFieldConfig, { type: 'path' }>;
export type GlobFieldConfig = Extract<MetadataFieldConfig, { type: 'glob' }>;
export type DateFieldConfig = Extract<MetadataFieldConfig, { type: 'date' }>;
export type DateTimeFieldConfig = Extract<
  MetadataFieldConfig,
  { type: 'date_time' }
>;
export type ClassFieldRuleConfig = import('./schema.js').ClassFieldRuleConfig;
export type DirectiveTypeConfig = MetadataFieldConfig;
export type MetadataDirectiveRuleConfig = ClassFieldRuleConfig;
export type ClassSchemaConfig = import('./schema.js').ClassSchemaConfig;
export type ClassIdentityConfig = import('./schema.js').ClassIdentityConfig;
export type MetadataSchemaConfig = ClassSchemaConfig;
export type PathClassConfig = import('./schema.js').PathClassConfig;
export type PatramRepoConfig = import('./schema.js').PatramRepoConfig;
export type PatramDiagnostic =
  import('./load-patram-config.js').PatramDiagnostic;
export type LoadPatramConfigResult =
  import('./load-patram-config.js').LoadPatramConfigResult;
