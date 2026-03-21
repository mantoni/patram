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
