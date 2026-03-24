import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { main } from './patram-cli.js';

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('renders directive validation diagnostics through the check command', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  process.chdir(test_context.project_directory);
  await writeFixtureProject(test_context.project_directory);

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

  expect(exit_code).toBe(1);
  expect(stdout_chunks).toEqual([]);
  expect(stderr_chunks.join('')).toContain('document docs/research/task.md');
  expect(stderr_chunks.join('')).toContain('directive.invalid_enum');
  expect(stderr_chunks.join('')).toContain('directive.missing_required');
  expect(stderr_chunks.join('')).toContain('document.invalid_placement');
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
 * @returns {object}
 */
function createDirectiveValidationConfig() {
  return {
    directive_types: createDirectiveTypes(),
    include: ['docs/**/*.md'],
    kinds: {
      document: {
        builtin: true,
      },
    },
    metadata_schemas: {
      task: {
        directives: createDirectiveRules(),
        document_path_class: 'task_docs',
      },
    },
    mappings: createDirectiveMappings(),
    path_classes: createPathClasses(),
    queries: {},
    relations: createDirectiveRelations(),
  };
}

/**
 * @returns {object}
 */
function createDirectiveTypes() {
  return {
    decided_by: {
      path_class: 'decision_docs',
      type: 'path',
    },
    status: {
      type: 'string',
    },
    tracked_in: {
      path_class: 'plan_docs',
      type: 'path',
    },
  };
}

/**
 * @returns {object}
 */
function createDirectiveRules() {
  return {
    decided_by: {
      multiple: true,
      presence: 'required',
    },
    status: {
      presence: 'required',
      type: {
        type: 'enum',
        values: ['pending', 'ready'],
      },
    },
    tracked_in: {
      presence: 'required',
    },
  };
}

/**
 * @returns {object}
 */
function createPathClasses() {
  return {
    decision_docs: {
      prefixes: ['docs/decisions/'],
    },
    plan_docs: {
      prefixes: ['docs/plans/'],
    },
    task_docs: {
      prefixes: ['docs/tasks/'],
    },
  };
}

/**
 * @returns {object}
 */
function createDirectiveRelations() {
  return {
    decided_by: {
      from: ['document'],
      to: ['document'],
    },
    tracked_in: {
      from: ['document'],
      to: ['document'],
    },
  };
}

/**
 * @returns {object}
 */
function createDirectiveMappings() {
  return {
    'markdown.directive.decided_by': createRelationMapping('decided_by'),
    'markdown.directive.kind': createNodeMapping('kind'),
    'markdown.directive.status': createNodeMapping('status'),
    'markdown.directive.tracked_in': createRelationMapping('tracked_in'),
  };
}

/**
 * @param {string} relation_name
 * @returns {object}
 */
function createRelationMapping(relation_name) {
  return {
    emit: {
      relation: relation_name,
      target: 'path',
      target_kind: 'document',
    },
  };
}

/**
 * @param {string} field_name
 * @returns {object}
 */
function createNodeMapping(field_name) {
  return {
    node: {
      field: field_name,
      kind: 'document',
    },
  };
}
