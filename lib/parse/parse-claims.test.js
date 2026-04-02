import { expect, it } from 'vitest';

import { parseSourceFile } from './parse-claims.js';

it('extracts markdown title, directives, and links with lower_snake_case metadata', () => {
  const parse_result = parseSourceFile({
    path: 'docs/patram.md',
    source: [
      '# Patram',
      '',
      'kind: cli',
      'tracked_in: docs/plans/v0/source-anchor-dogfooding.md',
      '',
      'See [guide](./guide.md).',
    ].join('\n'),
  });

  expect(parse_result.diagnostics).toEqual([]);
  expect(parse_result.claims).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: 'document.title',
        value: 'Patram',
      }),
      expect.objectContaining({
        type: 'document.description',
        value: 'See [guide](./guide.md).',
      }),
      expect.objectContaining({
        name: 'kind',
        type: 'directive',
        value: 'cli',
      }),
      expect.objectContaining({
        name: 'tracked_in',
        type: 'directive',
        value: 'docs/plans/v0/source-anchor-dogfooding.md',
      }),
      expect.objectContaining({
        type: 'markdown.link',
        value: {
          target: './guide.md',
          text: 'guide',
        },
      }),
    ]),
  );
});

it('extracts standalone YAML directives from exact field names', () => {
  const parse_result = parseSourceFile({
    path: 'docs/tasks/v0/query-command.yaml',
    source: ['kind: task', 'status: pending'].join('\n'),
  });

  expect(parse_result).toEqual({
    claims: [
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
    ],
    diagnostics: [],
  });
});

it('does not parse hidden markdown directives', () => {
  const parse_result = parseSourceFile({
    path: 'docs/tasks/v0/query-command.md',
    source: [
      '# Implement query command',
      '',
      '[patram kind=task]: #',
      '[patram tracked_in=docs/roadmap/v0-dogfood.md]: #',
    ].join('\n'),
  });

  expect(parse_result.diagnostics).toEqual([]);
  expect(
    parse_result.claims.filter((claim) => claim.type === 'directive'),
  ).toEqual([]);
});
