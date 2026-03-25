import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { loadPatramConfig } from './load-patram-config.js';

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('loads configured field schema sections', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    createFieldSchemaConfigSource(),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result.config).toEqual(createExpectedFieldSchemaConfig());
  expect(load_result.diagnostics).toEqual([]);
});

it('reports field schema config diagnostics', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    createInvalidFieldSchemaConfigSource(),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result.config).toBeNull();
  expect(load_result.diagnostics).toEqual(
    createExpectedFieldSchemaDiagnostics(),
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
function createFieldSchemaConfigSource() {
  return JSON.stringify(createExpectedFieldSchemaConfig());
}

/**
 * @returns {object}
 */
function createExpectedFieldSchemaConfig() {
  return {
    classes: {
      document: {
        builtin: true,
      },
      task: {
        label: 'Task',
        schema: {
          document_path_class: 'task_docs',
          fields: createExpectedTaskFieldRules(),
          unknown_fields: 'error',
        },
      },
    },
    fields: createExpectedFieldDefinitions(),
    include: ['docs/**/*.md'],
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
function createInvalidFieldSchemaConfigSource() {
  return JSON.stringify({
    classes: {
      document: {
        builtin: true,
      },
      missing_task: {
        schema: {
          document_path_class: 'task_docs',
          fields: {
            tracked_in: {
              presence: 'required',
            },
          },
        },
      },
      task: {
        label: 'Task',
        schema: {
          fields: {
            missing_field: {
              presence: 'required',
            },
          },
        },
      },
    },
    fields: createInvalidFieldDefinitions(),
    include: ['docs/**/*.md'],
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
function createExpectedFieldSchemaDiagnostics() {
  return [
    createDiagnostic(
      'Invalid config at "fields.status.path_class": Path classes are only valid for path fields.',
    ),
    createDiagnostic(
      'Invalid config at "fields.tracked_in.display.order": Display order must be a non-negative integer.',
    ),
    createDiagnostic(
      'Invalid config at "fields.tracked_in.path_class": Unknown path class "missing_docs".',
    ),
    createDiagnostic(
      'Invalid config at "classes.task.schema.fields.missing_field": Unknown field "missing_field".',
    ),
    createDiagnostic(
      'Invalid config at "classes.missing_task.schema.document_path_class": Unknown path class "task_docs".',
    ),
  ];
}

function createExpectedTaskFieldRules() {
  return {
    execution: {
      presence: 'forbidden',
    },
    status: {
      presence: 'required',
    },
    tracked_in: {
      presence: 'required',
    },
  };
}

function createExpectedFieldDefinitions() {
  return {
    execution: {
      display: {
        hidden: true,
      },
      type: 'string',
    },
    status: {
      display: {
        order: 10,
      },
      type: 'enum',
      values: ['pending', 'ready'],
    },
    tracked_in: {
      multiple: true,
      path_class: 'plan_docs',
      type: 'path',
    },
  };
}

function createInvalidFieldDefinitions() {
  return {
    status: {
      path_class: 'plan_docs',
      type: 'string',
    },
    tracked_in: {
      display: {
        order: -1,
      },
      path_class: 'missing_docs',
      type: 'path',
    },
  };
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
