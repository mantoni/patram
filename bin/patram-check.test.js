// @module-tag integration

import { afterEach, expect, it } from 'vitest';

import {
  cleanupTestContext,
  createBrokenLinkSource,
  createIoContext,
  createTempProjectDirectory,
  createTestContext,
  writeProjectConfig,
  writeProjectFile,
} from './patram.test-helpers.js';
import { main } from './patram.js';

/**
 * Check command behavior coverage.
 *
 * Covers config diagnostics and broken-link validation through the public CLI
 * boundary.
 *
 * Kind: support
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/check-command.md
 * @patram
 * @see {@link ../lib/check-graph.js}
 * @see {@link ./patram.js}
 */

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('prints config diagnostics for invalid config files', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectFile(
    test_context.project_directory,
    '.patram.json',
    JSON.stringify({
      include: [],
      queries: {},
    }),
  );

  const exit_code = await main(['check', test_context.project_directory], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([
    'file .patram.json\n' +
      '  1:1  error  Invalid config at "include": Include must contain at least one glob.  config.invalid\n' +
      '\n' +
      '\u2716 1 problem (1 error, 0 warnings)\n',
  ]);
  expect(io_context.stdout_chunks).toEqual([]);
});

it('prints grouped broken link diagnostics for check failures', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  await writeProjectFile(
    test_context.project_directory,
    'docs/patram.md',
    [
      '# Patram',
      '',
      'See [missing](./missing.md).',
      'See [missing too](./missing-too.md).',
    ].join('\n'),
  );

  const exit_code = await main(['check', test_context.project_directory], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([
    'document docs/patram.md\n' +
      '  3:5  error  Document link target "docs/missing.md" was not found.      graph.link_broken\n' +
      '  4:5  error  Document link target "docs/missing-too.md" was not found.  graph.link_broken\n' +
      '\n' +
      '\u2716 2 problems (2 errors, 0 warnings)\n',
  ]);
  expect(io_context.stdout_chunks).toEqual([]);
});

it('prints check diagnostics as json', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  await writeProjectFile(
    test_context.project_directory,
    'docs/patram.md',
    createBrokenLinkSource(),
  );

  const exit_code = await main(
    ['check', test_context.project_directory, '--json'],
    {
      stderr: io_context.stderr,
      stdout: io_context.stdout,
    },
  );

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([
    '{\n' +
      '  "diagnostics": [\n' +
      '    {\n' +
      '      "path": "docs/patram.md",\n' +
      '      "line": 3,\n' +
      '      "column": 5,\n' +
      '      "level": "error",\n' +
      '      "code": "graph.link_broken",\n' +
      '      "message": "Document link target \\"docs/missing.md\\" was not found."\n' +
      '    }\n' +
      '  ]\n' +
      '}\n',
  ]);
  expect(io_context.stdout_chunks).toEqual([]);
});
