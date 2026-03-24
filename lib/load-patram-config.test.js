import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { loadPatramConfig } from './load-patram-config.js';

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('loads and validates .patram.json from a project directory', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    createValidConfigSource(),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result).toEqual({
    config: createExpectedValidConfig(),
    config_path: '.patram.json',
    diagnostics: [],
  });
});

it('defaults to the current working directory', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    createValidConfigSource(),
  );
  process.chdir(test_context.project_directory);

  const load_result = await loadPatramConfig();

  expect(load_result.config?.queries.pending.where).toBe(
    'kind=task and status=pending',
  );
  expect(load_result.config?.classes?.task?.label).toBe('Task');
  expect(load_result.diagnostics).toEqual([]);
});

it('returns built-in defaults when the config file is missing', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result).toEqual({
    config: {
      include: [
        '**/*.cjs',
        '**/*.cts',
        '**/*.js',
        '**/*.jsx',
        '**/*.mjs',
        '**/*.mts',
        '**/*.ts',
        '**/*.tsx',
        '**/*.markdown',
        '**/*.md',
      ],
      queries: {},
    },
    config_path: '.patram.json',
    diagnostics: [],
  });
});

it('reports invalid JSON syntax', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(test_context.project_directory, createBrokenJson());

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result.config).toBeNull();
  expect(load_result.diagnostics).toEqual([
    {
      code: 'config.invalid_json',
      column: 1,
      level: 'error',
      line: 3,
      message: 'Invalid JSON syntax.',
      path: '.patram.json',
    },
  ]);
});

it('reports config validation diagnostics', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    createInvalidConfigSource(),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result.config).toBeNull();
  expect(load_result.diagnostics).toEqual([
    {
      code: 'config.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message:
        'Invalid config at "include": Include must contain at least one glob.',
      path: '.patram.json',
    },
    {
      code: 'config.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message:
        'Invalid config at "queries.pending.where": Stored query "where" must not be empty.',
      path: '.patram.json',
    },
  ]);
});

it('reports graph schema validation diagnostics', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    createInvalidGraphConfigSource(),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result.config).toBeNull();
  expect(load_result.diagnostics).toEqual([
    {
      code: 'config.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message:
        'Invalid config at "mappings.markdown.link.emit.relation": Unknown relation "missing_relation".',
      path: '.patram.json',
    },
  ]);
});

it('uses built-in include globs when a config omits include', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    JSON.stringify({
      queries: {
        pending: {
          where: 'kind=task and status=pending',
        },
      },
    }),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result).toEqual({
    config: {
      include: [
        '**/*.cjs',
        '**/*.cts',
        '**/*.js',
        '**/*.jsx',
        '**/*.mjs',
        '**/*.mts',
        '**/*.ts',
        '**/*.tsx',
        '**/*.markdown',
        '**/*.md',
      ],
      queries: {
        pending: {
          where: 'kind=task and status=pending',
        },
      },
    },
    config_path: '.patram.json',
    diagnostics: [],
  });
});

it('loads configured derived summaries scoped by classes', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    createDerivedSummaryConfigSource(),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result.config?.derived_summaries).toEqual({
    plan_execution: {
      classes: ['plan'],
      fields: [
        {
          count: {
            traversal: 'in:tracked_in',
            where: 'links_to:*',
          },
          name: 'total_tasks',
        },
      ],
    },
  });
  expect(load_result.diagnostics).toEqual([]);
});

it('rejects reserved metadata field names', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    JSON.stringify({
      fields: {
        $class: {
          type: 'string',
        },
      },
      include: ['docs/**/*.md'],
      queries: {},
    }),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result.config).toBeNull();
  expect(load_result.diagnostics).toEqual([
    {
      code: 'config.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message:
        'Invalid config at "fields.$class": Metadata field names must not start with "$".',
      path: '.patram.json',
    },
  ]);
});

it('reports derived summary validation diagnostics', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    createInvalidDerivedSummaryConfigSource(),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result.config).toBeNull();
  expect(load_result.diagnostics).toEqual([
    {
      code: 'config.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message:
        'Invalid config at "derived_summaries.plan_execution.fields.0.count.traversal": Unknown relation "tracked_in" in derived summary traversal.',
      path: '.patram.json',
    },
  ]);
});

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
 * @param {string} project_directory
 */
async function removeDirectory(project_directory) {
  await rm(project_directory, { force: true, recursive: true });
}

/**
 * @returns {string}
 */
function createBrokenJson() {
  return ['{', '  "include": [', '}'].join('\n');
}

/**
 * @returns {string}
 */
function createInvalidConfigSource() {
  return JSON.stringify({
    include: [],
    queries: {
      pending: {
        where: '',
      },
    },
  });
}

/**
 * @returns {string}
 */
function createInvalidGraphConfigSource() {
  return JSON.stringify({
    classes: {
      document: {
        builtin: true,
      },
    },
    include: ['docs/**/*.md'],
    mappings: {
      'markdown.link': {
        emit: {
          relation: 'missing_relation',
          target: 'path',
          target_class: 'document',
        },
      },
    },
    queries: {},
    relations: {},
  });
}

/**
 * @returns {string}
 */
function createValidConfigSource() {
  return JSON.stringify(createExpectedValidConfig());
}

/**
 * @returns {object}
 */
function createExpectedValidConfig() {
  return {
    class_schemas: {
      task: {
        fields: {
          owner: {
            presence: 'optional',
          },
          status: {
            presence: 'required',
          },
        },
        unknown_fields: 'error',
      },
    },
    classes: {
      document: {
        builtin: true,
      },
      task: {
        label: 'Task',
      },
    },
    fields: {
      owner: {
        type: 'string',
      },
      status: {
        type: 'enum',
        values: ['pending', 'ready'],
      },
    },
    include: ['docs/**/*.md'],
    queries: {
      pending: {
        where: 'kind=task and status=pending',
      },
    },
  };
}

/**
 * @returns {string}
 */
function createDerivedSummaryConfigSource() {
  return JSON.stringify({
    classes: {
      document: {
        builtin: true,
      },
      plan: {
        label: 'Plan',
      },
      task: {
        label: 'Task',
      },
    },
    derived_summaries: {
      plan_execution: {
        classes: ['plan'],
        fields: [
          {
            count: {
              traversal: 'in:tracked_in',
              where: 'links_to:*',
            },
            name: 'total_tasks',
          },
        ],
      },
    },
    include: ['docs/**/*.md'],
    queries: {},
    relations: {
      tracked_in: {
        from: ['task'],
        to: ['plan'],
      },
    },
  });
}

/**
 * @returns {string}
 */
function createInvalidDerivedSummaryConfigSource() {
  return JSON.stringify({
    classes: {
      document: {
        builtin: true,
      },
      plan: {
        label: 'Plan',
      },
      task: {
        label: 'Task',
      },
    },
    derived_summaries: {
      plan_execution: {
        classes: ['plan'],
        fields: [
          {
            count: {
              traversal: 'in:tracked_in',
              where: 'links_to:*',
            },
            name: 'total_tasks',
          },
        ],
      },
    },
    include: ['docs/**/*.md'],
    queries: {},
    relations: {},
  });
}

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

  if (test_context.project_directory) {
    await removeDirectory(test_context.project_directory);
    test_context.project_directory = null;
  }
}
