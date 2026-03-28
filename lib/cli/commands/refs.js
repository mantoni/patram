/**
 * @import { ParsedCliCommandRequest } from '../arguments.types.ts';
 */

import process from 'node:process';

import { loadProjectGraph } from '../../graph/load-project-graph.js';
import { inspectReverseReferences } from '../../graph/inspect-reverse-references.js';
import { writeCommandOutput } from '../../output/command-output.js';
import { createDerivedSummaryEvaluator } from '../../output/derived-summary.js';
import { createRefsOutputView } from '../../output/render-output-view.js';

import { renderInvalidWhereDiagnostic } from '../render-help.js';
import { writeDiagnostics } from '../command-helpers.js';

/**
 * @param {ParsedCliCommandRequest} parsed_command
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean }, write_paged_output?: (output_text: string) => Promise<void> }} io_context
 * @returns {Promise<number>}
 */
export async function runRefsCommand(parsed_command, io_context) {
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
 * @param {string[]} command_arguments
 * @returns {string | undefined}
 */
function resolveRefsWhereClause(command_arguments) {
  if (command_arguments[1] !== '--where') {
    return undefined;
  }

  return command_arguments.slice(2).join(' ').trim();
}
