import { readdir } from 'node:fs/promises';

import { expect, it } from 'vitest';

/**
 * Repo layout contract coverage.
 *
 * Keeps repo-level contract tests out of `lib/` so library tests and repo
 * tests stay distinct.
 *
 * Kind: support
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/test-layout.md
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
