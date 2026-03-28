/**
 * @import { ParsedCliArguments } from './arguments.types.ts';
 * @import { ResolvedOutputMode } from '../output-view.types.ts';
 */

/**
 * Resolve the renderer and color support for one command invocation.
 *
 * @param {ParsedCliArguments} parsed_arguments
 * @param {{ is_tty: boolean, no_color: boolean, term: string | undefined }} output_context
 * @returns {ResolvedOutputMode}
 */
export function resolveOutputMode(parsed_arguments, output_context) {
  if (parsed_arguments.output_mode === 'json') {
    return {
      color_enabled: false,
      renderer_name: 'json',
    };
  }

  if (parsed_arguments.output_mode === 'plain') {
    return {
      color_enabled: false,
      renderer_name: 'plain',
    };
  }

  if (!output_context.is_tty) {
    return {
      color_enabled: false,
      renderer_name: 'plain',
    };
  }

  return {
    color_enabled: isColorEnabled(parsed_arguments, output_context),
    renderer_name: 'rich',
  };
}

/**
 * @param {ParsedCliArguments} parsed_arguments
 * @param {{ is_tty: boolean, no_color: boolean, term: string | undefined }} output_context
 * @returns {boolean}
 */
function isColorEnabled(parsed_arguments, output_context) {
  if (parsed_arguments.color_mode === 'always') {
    return true;
  }

  if (parsed_arguments.color_mode === 'never') {
    return false;
  }

  if (output_context.no_color || output_context.term === 'dumb') {
    return false;
  }

  return true;
}
