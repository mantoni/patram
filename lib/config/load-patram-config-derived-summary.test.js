import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { loadPatramConfig } from './load-patram-config.js';

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('rejects derived summaries in repo config', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    createDerivedSummaryConfigSource(),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result.config).toBeNull();
  expect(load_result.diagnostics).toEqual([
    {
      code: 'config.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message: 'Invalid config: Unrecognized key: "derived_summaries"',
      path: '.patram.json',
    },
  ]);
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
              where: '$class=task',
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

function createTestContext() {
  return {
    /** @type {string | null} */
    project_directory: null,
  };
}

/**
 * @param {{ project_directory: string | null }} context
 */
async function cleanupTestContext(context) {
  if (!context.project_directory) {
    return;
  }

  await removeDirectory(context.project_directory);
  context.project_directory = null;
}
