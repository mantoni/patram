import { readFile } from 'node:fs/promises';

import { expect, it } from 'vitest';

import package_json from '../package.json' with { type: 'json' };

/**
 * Husky and lint-staged contract coverage.
 *
 * Verifies local pre-commit wiring stays aligned with package scripts and
 * staged-file checks.
 *
 * Kind: support
 * Status: active
 * Tracked in: ../docs/plans/v0/validation-test-deduplication.md
 * Decided by: ../docs/decisions/validation-test-deduplication.md
 * @patram
 * @see {@link ./package-metadata.test.js}
 * @see {@link ../docs/decisions/validation-test-deduplication.md}
 */

it('installs husky and wires pre-commit to the package checks', async () => {
  const dev_dependencies = /** @type {Record<string, string>} */ (
    package_json.devDependencies
  );
  const scripts = /** @type {Record<string, string>} */ (package_json.scripts);

  expect(typeof dev_dependencies.husky).toBe('string');
  expect(typeof dev_dependencies['lint-staged']).toBe('string');
  expect(scripts['check:patram']).toBe('./bin/patram.js check');
  expect(scripts['check:knip']).toBe('knip');
  expect(scripts['check:knip:production']).toBe(
    'knip --production --include exports',
  );
  expect(scripts['check:staged']).toBe('lint-staged');
  expect(scripts.prepare).toBe('husky');
  const all_script = scripts.all;

  expect(all_script).toContain('npm run check:types');
  expect(all_script).toContain('npm run check:patram');
  expect(all_script).toContain('npm run check:knip');
  expect(all_script).toContain('npm run test:coverage');
  expect(all_script).not.toMatch(/(^|&& )npm run test($| &&)/);
  expect(package_json['lint-staged']).toEqual({
    '*.{js,ts,json,md}': 'prettier --check',
    '*.{js,ts}': ['eslint', 'vitest related --run --passWithNoTests'],
  });

  const pre_commit_hook = await readTextFile(
    new URL('../.husky/pre-commit', import.meta.url),
  );

  expect(pre_commit_hook).toContain('npm run check:staged');
});

it('wires pre-push to a shell-based fixup check', async () => {
  const scripts = /** @type {Record<string, string>} */ (package_json.scripts);

  expect(scripts).not.toHaveProperty('check:fixups');

  const pre_push_hook = await readTextFile(
    new URL('../.husky/pre-push', import.meta.url),
  );

  expect(pre_push_hook).toContain("git rev-parse --verify '@{u}'");
  expect(pre_push_hook).toContain('git log --format=%s @{u}..HEAD');
  expect(pre_push_hook).toContain('git log --format=%s HEAD --not --remotes');
  expect(pre_push_hook).toContain("grep -qE '^(fixup!|squash!)'");
});

/**
 * Reads a UTF-8 text file.
 *
 * @param {URL} file_url
 * @returns {Promise<string>}
 */
async function readTextFile(file_url) {
  return readFile(file_url, 'utf8');
}
