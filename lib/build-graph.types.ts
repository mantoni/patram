import type { ClaimOrigin } from './parse-claims.types.ts';

export interface GraphNode {
  $class?: string;
  $id?: string;
  $path?: string;
  id: string;
  kind?: string;
  key?: string;
  path?: string;
  title?: string;
  [field: string]: string | string[] | undefined;
}

export interface GraphEdge {
  from: string;
  id: string;
  origin: ClaimOrigin;
  relation: string;
  to: string;
}

export interface BuildGraphResult {
  edges: GraphEdge[];
  nodes: Record<string, GraphNode>;
}
