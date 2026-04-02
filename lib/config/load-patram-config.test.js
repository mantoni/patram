import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { loadPatramConfig } from './load-patram-config.js';

const VALID_CONFIG = {
  fields: {
    command: {
      hidden: true,
      on: ['command'],
      type: 'string',
    },
    status: {
      type: 'enum',
      values: ['pending'],
    },
    tracked_in: {
      many: true,
      to: 'document',
      type: 'ref',
    },
  },
  include: ['docs/**/*.md'],
  queries: {
    pending: {
      cypher: "MATCH (n:Task) WHERE n.status = 'pending' RETURN n",
      description: 'Show pending tasks.',
    },
  },
  types: {
    command: {
      defined_by: 'command',
      label: 'Command',
    },
    task: {
      in: 'docs/tasks/**/*.md',
      label: 'Task',
    },
  },
};

const VALID_CONFIG_SOURCE = JSON.stringify(VALID_CONFIG);

const EXPECTED_VALID_CONFIG = {
  ...VALID_CONFIG,
  types: {
    ...VALID_CONFIG.types,
    task: {
      ...VALID_CONFIG.types.task,
      in: ['docs/tasks/**/*.md'],
    },
  },
};

const LEGACY_CONFIG = {
  classes: {
    task: {
      label: 'Task',
    },
  },
  include: ['docs/**/*.md'],
  mappings: {},
  path_classes: {},
  queries: {},
  relations: {},
};

const LEGACY_CONFIG_SOURCE = JSON.stringify(LEGACY_CONFIG);

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('loads a valid types-and-fields config', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(test_context.project_directory, VALID_CONFIG_SOURCE);

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result).toEqual({
    config: EXPECTED_VALID_CONFIG,
    config_path: '.patram.json',
    diagnostics: [],
  });
});

it('rejects legacy top-level config keys', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    LEGACY_CONFIG_SOURCE,
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result.config).toBeNull();
  expect(load_result.diagnostics).toEqual([
    expect.objectContaining({
      message:
        'Invalid config at "classes": Top-level "classes" is not supported. Use "types".',
    }),
    expect.objectContaining({
      message:
        'Invalid config at "mappings": Top-level "mappings" is not supported.',
    }),
    expect.objectContaining({
      message:
        'Invalid config at "path_classes": Top-level "path_classes" is not supported.',
    }),
    expect.objectContaining({
      message:
        'Invalid config at "relations": Top-level "relations" is not supported. Use ref fields.',
    }),
  ]);
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
 * @returns {Promise<string>}
 */
async function createTempProjectDirectory() {
  return mkdtemp(join(tmpdir(), 'patram-load-config-'));
}

/**
 * @param {{ original_working_directory: string, project_directory: string | null }} current_test_context
 */
async function cleanupTestContext(current_test_context) {
  process.chdir(current_test_context.original_working_directory);

  if (current_test_context.project_directory) {
    await rm(current_test_context.project_directory, {
      force: true,
      recursive: true,
    });
    current_test_context.project_directory = null;
  }
}

/**
 * @param {string} project_directory
 * @param {string} config_source
 */
async function writeProjectConfig(project_directory, config_source) {
  await writeFile(join(project_directory, '.patram.json'), config_source);
}
