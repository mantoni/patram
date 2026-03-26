// @module-tag integration

import { afterEach, expect, it } from 'vitest';

import {
  cleanupTestContext,
  createTempProjectDirectory,
  createTestContext,
  createValidLinkSource,
  stripAnsi,
  writeProjectConfig,
  writeProjectFile,
} from './patram.test-helpers.js';
import { createPagedIoContext } from './patram-pager.test-helpers.js';
import { main } from './patram.js';

/**
 * Rich show output coverage.
 *
 * Covers source formatting, resolved-link summaries, and pager output for the
 * rich show renderer.
 *
 * Kind: support
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/source-rendering.md
 * Decided by: ../docs/decisions/source-rendering-terminal-surfaces.md
 * @patram
 * @see {@link ../lib/show-document.js}
 * @see {@link ../lib/render-output-view.js}
 */

const FULL_WIDTH_DIVIDER = ` ${'─'.repeat(78)} `;

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('renders markdown show output with custom formatting in rich mode', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createPagedIoContext();

  await writeProjectConfig(test_context.project_directory);
  await writeProjectFile(
    test_context.project_directory,
    'docs/patram.md',
    [
      '# Patram',
      '',
      'See [guide](./guide.md).',
      '',
      '```ts [app.ts]',
      'const value = 1;',
      '```',
    ].join('\n'),
  );
  await writeProjectFile(
    test_context.project_directory,
    'docs/guide.md',
    '# Some Guide\n',
  );
  process.chdir(test_context.project_directory);

  const exit_code = await main(
    ['show', 'docs/patram.md', '--color', 'always'],
    {
      stderr: io_context.stderr,
      stdout: io_context.stdout,
      write_paged_output: io_context.write_paged_output,
    },
  );

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(stripAnsi(io_context.paged_output_chunks[0])).toContain(
    EXPECTED_RICH_SOURCE_OUTPUT,
  );
  expect(stripAnsi(io_context.paged_output_chunks[0])).toContain(
    EXPECTED_RICH_RESOLVED_LINKS,
  );
  expect(io_context.stdout_chunks).toEqual([]);
});

it('renders non-markdown source files with syntax highlighting in rich mode', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createPagedIoContext();

  await writeProjectConfig(test_context.project_directory);
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
  await writeProjectFile(
    test_context.project_directory,
    'src/demo.js',
    'export const value = 1;\n',
  );
  process.chdir(test_context.project_directory);

  const exit_code = await main(['show', 'src/demo.js', '--color', 'always'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
    write_paged_output: io_context.write_paged_output,
  });

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(stripAnsi(io_context.paged_output_chunks[0])).toBe(
    ` ${'javascript'.padStart(78, ' ')} \n` +
      ` ${'export const value = 1;'.padEnd(78, ' ')} \n`,
  );
  expect(io_context.stdout_chunks).toEqual([]);
  expect(io_context.paged_output_chunks[0]).toContain('\u001B[');
});

const EXPECTED_RICH_RESOLVED_LINKS =
  `${FULL_WIDTH_DIVIDER}\n\n` +
  'document docs/patram.md\n' +
  '\n' +
  '    Patram\n' +
  '\n' +
  '[1] document docs/guide.md\n' +
  '\n' +
  '    Some Guide\n';

const EXPECTED_RICH_SOURCE_OUTPUT =
  '# Patram\n\nSee guide[1].\n\n' +
  ` ${'ts [app.ts]'.padStart(78, ' ')} \n` +
  ` ${` ${'const value = 1;'}`.padEnd(78, ' ')} \n` +
  ` ${' '.padEnd(78, ' ')} \n`;
