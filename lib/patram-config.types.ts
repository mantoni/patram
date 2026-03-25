import type {
  ClassSchemaConfig,
  MetadataFieldConfig,
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

export type PatramConfig = PatramGraphConfig & {
  class_schemas?: Record<string, ClassSchemaConfig>;
  fields?: Record<string, MetadataFieldConfig>;
};
