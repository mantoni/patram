/**
 * @import { PatramDiagnostic } from '../config/load-patram-config.types.ts';
 * @import { ResolvedOutputMode } from './output-view.types.ts';
 */

import { Ansis } from 'ansis';
import stringWidth from 'string-width';

/**
 * Render check diagnostics for one output mode.
 *
 * @param {PatramDiagnostic[]} diagnostics
 * @param {ResolvedOutputMode} output_mode
 * @returns {string}
 */
export function renderCheckDiagnostics(diagnostics, output_mode) {
  if (output_mode.renderer_name === 'json') {
    return `${JSON.stringify(
      {
        diagnostics: diagnostics.map(formatJsonDiagnostic),
      },
      null,
      2,
    )}\n`;
  }

  if (output_mode.renderer_name === 'plain') {
    return renderPlainCheckDiagnostics(diagnostics);
  }

  return renderRichCheckDiagnostics(diagnostics, createAnsi(output_mode));
}

/**
 * Render the success summary for one check run.
 *
 * @param {number} source_file_count
 * @param {ResolvedOutputMode} output_mode
 * @returns {string}
 */
export function renderCheckSuccess(source_file_count, output_mode) {
  if (output_mode.renderer_name === 'json') {
    return `${JSON.stringify({ diagnostics: [] }, null, 2)}\n`;
  }

  if (output_mode.renderer_name === 'plain') {
    return formatCheckSuccess(source_file_count);
  }

  const ansi = createAnsi(output_mode);
  return `${ansi.green('Check passed.')}\n${ansi.gray(`Scanned ${source_file_count} ${pluralize('file', source_file_count)}. Found 0 errors.`)}\n`;
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @returns {string}
 */
function renderPlainCheckDiagnostics(diagnostics) {
  const grouped_diagnostics = groupDiagnosticsByPath(diagnostics);
  const diagnostic_prefix_width = measureMaxDiagnosticPrefixWidth(diagnostics);
  return `${grouped_diagnostics
    .map((diagnostic_group) =>
      formatPlainDiagnosticGroup(diagnostic_group, diagnostic_prefix_width),
    )
    .join('\n\n')}\n\n${formatPlainSummary(diagnostics)}\n`;
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderRichCheckDiagnostics(diagnostics, ansi) {
  const grouped_diagnostics = groupDiagnosticsByPath(diagnostics);
  const diagnostic_prefix_width = measureMaxDiagnosticPrefixWidth(diagnostics);
  return `${grouped_diagnostics
    .map((diagnostic_group) =>
      formatRichDiagnosticGroup(
        diagnostic_group,
        diagnostic_prefix_width,
        ansi,
      ),
    )
    .join('\n\n')}\n\n${formatRichSummary(diagnostics, ansi)}\n`;
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @returns {Array<{ diagnostics: PatramDiagnostic[], path: string }>}
 */
function groupDiagnosticsByPath(diagnostics) {
  /** @type {Array<{ diagnostics: PatramDiagnostic[], path: string }>} */
  const grouped_diagnostics = [];
  /** @type {Map<string, { diagnostics: PatramDiagnostic[], path: string }>} */
  const grouped_diagnostics_by_path = new Map();

  for (const diagnostic of diagnostics) {
    let diagnostic_group = grouped_diagnostics_by_path.get(diagnostic.path);

    if (!diagnostic_group) {
      diagnostic_group = {
        diagnostics: [],
        path: diagnostic.path,
      };
      grouped_diagnostics_by_path.set(diagnostic.path, diagnostic_group);
      grouped_diagnostics.push(diagnostic_group);
    }

    diagnostic_group.diagnostics.push(diagnostic);
  }

  return grouped_diagnostics;
}

/**
 * @param {{ diagnostics: PatramDiagnostic[], path: string }} diagnostic_group
 * @param {number} diagnostic_prefix_width
 * @returns {string}
 */
function formatPlainDiagnosticGroup(diagnostic_group, diagnostic_prefix_width) {
  return `${formatDiagnosticGroupHeader(diagnostic_group.path)}\n${diagnostic_group.diagnostics
    .map((diagnostic) =>
      formatPlainDiagnosticRow(diagnostic, diagnostic_prefix_width),
    )
    .join('\n')}`;
}

/**
 * @param {PatramDiagnostic} diagnostic
 * @param {number} diagnostic_prefix_width
 * @returns {string}
 */
function formatPlainDiagnosticRow(diagnostic, diagnostic_prefix_width) {
  const diagnostic_prefix = formatDiagnosticPrefix(diagnostic);
  return `${diagnostic_prefix}${createDiagnosticCodePadding(diagnostic_prefix, diagnostic_prefix_width)}  ${diagnostic.code}`;
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @returns {string}
 */
function formatPlainSummary(diagnostics) {
  const error_count = countDiagnosticsByLevel(diagnostics, 'error');
  const warning_count = countDiagnosticsByLevel(diagnostics, 'warning');
  const problem_count = diagnostics.length;

  return `\u2716 ${problem_count} ${pluralize('problem', problem_count)} (${error_count} ${pluralize('error', error_count)}, ${warning_count} ${pluralize('warning', warning_count)})`;
}

/**
 * @param {{ diagnostics: PatramDiagnostic[], path: string }} diagnostic_group
 * @param {number} diagnostic_prefix_width
 * @param {Ansis} ansi
 * @returns {string}
 */
function formatRichDiagnosticGroup(
  diagnostic_group,
  diagnostic_prefix_width,
  ansi,
) {
  return `${ansi.green(formatDiagnosticGroupHeader(diagnostic_group.path))}\n${diagnostic_group.diagnostics
    .map((diagnostic) =>
      formatRichDiagnosticRow(diagnostic, diagnostic_prefix_width, ansi),
    )
    .join('\n')}`;
}

/**
 * @param {PatramDiagnostic} diagnostic
 * @param {number} diagnostic_prefix_width
 * @param {Ansis} ansi
 * @returns {string}
 */
function formatRichDiagnosticRow(diagnostic, diagnostic_prefix_width, ansi) {
  const location = `${diagnostic.line}:${diagnostic.column}`;
  const diagnostic_prefix = formatDiagnosticPrefix(diagnostic);
  return `  ${ansi.gray(location)}  ${formatRichDiagnosticLevel(diagnostic.level, ansi)}  ${diagnostic.message}${createDiagnosticCodePadding(diagnostic_prefix, diagnostic_prefix_width)}  ${ansi.gray(diagnostic.code)}`;
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @param {Ansis} ansi
 * @returns {string}
 */
function formatRichSummary(diagnostics, ansi) {
  return ansi.red(formatPlainSummary(diagnostics));
}

/**
 * @param {PatramDiagnostic} diagnostic
 * @returns {{ code: string, column: number, level: 'error', line: number, message: string, path: string }}
 */
function formatJsonDiagnostic(diagnostic) {
  return {
    path: diagnostic.path,
    line: diagnostic.line,
    column: diagnostic.column,
    level: diagnostic.level,
    code: diagnostic.code,
    message: diagnostic.message,
  };
}

/**
 * @param {number} source_file_count
 * @returns {string}
 */
function formatCheckSuccess(source_file_count) {
  return `Check passed.\nScanned ${source_file_count} ${pluralize('file', source_file_count)}. Found 0 errors.\n`;
}

/**
 * @param {PatramDiagnostic} diagnostic
 */
function formatDiagnosticPrefix(diagnostic) {
  return `  ${diagnostic.line}:${diagnostic.column}  ${diagnostic.level}  ${diagnostic.message}`;
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 */
function measureMaxDiagnosticPrefixWidth(diagnostics) {
  let max_width = 0;

  for (const diagnostic of diagnostics) {
    const diagnostic_prefix_width = stringWidth(
      formatDiagnosticPrefix(diagnostic),
    );

    if (diagnostic_prefix_width > max_width) {
      max_width = diagnostic_prefix_width;
    }
  }

  return max_width;
}

/**
 * @param {string} diagnostic_prefix
 * @param {number} diagnostic_prefix_width
 */
function createDiagnosticCodePadding(
  diagnostic_prefix,
  diagnostic_prefix_width,
) {
  return ' '.repeat(
    Math.max(0, diagnostic_prefix_width - stringWidth(diagnostic_prefix)),
  );
}

/**
 * @param {PatramDiagnostic[]} diagnostics
 * @param {'error' | 'warning'} level
 */
function countDiagnosticsByLevel(diagnostics, level) {
  let count = 0;

  for (const diagnostic of diagnostics) {
    if (diagnostic.level === level) {
      count += 1;
    }
  }

  return count;
}

/**
 * @param {'error' | 'warning'} level
 * @param {Ansis} ansi
 * @returns {string}
 */
function formatRichDiagnosticLevel(level, ansi) {
  if (level === 'warning') {
    return ansi.yellow(level);
  }

  return ansi.red(level);
}

/**
 * @param {string} noun
 * @param {number} count
 */
function pluralize(noun, count) {
  if (count === 1) {
    return noun;
  }

  return `${noun}s`;
}

/**
 * @param {ResolvedOutputMode} output_mode
 */
function createAnsi(output_mode) {
  return new Ansis(output_mode.color_enabled ? 3 : 0);
}

/**
 * @param {string} path
 */
function formatDiagnosticGroupHeader(path) {
  return `${resolveDiagnosticPathType(path)} ${path}`;
}

/**
 * @param {string} path
 */
function resolveDiagnosticPathType(path) {
  if (path.endsWith('.json') || path.startsWith('<')) {
    return 'file';
  }

  return 'document';
}
