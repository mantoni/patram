import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { discoverFields } from '../scan/discover-fields.js';

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('discovers field type, multiplicity, and likely on types', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await seedDiscoveryProject(test_context.project_directory);

  const discovery_result = await discoverFields(test_context.project_directory);

  expect(discovery_result.summary).toEqual({
    claim_count: 12,
    count: 3,
    source_file_count: 3,
  });
  expect(findField(discovery_result.fields, 'status')).toMatchObject({
    likely_on: {
      types: ['task'],
    },
    likely_type: {
      name: 'enum',
    },
  });
  expect(findField(discovery_result.fields, 'tag')).toMatchObject({
    likely_multiplicity: {
      name: 'multiple',
    },
    likely_on: {
      types: ['task'],
    },
  });
});

it('infers ref targets when path evidence is clear', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await seedRefProject(test_context.project_directory);

  const discovery_result = await discoverFields(test_context.project_directory);

  expect(findField(discovery_result.fields, 'uses_term')).toMatchObject({
    likely_on: {
      types: ['task'],
    },
    likely_to: {
      type: 'term',
    },
    likely_type: {
      name: 'ref',
    },
  });
});

it('filters implausible field names and ignores repo root files', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await seedImplausibleFieldNameProject(test_context.project_directory);

  const discovery_result = await discoverFields(test_context.project_directory);

  expect(discovery_result.fields).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'path_separator' }),
    ]),
  );
  expect(discovery_result.fields).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'root_instruction' }),
      expect.objectContaining({ name: 'keep_the_existing_list_item_syntax' }),
    ]),
  );
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
  return mkdtemp(join(tmpdir(), 'patram-fields-'));
}

/**
 * @param {string} project_directory
 * @param {string} relative_path
 * @param {string} file_contents
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
 */
async function seedDiscoveryProject(project_directory) {
  await writeProjectFile(
    project_directory,
    'docs/tasks/alpha.md',
    [
      '# Alpha Task',
      '',
      'status: pending',
      'status: pending',
      'owner: max',
      'tag: alpha',
      'tag: beta',
    ].join('\n'),
  );
  await writeProjectFile(
    project_directory,
    'docs/tasks/bravo.md',
    ['# Bravo Task', '', 'status: ready', 'owner: emma', 'tag: gamma'].join(
      '\n',
    ),
  );
  await writeProjectFile(
    project_directory,
    'docs/decisions/beta.md',
    ['# Beta Decision', '', 'owner: max'].join('\n'),
  );
}

/**
 * @param {string} project_directory
 */
async function seedRefProject(project_directory) {
  await writeProjectFile(
    project_directory,
    'docs/reference/terms/graph.md',
    ['# Graph', '', 'term: graph'].join('\n'),
  );
  await writeProjectFile(
    project_directory,
    'docs/tasks/reference.md',
    ['# Reference Task', '', 'uses_term: ../reference/terms/graph.md'].join(
      '\n',
    ),
  );
}

/**
 * @param {string} project_directory
 */
async function seedImplausibleFieldNameProject(project_directory) {
  await writeProjectFile(
    project_directory,
    'docs/conventions/example.md',
    [
      '# Example Convention',
      '',
      'path_separator: /',
      'keep_the_existing_list_item_syntax: yes',
    ].join('\n'),
  );
  await writeProjectFile(
    project_directory,
    'AGENTS.md',
    ['# Agents', '', 'root_instruction: ignored'].join('\n'),
  );
}

/**
 * @param {{ original_working_directory: string, project_directory: string | null }} current_test_context
 */
async function cleanupTestContext(current_test_context) {
  process.chdir(current_test_context.original_working_directory);

  if (current_test_context.project_directory) {
    await rm(current_test_context.project_directory, {
      recursive: true,
      force: true,
    });
    current_test_context.project_directory = null;
  }
}

/**
 * @param {Array<{ name: string }>} fields
 * @param {string} field_name
 */
function findField(fields, field_name) {
  const field = fields.find((entry) => entry.name === field_name);

  if (!field) {
    throw new Error(`Expected field "${field_name}" to be discovered.`);
  }

  return field;
}
