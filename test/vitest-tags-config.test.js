import { readFile } from 'node:fs/promises';

import { expect, it } from 'vitest';

import vitest_config from '../vitest.config.js';

const integration_tagged_files = [
  'bin/patram-check-paths.test.js',
  'bin/patram-query.test.js',
  'bin/patram-show-rich.test.js',
  'bin/patram.test.js',
  'lib/write-paged-output.test.js',
  'scripts/update-changelog.test.js',
];

it('defines tag-aware Vitest timeout profiles and a higher slow-test threshold', () => {
  const test_config = vitest_config.test;

  if (!test_config) {
    throw new Error('Expected vitest.config.js to define a test config.');
  }

  expect(test_config.slowTestThreshold).toBe(5_000);
  expect(test_config.tags).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: 'integration',
        timeout: 15_000,
      }),
      expect.objectContaining({
        name: 'smoke',
        timeout: 30_000,
      }),
    ]),
  );
});

it('marks the slower integration-style test files with module tags', async () => {
  for (const file_path of integration_tagged_files) {
    const file_text = await readFile(file_path, 'utf8');

    expect(file_text).toContain('@module-tag integration');
  }

  const smoke_test_text = await readFile(
    'test/package-install-smoke.test.js',
    'utf8',
  );

  expect(smoke_test_text).toContain('@module-tag smoke');

  const package_metadata_test_text = await readFile(
    'test/package-metadata.test.js',
    'utf8',
  );

  expect(package_metadata_test_text).toContain("tags: ['integration']");
});
