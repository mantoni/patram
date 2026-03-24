// @module-tag integration

import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

import { afterEach, expect, it } from 'vitest';

import { writePagedOutput } from './write-paged-output.js';

/** @type {{ original_path: string | undefined, original_pager: string | undefined, temporary_directory: string | null }} */
const test_context = {
  original_path: process.env.PATH,
  original_pager: process.env.PAGER,
  temporary_directory: null,
};

afterEach(async () => {
  restorePagerEnvironment();

  if (test_context.temporary_directory) {
    await rm(test_context.temporary_directory, {
      force: true,
      recursive: true,
    });
    test_context.temporary_directory = null;
  }
});

it('invokes the default less pager with -S to disable line wrapping', async () => {
  test_context.temporary_directory = await mkdtemp(
    join(tmpdir(), 'patram-write-paged-output-'),
  );
  const arguments_path = join(test_context.temporary_directory, 'args.txt');
  const stdin_path = join(test_context.temporary_directory, 'stdin.txt');

  await writeFakeLessScript(
    test_context.temporary_directory,
    arguments_path,
    stdin_path,
  );
  delete process.env.PAGER;
  process.env.PATH = [
    test_context.temporary_directory,
    test_context.original_path,
  ]
    .filter(Boolean)
    .join(':');

  await writePagedOutput('alpha\nbeta\n');

  expect(await readFile(arguments_path, 'utf8')).toBe('-FIRXS\n');
  expect(await readFile(stdin_path, 'utf8')).toBe('alpha\nbeta\n');
});

it('uses the configured pager command through the shell', async () => {
  test_context.temporary_directory = await mkdtemp(
    join(tmpdir(), 'patram-write-paged-output-'),
  );
  const arguments_path = join(
    test_context.temporary_directory,
    'pager-args.txt',
  );
  const stdin_path = join(test_context.temporary_directory, 'pager-stdin.txt');
  const script_path = join(test_context.temporary_directory, 'pager-shim');

  await writeFile(
    script_path,
    [
      '#!/bin/sh',
      `printf "%s\\n" "$@" > "${arguments_path}"`,
      `cat > "${stdin_path}"`,
    ].join('\n'),
  );
  await chmod(script_path, 0o755);
  process.env.PAGER = `${script_path} --plain`;

  await writePagedOutput('custom\npager\n');

  expect(await readFile(arguments_path, 'utf8')).toBe('--plain\n');
  expect(await readFile(stdin_path, 'utf8')).toBe('custom\npager\n');
});

it('throws when the pager exits with a non-zero code', async () => {
  test_context.temporary_directory = await mkdtemp(
    join(tmpdir(), 'patram-write-paged-output-'),
  );
  const script_path = join(test_context.temporary_directory, 'less');

  await writeFile(
    script_path,
    ['#!/bin/sh', 'cat >/dev/null', 'exit 2'].join('\n'),
  );
  await chmod(script_path, 0o755);
  delete process.env.PAGER;
  process.env.PATH = [
    test_context.temporary_directory,
    test_context.original_path,
  ]
    .filter(Boolean)
    .join(':');

  await expect(writePagedOutput('broken\npager\n')).rejects.toThrow(
    'Pager exited with code 2.',
  );
});

it('resolves broken pipe writes when the pager closes early', async () => {
  test_context.temporary_directory = await mkdtemp(
    join(tmpdir(), 'patram-write-paged-output-'),
  );
  const script_path = join(test_context.temporary_directory, 'less');

  await writeFile(script_path, ['#!/bin/sh', 'exit 0'].join('\n'));
  await chmod(script_path, 0o755);
  delete process.env.PAGER;
  process.env.PATH = [
    test_context.temporary_directory,
    test_context.original_path,
  ]
    .filter(Boolean)
    .join(':');

  await expect(writePagedOutput('closed\npager\n')).resolves.toBeUndefined();
});

it('throws when spawning the default pager fails', async () => {
  delete process.env.PAGER;
  process.env.PATH = '';

  await expect(writePagedOutput('missing\npager\n')).rejects.toMatchObject({
    code: 'ENOENT',
  });
});

it('throws when the pager exits with a signal', async () => {
  test_context.temporary_directory = await mkdtemp(
    join(tmpdir(), 'patram-write-paged-output-'),
  );
  const script_path = join(test_context.temporary_directory, 'less');

  await writeFile(script_path, ['#!/bin/sh', 'kill -TERM $$'].join('\n'));
  await chmod(script_path, 0o755);
  delete process.env.PAGER;
  process.env.PATH = [
    test_context.temporary_directory,
    test_context.original_path,
  ]
    .filter(Boolean)
    .join(':');

  await expect(writePagedOutput('signal\npager\n')).rejects.toThrow(
    'Pager exited with signal "SIGTERM".',
  );
});

/**
 * Write a temporary `less` shim that records its arguments and stdin.
 *
 * @param {string} temporary_directory
 * @param {string} arguments_path
 * @param {string} stdin_path
 */
async function writeFakeLessScript(
  temporary_directory,
  arguments_path,
  stdin_path,
) {
  const script_path = join(temporary_directory, 'less');
  const script_text = [
    '#!/bin/sh',
    `printf "%s\\n" "$@" > "${arguments_path}"`,
    `cat > "${stdin_path}"`,
  ].join('\n');

  await writeFile(script_path, script_text);
  await chmod(script_path, 0o755);
}

/**
 * Restore pager-related environment variables after each test.
 */
function restorePagerEnvironment() {
  if (test_context.original_path === undefined) {
    delete process.env.PATH;
  } else {
    process.env.PATH = test_context.original_path;
  }

  if (test_context.original_pager === undefined) {
    delete process.env.PAGER;
  } else {
    process.env.PAGER = test_context.original_pager;
  }
}
