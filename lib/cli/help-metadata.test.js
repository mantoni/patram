import { expect, it } from 'vitest';

import {
  findCommandSuggestion,
  findHelpTargetSuggestion,
  findOptionSuggestion,
  getCommandDefinition,
  getHelpTopicDefinition,
  getRootHelpDefinition,
  isCommandName,
  isHelpTopicName,
  listCommandNames,
  listHelpTopicNames,
} from './help-metadata.js';

it('returns stable help definitions and exported name lists', () => {
  expect(getRootHelpDefinition()).toEqual({
    global_options: [
      '--help',
      '--plain',
      '--json',
      '--color <auto|always|never>',
      '--no-color',
    ],
    summary: 'Patram explores docs and how they link to sources.',
    usage_lines: ['patram <command> [options]', 'patram help [command]'],
  });
  expect(getCommandDefinition('query').usage_lines).toEqual([
    'patram query <name> [options]',
    "patram query --where '<clause>' [options]",
  ]);
  expect(getCommandDefinition('check').usage_lines).toEqual([
    'patram check [path ...] [options]',
  ]);
  expect(getCommandDefinition('check').examples).toContain(
    'patram check docs docs/patram.md',
  );
  expect(getCommandDefinition('query').syntax_lines).toContain(
    '$id=<value> | $class=<value> | $path=<value> | $filename=<value> | status=<value>',
  );
  expect(getHelpTopicDefinition('query-language').usage_lines).toContain(
    '<relation>:*',
  );
  expect(getHelpTopicDefinition('query-language').terms).toContain(
    'Exact match: $id, $class, $path, $filename, status',
  );
  expect(getHelpTopicDefinition('query-language').terms).toContain(
    'Set membership: $id, $class, $path, $filename, status, title',
  );
  expect(listCommandNames()).toEqual([
    'check',
    'fields',
    'query',
    'queries',
    'refs',
    'show',
  ]);
  expect(listHelpTopicNames()).toEqual(['query-language']);
});

it('suggests close command, help-topic, and option matches', () => {
  expect(findCommandSuggestion('qurey')).toBe('query');
  expect(findHelpTargetSuggestion('query-lang')).toBe('query-language');
  expect(findOptionSuggestion('--ofset', 'query')).toBe('--offset');
  expect(findOptionSuggestion('--wher', undefined)).toBe('--where');
});

it('checks command and help-topic names exactly', () => {
  expect(isCommandName('query')).toBe(true);
  expect(isCommandName('unknown')).toBe(false);
  expect(isCommandName(undefined)).toBe(false);
  expect(isHelpTopicName('query-language')).toBe(true);
  expect(isHelpTopicName('unknown')).toBe(false);
  expect(isHelpTopicName(undefined)).toBe(false);
});
