// @module-tag integration

import { execFile as execFileCallback } from 'node:child_process';
import { symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

import ansis from 'ansis';
import { afterEach, expect, it } from 'vitest';

import {
  cleanupTestContext,
  createBlockedTaskSource,
  createDecisionSource,
  createIoContext,
  createTaskSource,
  createTempProjectDirectory,
  createTestContext,
  createValidLinkSource,
  writeProjectConfig,
  writeProjectFile,
  writeShowProject,
} from './patram.test-helpers.js';
import { loadHelpFixture } from './patram-help.test-helpers.js';
import { createPagedIoContext } from './patram-pager.test-helpers.js';
import { main } from './patram.js';

/**
 * CLI integration coverage.
 *
 * Exercises end-to-end command flow, pager behavior, and resolved-link output
 * through the public CLI boundary.
 *
 * Kind: support
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/cli-output-architecture.md
 * @patram
 * @see {@link ./patram.test-helpers.js}
 * @see {@link ../lib/cli/main.js}
 */

const execFile = promisify(execFileCallback);
const test_context = createTestContext();
const EXPECTED_SHOW_JSON_OUTPUT =
  '{\n' +
  '  "incoming_summary": {},\n' +
  '  "source": "# Patram\\n\\nSee [guide](./guide.md).",\n' +
  '  "resolved_links": [\n' +
  '    {\n' +
  '      "reference": 1,\n' +
  '      "label": "guide",\n' +
  '      "target": {\n' +
  '        "$class": "document",\n' +
  '        "$id": "doc:docs/guide.md",\n' +
  '        "fields": {},\n' +
  '        "title": "Some Guide",\n' +
  '        "$path": "docs/guide.md"\n' +
  '      }\n' +
  '    }\n' +
  '  ]\n' +
  '}\n';

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('ignores fenced-example links and external urls during check', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  await writeProjectFile(
    test_context.project_directory,
    'docs/patram.md',
    [
      '# Patram',
      '',
      'See [missing](./missing.md), [usage](#usage), and [clig.dev](https://clig.dev/).',
      '',
      '```json',
      '{',
      '  "source": "See [guide](./guide.md) and [query language](./query-language-v0.md)."',
      '}',
      '```',
    ].join('\n'),
  );

  const exit_code = await main(['check', test_context.project_directory], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([
    'document docs/patram.md\n' +
      '  3:5  error  Document link target "docs/missing.md" was not found.  graph.link_broken\n' +
      '\n' +
      '\u2716 1 problem (1 error, 0 warnings)\n',
  ]);
  expect(io_context.stdout_chunks).toEqual([]);
});

it('defaults check to the current working directory and exits 0 on valid input', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

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
  expect(io_context.stdout_chunks).toEqual([
    'Check passed.\nScanned 2 files. Found 0 errors.\n',
  ]);
});

it('accepts markdown links to existing repo files outside the indexed source set', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectFile(
    test_context.project_directory,
    'docs/nested/deeper/source.md',
    ['# Source', '', 'See [test](../../../some/test.js).'].join('\n'),
  );
  await writeProjectFile(
    test_context.project_directory,
    'some/test.js',
    'export const TEST_VALUE = 1;\n',
  );
  process.chdir(test_context.project_directory);

  const exit_code = await main(['check'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([
    'Check passed.\nScanned 2 files. Found 0 errors.\n',
  ]);
});

it('prints matching nodes for query --cypher', async () => {
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
    ['query', '--cypher', "MATCH (n:Task) WHERE n.status = 'pending' RETURN n"],
    {
      stderr: io_context.stderr,
      stdout: io_context.stdout,
    },
  );

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([
    'task docs/tasks/v0/query-command.md  (status=pending)\n' +
      '  Implement query command\n',
  ]);
});

it('runs a stored query by name', async () => {
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
  process.chdir(test_context.project_directory);

  const exit_code = await main(['query', 'pending'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([
    'task docs/tasks/v0/query-command.md  (status=pending)\n' +
      '  Implement query command\n',
  ]);
});

it('prints stored queries', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  process.chdir(test_context.project_directory);

  const exit_code = await main(['queries'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([
    "blocked  MATCH (n:Task) WHERE n.status = 'blocked' RETURN n\n" +
      '  Show blocked tasks.\n' +
      "pending  MATCH (n:Task) WHERE n.status = 'pending' RETURN n\n" +
      'Hint: patram help query-language\n',
  ]);
});

it('prints resolved source and links for show', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  await writeShowProject(test_context.project_directory);
  process.chdir(test_context.project_directory);

  const exit_code = await main(
    ['show', 'docs/patram.md', '--color', 'always'],
    {
      stderr: io_context.stderr,
      stdout: io_context.stdout,
    },
  );

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([
    '# Patram\n' +
      '\n' +
      'See [guide][1], [query language][2], and [implement query command][3].\n' +
      '\n' +
      '----------------\n' +
      '[1] document docs/guide.md\n' +
      '    Some Guide\n' +
      '\n' +
      '[2] decision docs/decisions/query-language-v0.md  (status=accepted)\n' +
      '    Query Language v0\n' +
      '\n' +
      '[3] task docs/tasks/v0/query-command.md  (status=pending)\n' +
      '    Implement query command\n',
  ]);
});

it('sends tty show output through the pager', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createPagedIoContext();

  await writeProjectConfig(test_context.project_directory);
  await writeShowProject(test_context.project_directory);
  process.chdir(test_context.project_directory);

  const exit_code = await main(['show', 'docs/patram.md'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
    write_paged_output: (output_text) =>
      io_context.write_paged_output(output_text),
  });
  const output = io_context.paged_output_chunks.join('');
  const stripped_output = ansis.strip(output);

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([]);
  expect(stripped_output).toContain('# Patram\n');
  expect(stripped_output).toContain('[1] document docs/guide.md\n');
});

it('prints show results as json', async () => {
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
    '# Some Guide\n',
  );
  process.chdir(test_context.project_directory);

  const exit_code = await main(['show', 'docs/patram.md', '--json'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([EXPECTED_SHOW_JSON_OUTPUT]);
});

it('reports a missing show file on stderr', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  process.chdir(test_context.project_directory);

  const exit_code = await main(['show', 'docs/missing.md'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([
    'docs/missing.md:1:1 error show.file_not_found File "docs/missing.md" was not found.\n',
  ]);
  expect(io_context.stdout_chunks).toEqual([]);
});

it('prints query results as json', async () => {
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
    [
      'query',
      '--cypher',
      "MATCH (n:Task) WHERE n.status = 'pending' RETURN n",
      '--json',
    ],
    {
      stderr: io_context.stderr,
      stdout: io_context.stdout,
    },
  );

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([createExpectedQueryJsonOutput()]);
});

it('rejects an unknown stored query name', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  process.chdir(test_context.project_directory);

  const exit_code = await main(['query', 'unknown'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([
    await loadHelpFixture('error-unknown-stored-query'),
  ]);
  expect(io_context.stdout_chunks).toEqual([]);
});

it('suggests a close stored query name', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeFile(
    join(test_context.project_directory, '.patram.json'),
    JSON.stringify({
      include: ['docs/**/*.md'],
      queries: {
        'active-plans': {
          cypher: "MATCH (n) WHERE n.id STARTS WITH 'doc:' RETURN n",
        },
      },
    }),
  );
  process.chdir(test_context.project_directory);

  const exit_code = await main(['query', 'active-plan'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([
    await loadHelpFixture('error-unknown-stored-query-suggestion'),
  ]);
  expect(io_context.stdout_chunks).toEqual([]);
});

it('rejects query without a Cypher query or query name', async () => {
  const io_context = createIoContext();

  const exit_code = await main(['query'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([
    await loadHelpFixture('error-missing-query-argument'),
  ]);
  expect(io_context.stdout_chunks).toEqual([]);
});

it('rejects query with an empty where value', async () => {
  const io_context = createIoContext();

  const exit_code = await main(['query', '--where'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual(['Where requires a value.\n']);
  expect(io_context.stdout_chunks).toEqual([]);
});

it('prints query diagnostics for invalid Cypher queries', async () => {
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
    ['query', '--cypher', 'MATCH (n) WHERE kind:decision RETURN n'],
    {
      stderr: io_context.stderr,
      stdout: io_context.stdout,
    },
  );

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([
    await loadHelpFixture('error-invalid-query'),
  ]);
  expect(io_context.stdout_chunks).toEqual([]);
});

it('runs the CLI when invoked through a symlinked executable path', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const executable_path = join(test_context.project_directory, 'patram');

  await symlink(join(import.meta.dirname, 'patram.js'), executable_path);

  await expect(
    execFile(executable_path, ['frob'], {
      encoding: 'utf8',
    }),
  ).rejects.toMatchObject({
    code: 1,
    stderr: await loadHelpFixture('error-unknown-command'),
    stdout: '',
  });
});

/**
 * @returns {string}
 */
function createExpectedQueryJsonOutput() {
  return (
    '{\n' +
    '  "results": [\n' +
    '    {\n' +
    '      "$class": "task",\n' +
    '      "$id": "task:docs/tasks/v0/query-command.md",\n' +
    '      "fields": {\n' +
    '        "status": "pending"\n' +
    '      },\n' +
    '      "title": "Implement query command",\n' +
    '      "$path": "docs/tasks/v0/query-command.md"\n' +
    '    }\n' +
    '  ],\n' +
    '  "summary": {\n' +
    '    "shown_count": 1,\n' +
    '    "total_count": 1,\n' +
    '    "offset": 0,\n' +
    '    "limit": 25\n' +
    '  },\n' +
    '  "hints": []\n' +
    '}\n'
  );
}
