/**
 * @import {
 *   TaggedFencedBlock,
 *   TaggedFencedBlockFile,
 * } from './tagged-fenced-blocks.types.ts';
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import {
  extractTaggedFencedBlocks,
  loadTaggedFencedBlocks,
  selectTaggedBlock,
  selectTaggedBlocks,
} from './tagged-fenced-blocks.js';

/** @type {string | null} */
let project_directory = null;

afterEach(async () => {
  if (project_directory) {
    await rm(project_directory, { force: true, recursive: true });
    project_directory = null;
  }
});

it('extracts tagged fenced blocks in source order with merged metadata and heading context', () => {
  expect(
    extractTaggedFencedBlocks({
      file_path: 'docs/reference/commands/query.md',
      source_text: createTaggedBlockSource(),
    }),
  ).toEqual(createExpectedTaggedBlockFile('docs/reference/commands/query.md'));
});

it('throws on duplicate metadata keys across one pending tag set', () => {
  expectTaggedBlockError(
    () =>
      extractTaggedFencedBlocks({
        file_path: 'docs/reference/commands/query.md',
        source_text: [
          '# Query',
          '',
          '[patram example=query-basic]: #',
          '[patram example=query-output]: #',
          '',
          '```sh',
          'patram query',
          '```',
        ].join('\n'),
      }),
    'tagged_fenced_blocks.duplicate_metadata_key',
  );
});

it('throws when prose appears between a pending tag set and the next fence', () => {
  expectTaggedBlockError(
    () =>
      extractTaggedFencedBlocks({
        file_path: 'docs/reference/commands/query.md',
        source_text: [
          '# Query',
          '',
          '[patram example=query-basic]: #',
          'Body prose.',
          '',
          '```sh',
          'patram query',
          '```',
        ].join('\n'),
      }),
    'tagged_fenced_blocks.unattached_tag_set',
  );
});

it('throws on malformed tagged metadata', () => {
  expectTaggedBlockError(
    () =>
      extractTaggedFencedBlocks({
        file_path: 'docs/reference/commands/query.md',
        source_text: [
          '# Query',
          '',
          '[patram tracked-in=docs/reference/commands/query.md]: #',
          '',
          '```sh',
          'patram query',
          '```',
        ].join('\n'),
      }),
    'tagged_fenced_blocks.invalid_tag_line',
  );
});

it('throws when a pending tag set reaches end of file without a fence', () => {
  expectTaggedBlockError(
    () =>
      extractTaggedFencedBlocks({
        file_path: 'docs/reference/commands/query.md',
        source_text: ['# Query', '', '[patram example=query-basic]: #'].join(
          '\n',
        ),
      }),
    'tagged_fenced_blocks.dangling_tag_set',
  );
});

it('selects exact metadata matches and reports singular selection failures', () => {
  const blocks = createSelectionBlocks();

  expect(selectTaggedBlocks(blocks, { example: 'query-basic' })).toEqual([
    blocks[0],
    blocks[1],
  ]);
  expect(
    selectTaggedBlock(blocks, {
      example: 'query-basic',
      role: 'input',
    }),
  ).toEqual(blocks[0]);

  expectTaggedBlockError(
    () =>
      selectTaggedBlock(blocks, {
        example: 'query-basic',
        role: 'missing',
      }),
    'tagged_fenced_blocks.not_found',
  );
  expectTaggedBlockError(
    () =>
      selectTaggedBlock(blocks, {
        example: 'query-basic',
      }),
    'tagged_fenced_blocks.not_unique',
  );
});

it('loads tagged fenced blocks from disk', async () => {
  project_directory = await mkdtemp(join(tmpdir(), 'patram-tagged-blocks-'));
  const file_path = join(project_directory, 'docs/reference/commands/query.md');

  await writeProjectFile(
    project_directory,
    'docs/reference/commands/query.md',
    createTaggedBlockSource(),
  );

  expect(await loadTaggedFencedBlocks(file_path)).toEqual(
    createExpectedTaggedBlockFile(file_path),
  );
});

/**
 * @returns {string}
 */
function createTaggedBlockSource() {
  return [
    '# Query',
    '',
    '[patram example=query-basic]: #',
    '[patram role=input phase=alpha]: #',
    '',
    '```sh',
    'patram query --where "kind=task"',
    '```',
    '',
    '```txt',
    'ignored',
    '```',
    '',
    '## Examples',
    '',
    '[patram example=query-basic role=output]: #',
    '',
    '```json',
    '{"ok":true}',
    '```',
  ].join('\n');
}

/**
 * @returns {TaggedFencedBlock[]}
 */
function createSelectionBlocks() {
  return [
    createSelectionBlock(6, 8, [3], ['Query'], 'sh', 'patram query', {
      example: 'query-basic',
      role: 'input',
    }),
    createSelectionBlock(12, 14, [9], ['Query'], 'json', '{"ok":true}', {
      example: 'query-basic',
      role: 'output',
    }),
    createSelectionBlock(
      18,
      20,
      [15],
      ['Query', 'Advanced'],
      'sh',
      'patram query --where "kind=command"',
      {
        example: 'query-advanced',
        role: 'input',
      },
    ),
  ];
}

/**
 * @param {string} file_path
 * @returns {TaggedFencedBlockFile}
 */
function createExpectedTaggedBlockFile(file_path) {
  return {
    blocks: [
      createSelectionBlock(
        6,
        8,
        [3, 4],
        ['Query'],
        'sh',
        'patram query --where "kind=task"',
        {
          example: 'query-basic',
          phase: 'alpha',
          role: 'input',
        },
        file_path,
      ),
      createSelectionBlock(
        18,
        20,
        [16],
        ['Query', 'Examples'],
        'json',
        '{"ok":true}',
        {
          example: 'query-basic',
          role: 'output',
        },
        file_path,
      ),
    ],
    path: file_path,
    title: 'Query',
  };
}

/**
 * @param {number} line_start
 * @param {number} line_end
 * @param {number[]} tag_lines
 * @param {string[]} heading_path
 * @param {string} lang
 * @param {string} value
 * @param {Record<string, string>} metadata
 * @param {string} [file_path]
 * @returns {TaggedFencedBlock}
 */
function createSelectionBlock(
  line_start,
  line_end,
  tag_lines,
  heading_path,
  lang,
  value,
  metadata,
  file_path = 'docs/reference/commands/query.md',
) {
  return {
    context: {
      heading_path,
    },
    id: `block:${file_path}:${line_start}`,
    lang,
    metadata,
    origin: {
      line_end,
      line_start,
      path: file_path,
      tag_lines,
    },
    value,
  };
}

/**
 * @param {string} project_root
 * @param {string} relative_path
 * @param {string} source_text
 */
async function writeProjectFile(project_root, relative_path, source_text) {
  const file_path = join(project_root, relative_path);
  const directory_path = file_path.slice(0, file_path.lastIndexOf('/'));

  await mkdir(directory_path, { recursive: true });
  await writeFile(file_path, source_text);
}

/**
 * @param {() => unknown} action
 * @param {string} expected_code
 */
function expectTaggedBlockError(action, expected_code) {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    expect(error).toHaveProperty('code', expected_code);
    return;
  }

  throw new Error(`Expected "${expected_code}" to be thrown.`);
}
