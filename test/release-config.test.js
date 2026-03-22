import { readFile } from 'node:fs/promises';

import { expect, it } from 'vitest';

import package_json from '../package.json' with { type: 'json' };

/**
 * Release workflow contract coverage.
 *
 * Verifies npm version scripts and the tag-based release workflow stay
 * aligned.
 *
 * Kind: support
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/release-automation.md
 * @patram
 * @see {@link ../scripts/update-changelog.js}
 * @see {@link ../docs/decisions/release-automation.md}
 */

it('defines npm version lifecycle scripts for releases', () => {
  expect(package_json.scripts).toMatchObject({
    postversion: 'git push && git push --tags',
    preversion: 'npm run all',
    version:
      'node scripts/update-changelog.js && git add CHANGELOG.md package.json package-lock.json',
  });
});

it('defines the tag-based publish and release workflow contract', async () => {
  const workflow_text = await readTextFile(
    new URL('../.github/workflows/release.yml', import.meta.url),
  );

  expect(workflow_text).toContain('push:');
  expect(workflow_text).toContain("tags:\n      - 'v*'");
  expect(workflow_text).toContain('contents: write');
  expect(workflow_text).toContain('id-token: write');
  expect(workflow_text).toContain('uses: actions/checkout@v6');
  expect(workflow_text).toContain('uses: actions/setup-node@v6');
  expect(workflow_text).toContain('node-version: 24');
  expect(workflow_text).toContain("registry-url: 'https://registry.npmjs.org'");
  expect(workflow_text).toContain('run: npm ci');
  expect(workflow_text).toContain('run: npm run all');
  expect(workflow_text).toContain(
    'run: npm publish --provenance --access public',
  );
  expect(workflow_text).toContain('gh release create');
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
