/* eslint-disable max-lines */
/**
 * @import {
 *   CliCommandName,
 *   CliHelpTopicName,
 * } from './parse-cli-arguments.types.ts';
 */

/**
 * @typedef {{
 *   description: string,
 *   label: string,
 * }} CliHelpOption
 */

/**
 * @typedef {{
 *   allowed_option_names: Set<string>,
 *   examples: string[],
 *   extra_positionals_message: string,
 *   help_topics: CliHelpTopicName[],
 *   max_positionals: number,
 *   min_positionals: number,
 *   missing_argument_examples: string[],
 *   missing_argument_label: string | null,
 *   missing_usage_lines: string[],
 *   option_column_width: number,
 *   options: CliHelpOption[],
 *   related: CliCommandName[],
 *   root_summary: string,
 *   summary: string,
 *   syntax_lines?: string[],
 *   usage_lines: string[],
 * }} CliCommandDefinition
 */

/**
 * @typedef {{
 *   examples: string[],
 *   lead: string,
 *   operators: CliHelpOption[],
 *   relation_terms: CliHelpOption[],
 *   terms: string[],
 *   usage_lines: string[],
 * }} CliHelpTopicDefinition
 */

export const COMMAND_NAMES = /** @type {const} */ ([
  'check',
  'fields',
  'query',
  'queries',
  'show',
]);

export const HELP_TOPIC_NAMES = /** @type {const} */ (['query-language']);

export const GLOBAL_OPTION_NAMES = new Set([
  'help',
  'plain',
  'json',
  'color',
  'no-color',
]);

const ROOT_HELP_SUMMARY = 'Patram explores docs and how they link to sources.';
const ROOT_HELP_USAGE_LINES = [
  'patram <command> [options]',
  'patram help [command]',
];
const ROOT_HELP_GLOBAL_OPTIONS = [
  '--help',
  '--plain',
  '--json',
  '--color <auto|always|never>',
  '--no-color',
];

/** @type {Record<CliCommandName, CliCommandDefinition>} */
const COMMAND_DEFINITIONS = {
  check: {
    allowed_option_names: new Set(),
    examples: [
      'patram check',
      'patram check docs',
      'patram check docs/patram.md',
    ],
    extra_positionals_message: 'Check accepts at most one path.',
    help_topics: [],
    max_positionals: 1,
    min_positionals: 0,
    missing_argument_examples: [],
    missing_argument_label: null,
    missing_usage_lines: ['patram check [path]'],
    option_column_width: 10,
    options: [
      {
        description: 'Print plain text output',
        label: '--plain',
      },
      {
        description: 'Print JSON output',
        label: '--json',
      },
    ],
    related: ['show', 'query'],
    root_summary: 'Validate a project, directory, or file',
    summary:
      'Validate a project, directory, or file and report graph diagnostics.',
    usage_lines: ['patram check [path] [options]'],
  },
  fields: {
    allowed_option_names: new Set(),
    examples: ['patram fields', 'patram fields --json'],
    extra_positionals_message: 'Fields does not accept positional arguments.',
    help_topics: [],
    max_positionals: 0,
    min_positionals: 0,
    missing_argument_examples: [],
    missing_argument_label: null,
    missing_usage_lines: ['patram fields'],
    option_column_width: 10,
    options: [
      {
        description: 'Print plain text output',
        label: '--plain',
      },
      {
        description: 'Print JSON output',
        label: '--json',
      },
    ],
    related: ['query', 'check'],
    root_summary: 'Discover likely field schema from source claims',
    summary:
      'Discover likely metadata fields, multiplicity, and class usage from source claims.',
    usage_lines: ['patram fields [options]'],
  },
  query: {
    allowed_option_names: new Set([
      'explain',
      'limit',
      'lint',
      'offset',
      'where',
    ]),
    examples: [
      'patram query active-plans',
      'patram query --where "tracked_in=doc:docs/plans/v0/worktracking-agent-guidance.md"',
      'patram query --where "status not in [done, dropped, superseded]"',
      'patram query --where "$class=plan and none(in:tracked_in, $class=decision)"',
      'patram query --where "count(in:decided_by, $class=task) = 0"',
      'patram query ready-tasks --explain',
      'patram query --where "$class=decision and status=accepted and count(in:decided_by, $class=task) = 0" --lint',
      'patram query active-plans --limit 10 --offset 20',
    ],
    extra_positionals_message:
      'Query accepts either "--where" or a stored query name.',
    help_topics: ['query-language'],
    max_positionals: 1,
    min_positionals: 0,
    missing_argument_examples: [
      'patram query active-plans',
      'patram query --where "tracked_in=doc:docs/plans/v0/worktracking-agent-guidance.md"',
    ],
    missing_argument_label: '<name> or --where "<clause>"',
    missing_usage_lines: [
      'patram query <name> [options]',
      'patram query --where "<clause>" [options]',
    ],
    option_column_width: 19,
    options: [
      {
        description: 'Run an ad hoc query instead of a stored query',
        label: '--where <clause>',
      },
      {
        description: 'Skip the first N matches',
        label: '--offset <number>',
      },
      {
        description: 'Limit the number of matches',
        label: '--limit <number>',
      },
      {
        description: 'Explain the resolved query without rendering results',
        label: '--explain',
      },
      {
        description: 'Validate syntax and relation references only',
        label: '--lint',
      },
      {
        description: 'Print plain text output',
        label: '--plain',
      },
      {
        description: 'Print JSON output',
        label: '--json',
      },
    ],
    related: ['queries', 'show'],
    root_summary: 'Run a stored query or an ad hoc where clause',
    summary:
      'Run a stored query or an ad hoc where clause against graph nodes.',
    syntax_lines: [
      '$id=<value> | $class=<value> | $path=<value> | status=<value>',
      '$id^=<prefix> | $path^=<prefix> | title~<text>',
      '<field> in [<value>, ...] | <field> not in [<value>, ...]',
      '<relation>:* | <relation>=<target-id>',
      'any(<traversal>, <term> and <term>)',
      'none(<traversal>, <term> and <term>)',
      'count(<traversal>, <term> and <term>) <comparison> <number>',
    ],
    usage_lines: [
      'patram query <name> [options]',
      'patram query --where "<clause>" [options]',
    ],
  },
  queries: {
    allowed_option_names: new Set(),
    examples: ['patram queries'],
    extra_positionals_message: 'Queries does not accept positional arguments.',
    help_topics: [],
    max_positionals: 0,
    min_positionals: 0,
    missing_argument_examples: [],
    missing_argument_label: null,
    missing_usage_lines: ['patram queries'],
    option_column_width: 10,
    options: [
      {
        description: 'Print plain text output',
        label: '--plain',
      },
      {
        description: 'Print JSON output',
        label: '--json',
      },
    ],
    related: ['query'],
    root_summary: 'List stored queries',
    summary: 'List the stored queries defined in the project configuration.',
    usage_lines: ['patram queries [options]'],
  },
  show: {
    allowed_option_names: new Set(),
    examples: ['patram show docs/patram.md', 'patram show lib/patram-cli.js'],
    extra_positionals_message: 'Show accepts exactly one file path.',
    help_topics: [],
    max_positionals: 1,
    min_positionals: 1,
    missing_argument_examples: [
      'patram show docs/patram.md',
      'patram show lib/patram-cli.js',
    ],
    missing_argument_label: '<file>',
    missing_usage_lines: ['patram show <file>'],
    option_column_width: 10,
    options: [
      {
        description: 'Print plain text output',
        label: '--plain',
      },
      {
        description: 'Print JSON output',
        label: '--json',
      },
    ],
    related: ['query', 'check'],
    root_summary: 'Print a file with resolved links',
    summary:
      'Print one source file with indexed links resolved against the graph.',
    usage_lines: ['patram show <file> [options]'],
  },
};

/** @type {Record<CliHelpTopicName, CliHelpTopicDefinition>} */
const HELP_TOPIC_DEFINITIONS = {
  'query-language': {
    examples: [
      '$class=decision and status=accepted',
      '$path^=docs/plans/',
      'title~query',
      'tracked_in=doc:docs/plans/v0/worktracking-agent-guidance.md',
      'implements_command=command:query',
      'status not in [done, dropped, superseded]',
      'any(in:tracked_in, $class=task and status in [pending, ready, in_progress, blocked])',
      'none(in:tracked_in, $class=decision)',
      'count(in:decided_by, $class=task) = 0',
      'not uses_term=term:graph',
    ],
    lead: 'Query language filters graph nodes with field, relation, traversal, and aggregate terms.',
    operators: [
      {
        description: 'Exact field match or exact count comparison',
        label: '=',
      },
      {
        description: 'Prefix match for structural id and path',
        label: '^=',
      },
      {
        description: 'Contains text for title',
        label: '~',
      },
      {
        description: 'Set membership for supported fields',
        label: 'in',
      },
      {
        description: 'Set exclusion for supported fields',
        label: 'not in',
      },
      {
        description: 'Negate one term',
        label: 'not',
      },
      {
        description: 'Combine terms',
        label: 'and',
      },
      {
        description: 'Count comparisons',
        label: '!= < > >= <=',
      },
    ],
    relation_terms: [
      {
        description: 'Match nodes with at least one outgoing relation',
        label: '<relation>:*',
      },
      {
        description: 'Match nodes linked to an exact target id',
        label: '<relation>=<target-id>',
      },
      {
        description: 'Traverse one incoming relation hop',
        label: 'in:<relation>',
      },
      {
        description: 'Traverse one outgoing relation hop',
        label: 'out:<relation>',
      },
    ],
    terms: [
      'Exact match: $id, $class, $path, status',
      'Prefix match: $id, $path',
      'Contains text: title',
      'Set membership: $id, $class, $path, status, title',
    ],
    usage_lines: [
      '<field>=<value>',
      '$id^=<prefix>',
      '$path^=<prefix>',
      'title~<text>',
      '<field> in [<value>, ...]',
      '<field> not in [<value>, ...]',
      '<relation>:*',
      '<relation>=<target-id>',
      'any(<traversal>, <term> and <term>)',
      'none(<traversal>, <term> and <term>)',
      'count(<traversal>, <term> and <term>) <comparison> <number>',
      'not <term>',
      '<term> and <term>',
    ],
  },
};

/**
 * @returns {{ global_options: string[], summary: string, usage_lines: string[] }}
 */
export function getRootHelpDefinition() {
  return {
    global_options: ROOT_HELP_GLOBAL_OPTIONS,
    summary: ROOT_HELP_SUMMARY,
    usage_lines: ROOT_HELP_USAGE_LINES,
  };
}

/**
 * @param {CliCommandName} command_name
 * @returns {CliCommandDefinition}
 */
export function getCommandDefinition(command_name) {
  return COMMAND_DEFINITIONS[command_name];
}

/**
 * @param {CliHelpTopicName} help_topic_name
 * @returns {CliHelpTopicDefinition}
 */
export function getHelpTopicDefinition(help_topic_name) {
  return HELP_TOPIC_DEFINITIONS[help_topic_name];
}

/**
 * @param {string | undefined} command_name
 * @returns {command_name is CliCommandName}
 */
export function isCommandName(command_name) {
  return COMMAND_NAMES.includes(
    /** @type {CliCommandName} */ (command_name ?? ''),
  );
}

/**
 * @param {string | undefined} help_topic_name
 * @returns {help_topic_name is CliHelpTopicName}
 */
export function isHelpTopicName(help_topic_name) {
  return HELP_TOPIC_NAMES.includes(
    /** @type {CliHelpTopicName} */ (help_topic_name ?? ''),
  );
}

/**
 * @param {string} input_text
 * @returns {CliCommandName | undefined}
 */
export function findCommandSuggestion(input_text) {
  return /** @type {CliCommandName | undefined} */ (
    findCloseMatch(input_text, COMMAND_NAMES)
  );
}

/**
 * @param {string} input_text
 * @returns {CliCommandName | CliHelpTopicName | undefined}
 */
export function findHelpTargetSuggestion(input_text) {
  return /** @type {CliCommandName | CliHelpTopicName | undefined} */ (
    findCloseMatch(input_text, [...COMMAND_NAMES, ...HELP_TOPIC_NAMES])
  );
}

/**
 * @param {string} input_text
 * @param {CliCommandName | undefined} command_name
 * @returns {string | undefined}
 */
export function findOptionSuggestion(input_text, command_name) {
  const candidates = listOptionLabels(command_name);

  return findCloseMatch(input_text, candidates);
}

/**
 * @returns {CliCommandName[]}
 */
export function listCommandNames() {
  return [...COMMAND_NAMES];
}

/**
 * @returns {CliHelpTopicName[]}
 */
export function listHelpTopicNames() {
  return [...HELP_TOPIC_NAMES];
}

/**
 * @param {CliCommandName | undefined} command_name
 * @returns {string[]}
 */
function listOptionLabels(command_name) {
  const option_labels = new Set(
    [...GLOBAL_OPTION_NAMES].map((option_name) => `--${option_name}`),
  );

  if (command_name) {
    for (const option_name of getCommandDefinition(command_name)
      .allowed_option_names) {
      option_labels.add(`--${option_name}`);
    }
  } else {
    option_labels.add('--limit');
    option_labels.add('--offset');
    option_labels.add('--where');
  }

  return [...option_labels];
}

/**
 * @param {string} input_text
 * @param {readonly string[]} candidates
 * @returns {string | undefined}
 */
function findCloseMatch(input_text, candidates) {
  let best_candidate;
  let best_score = 0;

  for (const candidate of candidates) {
    const score = scoreCandidate(input_text, candidate);

    if (score > best_score) {
      best_candidate = candidate;
      best_score = score;
    }
  }

  if (best_score < 0.6) {
    return undefined;
  }

  return best_candidate;
}

/**
 * @param {string} input_text
 * @param {string} candidate
 * @returns {number}
 */
function scoreCandidate(input_text, candidate) {
  const max_length = Math.max(input_text.length, candidate.length);

  if (max_length === 0) {
    return 1;
  }

  return (
    1 - calculateDamerauLevenshteinDistance(input_text, candidate) / max_length
  );
}

/**
 * @param {string} left_text
 * @param {string} right_text
 * @returns {number}
 */
function calculateDamerauLevenshteinDistance(left_text, right_text) {
  /** @type {number[][]} */
  const matrix = Array.from({ length: left_text.length + 1 }, () =>
    Array(right_text.length + 1).fill(0),
  );

  for (let left_index = 0; left_index <= left_text.length; left_index += 1) {
    matrix[left_index][0] = left_index;
  }

  for (
    let right_index = 0;
    right_index <= right_text.length;
    right_index += 1
  ) {
    matrix[0][right_index] = right_index;
  }

  for (let left_index = 1; left_index <= left_text.length; left_index += 1) {
    for (
      let right_index = 1;
      right_index <= right_text.length;
      right_index += 1
    ) {
      const substitution_cost =
        left_text[left_index - 1] === right_text[right_index - 1] ? 0 : 1;

      matrix[left_index][right_index] = Math.min(
        matrix[left_index - 1][right_index] + 1,
        matrix[left_index][right_index - 1] + 1,
        matrix[left_index - 1][right_index - 1] + substitution_cost,
      );

      if (
        left_index > 1 &&
        right_index > 1 &&
        left_text[left_index - 1] === right_text[right_index - 2] &&
        left_text[left_index - 2] === right_text[right_index - 1]
      ) {
        matrix[left_index][right_index] = Math.min(
          matrix[left_index][right_index],
          matrix[left_index - 2][right_index - 2] + 1,
        );
      }
    }
  }

  return matrix[left_text.length][right_text.length];
}
