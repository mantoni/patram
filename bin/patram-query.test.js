// @module-tag integration

import process from 'node:process';

import { afterEach, expect, it } from 'vitest';

import {
  cleanupTestContext,
  createIoContext,
  createTaskSource,
  createTempProjectDirectory,
  createTestContext,
  stripAnsi,
  writeProjectConfig,
  writeProjectFile,
} from './patram.test-helpers.js';
import { createPagedIoContext } from './patram-pager.test-helpers.js';
import { main } from './patram.js';

/**
 * Query command behavior coverage.
 *
 * Covers default pagination, pager integration, and named-query execution
 * through the CLI boundary.
 *
 * Kind: support
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/query-command.md
 * Decided by: ../docs/decisions/tty-pager-output.md
 * @patram
 * @see {@link ../lib/graph/query/execute.js}
 * @see {@link ./patram.js}
 */

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('limits query results to 25 by default and prints a pagination hint', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writePendingTaskQueryProject(test_context.project_directory, 26);
  process.chdir(test_context.project_directory);

  const exit_code = await main(['query', 'pending'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });
  const output = io_context.stdout_chunks.join('');

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(output).toContain('task docs/tasks/v0/task-01.md');
  expect(output).toContain('task docs/tasks/v0/task-25.md');
  expect(output).not.toContain('task docs/tasks/v0/task-26.md');
  expect(output).toContain('Showing 25 of 26 matches.\n');
  expect(output).toContain(
    'Hint: use --offset <n> or --limit <n> to page through more matches.\n',
  );
});

it('applies query offset and limit without the default pagination hint', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writePendingTaskQueryProject(test_context.project_directory, 26);
  process.chdir(test_context.project_directory);

  const exit_code = await main(
    ['query', 'pending', '--offset', '25', '--limit', '5'],
    {
      stderr: io_context.stderr,
      stdout: io_context.stdout,
    },
  );
  const output = io_context.stdout_chunks.join('');

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(output).toContain('task docs/tasks/v0/task-26.md');
  expect(output).not.toContain('task docs/tasks/v0/task-25.md');
  expect(output).toContain('Showing 1 of 26 matches.\n');
  expect(output).not.toContain('Hint: use --offset <n> or --limit <n>');
});

it('prints rich query results by default on a tty', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createPagedIoContext();
  const original_no_color = process.env.NO_COLOR;
  const original_term = process.env.TERM;

  await writeProjectConfig(test_context.project_directory);
  await writeProjectFile(
    test_context.project_directory,
    'docs/tasks/v0/query-command.md',
    createTaskSource('pending'),
  );
  process.chdir(test_context.project_directory);
  delete process.env.NO_COLOR;
  process.env.TERM = 'xterm-256color';

  try {
    await expectRichQueryOutput(io_context);
  } finally {
    restoreTerminalEnvironment(original_no_color, original_term);
  }
});

it('sends tty query output through the pager and removes the default limit', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createPagedIoContext();

  await writePendingTaskQueryProject(test_context.project_directory, 26);
  process.chdir(test_context.project_directory);

  const exit_code = await main(['query', 'pending'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
    write_paged_output: io_context.write_paged_output,
  });
  const output = io_context.paged_output_chunks.join('');

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([]);
  expect(output).toContain('task docs/tasks/v0/task-01.md');
  expect(output).toContain('task docs/tasks/v0/task-26.md');
  expect(output).not.toContain('Showing 26 of 26 matches.\n');
  expect(output).not.toContain(
    'Hint: use --offset <n> or --limit <n> to page through more matches.\n',
  );
});

it('keeps an explicit limit when tty query output is paged', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createPagedIoContext();

  await writePendingTaskQueryProject(test_context.project_directory, 26);
  process.chdir(test_context.project_directory);

  const exit_code = await main(['query', 'pending', '--limit', '5'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
    write_paged_output: io_context.write_paged_output,
  });
  const output = io_context.paged_output_chunks.join('');

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([]);
  expect(output).toContain('task docs/tasks/v0/task-01.md');
  expect(output).toContain('task docs/tasks/v0/task-05.md');
  expect(output).not.toContain('task docs/tasks/v0/task-06.md');
  expect(output).toContain('Showing 5 of 26 matches.\n');
});

/**
 * @param {{ paged_output_chunks: string[], stderr: { write(chunk: string): boolean }, stderr_chunks: string[], stdout: { isTTY: boolean, write(chunk: string): boolean }, stdout_chunks: string[], write_paged_output(output_text: string): Promise<void> }} io_context
 */
async function expectRichQueryOutput(io_context) {
  const exit_code = await main(
    ['query', '--where', '$class=task and status=pending'],
    {
      stderr: io_context.stderr,
      stdout: io_context.stdout,
      write_paged_output: io_context.write_paged_output,
    },
  );

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(stripAnsi(io_context.paged_output_chunks.join(''))).toBe(
    'task docs/tasks/v0/query-command.md\n' +
      'status: pending\n' +
      '\n' +
      '    Implement query command\n',
  );
  expect(io_context.stdout_chunks).toEqual([]);
  expect(io_context.paged_output_chunks.join('')).toContain('\u001B[');
}

/**
 * @param {string} project_directory
 * @param {number} file_count
 */
async function writePendingTaskQueryProject(project_directory, file_count) {
  await writeProjectConfig(project_directory);

  for (let index = 1; index <= file_count; index += 1) {
    const file_number = String(index).padStart(2, '0');

    await writeProjectFile(
      project_directory,
      `docs/tasks/v0/task-${file_number}.md`,
      createTaskSource('pending'),
    );
  }
}

/**
 * @param {string | undefined} original_no_color
 * @param {string | undefined} original_term
 */
function restoreTerminalEnvironment(original_no_color, original_term) {
  if (original_no_color === undefined) {
    delete process.env.NO_COLOR;
  } else {
    process.env.NO_COLOR = original_no_color;
  }

  if (original_term === undefined) {
    delete process.env.TERM;
  } else {
    process.env.TERM = original_term;
  }
}
