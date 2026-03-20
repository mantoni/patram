export interface KindDefinition {
  builtin?: boolean;
  label?: string;
}

export interface RelationDefinition {
  builtin?: boolean;
  from: string[];
  to: string[];
}

export interface MappingNodeDefinition {
  field: string;
  kind: string;
}

export interface MappingEmitDefinition {
  relation: string;
  target: 'path';
  target_kind: string;
}

export interface MappingDefinition {
  emit?: MappingEmitDefinition;
  node?: MappingNodeDefinition;
}

export interface PatramConfig {
  $schema?: string;
  kinds: Record<string, KindDefinition>;
  mappings: Record<string, MappingDefinition>;
  relations: Record<string, RelationDefinition>;
}
