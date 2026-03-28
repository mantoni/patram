export type StoredQueryConfig =
  import('./load-patram-config.js').StoredQueryConfig;
export type FieldDisplayConfig =
  import('./load-patram-config.js').FieldDisplayConfig;
export type FieldQueryConfig =
  import('./load-patram-config.js').FieldQueryConfig;
export type FieldValueTypeName =
  import('./load-patram-config.js').MetadataFieldConfig['type'];
export type MetadataFieldConfig =
  import('./load-patram-config.js').MetadataFieldConfig;
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
export type ClassFieldRuleConfig =
  import('./load-patram-config.js').ClassFieldRuleConfig;
export type DirectiveTypeConfig = MetadataFieldConfig;
export type MetadataDirectiveRuleConfig = ClassFieldRuleConfig;
export type ClassSchemaConfig =
  import('./load-patram-config.js').ClassSchemaConfig;
export type MetadataSchemaConfig = ClassSchemaConfig;
export type PathClassConfig = import('./load-patram-config.js').PathClassConfig;
export type DerivedSummaryScalar =
  import('./load-patram-config.js').DerivedSummaryScalar;
export type DerivedSummarySelectCaseConfig =
  import('./load-patram-config.js').DerivedSummarySelectCaseConfig;
export type DerivedSummaryFieldConfig =
  import('./load-patram-config.js').DerivedSummaryFieldConfig;
export type DerivedSummaryCountFieldConfig = Extract<
  DerivedSummaryFieldConfig,
  { count: unknown }
>;
export type DerivedSummarySelectFieldConfig = Extract<
  DerivedSummaryFieldConfig,
  { select: unknown }
>;
export type DerivedSummaryConfig =
  import('./load-patram-config.js').DerivedSummaryConfig;
export type PatramRepoConfig =
  import('./load-patram-config.js').PatramRepoConfig;
export type PatramDiagnostic =
  import('./load-patram-config.js').PatramDiagnostic;
export type LoadPatramConfigResult =
  import('./load-patram-config.js').LoadPatramConfigResult;
