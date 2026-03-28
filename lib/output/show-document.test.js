/**
 * @import { BuildGraphResult } from './build-graph.types.ts';
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { buildGraph } from './build-graph.js';
import { parseClaims } from './parse-claims.js';
import {
  createDecisionNode,
  createGraphEdge,
  createReconcileNode,
  createResumeNode,
  createTaskNode,
} from './reverse-reference-test-helpers.js';
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
      incoming_summary: {},
      path: 'docs/patram.md',
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

it('resolves promoted document-backed link targets through canonical path aliases', async () => {
  project_directory = await mkdtemp(join(tmpdir(), 'patram-show-document-'));

  await writeProjectFile(
    project_directory,
    'docs/patram.md',
    createPromotedSourceDocument(),
  );
  await writeProjectFile(
    project_directory,
    'docs/decisions/query-language.md',
    '# Query Language\n',
  );

  const show_output = await loadShowOutput(
    'docs/patram.md',
    project_directory,
    createPromotedAliasGraph(),
  );

  expect(show_output).toEqual(createExpectedPromotedShowOutput());
});

it('falls back to the resolved target path and link label when no graph node matches', async () => {
  project_directory = await mkdtemp(join(tmpdir(), 'patram-show-document-'));

  await writeProjectFile(
    project_directory,
    'docs/patram.md',
    ['# Patram', '', 'See [guide](./guide.md).'].join('\n'),
  );

  const show_output = await loadShowOutput(
    'docs/patram.md',
    project_directory,
    {
      document_node_ids: {},
      edges: [],
      nodes: {},
    },
  );

  expect(show_output).toEqual({
    success: true,
    value: {
      incoming_summary: {},
      path: 'docs/patram.md',
      rendered_source: '# Patram\n\nSee [guide][1].',
      resolved_links: [
        {
          label: 'guide',
          reference: 1,
          target: {
            path: 'docs/guide.md',
            title: 'guide',
          },
        },
      ],
      source: '# Patram\n\nSee [guide](./guide.md).',
    },
  });
});

it('includes incoming summary counts grouped by relation', async () => {
  project_directory = await mkdtemp(join(tmpdir(), 'patram-show-document-'));

  await writeProjectFile(
    project_directory,
    'docs/decisions/query-language.md',
    '# Query Language\n',
  );

  const show_output = await loadShowOutput(
    'docs/decisions/query-language.md',
    project_directory,
    createIncomingSummaryGraph(),
  );

  expect(show_output).toEqual({
    success: true,
    value: {
      incoming_summary: {
        decided_by: 2,
        implements: 1,
      },
      path: 'docs/decisions/query-language.md',
      rendered_source: '# Query Language',
      resolved_links: [],
      source: '# Query Language\n',
    },
  });
});

/**
 * @returns {BuildGraphResult}
 */
function createGraph() {
  return buildGraph(
    {
      classes: {
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
            class: 'document',
            field: 'title',
          },
        },
        'markdown.link': {
          emit: {
            relation: 'links_to',
            target: 'path',
            target_class: 'document',
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

function createPromotedSourceDocument() {
  return [
    '# Patram',
    '',
    'See [decision](./decisions/query-language.md).',
  ].join('\n');
}

/**
 * @returns {BuildGraphResult}
 */
function createPromotedAliasGraph() {
  /** @type {BuildGraphResult} */
  const graph = {
    edges: [],
    nodes: {
      'decision:query-language': {
        $class: 'decision',
        $id: 'decision:query-language',
        $path: 'docs/decisions/query-language.md',
        id: 'decision:query-language',
        path: 'docs/decisions/query-language.md',
        status: 'accepted',
        title: 'Query Language',
      },
    },
  };

  graph.document_node_ids = {
    'docs/decisions/query-language.md': 'decision:query-language',
  };

  return graph;
}

function createExpectedPromotedShowOutput() {
  return {
    success: true,
    value: {
      incoming_summary: {},
      path: 'docs/patram.md',
      rendered_source: '# Patram\n\nSee [decision][1].',
      resolved_links: [
        {
          label: 'decision',
          reference: 1,
          target: {
            kind: 'decision',
            path: 'docs/decisions/query-language.md',
            status: 'accepted',
            title: 'Query Language',
          },
        },
      ],
      source: '# Patram\n\nSee [decision](./decisions/query-language.md).',
    },
  };
}

/**
 * @returns {BuildGraphResult}
 */
function createIncomingSummaryGraph() {
  return {
    document_node_ids: {
      'docs/decisions/query-language.md': 'decision:query-language',
    },
    edges: [
      createGraphEdge(
        'edge:1',
        'doc:lib/reconcile.js',
        'lib/reconcile.js',
        'decided_by',
        'decision:query-language',
      ),
      createGraphEdge(
        'edge:2',
        'doc:lib/resume.js',
        'lib/resume.js',
        'decided_by',
        'decision:query-language',
      ),
      createGraphEdge(
        'edge:3',
        'task:reverse-reference-inspection',
        'docs/tasks/v0/reverse-reference-inspection.md',
        'implements',
        'decision:query-language',
      ),
    ],
    nodes: {
      'decision:query-language': createDecisionNode(),
      'doc:lib/reconcile.js': createReconcileNode(),
      'doc:lib/resume.js': createResumeNode(),
      'task:reverse-reference-inspection': createTaskNode(),
    },
  };
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
