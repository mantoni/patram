/**
 * @import { ParsedCliCommandRequest } from '../arguments.types.ts';
 */

import { checkGraph } from '../../graph/check-graph.js';
import { loadProjectGraph } from '../../graph/load-project-graph.js';
import {
  renderCheckDiagnostics,
  renderCheckSuccess,
} from '../../output/render-check-output.js';
import {
  resolveCheckTarget,
  selectCheckTargetDiagnostics,
  selectCheckTargetSourceFiles,
} from '../../output/resolve-check-target.js';
import { listRepoFiles } from '../../scan/list-repo-files.js';

import { resolveCommandOutputMode } from '../command-helpers.js';

/**
 * @param {ParsedCliCommandRequest} parsed_command
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean }, write_paged_output?: (output_text: string) => Promise<void> }} io_context
 * @returns {Promise<number>}
 */
export async function runCheckCommand(parsed_command, io_context) {
  const output_mode = resolveCommandOutputMode(parsed_command, io_context);
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
