import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';

import { afterEach, expect, it } from 'vitest';

import {
  extractLatestChangelogSection,
  isEntrypoint,
  isFileNotFoundError,
  normalizeGitHubRepositoryUrl,
  parseGitLogLine,
  prependReleaseSection,
  updateChangelog,
} from './update-changelog.js';

const exec_file = promisify(execFile);
const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('prepends a release section from commit subjects since the previous tag', async () => {
  test_context.project_directory = await createReleasedProjectDirectory();

  await updateChangelog({
    current_date: '2026-03-20',
    project_directory: test_context.project_directory,
  });

  const changelog_text = await readFile(
    join(test_context.project_directory, 'CHANGELOG.md'),
    'utf8',
  );

  expectReleasedChangelog(changelog_text);
});

it('creates an initial changelog section when no tag or changelog exists', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  await initializeGitRepository(
    test_context.project_directory,
    'https://github.com/mantoni/patram.git',
  );
  await writePackageJson(test_context.project_directory, '0.1.0');
  await createSourceFile(
    test_context.project_directory,
    'README.md',
    '# Patram\n',
  );
  await commitAll(
    test_context.project_directory,
    'Initial public release',
    '2026-03-12T08:00:00Z',
  );

  await updateChangelog({
    current_date: '2026-03-20',
    project_directory: test_context.project_directory,
  });

  const changelog_text = await readFile(
    join(test_context.project_directory, 'CHANGELOG.md'),
    'utf8',
  );

  expect(changelog_text).toContain('## 0.1.0 - 2026-03-20');
  expect(changelog_text).toContain('- Initial public release\n  ([`');
  expect(changelog_text).toContain(
    '](https://github.com/mantoni/patram/commit/',
  );
});

it('extracts the latest changelog section', () => {
  const section_text = extractLatestChangelogSection(
    [
      '# Changelog',
      '',
      '## 0.1.1 - 2026-03-20',
      '',
      '- Improve docs output',
      '',
      '## 0.1.0 - 2026-03-01',
      '',
      '- Initial release',
    ].join('\n'),
  );

  expect(section_text).toBe(
    ['## 0.1.1 - 2026-03-20', '', '- Improve docs output'].join('\n'),
  );
});

it('rejects changelog text without a release section', () => {
  expect(() => extractLatestChangelogSection('# Changelog\n')).toThrow(
    'Expected CHANGELOG.md to contain at least one release section.',
  );
});

it('normalizes GitHub remote URLs and rejects unsupported hosts', () => {
  expect(
    normalizeGitHubRepositoryUrl('https://github.com/mantoni/patram.git'),
  ).toBe('https://github.com/mantoni/patram');
  expect(() =>
    normalizeGitHubRepositoryUrl('git@example.com:mantoni/patram'),
  ).toThrow('Expected a GitHub origin remote URL');
});

it('prepends sections above headerless changelog content', () => {
  const changelog_text = prependReleaseSection(
    'Legacy notes',
    '## 0.1.1 - 2026-03-20\n\n- Improve docs output',
  );

  expect(changelog_text).toBe(
    [
      '# Changelog',
      '',
      '## 0.1.1 - 2026-03-20',
      '',
      '- Improve docs output',
      '',
      'Legacy notes',
      '',
    ].join('\n'),
  );
});

it('parses git log lines and rejects malformed rows', () => {
  expect(parseGitLogLine('abcdef\tabc123\tAdd release notes')).toEqual({
    full_hash: 'abcdef',
    short_hash: 'abc123',
    subject: 'Add release notes',
  });
  expect(() => parseGitLogLine('abcdef')).toThrow(
    'Unexpected git log line: abcdef',
  );
});

it('detects missing-file errors and non-entrypoint runs', () => {
  expect(isFileNotFoundError({ code: 'ENOENT' })).toBe(true);
  expect(isFileNotFoundError(new Error('nope'))).toBe(false);
  expect(isEntrypoint(import.meta.url, undefined)).toBe(false);
});

/**
 * @returns {{ project_directory: string | null }}
 */
function createTestContext() {
  return {
    project_directory: null,
  };
}

/**
 * @param {{ project_directory: string | null }} test_context
 */
async function cleanupTestContext(test_context) {
  if (test_context.project_directory) {
    await rm(test_context.project_directory, { force: true, recursive: true });
    test_context.project_directory = null;
  }
}

/**
 * @returns {Promise<string>}
 */
async function createTempProjectDirectory() {
  return mkdtemp(join(tmpdir(), 'patram-update-changelog-'));
}

/**
 * @returns {Promise<string>}
 */
async function createReleasedProjectDirectory() {
  const project_directory = await createTempProjectDirectory();
  await initializeGitRepository(project_directory);
  await writePackageJson(project_directory, '0.1.0');
  await writeChangelog(
    project_directory,
    ['# Changelog', '', '## 0.1.0 - 2026-03-01', '', '- Initial release'].join(
      '\n',
    ),
  );
  await commitAll(project_directory, 'Initial release', '2026-03-01T08:00:00Z');
  await createTag(project_directory, 'v0.1.0');
  await writePackageJson(project_directory, '0.1.1');
  await createSourceFile(project_directory, 'docs/notes.md', '# Notes\n');
  await commitAll(
    project_directory,
    'Add release notes doc',
    '2026-03-10T09:00:00Z',
  );
  await createSourceFile(
    project_directory,
    'docs/more-notes.md',
    '# More notes\n',
  );
  await commitAll(
    project_directory,
    'Improve docs output',
    '2026-03-11T10:00:00Z',
  );

  return project_directory;
}

/**
 * @param {string} project_directory
 * @param {string} [remote_url]
 */
async function initializeGitRepository(
  project_directory,
  remote_url = 'git@github.com:mantoni/patram.git',
) {
  await execGit(project_directory, ['init']);
  await execGit(project_directory, ['branch', '-m', 'main']);
  await execGit(project_directory, ['remote', 'add', 'origin', remote_url]);
  await execGit(project_directory, ['config', 'user.name', 'Patram Tests']);
  await execGit(project_directory, [
    'config',
    'user.email',
    'tests@example.com',
  ]);
}

/**
 * @param {string} project_directory
 * @param {string} version
 */
async function writePackageJson(project_directory, version) {
  await writeFile(
    join(project_directory, 'package.json'),
    JSON.stringify({
      name: 'patram',
      version,
    }),
  );
}

/**
 * @param {string} project_directory
 * @param {string} changelog_text
 */
async function writeChangelog(project_directory, changelog_text) {
  await writeFile(join(project_directory, 'CHANGELOG.md'), changelog_text);
}

/**
 * @param {string} project_directory
 * @param {string} relative_path
 * @param {string} file_text
 */
async function createSourceFile(project_directory, relative_path, file_text) {
  const directory_path = dirname(join(project_directory, relative_path));
  await mkdir(directory_path, { recursive: true });
  await writeFile(join(project_directory, relative_path), file_text);
}

/**
 * @param {string} project_directory
 * @param {string} commit_subject
 * @param {string} commit_date
 */
async function commitAll(project_directory, commit_subject, commit_date) {
  await execGit(project_directory, ['add', '.']);
  await execGit(project_directory, ['commit', '-m', commit_subject], {
    GIT_AUTHOR_DATE: commit_date,
    GIT_COMMITTER_DATE: commit_date,
  });
}

/**
 * @param {string} project_directory
 * @param {string} tag_name
 */
async function createTag(project_directory, tag_name) {
  await execGit(project_directory, ['tag', tag_name]);
}

/**
 * @param {string} project_directory
 * @param {string[]} args
 * @param {NodeJS.ProcessEnv} [env_overrides]
 */
async function execGit(project_directory, args, env_overrides) {
  await exec_file('git', args, {
    cwd: project_directory,
    env: {
      ...process.env,
      ...env_overrides,
    },
  });
}

/**
 * @param {string} changelog_text
 */
function expectReleasedChangelog(changelog_text) {
  expect(changelog_text).toContain('## 0.1.1 - 2026-03-20');
  expect(changelog_text).toContain('- Improve docs output\n  ([`');
  expect(changelog_text).toContain(
    '](https://github.com/mantoni/patram/commit/',
  );
  expect(changelog_text).toContain('- Add release notes doc\n  ([`');
  expect(changelog_text).toMatch(
    /^# Changelog\n\n## 0\.1\.1 - 2026-03-20[\s\S]*\n## 0\.1\.0 - 2026-03-01/m,
  );
}
