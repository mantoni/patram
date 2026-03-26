/**
 * @import { BuildGraphResult, GraphNode } from './build-graph.types.ts';
 * @import { DerivedSummaryEvaluator } from './derived-summary.js';
 * @import { PatramRepoConfig } from './load-patram-config.types.ts';
 * @import { ParsedCliArguments } from './parse-cli-arguments.types.ts';
 * @import { OutputDerivedSummary, OutputMetadataField, OutputNodeItem, OutputResolvedLinkItem, OutputResolvedLinkTarget, OutputStoredQueryItem, OutputView, RefsOutputView, ResolvedOutputMode, ShowOutputView } from './output-view.types.ts';
 */
/* eslint-disable max-lines */

import { renderJsonOutput } from './render-json-output.js';
import { renderPlainOutput } from './render-plain-output.js';
import { renderRichOutput } from './render-rich-output.js';
import { resolveDocumentNodeId } from './build-graph-identity.js';

/**
 * Shared command output views.
 *
 * Normalizes `query`, `queries`, and `show` results into renderer-specific
 * output models.
 *
 * Kind: output
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/cli-output-architecture.md
 * @patram
 * @see {@link ./show-document.js}
 * @see {@link ../docs/decisions/cli-output-architecture.md}
 */

/**
 * Create a shared output view from one command result.
 *
 * @param {'query' | 'queries'} command_name
 * @param {GraphNode[] | { name: string, where: string }[]} command_items
 * @param {{ derived_summary_evaluator?: DerivedSummaryEvaluator, hints?: string[], limit?: number, offset?: number, repo_config?: PatramRepoConfig, total_count?: number }=} command_options
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

  throw new Error(`Unsupported output view command "${command_name}".`);
}

/**
 * Create a shared output view for the show command.
 *
 * @param {{ incoming_summary: Record<string, number>, path: string, rendered_source: string, resolved_links: Array<{ label: string, reference: number, target: { kind?: string, path: string, status?: string, title: string } }>, source: string }} show_output
 * @param {{ derived_summary_evaluator?: DerivedSummaryEvaluator, document_node_ids?: BuildGraphResult['document_node_ids'], graph_nodes?: BuildGraphResult['nodes'], repo_config?: PatramRepoConfig }=} command_options
 * @returns {ShowOutputView}
 */
export function createShowOutputView(show_output, command_options = {}) {
  const shown_document_node = resolveDocumentGraphNode(
    command_options.graph_nodes,
    command_options.document_node_ids,
    show_output.path,
  );

  return {
    command: 'show',
    document: shown_document_node
      ? createOutputNodeItem(
          shown_document_node,
          command_options.derived_summary_evaluator?.evaluate(
            shown_document_node,
          ) ?? null,
          command_options.repo_config?.fields ?? {},
        )
      : undefined,
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
 * @param {{ derived_summary_evaluator?: DerivedSummaryEvaluator, repo_config?: PatramRepoConfig }=} command_options
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
          command_options.derived_summary_evaluator?.evaluate(graph_node) ??
            null,
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
      command_options.derived_summary_evaluator?.evaluate(refs_output.node) ??
        null,
      command_options.repo_config?.fields ?? {},
    ),
    summary: {
      count: countIncomingReferenceItems(incoming),
      kind: 'incoming_reference_list',
    },
  };
}

/**
 * Render one shared output view through the resolved renderer.
 *
 * @param {OutputView} output_view
 * @param {ResolvedOutputMode} output_mode
 * @param {ParsedCliArguments} parsed_arguments
 * @returns {Promise<string>}
 */
export async function renderOutputView(
  output_view,
  output_mode,
  parsed_arguments,
) {
  if (output_mode.renderer_name === 'json') {
    return renderJsonOutput(output_view);
  }

  if (output_mode.renderer_name === 'plain') {
    return renderPlainOutput(output_view);
  }

  return renderRichOutput(output_view, {
    color_enabled: output_mode.color_enabled,
    color_mode: parsed_arguments.color_mode,
  });
}

/**
 * @param {GraphNode[]} graph_nodes
 * @param {{ derived_summary_evaluator?: DerivedSummaryEvaluator, hints?: string[], limit?: number, offset?: number, repo_config?: PatramRepoConfig, total_count?: number }=} command_options
 * @returns {OutputView}
 */
function createQueryOutputView(graph_nodes, command_options = {}) {
  const total_count = command_options.total_count ?? graph_nodes.length;

  return {
    command: 'query',
    hints:
      command_options.hints ??
      (total_count === 0 ? ["Try: patram query --where '$class=task'"] : []),
    items: graph_nodes.map((graph_node) =>
      createOutputNodeItem(
        graph_node,
        command_options.derived_summary_evaluator?.evaluate(graph_node) ?? null,
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
 * @param {{ name: string, where: string }[]} stored_queries
 * @returns {OutputView}
 */
function createStoredQueriesOutputView(stored_queries) {
  return {
    command: 'queries',
    hints: [],
    items: stored_queries.map((stored_query) => ({
      kind: 'stored_query',
      name: stored_query.name,
      where: stored_query.where,
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
 * @param {OutputDerivedSummary | null} derived_summary
 * @param {NonNullable<PatramRepoConfig['fields']>} field_definitions
 * @returns {OutputNodeItem}
 */
function createOutputNodeItem(graph_node, derived_summary, field_definitions) {
  const title = getOutputNodeTitle(graph_node);
  const path = getOutputNodePath(graph_node);
  const node_class = getOutputNodeClass(graph_node);
  const fields = collectOutputFields(graph_node, field_definitions);
  const visible_fields = createVisibleOutputFields(fields, field_definitions);

  if (!title || !node_class) {
    throw new Error(
      `Expected graph node "${graph_node.id}" to have a title and path.`,
    );
  }

  return {
    derived_summary: derived_summary ?? undefined,
    fields,
    id: getOutputNodeId(graph_node),
    kind: 'node',
    node_kind: node_class,
    path,
    title,
    visible_fields,
  };
}

/**
 * @param {{ kind?: string, path: string, status?: string, title: string }} target
 * @param {NonNullable<PatramRepoConfig['fields']>} field_definitions
 * @param {OutputDerivedSummary | null} derived_summary
 * @param {GraphNode | undefined} graph_node
 * @returns {OutputResolvedLinkTarget}
 */
function createResolvedLinkTarget(
  target,
  field_definitions,
  derived_summary,
  graph_node,
) {
  /** @type {Record<string, string | string[]>} */
  const fields = {};

  if (target.status) {
    fields.status = target.status;
  }

  /** @type {OutputResolvedLinkTarget} */
  const resolved_target = {
    derived_summary: derived_summary ?? undefined,
    fields,
    id: graph_node ? getOutputNodeId(graph_node) : `doc:${target.path}`,
    kind: target.kind ?? 'document',
    path: target.path,
    title: target.title,
    visible_fields: createVisibleOutputFields(fields, field_definitions),
  };

  return resolved_target;
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
 * @param {GraphNode} graph_node
 * @returns {string | undefined}
 */
function getOutputNodeTitle(graph_node) {
  return (
    getScalarGraphNodeField(graph_node.title) ??
    getScalarGraphNodeField(graph_node.label) ??
    getOutputNodePath(graph_node) ??
    getScalarGraphNodeField(graph_node.key)
  );
}

/**
 * @param {GraphNode} graph_node
 * @returns {string | undefined}
 */
function getOutputNodePath(graph_node) {
  return getScalarGraphNodeField(graph_node.$path ?? graph_node.path);
}

/**
 * @param {GraphNode} graph_node
 * @returns {string | undefined}
 */
function getOutputNodeClass(graph_node) {
  return getScalarGraphNodeField(graph_node.$class ?? graph_node.kind);
}

/**
 * @param {GraphNode} graph_node
 * @returns {string}
 */
function getOutputNodeId(graph_node) {
  return (
    getScalarGraphNodeField(graph_node.$id ?? graph_node.id) ?? graph_node.id
  );
}

/**
 * @param {{ label: string, reference: number, target: { kind?: string, path: string, status?: string, title: string } }} resolved_link
 * @param {{ derived_summary_evaluator?: DerivedSummaryEvaluator, document_node_ids?: BuildGraphResult['document_node_ids'], graph_nodes?: BuildGraphResult['nodes'], repo_config?: PatramRepoConfig }} command_options
 * @returns {OutputResolvedLinkItem}
 */
function createResolvedLinkOutputItem(resolved_link, command_options) {
  const target_graph_node = resolveDocumentGraphNode(
    command_options.graph_nodes,
    command_options.document_node_ids,
    resolved_link.target.path,
  );

  return {
    kind: 'resolved_link',
    label: resolved_link.label,
    reference: resolved_link.reference,
    target: createResolvedLinkTarget(
      resolved_link.target,
      command_options.repo_config?.fields ?? {},
      target_graph_node
        ? (command_options.derived_summary_evaluator?.evaluate(
            target_graph_node,
          ) ?? null)
        : null,
      target_graph_node,
    ),
  };
}

/**
 * @param {BuildGraphResult['nodes'] | undefined} graph_nodes
 * @param {BuildGraphResult['document_node_ids'] | undefined} document_node_ids
 * @param {string} document_path
 * @returns {GraphNode | undefined}
 */
function resolveDocumentGraphNode(
  graph_nodes,
  document_node_ids,
  document_path,
) {
  if (!graph_nodes) {
    return undefined;
  }

  return graph_nodes[resolveDocumentNodeId(document_node_ids, document_path)];
}

/**
 * @param {GraphNode} graph_node
 * @param {NonNullable<PatramRepoConfig['fields']>} field_definitions
 * @returns {Record<string, string | string[]>}
 */
function collectOutputFields(graph_node, field_definitions) {
  /** @type {Record<string, string | string[]>} */
  const fields = {};

  for (const [field_name, field_value] of Object.entries(graph_node)) {
    const normalized_value = getCollectedOutputFieldValue(
      graph_node,
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

    const field_value = normalizeOutputFieldValue(graph_node[field_name]);

    if (field_value !== undefined) {
      fields[field_name] = field_value;
    }
  }

  return fields;
}

/**
 * @param {GraphNode} graph_node
 * @param {string} field_name
 * @param {unknown} field_value
 * @returns {string | string[] | undefined}
 */
function getCollectedOutputFieldValue(graph_node, field_name, field_value) {
  if (isInternalOutputField(field_name)) {
    return undefined;
  }

  const normalized_value = normalizeOutputFieldValue(field_value);

  if (normalized_value === undefined) {
    return undefined;
  }

  if (isLegacyMirrorOutputField(graph_node, field_name, normalized_value)) {
    return undefined;
  }

  return normalized_value;
}

/**
 * @param {GraphNode} graph_node
 * @param {string} field_name
 * @param {string | string[]} normalized_value
 * @returns {boolean}
 */
function isLegacyMirrorOutputField(graph_node, field_name, normalized_value) {
  if (Array.isArray(normalized_value)) {
    return false;
  }

  if (field_name === 'kind') {
    return normalized_value === graph_node.$class;
  }

  if (field_name === 'path') {
    return normalized_value === graph_node.$path;
  }

  if (field_name === 'id') {
    return normalized_value === graph_node.$id;
  }

  return false;
}

/**
 * @param {Record<string, string | string[]>} fields
 * @param {NonNullable<PatramRepoConfig['fields']>} field_definitions
 * @returns {OutputMetadataField[]}
 */
function createVisibleOutputFields(fields, field_definitions) {
  return Object.entries(fields)
    .filter(
      ([field_name]) => field_definitions[field_name]?.display?.hidden !== true,
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
  return (
    field_name === '$class' ||
    field_name === '$id' ||
    field_name === '$path' ||
    field_name === 'id' ||
    field_name === 'key' ||
    field_name === 'label' ||
    field_name === 'path' ||
    field_name === 'title'
  );
}

/**
 * @param {string} left_name
 * @param {string} right_name
 * @param {NonNullable<PatramRepoConfig['fields']>} field_definitions
 * @returns {number}
 */
function compareOutputFieldNames(left_name, right_name, field_definitions) {
  const left_order =
    field_definitions[left_name]?.display?.order ?? Number.MAX_SAFE_INTEGER;
  const right_order =
    field_definitions[right_name]?.display?.order ?? Number.MAX_SAFE_INTEGER;

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
