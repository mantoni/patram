/* eslint-disable max-lines */
/**
 * @import {
 *   CliCommandName,
 *   CliHelpTopicName,
 * } from './arguments.types.ts';
 */

import { findCloseMatch } from '../find-close-match.js';

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

const COMMAND_NAMES = /** @type {const} */ ([
  'check',
  'fields',
  'query',
  'queries',
  'refs',
  'show',
]);

const HELP_TOPIC_NAMES = /** @type {const} */ (['query-language']);

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
      'patram check docs docs/patram.md',
    ],
    extra_positionals_message: 'Check accepts zero or more paths.',
    help_topics: [],
    max_positionals: Number.POSITIVE_INFINITY,
    min_positionals: 0,
    missing_argument_examples: [],
    missing_argument_label: null,
    missing_usage_lines: ['patram check [path ...]'],
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
    usage_lines: ['patram check [path ...] [options]'],
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
      'cypher',
      'explain',
      'limit',
      'lint',
      'offset',
    ]),
    examples: [
      'patram query active-plans',
      'patram query --cypher "MATCH (n:Plan) WHERE n.status = \'active\' RETURN n"',
      'patram query --cypher "MATCH (n) WHERE id(n) = \'plan:v0/worktracking-agent-guidance\' RETURN n"',
      "patram query --cypher \"MATCH (n) WHERE n.status NOT IN ['done', 'dropped', 'superseded'] RETURN n\"",
      'patram query --cypher "MATCH (n:Plan) WHERE NOT EXISTS { MATCH (decision:Decision)-[:TRACKED_IN]->(n) } RETURN n"',
      'patram query --cypher "MATCH (n:Decision) WHERE COUNT { MATCH (task:Task)-[:DECIDED_BY]->(n) } = 0 RETURN n"',
      'patram query ready-tasks --explain',
      'patram query --cypher "MATCH (n:Decision) WHERE n.status = \'accepted\' AND COUNT { MATCH (task:Task)-[:DECIDED_BY]->(n) } = 0 RETURN n" --lint',
      'patram query active-plans --limit 10 --offset 20',
    ],
    extra_positionals_message:
      'Query accepts "--cypher" or a stored query name.',
    help_topics: ['query-language'],
    max_positionals: 1,
    min_positionals: 0,
    missing_argument_examples: [
      'patram query active-plans',
      'patram query --cypher "MATCH (n:Plan) WHERE n.status = \'active\' RETURN n"',
    ],
    missing_argument_label: "<name> or --cypher '<query>'",
    missing_usage_lines: [
      'patram query <name> [options]',
      `patram query --cypher '<query>' [options]`,
    ],
    option_column_width: 19,
    options: [
      {
        description: 'Run an ad hoc Cypher query instead of a stored query',
        label: '--cypher <query>',
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
    root_summary: 'Run a stored query or an ad hoc Cypher query',
    summary:
      'Run a stored query or an ad hoc Cypher query against graph nodes.',
    syntax_lines: [
      'MATCH (n) RETURN n',
      "MATCH (n:Label) WHERE n.status = 'active' RETURN n",
      "MATCH (n) WHERE id(n) = 'command:query' RETURN n",
      'MATCH (n) WHERE EXISTS { MATCH ... } RETURN n',
      'MATCH (n) WHERE COUNT { MATCH ... } = 0 RETURN n',
    ],
    usage_lines: [
      'patram query <name> [options]',
      `patram query --cypher '<query>' [options]`,
    ],
  },
  queries: {
    allowed_option_names: new Set(['cypher', 'desc', 'name']),
    examples: [
      'patram queries',
      `patram queries add active-plans --cypher "MATCH (n:Plan) WHERE n.status = 'active' RETURN n"`,
      "patram queries update ready-tasks --desc 'Show tasks that are ready.'",
      `patram queries update ready-tasks --cypher "MATCH (n:Task) WHERE n.status = 'ready' RETURN n"`,
      'patram queries remove ready-tasks',
    ],
    extra_positionals_message:
      'Queries accepts no positionals unless using add, update, or remove.',
    help_topics: [],
    max_positionals: 2,
    min_positionals: 0,
    missing_argument_examples: [],
    missing_argument_label: null,
    missing_usage_lines: [
      'patram queries',
      'patram queries add <name> --cypher <query>',
      'patram queries update <name> [--name <new_name>] [--cypher <query>] [--desc <text>]',
      'patram queries remove <name>',
    ],
    option_column_width: 19,
    options: [
      {
        description: 'Persist a new stored Cypher query',
        label: '--cypher <query>',
      },
      {
        description: 'Set or rename the stored query name for update',
        label: '--name <new_name>',
      },
      {
        description: 'Set or clear the stored query description',
        label: '--desc <text>',
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
    related: ['query'],
    root_summary: 'List and manage stored queries',
    summary:
      'List stored queries or mutate them through add, update, and remove.',
    usage_lines: [
      'patram queries [options]',
      `patram queries add <name> --cypher <query> [--desc <text>] [options]`,
      'patram queries update <name> [--name <new_name>] [--cypher <query>] [--desc <text>] [options]',
      'patram queries remove <name> [options]',
    ],
  },
  refs: {
    allowed_option_names: new Set(['cypher']),
    examples: [
      'patram refs docs/decisions/query-language.md',
      'patram refs docs/decisions/query-language.md --cypher "MATCH (n:Document) RETURN n"',
      'patram refs docs/decisions/query-language.md --json',
    ],
    extra_positionals_message: 'Refs accepts exactly one file path.',
    help_topics: ['query-language'],
    max_positionals: 1,
    min_positionals: 1,
    missing_argument_examples: [
      'patram refs docs/decisions/query-language.md',
      'patram refs docs/patram.md --cypher "MATCH (n:Document) RETURN n"',
    ],
    missing_argument_label: '<file>',
    missing_usage_lines: ['patram refs <file>'],
    option_column_width: 19,
    options: [
      {
        description: 'Filter incoming source nodes with a Cypher query',
        label: '--cypher <query>',
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
    related: ['show', 'query'],
    root_summary: 'Inspect incoming graph references for one file',
    summary:
      'Inspect incoming graph references for one file, grouped by relation.',
    usage_lines: ['patram refs <file> [options]'],
  },
  show: {
    allowed_option_names: new Set(),
    examples: ['patram show docs/patram.md', 'patram show lib/cli/main.js'],
    extra_positionals_message: 'Show accepts exactly one file path.',
    help_topics: [],
    max_positionals: 1,
    min_positionals: 1,
    missing_argument_examples: [
      'patram show docs/patram.md',
      'patram show lib/cli/main.js',
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
      "MATCH (n:Decision) WHERE n.status = 'accepted' RETURN n",
      "MATCH (n:Task) WHERE n.status IN ['pending', 'ready'] RETURN n",
      "MATCH (n) WHERE path(n) ENDS WITH '/README.md' RETURN n",
      'MATCH (n:Plan) WHERE NOT EXISTS { MATCH (decision:Decision)-[:TRACKED_IN]->(n) } RETURN n',
      'MATCH (n:Decision) WHERE COUNT { MATCH (task:Task)-[:DECIDED_BY]->(n) } = 0 RETURN n',
      "MATCH (n) WHERE EXISTS { MATCH (n)-[:IMPLEMENTS_COMMAND]->(command:Command) WHERE id(command) = 'command:query' } RETURN n",
    ],
    lead: 'Query language uses a constrained Cypher subset for graph node selection.',
    operators: [
      {
        description: 'Equality and exact value comparison',
        label: '= | <>',
      },
      {
        description: 'String prefix, suffix, and contains checks',
        label: 'STARTS WITH | ENDS WITH | CONTAINS',
      },
      {
        description: 'Set membership checks',
        label: 'IN | NOT IN',
      },
      {
        description: 'Boolean composition',
        label: 'AND | OR | NOT',
      },
      {
        description: 'Relation existence subqueries',
        label: 'EXISTS { ... }',
      },
      {
        description: 'Related-node count comparisons',
        label: 'COUNT { ... }',
      },
    ],
    relation_terms: [
      {
        description: 'Outgoing relation match',
        label: '(n)-[:RELATION]->(target)',
      },
      {
        description: 'Incoming relation match',
        label: '(source)-[:RELATION]->(n)',
      },
      {
        description: 'Label-qualified related node pattern',
        label: '(n)-[:RELATION]->(target:Label)',
      },
    ],
    terms: [
      'Root match: MATCH (n) or MATCH (n:Label)',
      'Return shape: RETURN n',
      'Structural functions: id(n), path(n)',
      'Labels select class membership: MATCH (n:Label)',
      'Common fields: n.title, n.status, n.kind',
      'Subqueries: EXISTS { MATCH ... WHERE ... } and COUNT { MATCH ... WHERE ... }',
    ],
    usage_lines: [
      'MATCH (n) RETURN n',
      'MATCH (n:Label) WHERE <predicate> RETURN n',
      'MATCH (n) WHERE EXISTS { MATCH ... } RETURN n',
      'MATCH (n) WHERE COUNT { MATCH ... } <comparison> <number> RETURN n',
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
    option_labels.add('--cypher');
  }

  return [...option_labels];
}
