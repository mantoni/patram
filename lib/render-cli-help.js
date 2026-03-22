/* eslint-disable max-lines */
/**
 * @import {
 *   CliCommandName,
 *   CliHelpTopicName,
 *   CliParseError,
 *   ParsedCliHelpRequest,
 * } from './parse-cli-arguments.types.ts';
 * @import { PatramDiagnostic } from './load-patram-config.types.ts';
 */

import {
  getCommandDefinition,
  getHelpTopicDefinition,
  getRootHelpDefinition,
  listCommandNames,
  listHelpTopicNames,
} from './cli-help-metadata.js';

/**
 * @param {ParsedCliHelpRequest} help_request
 * @returns {string}
 */
export function renderHelpRequest(help_request) {
  if (help_request.target_kind === 'root') {
    return renderRootHelp();
  }

  if (help_request.target_kind === 'command') {
    return renderCommandHelp(
      /** @type {CliCommandName} */ (help_request.target_name),
    );
  }

  return renderHelpTopic(
    /** @type {CliHelpTopicName} */ (help_request.target_name),
  );
}

/**
 * @param {CliParseError} parse_error
 * @returns {string}
 */
export function renderCliParseError(parse_error) {
  if (parse_error.code === 'unknown_command') {
    return renderUnknownCommandError(parse_error.token, parse_error.suggestion);
  }

  if (parse_error.code === 'unknown_help_target') {
    return renderUnknownHelpTargetError(
      parse_error.token,
      parse_error.suggestion,
    );
  }

  if (parse_error.code === 'unknown_option') {
    return renderUnknownOptionError(
      parse_error.token,
      parse_error.command_name,
      parse_error.suggestion,
    );
  }

  if (parse_error.code === 'option_not_valid_for_command') {
    return renderInvalidCommandOptionError(
      parse_error.command_name,
      parse_error.token,
    );
  }

  if (parse_error.code === 'missing_required_argument') {
    return renderMissingRequiredArgumentError(
      parse_error.command_name,
      parse_error.argument_label,
    );
  }

  return `${parse_error.message}\n`;
}

/**
 * @param {PatramDiagnostic} diagnostic
 * @returns {string}
 */
export function renderInvalidWhereDiagnostic(diagnostic) {
  const diagnostic_line = formatDiagnostic(diagnostic);

  return joinOutputLines([
    'Invalid where clause:',
    `  ${diagnostic_line}`,
    '',
    'Next:',
    '  patram help query-language',
  ]);
}

/**
 * @returns {string}
 */
function renderRootHelp() {
  const root_help = getRootHelpDefinition();

  return joinOutputLines([
    'Usage:',
    ...indentLines(root_help.usage_lines),
    '',
    root_help.summary,
    '',
    'Commands:',
    ...listCommandNames().map((command_name) =>
      formatSummaryLine(
        command_name,
        getCommandDefinition(command_name).root_summary,
      ),
    ),
    '',
    'Global options:',
    ...indentLines(root_help.global_options),
    '',
    'Next:',
    '  patram help <command>',
  ]);
}

/**
 * @param {CliCommandName} command_name
 * @returns {string}
 */
function renderCommandHelp(command_name) {
  const command_definition = getCommandDefinition(command_name);
  /** @type {string[]} */
  const output_lines = [
    'Usage:',
    ...indentLines(command_definition.usage_lines),
    '',
    command_definition.summary,
    '',
    'Options:',
    ...command_definition.options.map((option) =>
      formatSummaryLine(
        option.label,
        option.description,
        command_definition.option_column_width,
      ),
    ),
    '',
    'Examples:',
    ...indentLines(command_definition.examples),
    '',
    'Related:',
    ...indentLines(
      command_definition.related.map(
        (related_name) => `patram ${related_name}`,
      ),
    ),
  ];

  if (command_definition.help_topics.length > 0) {
    output_lines.push(
      '',
      'Help topics:',
      ...indentLines(
        command_definition.help_topics.map(
          (help_topic_name) => `patram help ${help_topic_name}`,
        ),
      ),
    );
  }

  return joinOutputLines(output_lines);
}

/**
 * @param {CliHelpTopicName} help_topic_name
 * @returns {string}
 */
function renderHelpTopic(help_topic_name) {
  const help_topic = getHelpTopicDefinition(help_topic_name);

  return joinOutputLines([
    help_topic.lead,
    '',
    'Usage:',
    ...indentLines(help_topic.usage_lines),
    '',
    'Fields:',
    ...indentLines(help_topic.terms),
    '',
    'Relations:',
    ...help_topic.relation_terms.map((relation_term) =>
      formatSummaryLine(relation_term.label, relation_term.description, 23),
    ),
    '',
    'Operators:',
    ...help_topic.operators.map((operator) =>
      formatSummaryLine(operator.label, operator.description, 5),
    ),
    '',
    'Examples:',
    ...indentLines(help_topic.examples),
  ]);
}

/**
 * @param {string} invalid_token
 * @param {CliCommandName | undefined} suggestion
 * @returns {string}
 */
function renderUnknownCommandError(invalid_token, suggestion) {
  if (suggestion) {
    return joinOutputLines([
      `Unknown command: ${invalid_token}`,
      '',
      'Did you mean:',
      `  ${suggestion}`,
      '',
      'Next:',
      `  patram help ${suggestion}`,
    ]);
  }

  return joinOutputLines([
    `Unknown command: ${invalid_token}`,
    '',
    'Commands:',
    ...indentLines(listCommandNames()),
    '',
    'Next:',
    '  patram --help',
  ]);
}

/**
 * @param {string} invalid_token
 * @param {CliCommandName | undefined} command_name
 * @param {string | undefined} suggestion
 * @returns {string}
 */
function renderUnknownOptionError(invalid_token, command_name, suggestion) {
  if (suggestion) {
    return joinOutputLines([
      `Unknown option: ${invalid_token}`,
      '',
      'Did you mean:',
      `  ${suggestion}`,
      '',
      'Next:',
      `  ${renderCommandHelpPath(command_name)}`,
    ]);
  }

  /** @type {string[]} */
  const output_lines = [`Unknown option: ${invalid_token}`];

  if (command_name) {
    output_lines.push(
      '',
      'Usage:',
      ...indentLines(getCommandDefinition(command_name).usage_lines),
      '',
      'Next:',
      `  ${renderCommandHelpPath(command_name)}`,
    );
  } else {
    output_lines.push('', 'Next:', '  patram --help');
  }

  return joinOutputLines(output_lines);
}

/**
 * @param {CliCommandName} command_name
 * @param {string} invalid_token
 * @returns {string}
 */
function renderInvalidCommandOptionError(command_name, invalid_token) {
  return joinOutputLines([
    `Option not valid for command: ${invalid_token}`,
    '',
    'Usage:',
    ...indentLines(getCommandDefinition(command_name).usage_lines),
    '',
    'Next:',
    `  ${renderCommandHelpPath(command_name)}`,
  ]);
}

/**
 * @param {'query' | 'show'} command_name
 * @param {string} argument_label
 * @returns {string}
 */
function renderMissingRequiredArgumentError(command_name, argument_label) {
  const command_definition = getCommandDefinition(command_name);

  return joinOutputLines([
    `Missing required argument: ${argument_label}`,
    '',
    'Usage:',
    ...indentLines(command_definition.missing_usage_lines),
    '',
    'Examples:',
    ...indentLines(command_definition.missing_argument_examples),
  ]);
}

/**
 * @param {string} invalid_token
 * @param {CliCommandName | CliHelpTopicName | undefined} suggestion
 * @returns {string}
 */
function renderUnknownHelpTargetError(invalid_token, suggestion) {
  if (suggestion) {
    return joinOutputLines([
      `Unknown help topic or command: ${invalid_token}`,
      '',
      'Did you mean:',
      `  ${suggestion}`,
      '',
      'Next:',
      `  patram help ${suggestion}`,
    ]);
  }

  return joinOutputLines([
    `Unknown help topic or command: ${invalid_token}`,
    '',
    'Help topics:',
    ...indentLines(listHelpTopicNames()),
    '',
    'Commands:',
    ...indentLines(listCommandNames()),
    '',
    'Next:',
    '  patram help query',
  ]);
}

/**
 * @param {PatramDiagnostic} diagnostic
 * @returns {string}
 */
function formatDiagnostic(diagnostic) {
  return `${diagnostic.path}:${diagnostic.line}:${diagnostic.column} ${diagnostic.level} ${diagnostic.code} ${diagnostic.message}`;
}

/**
 * @param {string | undefined} command_name
 * @returns {string}
 */
function renderCommandHelpPath(command_name) {
  if (!command_name) {
    return 'patram --help';
  }

  return `patram help ${command_name}`;
}

/**
 * @param {string[]} lines
 * @returns {string[]}
 */
function indentLines(lines) {
  return lines.map((line) => `  ${line}`);
}

/**
 * @param {string} label
 * @param {string} description
 * @param {number} width
 * @returns {string}
 */
function formatSummaryLine(label, description, width = 9) {
  return `  ${label.padEnd(width)}${description}`;
}

/**
 * @param {string[]} output_lines
 * @returns {string}
 */
function joinOutputLines(output_lines) {
  return `${output_lines.join('\n')}\n`;
}
