import type { PatramDiagnostic } from '../config/load-patram-config.types.ts';

export type ParsedFieldName = string;

export interface ParsedFieldTerm {
  column: number;
  field_name: ParsedFieldName;
  kind: 'field';
  operator: '!=' | '*=' | '<' | '<=' | '=' | '>' | '>=' | '^=' | '~';
  value: string;
}

export interface ParsedFieldSetTerm {
  column: number;
  field_name: ParsedFieldName;
  kind: 'field_set';
  operator: 'in' | 'not in';
  values: string[];
}

export interface ParsedTraversalTerm {
  column: number;
  direction: 'in' | 'out';
  relation_name: string;
}

export interface ParsedRelationTerm {
  column: number;
  kind: 'relation';
  relation_name: string;
}

export interface ParsedRelationTargetTerm {
  column: number;
  kind: 'relation_target';
  relation_name: string;
  target_id: string;
}

export type ParsedAggregateComparison = '!=' | '<' | '<=' | '=' | '>' | '>=';
export type ParsedAggregateName = 'any' | 'count' | 'none';

export interface ParsedAggregateTerm {
  aggregate_name: ParsedAggregateName;
  comparison?: ParsedAggregateComparison;
  expression: ParsedExpression;
  kind: 'aggregate';
  traversal: ParsedTraversalTerm;
  value?: number;
}

export interface ParsedTermExpression {
  kind: 'term';
  term: ParsedTerm;
}

export interface ParsedNotExpression {
  expression: ParsedExpression;
  kind: 'not';
}

export interface ParsedBooleanExpression {
  expressions: ParsedExpression[];
  kind: 'and' | 'or';
}

export type ParsedTerm =
  | ParsedAggregateTerm
  | ParsedFieldSetTerm
  | ParsedFieldTerm
  | ParsedRelationTargetTerm
  | ParsedRelationTerm;

export type ParsedExpression =
  | ParsedBooleanExpression
  | ParsedNotExpression
  | ParsedTermExpression;

export type ParseWhereClauseResult =
  | {
      expression: ParsedExpression;
      success: true;
    }
  | {
      diagnostic: PatramDiagnostic;
      success: false;
    };
