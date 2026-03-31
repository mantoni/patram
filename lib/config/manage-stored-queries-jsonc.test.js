import { expect, it } from 'vitest';

import { applyStoredQueryMutationToConfigSource } from './manage-stored-queries-jsonc.js';

it('removes stored query entries without rewriting surrounding config', () => {
  const config_source = [
    '{',
    '\t"include": ["docs/**/*.md"],',
    '',
    '\t"queries": {',
    '\t\t"ready": {',
    '\t\t\t"where": "$class=document"',
    '\t\t},',
    '\t\t"blocked": {',
    '\t\t\t"where": "$class=command"',
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
          where: '$class=command',
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
      '\t\t\t"where": "$class=command"',
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
    '            "where": "$class=document"',
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
          where: '$class=command',
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
      '            "where": "$class=command"',
      '        }',
      '    }',
      '}',
      '',
    ].join('\r\n'),
  );
});
