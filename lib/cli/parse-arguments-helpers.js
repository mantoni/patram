/* eslint-disable max-lines */
/**
 * @typedef {import('./arguments.types.ts').CliCommandName} CliCommandName
 * @typedef {import('./arguments.types.ts').CliOutputMode} CliOutputMode
 * @typedef {import('./arguments.types.ts').CliParseError} CliParseError
 * @typedef {import('./arguments.types.ts').ParsedCliHelpRequest} ParsedCliHelpRequest
 * @typedef {{ kind: string, name?: string, rawName?: string, value?: string | boolean }} CliOptionToken
 * @typedef {{ color?: string, cypher?: string, desc?: string, explain?: boolean, help?: boolean, json?: boolean, limit?: string, lint?: boolean, name?: string, 'no-color'?: boolean, offset?: string, plain?: boolean, where?: string }} CliOptionValues
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
} from './help-metadata.js';
import { findInvalidColorMode } from './color-options.js';
import { findInvalidQueryPagination } from './query-pagination.js';

export const CLI_OPTIONS = /** @type {const} */ ({
  color: { type: 'string' },
  cypher: { type: 'string' },
  desc: { type: 'string' },
  explain: { type: 'boolean' },
  help: { type: 'boolean' },
  json: { type: 'boolean' },
  limit: { type: 'string' },
  lint: { type: 'boolean' },
  name: { type: 'string' },
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
    return createUnexpectedArgumentError('help', command_line.positionals[2]);
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
    hasAdHocQueryCommand(command_name, command_line.values, command_positionals)
  ) {
    return validateAdHocQueryCommand(command_line, command_positionals);
  }

  return validateStandardCommand(
    command_name,
    command_line,
    command_positionals,
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
  if (command_name === 'query' || command_name === 'refs') {
    return buildAdHocQueryArguments(
      command_name,
      command_positionals,
      parsed_values,
    );
  }

  if (command_name === 'queries') {
    return buildStoredQueryArguments(command_positionals, parsed_values);
  }

  return command_positionals;
}

/**
 * @param {CliCommandName} command_name
 * @param {CliOptionValues} parsed_values
 * @param {string[]} command_positionals
 * @returns {boolean}
 */
function hasAdHocQueryCommand(
  command_name,
  parsed_values,
  command_positionals,
) {
  return (
    command_name === 'query' &&
    parsed_values.cypher !== undefined &&
    command_positionals.length === 0
  );
}

/**
 * @param {ParsedCommandLine} command_line
 * @param {string[]} command_positionals
 * @returns {CliParseError | null}
 */
function validateAdHocQueryCommand(command_line, command_positionals) {
  return (
    findInvalidCommandOption('query', command_line.option_tokens) ??
    createMessageParseError(
      findInvalidQueryPagination(command_line.option_tokens),
    ) ??
    findInvalidQueryMode('query', command_line.values, command_positionals)
  );
}

/**
 * @param {CliCommandName} command_name
 * @param {ParsedCommandLine} command_line
 * @param {string[]} command_positionals
 * @returns {CliParseError | null}
 */
function validateStandardCommand(
  command_name,
  command_line,
  command_positionals,
) {
  return (
    findInvalidCommandOption(command_name, command_line.option_tokens) ??
    createMessageParseError(
      findInvalidQueryPagination(command_line.option_tokens),
    ) ??
    findInvalidQueryInspection(command_name, command_line.values) ??
    findInvalidQueryMode(
      command_name,
      command_line.values,
      command_positionals,
    ) ??
    findInvalidQueriesMutation(
      command_name,
      command_line.values,
      command_positionals,
    ) ??
    validateCommandPositionals(command_name, command_positionals)
  );
}

/**
 * @param {'query' | 'refs'} command_name
 * @param {string[]} command_positionals
 * @param {CliOptionValues} parsed_values
 * @returns {string[]}
 */
function buildAdHocQueryArguments(
  command_name,
  command_positionals,
  parsed_values,
) {
  if (parsed_values.cypher !== undefined) {
    return command_name === 'query'
      ? ['--cypher', parsed_values.cypher]
      : [command_positionals[0], '--cypher', parsed_values.cypher];
  }

  return command_positionals;
}

/**
 * @param {string[]} command_positionals
 * @param {CliOptionValues} parsed_values
 * @returns {string[]}
 */
function buildStoredQueryArguments(command_positionals, parsed_values) {
  /** @type {string[]} */
  const command_arguments = [...command_positionals];

  appendOptionValue(command_arguments, '--name', parsed_values.name);
  appendOptionValue(command_arguments, '--cypher', parsed_values.cypher);
  appendOptionValue(command_arguments, '--desc', parsed_values.desc);

  return command_arguments;
}

/**
 * @param {string[]} command_arguments
 * @param {string} option_name
 * @param {string | undefined} option_value
 */
function appendOptionValue(command_arguments, option_name, option_value) {
  if (option_value === undefined) {
    return;
  }

  command_arguments.push(option_name, option_value);
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
    const missing_value_error = findMissingOptionValueError(token);

    if (missing_value_error) {
      return missing_value_error;
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
    parsed_values.cypher !== undefined &&
    command_positionals.length > 0
  ) {
    return createMessageParseError(
      'Query accepts either "--cypher" or a stored query name.',
    );
  }

  if (command_name === 'query' && parsed_values.where !== undefined) {
    return {
      code: 'option_not_valid_for_command',
      command_name: 'query',
      token: '--where',
    };
  }

  if (command_name === 'queries' && parsed_values.where !== undefined) {
    return {
      code: 'option_not_valid_for_command',
      command_name: 'queries',
      token: '--where',
    };
  }

  if (command_name === 'refs' && parsed_values.where !== undefined) {
    return {
      code: 'option_not_valid_for_command',
      command_name: 'refs',
      token: '--where',
    };
  }

  return null;
}

/**
 * @param {CliCommandName} command_name
 * @param {CliOptionValues} parsed_values
 * @returns {CliParseError | null}
 */
function findInvalidQueryInspection(command_name, parsed_values) {
  if (command_name !== 'query') {
    return null;
  }

  if (parsed_values.explain && parsed_values.lint) {
    return createMessageParseError(
      'Query accepts at most one of "--explain" or "--lint".',
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
function findInvalidQueriesMutation(
  command_name,
  parsed_values,
  command_positionals,
) {
  if (command_name !== 'queries' || command_positionals.length === 0) {
    return null;
  }

  const subcommand_name = command_positionals[0];

  if (
    subcommand_name !== 'add' &&
    subcommand_name !== 'remove' &&
    subcommand_name !== 'update'
  ) {
    return createUnexpectedArgumentError('queries', subcommand_name);
  }

  if (subcommand_name === 'add') {
    return validateQueriesAddMutation(parsed_values, command_positionals);
  }

  if (subcommand_name === 'remove') {
    return validateQueriesRemoveMutation(parsed_values, command_positionals);
  }

  return validateQueriesUpdateMutation(parsed_values, command_positionals);
}

/**
 * @param {CliCommandName} command_name
 * @param {string[]} command_positionals
 * @returns {CliParseError | null}
 */
function validateCommandPositionals(command_name, command_positionals) {
  const command_definition = getCommandDefinition(command_name);

  if (allowsQueriesMutationPositionals(command_name, command_positionals)) {
    return null;
  }

  if (command_positionals.length < command_definition.min_positionals) {
    const missing_argument_error = createMissingArgumentError(
      command_name,
      command_definition.missing_argument_label,
    );

    if (missing_argument_error) {
      return missing_argument_error;
    }

    return createMessageParseError(
      command_definition.extra_positionals_message,
    );
  }

  if (command_positionals.length > command_definition.max_positionals) {
    return createUnexpectedArgumentError(
      command_name,
      command_positionals[command_definition.max_positionals],
    );
  }

  if (command_name === 'query' && command_positionals.length === 0) {
    return {
      argument_label: "<name> or --cypher '<query>'",
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
    option_name === 'desc' ||
    option_name === 'cypher' ||
    option_name === 'explain' ||
    option_name === 'limit' ||
    option_name === 'lint' ||
    option_name === 'name' ||
    option_name === 'offset' ||
    option_name === 'query' ||
    option_name === 'where'
  );
}

/**
 * @param {CliOptionToken} option_token
 * @returns {CliParseError | null}
 */
function findMissingOptionValueError(option_token) {
  if (typeof option_token.value === 'string') {
    return null;
  }

  if (option_token.name === 'where') {
    return createMessageParseError('Where requires a value.');
  }

  if (option_token.name === 'cypher') {
    return {
      argument_label: "<name> or --cypher '<query>'",
      code: 'missing_required_argument',
      command_name: 'query',
    };
  }

  const message = getMissingOptionValueMessage(option_token.name);

  if (!message) {
    return null;
  }

  return createMessageParseError(message);
}

/**
 * @param {string | undefined} option_name
 * @returns {string | null}
 */
function getMissingOptionValueMessage(option_name) {
  /** @type {Record<string, string>} */
  const option_messages = {
    color: 'Color requires a value.',
    cypher: 'Cypher requires a value.',
    desc: 'Desc requires a value.',
    limit: 'Limit requires a value.',
    name: 'Name requires a value.',
    offset: 'Offset requires a value.',
    query: 'Query requires a value.',
    where: 'Where requires a value.',
  };

  if (!option_name || !Object.hasOwn(option_messages, option_name)) {
    return null;
  }

  return option_messages[option_name];
}

/**
 * @param {CliOptionValues} parsed_values
 * @param {string[]} command_positionals
 * @returns {CliParseError | null}
 */
function validateQueriesAddMutation(parsed_values, command_positionals) {
  const positional_error = validateQueriesMutationPositionals(
    command_positionals,
    'Queries add requires a stored query name.',
  );

  if (positional_error) {
    return positional_error;
  }

  if (parsed_values.name !== undefined) {
    return createMessageParseError('Queries add does not accept "--name".');
  }

  if (parsed_values.cypher === undefined) {
    return createMessageParseError('Queries add requires "--cypher <query>".');
  }

  return null;
}

/**
 * @param {CliOptionValues} parsed_values
 * @param {string[]} command_positionals
 * @returns {CliParseError | null}
 */
function validateQueriesRemoveMutation(parsed_values, command_positionals) {
  const positional_error = validateQueriesMutationPositionals(
    command_positionals,
    'Queries remove requires a stored query name.',
  );

  if (positional_error) {
    return positional_error;
  }

  if (
    parsed_values.desc !== undefined ||
    parsed_values.cypher !== undefined ||
    parsed_values.name !== undefined ||
    parsed_values.where !== undefined
  ) {
    return createMessageParseError(
      'Queries remove does not accept mutation options.',
    );
  }

  return null;
}

/**
 * @param {CliOptionValues} parsed_values
 * @param {string[]} command_positionals
 * @returns {CliParseError | null}
 */
function validateQueriesUpdateMutation(parsed_values, command_positionals) {
  const positional_error = validateQueriesMutationPositionals(
    command_positionals,
    'Queries update requires a stored query name.',
  );

  if (positional_error) {
    return positional_error;
  }

  if (
    parsed_values.desc === undefined &&
    parsed_values.cypher === undefined &&
    parsed_values.name === undefined
  ) {
    return createMessageParseError(
      'Queries update requires at least one of "--name", "--cypher", or "--desc".',
    );
  }

  return null;
}

/**
 * @param {string[]} command_positionals
 * @param {string} missing_name_message
 * @returns {CliParseError | null}
 */
function validateQueriesMutationPositionals(
  command_positionals,
  missing_name_message,
) {
  if (command_positionals.length < 2) {
    return createMessageParseError(missing_name_message);
  }

  if (command_positionals.length > 2) {
    return createUnexpectedArgumentError('queries', command_positionals[2]);
  }

  return null;
}

/**
 * @param {CliCommandName} command_name
 * @param {string[]} command_positionals
 * @returns {boolean}
 */
function allowsQueriesMutationPositionals(command_name, command_positionals) {
  if (command_name !== 'queries' || command_positionals.length === 0) {
    return false;
  }

  const subcommand_name = command_positionals[0];

  return (
    subcommand_name === 'add' ||
    subcommand_name === 'remove' ||
    subcommand_name === 'update'
  );
}

/**
 * @param {CliCommandName} command_name
 * @param {string | null} missing_argument_label
 * @returns {CliParseError | null}
 */
function createMissingArgumentError(command_name, missing_argument_label) {
  if (!missing_argument_label) {
    return null;
  }

  if (command_name === 'query') {
    return {
      argument_label: missing_argument_label,
      code: 'missing_required_argument',
      command_name: 'query',
    };
  }

  if (command_name === 'refs' || command_name === 'show') {
    return {
      argument_label: missing_argument_label,
      code: 'missing_required_argument',
      command_name,
    };
  }

  return null;
}

/**
 * @param {'help' | CliCommandName} command_name
 * @param {string | undefined} token
 * @returns {CliParseError}
 */
function createUnexpectedArgumentError(command_name, token) {
  return {
    code: 'unexpected_argument',
    command_name,
    token: token ?? '',
  };
}
