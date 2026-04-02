/* eslint-disable max-lines-per-function */
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
            cypher: 'MATCH (n:Task) RETURN n',
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
            cypher: "MATCH (n:Task) WHERE n.owner = 'max' RETURN n",
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
          'Invalid config at "queries.broken.cypher": Unknown field "owner".',
        path: '.patram.json',
      },
    ],
    success: false,
  });
});

it('creates and updates stored query definitions', () => {
  expect(
    createStoredQueryDefinition('MATCH (n:Task) RETURN n', undefined),
  ).toEqual({
    cypher: 'MATCH (n:Task) RETURN n',
  });
  expect(
    createStoredQueryDefinition('MATCH (n:Task) RETURN n', 'Show tasks.'),
  ).toEqual({
    cypher: 'MATCH (n:Task) RETURN n',
    description: 'Show tasks.',
  });
  expect(createStoredQueryDefinition('MATCH (n:Task) RETURN n', '')).toEqual({
    cypher: 'MATCH (n:Task) RETURN n',
  });
  expect(
    createStoredQueryDefinition('MATCH (n:Task) RETURN n', 'Show tasks.'),
  ).toEqual({
    cypher: 'MATCH (n:Task) RETURN n',
    description: 'Show tasks.',
  });

  expect(
    createUpdatedStoredQueryDefinition(
      {
        description: 'Raw description',
      },
      {
        description: 'Existing description',
        cypher: 'MATCH (n:Task) RETURN n',
      },
      {
        cypher: "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
      },
    ),
  ).toEqual({
    description: 'Raw description',
    cypher: "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
  });
  expect(
    createUpdatedStoredQueryDefinition(
      null,
      {
        description: 'Existing description',
        cypher: 'MATCH (n:Task) RETURN n',
      },
      {
        description: '',
      },
    ),
  ).toEqual({
    cypher: 'MATCH (n:Task) RETURN n',
  });
  expect(
    createUpdatedStoredQueryDefinition(
      {},
      {
        cypher: 'MATCH (n:Task) RETURN n',
      },
      {
        description: 'Updated description',
        cypher: "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
      },
    ),
  ).toEqual({
    cypher: "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
    description: 'Updated description',
  });
  expect(
    createUpdatedStoredQueryDefinition(
      null,
      {
        cypher: 'MATCH (n:Task) RETURN n',
      },
      {},
    ),
  ).toEqual({
    cypher: 'MATCH (n:Task) RETURN n',
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
          cypher: 'MATCH (n:Task) RETURN n',
        },
      },
    }),
  ).toEqual({
    ready: {
      cypher: 'MATCH (n:Task) RETURN n',
    },
  });

  expect(rawQueryValueToRecord({ cypher: 'MATCH (n:Task) RETURN n' })).toEqual({
    cypher: 'MATCH (n:Task) RETURN n',
  });
  expect(rawQueryValueToRecord(null)).toBeNull();
  expect(rawQueryValueToRecord([])).toBeNull();
  expect(rawQueryValueToRecord(1)).toBeNull();
});

it('rethrows unexpected file-system errors while loading raw config', async () => {
  test_context.project_directory = await createTempProjectDirectory();

  await expect(
    loadRawConfig(test_context.project_directory),
  ).rejects.toMatchObject({
    code: 'EISDIR',
  });
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
    '            "cypher": "MATCH (n:Document) RETURN n"',
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
        cypher: 'MATCH (n:Document) RETURN n',
      },
      ready: {
        description: 'Show ready tasks.',
        cypher: 'MATCH (n:Command) RETURN n',
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
    '            "cypher": "MATCH (n:Document) RETURN n"',
    '        },',
    '        "ready": {',
    '            "description": "Show ready tasks.",',
    '            "cypher": "MATCH (n:Command) RETURN n"',
    '        }',
    '    },',
    '',
    '    "relations": {}',
    '}',
    '',
  ].join('\n');
}
