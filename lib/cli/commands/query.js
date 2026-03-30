/**
 * @import { ParsedCliCommandRequest } from '../arguments.types.ts';
 * @import { GraphNode } from '../../graph/build-graph.types.ts';
 * @import { ResolvedOutputMode } from '../../output/output-view.types.ts';
 */

import process from 'node:process';

import {
  shouldPageCommandOutput,
  writeCommandOutput,
} from '../../output/command-output.js';
import { createDerivedSummaryEvaluator } from '../../output/derived-summary.js';
import { renderCheckDiagnostics } from '../../output/render-check-output.js';
import {
  renderCliParseError,
  renderInvalidWhereDiagnostic,
} from '../render-help.js';
import { createOutputView } from '../../output/render-output-view.js';
import { loadPatramConfig } from '../../config/load-patram-config.js';
import { loadProjectGraph } from '../../graph/load-project-graph.js';
import { DEFAULT_QUERY_LIMIT, queryGraph } from '../../graph/query/execute.js';
import {
  inspectQuery,
  renderQueryInspection,
} from '../../graph/query/inspect.js';
import { resolveWhereClause } from '../../graph/query/resolve.js';

import {
  resolveCommandOutputMode,
  writeDiagnostics,
} from '../command-helpers.js';

/**
 * @param {ParsedCliCommandRequest} parsed_command
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean }, write_paged_output?: (output_text: string) => Promise<void> }} io_context
 * @returns {Promise<number>}
 */
export async function runQueryCommand(parsed_command, io_context) {
  const use_pager = shouldPageCommandOutput(parsed_command, io_context.stdout);
  const output_mode = resolveCommandOutputMode(parsed_command, io_context);

  if (parsed_command.query_inspection_mode) {
    return runQueryInspectionCommand(
      parsed_command,
      io_context,
      output_mode,
      use_pager,
    );
  }

  const project_graph_result = await loadProjectGraph(process.cwd());

  if (project_graph_result.diagnostics.length > 0) {
    writeDiagnostics(io_context.stderr, project_graph_result.diagnostics);

    return 1;
  }

  const where_clause = resolveWhereClause(
    project_graph_result.config,
    parsed_command.command_arguments,
  );

  if (!where_clause.success) {
    io_context.stderr.write(renderCliParseError(where_clause.error));

    return 1;
  }

  const query_result = queryGraph(
    project_graph_result.graph,
    where_clause.value.where_clause,
    project_graph_result.config,
    createQueryPaginationOptions(parsed_command, use_pager),
  );

  if (query_result.diagnostics.length > 0) {
    io_context.stderr.write(
      renderInvalidWhereDiagnostic(query_result.diagnostics[0]),
    );

    return 1;
  }

  const derived_summary_evaluator = createDerivedSummaryEvaluator(
    project_graph_result.config,
    project_graph_result.graph,
  );

  await writeCommandOutput(
    io_context,
    parsed_command,
    createOutputView('query', query_result.nodes, {
      derived_summary_evaluator,
      ...createQueryOutputOptions(parsed_command, query_result, use_pager),
      repo_config: project_graph_result.config,
    }),
  );

  return 0;
}

/**
 * @param {ParsedCliCommandRequest} parsed_command
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean } }} io_context
 * @param {ResolvedOutputMode} output_mode
 * @param {boolean} use_pager
 * @returns {Promise<number>}
 */
async function runQueryInspectionCommand(
  parsed_command,
  io_context,
  output_mode,
  use_pager,
) {
  const query_inspection_mode = parsed_command.query_inspection_mode;

  if (!query_inspection_mode) {
    throw new Error('Expected a query inspection mode.');
  }

  const load_result = await loadPatramConfig(process.cwd());

  if (load_result.diagnostics.length > 0) {
    io_context.stderr.write(
      renderCheckDiagnostics(load_result.diagnostics, output_mode),
    );

    return 1;
  }

  const repo_config = load_result.config;

  if (!repo_config) {
    throw new Error('Expected a valid Patram repo config.');
  }

  const where_clause = resolveWhereClause(
    repo_config,
    parsed_command.command_arguments,
  );

  if (!where_clause.success) {
    io_context.stderr.write(renderCliParseError(where_clause.error));

    return 1;
  }

  const query_inspection = inspectQuery(repo_config, where_clause.value, {
    inspection_mode: query_inspection_mode,
    ...createQueryExecutionOptions(parsed_command, use_pager),
  });

  if (!query_inspection.success) {
    io_context.stderr.write(
      renderCheckDiagnostics(query_inspection.diagnostics, output_mode),
    );

    return 1;
  }

  io_context.stdout.write(
    renderQueryInspection(query_inspection.value, output_mode),
  );

  return 0;
}

/**
 * @param {ParsedCliCommandRequest} parsed_command
 * @param {{ total_count: number, nodes: GraphNode[] }} query_result
 * @param {boolean} use_pager
 * @returns {{ hints: string[], limit: number, offset: number, total_count: number }}
 */
function createQueryOutputOptions(parsed_command, query_result, use_pager) {
  /** @type {string[]} */
  const hints = [];
  const limit =
    parsed_command.query_limit ??
    (use_pager ? query_result.nodes.length : DEFAULT_QUERY_LIMIT);
  const offset = parsed_command.query_offset ?? 0;

  if (query_result.total_count === 0) {
    hints.push("Try: patram query --where '$class=task'");
  }

  if (
    !use_pager &&
    parsed_command.query_limit === undefined &&
    parsed_command.query_offset === undefined &&
    query_result.total_count > DEFAULT_QUERY_LIMIT
  ) {
    hints.push(
      'Hint: use --offset <n> or --limit <n> to page through more matches.',
    );
  }

  return {
    hints,
    limit,
    offset,
    total_count: query_result.total_count,
  };
}

/**
 * @param {ParsedCliCommandRequest} parsed_command
 * @param {boolean} use_pager
 * @returns {{ limit?: number, offset: number }}
 */
function createQueryPaginationOptions(parsed_command, use_pager) {
  /** @type {{ limit?: number, offset: number }} */
  const pagination_options = {
    offset: parsed_command.query_offset ?? 0,
  };

  if (parsed_command.query_limit !== undefined) {
    pagination_options.limit = parsed_command.query_limit;
  } else if (!use_pager) {
    pagination_options.limit = DEFAULT_QUERY_LIMIT;
  }

  return pagination_options;
}

/**
 * @param {ParsedCliCommandRequest} parsed_command
 * @param {boolean} use_pager
 * @returns {{ limit: number | null, offset: number }}
 */
function createQueryExecutionOptions(parsed_command, use_pager) {
  const pagination_options = createQueryPaginationOptions(
    parsed_command,
    use_pager,
  );

  return {
    limit: pagination_options.limit ?? null,
    offset: pagination_options.offset,
  };
}
