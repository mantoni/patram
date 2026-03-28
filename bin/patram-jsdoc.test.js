// @module-tag integration

import { afterEach, expect, it } from 'vitest';

import {
  cleanupTestContext,
  createIoContext,
  createTempProjectDirectory,
  createTestContext,
  writeProjectFile,
} from './patram.test-helpers.js';
import { main } from './patram.js';

/**
 * JSDoc metadata integration coverage.
 *
 * Verifies duplicate activated `@patram` blocks surface stable diagnostics
 * through the CLI boundary.
 *
 * Kind: support
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/jsdoc-metadata-directive-syntax.md
 * @patram
 * @see {@link ../lib/parse/jsdoc/parse-jsdoc-claims.js}
 * @see {@link ../docs/decisions/jsdoc-metadata-directive-syntax.md}
 */

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('prints parser diagnostics for duplicate activated Patram JSDoc blocks', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectFile(
    test_context.project_directory,
    'src/query-command.js',
    [
      '/**',
      ' * First block.',
      ' *',
      ' * Kind: task',
      ' *',
      ' * @patram',
      ' */',
      '',
      '/**',
      ' * Second block.',
      ' *',
      ' * Status: pending',
      ' *',
      ' * @patram',
      ' */',
      'export function runQuery() {}',
    ].join('\n'),
  );
  process.chdir(test_context.project_directory);

  const exit_code = await main(['check'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([
    'document src/query-command.js\n' +
      '  14:4  error  File "src/query-command.js" contains multiple JSDoc blocks with "@patram".  jsdoc.multiple_patram_blocks\n' +
      '\n' +
      '\u2716 1 problem (1 error, 0 warnings)\n',
  ]);
  expect(io_context.stdout_chunks).toEqual([]);
});
