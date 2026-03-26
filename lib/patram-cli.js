/* eslint-disable max-lines */
/**
 * @import { ParsedCliCommandRequest } from './parse-cli-arguments.types.ts';
 */

import process from 'node:process';

import { checkGraph } from './check-graph.js';
import {
  shouldPageCommandOutput,
  writeCommandOutput,
  writeRenderedCommandOutput,
} from './command-output.js';
import { discoverFields } from './discover-fields.js';
import { inspectReverseReferences } from './inspect-reverse-references.js';
import { listRepoFiles } from './list-source-files.js';
import { listQueries } from './list-queries.js';
import { loadPatramConfig } from './load-patram-config.js';
import { loadProjectGraph } from './load-project-graph.js';
import { parseCliArguments } from './parse-cli-arguments.js';
import { DEFAULT_QUERY_LIMIT, queryGraph } from './query-graph.js';
import { inspectQuery, renderQueryInspection } from './query-inspection.js';
import { createDerivedSummaryEvaluator } from './derived-summary.js';
import {
  renderCheckDiagnostics,
  renderCheckSuccess,
} from './render-check-output.js';
import {
  renderCliParseError,
  renderHelpRequest,
  renderInvalidWhereDiagnostic,
} from './render-cli-help.js';
import {
  resolveCheckTarget,
  selectCheckTargetDiagnostics,
  selectCheckTargetSourceFiles,
} from './resolve-check-target.js';
import {
  createOutputView,
  createRefsOutputView,
  createShowOutputView,
} from './render-output-view.js';
import { renderFieldDiscovery } from './render-field-discovery.js';
import { resolveWhereClause } from './resolve-where-clause.js';
import { resolveOutputMode } from './resolve-output-mode.js';
import { loadShowOutput } from './show-document.js';

/**
 * Patram command execution flow.
 *
 * Loads repo state and routes `check`, `fields`, `query`, `queries`, and
 * `show` through the shared output pipeline.
 *
 * Kind: cli
 * Status: active
 * Implements Command: ../docs/reference/commands/check.md
 * Implements Command: ../docs/reference/commands/query.md
 * Implements Command: ../docs/reference/commands/queries.md
 * Implements Command: ../docs/reference/commands/refs.md
 * Implements Command: ../docs/reference/commands/show.md
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/cli-output-architecture.md
 * Decided by: ../docs/decisions/cli-argument-parser.md
 * @patram
 * @see {@link ./parse-cli-arguments.js}
 * @see {@link ./render-output-view.js}
 */

/**
 * Run the Patram CLI.
 *
 * @param {string[]} cli_arguments
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean }, write_paged_output?: (output_text: string) => Promise<void> }} io_context
 * @returns {Promise<number>}
 */
export async function main(cli_arguments, io_context) {
  const parsed_arguments = parseCliArguments(cli_arguments);

  if (!parsed_arguments.success) {
    io_context.stderr.write(renderCliParseError(parsed_arguments.error));

    return 1;
  }

  if (parsed_arguments.value.kind === 'help') {
    io_context.stdout.write(renderHelpRequest(parsed_arguments.value));

    return 0;
  }

  const parsed_command = /** @type {ParsedCliCommandRequest} */ (
    parsed_arguments.value
  );

  if (parsed_command.command_name === 'check') {
    return runCheckCommand(parsed_command, io_context);
  }

  if (parsed_command.command_name === 'query') {
    return runQueryCommand(parsed_command, io_context);
  }

  if (parsed_command.command_name === 'fields') {
    return runFieldsCommand(parsed_command, io_context);
  }

  if (parsed_command.command_name === 'queries') {
    return runQueriesCommand(parsed_command, io_context);
  }

  if (parsed_command.command_name === 'refs') {
    return runRefsCommand(parsed_command, io_context);
  }

  if (parsed_command.command_name === 'show') {
    return runShowCommand(parsed_command, io_context);
  }

  io_context.stderr.write('Unknown command.\n');

  return 1;
}

/**
 * @param {ParsedCliCommandRequest} parsed_command
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean }, write_paged_output?: (output_text: string) => Promise<void> }} io_context
 * @returns {Promise<number>}
 */
async function runCheckCommand(parsed_command, io_context) {
  const output_mode = resolveOutputMode(parsed_command, {
    is_tty: io_context.stdout.isTTY === true,
    no_color: process.env.NO_COLOR !== undefined,
    term: process.env.TERM,
  });
  const resolved_target = await resolveCheckTarget(
    parsed_command.command_arguments[0],
  );
  const project_graph_result = await loadProjectGraph(
    resolved_target.project_directory,
  );
  const repo_file_paths = await listRepoFiles(
    resolved_target.project_directory,
  );
  const selected_source_file_paths = selectCheckTargetSourceFiles(
    project_graph_result.source_file_paths,
    resolved_target,
  );

  if (project_graph_result.diagnostics.length > 0) {
    io_context.stderr.write(
      renderCheckDiagnostics(project_graph_result.diagnostics, output_mode),
    );

    return 1;
  }

  const diagnostics = checkGraph(
    project_graph_result.graph,
    repo_file_paths,
    project_graph_result.config,
    project_graph_result.claims,
  );
  const selected_diagnostics = selectCheckTargetDiagnostics(
    diagnostics,
    resolved_target,
  );

  if (selected_diagnostics.length > 0) {
    io_context.stderr.write(
      renderCheckDiagnostics(selected_diagnostics, output_mode),
    );

    return 1;
  }

  io_context.stdout.write(
    renderCheckSuccess(selected_source_file_paths.length, output_mode),
  );

  return 0;
}

/**
 * @param {ParsedCliCommandRequest} parsed_command
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean }, write_paged_output?: (output_text: string) => Promise<void> }} io_context
 * @returns {Promise<number>}
 */
async function runQueryCommand(parsed_command, io_context) {
  const use_pager = shouldPageCommandOutput(parsed_command, io_context.stdout);
  const output_mode = resolveOutputMode(parsed_command, {
    is_tty: io_context.stdout.isTTY === true,
    no_color: process.env.NO_COLOR !== undefined,
    term: process.env.TERM,
  });

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
    io_context.stderr.write(`${where_clause.message}\n`);

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
 * @returns {Promise<number>}
 */
async function runFieldsCommand(parsed_command, io_context) {
  const output_mode = resolveOutputMode(parsed_command, {
    is_tty: io_context.stdout.isTTY === true,
    no_color: process.env.NO_COLOR !== undefined,
    term: process.env.TERM,
  });
  const load_result = await loadPatramConfig(process.cwd());
  const defined_field_names =
    load_result.diagnostics.length === 0
      ? collectDefinedDiscoveryNames(load_result.config)
      : new Set();
  const discovery_result = await discoverFields(process.cwd(), {
    defined_field_names,
  });

  await writeRenderedCommandOutput(
    io_context,
    parsed_command,
    renderFieldDiscovery(discovery_result, output_mode),
  );

  return 0;
}

/**
 * @param {ParsedCliCommandRequest} parsed_command
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean } }} io_context
 * @param {import('./output-view.types.ts').ResolvedOutputMode} output_mode
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
    io_context.stderr.write(`${where_clause.message}\n`);

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
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean }, write_paged_output?: (output_text: string) => Promise<void> }} io_context
 * @returns {Promise<number>}
 */
async function runQueriesCommand(parsed_command, io_context) {
  const load_result = await loadPatramConfig(process.cwd());

  if (load_result.diagnostics.length > 0) {
    writeDiagnostics(io_context.stderr, load_result.diagnostics);

    return 1;
  }

  const repo_config = load_result.config;

  if (!repo_config) {
    throw new Error('Expected a valid Patram repo config.');
  }

  await writeCommandOutput(
    io_context,
    parsed_command,
    createOutputView('queries', listQueries(repo_config.queries)),
  );

  return 0;
}

/**
 * @param {ParsedCliCommandRequest} parsed_command
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean }, write_paged_output?: (output_text: string) => Promise<void> }} io_context
 * @returns {Promise<number>}
 */
async function runRefsCommand(parsed_command, io_context) {
  const project_graph_result = await loadProjectGraph(process.cwd());

  if (project_graph_result.diagnostics.length > 0) {
    writeDiagnostics(io_context.stderr, project_graph_result.diagnostics);

    return 1;
  }

  const refs_output = inspectReverseReferences(
    project_graph_result.graph,
    parsed_command.command_arguments[0],
    project_graph_result.config,
    resolveRefsWhereClause(parsed_command.command_arguments),
  );

  if (refs_output.diagnostics.length > 0) {
    io_context.stderr.write(
      renderInvalidWhereDiagnostic(refs_output.diagnostics[0]),
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
    createRefsOutputView(refs_output, {
      derived_summary_evaluator,
      repo_config: project_graph_result.config,
    }),
  );

  return 0;
}

/**
 * @param {ParsedCliCommandRequest} parsed_command
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean }, write_paged_output?: (output_text: string) => Promise<void> }} io_context
 * @returns {Promise<number>}
 */
async function runShowCommand(parsed_command, io_context) {
  const project_graph_result = await loadProjectGraph(process.cwd());

  if (project_graph_result.diagnostics.length > 0) {
    writeDiagnostics(io_context.stderr, project_graph_result.diagnostics);

    return 1;
  }

  const show_output = await loadShowOutput(
    parsed_command.command_arguments[0],
    process.cwd(),
    project_graph_result.graph,
  );

  if (!show_output.success) {
    writeDiagnostics(io_context.stderr, [show_output.diagnostic]);

    return 1;
  }

  const derived_summary_evaluator = createDerivedSummaryEvaluator(
    project_graph_result.config,
    project_graph_result.graph,
  );

  await writeCommandOutput(
    io_context,
    parsed_command,
    createShowOutputView(show_output.value, {
      derived_summary_evaluator,
      document_node_ids: project_graph_result.graph.document_node_ids,
      graph_nodes: project_graph_result.graph.nodes,
      repo_config: project_graph_result.config,
    }),
  );

  return 0;
}

/**
 * @param {{ write(chunk: string): boolean }} output_stream
 * @param {import('./load-patram-config.types.ts').PatramDiagnostic[]} diagnostics
 */
function writeDiagnostics(output_stream, diagnostics) {
  for (const diagnostic of diagnostics) {
    output_stream.write(formatDiagnostic(diagnostic));
  }
}

/**
 * @param {ParsedCliCommandRequest} parsed_command
 * @param {{ total_count: number, nodes: import('./build-graph.types.ts').GraphNode[] }} query_result
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

/**
 * @param {string[]} command_arguments
 * @returns {string | undefined}
 */
function resolveRefsWhereClause(command_arguments) {
  if (command_arguments[1] !== '--where') {
    return undefined;
  }

  return command_arguments.slice(2).join(' ').trim();
}

/**
 * @param {import('./load-patram-config.types.ts').PatramDiagnostic} diagnostic
 * @returns {string}
 */
function formatDiagnostic(diagnostic) {
  return `${diagnostic.path}:${diagnostic.line}:${diagnostic.column} ${diagnostic.level} ${diagnostic.code} ${diagnostic.message}\n`;
}

/**
 * @param {import('./load-patram-config.types.ts').PatramRepoConfig | null} repo_config
 * @returns {Set<string>}
 */
function collectDefinedDiscoveryNames(repo_config) {
  /** @type {Set<string>} */
  const defined_field_names = new Set();

  for (const field_name of Object.keys(repo_config?.fields ?? {})) {
    defined_field_names.add(field_name);
  }

  for (const relation_name of Object.keys(repo_config?.relations ?? {})) {
    defined_field_names.add(relation_name);
  }

  return defined_field_names;
}
