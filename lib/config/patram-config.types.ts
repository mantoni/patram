import type {
  MetadataFieldConfig,
  PatramRepoConfig,
  TypeDefinitionConfig,
} from './load-patram-config.types.ts';

export type PatramTypeConfig = TypeDefinitionConfig & {
  label?: string;
};

export type PatramConfig = PatramRepoConfig & {
  fields?: Record<string, MetadataFieldConfig>;
  types?: Record<string, PatramTypeConfig>;
};
