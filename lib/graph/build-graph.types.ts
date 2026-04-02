import type { ClaimOrigin } from '../parse/parse-claims.types.ts';

export interface GraphNodeIdentity {
  class_name: string;
  id: string;
  path?: string;
}

export interface GraphNode {
  identity: GraphNodeIdentity;
  key?: string;
  metadata: Record<string, string | string[] | undefined>;
}

export interface GraphEdge {
  from: string;
  id: string;
  origin: ClaimOrigin;
  relation: string;
  to: string;
}

export interface BuildGraphResult {
  document_path_ids?: Record<string, string>;
  edges: GraphEdge[];
  nodes: Record<string, GraphNode>;
}
