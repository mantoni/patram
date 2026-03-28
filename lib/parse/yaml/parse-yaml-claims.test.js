import { expect, it } from 'vitest';

import {
  parseYamlClaims,
  parseYamlDirectiveFields,
} from './parse-yaml-claims.js';

it('returns no result for unsupported standalone source extensions', () => {
  expect(
    parseYamlClaims({
      path: 'docs/tasks/example.md',
      source: 'kind: task\n',
    }),
  ).toEqual({
    claims: [],
    diagnostics: [],
  });
});

it('stringifies YAML booleans and numbers and ignores null and binary scalars', () => {
  expect(
    parseYamlClaims({
      path: 'docs/tasks/example.yaml',
      source: [
        'flag: true',
        'count: 4',
        'missing: null',
        'payload: !!binary SGVsbG8=',
      ].join('\n'),
    }),
  ).toEqual({
    claims: [
      {
        document_id: 'doc:docs/tasks/example.yaml',
        id: 'claim:doc:docs/tasks/example.yaml:1',
        name: 'flag',
        origin: {
          column: 1,
          line: 1,
          path: 'docs/tasks/example.yaml',
        },
        parser: 'yaml',
        type: 'directive',
        value: 'true',
      },
      {
        document_id: 'doc:docs/tasks/example.yaml',
        id: 'claim:doc:docs/tasks/example.yaml:2',
        name: 'count',
        origin: {
          column: 1,
          line: 2,
          path: 'docs/tasks/example.yaml',
        },
        parser: 'yaml',
        type: 'directive',
        value: '4',
      },
    ],
    diagnostics: [],
  });
});

it('emits scalar lists only for configured multi-valued directives', () => {
  expect(
    parseYamlClaims(
      {
        path: 'docs/tasks/example.yaml',
        source: [
          'tracked_in:',
          '  - docs/plans/v0/example.md',
          'owners:',
          '  - max',
          'mixed:',
          '  - docs/plans/v0/example.md',
          '  - owner: team',
        ].join('\n'),
      },
      {
        multi_value_directive_names: new Set(['tracked_in', 'mixed']),
      },
    ),
  ).toEqual({
    claims: [
      {
        document_id: 'doc:docs/tasks/example.yaml',
        id: 'claim:doc:docs/tasks/example.yaml:1',
        name: 'tracked_in',
        origin: {
          column: 5,
          line: 2,
          path: 'docs/tasks/example.yaml',
        },
        parser: 'yaml',
        type: 'directive',
        value: 'docs/plans/v0/example.md',
      },
    ],
    diagnostics: [],
  });
});

it('reports an empty YAML source as invalid input', () => {
  expect(
    parseYamlDirectiveFields({
      file_path: 'docs/tasks/example.yaml',
      parser: 'yaml',
      source_text: '',
      start_line: 1,
    }),
  ).toEqual({
    diagnostics: [
      {
        code: 'yaml.multiple_documents',
        column: 1,
        level: 'error',
        line: 1,
        message: 'Patram YAML sources must contain exactly one document.',
        path: 'docs/tasks/example.yaml',
      },
    ],
    directive_fields: [],
  });
});
