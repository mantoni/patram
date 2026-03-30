import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { discoverFields } from '../scan/discover-fields.js';

const test_context = createTestContext();

/**
 * @typedef {{
 *   confidence?: number,
 *   conflicting_evidence?: Array<{ path: string, value: string }>,
 *   likely_class_usage?: { classes: string[] },
 *   likely_multiplicity?: { confidence?: number, name: string },
 *   likely_type?: { confidence?: number, name: string },
 *   name: string,
 * }} DiscoveredField
 */

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

it('limits discovery to top metadata zones and ignores repo root files', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await seedMetadataZoneProject(test_context.project_directory);

  const discovery_result = await discoverFields(test_context.project_directory);

  expect(findField(discovery_result.fields, 'status')).toMatchObject({
    likely_class_usage: {
      classes: ['decision'],
    },
  });
  expect(discovery_result.fields).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'section_field' }),
      expect.objectContaining({ name: 'root_instruction' }),
    ]),
  );
});

it('normalizes markdown link values before inferring field types', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await seedNormalizedEvidenceProject(test_context.project_directory);

  const discovery_result = await discoverFields(test_context.project_directory);

  expect(findField(discovery_result.fields, 'reference')).toMatchObject({
    likely_type: { name: 'path' },
  });
});

it('filters structurally implausible field names', async () => {
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
      expect.objectContaining({
        name: 'keep_the_existing_list_item_syntax',
      }),
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
 * @param {string} project_directory
 * @returns {Promise<void>}
 */
async function seedMetadataZoneProject(project_directory) {
  await writeProjectFile(
    project_directory,
    'docs/decisions/decision.md',
    [
      '# Decision',
      '',
      '- Kind: decision',
      '- Status: accepted',
      '',
      'Body prose starts here.',
      '',
      '## Follow-up',
      '',
      '- Section Field: ignored',
    ].join('\n'),
  );
  await writeProjectFile(
    project_directory,
    'AGENTS.md',
    ['# Agents', '', '- Root Instruction: ignored'].join('\n'),
  );
}

/**
 * @param {string} project_directory
 * @returns {Promise<void>}
 */
async function seedNormalizedEvidenceProject(project_directory) {
  await writeProjectFile(
    project_directory,
    'docs/tasks/reference.md',
    [
      '# Reference Task',
      '',
      '- Kind: task',
      '- Reference: [Alpha Decision](../decisions/alpha.md)',
    ].join('\n'),
  );
}

/**
 * @param {string} project_directory
 * @returns {Promise<void>}
 */
async function seedImplausibleFieldNameProject(project_directory) {
  await writeProjectFile(
    project_directory,
    'docs/conventions/example.md',
    [
      '# Example Convention',
      '',
      '- Kind: convention',
      '- Path separator: /',
      '- Keep the existing list item syntax: yes',
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
 * @param {DiscoveredField[]} fields
 * @param {string} field_name
 * @returns {DiscoveredField}
 */
function findField(fields, field_name) {
  const field = fields.find((entry) => entry.name === field_name);

  if (!field) {
    throw new Error(`Expected field "${field_name}" to be discovered.`);
  }

  return field;
}

/**
 * @param {{ fields: DiscoveredField[], summary: { claim_count: number, count: number, source_file_count: number } }} discovery_result
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
 * @param {DiscoveredField[]} fields
 */
function assertStatusField(fields) {
  const status_field = findField(fields, 'status');

  expect(typeof status_field.confidence).toBe('number');
  expect(status_field.likely_class_usage).toEqual({
    classes: ['decision', 'task'],
  });
  expect(status_field.likely_multiplicity).toEqual({
    confidence: 0.9,
    name: 'single',
  });
  expect(typeof status_field.likely_type?.confidence).toBe('number');
  expect(status_field.likely_type?.name).toBe('enum');
}

/**
 * @param {DiscoveredField[]} fields
 */
function assertTagField(fields) {
  const tag_field = findField(fields, 'tag');

  expect(typeof tag_field.confidence).toBe('number');
  expect(tag_field.likely_class_usage).toEqual({
    classes: ['task'],
  });
  expect(typeof tag_field.likely_multiplicity?.confidence).toBe('number');
  expect(tag_field.likely_multiplicity?.name).toBe('multiple');
  expect(typeof tag_field.likely_type?.confidence).toBe('number');
  expect(tag_field.likely_type?.name).toBe('enum');
}

/**
 * @param {DiscoveredField[]} fields
 */
function assertReferenceField(fields) {
  const reference_field = findField(fields, 'reference');

  expect(typeof reference_field.confidence).toBe('number');
  expect(reference_field.conflicting_evidence).toEqual([
    expect.objectContaining({
      path: 'docs/decisions/beta.md',
      value: 'freeform',
    }),
  ]);
  expect(reference_field.likely_class_usage).toEqual({
    classes: ['decision', 'task'],
  });
  expect(typeof reference_field.likely_multiplicity?.confidence).toBe('number');
  expect(reference_field.likely_multiplicity?.name).toBe('single');
  expect(typeof reference_field.likely_type?.confidence).toBe('number');
  expect(reference_field.likely_type?.name).toBe('path');
}

/**
 * @param {DiscoveredField[]} fields
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
