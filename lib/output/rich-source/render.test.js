/* eslint-disable max-lines */
/**
 * @import { OutputResolvedLinkItem, ShowOutputView } from '../output-view.types.ts';
 */
import ansis, { Ansis } from 'ansis';
import { expect, it } from 'vitest';

import { renderRichSource } from './render.js';

const CODE_INNER_WIDTH = 78;
const colorAnsi = new Ansis(3);
const FULL_WIDTH_DIVIDER = ` ${'─'.repeat(78)} `;
const MIXED_MARKDOWN_SOURCE = [
  '# Title',
  '',
  'Paragraph with **bold**, *em*, `code`, [guide](./guide.md), ~~gone~~, and a hard break.\\',
  'Next line.',
  '',
  '- item',
  '  - nested',
  '',
  '1. ordered',
  '',
  '> quote',
  '',
  '---',
  '',
  '| A | B |',
  '| - | - |',
  '| 1 | 2 |',
  '',
  '```text [raw.txt]',
  'plain',
  '```',
].join('\n');

const MIXED_MARKDOWN_OUTPUT = [
  '# Title',
  '',
  'Paragraph with bold, em, `code`, guide^1, gone, and a hard break.',
  'Next line.',
  '',
  '• item',
  '  • nested',
  '',
  '1. ordered',
  '',
  ...createQuoteBlockLines(['quote']),
  '',
  FULL_WIDTH_DIVIDER,
  '',
  '┌───┬───┐',
  '│ A │ B │',
  '├───┼───┤',
  '│ 1 │ 2 │',
  '└───┴───┘',
  '',
  ...createFencedCodeBlockLines('text [raw.txt]', ['plain']),
  '',
  '[^1] document docs/guide.md',
  '    Some Guide',
].join('\n');
const MERMAID_MARKDOWN_SOURCE = [
  '```mermaid',
  'graph LR',
  '  A --> B',
  '  B --> C',
  '```',
].join('\n');
const MERMAID_MARKDOWN_OUTPUT = createFencedCodeBlockLines('mermaid', [
  '┌─┐     ┌─┐     ┌─┐',
  '│A├────►│B├────►│C│',
  '└─┘     └─┘     └─┘',
]).join('\n');

it('renders mixed markdown blocks through the custom rich source renderer', async () => {
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [
        {
          kind: 'resolved_link',
          label: 'guide',
          reference: 1,
          target: {
            path: 'docs/guide.md',
            title: 'Some Guide',
          },
        },
      ],
      path: 'docs/patram.md',
      source: MIXED_MARKDOWN_SOURCE,
    }),
    {
      color_enabled: false,
      color_mode: 'never',
    },
  );

  expect(rich_source).toBe(MIXED_MARKDOWN_OUTPUT);
});

it('renders markdown links without resolved references as plain links', async () => {
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [],
      path: 'docs/patram.md',
      source: 'See [guide](./guide.md).',
    }),
    {
      color_enabled: false,
      color_mode: 'never',
    },
  );

  expect(rich_source).toBe('See guide.');
});

it('renders fenced mermaid blocks as ascii diagrams in rich markdown output', async () => {
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [],
      path: 'docs/diagram.md',
      source: MERMAID_MARKDOWN_SOURCE,
    }),
    {
      color_enabled: false,
      color_mode: 'never',
    },
  );

  expect(rich_source).toBe(MERMAID_MARKDOWN_OUTPUT);
});

it('keeps mermaid diagrams monochrome inside rich color-mode code blocks', async () => {
  const original_is_tty = process.stdout.isTTY;
  const original_term = process.env.TERM;

  process.stdout.isTTY = true;
  process.env.TERM = 'xterm';

  try {
    const rich_source = await renderRichSource(
      createShowOutput({
        items: [],
        path: 'docs/diagram.md',
        source: MERMAID_MARKDOWN_SOURCE,
      }),
      {
        color_enabled: true,
        color_mode: 'always',
      },
    );

    expect(ansis.strip(rich_source)).toBe(MERMAID_MARKDOWN_OUTPUT);
    expect(rich_source.split('\n')[1]).toBe(
      colorAnsi.bg(236)(
        createFencedCodeBlockLines('mermaid', ['┌─┐     ┌─┐     ┌─┐'])[1],
      ),
    );
  } finally {
    process.stdout.isTTY = original_is_tty;
    process.env.TERM = original_term;
  }
});

it('matches resolved references only for path-like markdown links', async () => {
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [
        {
          kind: 'resolved_link',
          label: 'guide',
          reference: 1,
          target: {
            path: 'docs/guide.md',
            title: 'Some Guide',
          },
        },
      ],
      path: 'docs/patram.md',
      source: 'See [external](https://example.com) and [guide](./guide.md).',
    }),
    {
      color_enabled: false,
      color_mode: 'never',
    },
  );

  expect(rich_source).toBe(
    'See external and guide^1.\n\n[^1] document docs/guide.md\n    Some Guide',
  );
});

it('renders anchor-only markdown links without assigning references', async () => {
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [
        {
          kind: 'resolved_link',
          label: 'jump',
          reference: 1,
          target: {
            path: 'docs/guide.md',
            title: 'Some Guide',
          },
        },
      ],
      path: 'docs/patram.md',
      source: 'See [jump](#section).',
    }),
    {
      color_enabled: false,
      color_mode: 'never',
    },
  );

  expect(rich_source).toBe('See jump.');
});

it('renders list paragraphs and line breaks without swallowing content', async () => {
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [],
      path: 'docs/list.md',
      source: [
        '- first line',
        '  second line',
        '',
        '- paragraph',
        '',
        '  continued paragraph',
        '',
        '  ```js',
        '  const x = 1',
        '  ```',
        '',
        '  > quote',
      ].join('\n'),
    }),
    {
      color_enabled: false,
      color_mode: 'never',
    },
  );

  expect(rich_source).toBe(
    [
      '• first line',
      '  second line',
      '• paragraph',
      'continued paragraph',
      ...createIndentedLines(
        createFencedCodeBlockLines('js', ['const x = 1']),
        1,
      ),
      ...createIndentedLines(createQuoteBlockLines(['quote']), 1),
    ].join('\n'),
  );
});

it('renders list link summaries inline under the owning rich list item', async () => {
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [
        {
          kind: 'resolved_link',
          label: 'guide',
          reference: 1,
          target: {
            path: 'docs/guide.md',
            title: 'Some Guide',
          },
        },
      ],
      path: 'docs/list.md',
      source: '- Read [guide](./guide.md).',
    }),
    {
      color_enabled: false,
      color_mode: 'never',
    },
  );

  expect(rich_source).toBe(
    ['• Read guide.', '  -> document docs/guide.md', '     Some Guide'].join(
      '\n',
    ),
  );
});

it('flushes rich prose footnotes before the next equal heading', async () => {
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [
        {
          kind: 'resolved_link',
          label: 'guide',
          reference: 1,
          target: {
            path: 'docs/guide.md',
            title: 'Some Guide',
          },
        },
      ],
      path: 'docs/patram.md',
      source: createSectionFootnoteSource(),
    }),
    {
      color_enabled: false,
      color_mode: 'never',
    },
  );

  expect(rich_source).toBe(createSectionFootnoteOutput());
});

it('preserves blank-line-separated top-level list groups in rich markdown output', async () => {
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [],
      path: 'docs/list-groups.md',
      source: ['- one', '- two', '', '- three', '- four'].join('\n'),
    }),
    {
      color_enabled: false,
      color_mode: 'never',
    },
  );

  expect(rich_source).toBe(
    ['• one', '• two', '', '• three', '• four'].join('\n'),
  );
});

it('preserves blank-line-separated rich list groups for colon-delimited items', async () => {
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [],
      path: 'docs/list-groups.md',
      source: ['- Foo: A', '- Bar: B', '', '- Some: Test'].join('\n'),
    }),
    {
      color_enabled: false,
      color_mode: 'never',
    },
  );

  expect(rich_source).toBe(
    ['• Foo: A', '• Bar: B', '', '• Some: Test'].join('\n'),
  );
});

it('renders unsupported source files in an unhighlighted shaded code block', async () => {
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [],
      path: 'src/demo.custom',
      source: 'plain text\n',
    }),
    {
      color_enabled: false,
      color_mode: 'never',
    },
  );

  expect(rich_source).toBe(createCodeBlockLines('', ['plain text']).join('\n'));
});

it('emits ansi styling for supported source files when color is enabled', async () => {
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [],
      path: 'src/demo.js',
      source: 'export const value = 1;\n',
    }),
    {
      color_enabled: true,
      color_mode: 'always',
    },
  );

  expect(ansis.strip(rich_source)).toBe(
    createCodeBlockLines('javascript', ['export const value = 1;']).join('\n'),
  );
  expect(ansis.strip(rich_source)).not.toContain('█');
  expect(rich_source).toContain('\u001B[');
});

it('renders heading colors, inline-code background, and blockquote background in color mode', async () => {
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [],
      path: 'docs/colors.md',
      source: [
        '# Title',
        '',
        '## Subtitle',
        '',
        '> quote',
        '',
        'Use `code`.',
      ].join('\n'),
    }),
    {
      color_enabled: true,
      color_mode: 'always',
    },
  );

  expect(ansis.strip(rich_source)).toBe(
    [
      '# Title',
      '',
      '## Subtitle',
      '',
      ...createQuoteBlockLines(['quote']),
      '',
      'Use `code`.',
    ].join('\n'),
  );
  expect(rich_source).toContain(colorAnsi.bold.red('# Title'));
  expect(rich_source).toContain(colorAnsi.bold.blueBright('## Subtitle'));
  expect(rich_source).toContain(colorAnsi.bgGray(' quote '));
  expect(rich_source).toContain(colorAnsi.bg(236).dim('code'));
  expect(rich_source).not.toContain('[38;2;');
  expect(rich_source).not.toContain('[48;2;');
  expect(rich_source).toContain('\u001B[');
});

it('renders markdown tables as box-drawing tables with alignment-aware padding', async () => {
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [],
      path: 'docs/table.md',
      source: [
        '| Left | Center | Right |',
        '| :-- | :-: | --: |',
        '| a | bb | ccc |',
        '| wider | x | y |',
      ].join('\n'),
    }),
    {
      color_enabled: false,
      color_mode: 'never',
    },
  );

  expect(rich_source).toBe(
    [
      '┌───────┬────────┬───────┐',
      '│ Left  │ Center │ Right │',
      '├───────┼────────┼───────┤',
      '│ a     │   bb   │   ccc │',
      '│ wider │   x    │     y │',
      '└───────┴────────┴───────┘',
    ].join('\n'),
  );
});

it('renders rich markdown table borders gray and header cells red in color mode', async () => {
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [],
      path: 'docs/table-colors.md',
      source: ['| Head |', '| :-- |', '| body |'].join('\n'),
    }),
    {
      color_enabled: true,
      color_mode: 'always',
    },
  );

  expect(ansis.strip(rich_source)).toBe(
    ['┌──────┐', '│ Head │', '├──────┤', '│ body │', '└──────┘'].join('\n'),
  );
  expect(rich_source).toContain(colorAnsi.gray('┌──────┐'));
  expect(rich_source).toContain(colorAnsi.gray('│'));
  expect(rich_source).toContain(colorAnsi.red('Head'));
});

it('skips empty markdown headings when they render no visible text', async () => {
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [],
      path: 'docs/empty-heading.md',
      source: '#\n',
    }),
    {
      color_enabled: false,
      color_mode: 'never',
    },
  );

  expect(rich_source).toBe('');
});

it('pads multi-line blockquotes to one shared box width', async () => {
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [],
      path: 'docs/quote.md',
      source: ['> short', '> much longer'].join('\n'),
    }),
    {
      color_enabled: false,
      color_mode: 'never',
    },
  );

  expect(rich_source).toBe(
    createQuoteBlockLines(['short', 'much longer']).join('\n'),
  );
});

it('pads fenced code blocks to one shared box width with one surface color', async () => {
  const expected_lines = createFencedCodeBlockLines('text [raw.txt]', [
    'plain',
    'wider line',
  ]);
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [],
      path: 'docs/code.md',
      source: ['```text [raw.txt]', 'plain', 'wider line', '```'].join('\n'),
    }),
    {
      color_enabled: true,
      color_mode: 'always',
    },
  );

  expect(ansis.strip(rich_source)).toBe(expected_lines.join('\n'));
  expect(ansis.strip(rich_source)).not.toContain('█');
  expect(rich_source.split('\n')[2]).toBe(colorAnsi.bg(236)(expected_lines[2]));
  expect(rich_source).not.toContain('[48;2;');
});

it('keeps fenced markdown label, content, and spacer rows at one shared width', async () => {
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [],
      path: 'docs/code-width.md',
      source: ['```js', 'x'.repeat(78), '```'].join('\n'),
    }),
    {
      color_enabled: false,
      color_mode: 'never',
    },
  );
  /** @type {number[]} */
  const line_lengths = rich_source.split('\n').map((line) => line.length);

  expect(line_lengths).toEqual([81, 81, 81]);
});

it('wraps list items with a hanging indent instead of terminal-width overflow', async () => {
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [],
      path: 'docs/list-wrap.md',
      source: [
        '- Use `.ts` files only for interface and type definitions. These files must not contain runtime code or side effects.',
        '- Add JSDoc to all functions and methods:',
        '  - Add `@returns` only when the return type is not self-evident from the function body or signature and must stay readable in wrapped output.',
      ].join('\n'),
    }),
    {
      color_enabled: false,
      color_mode: 'never',
    },
  );

  expect(rich_source).toBe(
    [
      '• Use `.ts` files only for interface and type definitions. These files must not',
      '  contain runtime code or side effects.',
      '• Add JSDoc to all functions and methods:',
      '  • Add `@returns` only when the return type is not self-evident from the',
      '    function body or signature and must stay readable in wrapped output.',
    ].join('\n'),
  );
});

it('aligns ordered-list marker periods when a list reaches double digits', async () => {
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [],
      path: 'docs/ordered-list.md',
      source: [
        '1. abc',
        '2. def',
        '3. ghi',
        '4. jkl',
        '5. mno',
        '6. pqr',
        '7. stu',
        '8. vwx',
        '9. yz',
        '10. ten',
        '11. eleven',
      ].join('\n'),
    }),
    {
      color_enabled: false,
      color_mode: 'never',
    },
  );

  expect(rich_source).toBe(
    [
      ' 1. abc',
      ' 2. def',
      ' 3. ghi',
      ' 4. jkl',
      ' 5. mno',
      ' 6. pqr',
      ' 7. stu',
      ' 8. vwx',
      ' 9. yz',
      '10. ten',
      '11. eleven',
    ].join('\n'),
  );
});

it('renders extensionless empty source files without syntax detection', async () => {
  const rich_source = await renderRichSource(
    createShowOutput({
      items: [],
      path: 'Dockerfile',
      source: '',
    }),
    {
      color_enabled: false,
      color_mode: 'never',
    },
  );

  expect(rich_source).toBe(createCodeBlockLines('', ['']).join('\n'));
});

/**
 * @param {{ items: Array<{ kind: 'resolved_link', label: string, reference: number, target: { path: string, title: string } }>, path: string, source: string }} values
 * @returns {ShowOutputView}
 */
function createShowOutput(values) {
  return {
    command: 'show',
    hints: [],
    incoming_summary: {},
    items: values.items.map(createResolvedLinkItem),
    path: values.path,
    rendered_source: '',
    source: values.source,
    summary: {
      count: values.items.length,
      kind: 'resolved_link_list',
    },
  };
}

/**
 * @param {{ kind: 'resolved_link', label: string, reference: number, target: { path: string, title: string } }} item
 * @returns {OutputResolvedLinkItem}
 */
function createResolvedLinkItem(item) {
  return {
    ...item,
    target: {
      fields: {},
      id: `doc:${item.target.path}`,
      kind: 'document',
      path: item.target.path,
      title: item.target.title,
      visible_fields: [],
    },
  };
}

/**
 * @param {string} label
 * @param {string[]} lines
 * @returns {string[]}
 */
function createCodeBlockLines(label, lines) {
  const content_width = getCodeContentWidth(label, lines);
  /** @type {string[]} */
  const rendered_lines = [];

  if (label.length > 0) {
    rendered_lines.push(
      createCodeLine(label.padStart(content_width, ' '), content_width),
    );
  }

  for (const line of lines) {
    rendered_lines.push(createCodeLine(line, content_width));
  }

  return rendered_lines;
}

function createSectionFootnoteOutput() {
  return [
    '# Patram',
    '',
    '## Intro',
    '',
    'See guide^1.',
    '',
    '[^1] document docs/guide.md',
    '    Some Guide',
    '',
    '## Next',
    '',
    'Later.',
  ].join('\n');
}

function createSectionFootnoteSource() {
  return [
    '# Patram',
    '',
    '## Intro',
    '',
    'See [guide](./guide.md).',
    '',
    '## Next',
    '',
    'Later.',
  ].join('\n');
}

/**
 * @param {string} label
 * @param {string[]} lines
 * @returns {string[]}
 */
function createFencedCodeBlockLines(label, lines) {
  const content_width = getCodeContentWidth(label, lines, 1);

  return [
    createCodeLine(label.padStart(content_width, ' '), content_width),
    ...lines.map((line) => createCodeLine(line, content_width, 1)),
    createCodeLine('', content_width, 1),
  ];
}

/**
 * @param {string[]} lines
 * @returns {string[]}
 */
function createQuoteBlockLines(lines) {
  const content_width = Math.max(...lines.map((line) => line.length), 0) + 1;

  return lines.map((line) => `▕ ${line.padEnd(content_width, ' ')}`);
}

/**
 * @param {string[]} lines
 * @param {number} indent_level
 * @returns {string[]}
 */
function createIndentedLines(lines, indent_level) {
  const indent = '  '.repeat(indent_level);

  return lines.map((line) => `${indent}${line}`);
}

/**
 * @param {string} line
 * @param {number} content_width
 * @param {number} left_padding
 * @returns {string}
 */
function createCodeLine(line, content_width, left_padding = 0) {
  const padded_line = `${' '.repeat(left_padding)}${line}`;

  return ` ${padded_line.padEnd(content_width, ' ')} `;
}

/**
 * @param {string} label
 * @param {string[]} lines
 * @param {number} left_padding
 * @returns {number}
 */
function getCodeContentWidth(label, lines, left_padding = 0) {
  return Math.max(
    CODE_INNER_WIDTH,
    label.length,
    ...lines.map((line) => line.length + left_padding),
    0,
  );
}
