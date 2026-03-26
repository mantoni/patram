export {
  extractTaggedFencedBlocks,
  loadTaggedFencedBlocks,
  selectTaggedBlock,
  selectTaggedBlocks,
} from './tagged-fenced-blocks.js';

export { loadProjectGraph } from './load-project-graph.js';
export { queryGraph } from './query-graph.js';

export type PatramGraphNode = import('./build-graph.types.ts').GraphNode;
export type PatramGraphEdge = import('./build-graph.types.ts').GraphEdge;
export type PatramBuildGraphResult =
  import('./build-graph.types.ts').BuildGraphResult;
export type PatramDiagnostic =
  import('./load-patram-config.types.ts').PatramDiagnostic;

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
