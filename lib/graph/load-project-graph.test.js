/* eslint-disable max-lines-per-function */
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { loadProjectGraph } from './load-project-graph.js';

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('loads standalone YAML directives into the graph with fallback titles', async () => {
  test_context.project_directory = await createTempProjectDirectory();

  await writeProjectFile(
    test_context.project_directory,
    '.patram.json',
    JSON.stringify(createYamlFixtureConfig(), null, 2),
  );
  await writeProjectFile(
    test_context.project_directory,
    'docs/plans/v0/example.md',
    '# Example Plan\n',
  );
  await writeProjectFile(
    test_context.project_directory,
    'docs/tasks/example.yaml',
    [
      'kind: task',
      'status: active',
      'summary: YAML task',
      'tracked_in:',
      '  - docs/plans/v0/example.md',
      '  - docs/plans/v0/example.md',
      'extra:',
      '  owner: team',
    ].join('\n'),
  );

  const project_graph_result = await loadProjectGraph(
    test_context.project_directory,
  );

  expect(project_graph_result.diagnostics).toEqual([]);
  expect(project_graph_result.graph.nodes['task:example']).toEqual(
    expect.objectContaining({
      identity: {
        class_name: 'task',
        id: 'task:example',
        path: 'docs/tasks/example.yaml',
      },
      key: 'example',
      metadata: {
        status: 'active',
        summary: 'YAML task',
        title: 'example.yaml',
      },
    }),
  );
  expect(project_graph_result.graph.edges).toEqual([
    {
      from: 'task:example',
      id: 'edge:1',
      origin: {
        column: 5,
        line: 5,
        path: 'docs/tasks/example.yaml',
      },
      relation: 'tracked_in',
      to: 'plan:v0/example',
    },
    {
      from: 'task:example',
      id: 'edge:2',
      origin: {
        column: 5,
        line: 6,
        path: 'docs/tasks/example.yaml',
      },
      relation: 'tracked_in',
      to: 'plan:v0/example',
    },
  ]);
});

/**
 * @returns {{ project_directory: string | null }}
 */
function createTestContext() {
  return {
    project_directory: null,
  };
}

/**
 * @param {{ project_directory: string | null }} test_context
 */
async function cleanupTestContext(test_context) {
  if (test_context.project_directory) {
    await rm(test_context.project_directory, { force: true, recursive: true });
    test_context.project_directory = null;
  }
}

/**
 * @returns {Promise<string>}
 */
async function createTempProjectDirectory() {
  return mkdtemp(join(tmpdir(), 'patram-load-project-graph-'));
}

/**
 * @param {string} project_directory
 * @param {string} relative_path
 * @param {string} source_text
 */
async function writeProjectFile(project_directory, relative_path, source_text) {
  const file_path = join(project_directory, relative_path);
  const parent_directory = file_path.slice(0, file_path.lastIndexOf('/'));

  await mkdir(parent_directory, { recursive: true });
  await writeFile(file_path, source_text);
}

function createYamlFixtureConfig() {
  return {
    classes: {
      document: {
        builtin: true,
      },
      task: {
        identity: {
          type: 'document_path',
        },
        label: 'Task',
        schema: {
          document_path_class: 'task_docs',
        },
      },
      plan: {
        identity: {
          type: 'document_path',
        },
        label: 'Plan',
        schema: {
          document_path_class: 'plan_docs',
        },
      },
    },
    fields: {
      status: {
        type: 'string',
      },
      summary: {
        type: 'string',
      },
    },
    include: ['docs/**/*.md', 'docs/**/*.yaml'],
    mappings: {
      'document.title': {
        node: {
          class: 'document',
          field: 'title',
        },
      },
      'yaml.directive.status': {
        node: {
          class: 'task',
          field: 'status',
        },
      },
      'yaml.directive.summary': {
        node: {
          class: 'task',
          field: 'summary',
        },
      },
      'yaml.directive.tracked_in': {
        emit: {
          relation: 'tracked_in',
          target: 'path',
          target_class: 'document',
        },
      },
    },
    path_classes: {
      task_docs: {
        prefixes: ['docs/tasks/'],
      },
      plan_docs: {
        prefixes: ['docs/plans/'],
      },
    },
    queries: {},
    relations: {
      tracked_in: {
        from: ['task'],
        to: ['plan'],
      },
    },
  };
}
