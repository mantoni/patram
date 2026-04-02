/* eslint-disable max-lines, max-lines-per-function */
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { loadPatramConfig } from './load-patram-config.js';

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('loads and validates .patram.json from a project directory', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    createValidConfigSource(),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result).toEqual({
    config: createExpectedValidConfig(),
    config_path: '.patram.json',
    diagnostics: [],
  });
});

it('defaults to the current working directory', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    createValidConfigSource(),
  );
  process.chdir(test_context.project_directory);

  const load_result = await loadPatramConfig();

  expect(load_result.config?.queries.pending.cypher).toBe(
    "MATCH (n:Task) WHERE n.status = 'pending' RETURN n",
  );
  expect(load_result.config?.queries.pending.description).toBe(
    'Show pending tasks.',
  );
  expect(load_result.config?.classes?.task?.label).toBe('Task');
  expect(load_result.diagnostics).toEqual([]);
});

it('returns built-in defaults when the config file is missing', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result).toEqual({
    config: {
      include: [
        '**/*.cjs',
        '**/*.cts',
        '**/*.js',
        '**/*.jsx',
        '**/*.mjs',
        '**/*.mts',
        '**/*.ts',
        '**/*.tsx',
        '**/*.markdown',
        '**/*.md',
        '**/*.yaml',
        '**/*.yml',
      ],
      queries: {},
    },
    config_path: '.patram.json',
    diagnostics: [],
  });
});

it('loads stored Cypher queries', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    createCypherConfigSource(),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result).toEqual({
    config: createExpectedCypherConfig(),
    config_path: '.patram.json',
    diagnostics: [],
  });
});

it('reports invalid JSON syntax', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(test_context.project_directory, createBrokenJson());

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result.config).toBeNull();
  expect(load_result.diagnostics).toEqual([
    {
      code: 'config.invalid_json',
      column: 1,
      level: 'error',
      line: 3,
      message: 'Invalid JSON syntax.',
      path: '.patram.json',
    },
  ]);
});

it('reports config validation diagnostics', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    createInvalidConfigSource(),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result.config).toBeNull();
  expect(load_result.diagnostics).toEqual([
    {
      code: 'config.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message:
        'Invalid config at "include": Include must contain at least one glob.',
      path: '.patram.json',
    },
    {
      code: 'config.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message:
        'Invalid config at "queries.pending.cypher": Stored query "cypher" must not be empty.',
      path: '.patram.json',
    },
  ]);
});

it('reports graph schema validation diagnostics', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    createInvalidGraphConfigSource(),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result.config).toBeNull();
  expect(load_result.diagnostics).toEqual([
    {
      code: 'config.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message:
        'Invalid config at "mappings.markdown.link.emit.relation": Unknown relation "missing_relation".',
      path: '.patram.json',
    },
  ]);
});

it('rejects top-level class_schemas', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    JSON.stringify({
      class_schemas: {
        task: {
          fields: {
            status: {
              presence: 'required',
            },
          },
        },
      },
      classes: {
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
      queries: {},
    }),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result.config).toBeNull();
  expect(load_result.diagnostics).toEqual([
    {
      code: 'config.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message:
        'Invalid config at "class_schemas": Top-level "class_schemas" is not supported. Move entries into classes.<name>.schema.',
      path: '.patram.json',
    },
  ]);
});

it('uses built-in include globs when a config omits include', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    JSON.stringify({
      queries: {
        pending: {
          description: 'Show pending tasks.',
          cypher: 'MATCH (n:Task) RETURN n',
        },
      },
    }),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result).toEqual({
    config: {
      include: [
        '**/*.cjs',
        '**/*.cts',
        '**/*.js',
        '**/*.jsx',
        '**/*.mjs',
        '**/*.mts',
        '**/*.ts',
        '**/*.tsx',
        '**/*.markdown',
        '**/*.md',
        '**/*.yaml',
        '**/*.yml',
      ],
      queries: {
        pending: {
          description: 'Show pending tasks.',
          cypher: 'MATCH (n:Task) RETURN n',
        },
      },
    },
    config_path: '.patram.json',
    diagnostics: [],
  });
});

it('accepts class-local identity config and metadata fields that shadow old structural names', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    JSON.stringify({
      classes: {
        decision: {
          identity: {
            type: 'document_path',
          },
          schema: {
            document_path_class: 'decision_docs',
            fields: {
              id: {
                presence: 'optional',
              },
              path: {
                presence: 'optional',
              },
            },
            unknown_fields: 'ignore',
          },
        },
      },
      fields: {
        class: {
          type: 'string',
        },
        filename: {
          type: 'string',
        },
        id: {
          type: 'string',
        },
        path: {
          type: 'path',
        },
      },
      include: ['docs/**/*.md'],
      path_classes: {
        decision_docs: {
          prefixes: ['docs/decisions/'],
        },
      },
      queries: {
        decisions: {
          cypher:
            "MATCH (n:Decision) WHERE path(n) STARTS WITH 'docs/decisions/' RETURN n",
        },
      },
    }),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result.config?.classes?.decision?.identity).toEqual({
    type: 'document_path',
  });
  expect(load_result.config?.fields?.id?.type).toBe('string');
  expect(load_result.config?.fields?.path?.type).toBe('path');
  expect(load_result.diagnostics).toEqual([]);
});

it('rejects structural mapping targets and removed structural query aliases', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    JSON.stringify({
      classes: {
        decision: {
          identity: {
            type: 'document_path',
          },
          schema: {
            document_path_class: 'decision_docs',
            fields: {
              status: {
                presence: 'optional',
              },
            },
            unknown_fields: 'ignore',
          },
        },
      },
      fields: {
        status: {
          type: 'enum',
          values: ['accepted'],
        },
      },
      include: ['docs/**/*.md'],
      mappings: {
        'markdown.directive.kind': {
          node: {
            class: 'document',
            field: '$class',
          },
        },
      },
      path_classes: {
        decision_docs: {
          prefixes: ['docs/decisions/'],
        },
      },
      queries: {
        broken: {
          cypher: "MATCH (n) WHERE n.id = 'decision:query-language' RETURN n",
        },
      },
      relations: {},
    }),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result.config).toBeNull();
  expect(load_result.diagnostics).toEqual([
    {
      code: 'config.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message:
        'Invalid config at "mappings.markdown.directive.kind.node.field": Structural mapping fields are not supported.',
      path: '.patram.json',
    },
    {
      code: 'config.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message: 'Invalid config at "queries.broken.cypher": Unknown field "id".',
      path: '.patram.json',
    },
  ]);
});

it('rejects stored queries with unknown metadata fields', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    JSON.stringify({
      fields: {
        status: {
          type: 'enum',
          values: ['pending'],
        },
      },
      include: ['docs/**/*.md'],
      queries: {
        pending: {
          cypher: "MATCH (n:Task) WHERE n.owner = 'max' RETURN n",
        },
      },
    }),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result.config).toBeNull();
  expect(load_result.diagnostics).toEqual([
    {
      code: 'config.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message:
        'Invalid config at "queries.pending.cypher": Unknown field "owner".',
      path: '.patram.json',
    },
  ]);
});

it('rejects stored queries with unsupported metadata operators', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await writeProjectConfig(
    test_context.project_directory,
    JSON.stringify({
      fields: {
        status: {
          type: 'enum',
          values: ['pending'],
        },
      },
      include: ['docs/**/*.md'],
      queries: {
        pending: {
          cypher: "MATCH (n) WHERE n.status STARTS WITH 'pending' RETURN n",
        },
      },
    }),
  );

  const load_result = await loadPatramConfig(test_context.project_directory);

  expect(load_result.config).toBeNull();
  expect(load_result.diagnostics).toEqual([
    {
      code: 'config.invalid',
      column: 1,
      level: 'error',
      line: 1,
      message:
        'Invalid config at "queries.pending.cypher": Field "status" does not support the "^=" operator.',
      path: '.patram.json',
    },
  ]);
});

/**
 * @returns {Promise<string>}
 */
async function createTempProjectDirectory() {
  return mkdtemp(join(tmpdir(), 'patram-load-config-'));
}

/**
 * @param {string} project_directory
 * @param {string} config_source
 */
async function writeProjectConfig(project_directory, config_source) {
  await writeFile(join(project_directory, '.patram.json'), config_source);
}

/**
 * @param {string} project_directory
 */
async function removeDirectory(project_directory) {
  await rm(project_directory, { force: true, recursive: true });
}

/**
 * @returns {string}
 */
function createBrokenJson() {
  return ['{', '  "include": [', '}'].join('\n');
}

/**
 * @returns {string}
 */
function createInvalidConfigSource() {
  return JSON.stringify({
    include: [],
    queries: {
      pending: {
        cypher: '',
      },
    },
  });
}

/**
 * @returns {string}
 */
function createInvalidGraphConfigSource() {
  return JSON.stringify({
    classes: {
      document: {
        builtin: true,
      },
    },
    include: ['docs/**/*.md'],
    mappings: {
      'markdown.link': {
        emit: {
          relation: 'missing_relation',
          target: 'path',
          target_class: 'document',
        },
      },
    },
    queries: {},
    relations: {},
  });
}

/**
 * @returns {string}
 */
function createValidConfigSource() {
  return JSON.stringify(createExpectedValidConfig());
}

/**
 * @returns {string}
 */
function createCypherConfigSource() {
  return JSON.stringify(createExpectedCypherConfig());
}

/**
 * @returns {object}
 */
function createExpectedValidConfig() {
  return {
    classes: {
      document: {
        builtin: true,
      },
      task: {
        label: 'Task',
        schema: {
          fields: {
            owner: {
              presence: 'optional',
            },
            status: {
              presence: 'required',
            },
          },
          unknown_fields: 'error',
        },
      },
    },
    fields: {
      owner: {
        type: 'string',
      },
      status: {
        type: 'enum',
        values: ['pending', 'ready'],
      },
    },
    include: ['docs/**/*.md'],
    queries: {
      pending: {
        description: 'Show pending tasks.',
        cypher: "MATCH (n:Task) WHERE n.status = 'pending' RETURN n",
      },
    },
  };
}

/**
 * @returns {object}
 */
function createExpectedCypherConfig() {
  return {
    include: [
      '**/*.cjs',
      '**/*.cts',
      '**/*.js',
      '**/*.jsx',
      '**/*.mjs',
      '**/*.mts',
      '**/*.ts',
      '**/*.tsx',
      '**/*.markdown',
      '**/*.md',
      '**/*.yaml',
      '**/*.yml',
    ],
    classes: {
      task: {
        label: 'Task',
      },
    },
    fields: {
      status: {
        type: 'string',
      },
    },
    queries: {
      pending: {
        cypher: "MATCH (n:Task) WHERE n.status = 'pending' RETURN n",
        description: 'Show pending tasks.',
      },
    },
  };
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
 * @param {{ original_working_directory: string, project_directory: string | null }} test_context
 */
async function cleanupTestContext(test_context) {
  process.chdir(test_context.original_working_directory);

  if (test_context.project_directory) {
    await removeDirectory(test_context.project_directory);
    test_context.project_directory = null;
  }
}
