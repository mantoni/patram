import type { GraphNode } from './build-graph.types.ts';

export interface OutputViewSummary {
  count: number;
  kind: 'result_list' | 'stored_query_list';
}

export interface OutputNodeItem {
  id: string;
  kind: 'node';
  node_kind: GraphNode['kind'];
  path: string;
  status?: string;
  title: string;
}

export interface OutputStoredQueryItem {
  kind: 'stored_query';
  name: string;
  where: string;
}

export type OutputViewItem = OutputNodeItem | OutputStoredQueryItem;

export interface OutputView {
  command: 'query' | 'queries' | 'show';
  hints: string[];
  items: OutputViewItem[];
  summary: OutputViewSummary;
}

export interface ResolvedOutputMode {
  color_enabled: boolean;
  renderer_name: 'json' | 'plain' | 'rich';
}
