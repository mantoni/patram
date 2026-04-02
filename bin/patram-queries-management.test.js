// @module-tag integration

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

import { afterEach, expect, it } from 'vitest';

import {
  cleanupTestContext,
  createIoContext,
  createTempProjectDirectory,
  createTestContext,
  writeProjectConfig,
} from './patram.test-helpers.js';
import { main } from './patram.js';

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('adds a stored query to config through queries add', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  process.chdir(test_context.project_directory);

  const exit_code = await main(
    [
      'queries',
      'add',
      'ready',
      '--cypher',
      "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
    ],
    {
      stderr: io_context.stderr,
      stdout: io_context.stdout,
    },
  );
  const config_json = await readProjectConfig(test_context.project_directory);

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual(['Added stored query: ready\n']);
  expect(config_json.queries.ready).toEqual({
    cypher: "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
  });
  expect(config_json.queries.pending).toEqual({
    cypher: "MATCH (n:Task) WHERE n.status = 'pending' RETURN n",
  });
});

it('updates a stored query name, Cypher query, and description through queries update', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  process.chdir(test_context.project_directory);

  const exit_code = await main(
    [
      'queries',
      'update',
      'blocked',
      '--name',
      'ready',
      '--cypher',
      "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
      '--desc',
      '',
    ],
    {
      stderr: io_context.stderr,
      stdout: io_context.stdout,
    },
  );
  const config_json = await readProjectConfig(test_context.project_directory);

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([
    'Updated stored query: blocked -> ready\n',
  ]);
  expect(config_json.queries.blocked).toBeUndefined();
  expect(config_json.queries.ready).toEqual({
    cypher: "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
  });
});

it('reports missing stored queries during queries remove like patram query does', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  process.chdir(test_context.project_directory);

  const exit_code = await main(['queries', 'remove', 'missing'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(1);
  expect(io_context.stdout_chunks).toEqual([]);
  expect(io_context.stderr_chunks).toEqual([
    'Unknown stored query: missing\n\nNext:\n  patram queries\n',
  ]);
});

it('rejects invalid Cypher queries before persisting queries add', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  process.chdir(test_context.project_directory);

  const exit_code = await main(
    [
      'queries',
      'add',
      'broken',
      '--cypher',
      "MATCH (n:Task) WHERE n.owner = 'max' RETURN n",
    ],
    {
      stderr: io_context.stderr,
      stdout: io_context.stdout,
    },
  );
  const config_json = await readProjectConfig(test_context.project_directory);

  expect(exit_code).toBe(1);
  expect(io_context.stdout_chunks).toEqual([]);
  expect(io_context.stderr_chunks).toEqual([
    'file .patram.json\n' +
      '  1:1  error  Invalid config at "queries.broken.cypher": Unknown field "owner".  config.invalid\n' +
      '\n' +
      '\u2716 1 problem (1 error, 0 warnings)\n',
  ]);
  expect(config_json.queries.broken).toBeUndefined();
});

/**
 * @param {string} project_directory
 * @returns {Promise<{ queries: Record<string, { cypher: string, description?: string }> }>}
 */
async function readProjectConfig(project_directory) {
  const config_source = await readFile(
    join(project_directory, '.patram.json'),
    'utf8',
  );
  const config_json = /** @type {unknown} */ (JSON.parse(config_source));

  return assertProjectConfig(config_json);
}

/**
 * @param {unknown} config_value
 * @returns {{ queries: Record<string, { cypher: string, description?: string }> }}
 */
function assertProjectConfig(config_value) {
  if (
    config_value === null ||
    typeof config_value !== 'object' ||
    !Object.hasOwn(config_value, 'queries')
  ) {
    throw new Error('Expected a config object with queries.');
  }

  const config_record = /** @type {Record<string, unknown>} */ (config_value);
  const queries_value = config_record.queries;

  if (
    queries_value === null ||
    typeof queries_value !== 'object' ||
    Array.isArray(queries_value)
  ) {
    throw new Error('Expected config queries to be an object.');
  }

  return {
    queries:
      /** @type {Record<string, { cypher: string, description?: string }>} */ (
        queries_value
      ),
  };
}
