/**
 * @import { BuildGraphResult, GraphNode } from '../../graph/build-graph.types.ts';
 * @import { PatramRepoConfig } from '../../config/load-patram-config.types.ts';
 * @import { OutputMetadataField, OutputNodeItem, OutputResolvedLinkItem, OutputResolvedLinkTarget, OutputStoredQueryItem, OutputView, RefsOutputView, ShowOutputView } from '../output-view.types.ts';
 */
/* eslint-disable max-lines */

import { resolveDocumentNodeId } from '../../graph/build-graph-identity.js';
import {
  getGraphNodeClassName,
  getGraphNodeId,
  getGraphNodeMetadataValue,
  getGraphNodePath,
} from '../../graph/graph-node.js';

/**
 * Create a shared output view from one command result.
 *
 * @param {'query' | 'queries'} command_name
 * @param {GraphNode[] | { name: string, where: string, description?: string }[]} command_items
 * @param {{ hints?: string[], limit?: number, offset?: number, repo_config?: PatramRepoConfig, total_count?: number }=} command_options
 * @returns {OutputView}
 */
export function createOutputView(command_name, command_items, command_options) {
  if (command_name === 'query') {
    return createQueryOutputView(
      /** @type {GraphNode[]} */ (command_items),
      command_options,
    );
  }

  if (command_name === 'queries') {
    return createStoredQueriesOutputView(
      /** @type {OutputStoredQueryItem[]} */ (command_items),
    );
  }

  throw new Error('Unsupported output view command.');
}

/**
 * Create a shared output view for the show command.
 *
 * @param {{ incoming_summary: Record<string, number>, path: string, rendered_source: string, resolved_links: Array<{ label: string, reference: number, target: { kind?: string, path: string, status?: string, title: string } }>, source: string }} show_output
 * @param {{ document_path_ids?: BuildGraphResult['document_path_ids'], graph_nodes?: BuildGraphResult['nodes'], repo_config?: PatramRepoConfig }=} command_options
 * @returns {ShowOutputView}
 */
export function createShowOutputView(show_output, command_options = {}) {
  return {
    command: 'show',
    hints: [],
    incoming_summary: show_output.incoming_summary,
    items: show_output.resolved_links.map((resolved_link) =>
      createResolvedLinkOutputItem(resolved_link, command_options),
    ),
    path: show_output.path,
    rendered_source: show_output.rendered_source,
    source: show_output.source,
    summary: {
      count: show_output.resolved_links.length,
      kind: 'resolved_link_list',
    },
  };
}

/**
 * Create a shared output view for the refs command.
 *
 * @param {{ incoming: Record<string, GraphNode[]>, node: GraphNode }} refs_output
 * @param {{ repo_config?: PatramRepoConfig }=} command_options
 * @returns {RefsOutputView}
 */
export function createRefsOutputView(refs_output, command_options = {}) {
  /** @type {Record<string, OutputNodeItem[]>} */
  const incoming = {};

  for (const relation_name of Object.keys(refs_output.incoming)) {
    incoming[relation_name] = refs_output.incoming[relation_name].map(
      (graph_node) =>
        createOutputNodeItem(
          graph_node,
          command_options.repo_config?.fields ?? {},
        ),
    );
  }

  return {
    command: 'refs',
    hints: [],
    incoming,
    node: createOutputNodeItem(
      refs_output.node,
      command_options.repo_config?.fields ?? {},
    ),
    summary: {
      count: countIncomingReferenceItems(incoming),
      kind: 'incoming_reference_list',
    },
  };
}

/**
 * @param {GraphNode[]} graph_nodes
 * @param {{ hints?: string[], limit?: number, offset?: number, repo_config?: PatramRepoConfig, total_count?: number }=} command_options
 * @returns {OutputView}
 */
function createQueryOutputView(graph_nodes, command_options = {}) {
  const total_count = command_options.total_count ?? graph_nodes.length;

  return {
    command: 'query',
    hints:
      command_options.hints ??
      (total_count === 0
        ? ['Try: patram query --cypher "MATCH (n:Task) RETURN n"']
        : []),
    items: graph_nodes.map((graph_node) =>
      createOutputNodeItem(
        graph_node,
        command_options.repo_config?.fields ?? {},
      ),
    ),
    summary: {
      count: graph_nodes.length,
      kind: 'result_list',
      limit: command_options.limit ?? graph_nodes.length,
      offset: command_options.offset ?? 0,
      total_count,
    },
  };
}

/**
 * @param {{ name: string, where: string, description?: string }[]} stored_queries
 * @returns {OutputView}
 */
function createStoredQueriesOutputView(stored_queries) {
  return {
    command: 'queries',
    hints:
      stored_queries.length === 0 ? [] : ['Hint: patram help query-language'],
    items: stored_queries.map((stored_query) => ({
      kind: 'stored_query',
      name: stored_query.name,
      where: stored_query.where,
      description: stored_query.description,
    })),
    summary: {
      count: stored_queries.length,
      kind: 'stored_query_list',
    },
  };
}

/**
 * @param {Record<string, OutputNodeItem[]>} incoming
 * @returns {number}
 */
function countIncomingReferenceItems(incoming) {
  let count = 0;

  for (const output_items of Object.values(incoming)) {
    count += output_items.length;
  }

  return count;
}

/**
 * @param {GraphNode} graph_node
 * @param {NonNullable<PatramRepoConfig['fields']>} field_definitions
 * @returns {OutputNodeItem}
 */
function createOutputNodeItem(graph_node, field_definitions) {
  const description = getScalarGraphNodeField(
    getGraphNodeMetadataValue(graph_node, 'description'),
  );
  const title = getOutputNodeTitle(graph_node);
  const path = getOutputNodePath(graph_node);
  const node_class = getOutputNodeClass(graph_node);
  const fields = collectOutputFields(graph_node, field_definitions);
  const visible_fields = createVisibleOutputFields(fields, field_definitions);

  if (!title || !node_class) {
    throw new Error(
      `Expected graph node "${getOutputNodeId(graph_node)}" to have a title and path.`,
    );
  }

  /** @type {OutputNodeItem} */
  const output_item = {
    fields,
    id: getOutputNodeId(graph_node),
    kind: 'node',
    node_kind: node_class,
    path,
    title,
    visible_fields,
  };

  if (description) {
    output_item.description = description;
  }

  return output_item;
}

/**
 * @param {{ kind?: string, path: string, status?: string, title: string }} target
 * @param {NonNullable<PatramRepoConfig['fields']>} field_definitions
 * @param {GraphNode | undefined} graph_node
 * @returns {OutputResolvedLinkTarget}
 */
function createResolvedLinkTarget(target, field_definitions, graph_node) {
  const description = getScalarGraphNodeField(
    graph_node
      ? getGraphNodeMetadataValue(graph_node, 'description')
      : undefined,
  );
  const fields = collectResolvedLinkFields(
    target,
    field_definitions,
    graph_node,
  );

  return {
    description,
    fields,
    id: graph_node ? getOutputNodeId(graph_node) : `doc:${target.path}`,
    kind: resolveResolvedLinkKind(target, graph_node),
    path: resolveResolvedLinkPath(target, graph_node),
    title: resolveResolvedLinkTitle(target, graph_node),
    visible_fields: createVisibleOutputFields(fields, field_definitions),
  };
}

/**
 * @param {{ kind?: string, path: string, status?: string, title: string }} target
 * @param {NonNullable<PatramRepoConfig['fields']>} field_definitions
 * @param {GraphNode | undefined} graph_node
 * @returns {Record<string, string | string[]>}
 */
function collectResolvedLinkFields(target, field_definitions, graph_node) {
  if (graph_node) {
    return collectOutputFields(graph_node, field_definitions);
  }

  /** @type {Record<string, string | string[]>} */
  const fields = {};

  if (target.status) {
    fields.status = target.status;
  }

  return fields;
}

/**
 * @param {{ kind?: string, path: string, status?: string, title: string }} target
 * @param {GraphNode | undefined} graph_node
 * @returns {string}
 */
function resolveResolvedLinkKind(target, graph_node) {
  return getOutputNodeClass(graph_node) ?? target.kind ?? 'document';
}

/**
 * @param {{ kind?: string, path: string, status?: string, title: string }} target
 * @param {GraphNode | undefined} graph_node
 * @returns {string}
 */
function resolveResolvedLinkPath(target, graph_node) {
  return getOutputNodePath(graph_node) ?? target.path;
}

/**
 * @param {{ kind?: string, path: string, status?: string, title: string }} target
 * @param {GraphNode | undefined} graph_node
 * @returns {string}
 */
function resolveResolvedLinkTitle(target, graph_node) {
  return getOutputNodeTitle(graph_node) ?? target.title;
}

/**
 * @param {string | string[] | undefined} field_value
 * @returns {string | undefined}
 */
function getScalarGraphNodeField(field_value) {
  if (Array.isArray(field_value)) {
    return field_value[0];
  }

  return field_value;
}

/**
 * @param {GraphNode | undefined} graph_node
 * @returns {string | undefined}
 */
function getOutputNodeTitle(graph_node) {
  if (!graph_node) {
    return undefined;
  }

  return (
    getScalarGraphNodeField(getGraphNodeMetadataValue(graph_node, 'title')) ??
    getOutputNodePath(graph_node) ??
    getScalarGraphNodeField(graph_node.key)
  );
}

/**
 * @param {GraphNode | undefined} graph_node
 * @returns {string | undefined}
 */
function getOutputNodePath(graph_node) {
  if (!graph_node) {
    return undefined;
  }

  return getScalarGraphNodeField(getGraphNodePath(graph_node));
}

/**
 * @param {GraphNode | undefined} graph_node
 * @returns {string | undefined}
 */
function getOutputNodeClass(graph_node) {
  if (!graph_node) {
    return undefined;
  }

  return getScalarGraphNodeField(getGraphNodeClassName(graph_node));
}

/**
 * @param {GraphNode} graph_node
 * @returns {string}
 */
function getOutputNodeId(graph_node) {
  return getGraphNodeId(graph_node);
}

/**
 * @param {{ label: string, reference: number, target: { kind?: string, path: string, status?: string, title: string } }} resolved_link
 * @param {{ document_path_ids?: BuildGraphResult['document_path_ids'], graph_nodes?: BuildGraphResult['nodes'], repo_config?: PatramRepoConfig }} command_options
 * @returns {OutputResolvedLinkItem}
 */
function createResolvedLinkOutputItem(resolved_link, command_options) {
  const target_graph_node = resolveDocumentGraphNode(
    command_options.graph_nodes,
    command_options.document_path_ids,
    resolved_link.target.path,
  );

  return {
    kind: 'resolved_link',
    label: resolved_link.label,
    reference: resolved_link.reference,
    target: createResolvedLinkTarget(
      resolved_link.target,
      command_options.repo_config?.fields ?? {},
      target_graph_node,
    ),
  };
}

/**
 * @param {BuildGraphResult['nodes'] | undefined} graph_nodes
 * @param {BuildGraphResult['document_path_ids'] | undefined} document_path_ids
 * @param {string} document_path
 * @returns {GraphNode | undefined}
 */
function resolveDocumentGraphNode(
  graph_nodes,
  document_path_ids,
  document_path,
) {
  if (!graph_nodes) {
    return undefined;
  }

  return graph_nodes[resolveDocumentNodeId(document_path_ids, document_path)];
}

/**
 * @param {GraphNode} graph_node
 * @param {NonNullable<PatramRepoConfig['fields']>} field_definitions
 * @returns {Record<string, string | string[]>}
 */
function collectOutputFields(graph_node, field_definitions) {
  /** @type {Record<string, string | string[]>} */
  const fields = {};
  const metadata_entries = Object.entries(graph_node.metadata ?? {});

  for (const [field_name, field_value] of metadata_entries) {
    const normalized_value = getCollectedOutputFieldValue(
      field_name,
      field_value,
    );

    if (normalized_value === undefined) {
      continue;
    }

    fields[field_name] = normalized_value;
  }

  for (const field_name of Object.keys(field_definitions)) {
    if (fields[field_name] !== undefined) {
      continue;
    }

    const field_value = normalizeOutputFieldValue(
      getGraphNodeMetadataValue(graph_node, field_name),
    );

    if (field_value !== undefined) {
      fields[field_name] = field_value;
    }
  }

  return fields;
}

/**
 * @param {string} field_name
 * @param {unknown} field_value
 * @returns {string | string[] | undefined}
 */
function getCollectedOutputFieldValue(field_name, field_value) {
  if (isInternalOutputField(field_name)) {
    return undefined;
  }

  const normalized_value = normalizeOutputFieldValue(field_value);

  if (normalized_value === undefined) {
    return undefined;
  }

  return normalized_value;
}

/**
 * @param {Record<string, string | string[]>} fields
 * @param {NonNullable<PatramRepoConfig['fields']>} field_definitions
 * @returns {OutputMetadataField[]}
 */
function createVisibleOutputFields(fields, field_definitions) {
  return Object.entries(fields)
    .filter(
      ([field_name]) =>
        field_name !== 'description' &&
        field_definitions[field_name]?.hidden !== true,
    )
    .sort(([left_name], [right_name]) =>
      compareOutputFieldNames(left_name, right_name, field_definitions),
    )
    .map(([name, value]) => ({ name, value }));
}

/**
 * @param {string} field_name
 * @returns {boolean}
 */
function isInternalOutputField(field_name) {
  return field_name === 'title';
}

/**
 * @param {string} left_name
 * @param {string} right_name
 * @param {NonNullable<PatramRepoConfig['fields']>} field_definitions
 * @returns {number}
 */
function compareOutputFieldNames(left_name, right_name, field_definitions) {
  const left_order =
    field_definitions[left_name]?.order ?? Number.MAX_SAFE_INTEGER;
  const right_order =
    field_definitions[right_name]?.order ?? Number.MAX_SAFE_INTEGER;

  if (left_order !== right_order) {
    return left_order - right_order;
  }

  return left_name.localeCompare(right_name, 'en');
}

/**
 * @param {unknown} field_value
 * @returns {string | string[] | undefined}
 */
function normalizeOutputFieldValue(field_value) {
  if (Array.isArray(field_value)) {
    const string_values = field_value.flatMap((value) =>
      typeof value === 'string' ? [value] : [],
    );

    return string_values.length > 0 ? string_values : undefined;
  }

  return typeof field_value === 'string' ? field_value : undefined;
}
