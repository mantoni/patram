import { expect, it } from 'vitest';

import { parseCliArguments } from './parse-arguments.js';

it('parses a check command with optional project paths and json output', () => {
  expect(parseCliArguments(['check', 'docs', 'lib', '--json'])).toEqual({
    success: true,
    value: {
      kind: 'command',
      color_mode: 'auto',
      command_arguments: ['docs', 'lib'],
      command_name: 'check',
      output_mode: 'json',
    },
  });
});

it('parses the fields command with plain output', () => {
  expect(parseCliArguments(['fields', '--plain'])).toEqual({
    success: true,
    value: {
      kind: 'command',
      color_mode: 'auto',
      command_arguments: [],
      command_name: 'fields',
      output_mode: 'plain',
    },
  });
});

it('parses shared output flags before a query where clause', () => {
  expect(
    parseCliArguments(['--plain', 'query', '--where', 'kind=task']),
  ).toEqual({
    success: true,
    value: {
      kind: 'command',
      color_mode: 'auto',
      command_arguments: ['--where', 'kind=task'],
      command_name: 'query',
      output_mode: 'plain',
    },
  });
});

it('parses query pagination flags', () => {
  expect(
    parseCliArguments(['query', 'pending', '--offset', '25', '--limit', '10']),
  ).toEqual({
    success: true,
    value: {
      kind: 'command',
      color_mode: 'auto',
      command_arguments: ['pending'],
      command_name: 'query',
      output_mode: 'default',
      query_limit: 10,
      query_offset: 25,
    },
  });
});

it('parses query inspection flags', () => {
  expect(parseCliArguments(['query', 'pending', '--explain'])).toEqual({
    success: true,
    value: {
      kind: 'command',
      color_mode: 'auto',
      command_arguments: ['pending'],
      command_name: 'query',
      output_mode: 'default',
      query_inspection_mode: 'explain',
    },
  });
  expect(
    parseCliArguments([
      'query',
      '--where',
      'kind=plan and none(in:tracked_in, kind=task)',
      '--lint',
    ]),
  ).toEqual({
    success: true,
    value: {
      kind: 'command',
      color_mode: 'auto',
      command_arguments: [
        '--where',
        'kind=plan and none(in:tracked_in, kind=task)',
      ],
      command_name: 'query',
      output_mode: 'default',
      query_inspection_mode: 'lint',
    },
  });
});

it('parses queries with no-color', () => {
  expect(parseCliArguments(['queries', '--no-color'])).toEqual({
    success: true,
    value: {
      kind: 'command',
      color_mode: 'never',
      command_arguments: [],
      command_name: 'queries',
      output_mode: 'default',
    },
  });
});

it('parses queries add with a where clause', () => {
  expect(
    parseCliArguments(['queries', 'add', 'test', '--where', 'x=y']),
  ).toEqual({
    success: true,
    value: {
      kind: 'command',
      color_mode: 'auto',
      command_arguments: ['add', 'test', '--where', 'x=y'],
      command_name: 'queries',
      output_mode: 'default',
    },
  });
});

it('parses queries update with rename, where, and description options', () => {
  expect(
    parseCliArguments([
      'queries',
      'update',
      'test',
      '--name',
      'next-test',
      '--where',
      'x=z',
      '--desc',
      '',
    ]),
  ).toEqual({
    success: true,
    value: {
      kind: 'command',
      color_mode: 'auto',
      command_arguments: [
        'update',
        'test',
        '--name',
        'next-test',
        '--where',
        'x=z',
        '--desc',
        '',
      ],
      command_name: 'queries',
      output_mode: 'default',
    },
  });
});

it('parses queries remove with a stored query name', () => {
  expect(parseCliArguments(['queries', 'remove', 'test'])).toEqual({
    success: true,
    value: {
      kind: 'command',
      color_mode: 'auto',
      command_arguments: ['remove', 'test'],
      command_name: 'queries',
      output_mode: 'default',
    },
  });
});

it('parses show with a required file path and color mode', () => {
  expect(
    parseCliArguments(['show', 'docs/patram.md', '--color', 'always']),
  ).toEqual({
    success: true,
    value: {
      kind: 'command',
      color_mode: 'always',
      command_arguments: ['docs/patram.md'],
      command_name: 'show',
      output_mode: 'default',
    },
  });
});

it('parses refs with an optional where clause and plain output', () => {
  expect(
    parseCliArguments([
      'refs',
      'docs/decisions/query-language.md',
      '--where',
      '$class=document',
      '--plain',
    ]),
  ).toEqual({
    success: true,
    value: {
      kind: 'command',
      color_mode: 'auto',
      command_arguments: [
        'docs/decisions/query-language.md',
        '--where',
        '$class=document',
      ],
      command_name: 'refs',
      output_mode: 'plain',
    },
  });
});

it('parses refs with json output', () => {
  expect(
    parseCliArguments(['refs', 'docs/decisions/query-language.md', '--json']),
  ).toEqual({
    success: true,
    value: {
      kind: 'command',
      color_mode: 'auto',
      command_arguments: ['docs/decisions/query-language.md'],
      command_name: 'refs',
      output_mode: 'json',
    },
  });
});

it('parses root help and exact help targets', () => {
  expect(parseCliArguments([])).toEqual({
    success: true,
    value: {
      kind: 'help',
      target_kind: 'root',
    },
  });
  expect(parseCliArguments(['--help'])).toEqual({
    success: true,
    value: {
      kind: 'help',
      target_kind: 'root',
    },
  });
  expect(parseCliArguments(['help', 'query'])).toEqual({
    success: true,
    value: {
      kind: 'help',
      target_kind: 'command',
      target_name: 'query',
    },
  });
  expect(parseCliArguments(['help', 'query-language'])).toEqual({
    success: true,
    value: {
      kind: 'help',
      target_kind: 'topic',
      target_name: 'query-language',
    },
  });
  expect(parseCliArguments(['query', '--help'])).toEqual({
    success: true,
    value: {
      kind: 'help',
      target_kind: 'command',
      target_name: 'query',
    },
  });
});

it('rejects an unknown command', () => {
  expect(parseCliArguments(['nope'])).toEqual({
    success: false,
    error: {
      code: 'unknown_command',
      token: 'nope',
    },
  });
});

it('rejects an unknown option', () => {
  expect(parseCliArguments(['query', '--wat'])).toEqual({
    success: false,
    error: {
      code: 'unknown_option',
      command_name: 'query',
      token: '--wat',
    },
  });
});

it('rejects mixed query inspection flags', () => {
  expect(
    parseCliArguments(['query', 'pending', '--explain', '--lint']),
  ).toEqual({
    success: false,
    error: {
      code: 'message',
      message: 'Query accepts at most one of "--explain" or "--lint".',
    },
  });
});

it('rejects extra queries positionals', () => {
  expect(parseCliArguments(['queries', 'pending'])).toEqual({
    success: false,
    error: {
      code: 'unexpected_argument',
      command_name: 'queries',
      token: 'pending',
    },
  });
});

it('rejects invalid queries mutation invocations', () => {
  expect(parseCliArguments(['queries', 'remove'])).toEqual({
    success: false,
    error: {
      code: 'message',
      message: 'Queries remove requires a stored query name.',
    },
  });
});

it('rejects the legacy queries mutation flag', () => {
  expect(
    parseCliArguments(['queries', 'add', 'test', '--query', 'x=y']),
  ).toEqual({
    success: false,
    error: {
      code: 'message',
      message: 'Query requires a value.',
    },
  });
});

it('rejects show without a file path', () => {
  expect(parseCliArguments(['show'])).toEqual({
    success: false,
    error: {
      argument_label: '<file>',
      code: 'missing_required_argument',
      command_name: 'show',
    },
  });
});

it('rejects refs without a file path', () => {
  expect(parseCliArguments(['refs'])).toEqual({
    success: false,
    error: {
      argument_label: '<file>',
      code: 'missing_required_argument',
      command_name: 'refs',
    },
  });
});

it('rejects incompatible output modes', () => {
  expect(parseCliArguments(['query', 'pending', '--plain', '--json'])).toEqual({
    success: false,
    error: {
      code: 'message',
      message: 'Output mode accepts at most one of "--plain" or "--json".',
    },
  });
});

it('rejects unsupported color values', () => {
  expect(parseCliArguments(['queries', '--color', 'blue'])).toEqual({
    success: false,
    error: {
      code: 'message',
      message: 'Color must be one of "auto", "always", or "never".',
    },
  });
});

it('rejects invalid root and help invocations', () => {
  expect(parseCliArguments(['--color', 'blue'])).toEqual({
    success: false,
    error: {
      code: 'message',
      message: 'Color must be one of "auto", "always", or "never".',
    },
  });
  expect(parseCliArguments(['help', 'query', 'extra'])).toEqual({
    success: false,
    error: {
      code: 'unexpected_argument',
      command_name: 'help',
      token: 'extra',
    },
  });
  expect(parseCliArguments(['help', 'nope'])).toEqual({
    success: false,
    error: {
      code: 'unknown_help_target',
      token: 'nope',
    },
  });
  expect(parseCliArguments(['--color'])).toEqual({
    success: false,
    error: {
      code: 'message',
      message: 'Color requires a value.',
    },
  });
});

it('rejects options that are not valid for a command', () => {
  expect(parseCliArguments(['check', '--where', 'kind=task'])).toEqual({
    success: false,
    error: {
      code: 'option_not_valid_for_command',
      command_name: 'check',
      token: '--where',
    },
  });
});

it('rejects an invalid query offset', () => {
  expect(parseCliArguments(['query', 'pending', '--offset', '-1'])).toEqual({
    success: false,
    error: {
      code: 'message',
      message: 'Offset must be a non-negative integer.',
    },
  });
});

it('rejects an invalid query limit', () => {
  expect(parseCliArguments(['query', 'pending', '--limit', 'many'])).toEqual({
    success: false,
    error: {
      code: 'message',
      message: 'Limit must be a non-negative integer.',
    },
  });
});

it('rejects unknown help targets with close matches', () => {
  expect(parseCliArguments(['help', 'qurey'])).toEqual({
    success: false,
    error: {
      code: 'unknown_help_target',
      suggestion: 'query',
      token: 'qurey',
    },
  });
  expect(parseCliArguments(['help', 'query-lang'])).toEqual({
    success: false,
    error: {
      code: 'unknown_help_target',
      suggestion: 'query-language',
      token: 'query-lang',
    },
  });
});

it('rejects query without a stored query name or where clause', () => {
  expect(parseCliArguments(['query'])).toEqual({
    success: false,
    error: {
      argument_label: "<name> or --where '<clause>'",
      code: 'missing_required_argument',
      command_name: 'query',
    },
  });
});

it('rejects unexpected extra command arguments with the invalid token', () => {
  expect(parseCliArguments(['fields', 'extra'])).toEqual({
    success: false,
    error: {
      code: 'unexpected_argument',
      command_name: 'fields',
      token: 'extra',
    },
  });
  expect(parseCliArguments(['query', 'pending', 'extra'])).toEqual({
    success: false,
    error: {
      code: 'unexpected_argument',
      command_name: 'query',
      token: 'extra',
    },
  });
  expect(parseCliArguments(['refs', 'docs/a.md', 'docs/b.md'])).toEqual({
    success: false,
    error: {
      code: 'unexpected_argument',
      command_name: 'refs',
      token: 'docs/b.md',
    },
  });
  expect(parseCliArguments(['show', 'docs/a.md', 'docs/b.md'])).toEqual({
    success: false,
    error: {
      code: 'unexpected_argument',
      command_name: 'show',
      token: 'docs/b.md',
    },
  });
});
