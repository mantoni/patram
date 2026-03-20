import { execFile as execFileCallback } from 'node:child_process';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { afterEach, expect, it } from 'vitest';

import { main } from './patram.js';

const execFile = promisify(execFileCallback);
const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('prints config diagnostics for check failures', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  const exit_code = await main(['check', test_context.project_directory], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([
    '.patram.json:1:1 error config.not_found Config file ".patram.json" was not found.\n',
  ]);
  expect(io_context.stdout_chunks).toEqual([]);
});

it('prints broken link diagnostics for check failures', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  await writeProjectFile(
    test_context.project_directory,
    'docs/patram.md',
    createBrokenLinkSource(),
  );

  const exit_code = await main(['check', test_context.project_directory], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([
    'docs/patram.md:3:5 error graph.link_broken Document link target "docs/missing.md" was not found.\n',
  ]);
});

it('defaults check to the current working directory and exits 0 on valid input', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  await writeProjectFile(
    test_context.project_directory,
    'docs/patram.md',
    createValidLinkSource(),
  );
  await writeProjectFile(
    test_context.project_directory,
    'docs/guide.md',
    '# Guide\n',
  );
  process.chdir(test_context.project_directory);

  const exit_code = await main(['check'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([]);
});

it('prints matching nodes for query --where', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  await writeProjectFile(
    test_context.project_directory,
    'docs/tasks/v0/query-command.md',
    createTaskSource('pending'),
  );
  await writeProjectFile(
    test_context.project_directory,
    'docs/tasks/v0/show-command.md',
    createBlockedTaskSource(),
  );
  await writeProjectFile(
    test_context.project_directory,
    'docs/decisions/query-language-v0.md',
    createDecisionSource(),
  );
  process.chdir(test_context.project_directory);

  const exit_code = await main(
    ['query', '--where', 'kind=task and status=pending'],
    {
      stderr: io_context.stderr,
      stdout: io_context.stdout,
    },
  );

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([
    'doc:docs/tasks/v0/query-command.md task Implement query command\n',
  ]);
});

it('rejects query without a where flag', async () => {
  const io_context = createIoContext();

  const exit_code = await main(['query', 'pending'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual(['Query requires "--where".\n']);
  expect(io_context.stdout_chunks).toEqual([]);
});

it('rejects query with an empty where clause', async () => {
  const io_context = createIoContext();

  const exit_code = await main(['query', '--where'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([
    'Query requires a where clause.\n',
  ]);
  expect(io_context.stdout_chunks).toEqual([]);
});

it('prints query diagnostics for invalid where clauses', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  await writeProjectFile(
    test_context.project_directory,
    'docs/tasks/v0/query-command.md',
    createTaskSource('pending'),
  );
  process.chdir(test_context.project_directory);

  const exit_code = await main(
    ['query', '--where', 'kind=task or status=done'],
    {
      stderr: io_context.stderr,
      stdout: io_context.stdout,
    },
  );

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([
    '<query>:1:11 error query.invalid Unsupported query token "or".\n',
  ]);
  expect(io_context.stdout_chunks).toEqual([]);
});

it('runs the CLI when invoked through a symlinked executable path', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const executable_path = join(test_context.project_directory, 'patram');

  await symlink(join(import.meta.dirname, 'patram.js'), executable_path);

  await expect(
    execFile(executable_path, ['nope'], {
      encoding: 'utf8',
    }),
  ).rejects.toMatchObject({
    code: 1,
    stderr: 'Unknown command.\n',
    stdout: '',
  });
});

/**
 * @returns {string}
 */
function createBrokenLinkSource() {
  return ['# Patram', '', 'See [missing](./missing.md).'].join('\n');
}

/**
 * @returns {string}
 */
function createValidLinkSource() {
  return ['# Patram', '', 'See [guide](./guide.md).'].join('\n');
}

/**
 * @param {string} status_value
 * @returns {string}
 */
function createTaskSource(status_value) {
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
function createBlockedTaskSource() {
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
function createDecisionSource() {
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
function createTestContext() {
  return {
    original_working_directory: process.cwd(),
    project_directory: null,
  };
}

/**
 * @returns {{ stderr: { write(chunk: string): boolean }, stderr_chunks: string[], stdout: { write(chunk: string): boolean }, stdout_chunks: string[] }}
 */
function createIoContext() {
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
async function createTempProjectDirectory() {
  return mkdtemp(join(tmpdir(), 'patram-check-command-'));
}

/**
 * @param {{ original_working_directory: string, project_directory: string | null }} test_context
 */
async function cleanupTestContext(test_context) {
  process.chdir(test_context.original_working_directory);

  if (test_context.project_directory) {
    await rm(test_context.project_directory, { force: true, recursive: true });
    test_context.project_directory = null;
  }
}

/**
 * @param {string} project_directory
 */
async function writeProjectConfig(project_directory) {
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
async function writeProjectFile(project_directory, relative_path, source_text) {
  const file_path = join(project_directory, relative_path);
  const directory_path = file_path.slice(0, file_path.lastIndexOf('/'));

  await mkdir(directory_path, { recursive: true });
  await writeFile(file_path, source_text);
}

/**
 * @returns {object}
 */
function createProjectConfig() {
  return {
    include: ['docs/**/*.md'],
    kinds: {
      document: {
        builtin: true,
      },
    },
    mappings: createProjectMappings(),
    queries: {},
    relations: createProjectRelations(),
  };
}

/**
 * @returns {object}
 */
function createProjectMappings() {
  return {
    'document.title': {
      node: {
        field: 'title',
        kind: 'document',
      },
    },
    'markdown.directive.blocked_by': {
      emit: {
        relation: 'blocked_by',
        target: 'path',
        target_kind: 'document',
      },
    },
    'markdown.directive.kind': {
      node: {
        field: 'kind',
        kind: 'document',
      },
    },
    'markdown.directive.status': {
      node: {
        field: 'status',
        kind: 'document',
      },
    },
    'markdown.directive.tracked_in': {
      emit: {
        relation: 'tracked_in',
        target: 'path',
        target_kind: 'document',
      },
    },
    'markdown.link': {
      emit: {
        relation: 'links_to',
        target: 'path',
        target_kind: 'document',
      },
    },
  };
}

/**
 * @returns {object}
 */
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
