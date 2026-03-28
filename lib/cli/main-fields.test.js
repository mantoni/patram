import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { main } from './main.js';

/**
 * @typedef {{
 *   fields: Array<{
 *     confidence?: number,
 *     likely_class_usage?: { classes: string[] },
 *     likely_multiplicity?: { confidence?: number, name: string },
 *     likely_type?: { confidence?: number, name: string },
 *     name: string,
 *   }>,
 * }} FieldsCommandJsonOutput
 */

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('runs the fields command without requiring repo config', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await seedFieldsProject(test_context.project_directory);

  process.chdir(test_context.project_directory);

  /** @type {string[]} */
  const stderr_chunks = [];
  /** @type {string[]} */
  const stdout_chunks = [];
  const exit_code = await main(['fields', '--json'], {
    stderr: {
      write(chunk) {
        stderr_chunks.push(chunk);
        return true;
      },
    },
    stdout: {
      isTTY: false,
      write(chunk) {
        stdout_chunks.push(chunk);
        return true;
      },
    },
  });

  expect(exit_code).toBe(0);
  expect(stderr_chunks).toEqual([]);
  const output = parseFieldsCommandJson(stdout_chunks.join(''));
  const status_field = findField(output.fields, 'status');

  expect(status_field.name).toBe('status');
  expect(status_field.likely_type?.name).toBe('enum');
});

it('does not list fields that are already defined in repo config', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await seedConfiguredFieldsProject(test_context.project_directory);

  process.chdir(test_context.project_directory);

  /** @type {string[]} */
  const stderr_chunks = [];
  /** @type {string[]} */
  const stdout_chunks = [];
  const exit_code = await main(['fields', '--json'], {
    stderr: {
      write(chunk) {
        stderr_chunks.push(chunk);
        return true;
      },
    },
    stdout: {
      isTTY: false,
      write(chunk) {
        stdout_chunks.push(chunk);
        return true;
      },
    },
  });
  const output = parseFieldsCommandJson(stdout_chunks.join(''));

  expect(exit_code).toBe(0);
  expect(stderr_chunks).toEqual([]);
  expect(output.fields).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: 'owner',
      }),
    ]),
  );
  expect(output.fields).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: 'status',
      }),
      expect.objectContaining({
        name: 'blocked_by',
      }),
    ]),
  );
});

it('sends tty fields output through the pager', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await seedFieldsProject(test_context.project_directory);

  process.chdir(test_context.project_directory);

  /** @type {string[]} */
  const stderr_chunks = [];
  /** @type {string[]} */
  const stdout_chunks = [];
  /** @type {string[]} */
  const paged_output_chunks = [];
  const exit_code = await main(['fields', '--plain'], {
    stderr: {
      write(chunk) {
        stderr_chunks.push(chunk);
        return true;
      },
    },
    stdout: {
      isTTY: true,
      write(chunk) {
        stdout_chunks.push(chunk);
        return true;
      },
    },
    write_paged_output(output_text) {
      paged_output_chunks.push(output_text);
      return Promise.resolve();
    },
  });

  expect(exit_code).toBe(0);
  expect(stderr_chunks).toEqual([]);
  expect(stdout_chunks).toEqual([]);
  expect(paged_output_chunks.join('')).toContain('Field discovery\n');
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
  return mkdtemp(join(tmpdir(), 'patram-fields-cli-'));
}

/**
 * @param {string} project_directory
 * @param {string} relative_path
 * @param {string} file_contents
 * @returns {Promise<void>}
 */
async function writeProjectFile(
  project_directory,
  relative_path,
  file_contents,
) {
  const file_path = join(project_directory, relative_path);
  await mkdir(dirname(file_path), { recursive: true });
  await writeFile(file_path, file_contents, 'utf8');
}

/**
 * @param {string} project_directory
 * @returns {Promise<void>}
 */
async function seedFieldsProject(project_directory) {
  await writeProjectFile(
    project_directory,
    'docs/tasks/alpha.md',
    [
      '# Alpha Task',
      '',
      '- Kind: task',
      '- Status: pending',
      '- Owner: max',
    ].join('\n'),
  );
}

/**
 * @param {string} json_text
 * @returns {FieldsCommandJsonOutput}
 */
function parseFieldsCommandJson(json_text) {
  const parsed_json = /** @type {unknown} */ (JSON.parse(json_text));

  return /** @type {FieldsCommandJsonOutput} */ (parsed_json);
}

/**
 * @param {FieldsCommandJsonOutput['fields']} fields
 * @param {string} field_name
 */
function findField(fields, field_name) {
  const field = fields.find((entry) => entry.name === field_name);

  if (!field) {
    throw new Error(`Expected field "${field_name}" in command output.`);
  }

  return field;
}

/**
 * @param {string} project_directory
 * @returns {Promise<void>}
 */
async function seedConfiguredFieldsProject(project_directory) {
  await writeProjectFile(
    project_directory,
    '.patram.json',
    JSON.stringify({
      classes: {
        document: {
          builtin: true,
        },
      },
      fields: {
        status: {
          type: 'string',
        },
      },
      include: ['docs/**/*.md'],
      relations: {
        blocked_by: {
          from: ['document'],
          to: ['document'],
        },
      },
      queries: {},
    }),
  );
  await writeProjectFile(
    project_directory,
    'docs/tasks/alpha.md',
    [
      '# Alpha Task',
      '',
      '- Kind: task',
      '- Status: pending',
      '- Owner: max',
      '- Blocked by: docs/tasks/bravo.md',
    ].join('\n'),
  );
}

/**
 * @param {{ original_working_directory: string, project_directory: string | null }} test_context
 * @returns {Promise<void>}
 */
async function cleanupTestContext(test_context) {
  process.chdir(test_context.original_working_directory);

  if (test_context.project_directory) {
    await rm(test_context.project_directory, { recursive: true, force: true });
    test_context.project_directory = null;
  }
}
