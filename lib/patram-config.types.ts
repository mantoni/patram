export interface ClassDefinition {
  builtin?: boolean;
  label?: string;
}

export interface RelationDefinition {
  builtin?: boolean;
  from: string[];
  to: string[];
}

export interface MappingNodeDefinition {
  class: string;
  field: string;
  key?: 'path' | 'value';
}

export interface MappingEmitDefinition {
  relation: string;
  target: 'path' | 'value';
  target_class: string;
}

export interface MappingDefinition {
  emit?: MappingEmitDefinition;
  node?: MappingNodeDefinition;
}

export interface PatramConfig {
  $schema?: string;
  classes: Record<string, ClassDefinition>;
  class_schemas?: Record<string, ClassSchemaConfig>;
  fields?: Record<string, MetadataFieldConfig>;
  mappings: Record<string, MappingDefinition>;
  relations: Record<string, RelationDefinition>;
}
import type {
  ClassSchemaConfig,
  MetadataFieldConfig,
} from './load-patram-config.types.ts';
