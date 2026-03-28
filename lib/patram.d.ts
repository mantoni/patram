export {
  extractTaggedFencedBlocks,
  loadTaggedFencedBlocks,
  selectTaggedBlock,
  selectTaggedBlocks,
} from './tagged-fenced-blocks.js';

export { parseWhereClause } from './graph/query/parse.js';
export { getQuerySemanticDiagnostics } from './graph/query/inspect.js';
export { loadProjectGraph } from './load-project-graph.js';
export { overlayGraph } from './overlay-graph.js';
export { queryGraph } from './query-graph.js';

export type PatramGraphNode =
  import('./graph/build-graph.types.d.ts').GraphNode;
export type PatramGraphEdge =
  import('./graph/build-graph.types.d.ts').GraphEdge;
export type PatramBuildGraphResult =
  import('./graph/build-graph.types.d.ts').BuildGraphResult;
export type PatramDiagnostic =
  import('./config/load-patram-config.types.d.ts').PatramDiagnostic;
export type PatramRepoConfig =
  import('./config/load-patram-config.types.d.ts').PatramRepoConfig;
export type PatramParsedFieldName =
  import('./graph/parse-where-clause.types.d.ts').ParsedFieldName;
export type PatramParsedFieldTerm =
  import('./graph/parse-where-clause.types.d.ts').ParsedFieldTerm;
export type PatramParsedFieldSetTerm =
  import('./graph/parse-where-clause.types.d.ts').ParsedFieldSetTerm;
export type PatramParsedTraversalTerm =
  import('./graph/parse-where-clause.types.d.ts').ParsedTraversalTerm;
export type PatramParsedRelationTerm =
  import('./graph/parse-where-clause.types.d.ts').ParsedRelationTerm;
export type PatramParsedRelationTargetTerm =
  import('./graph/parse-where-clause.types.d.ts').ParsedRelationTargetTerm;
export type PatramParsedAggregateComparison =
  import('./graph/parse-where-clause.types.d.ts').ParsedAggregateComparison;
export type PatramParsedAggregateName =
  import('./graph/parse-where-clause.types.d.ts').ParsedAggregateName;
export type PatramParsedAggregateTerm =
  import('./graph/parse-where-clause.types.d.ts').ParsedAggregateTerm;
export type PatramParsedTermExpression =
  import('./graph/parse-where-clause.types.d.ts').ParsedTermExpression;
export type PatramParsedNotExpression =
  import('./graph/parse-where-clause.types.d.ts').ParsedNotExpression;
export type PatramParsedBooleanExpression =
  import('./graph/parse-where-clause.types.d.ts').ParsedBooleanExpression;
export type PatramParsedTerm =
  import('./graph/parse-where-clause.types.d.ts').ParsedTerm;
export type PatramParsedExpression =
  import('./graph/parse-where-clause.types.d.ts').ParsedExpression;
export type PatramParseWhereClauseResult =
  import('./graph/parse-where-clause.types.d.ts').ParseWhereClauseResult;
export type PatramQuerySource =
  | {
      kind: 'ad_hoc';
    }
  | {
      kind: 'stored_query';
      name: string;
    };

export interface PatramProjectGraphResult {
  claims: import('./parse/parse-claims.types.d.ts').PatramClaim[];
  config: import('./config/load-patram-config.types.d.ts').PatramRepoConfig;
  diagnostics: PatramDiagnostic[];
  graph: PatramBuildGraphResult;
  source_file_paths: string[];
}

export interface PatramQueryResult {
  diagnostics: PatramDiagnostic[];
  nodes: PatramGraphNode[];
  total_count: number;
}
