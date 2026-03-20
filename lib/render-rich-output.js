/**
 * @import { CliColorMode } from './parse-cli-arguments.types.ts';
 * @import { OutputNodeItem, OutputStoredQueryItem, OutputView } from './output-view.types.ts';
 */

import { Ansis } from 'ansis';

/**
 * Render styled rich output while preserving the plain layout.
 *
 * @param {OutputView} output_view
 * @param {{ color_mode: CliColorMode, color_enabled: boolean }} render_options
 * @returns {string}
 */
export function renderRichOutput(output_view, render_options) {
  const ansi = createAnsi(render_options.color_enabled);

  if (output_view.command === 'query') {
    return renderRichQueryOutput(output_view, ansi);
  }

  if (output_view.command === 'queries') {
    return renderRichStoredQueries(output_view.items, ansi);
  }

  throw new Error(`Unsupported output view command "${output_view.command}".`);
}

/**
 * @param {OutputView} output_view
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderRichQueryOutput(output_view, ansi) {
  if (output_view.items.length === 0) {
    return renderRichEmptyQuery(output_view.hints, ansi);
  }

  return `${output_view.items.map((item) => formatRichNodeItem(item, ansi)).join('\n\n')}\n`;
}

/**
 * @param {string[]} hints
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderRichEmptyQuery(hints, ansi) {
  if (hints.length === 0) {
    return `${ansi.yellow('No matches.')}\n`;
  }

  return `${ansi.yellow('No matches.')}\n${hints.map((hint) => ansi.dim(hint)).join('\n')}\n`;
}

/**
 * @param {import('./output-view.types.ts').OutputView['items']} output_items
 * @param {Ansis} ansi
 * @returns {string}
 */
function renderRichStoredQueries(output_items, ansi) {
  if (output_items.length === 0) {
    return '';
  }

  return `${output_items.map((item) => formatRichStoredQuery(item, ansi)).join('\n')}\n`;
}

/**
 * @param {OutputNodeItem | OutputStoredQueryItem} output_item
 * @param {Ansis} ansi
 * @returns {string}
 */
function formatRichNodeItem(output_item, ansi) {
  if (output_item.kind !== 'node') {
    throw new Error(
      `Expected a node output item, received "${output_item.kind}".`,
    );
  }

  return [
    ansi.cyan(output_item.title),
    ansi.dim(output_item.path),
    formatRichMetadataRow(output_item, ansi),
  ].join('\n');
}

/**
 * @param {OutputNodeItem | OutputStoredQueryItem} output_item
 * @param {Ansis} ansi
 * @returns {string}
 */
function formatRichStoredQuery(output_item, ansi) {
  if (output_item.kind !== 'stored_query') {
    throw new Error(
      `Expected a stored query output item, received "${output_item.kind}".`,
    );
  }

  return `${ansi.cyan(output_item.name)} ${ansi.dim(output_item.where)}`;
}

/**
 * @param {OutputNodeItem} output_item
 * @param {Ansis} ansi
 * @returns {string}
 */
function formatRichMetadataRow(output_item, ansi) {
  /** @type {string[]} */
  const metadata_fields = [];

  metadata_fields.push(`${ansi.dim('kind:')} ${output_item.node_kind}`);

  if (output_item.status) {
    metadata_fields.push(`${ansi.dim('status:')} ${output_item.status}`);
  }

  return metadata_fields.join('  ');
}

/**
 * @param {boolean} color_enabled
 * @returns {Ansis}
 */
function createAnsi(color_enabled) {
  return new Ansis(color_enabled ? 3 : 0);
}
