// @module-tag integration

import process from 'node:process';

import { afterEach, expect, it } from 'vitest';

import {
  cleanupTestContext,
  createIoContext,
  createTaskSource,
  createTempProjectDirectory,
  createTestContext,
  writeProjectConfig,
  writeProjectFile,
} from './patram.test-helpers.js';
import { loadHelpFixture } from './patram-help.test-helpers.js';
import { main } from './patram.js';

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('prints root help for the root help entrypoints', async () => {
  const expected_output = await loadHelpFixture('root-help');

  await expectHelpSuccess([], expected_output);
  await expectHelpSuccess(['--help'], expected_output);
  await expectHelpSuccess(['help'], expected_output);
});

it('prints help for every v0 command', async () => {
  await expectHelpSuccess(
    ['help', 'check'],
    await loadHelpFixture('command-help-check'),
  );
  await expectHelpSuccess(
    ['query', '--help'],
    await loadHelpFixture('command-help-query'),
  );
  await expectHelpSuccess(
    ['queries', '--help'],
    await loadHelpFixture('command-help-queries'),
  );
  await expectHelpSuccess(
    ['help', 'refs'],
    await loadHelpFixture('command-help-refs'),
  );
  await expectHelpSuccess(
    ['show', '--help'],
    await loadHelpFixture('command-help-show'),
  );
});

it('keeps query help identical across both command help entrypoints', async () => {
  const expected_output = await loadHelpFixture('command-help-query');

  await expectHelpSuccess(['help', 'query'], expected_output);
  await expectHelpSuccess(['query', '--help'], expected_output);
});

it('prints the query-language help topic', async () => {
  await expectHelpSuccess(
    ['help', 'query-language'],
    await loadHelpFixture('help-topic-query-language'),
  );
});

it('reports unknown commands and unknown help targets with recovery steps', async () => {
  await expectHelpError(
    ['frob'],
    await loadHelpFixture('error-unknown-command'),
  );
  await expectHelpError(
    ['qurey'],
    await loadHelpFixture('error-unknown-command-suggestion'),
  );
  await expectHelpError(
    ['help', 'frob'],
    await loadHelpFixture('error-unknown-help-target'),
  );
  await expectHelpError(
    ['help', 'qurey'],
    await loadHelpFixture('error-unknown-help-target-command-suggestion'),
  );
  await expectHelpError(
    ['help', 'query-lang'],
    await loadHelpFixture('error-unknown-help-target-topic-suggestion'),
  );
});

it('reports unknown and invalid options with command-specific recovery', async () => {
  await expectHelpError(
    ['query', '--wat'],
    await loadHelpFixture('error-unknown-option'),
  );
  await expectHelpError(
    ['query', '--ofset'],
    await loadHelpFixture('error-unknown-option-suggestion'),
  );
  await expectHelpError(
    ['check', '--where', 'kind=task'],
    await loadHelpFixture('error-invalid-command-option'),
  );
});

it('reports missing required arguments with usage and examples', async () => {
  await expectHelpError(
    ['show'],
    await loadHelpFixture('error-missing-show-argument'),
  );
  await expectHelpError(
    ['query'],
    await loadHelpFixture('error-missing-query-argument'),
  );
});

it('wraps invalid where-clause diagnostics with the query-language help hint', async () => {
  test_context.project_directory = await createTempProjectDirectory();

  await writeProjectConfig(test_context.project_directory);
  await writeProjectFile(
    test_context.project_directory,
    'docs/tasks/v0/query-command.md',
    createTaskSource('pending'),
  );
  process.chdir(test_context.project_directory);

  await expectHelpError(
    ['query', '--where', 'kind:decision'],
    await loadHelpFixture('error-invalid-where'),
  );
});

/**
 * @param {string[]} cli_arguments
 * @param {string} expected_output
 */
async function expectHelpError(cli_arguments, expected_output) {
  const io_context = createIoContext();
  const exit_code = await main(cli_arguments, {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([expected_output]);
  expect(io_context.stdout_chunks).toEqual([]);
}

/**
 * @param {string[]} cli_arguments
 * @param {string} expected_output
 */
async function expectHelpSuccess(cli_arguments, expected_output) {
  const io_context = createIoContext();
  const exit_code = await main(cli_arguments, {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([expected_output]);
}
