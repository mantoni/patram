/** @import * as $k$$l$output$j$view$k$types$k$ts from './output-view.types.ts'; */
/**
 * @import { GraphNode } from './build-graph.types.ts';
 * @import { ParsedCliArguments } from './parse-cli-arguments.types.ts';
 * @import { OutputStoredQueryItem, OutputView, ResolvedOutputMode, ShowOutputView } from './output-view.types.ts';
 */

import { renderJsonOutput } from './render-json-output.js';
import { renderPlainOutput } from './render-plain-output.js';
import { renderRichOutput } from './render-rich-output.js';

/**
 * Create a shared output view from one command result.
 *
 * @param {'query' | 'queries'} command_name
 * @param {GraphNode[] | { name: string, where: string }[]} command_items
 * @param {{ hints?: string[], limit?: number, offset?: number, total_count?: number }=} command_options
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
 * @returns {ShowOutputView}
 */
export function createShowOutputView(show_output) {
  return {
    command: 'show',
    hints: [],
    items: show_output.resolved_links.map((resolved_link) => ({
      kind: 'resolved_link',
      label: resolved_link.label,
      reference: resolved_link.reference,
      target: createResolvedLinkTarget(resolved_link.target),
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
 * @param {{ hints?: string[], limit?: number, offset?: number, total_count?: number }=} command_options
 * @returns {OutputView}
 */
function createQueryOutputView(graph_nodes, command_options = {}) {
  const total_count = command_options.total_count ?? graph_nodes.length;

  return {
    command: 'query',
    hints:
      command_options.hints ??
      (total_count === 0 ? ['Try: patram query --where "kind=task"'] : []),
    items: graph_nodes.map(createOutputNodeItem),
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
 * @returns {$k$$l$output$j$view$k$types$k$ts.OutputNodeItem}
 */
function createOutputNodeItem(graph_node) {
  const title =
    graph_node.title ?? graph_node.label ?? graph_node.path ?? graph_node.key;

  if (!title || !graph_node.path) {
    throw new Error(
      `Expected graph node "${graph_node.id}" to have a title and path.`,
    );
  }

  return {
    id: graph_node.id,
    kind: 'node',
    node_kind: graph_node.kind,
    path: graph_node.path,
    status: graph_node.status,
    title,
  };
}

/**
 * @param {{ kind?: string, path: string, status?: string, title: string }} target
 * @returns {$k$$l$output$j$view$k$types$k$ts.OutputResolvedLinkTarget}
 */
function createResolvedLinkTarget(target) {
  /** @type {$k$$l$output$j$view$k$types$k$ts.OutputResolvedLinkTarget} */
  const resolved_target = {
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
