import { readFile } from 'node:fs/promises';

import { expect, it } from 'vitest';

import package_json from '../package.json' with { type: 'json' };

it('defines publish metadata for the npm package', async () => {
  expect(package_json).toMatchObject({
    engines: {
      node: '>=22',
    },
    files: ['bin/', 'lib/'],
    homepage: 'https://github.com/mantoni/patram',
    license: 'MIT',
    repository: {
      type: 'git',
      url: 'git+https://github.com/mantoni/patram.git',
    },
  });

  const license_text = await readTextFile(
    new URL('../LICENSE', import.meta.url),
  );

  expect(license_text).toContain('MIT License');
  expect(license_text).toContain(
    'Permission is hereby granted, free of charge',
  );
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
