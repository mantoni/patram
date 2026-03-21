import { readFile } from 'node:fs/promises';

import { expect, it } from 'vitest';

it('defines the checks workflow contract', async () => {
  const workflow_text = await readTextFile(
    new URL('../.github/workflows/checks.yml', import.meta.url),
  );

  expect(workflow_text).toContain('on:');
  expect(workflow_text).toContain('push:');
  expect(workflow_text).toContain('pull_request:');
  expect(workflow_text).toContain('node-version: ${{ matrix.node-version }}');
  expect(workflow_text).toContain('node-version: [22, 24, 25]');
  expect(workflow_text).toContain("cache: 'npm'");
  expect(workflow_text).toContain('run: npm ci');
  expect(workflow_text).toContain('run: npm run check:lint');
  expect(workflow_text).toContain('run: npm run check:format');
  expect(workflow_text).toContain('run: npm run check:types');
  expect(workflow_text).toContain('run: npm run test');
  expect(workflow_text).toContain('run: npm run test:coverage');
  expect(workflow_text).toContain('run: npm run check:dupes');
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
