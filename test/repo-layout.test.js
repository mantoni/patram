import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { expect, it } from 'vitest';

/**
 * Repo layout contract coverage.
 *
 * Keeps repo-level contract tests out of `lib/` so library tests and repo
 * tests stay distinct.
 *
 * kind: support
 * status: active
 * tracked_in: ../docs/plans/v0/source-anchor-dogfooding.md
 * decided_by: ../docs/decisions/test-layout.md
 * @patram
 * @see {@link ./repo-config.test.js}
 * @see {@link ../docs/decisions/test-layout.md}
 */

it('keeps repo-level tests out of lib', async () => {
  const lib_entries = await readdir(new URL('../lib/', import.meta.url));

  expect(lib_entries).not.toContain('github-actions-config.test.js');
  expect(lib_entries).not.toContain('husky-config.test.js');
  expect(lib_entries).not.toContain('repo-config.test.js');
});

it('keeps compatibility facade modules out of lib', async () => {
  const facade_paths = await listCompatibilityFacadePaths(
    new URL('../lib/', import.meta.url),
    'lib',
  );

  expect(facade_paths).toEqual([]);
});

/**
 * @param {URL} directory_url
 * @param {string} relative_directory_path
 * @returns {Promise<string[]>}
 */
async function listCompatibilityFacadePaths(
  directory_url,
  relative_directory_path,
) {
  const directory_entries = await readdir(directory_url, {
    withFileTypes: true,
  });
  /** @type {string[]} */
  const facade_paths = [];

  for (const directory_entry of directory_entries) {
    const entry_url = new URL(`${directory_entry.name}`, directory_url);
    const relative_file_path = join(
      relative_directory_path,
      directory_entry.name,
    );

    if (directory_entry.isDirectory()) {
      const nested_facade_paths = await listCompatibilityFacadePaths(
        new URL(`${directory_entry.name}/`, directory_url),
        relative_file_path,
      );

      facade_paths.push(...nested_facade_paths);
      continue;
    }

    if (!isRuntimeOrTypesModule(directory_entry.name)) {
      continue;
    }

    const source_text = await readFile(entry_url, 'utf8');

    if (
      isCompatibilityFacade(source_text) &&
      !ALLOWED_PACKAGE_ENTRYPOINTS.has(relative_file_path)
    ) {
      facade_paths.push(relative_file_path);
    }
  }

  return facade_paths.sort();
}

/**
 * @param {string} file_name
 */
function isRuntimeOrTypesModule(file_name) {
  return (
    file_name.endsWith('.js') ||
    file_name.endsWith('.ts') ||
    file_name.endsWith('.d.ts')
  );
}

/**
 * @param {string} source_text
 */
function isCompatibilityFacade(source_text) {
  const trimmed_source = source_text.trim();

  if (trimmed_source.length === 0) {
    return false;
  }

  return trimmed_source
    .split('\n')
    .every((source_line) =>
      /^export\s+(?:\*|\{[^}]+\})\s+from\s+'.+';$/u.test(source_line),
    );
}

const ALLOWED_PACKAGE_ENTRYPOINTS = new Set([
  'lib/patram.d.ts',
  'lib/patram.js',
]);
