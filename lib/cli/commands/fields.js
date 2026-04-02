/**
 * @import { ParsedCliCommandRequest } from '../arguments.types.ts';
 * @import { PatramRepoConfig } from '../../config/load-patram-config.types.ts';
 */

import process from 'node:process';

import { loadPatramConfig } from '../../config/load-patram-config.js';
import { writeRenderedCommandOutput } from '../../output/command-output.js';
import { renderFieldDiscovery } from '../../output/render-field-discovery.js';
import { discoverFields } from '../../scan/discover-fields.js';

import { resolveCommandOutputMode } from '../command-helpers.js';

/**
 * @param {ParsedCliCommandRequest} parsed_command
 * @param {{ stderr: { write(chunk: string): boolean }, stdout: { isTTY?: boolean, write(chunk: string): boolean } }} io_context
 * @returns {Promise<number>}
 */
export async function runFieldsCommand(parsed_command, io_context) {
  const output_mode = resolveCommandOutputMode(parsed_command, io_context);
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
 * @param {PatramRepoConfig | null} repo_config
 * @returns {Set<string>}
 */
function collectDefinedDiscoveryNames(repo_config) {
  /** @type {Set<string>} */
  const defined_field_names = new Set();

  for (const field_name of Object.keys(repo_config?.fields ?? {})) {
    defined_field_names.add(field_name);
  }

  return defined_field_names;
}
