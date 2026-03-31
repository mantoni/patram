/**
 * @import { ParsedCliArguments } from '../cli/arguments.types.ts';
 * @import { ResolvedOutputMode, OutputView } from './output-view.types.ts';
 */

import { renderJsonOutput } from './renderers/json.js';
import { renderPlainOutput } from './renderers/plain.js';
import { renderRichOutput } from './renderers/rich.js';

/**
 * Shared command output views.
 *
 * Normalizes `query`, `queries`, and `show` results into renderer-specific
 * output models.
 *
 * Kind: output
 * Status: active
 * Tracked in: ../../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../../docs/decisions/cli-output-architecture.md
 * @patram
 * @see {@link ./show-document.js}
 * @see {@link ../../docs/decisions/cli-output-architecture.md}
 */

export {
  createOutputView,
  createRefsOutputView,
  createShowOutputView,
} from './view-model/index.js';

/**
 * Render one shared output view through the resolved renderer.
 *
 * @param {OutputView} output_view
 * @param {ResolvedOutputMode} output_mode
 * @param {ParsedCliArguments} parsed_arguments
 * @param {{ is_tty?: boolean, terminal_width?: number }=} render_options
 * @returns {Promise<string>}
 */
export async function renderOutputView(
  output_view,
  output_mode,
  parsed_arguments,
  render_options = {},
) {
  if (output_mode.renderer_name === 'json') {
    return renderJsonOutput(output_view);
  }

  if (output_mode.renderer_name === 'plain') {
    return renderPlainOutput(output_view, render_options);
  }

  return renderRichOutput(output_view, {
    color_enabled: output_mode.color_enabled,
    color_mode: parsed_arguments.color_mode,
    is_tty: render_options.is_tty,
    terminal_width: render_options.terminal_width,
  });
}
