/** @import * as $k$$l$output$j$view$k$types$k$ts from './output-view.types.ts'; */
/**
 * @import { BuildGraphResult, GraphNode } from './build-graph.types.ts';
 * @import { DerivedSummaryEvaluator } from './derived-summary.js';
 * @import { ParsedCliArguments } from './parse-cli-arguments.types.ts';
 * @import { OutputStoredQueryItem, OutputView, ResolvedOutputMode, ShowOutputView } from './output-view.types.ts';
 */

import { renderJsonOutput } from './render-json-output.js';
import { renderPlainOutput } from './render-plain-output.js';
import { renderRichOutput } from './render-rich-output.js';

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
 * @param {{ derived_summary_evaluator?: DerivedSummaryEvaluator, hints?: string[], limit?: number, offset?: number, total_count?: number }=} command_options
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
 * @param {{ path: string, rendered_source: string, resolved_links: Array<{ label: string, reference: number, target: { kind?: string, path: string, status?: string, title: string } }>, source: string }} show_output
 * @param {{ derived_summary_evaluator?: DerivedSummaryEvaluator, graph_nodes?: BuildGraphResult['nodes'] }=} command_options
 * @returns {ShowOutputView}
 */
export function createShowOutputView(show_output, command_options = {}) {
  const shown_document_node =
    command_options.graph_nodes?.[`doc:${show_output.path}`];

  return {
    command: 'show',
    document: shown_document_node
      ? createOutputNodeItem(
          shown_document_node,
          command_options.derived_summary_evaluator?.evaluate(
            shown_document_node,
          ) ?? null,
        )
      : undefined,
    hints: [],
    items: show_output.resolved_links.map((resolved_link) => ({
      kind: 'resolved_link',
      label: resolved_link.label,
      reference: resolved_link.reference,
      target: createResolvedLinkTarget(
        resolved_link.target,
        command_options.graph_nodes?.[`doc:${resolved_link.target.path}`]
          ? (command_options.derived_summary_evaluator?.evaluate(
              command_options.graph_nodes[`doc:${resolved_link.target.path}`],
            ) ?? null)
          : null,
      ),
    })),
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
 * @param {{ derived_summary_evaluator?: DerivedSummaryEvaluator, hints?: string[], limit?: number, offset?: number, total_count?: number }=} command_options
 * @returns {OutputView}
 */
function createQueryOutputView(graph_nodes, command_options = {}) {
  const total_count = command_options.total_count ?? graph_nodes.length;

  return {
    command: 'query',
    hints:
      command_options.hints ??
      (total_count === 0 ? ['Try: patram query --where "$class=task"'] : []),
    items: graph_nodes.map((graph_node) =>
      createOutputNodeItem(
        graph_node,
        command_options.derived_summary_evaluator?.evaluate(graph_node) ?? null,
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
 * @param {GraphNode} graph_node
 * @param {import('./output-view.types.ts').OutputDerivedSummary | null} derived_summary
 * @returns {$k$$l$output$j$view$k$types$k$ts.OutputNodeItem}
 */
function createOutputNodeItem(graph_node, derived_summary) {
  const title = getOutputNodeTitle(graph_node);
  const path = getOutputNodePath(graph_node);
  const status = getScalarGraphNodeField(graph_node.status);
  const node_class = getOutputNodeClass(graph_node);

  if (!title || !path || !node_class) {
    throw new Error(
      `Expected graph node "${graph_node.id}" to have a title and path.`,
    );
  }

  return {
    derived_summary: derived_summary ?? undefined,
    id: getOutputNodeId(graph_node),
    kind: 'node',
    node_kind: node_class,
    path,
    status,
    title,
  };
}

/**
 * @param {{ kind?: string, path: string, status?: string, title: string }} target
 * @param {import('./output-view.types.ts').OutputDerivedSummary | null} derived_summary
 * @returns {$k$$l$output$j$view$k$types$k$ts.OutputResolvedLinkTarget}
 */
function createResolvedLinkTarget(target, derived_summary) {
  /** @type {$k$$l$output$j$view$k$types$k$ts.OutputResolvedLinkTarget} */
  const resolved_target = {
    derived_summary: derived_summary ?? undefined,
    path: target.path,
    title: target.title,
  };

  if (target.kind && target.kind !== 'document') {
    resolved_target.kind = target.kind;
  }

  if (target.status) {
    resolved_target.status = target.status;
  }

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
