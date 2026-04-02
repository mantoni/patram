import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import ansis from 'ansis';

/**
 * CLI integration test fixtures.
 *
 * Provides temporary project builders and IO helpers shared by command-level
 * integration tests.
 *
 * kind: support
 * status: active
 * tracked_in: ../docs/plans/v0/source-anchor-dogfooding.md
 * @patram
 * @see {@link ./patram.test.js}
 * @see {@link ./patram-query.test.js}
 */

/**
 * @returns {string}
 */
export function createBrokenLinkSource() {
  return ['# Patram', '', 'See [missing](./missing.md).'].join('\n');
}

/**
 * @returns {string}
 */
export function createDecisionSource() {
  return ['# Query Language v0', '', 'status: accepted'].join('\n');
}

/**
 * @returns {{ original_working_directory: string, project_directory: string | null }}
 */
export function createTestContext() {
  return {
    original_working_directory: process.cwd(),
    project_directory: null,
  };
}

/**
 * @param {boolean} stdout_is_tty
 * @returns {{ stderr: { write(chunk: string): boolean }, stderr_chunks: string[], stdout: { isTTY: boolean, write(chunk: string): boolean }, stdout_chunks: string[] }}
 */
export function createIoContext(stdout_is_tty = false) {
  /** @type {string[]} */
  const stderr_chunks = [];
  /** @type {string[]} */
  const stdout_chunks = [];

  return {
    stderr: {
      /**
       * @param {string} chunk
       * @returns {boolean}
       */
      write(chunk) {
        stderr_chunks.push(chunk);

        return true;
      },
    },
    stderr_chunks,
    stdout: {
      isTTY: stdout_is_tty,
      /**
       * @param {string} chunk
       * @returns {boolean}
       */
      write(chunk) {
        stdout_chunks.push(chunk);

        return true;
      },
    },
    stdout_chunks,
  };
}

/**
 * @returns {Promise<string>}
 */
export async function createTempProjectDirectory() {
  return mkdtemp(join(tmpdir(), 'patram-check-command-'));
}

/**
 * @param {string} status_value
 * @returns {string}
 */
export function createTaskSource(status_value) {
  return [
    '# Implement query command',
    '',
    `status: ${status_value}`,
    'tracked_in: docs/roadmap/v0-dogfood.md',
  ].join('\n');
}

/**
 * @returns {string}
 */
export function createBlockedTaskSource() {
  return [
    '# Implement show command',
    '',
    'status: blocked',
    'blocked_by: ../decisions/show-output-v0.md',
  ].join('\n');
}

/**
 * @returns {string}
 */
export function createValidLinkSource() {
  return ['# Patram', '', 'See [guide](./guide.md).'].join('\n');
}

/**
 * @returns {string}
 */
function createShowSource() {
  return [
    '# Patram',
    '',
    'See [guide](./guide.md), [query language](./decisions/query-language-v0.md), and [implement query command](./tasks/v0/query-command.md).',
  ].join('\n');
}

/**
 * @param {{ original_working_directory: string, project_directory: string | null }} test_context
 */
export async function cleanupTestContext(test_context) {
  process.chdir(test_context.original_working_directory);

  if (test_context.project_directory) {
    await rm(test_context.project_directory, { force: true, recursive: true });
    test_context.project_directory = null;
  }
}

/**
 * @param {string} value
 * @returns {string}
 */
export function stripAnsi(value) {
  return ansis.strip(value);
}

/**
 * @param {string} project_directory
 */
export async function writeProjectConfig(project_directory) {
  await writeFile(
    join(project_directory, '.patram.json'),
    JSON.stringify(createProjectConfig()),
  );
}

/**
 * @param {string} project_directory
 * @param {string} relative_path
 * @param {string} source_text
 */
export async function writeProjectFile(
  project_directory,
  relative_path,
  source_text,
) {
  const file_path = join(project_directory, relative_path);
  const directory_path = file_path.slice(0, file_path.lastIndexOf('/'));

  await mkdir(directory_path, { recursive: true });
  await writeFile(file_path, source_text);
}

/**
 * @param {string} project_directory
 */
export async function writeShowProject(project_directory) {
  await writeProjectFile(
    project_directory,
    'docs/patram.md',
    createShowSource(),
  );
  await writeProjectFile(project_directory, 'docs/guide.md', '# Some Guide\n');
  await writeProjectFile(
    project_directory,
    'docs/decisions/query-language-v0.md',
    createDecisionSource(),
  );
  await writeProjectFile(
    project_directory,
    'docs/tasks/v0/query-command.md',
    createTaskSource('pending'),
  );
}

function createProjectConfig() {
  return {
    fields: {
      blocked_by: {
        many: true,
        to: 'document',
        type: 'ref',
      },
      status: {
        type: 'string',
      },
      tracked_in: {
        many: true,
        to: 'document',
        type: 'ref',
      },
    },
    include: ['docs/**/*.md'],
    queries: createProjectQueries(),
    types: {
      decision: {
        in: 'docs/decisions/**/*.md',
        label: 'Decision',
      },
      task: {
        in: 'docs/tasks/**/*.md',
        label: 'Task',
      },
    },
  };
}

function createProjectQueries() {
  return {
    blocked: {
      description: 'Show blocked tasks.',
      cypher: "MATCH (n:Task) WHERE n.status = 'blocked' RETURN n",
    },
    pending: {
      cypher: "MATCH (n:Task) WHERE n.status = 'pending' RETURN n",
    },
  };
}
