export {
  extractTaggedFencedBlocks,
  loadTaggedFencedBlocks,
  selectTaggedBlock,
  selectTaggedBlocks,
} from './tagged-fenced-blocks.js';

export { parseWhereClause } from './parse-where-clause.js';
export { getQuerySemanticDiagnostics } from './query-inspection.js';
export { loadProjectGraph } from './load-project-graph.js';
export { queryGraph } from './query-graph.js';

export type PatramGraphNode = import('./build-graph.types.ts').GraphNode;
export type PatramGraphEdge = import('./build-graph.types.ts').GraphEdge;
export type PatramBuildGraphResult =
  import('./build-graph.types.ts').BuildGraphResult;
export type PatramDiagnostic =
  import('./load-patram-config.types.ts').PatramDiagnostic;
export type PatramRepoConfig =
  import('./load-patram-config.types.ts').PatramRepoConfig;
export type PatramParsedFieldName =
  import('./parse-where-clause.types.ts').ParsedFieldName;
export type PatramParsedFieldTerm =
  import('./parse-where-clause.types.ts').ParsedFieldTerm;
export type PatramParsedFieldSetTerm =
  import('./parse-where-clause.types.ts').ParsedFieldSetTerm;
export type PatramParsedTraversalTerm =
  import('./parse-where-clause.types.ts').ParsedTraversalTerm;
export type PatramParsedRelationTerm =
  import('./parse-where-clause.types.ts').ParsedRelationTerm;
export type PatramParsedRelationTargetTerm =
  import('./parse-where-clause.types.ts').ParsedRelationTargetTerm;
export type PatramParsedAggregateComparison =
  import('./parse-where-clause.types.ts').ParsedAggregateComparison;
export type PatramParsedAggregateName =
  import('./parse-where-clause.types.ts').ParsedAggregateName;
export type PatramParsedAggregateTerm =
  import('./parse-where-clause.types.ts').ParsedAggregateTerm;
export type PatramParsedTermExpression =
  import('./parse-where-clause.types.ts').ParsedTermExpression;
export type PatramParsedNotExpression =
  import('./parse-where-clause.types.ts').ParsedNotExpression;
export type PatramParsedBooleanExpression =
  import('./parse-where-clause.types.ts').ParsedBooleanExpression;
export type PatramParsedTerm =
  import('./parse-where-clause.types.ts').ParsedTerm;
export type PatramParsedExpression =
  import('./parse-where-clause.types.ts').ParsedExpression;
export type PatramParseWhereClauseResult =
  import('./parse-where-clause.types.ts').ParseWhereClauseResult;
export type PatramQuerySource =
  | {
      kind: 'ad_hoc';
    }
  | {
      kind: 'stored_query';
      name: string;
    };

export interface PatramProjectGraphResult {
  claims: import('./parse-claims.types.ts').PatramClaim[];
  config: import('./load-patram-config.types.ts').PatramRepoConfig;
  diagnostics: PatramDiagnostic[];
  graph: PatramBuildGraphResult;
  source_file_paths: string[];
}

export interface PatramQueryResult {
  diagnostics: PatramDiagnostic[];
  nodes: PatramGraphNode[];
  total_count: number;
}
