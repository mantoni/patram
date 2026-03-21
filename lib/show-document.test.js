/** @import * as $k$$l$build$j$graph$k$types$k$ts from './build-graph.types.ts'; */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { buildGraph } from './build-graph.js';
import { parseClaims } from './parse-claims.js';
import { loadShowOutput } from './show-document.js';

/** @type {string | null} */
let project_directory = null;

afterEach(async () => {
  if (project_directory) {
    await rm(project_directory, { force: true, recursive: true });
    project_directory = null;
  }
});

it('preserves the original markdown link label in rendered source and json data', async () => {
  project_directory = await mkdtemp(join(tmpdir(), 'patram-show-document-'));

  await writeProjectFile(
    project_directory,
    'docs/patram.md',
    ['# Patram', '', 'See [guide](./guide.md).'].join('\n'),
  );
  await writeProjectFile(project_directory, 'docs/guide.md', '# Some Guide\n');

  const show_output = await loadShowOutput(
    'docs/patram.md',
    project_directory,
    createGraph(),
  );

  expect(show_output).toEqual({
    success: true,
    value: {
      rendered_source: '# Patram\n\nSee [guide][1].',
      resolved_links: [
        {
          label: 'guide',
          reference: 1,
          target: {
            kind: 'document',
            path: 'docs/guide.md',
            title: 'Some Guide',
          },
        },
      ],
      source: '# Patram\n\nSee [guide](./guide.md).',
    },
  });
});

/**
 * @returns {$k$$l$build$j$graph$k$types$k$ts.BuildGraphResult}
 */
function createGraph() {
  return buildGraph(
    {
      kinds: {
        document: {
          builtin: true,
        },
      },
      relations: {
        links_to: {
          builtin: true,
          from: ['document'],
          to: ['document'],
        },
      },
      mappings: {
        'document.title': {
          node: {
            field: 'title',
            kind: 'document',
          },
        },
        'markdown.link': {
          emit: {
            relation: 'links_to',
            target: 'path',
            target_kind: 'document',
          },
        },
      },
    },
    [
      ...parseClaims({
        path: 'docs/patram.md',
        source: '# Patram\n\nSee [guide](./guide.md).',
      }),
      ...parseClaims({
        path: 'docs/guide.md',
        source: '# Some Guide\n',
      }),
    ],
  );
}

/**
 * @param {string} project_root
 * @param {string} relative_path
 * @param {string} source_text
 */
async function writeProjectFile(project_root, relative_path, source_text) {
  const file_path = join(project_root, relative_path);
  const directory_path = file_path.slice(0, file_path.lastIndexOf('/'));

  await mkdir(directory_path, { recursive: true });
  await writeFile(file_path, source_text);
}
