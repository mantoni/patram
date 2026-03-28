/**
 * @import { ClassFieldRuleConfig, MetadataFieldConfig, PatramRepoConfig } from '../load-patram-config.types.ts';
 * @import { MappingDefinition } from '../patram-config.types.ts';
 */

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import {
  createDirectivePathClasses,
  createDirectiveRelations,
  createMarkdownDirectiveMappings,
} from '../directive-validation-test-helpers.js';
import { main } from './main.js';

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('renders directive validation diagnostics through the check command', async () => {
  const { exit_code, stderr_text, stdout_chunks } =
    await runPlainCheckForFixture(writeFixtureProject);

  expect(exit_code).toBe(1);
  expect(stdout_chunks).toEqual([]);
  expect(stderr_text).toContain('document docs/research/task.md');
  expect(stderr_text).toContain('directive.invalid_enum');
  expect(stderr_text).toContain('directive.missing_required');
  expect(stderr_text).toContain('document.invalid_placement');
});

it('reports missing front-matter path targets through the check command', async () => {
  const { exit_code, stderr_text, stdout_chunks } =
    await runPlainCheckForFixture(writeMissingPathFixtureProject);

  expect(exit_code).toBe(1);
  expect(stdout_chunks).toEqual([]);
  expect(stderr_text).toContain('directive.path_not_found');
  expect(stderr_text).toContain('docs/plans/v0/missing.md');
});

it('reports markdown style diagnostics through the check command', async () => {
  const { exit_code, stderr_text, stdout_chunks } =
    await runPlainCheckForFixture(writeMarkdownStyleFixtureProject);

  expect(exit_code).toBe(1);
  expect(stdout_chunks).toEqual([]);
  expect(stderr_text).toContain('directive.invalid_style');
  expect(stderr_text).toContain('document.mixed_styles');
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
 * @param {{ original_working_directory: string, project_directory: string | null }} test_context
 */
async function cleanupTestContext(test_context) {
  process.chdir(test_context.original_working_directory);

  if (!test_context.project_directory) {
    return;
  }

  await rm(test_context.project_directory, { force: true, recursive: true });
  test_context.project_directory = null;
}

/**
 * @returns {Promise<string>}
 */
async function createTempProjectDirectory() {
  return mkdtemp(join(tmpdir(), 'patram-cli-'));
}

/**
 * @param {(project_directory: string) => Promise<void>} write_fixture_project
 * @returns {Promise<{ exit_code: number, stderr_text: string, stdout_chunks: string[] }>}
 */
async function runPlainCheckForFixture(write_fixture_project) {
  test_context.project_directory = await createTempProjectDirectory();
  process.chdir(test_context.project_directory);
  await write_fixture_project(test_context.project_directory);

  /** @type {string[]} */
  const stderr_chunks = [];
  /** @type {string[]} */
  const stdout_chunks = [];
  const exit_code = await main(['check', '--plain'], {
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

  return {
    exit_code,
    stderr_text: stderr_chunks.join(''),
    stdout_chunks,
  };
}

/**
 * @param {string} project_directory
 */
async function writeFixtureProject(project_directory) {
  await writeProjectFile(
    project_directory,
    '.patram.json',
    createDirectiveValidationConfigSource(),
  );
  await writeProjectFile(
    project_directory,
    'docs/decisions/one.md',
    '# Decision\n',
  );
  await writeProjectFile(
    project_directory,
    'docs/plans/v0/plan.md',
    '# Plan\n',
  );
  await writeProjectFile(
    project_directory,
    'docs/research/task.md',
    ['# Example Task', '- Kind: task', '- Status: blocked'].join('\n'),
  );
}

/**
 * @param {string} project_directory
 */
async function writeMissingPathFixtureProject(project_directory) {
  await writeProjectFile(
    project_directory,
    '.patram.json',
    createDirectiveValidationConfigSource(),
  );
  await writeProjectFile(
    project_directory,
    'docs/decisions/one.md',
    '# Decision\n',
  );
  await writeProjectFile(
    project_directory,
    'docs/tasks/task.md',
    [
      '---',
      'Kind: task',
      'Status: pending',
      'Decided by: docs/decisions/one.md',
      'Tracked in: docs/plans/v0/missing.md',
      '---',
      '# Example Task',
    ].join('\n'),
  );
}

/**
 * @param {string} project_directory
 */
async function writeMarkdownStyleFixtureProject(project_directory) {
  await writeProjectFile(
    project_directory,
    '.patram.json',
    createMarkdownStyleConfigSource(),
  );
  await writeProjectFile(
    project_directory,
    'docs/decisions/one.md',
    '# Decision\n',
  );
  await writeProjectFile(
    project_directory,
    'docs/plans/v0/plan.md',
    '# Plan\n',
  );
  await writeProjectFile(
    project_directory,
    'docs/tasks/task.md',
    [
      '---',
      'Kind: task',
      '---',
      '- Status: pending',
      'Decided by: docs/decisions/one.md',
      '- Tracked in: docs/plans/v0/plan.md',
      '# Example Task',
      '[patram status=pending]: #',
    ].join('\n'),
  );
}

/**
 * @param {string} project_directory
 * @param {string} relative_path
 * @param {string} source_text
 */
async function writeProjectFile(project_directory, relative_path, source_text) {
  const file_path = join(project_directory, relative_path);
  await mkdir(dirname(file_path), { recursive: true });
  await writeFile(file_path, source_text);
}

/**
 * @returns {string}
 */
function createDirectiveValidationConfigSource() {
  return JSON.stringify(createDirectiveValidationConfig());
}

/**
 * @returns {string}
 */
function createMarkdownStyleConfigSource() {
  return JSON.stringify(createMarkdownStyleConfig());
}

/**
 * @returns {PatramRepoConfig}
 */
function createDirectiveValidationConfig() {
  return {
    classes: {
      document: {
        builtin: true,
      },
      task: {
        label: 'Task',
        schema: {
          document_path_class: 'task_docs',
          fields: createDirectiveRules(),
          unknown_fields: 'ignore',
        },
      },
    },
    fields: createDirectiveTypes(),
    include: ['docs/**/*.md'],
    mappings: createMarkdownDirectiveMappings(),
    path_classes: createDirectivePathClasses(),
    queries: {},
    relations: createDirectiveRelations(),
  };
}

/**
 * @returns {PatramRepoConfig}
 */
function createMarkdownStyleConfig() {
  const directive_validation_config = createDirectiveValidationConfig();

  return {
    ...directive_validation_config,
    classes: {
      ...directive_validation_config.classes,
      task: {
        ...directive_validation_config.classes?.task,
        schema: {
          ...directive_validation_config.classes?.task?.schema,
          fields: {
            ...directive_validation_config.classes?.task?.schema?.fields,
            status: {
              markdown_styles: ['list_item'],
              presence: 'required',
            },
          },
          mixed_styles: 'error',
        },
      },
    },
  };
}

/**
 * @returns {Record<string, MetadataFieldConfig>}
 */
function createDirectiveTypes() {
  return {
    decided_by: {
      multiple: true,
      path_class: 'decision_docs',
      type: 'path',
    },
    status: {
      type: 'enum',
      values: ['pending', 'ready'],
    },
    tracked_in: {
      path_class: 'plan_docs',
      type: 'path',
    },
  };
}

/**
 * @returns {Record<string, ClassFieldRuleConfig>}
 */
function createDirectiveRules() {
  return {
    decided_by: {
      presence: 'required',
    },
    status: {
      presence: 'required',
    },
    tracked_in: {
      presence: 'required',
    },
  };
}
