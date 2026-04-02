import { expect, it } from 'vitest';

import { applyStoredQueryMutationToConfigSource } from './manage-stored-queries-jsonc.js';

it('removes stored query entries without rewriting surrounding config', () => {
  const config_source = [
    '{',
    '\t"include": ["docs/**/*.md"],',
    '',
    '\t"queries": {',
    '\t\t"ready": {',
    '\t\t\t"cypher": "MATCH (n:Document) RETURN n"',
    '\t\t},',
    '\t\t"blocked": {',
    '\t\t\t"cypher": "MATCH (n:Command) RETURN n"',
    '\t\t}',
    '\t}',
    '}',
    '',
  ].join('\n');

  expect(
    applyStoredQueryMutationToConfigSource(
      config_source,
      {
        blocked: {
          cypher: 'MATCH (n:Command) RETURN n',
        },
      },
      {
        action: 'removed',
        name: 'ready',
      },
    ),
  ).toEqual(
    [
      '{',
      '\t"include": ["docs/**/*.md"],',
      '',
      '\t"queries": {',
      '\t\t"blocked": {',
      '\t\t\t"cypher": "MATCH (n:Command) RETURN n"',
      '\t\t}',
      '\t}',
      '}',
      '',
    ].join('\n'),
  );
});

it('renames stored query entries and preserves crlf formatting', () => {
  const config_source = [
    '{',
    '    "queries": {',
    '        "blocked": {',
    '            "cypher": "MATCH (n:Document) RETURN n"',
    '        }',
    '    }',
    '}',
    '',
  ].join('\r\n');

  expect(
    applyStoredQueryMutationToConfigSource(
      config_source,
      {
        done: {
          description: 'Show done commands.',
          cypher: 'MATCH (n:Command) RETURN n',
        },
      },
      {
        action: 'updated',
        name: 'done',
        previous_name: 'blocked',
      },
    ),
  ).toEqual(
    [
      '{',
      '    "queries": {',
      '        "done": {',
      '            "description": "Show done commands.",',
      '            "cypher": "MATCH (n:Command) RETURN n"',
      '        }',
      '    }',
      '}',
      '',
    ].join('\r\n'),
  );
});
