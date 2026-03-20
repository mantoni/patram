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
    'Implement query command\n' +
      'docs/tasks/v0/query-command.md\n' +
      'kind: task  status: pending\n' +
      '\n' +
      'Query Language v0\n' +
      'docs/decisions/query-language-v0.md\n' +
      'kind: decision  status: accepted\n',
  );
});

it('renders empty plain query output with a hint', () => {
  const output_view = createOutputView('query', []);

  expect(renderPlainOutput(output_view)).toBe(
    'No matches.\nTry: patram query --where "kind=task"\n',
  );
});

it('renders stored queries through the shared view model', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'blocked',
      where: 'kind=task and status=blocked',
    },
    {
      name: 'pending',
      where: 'kind=task and status=pending',
    },
  ]);

  expect(renderPlainOutput(output_view)).toBe(
    'blocked kind=task and status=blocked\n' +
      'pending kind=task and status=pending\n',
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
      '  ]\n' +
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
      '[1] Some Guide\n' +
      '    docs/guide.md\n' +
      '[2] Query Language v0\n' +
      '    docs/decisions/query-language-v0.md\n' +
      '    kind: decision  status: accepted\n',
  );
});

it('renders show json output', () => {
  const output_view = createShowOutputView({
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

it('renders rich query output with the same text layout as plain', () => {
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
  const rich_output = renderRichOutput(output_view, {
    color_enabled: true,
    color_mode: 'always',
  });

  expect(stripAnsi(rich_output)).toBe(plain_output);
  expect(rich_output).toContain('\u001B[');
});

it('renders rich show output with the same text layout as plain', () => {
  const output_view = createShowOutputView({
    rendered_source: '# Patram\n\nSee [Some Guide][1].',
    resolved_links: [
      {
        label: 'Some Guide',
        reference: 1,
        target: {
          kind: 'document',
          path: 'docs/guide.md',
          title: 'Some Guide',
        },
      },
    ],
    source: '# Patram\n\nSee [guide](./guide.md).\n',
  });
  const plain_output = renderPlainOutput(output_view);
  const rich_output = renderRichOutput(output_view, {
    color_enabled: true,
    color_mode: 'always',
  });

  expect(stripAnsi(rich_output)).toBe(plain_output);
  expect(rich_output).toContain('\u001B[');
});

it('renders rich stored queries with the same text layout as plain', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'blocked',
      where: 'kind=task and status=blocked',
    },
  ]);
  const plain_output = renderPlainOutput(output_view);
  const rich_output = renderRichOutput(output_view, {
    color_enabled: true,
    color_mode: 'always',
  });

  expect(stripAnsi(rich_output)).toBe(plain_output);
  expect(rich_output).toContain('\u001B[');
});

it('renders an empty rich query without hints', () => {
  const rich_output = renderRichOutput(
    {
      command: 'query',
      hints: [],
      items: [],
      summary: {
        count: 0,
        kind: 'result_list',
      },
    },
    {
      color_enabled: false,
      color_mode: 'never',
    },
  );

  expect(rich_output).toBe('No matches.\n');
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

it('dispatches rich output through renderOutputView', () => {
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
      renderOutputView(
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
