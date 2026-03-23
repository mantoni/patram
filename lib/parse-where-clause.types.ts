import type { PatramDiagnostic } from './load-patram-config.types.ts';

export type ParsedFieldName = 'id' | 'kind' | 'path' | 'status' | 'title';

export interface ParsedFieldTerm {
  field_name: ParsedFieldName;
  kind: 'field';
  operator: '=' | '^=' | '~';
  value: string;
}

export interface ParsedFieldSetTerm {
  field_name: ParsedFieldName;
  kind: 'field_set';
  operator: 'in' | 'not in';
  values: string[];
}

export interface ParsedTraversalTerm {
  direction: 'in' | 'out';
  relation_name: string;
}

export interface ParsedRelationTerm {
  kind: 'relation';
  relation_name: string;
}

export interface ParsedRelationTargetTerm {
  kind: 'relation_target';
  relation_name: string;
  target_id: string;
}

export type ParsedAggregateComparison = '!=' | '<' | '<=' | '=' | '>' | '>=';
export type ParsedAggregateName = 'any' | 'count' | 'none';

export interface ParsedAggregateTerm {
  aggregate_name: ParsedAggregateName;
  clauses: ParsedClause[];
  comparison?: ParsedAggregateComparison;
  kind: 'aggregate';
  traversal: ParsedTraversalTerm;
  value?: number;
}

export type ParsedTerm =
  | ParsedAggregateTerm
  | ParsedFieldSetTerm
  | ParsedFieldTerm
  | ParsedRelationTargetTerm
  | ParsedRelationTerm;

export interface ParsedClause {
  is_negated: boolean;
  term: ParsedTerm;
}

export type ParseWhereClauseResult =
  | {
      clauses: ParsedClause[];
      success: true;
    }
  | {
      diagnostic: PatramDiagnostic;
      success: false;
    };
