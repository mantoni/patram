import type {
  ClassIdentityConfig,
  ClassSchemaConfig,
  MetadataFieldConfig,
  PathClassConfig,
} from './load-patram-config.types.ts';

export type ClassDefinition = import('./patram-config.js').ClassDefinition;
export type RelationDefinition =
  import('./patram-config.js').RelationDefinition;
export type MappingNodeDefinition =
  import('./patram-config.js').MappingNodeDefinition;
export type MappingEmitDefinition =
  import('./patram-config.js').MappingEmitDefinition;
export type MappingDefinition = import('./patram-config.js').MappingDefinition;
export type PatramGraphConfig = import('./patram-config.js').PatramGraphConfig;
export type PatramClassConfig = ClassDefinition & {
  identity?: ClassIdentityConfig;
  schema?: ClassSchemaConfig;
};

export type PatramConfig = Omit<PatramGraphConfig, 'classes'> & {
  classes: Record<string, PatramClassConfig>;
  fields?: Record<string, MetadataFieldConfig>;
  path_classes?: Record<string, PathClassConfig>;
};
