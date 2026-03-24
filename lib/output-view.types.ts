import type { GraphNode } from './build-graph.types.ts';

export type OutputDerivedValue = boolean | number | string | null;

export interface OutputDerivedField {
  name: string;
  value: OutputDerivedValue;
}

export interface OutputDerivedSummary {
  fields: OutputDerivedField[];
  name: string;
}

export interface OutputMetadataField {
  name: string;
  value: string | string[];
}

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
  derived_summary?: OutputDerivedSummary;
  fields: Record<string, string | string[]>;
  id: string;
  kind: 'node';
  node_kind: string;
  path?: string;
  title: string;
  visible_fields: OutputMetadataField[];
}

export interface OutputStoredQueryItem {
  kind: 'stored_query';
  name: string;
  where: string;
}

export interface OutputResolvedLinkTarget {
  derived_summary?: OutputDerivedSummary;
  fields: Record<string, string | string[]>;
  id: string;
  kind: string;
  path?: string;
  title: string;
  visible_fields: OutputMetadataField[];
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
  document?: OutputNodeItem;
  hints: string[];
  items: OutputResolvedLinkItem[];
  path: string;
  rendered_source: string;
  source: string;
  summary: OutputViewSummary;
}

export type OutputView = QueryOutputView | QueriesOutputView | ShowOutputView;

export interface ResolvedOutputMode {
  color_enabled: boolean;
  renderer_name: 'json' | 'plain' | 'rich';
}
