import { join } from 'node:path';

import {
  loadTaggedFencedBlocks,
  selectTaggedBlock,
} from '../lib/tagged-fenced-blocks.js';

const help_fixture_file_promise = loadTaggedFencedBlocks(
  join(import.meta.dirname, '../docs/decisions/cli-help-copy-v0.md'),
);

/**
 * @param {string} fixture_name
 * @returns {Promise<string>}
 */
export async function loadHelpFixture(fixture_name) {
  const help_fixture_file = await help_fixture_file_promise;
  const block = selectTaggedBlock(help_fixture_file.blocks, {
    fixture: fixture_name,
    role: 'output',
  });

  return `${block.value}\n`;
}
