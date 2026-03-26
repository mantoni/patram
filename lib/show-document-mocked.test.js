/* eslint-disable max-lines-per-function */
import { afterEach, expect, it, vi } from 'vitest';

const { parse_source_file_mock, read_file_mock } = vi.hoisted(() => ({
  parse_source_file_mock: vi.fn(),
  read_file_mock: vi.fn(),
}));

vi.mock('node:fs/promises', async () => {
  const actual_module = await vi.importActual('node:fs/promises');

  return {
    ...actual_module,
    readFile: read_file_mock,
  };
});

vi.mock('./parse-claims.js', () => ({
  parseSourceFile: parse_source_file_mock,
}));

import { loadShowOutput } from './show-document.js';

afterEach(() => {
  parse_source_file_mock.mockReset();
  read_file_mock.mockReset();
});

it('returns parse diagnostics from the source parser', async () => {
  read_file_mock.mockResolvedValue('# Broken');
  parse_source_file_mock.mockReturnValue({
    claims: [],
    diagnostics: [
      {
        code: 'parse.invalid',
        column: 1,
        level: 'error',
        line: 1,
        message: 'Broken source.',
        path: 'docs/patram.md',
      },
    ],
  });

  await expect(
    loadShowOutput('docs/patram.md', '/tmp/project', {
      document_node_ids: {},
      edges: [],
      nodes: {},
    }),
  ).resolves.toEqual({
    diagnostic: {
      code: 'parse.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message: 'Broken source.',
      path: 'docs/patram.md',
    },
    success: false,
  });
});

it('uses the first scalar value when graph fields are arrays', async () => {
  read_file_mock.mockResolvedValue('See [guide](./guide.md).');
  parse_source_file_mock.mockReturnValue({
    claims: [
      {
        id: 'markdown.link:1',
        origin: {
          column: 5,
          line: 1,
          path: 'docs/patram.md',
        },
        type: 'markdown.link',
        value: {
          target: './guide.md',
          text: 'guide',
        },
      },
    ],
    diagnostics: [],
  });

  await expect(
    loadShowOutput('docs/patram.md', '/tmp/project', {
      document_node_ids: {
        'docs/guide.md': 'decision:guide',
      },
      edges: [],
      nodes: {
        'decision:guide': {
          $class: 'decision',
          $path: 'docs/guide.md',
          id: 'decision:guide',
          path: 'docs/guide.md',
          status: ['accepted'],
          title: 'Guide Decision',
        },
      },
    }),
  ).resolves.toEqual({
    success: true,
    value: {
      incoming_summary: {},
      path: 'docs/patram.md',
      rendered_source: 'See [guide][1].',
      resolved_links: [
        {
          label: 'guide',
          reference: 1,
          target: {
            kind: 'decision',
            path: 'docs/guide.md',
            status: 'accepted',
            title: 'Guide Decision',
          },
        },
      ],
      source: 'See [guide](./guide.md).',
    },
  });
});

it('rethrows malformed link claims that do not carry structured values', async () => {
  read_file_mock.mockResolvedValue('ignored');
  parse_source_file_mock.mockReturnValue({
    claims: [
      {
        id: 'jsdoc.link:1',
        origin: {
          column: 1,
          line: 1,
          path: 'docs/patram.md',
        },
        type: 'jsdoc.link',
        value: './guide.md',
      },
    ],
    diagnostics: [],
  });

  await expect(
    loadShowOutput('docs/patram.md', '/tmp/project', {
      document_node_ids: {},
      edges: [],
      nodes: {},
    }),
  ).rejects.toThrow('Expected claim "jsdoc.link:1" to carry a markdown link.');
});

it('rethrows non-missing file errors from source loading', async () => {
  const file_error = new Error('Permission denied');

  // @ts-expect-error - Test-only errno shape for read failures.
  file_error.code = 'EACCES';
  read_file_mock.mockRejectedValue(file_error);

  await expect(
    loadShowOutput('docs/patram.md', '/tmp/project', {
      document_node_ids: {},
      edges: [],
      nodes: {},
    }),
  ).rejects.toThrow('Permission denied');
});

it('rethrows non-error read failures', async () => {
  read_file_mock.mockRejectedValue('unexpected');

  await expect(
    loadShowOutput('docs/patram.md', '/tmp/project', {
      document_node_ids: {},
      edges: [],
      nodes: {},
    }),
  ).rejects.toBe('unexpected');
});
