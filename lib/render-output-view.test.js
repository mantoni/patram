import { expect, it } from 'vitest';
import ansis from 'ansis';

import {
  createOutputView,
  createShowOutputView,
  renderOutputView,
} from './render-output-view.js';
import { renderJsonOutput } from './render-json-output.js';
import { renderPlainOutput } from './render-plain-output.js';
import { renderRichOutput } from './render-rich-output.js';

const FULL_WIDTH_DIVIDER = ` ${'─'.repeat(78)} `;

it('creates a query output view for graph nodes', () => {
  const output_view = createOutputView('query', [
    {
      id: 'doc:docs/tasks/v0/query-command.md',
      kind: 'task',
      path: 'docs/tasks/v0/query-command.md',
      status: 'pending',
      title: 'Implement query command',
    },
  ]);

  expect(output_view).toEqual({
    command: 'query',
    hints: [],
    items: [
      {
        id: 'doc:docs/tasks/v0/query-command.md',
        kind: 'node',
        node_kind: 'task',
        path: 'docs/tasks/v0/query-command.md',
        status: 'pending',
        title: 'Implement query command',
      },
    ],
    summary: {
      count: 1,
      kind: 'result_list',
      limit: 1,
      offset: 0,
      total_count: 1,
    },
  });
});

it('renders plain query output from the shared view model', () => {
  const output_view = createOutputView('query', [
    {
      id: 'doc:docs/tasks/v0/query-command.md',
      kind: 'task',
      path: 'docs/tasks/v0/query-command.md',
      status: 'pending',
      title: 'Implement query command',
    },
    {
      id: 'doc:docs/decisions/query-language-v0.md',
      kind: 'decision',
      path: 'docs/decisions/query-language-v0.md',
      status: 'accepted',
      title: 'Query Language v0',
    },
  ]);

  expect(renderPlainOutput(output_view)).toBe(
    'document docs/tasks/v0/query-command.md\n' +
      'kind: task  status: pending\n' +
      '\n' +
      '    Implement query command\n' +
      '\n' +
      'document docs/decisions/query-language-v0.md\n' +
      'kind: decision  status: accepted\n' +
      '\n' +
      '    Query Language v0\n',
  );
});

it('renders empty plain query output with a hint', () => {
  const output_view = createOutputView('query', []);

  expect(renderPlainOutput(output_view)).toBe(
    'No matches.\n' + 'Try: patram query --where "kind=task"\n',
  );
});

it('renders a query pagination hint after the summary', () => {
  const output_view = createOutputView(
    'query',
    [
      {
        id: 'doc:docs/tasks/v0/query-command.md',
        kind: 'task',
        path: 'docs/tasks/v0/query-command.md',
        status: 'pending',
        title: 'Implement query command',
      },
    ],
    {
      hints: [
        'Hint: use --offset <n> or --limit <n> to page through more matches.',
      ],
      limit: 25,
      offset: 0,
      total_count: 40,
    },
  );

  expect(renderPlainOutput(output_view)).toBe(
    'document docs/tasks/v0/query-command.md\n' +
      'kind: task  status: pending\n' +
      '\n' +
      '    Implement query command\n' +
      '\n' +
      'Showing 1 of 40 matches.\n' +
      'Hint: use --offset <n> or --limit <n> to page through more matches.\n',
  );
});

it('renders stored queries through the shared view model', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'accepted-decisions',
      where: 'kind=decision and status=accepted',
    },
    {
      name: 'blocked',
      where: 'kind=task and status=blocked',
    },
  ]);

  expect(renderPlainOutput(output_view)).toBe(
    'accepted-decisions  kind=decision and status=accepted\n' +
      'blocked             kind=task and status=blocked\n',
  );
});

it('wraps long stored query terms with a hanging indent', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'accepted-decisions',
      where:
        'kind=decision and status=accepted and path^=docs/decisions/ and title~Output and not tracked_in:*',
    },
  ]);

  expect(renderPlainOutput(output_view)).toBe(
    'accepted-decisions  kind=decision and status=accepted and path^=docs/decisions/ and title~Output\n' +
      `${' '.repeat(20)}and not tracked_in:*\n`,
  );
});

it('renders query json output', () => {
  const output_view = createOutputView('query', [
    {
      id: 'doc:docs/tasks/v0/query-command.md',
      kind: 'task',
      path: 'docs/tasks/v0/query-command.md',
      status: 'pending',
      title: 'Implement query command',
    },
  ]);

  expect(renderJsonOutput(output_view)).toBe(
    '{\n' +
      '  "results": [\n' +
      '    {\n' +
      '      "id": "doc:docs/tasks/v0/query-command.md",\n' +
      '      "kind": "task",\n' +
      '      "title": "Implement query command",\n' +
      '      "path": "docs/tasks/v0/query-command.md",\n' +
      '      "status": "pending"\n' +
      '    }\n' +
      '  ],\n' +
      '  "summary": {\n' +
      '    "shown_count": 1,\n' +
      '    "total_count": 1,\n' +
      '    "offset": 0,\n' +
      '    "limit": 1\n' +
      '  },\n' +
      '  "hints": []\n' +
      '}\n',
  );
});

it('renders stored queries as json output', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'pending',
      where: 'kind=task and status=pending',
    },
  ]);

  expect(renderJsonOutput(output_view)).toBe(
    '{\n' +
      '  "queries": [\n' +
      '    {\n' +
      '      "name": "pending",\n' +
      '      "where": "kind=task and status=pending"\n' +
      '    }\n' +
      '  ]\n' +
      '}\n',
  );
});

it('creates and renders show output from the shared view model', () => {
  const output_view = createShowOutputView({
    path: 'docs/patram.md',
    rendered_source:
      '# Patram\n\nSee [Some Guide][1] and [Query Language v0][2].',
    resolved_links: [
      {
        label: 'Some Guide',
        reference: 1,
        target: {
          path: 'docs/guide.md',
          title: 'Some Guide',
        },
      },
      {
        label: 'Query Language v0',
        reference: 2,
        target: {
          kind: 'decision',
          path: 'docs/decisions/query-language-v0.md',
          status: 'accepted',
          title: 'Query Language v0',
        },
      },
    ],
    source: '# Patram\n\nSee [guide](./guide.md) and [query](./query.md).\n',
  });

  expect(renderPlainOutput(output_view)).toBe(
    '# Patram\n' +
      '\n' +
      'See [Some Guide][1] and [Query Language v0][2].\n' +
      '\n' +
      '----------------\n' +
      '[1] document docs/guide.md\n' +
      '\n' +
      '    Some Guide\n' +
      '\n' +
      '[2] document docs/decisions/query-language-v0.md\n' +
      '    kind: decision  status: accepted\n' +
      '\n' +
      '    Query Language v0\n',
  );
});

it('renders show json output', () => {
  const output_view = createShowOutputView({
    path: 'docs/patram.md',
    rendered_source: '# Patram\n\nSee [Some Guide][1].',
    resolved_links: [
      {
        label: 'Some Guide',
        reference: 1,
        target: {
          path: 'docs/guide.md',
          title: 'Some Guide',
        },
      },
    ],
    source: '# Patram\n\nSee [guide](./guide.md).\n',
  });

  expect(renderJsonOutput(output_view)).toBe(
    '{\n' +
      '  "source": "# Patram\\n\\nSee [guide](./guide.md).\\n",\n' +
      '  "resolved_links": [\n' +
      '    {\n' +
      '      "reference": 1,\n' +
      '      "label": "Some Guide",\n' +
      '      "target": {\n' +
      '        "title": "Some Guide",\n' +
      '        "path": "docs/guide.md"\n' +
      '      }\n' +
      '    }\n' +
      '  ]\n' +
      '}\n',
  );
});

it('renders rich query output with the same text layout as plain', async () => {
  const output_view = createOutputView('query', [
    {
      id: 'doc:docs/tasks/v0/query-command.md',
      kind: 'task',
      path: 'docs/tasks/v0/query-command.md',
      status: 'pending',
      title: 'Implement query command',
    },
  ]);
  const plain_output = renderPlainOutput(output_view);
  const rich_output = await renderRichOutput(output_view, {
    color_enabled: true,
    color_mode: 'always',
  });

  expect(stripAnsi(rich_output)).toBe(plain_output);
  expect(rich_output).toContain('\u001B[');
  expect(rich_output).toContain(
    ansis.green('document docs/tasks/v0/query-command.md'),
  );
  expect(rich_output.split('\n')[1]).toBe('kind: task  status: pending');
  expect(rich_output.split('\n')[3]).toBe('    Implement query command');
  expect(rich_output.split('\n')[4]).toBe('');
});

it('renders rich show markdown source with custom formatting', async () => {
  const output_view = createShowOutputView({
    path: 'docs/patram.md',
    rendered_source:
      '# Patram\n\nSee [guide][1].\n\n```ts\nconst value = 1;\n```',
    resolved_links: [
      {
        label: 'guide',
        reference: 1,
        target: {
          kind: 'document',
          path: 'docs/guide.md',
          title: 'Some Guide',
        },
      },
    ],
    source:
      '# Patram\n\nSee [guide](./guide.md).\n\n```ts [app.ts]\nconst value = 1;\n```\n',
  });
  const rich_output = await renderRichOutput(output_view, {
    color_enabled: true,
    color_mode: 'always',
  });

  expect(stripAnsi(rich_output)).toBe(
    '# Patram\n' +
      '\n' +
      'See guide[1].\n' +
      '\n' +
      ` ${'ts [app.ts]'.padStart(78, ' ')} \n` +
      ` ${` ${'const value = 1;'}`.padEnd(78, ' ')} \n` +
      ` ${' '.padEnd(78, ' ')} \n` +
      '\n' +
      `${FULL_WIDTH_DIVIDER}\n` +
      '\n' +
      '[1] document docs/guide.md\n' +
      '\n' +
      '    Some Guide\n',
  );
  expect(rich_output).toContain('\u001B[');
  expect(rich_output).toContain(ansis.green('document docs/guide.md'));
  expect(rich_output).toContain(ansis.gray('[1]'));
  expect(rich_output).toContain(ansis.gray(FULL_WIDTH_DIVIDER));
});

it('renders rich stored queries with the same text layout as plain', async () => {
  const output_view = createOutputView('queries', [
    {
      name: 'blocked',
      where: 'kind=task and status=blocked',
    },
  ]);
  const plain_output = renderPlainOutput(output_view);
  const rich_output = await renderRichOutput(output_view, {
    color_enabled: true,
    color_mode: 'always',
  });

  expect(stripAnsi(rich_output)).toBe(plain_output);
  expect(rich_output).toContain('\u001B[');
  expect(rich_output).toContain(ansis.green('blocked'));
  expect(rich_output).not.toContain('\u001B[36mkind');
  expect(rich_output).toContain(ansis.gray('='));
  expect(rich_output).toContain(ansis.yellow('and'));
  expect(rich_output).toContain('task');
  expect(rich_output).toContain('blocked');
});

it('renders an empty rich query without hints', async () => {
  const rich_output = await renderRichOutput(
    {
      command: 'query',
      hints: [],
      items: [],
      summary: {
        count: 0,
        kind: 'result_list',
        limit: 0,
        offset: 0,
        total_count: 0,
      },
    },
    {
      color_enabled: false,
      color_mode: 'never',
    },
  );

  expect(rich_output).toBe('No matches.\n');
});

it('renders rich query hints in gray', async () => {
  const rich_output = await renderRichOutput(
    {
      command: 'query',
      hints: ['Try: patram query --where "kind=task"'],
      items: [],
      summary: {
        count: 0,
        kind: 'result_list',
        limit: 0,
        offset: 0,
        total_count: 0,
      },
    },
    {
      color_enabled: true,
      color_mode: 'always',
    },
  );

  expect(stripAnsi(rich_output)).toBe(
    'No matches.\nTry: patram query --where "kind=task"\n',
  );
  expect(rich_output).toContain(
    ansis.gray('Try: patram query --where "kind=task"'),
  );
});

it('renders an empty stored query list as an empty string', () => {
  expect(
    renderPlainOutput({
      command: 'queries',
      hints: [],
      items: [],
      summary: {
        count: 0,
        kind: 'stored_query_list',
      },
    }),
  ).toBe('');
});

it('dispatches rich output through renderOutputView', async () => {
  const output_view = createOutputView('query', [
    {
      id: 'doc:docs/tasks/v0/query-command.md',
      kind: 'task',
      path: 'docs/tasks/v0/query-command.md',
      status: 'pending',
      title: 'Implement query command',
    },
  ]);

  expect(
    stripAnsi(
      await renderOutputView(
        output_view,
        {
          color_enabled: true,
          renderer_name: 'rich',
        },
        {
          color_mode: 'always',
          command_arguments: [],
          command_name: 'query',
          output_mode: 'default',
          query_limit: 25,
          query_offset: 0,
        },
      ),
    ),
  ).toBe(renderPlainOutput(output_view));
});

it('throws when a graph node cannot be normalized into an output item', () => {
  expect(() =>
    createOutputView('query', [
      {
        id: 'doc:docs/tasks/v0/query-command.md',
        kind: 'task',
      },
    ]),
  ).toThrow('Expected graph node "doc:docs/tasks/v0/query-command.md"');
});

/**
 * @param {string} value
 * @returns {string}
 */
function stripAnsi(value) {
  return ansis.strip(value);
}
