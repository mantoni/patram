/**
 * @import { ParsedCliCommandRequest } from '../arguments.types.ts';
 */

import process from 'node:process';

import { loadProjectGraph } from '../../graph/load-project-graph.js';
import { writeCommandOutput } from '../../output/command-output.js';
import { createShowOutputView } from '../../output/render-output-view.js';
import { loadShowOutput } from '../../output/show-document.js';

import { writeDiagnostics } from '../command-helpers.js';

/**
 * @param {ParsedCliCommandRequest} parsed_command
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean }, write_paged_output?: (output_text: string) => Promise<void> }} io_context
 * @returns {Promise<number>}
 */
export async function runShowCommand(parsed_command, io_context) {
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

  await writeCommandOutput(
    io_context,
    parsed_command,
    createShowOutputView(show_output.value, {
      document_node_ids: project_graph_result.graph.document_node_ids,
      graph_nodes: project_graph_result.graph.nodes,
      repo_config: project_graph_result.config,
    }),
  );

  return 0;
}
