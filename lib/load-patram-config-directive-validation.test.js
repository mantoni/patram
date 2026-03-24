import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { loadPatramConfig } from './load-patram-config.js';

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('loads configured directive validation sections', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    createDirectiveValidationConfigSource(),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result.config).toEqual(createExpectedDirectiveValidationConfig());
  expect(load_result.diagnostics).toEqual([]);
});

it('reports directive validation config diagnostics', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    createInvalidDirectiveValidationConfigSource(),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result.config).toBeNull();
  expect(load_result.diagnostics).toEqual(
    createExpectedDirectiveValidationDiagnostics(),
  );
});

/**
 * @returns {{ original_working_directory: string, project_directory: string | null }}
 */
function createTestContext() {
  return {
    original_working_directory: process.cwd(),
    project_directory: null,
  };
}

/**
 * @param {{ original_working_directory: string, project_directory: string | null }} test_context
 */
async function cleanupTestContext(test_context) {
  process.chdir(test_context.original_working_directory);

  if (!test_context.project_directory) {
    return;
  }

  await rm(test_context.project_directory, { force: true, recursive: true });
  test_context.project_directory = null;
}

/**
 * @returns {Promise<string>}
 */
async function createTempProjectDirectory() {
  return mkdtemp(join(tmpdir(), 'patram-load-config-'));
}

/**
 * @param {string} project_directory
 * @param {string} config_source
 */
async function writeProjectConfig(project_directory, config_source) {
  await writeFile(join(project_directory, '.patram.json'), config_source);
}

/**
 * @returns {string}
 */
function createDirectiveValidationConfigSource() {
  return JSON.stringify(createExpectedDirectiveValidationConfig());
}

/**
 * @returns {object}
 */
function createExpectedDirectiveValidationConfig() {
  return {
    directive_types: {
      status: {
        type: 'string',
      },
      tracked_in: {
        path_class: 'plan_docs',
        type: 'path',
      },
    },
    include: ['docs/**/*.md'],
    metadata_schemas: {
      task: {
        directives: {
          execution: {
            presence: 'forbidden',
          },
          status: {
            presence: 'required',
            type: {
              type: 'enum',
              values: ['pending', 'ready'],
            },
          },
          tracked_in: {
            presence: 'required',
          },
        },
        document_path_class: 'task_docs',
        unknown_directives: 'error',
      },
    },
    path_classes: {
      plan_docs: {
        prefixes: ['docs/plans/'],
      },
      task_docs: {
        prefixes: ['docs/tasks/'],
      },
    },
    queries: {},
  };
}

/**
 * @returns {string}
 */
function createInvalidDirectiveValidationConfigSource() {
  return JSON.stringify({
    directive_types: {
      status: {
        path_class: 'plan_docs',
        type: 'string',
      },
    },
    include: ['docs/**/*.md'],
    metadata_schemas: {
      task: {
        directives: {
          tracked_in: {
            presence: 'required',
            type: {
              path_class: 'missing_docs',
              type: 'path',
            },
          },
        },
        document_path_class: 'task_docs',
      },
    },
    path_classes: {
      plan_docs: {
        prefixes: ['docs/plans/'],
      },
    },
    queries: {},
  });
}

/**
 * @returns {Array<{ code: string, column: number, level: 'error', line: number, message: string, path: string }>}
 */
function createExpectedDirectiveValidationDiagnostics() {
  return [
    createDiagnostic(
      'Invalid config at "directive_types.status.path_class": Path classes are only valid for path directive types.',
    ),
    createDiagnostic(
      'Invalid config at "metadata_schemas.task.document_path_class": Unknown path class "task_docs".',
    ),
    createDiagnostic(
      'Invalid config at "metadata_schemas.task.directives.tracked_in.type.path_class": Unknown path class "missing_docs".',
    ),
  ];
}

/**
 * @param {string} message
 * @returns {{ code: string, column: number, level: 'error', line: number, message: string, path: string }}
 */
function createDiagnostic(message) {
  return {
    code: 'config.invalid',
    column: 1,
    level: 'error',
    line: 1,
    message,
    path: '.patram.json',
  };
}
