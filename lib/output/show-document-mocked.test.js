/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable max-lines-per-function */
import { afterEach, expect, it, vi } from 'vitest';

const { parseSourceFileMock, readFileMock } = vi.hoisted(() => ({
  parseSourceFileMock: vi.fn(),
  readFileMock: vi.fn(),
}));

vi.mock('node:fs/promises', async () => {
  const actual_module = await vi.importActual('node:fs/promises');

  return {
    ...actual_module,
    readFile: readFileMock,
  };
});

vi.mock('../parse/parse-claims.js', () => ({
  parseSourceFile: parseSourceFileMock,
}));

import { loadShowOutput } from './show-document.js';

afterEach(() => {
  parseSourceFileMock.mockReset();
  readFileMock.mockReset();
});

it('returns parse diagnostics from the source parser', async () => {
  readFileMock.mockResolvedValue('# Broken');
  parseSourceFileMock.mockReturnValue({
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
      document_path_ids: {},
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
  readFileMock.mockResolvedValue('See [guide](./guide.md).');
  parseSourceFileMock.mockReturnValue({
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
      document_path_ids: {
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
  readFileMock.mockResolvedValue('ignored');
  parseSourceFileMock.mockReturnValue({
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
      document_path_ids: {},
      edges: [],
      nodes: {},
    }),
  ).rejects.toThrow('Expected claim "jsdoc.link:1" to carry a markdown link.');
});

it('rethrows non-missing file errors from source loading', async () => {
  const file_error = new Error('Permission denied');

  // @ts-expect-error - Test-only errno shape for read failures.
  file_error.code = 'EACCES';
  readFileMock.mockRejectedValue(file_error);

  await expect(
    loadShowOutput('docs/patram.md', '/tmp/project', {
      document_path_ids: {},
      edges: [],
      nodes: {},
    }),
  ).rejects.toThrow('Permission denied');
});

it('rethrows non-error read failures', async () => {
  readFileMock.mockRejectedValue('unexpected');

  await expect(
    loadShowOutput('docs/patram.md', '/tmp/project', {
      document_path_ids: {},
      edges: [],
      nodes: {},
    }),
  ).rejects.toBe('unexpected');
});
