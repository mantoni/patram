import { expect, it } from 'vitest';

import { formatOutputItemBlock } from './format-output-item-block.js';

it('formats output item blocks with metadata and paragraph-separated descriptions', () => {
  expect(
    formatOutputItemBlock({
      description: 'First line\nSecond line\n\nNext paragraph',
      header: '[1] decision docs/decisions/example.md',
      metadata_indent: '    ',
      metadata_rows: ['status: accepted', 'execution: done'],
      title: 'Example Decision',
    }),
  ).toBe(
    '[1] decision docs/decisions/example.md\n' +
      '    status: accepted\n' +
      '    execution: done\n' +
      '\n' +
      '    Example Decision\n' +
      '\n' +
      '    First line\n' +
      '    Second line\n' +
      '\n' +
      '    Next paragraph',
  );
});

it('uses default indents and omits optional sections when metadata and description are absent', () => {
  expect(
    formatOutputItemBlock({
      header: '[1] document docs/guide.md',
      metadata_rows: [],
      title: 'Guide',
    }),
  ).toBe('[1] document docs/guide.md\n\n    Guide');
});

it('supports custom title indentation', () => {
  expect(
    formatOutputItemBlock({
      description: 'Body',
      header: 'document docs/guide.md',
      metadata_rows: [],
      title: 'Guide',
      title_indent: '  ',
    }),
  ).toBe('document docs/guide.md\n\n  Guide\n\n  Body');
});
