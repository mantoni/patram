/* eslint-disable max-lines */
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
 * Kind: support
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
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
  return [
    '# Query Language v0',
    '',
    '- Kind: decision',
    '- Status: accepted',
  ].join('\n');
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
    '- Kind: task',
    `- Status: ${status_value}`,
    '- Tracked in: docs/roadmap/v0-dogfood.md',
  ].join('\n');
}

/**
 * @returns {string}
 */
export function createBlockedTaskSource() {
  return [
    '# Implement show command',
    '',
    '- Kind: task',
    '- Status: blocked',
    '- Blocked by: ../decisions/show-output-v0.md',
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
    classes: {
      decision: {
        label: 'Decision',
      },
      document: {
        builtin: true,
      },
      task: {
        label: 'Task',
      },
    },
    fields: {
      status: {
        type: 'string',
      },
    },
    include: ['docs/**/*.md'],
    mappings: createProjectMappings(),
    queries: createProjectQueries(),
    relations: createProjectRelations(),
  };
}

function createProjectQueries() {
  return {
    blocked: {
      description: 'Show blocked tasks.',
      where: '$class=task and status=blocked',
    },
    pending: {
      where: '$class=task and status=pending',
    },
  };
}

function createProjectMappings() {
  return {
    'document.title': {
      node: {
        class: 'document',
        field: 'title',
      },
    },
    'markdown.directive.blocked_by': {
      emit: {
        relation: 'blocked_by',
        target: 'path',
        target_class: 'document',
      },
    },
    'markdown.directive.kind': {
      node: {
        class: 'document',
        field: '$class',
      },
    },
    'markdown.directive.status': {
      node: {
        class: 'document',
        field: 'status',
      },
    },
    'markdown.directive.tracked_in': {
      emit: {
        relation: 'tracked_in',
        target: 'path',
        target_class: 'document',
      },
    },
    'markdown.link': {
      emit: {
        relation: 'links_to',
        target: 'path',
        target_class: 'document',
      },
    },
  };
}

function createProjectRelations() {
  return {
    blocked_by: {
      from: ['document'],
      to: ['document'],
    },
    links_to: {
      builtin: true,
      from: ['document'],
      to: ['document'],
    },
    tracked_in: {
      from: ['document'],
      to: ['document'],
    },
  };
}
