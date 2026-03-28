export type DiscoveredFieldTypeName =
  | 'date'
  | 'date_time'
  | 'enum'
  | 'glob'
  | 'integer'
  | 'path'
  | 'string';

export type DiscoveredFieldMultiplicity = 'multiple' | 'single';

export interface FieldDiscoveryEvidenceReference {
  column: number;
  line: number;
  path: string;
  value: string;
}

export interface FieldDiscoveryClassUsage {
  classes: string[];
}

export interface FieldDiscoveryTypeSuggestion {
  confidence: number;
  name: DiscoveredFieldTypeName;
}

export interface FieldDiscoveryMultiplicitySuggestion {
  confidence: number;
  name: DiscoveredFieldMultiplicity;
}

export interface FieldDiscoverySuggestion {
  confidence: number;
  conflicting_evidence: FieldDiscoveryEvidenceReference[];
  evidence_references: FieldDiscoveryEvidenceReference[];
  likely_class_usage: FieldDiscoveryClassUsage;
  likely_multiplicity: FieldDiscoveryMultiplicitySuggestion;
  likely_type: FieldDiscoveryTypeSuggestion;
  name: string;
}

export interface FieldDiscoverySummary {
  claim_count: number;
  count: number;
  source_file_count: number;
}

export interface FieldDiscoveryResult {
  fields: FieldDiscoverySuggestion[];
  summary: FieldDiscoverySummary;
}
