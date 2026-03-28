import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { discoverFields } from '../scan/discover-fields.js';

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('discovers likely field schema from source claims', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await seedDiscoveryProject(test_context.project_directory);

  const discovery_result = await discoverFields(test_context.project_directory);

  assertDiscoveryResult(discovery_result);
});

it('infers additional field types and falls back to document class usage', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await seedTypedFieldsProject(test_context.project_directory);

  const discovery_result = await discoverFields(test_context.project_directory);

  expect(findField(discovery_result.fields, 'count')).toMatchObject({
    likely_type: { name: 'integer' },
  });
  expect(findField(discovery_result.fields, 'due')).toMatchObject({
    likely_type: { name: 'date' },
  });
  expect(findField(discovery_result.fields, 'pattern')).toMatchObject({
    likely_type: { name: 'glob' },
  });
  expect(findField(discovery_result.fields, 'timestamp')).toMatchObject({
    likely_class_usage: {
      classes: ['document'],
    },
    likely_type: { name: 'date_time' },
  });
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
async function seedDiscoveryProject(project_directory) {
  await writeProjectFile(
    project_directory,
    'docs/tasks/alpha.md',
    [
      '# Alpha Task',
      '',
      '- Kind: task',
      '- Status: pending',
      '- Status: pending',
      '- Owner: max',
      '- Tag: alpha',
      '- Tag: beta',
      '- Reference: docs/decisions/beta.md',
    ].join('\n'),
  );
  await writeProjectFile(
    project_directory,
    'docs/tasks/bravo.md',
    [
      '# Bravo Task',
      '',
      '- Kind: task',
      '- Status: ready',
      '- Owner: emma',
      '- Tag: gamma',
      '- Reference: docs/decisions/beta.md',
    ].join('\n'),
  );
  await writeProjectFile(
    project_directory,
    'docs/decisions/beta.md',
    [
      '# Beta Decision',
      '',
      '- Kind: decision',
      '- Status: accepted',
      '- Owner: max',
      '- Reference: freeform',
    ].join('\n'),
  );
}

/**
 * @param {string} project_directory
 * @returns {Promise<void>}
 */
async function seedTypedFieldsProject(project_directory) {
  await writeProjectFile(
    project_directory,
    'docs/reference.md',
    [
      '# Reference',
      '',
      '- Due: 2026-03-24',
      '- Timestamp: 2026-03-24T09:00',
      '- Count: 42',
      '- Pattern: docs/tasks/*.md',
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

/**
 * @param {Array<{ name: string }>} fields
 * @param {string} field_name
 * @returns {{ name: string }}
 */
function findField(fields, field_name) {
  const field = fields.find((entry) => entry.name === field_name);

  if (!field) {
    throw new Error(`Expected field "${field_name}" to be discovered.`);
  }

  return field;
}

/**
 * @param {{ fields: Array<{ name: string }>, summary: { claim_count: number, count: number, source_file_count: number } }} discovery_result
 */
function assertDiscoveryResult(discovery_result) {
  assertDiscoverySummary(discovery_result.summary);
  assertStatusField(discovery_result.fields);
  assertTagField(discovery_result.fields);
  assertReferenceField(discovery_result.fields);
  assertFieldNames(discovery_result.fields);
}

/**
 * @param {{ claim_count: number, count: number, source_file_count: number }} summary
 */
function assertDiscoverySummary(summary) {
  expect(summary).toEqual({
    claim_count: 19,
    count: 5,
    source_file_count: 3,
  });
}

/**
 * @param {Array<{ name: string }>} fields
 */
function assertStatusField(fields) {
  expect(findField(fields, 'status')).toMatchObject({
    confidence: expect.any(Number),
    likely_class_usage: {
      classes: ['decision', 'task'],
    },
    likely_multiplicity: {
      confidence: 0.9,
      name: 'single',
    },
    likely_type: {
      confidence: expect.any(Number),
      name: 'enum',
    },
  });
}

/**
 * @param {Array<{ name: string }>} fields
 */
function assertTagField(fields) {
  expect(findField(fields, 'tag')).toMatchObject({
    confidence: expect.any(Number),
    likely_class_usage: {
      classes: ['task'],
    },
    likely_multiplicity: {
      name: 'multiple',
    },
    likely_type: {
      name: 'enum',
    },
  });
}

/**
 * @param {Array<{ name: string }>} fields
 */
function assertReferenceField(fields) {
  expect(findField(fields, 'reference')).toMatchObject({
    confidence: expect.any(Number),
    conflicting_evidence: [
      expect.objectContaining({
        path: 'docs/decisions/beta.md',
        value: 'freeform',
      }),
    ],
    likely_class_usage: {
      classes: ['decision', 'task'],
    },
    likely_multiplicity: {
      name: 'single',
    },
    likely_type: {
      name: 'path',
    },
  });
}

/**
 * @param {Array<{ name: string }>} fields
 */
function assertFieldNames(fields) {
  expect(fields.map((field) => field.name).sort()).toEqual([
    'kind',
    'owner',
    'reference',
    'status',
    'tag',
  ]);
  expect(fields.every((field) => !field.name.startsWith('$'))).toBe(true);
}
