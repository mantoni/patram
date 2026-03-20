/**
 * @typedef {import('./parse-cli-arguments.types.ts').CliColorMode} CliColorMode
 * @typedef {import('./parse-cli-arguments.types.ts').CliCommandName} CliCommandName
 * @typedef {import('./parse-cli-arguments.types.ts').CliOutputMode} CliOutputMode
 * @typedef {{ kind: string, name?: string, rawName?: string, value?: string | boolean }} CliOptionToken
 * @typedef {{ color?: string, json?: boolean, 'no-color'?: boolean, plain?: boolean, where?: string }} CliOptionValues
 * @typedef {{ option_tokens: CliOptionToken[], positionals: string[], values: CliOptionValues }} ParsedCommandLine
 * @typedef {{ allowed_option_names: Set<string>, extra_positionals_message: string, max_positionals: number, min_positionals: number, missing_positionals_message: string }} CommandSchema
 */

const GLOBAL_OPTION_NAMES = new Set(['plain', 'json', 'color', 'no-color']);
const VALID_COLOR_MODES = new Set(['auto', 'always', 'never']);
export const CLI_OPTIONS = /** @type {const} */ ({
  color: { type: 'string' },
  json: { type: 'boolean' },
  'no-color': { type: 'boolean' },
  plain: { type: 'boolean' },
  where: { type: 'string' },
});
/** @type {Record<CliCommandName, CommandSchema>} */
const COMMAND_SCHEMAS = {
  check: createCommandSchema(0, 1, 'Check accepts at most one path.'),
  queries: createCommandSchema(
    0,
    0,
    'Queries does not accept positional arguments.',
  ),
  query: {
    ...createCommandSchema(
      0,
      1,
      'Query accepts either "--where" or a stored query name.',
    ),
    allowed_option_names: new Set(['where']),
  },
  show: createCommandSchema(
    1,
    1,
    'Show accepts exactly one file path.',
    'Show requires a file path.',
  ),
};

/**
 * @param {string | undefined} command_name
 * @returns {command_name is CliCommandName}
 */
export function isCommandName(command_name) {
  return (
    command_name === 'check' ||
    command_name === 'query' ||
    command_name === 'queries' ||
    command_name === 'show'
  );
}

/**
 * @param {CliOptionToken[]} tokens
 * @returns {CliOptionToken[]}
 */
export function collectOptionTokens(tokens) {
  return tokens.filter((token) => token.kind === 'option');
}

/**
 * @param {CliCommandName} command_name
 * @param {ParsedCommandLine} command_line
 * @returns {string | null}
 */
export function validateParsedCommand(command_name, command_line) {
  const command_positionals = command_line.positionals.slice(1);

  return (
    findUnknownOption(command_line.option_tokens) ??
    findInvalidCommandOption(command_name, command_line.option_tokens) ??
    findMissingOptionValue(command_line.option_tokens) ??
    findOutputModeConflict(command_line.values) ??
    findInvalidColorMode(command_line.option_tokens) ??
    findInvalidQueryMode(
      command_name,
      command_line.values,
      command_positionals,
    ) ??
    validateCommandPositionals(command_name, command_positionals)
  );
}

/**
 * @param {CliOptionToken[]} option_tokens
 * @returns {CliColorMode}
 */
export function resolveColorMode(option_tokens) {
  let color_mode = 'auto';
  for (const token of option_tokens) {
    if (token.name === 'no-color') {
      color_mode = 'never';
    }

    if (token.name === 'color' && typeof token.value === 'string') {
      color_mode = token.value;
    }
  }

  return /** @type {CliColorMode} */ (color_mode);
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
 * @param {string} message
 * @returns {{ message: string, success: false }}
 */
export function createParseError(message) {
  return {
    message,
    success: false,
  };
}
/**
 * @param {CliOptionToken[]} option_tokens
 * @returns {string | null}
 */
function findUnknownOption(option_tokens) {
  for (const token of option_tokens) {
    if (
      token.name &&
      token.rawName &&
      !GLOBAL_OPTION_NAMES.has(token.name) &&
      token.name !== 'where'
    ) {
      return `Unknown option "${token.rawName}".`;
    }
  }

  return null;
}

/**
 * @param {CliCommandName} command_name
 * @param {CliOptionToken[]} option_tokens
 * @returns {string | null}
 */
function findInvalidCommandOption(command_name, option_tokens) {
  const command_schema = COMMAND_SCHEMAS[command_name];

  for (const token of option_tokens) {
    if (!token.name || !token.rawName || GLOBAL_OPTION_NAMES.has(token.name)) {
      continue;
    }

    if (!command_schema.allowed_option_names.has(token.name)) {
      return `Option "${token.rawName}" is not valid for "${command_name}".`;
    }
  }

  return null;
}

/**
 * @param {CliOptionToken[]} option_tokens
 * @returns {string | null}
 */
function findMissingOptionValue(option_tokens) {
  for (const token of option_tokens) {
    if (token.name === 'where' && typeof token.value !== 'string') {
      return 'Query requires a where clause.';
    }

    if (token.name === 'color' && typeof token.value !== 'string') {
      return 'Color requires a value.';
    }
  }

  return null;
}

/**
 * @param {CliOptionValues} parsed_values
 * @returns {string | null}
 */
function findOutputModeConflict(parsed_values) {
  if (parsed_values.plain && parsed_values.json) {
    return 'Output mode accepts at most one of "--plain" or "--json".';
  }

  return null;
}

/**
 * @param {CliOptionToken[]} option_tokens
 * @returns {string | null}
 */
function findInvalidColorMode(option_tokens) {
  for (const token of option_tokens) {
    if (
      token.name === 'color' &&
      typeof token.value === 'string' &&
      !VALID_COLOR_MODES.has(token.value)
    ) {
      return 'Color must be one of "auto", "always", or "never".';
    }
  }

  return null;
}

/**
 * @param {CliCommandName} command_name
 * @param {CliOptionValues} parsed_values
 * @param {string[]} command_positionals
 * @returns {string | null}
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
    return 'Query accepts either "--where" or a stored query name.';
  }

  return null;
}

/**
 * @param {CliCommandName} command_name
 * @param {string[]} command_positionals
 * @returns {string | null}
 */
function validateCommandPositionals(command_name, command_positionals) {
  const command_schema = COMMAND_SCHEMAS[command_name];

  if (command_positionals.length < command_schema.min_positionals) {
    return command_schema.missing_positionals_message;
  }

  if (command_positionals.length > command_schema.max_positionals) {
    return command_schema.extra_positionals_message;
  }

  return null;
}

/**
 * @param {number} min_positionals
 * @param {number} max_positionals
 * @param {string} extra_positionals_message
 * @param {string} missing_positionals_message
 * @returns {CommandSchema}
 */
function createCommandSchema(
  min_positionals,
  max_positionals,
  extra_positionals_message,
  missing_positionals_message = '',
) {
  return {
    allowed_option_names: new Set(),
    extra_positionals_message,
    max_positionals,
    min_positionals,
    missing_positionals_message,
  };
}
