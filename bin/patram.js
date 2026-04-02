#!/usr/bin/env node

import { realpath } from 'node:fs/promises';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { main } from '../lib/cli/main.js';

/**
 * Patram CLI entrypoint.
 *
 * Detects direct process execution and forwards command handling to the shared
 * CLI runtime.
 *
 * kind: entrypoint
 * status: active
 * tracked_in: ../docs/plans/v0/source-anchor-dogfooding.md
 * decided_by: ../docs/decisions/cli-entrypoint-symlink.md
 * @patram
 * @see {@link ../lib/cli/main.js}
 * @see {@link ../docs/patram.md}
 */

if (await isEntrypoint(import.meta.url, process.argv[1])) {
  process.exitCode = await main(process.argv.slice(2), {
    stderr: process.stderr,
    stdout: process.stdout,
  });
}

export { main };

/**
 * @param {string} module_url
 * @param {string | undefined} process_entry_path
 * @returns {Promise<boolean>}
 */
async function isEntrypoint(module_url, process_entry_path) {
  if (!process_entry_path) {
    return false;
  }

  const module_path = await realpath(fileURLToPath(module_url));
  const entry_path = await realpath(process_entry_path);

  return module_path === entry_path;
}
