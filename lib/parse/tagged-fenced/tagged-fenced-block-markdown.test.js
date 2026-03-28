import { expect, it } from 'vitest';

import {
  findMarkdownBodyStartLineIndex,
  getMarkdownTitle,
  parseOpeningMarkdownFence,
  updateHeadingPath,
} from './tagged-fenced-block-markdown.js';

it('finds markdown body starts with and without front matter', () => {
  expect(findMarkdownBodyStartLineIndex(['# Title'])).toBe(0);
  expect(
    findMarkdownBodyStartLineIndex(['---', 'layout: page', '---', '# Title']),
  ).toBe(3);
  expect(findMarkdownBodyStartLineIndex(['---', 'layout: page'])).toBe(0);
});

it('returns an empty title for missing or blank body lines', () => {
  expect(getMarkdownTitle([], 0)).toBe('');
  expect(getMarkdownTitle(['', '# Title'], 0)).toBe('');
});

it('returns plain text titles when the body does not start with a heading', () => {
  expect(getMarkdownTitle(['Patram guide'], 0)).toBe('Patram guide');
});

it('prepends the document title when a nested heading starts a path', () => {
  expect(
    updateHeadingPath([], 'Patram Guide', {
      level: 2,
      text: 'Examples',
    }),
  ).toEqual(['Patram Guide', 'Examples']);
});

it('parses opening fences with indentation and info strings', () => {
  expect(parseOpeningMarkdownFence('  ```js title="demo"')).toEqual({
    character: '`',
    lang: 'js title="demo"',
    length: 3,
  });
});
