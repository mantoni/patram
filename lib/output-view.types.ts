import type { GraphNode } from './build-graph.types.ts';

export interface OutputViewSummary {
  count: number;
  kind: 'resolved_link_list' | 'result_list' | 'stored_query_list';
}

export interface QueryOutputViewSummary extends OutputViewSummary {
  kind: 'result_list';
  limit: number;
  offset: number;
  total_count: number;
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

export interface OutputResolvedLinkTarget {
  kind?: string;
  path: string;
  status?: string;
  title: string;
}

export interface OutputResolvedLinkItem {
  kind: 'resolved_link';
  label: string;
  reference: number;
  target: OutputResolvedLinkTarget;
}

export interface QueryOutputView {
  command: 'query';
  hints: string[];
  items: OutputNodeItem[];
  summary: QueryOutputViewSummary;
}

export interface QueriesOutputView {
  command: 'queries';
  hints: string[];
  items: OutputStoredQueryItem[];
  summary: OutputViewSummary;
}

export interface ShowOutputView {
  command: 'show';
  hints: string[];
  items: OutputResolvedLinkItem[];
  rendered_source: string;
  source: string;
  summary: OutputViewSummary;
}

export type OutputView = QueryOutputView | QueriesOutputView | ShowOutputView;

export interface ResolvedOutputMode {
  color_enabled: boolean;
  renderer_name: 'json' | 'plain' | 'rich';
}
