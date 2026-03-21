import { afterEach, expect, it } from 'vitest';

import {
  cleanupTestContext,
  createIoContext,
  createTempProjectDirectory,
  createTestContext,
  createValidLinkSource,
  writeProjectConfig,
  writeProjectFile,
} from './patram.test-helpers.js';
import { main } from './patram.js';

const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('checks one file path from the repo root', async () => {
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
    '# Guide\n',
  );
  process.chdir(test_context.project_directory);

  const exit_code = await main(['check', 'docs/patram.md'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([
    'Check passed.\nScanned 1 file. Found 0 errors.\n',
  ]);
});

it('checks one directory path from the repo root', async () => {
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
    '# Guide\n',
  );
  await writeProjectFile(
    test_context.project_directory,
    'notes/ignored.md',
    '# Ignored\n',
  );
  process.chdir(test_context.project_directory);

  const exit_code = await main(['check', 'docs'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([
    'Check passed.\nScanned 2 files. Found 0 errors.\n',
  ]);
});
