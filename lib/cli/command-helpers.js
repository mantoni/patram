/** @import * as $k$$k$$l$output$l$output$j$view$k$types$k$ts from '../output/output-view.types.ts'; */
import process from 'node:process';

import { resolveOutputMode } from './resolve-output-mode.js';

/**
 * @param {import('./arguments.types.ts').ParsedCliCommandRequest} parsed_command
 * @param {{ stdout: { isTTY?: boolean } }} io_context
 * @returns {$k$$k$$l$output$l$output$j$view$k$types$k$ts.ResolvedOutputMode}
 */
export function resolveCommandOutputMode(parsed_command, io_context) {
  return resolveOutputMode(parsed_command, {
    is_tty: io_context.stdout.isTTY === true,
    no_color: process.env.NO_COLOR !== undefined,
    term: process.env.TERM,
  });
}

/**
 * @param {{ write(chunk: string): boolean }} output_stream
 * @param {import('../config/load-patram-config.types.ts').PatramDiagnostic[]} diagnostics
 */
export function writeDiagnostics(output_stream, diagnostics) {
  for (const diagnostic of diagnostics) {
    output_stream.write(formatDiagnostic(diagnostic));
  }
}

/**
 * @param {import('../config/load-patram-config.types.ts').PatramDiagnostic} diagnostic
 * @returns {string}
 */
function formatDiagnostic(diagnostic) {
  return `${diagnostic.path}:${diagnostic.line}:${diagnostic.column} ${diagnostic.level} ${diagnostic.code} ${diagnostic.message}\n`;
}
