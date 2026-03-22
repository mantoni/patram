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
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/husky-checks.md
 * @patram
 * @see {@link ./package-metadata.test.js}
 * @see {@link ../docs/decisions/husky-checks.md}
 */

it('installs husky and wires pre-commit to the package checks', async () => {
  expect(package_json.devDependencies).toMatchObject({
    husky: expect.any(String),
    'lint-staged': expect.any(String),
  });
  expect(package_json.scripts).toMatchObject({
    'check:patram': './bin/patram.js check',
    'check:staged': 'lint-staged --quiet',
    prepare: 'husky',
  });
  expect(package_json.scripts.all).toContain('npm run check:types');
  expect(package_json.scripts.all).toContain('npm run check:patram');
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
  expect(package_json.scripts).not.toHaveProperty('check:fixups');

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
