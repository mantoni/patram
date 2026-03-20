import { expect, it } from 'vitest';

import { parseCliArguments } from './parse-cli-arguments.js';

it('parses a check command with an optional project path and json output', () => {
  expect(parseCliArguments(['check', 'docs', '--json'])).toEqual({
    success: true,
    value: {
      color_mode: 'auto',
      command_arguments: ['docs'],
      command_name: 'check',
      output_mode: 'json',
    },
  });
});

it('parses shared output flags before a query where clause', () => {
  expect(
    parseCliArguments(['--plain', 'query', '--where', 'kind=task']),
  ).toEqual({
    success: true,
    value: {
      color_mode: 'auto',
      command_arguments: ['--where', 'kind=task'],
      command_name: 'query',
      output_mode: 'plain',
    },
  });
});

it('parses queries with no-color', () => {
  expect(parseCliArguments(['queries', '--no-color'])).toEqual({
    success: true,
    value: {
      color_mode: 'never',
      command_arguments: [],
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
      color_mode: 'always',
      command_arguments: ['docs/patram.md'],
      command_name: 'show',
      output_mode: 'default',
    },
  });
});

it('rejects an unknown command', () => {
  expect(parseCliArguments(['nope'])).toEqual({
    message: 'Unknown command.',
    success: false,
  });
});

it('rejects an unknown option', () => {
  expect(parseCliArguments(['query', '--wat'])).toEqual({
    message: 'Unknown option "--wat".',
    success: false,
  });
});

it('rejects mixed query modes', () => {
  expect(
    parseCliArguments(['query', 'pending', '--where', 'kind=task']),
  ).toEqual({
    message: 'Query accepts either "--where" or a stored query name.',
    success: false,
  });
});

it('rejects extra queries positionals', () => {
  expect(parseCliArguments(['queries', 'pending'])).toEqual({
    message: 'Queries does not accept positional arguments.',
    success: false,
  });
});

it('rejects show without a file path', () => {
  expect(parseCliArguments(['show'])).toEqual({
    message: 'Show requires a file path.',
    success: false,
  });
});

it('rejects incompatible output modes', () => {
  expect(parseCliArguments(['query', 'pending', '--plain', '--json'])).toEqual({
    message: 'Output mode accepts at most one of "--plain" or "--json".',
    success: false,
  });
});

it('rejects unsupported color values', () => {
  expect(parseCliArguments(['queries', '--color', 'blue'])).toEqual({
    message: 'Color must be one of "auto", "always", or "never".',
    success: false,
  });
});

it('rejects options that are not valid for a command', () => {
  expect(parseCliArguments(['check', '--where', 'kind=task'])).toEqual({
    message: 'Option "--where" is not valid for "check".',
    success: false,
  });
});
