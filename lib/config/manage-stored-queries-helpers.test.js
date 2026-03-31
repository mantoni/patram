import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import {
  createStoredQueryDefinition,
  createUpdatedStoredQueryDefinition,
  ensureRawQueries,
  loadRawConfig,
  persistStoredQueryMutation,
  rawQueryValueToRecord,
} from './manage-stored-queries-helpers.js';

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('loads a missing config file as an empty object', async () => {
  test_context.project_directory = await createTempProjectDirectory();

  await expect(
    loadRawConfig(join(test_context.project_directory, '.patram.json')),
  ).resolves.toEqual({
    success: true,
    value: {},
  });
});

it('reports invalid non-object config roots', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeFile(join(test_context.project_directory, '.patram.json'), '[]\n');

  await expect(
    loadRawConfig(join(test_context.project_directory, '.patram.json')),
  ).resolves.toEqual({
    diagnostic: {
      code: 'config.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message: 'Invalid config: Expected a top-level object.',
      path: '.patram.json',
    },
    success: false,
  });
});

it('persists valid stored query mutations', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const config_file_path = join(test_context.project_directory, '.patram.json');

  await expect(
    persistStoredQueryMutation(
      config_file_path,
      {
        queries: {
          ready: {
            where: '$class=task',
          },
        },
      },
      {
        action: 'added',
        name: 'ready',
      },
    ),
  ).resolves.toEqual({
    success: true,
    value: {
      action: 'added',
      name: 'ready',
    },
  });
  await expect(readFile(config_file_path, 'utf8')).resolves.toContain(
    '"ready"',
  );
});

it('preserves surrounding config formatting when persisting stored query edits', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const config_file_path = join(test_context.project_directory, '.patram.json');

  await writeFile(config_file_path, createFormattedConfigSource());

  await expect(
    persistStoredQueryMutation(config_file_path, createUpdatedRawConfig(), {
      action: 'added',
      name: 'ready',
    }),
  ).resolves.toEqual({
    success: true,
    value: {
      action: 'added',
      name: 'ready',
    },
  });

  await expect(readFile(config_file_path, 'utf8')).resolves.toEqual(
    createExpectedFormattedConfigSource(),
  );
});

it('rejects invalid stored query mutations during persistence', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const config_file_path = join(test_context.project_directory, '.patram.json');

  await expect(
    persistStoredQueryMutation(
      config_file_path,
      {
        fields: {
          status: {
            type: 'string',
          },
        },
        queries: {
          broken: {
            where: '$class=task and owner=max',
          },
        },
      },
      {
        action: 'added',
        name: 'broken',
      },
    ),
  ).resolves.toEqual({
    diagnostics: [
      {
        code: 'config.invalid',
        column: 1,
        level: 'error',
        line: 1,
        message:
          'Invalid config at "queries.broken.where": Unknown field "owner".',
        path: '.patram.json',
      },
    ],
    success: false,
  });
});

it('creates and updates stored query definitions', () => {
  expect(createStoredQueryDefinition('$class=task', undefined)).toEqual({
    where: '$class=task',
  });
  expect(createStoredQueryDefinition('$class=task', '')).toEqual({
    where: '$class=task',
  });
  expect(createStoredQueryDefinition('$class=task', 'Show tasks.')).toEqual({
    description: 'Show tasks.',
    where: '$class=task',
  });

  expect(
    createUpdatedStoredQueryDefinition(
      {
        description: 'Raw description',
      },
      {
        description: 'Existing description',
        where: '$class=task',
      },
      {
        where: '$class=task and status=ready',
      },
    ),
  ).toEqual({
    description: 'Raw description',
    where: '$class=task and status=ready',
  });
  expect(
    createUpdatedStoredQueryDefinition(
      null,
      {
        description: 'Existing description',
        where: '$class=task',
      },
      {
        description: '',
      },
    ),
  ).toEqual({
    where: '$class=task',
  });
});

it('normalizes raw query records', () => {
  /** @type {Record<string, unknown>} */
  const raw_config = {};

  expect(ensureRawQueries(raw_config)).toEqual({});
  expect(raw_config).toEqual({
    queries: {},
  });
  expect(
    ensureRawQueries({
      queries: {
        ready: {
          where: '$class=task',
        },
      },
    }),
  ).toEqual({
    ready: {
      where: '$class=task',
    },
  });

  expect(rawQueryValueToRecord({ where: '$class=task' })).toEqual({
    where: '$class=task',
  });
  expect(rawQueryValueToRecord(null)).toBeNull();
  expect(rawQueryValueToRecord([])).toBeNull();
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

async function createTempProjectDirectory() {
  return mkdtemp(join(tmpdir(), 'patram-stored-query-helpers-'));
}

function createFormattedConfigSource() {
  return [
    '{',
    '    "include": ["docs/**/*.md"],',
    '',
    '    "queries": {',
    '        "blocked": {',
    '            "where": "$class=document"',
    '        }',
    '    },',
    '',
    '    "relations": {}',
    '}',
    '',
  ].join('\n');
}

function createUpdatedRawConfig() {
  return {
    include: ['docs/**/*.md'],
    queries: {
      blocked: {
        where: '$class=document',
      },
      ready: {
        description: 'Show ready tasks.',
        where: '$class=command',
      },
    },
    relations: {},
  };
}

function createExpectedFormattedConfigSource() {
  return [
    '{',
    '    "include": ["docs/**/*.md"],',
    '',
    '    "queries": {',
    '        "blocked": {',
    '            "where": "$class=document"',
    '        },',
    '        "ready": {',
    '            "description": "Show ready tasks.",',
    '            "where": "$class=command"',
    '        }',
    '    },',
    '',
    '    "relations": {}',
    '}',
    '',
  ].join('\n');
}
