import type {
  PatramDiagnostic,
  PatramRepoConfig,
} from '../../config/load-patram-config.types.ts';
import type {
  ParsedAggregateTerm,
  ParsedExpression,
  ParsedTraversalTerm,
} from '../parse-where-clause.types.ts';

export interface CypherToken {
  column: number;
  index: number;
  kind: 'identifier' | 'number' | 'string' | 'symbol';
  value: string;
}

export interface CypherParserState {
  index: number;
  query_text: string;
  repo_config: PatramRepoConfig | null;
  root_variable_name: string | null;
  tokens: CypherToken[];
}

export interface CypherNodePattern {
  column: number;
  label_name: string | null;
  variable_name: string | null;
}

export interface CypherRelationPattern {
  column: number;
  direction: 'in' | 'out';
  relation_name: string;
}

export type CypherParseFailure = {
  diagnostic: PatramDiagnostic;
  success: false;
};

export type CypherAggregateResult =
  | { success: true; term: ParsedAggregateTerm }
  | CypherParseFailure;

export type CypherSubqueryShapeResult =
  | {
      success: true;
      related_node: CypherNodePattern;
      traversal: ParsedTraversalTerm;
    }
  | CypherParseFailure;

export type CypherExpressionResult =
  | { success: true; expression: ParsedExpression }
  | CypherParseFailure;
