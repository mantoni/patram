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
    "patram query --cypher '<query>' [options]",
  ]);
  expect(getCommandDefinition('check').usage_lines).toEqual([
    'patram check [path ...] [options]',
  ]);
  expect(getCommandDefinition('check').examples).toContain(
    'patram check docs docs/patram.md',
  );
  expect(getHelpTopicDefinition('query-language').usage_lines).toContain(
    'MATCH (n) WHERE EXISTS { MATCH ... } RETURN n',
  );
  expect(getHelpTopicDefinition('query-language').terms).toContain(
    'Structural functions: id(n), path(n)',
  );
  expect(getHelpTopicDefinition('query-language').terms).toContain(
    'Labels select class membership: MATCH (n:Label)',
  );
  expect(getHelpTopicDefinition('query-language').terms).toContain(
    'Subqueries: EXISTS { MATCH ... WHERE ... } and COUNT { MATCH ... WHERE ... }',
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

it('includes path glob query help entries', () => {
  expect(getCommandDefinition('query').syntax_lines).toContain(
    'MATCH (n) WHERE EXISTS { MATCH ... } RETURN n',
  );
  expect(getHelpTopicDefinition('query-language').operators).toContainEqual({
    description: 'Equality and exact value comparison',
    label: '= | <>',
  });
  expect(getHelpTopicDefinition('query-language').operators).toContainEqual({
    description: 'Relation existence subqueries',
    label: 'EXISTS { ... }',
  });
  expect(getHelpTopicDefinition('query-language').terms).toContain(
    'Common fields: n.title, n.status, n.kind',
  );
});

it('suggests close command, help-topic, and option matches', () => {
  expect(findCommandSuggestion('qurey')).toBe('query');
  expect(findHelpTargetSuggestion('query-lang')).toBe('query-language');
  expect(findOptionSuggestion('--ofset', 'query')).toBe('--offset');
  expect(findOptionSuggestion('--cyphe', 'query')).toBe('--cypher');
  expect(findOptionSuggestion('--limt', undefined)).toBe('--limit');
  expect(findOptionSuggestion('--ofset', undefined)).toBe('--offset');
  expect(findOptionSuggestion('--cyphe', undefined)).toBe('--cypher');
});

it('checks command and help-topic names exactly', () => {
  expect(isCommandName('query')).toBe(true);
  expect(isCommandName('unknown')).toBe(false);
  expect(isCommandName(undefined)).toBe(false);
  expect(isHelpTopicName('query-language')).toBe(true);
  expect(isHelpTopicName('unknown')).toBe(false);
  expect(isHelpTopicName(undefined)).toBe(false);
});
