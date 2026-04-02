import { expect, it } from 'vitest';

import { parseSourceFile } from '../parse-claims.js';

const ACTIVATED_JSDOC_SOURCE = [
  '/**',
  ' * Implement query command.',
  ' *',
  ' * Query execution should load a graph and print matching documents.',
  ' *',
  ' * kind: task',
  ' * status: pending',
  ' * tracked_in: docs/roadmap/v0-dogfood.md',
  ' *',
  ' * @patram',
  ' * @see ../docs/patram.md',
  ' */',
  'export function runQuery() {}',
].join('\n');

it('extracts lower_snake_case directives and links from an activated JSDoc block', () => {
  const parse_result = parseSourceFile({
    path: 'src/query-command.js',
    source: ACTIVATED_JSDOC_SOURCE,
  });

  expect(parse_result.diagnostics).toEqual([]);
  expect(parse_result.claims).toEqual([
    expect.objectContaining({
      type: 'document.title',
      value: 'Implement query command.',
    }),
    expect.objectContaining({
      type: 'document.description',
      value:
        'Query execution should load a graph and print matching documents.',
    }),
    expect.objectContaining({
      name: 'kind',
      type: 'directive',
      value: 'task',
    }),
    expect.objectContaining({
      name: 'status',
      type: 'directive',
      value: 'pending',
    }),
    expect.objectContaining({
      name: 'tracked_in',
      type: 'directive',
      value: 'docs/roadmap/v0-dogfood.md',
    }),
    expect.objectContaining({
      type: 'jsdoc.link',
      value: {
        target: '../docs/patram.md',
        text: '../docs/patram.md',
      },
    }),
  ]);
});

it('keeps explicit labels from inline @see links', () => {
  const claims = parseSourceFile({
    path: 'src/query-command.js',
    source: [
      '/**',
      ' * Implement query command.',
      ' *',
      ' * command: query',
      ' *',
      ' * @patram',
      ' * @see {@link ../docs/patram.md Patram Guide}',
      ' */',
      'export function runQuery() {}',
    ].join('\n'),
  }).claims;

  expect(claims.at(-1)).toEqual(
    expect.objectContaining({
      type: 'jsdoc.link',
      value: {
        target: '../docs/patram.md',
        text: 'Patram Guide',
      },
    }),
  );
});

it('reports multiple activated JSDoc blocks', () => {
  const parse_result = parseSourceFile({
    path: 'src/query-command.js',
    source: [
      '/**',
      ' * First block.',
      ' *',
      ' * kind: task',
      ' *',
      ' * @patram',
      ' */',
      'export function runQuery() {}',
      '',
      '/**',
      ' * Second block.',
      ' *',
      ' * kind: task',
      ' *',
      ' * @patram',
      ' */',
    ].join('\n'),
  });

  expect(parse_result.claims).toEqual([
    expect.objectContaining({
      type: 'document.title',
      value: 'First block.',
    }),
    expect.objectContaining({
      name: 'kind',
      type: 'directive',
      value: 'task',
    }),
  ]);
  expect(parse_result.diagnostics).toEqual([
    {
      code: 'jsdoc.multiple_patram_blocks',
      column: 4,
      level: 'error',
      line: 15,
      message:
        'File "src/query-command.js" contains multiple JSDoc blocks with "@patram".',
      path: 'src/query-command.js',
    },
  ]);
});

it('does not treat glob strings as JSDoc block starts', () => {
  const parse_result = parseSourceFile({
    path: 'src/query-command.js',
    source: [
      "const include = ['docs/tasks/**/*.md'];",
      '',
      '/**',
      ' * Query command docs.',
      ' *',
      ' * command: query',
      ' *',
      ' * @patram',
      ' */',
      'export function runQuery() {}',
    ].join('\n'),
  });

  expect(parse_result.diagnostics).toEqual([]);
  expect(
    parse_result.claims.filter((claim) => claim.type === 'directive'),
  ).toEqual([
    expect.objectContaining({
      name: 'command',
      value: 'query',
    }),
  ]);
});
