import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import package_json from '../package.json' with { type: 'json' };

describe('husky config', () => {
  it('installs husky and wires pre-commit to the package checks', async () => {
    expect(package_json.devDependencies).toMatchObject({
      husky: expect.any(String),
      'lint-staged': expect.any(String),
    });
    expect(package_json.scripts).toMatchObject({
      'check:staged': 'lint-staged --quiet',
      prepare: 'husky',
    });
    expect(package_json.scripts.all).toContain('npm run check:types');
    expect(package_json['lint-staged']).toEqual({
      '*.{js,ts,json,md}': 'prettier --check',
      '*.{js,ts}': ['eslint', 'vitest related --run --passWithNoTests'],
    });

    const pre_commit_hook = await readTextFile(
      new URL('../.husky/pre-commit', import.meta.url),
    );

    expect(pre_commit_hook).toContain('npm run check:staged');
  });
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
