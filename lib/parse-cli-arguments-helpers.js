/* eslint-disable max-lines */
/**
 * @typedef {import('./parse-cli-arguments.types.ts').CliCommandName} CliCommandName
 * @typedef {import('./parse-cli-arguments.types.ts').CliOutputMode} CliOutputMode
 * @typedef {import('./parse-cli-arguments.types.ts').CliParseError} CliParseError
 * @typedef {import('./parse-cli-arguments.types.ts').ParsedCliHelpRequest} ParsedCliHelpRequest
 * @typedef {{ kind: string, name?: string, rawName?: string, value?: string | boolean }} CliOptionToken
 * @typedef {{ color?: string, help?: boolean, json?: boolean, limit?: string, 'no-color'?: boolean, offset?: string, plain?: boolean, where?: string }} CliOptionValues
 * @typedef {{ option_tokens: CliOptionToken[], positionals: string[], values: CliOptionValues }} ParsedCommandLine
 */

import {
  findCommandSuggestion,
  findHelpTargetSuggestion,
  findOptionSuggestion,
  getCommandDefinition,
  GLOBAL_OPTION_NAMES,
  isCommandName,
  isHelpTopicName,
} from './cli-help-metadata.js';
import { findInvalidColorMode } from './parse-cli-color-options.js';
import { findInvalidQueryPagination } from './parse-cli-query-pagination.js';

export const CLI_OPTIONS = /** @type {const} */ ({
  color: { type: 'string' },
  help: { type: 'boolean' },
  json: { type: 'boolean' },
  limit: { type: 'string' },
  'no-color': { type: 'boolean' },
  offset: { type: 'string' },
  plain: { type: 'boolean' },
  where: { type: 'string' },
});

/**
 * @param {CliOptionToken[]} tokens
 * @returns {CliOptionToken[]}
 */
export function collectOptionTokens(tokens) {
  return tokens.filter((token) => token.kind === 'option');
}

/**
 * @param {ParsedCommandLine} command_line
 * @returns {CliParseError | null}
 */
export function validateRootCommandLine(command_line) {
  return (
    findUnknownOption(undefined, command_line.option_tokens) ??
    findMissingOptionValue(command_line.option_tokens) ??
    findOutputModeConflict(command_line.values) ??
    createMessageParseError(findInvalidColorMode(command_line.option_tokens))
  );
}

/**
 * @param {ParsedCommandLine} command_line
 * @returns {CliParseError | null}
 */
export function validateHelpCommandLine(command_line) {
  const help_validation_error = validateRootCommandLine(command_line);

  if (help_validation_error) {
    return help_validation_error;
  }

  if (command_line.positionals.length > 2) {
    return createMessageParseError(
      'Help accepts at most one topic or command.',
    );
  }

  return null;
}

/**
 * @param {CliCommandName} command_name
 * @param {ParsedCommandLine} command_line
 * @returns {CliParseError | null}
 */
export function validateCommandLineBeforeHelp(command_name, command_line) {
  return (
    findUnknownOption(command_name, command_line.option_tokens) ??
    findMissingOptionValue(command_line.option_tokens) ??
    findOutputModeConflict(command_line.values) ??
    createMessageParseError(findInvalidColorMode(command_line.option_tokens))
  );
}

/**
 * @param {CliCommandName} command_name
 * @param {ParsedCommandLine} command_line
 * @returns {CliParseError | null}
 */
export function validateParsedCommand(command_name, command_line) {
  const command_positionals = command_line.positionals.slice(1);

  if (
    command_name === 'query' &&
    command_line.values.where !== undefined &&
    command_positionals.length === 0
  ) {
    return (
      createMessageParseError(
        findInvalidQueryPagination(command_line.option_tokens),
      ) ??
      findInvalidQueryMode(
        command_name,
        command_line.values,
        command_positionals,
      )
    );
  }

  return (
    findInvalidCommandOption(command_name, command_line.option_tokens) ??
    createMessageParseError(
      findInvalidQueryPagination(command_line.option_tokens),
    ) ??
    findInvalidQueryMode(
      command_name,
      command_line.values,
      command_positionals,
    ) ??
    validateCommandPositionals(command_name, command_positionals)
  );
}

/**
 * @param {CliOptionValues} parsed_values
 * @returns {CliOutputMode}
 */
export function resolveOutputMode(parsed_values) {
  if (parsed_values.json) {
    return 'json';
  }

  if (parsed_values.plain) {
    return 'plain';
  }

  return 'default';
}

/**
 * @param {CliCommandName} command_name
 * @param {string[]} command_positionals
 * @param {CliOptionValues} parsed_values
 * @returns {string[]}
 */
export function buildCommandArguments(
  command_name,
  command_positionals,
  parsed_values,
) {
  if (command_name === 'query' && parsed_values.where !== undefined) {
    return ['--where', parsed_values.where];
  }

  return command_positionals;
}

/**
 * @param {string | undefined} help_target
 * @returns {CliParseError}
 */
export function createUnknownHelpTargetError(help_target) {
  return {
    code: 'unknown_help_target',
    suggestion: help_target ? findHelpTargetSuggestion(help_target) : undefined,
    token: help_target ?? '',
  };
}

/**
 * @param {string | undefined} command_name
 * @returns {CliParseError}
 */
export function createUnknownCommandError(command_name) {
  return {
    code: 'unknown_command',
    suggestion:
      command_name && command_name.length > 0
        ? findCommandSuggestion(command_name)
        : undefined,
    token: command_name ?? '',
  };
}

/**
 * @param {CliCommandName} command_name
 * @returns {ParsedCliHelpRequest}
 */
export function createCommandHelpRequest(command_name) {
  return {
    kind: 'help',
    target_kind: 'command',
    target_name: command_name,
  };
}

/**
 * @param {string | undefined} help_target
 * @returns {ParsedCliHelpRequest | null}
 */
export function createNamedHelpRequest(help_target) {
  if (isCommandName(help_target)) {
    return createCommandHelpRequest(help_target);
  }

  if (isHelpTopicName(help_target)) {
    return {
      kind: 'help',
      target_kind: 'topic',
      target_name: help_target,
    };
  }

  return null;
}

/**
 * @returns {ParsedCliHelpRequest}
 */
export function createRootHelpRequest() {
  return {
    kind: 'help',
    target_kind: 'root',
  };
}

/**
 * @param {string | null} message
 * @returns {CliParseError | null}
 */
export function createMessageParseError(message) {
  if (!message) {
    return null;
  }

  return {
    code: 'message',
    message,
  };
}

/**
 * @param {CliCommandName | undefined} command_name
 * @param {CliOptionToken[]} option_tokens
 * @returns {CliParseError | null}
 */
function findUnknownOption(command_name, option_tokens) {
  for (const token of option_tokens) {
    if (
      token.name &&
      token.rawName &&
      !GLOBAL_OPTION_NAMES.has(token.name) &&
      !isKnownCommandOptionName(token.name)
    ) {
      return {
        code: 'unknown_option',
        command_name,
        suggestion: findOptionSuggestion(token.rawName, command_name),
        token: token.rawName,
      };
    }
  }

  return null;
}

/**
 * @param {CliCommandName} command_name
 * @param {CliOptionToken[]} option_tokens
 * @returns {CliParseError | null}
 */
function findInvalidCommandOption(command_name, option_tokens) {
  const command_definition = getCommandDefinition(command_name);

  for (const token of option_tokens) {
    if (!token.name || !token.rawName || GLOBAL_OPTION_NAMES.has(token.name)) {
      continue;
    }

    if (!command_definition.allowed_option_names.has(token.name)) {
      return {
        code: 'option_not_valid_for_command',
        command_name,
        token: token.rawName,
      };
    }
  }

  return null;
}

/**
 * @param {CliOptionToken[]} option_tokens
 * @returns {CliParseError | null}
 */
function findMissingOptionValue(option_tokens) {
  for (const token of option_tokens) {
    if (token.name === 'where' && typeof token.value !== 'string') {
      return {
        argument_label: '<name> or --where "<clause>"',
        code: 'missing_required_argument',
        command_name: 'query',
      };
    }

    if (token.name === 'offset' && typeof token.value !== 'string') {
      return createMessageParseError('Offset requires a value.');
    }

    if (token.name === 'limit' && typeof token.value !== 'string') {
      return createMessageParseError('Limit requires a value.');
    }

    if (token.name === 'color' && typeof token.value !== 'string') {
      return createMessageParseError('Color requires a value.');
    }
  }

  return null;
}

/**
 * @param {CliOptionValues} parsed_values
 * @returns {CliParseError | null}
 */
function findOutputModeConflict(parsed_values) {
  if (parsed_values.plain && parsed_values.json) {
    return createMessageParseError(
      'Output mode accepts at most one of "--plain" or "--json".',
    );
  }

  return null;
}

/**
 * @param {CliCommandName} command_name
 * @param {CliOptionValues} parsed_values
 * @param {string[]} command_positionals
 * @returns {CliParseError | null}
 */
function findInvalidQueryMode(
  command_name,
  parsed_values,
  command_positionals,
) {
  if (
    command_name === 'query' &&
    parsed_values.where !== undefined &&
    command_positionals.length > 0
  ) {
    return createMessageParseError(
      'Query accepts either "--where" or a stored query name.',
    );
  }

  return null;
}

/**
 * @param {CliCommandName} command_name
 * @param {string[]} command_positionals
 * @returns {CliParseError | null}
 */
function validateCommandPositionals(command_name, command_positionals) {
  const command_definition = getCommandDefinition(command_name);

  if (command_positionals.length < command_definition.min_positionals) {
    if (command_name === 'query' && command_definition.missing_argument_label) {
      return {
        argument_label: command_definition.missing_argument_label,
        code: 'missing_required_argument',
        command_name: 'query',
      };
    }

    if (command_name === 'show' && command_definition.missing_argument_label) {
      return {
        argument_label: command_definition.missing_argument_label,
        code: 'missing_required_argument',
        command_name: 'show',
      };
    }

    return createMessageParseError(
      command_definition.extra_positionals_message,
    );
  }

  if (command_positionals.length > command_definition.max_positionals) {
    return createMessageParseError(
      command_definition.extra_positionals_message,
    );
  }

  if (command_name === 'query' && command_positionals.length === 0) {
    return {
      argument_label: '<name> or --where "<clause>"',
      code: 'missing_required_argument',
      command_name: 'query',
    };
  }

  return null;
}

/**
 * @param {string} option_name
 * @returns {boolean}
 */
function isKnownCommandOptionName(option_name) {
  return (
    option_name === 'limit' ||
    option_name === 'offset' ||
    option_name === 'where'
  );
}
