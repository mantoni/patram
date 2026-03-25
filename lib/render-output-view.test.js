/* eslint-disable max-lines, max-lines-per-function */
/**
 * @import { PatramRepoConfig } from './load-patram-config.types.ts';
 */
import ansis from 'ansis';
import { expect, it } from 'vitest';

import {
  createOutputView,
  createShowOutputView,
  renderOutputView,
} from './render-output-view.js';
import { renderJsonOutput } from './render-json-output.js';
import { renderPlainOutput } from './render-plain-output.js';
import { renderRichOutput } from './render-rich-output.js';

const FULL_WIDTH_DIVIDER = ` ${'─'.repeat(78)} `;
const OUTPUT_REPO_CONFIG = createOutputRepoConfig();

it('creates a query output view with structural fields and metadata fields', () => {
  const output_view = createOutputView(
    'query',
    [
      {
        $class: 'task',
        $id: 'doc:docs/tasks/v0/query-command.md',
        $path: 'docs/tasks/v0/query-command.md',
        id: 'doc:docs/tasks/v0/query-command.md',
        status: 'pending',
        title: 'Implement query command',
      },
    ],
    {
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );

  expect(output_view).toEqual({
    command: 'query',
    hints: [],
    items: [
      {
        derived_summary: undefined,
        fields: {
          status: 'pending',
        },
        id: 'doc:docs/tasks/v0/query-command.md',
        kind: 'node',
        node_kind: 'task',
        path: 'docs/tasks/v0/query-command.md',
        title: 'Implement query command',
        visible_fields: [
          {
            name: 'status',
            value: 'pending',
          },
        ],
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

it('renders plain query output with a structural header and visible metadata', () => {
  const output_view = createOutputView(
    'query',
    [
      {
        $class: 'task',
        $id: 'doc:docs/tasks/v0/query-command.md',
        $path: 'docs/tasks/v0/query-command.md',
        id: 'doc:docs/tasks/v0/query-command.md',
        status: 'pending',
        title: 'Implement query command',
      },
      {
        $class: 'decision',
        $id: 'doc:docs/decisions/query-language-v0.md',
        $path: 'docs/decisions/query-language-v0.md',
        id: 'doc:docs/decisions/query-language-v0.md',
        status: 'accepted',
        title: 'Query Language v0',
      },
    ],
    {
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );

  expect(renderPlainOutput(output_view)).toBe(
    'task docs/tasks/v0/query-command.md\n' +
      'status: pending\n' +
      '\n' +
      '    Implement query command\n' +
      '\n' +
      'decision docs/decisions/query-language-v0.md\n' +
      'status: accepted\n' +
      '\n' +
      '    Query Language v0\n',
  );
});

it('renders visible source metadata while hiding configured fields', () => {
  const output_view = createOutputView(
    'query',
    [
      {
        $class: 'document',
        $id: 'doc:lib/query-graph.js',
        $path: 'lib/query-graph.js',
        description: 'Applies the where-clause language.',
        id: 'doc:lib/query-graph.js',
        kind: 'graph',
        status: 'active',
        title: 'Query graph filtering.',
      },
    ],
    {
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );

  expect(renderPlainOutput(output_view)).toBe(
    'document lib/query-graph.js\n' +
      'kind: graph  status: active\n' +
      '\n' +
      '    Query graph filtering.\n',
  );
});

it('renders semantic query output with the canonical path in the header', () => {
  const output_view = createOutputView(
    'query',
    [
      {
        $class: 'command',
        $id: 'command:query',
        $path: 'docs/reference/commands/query.md',
        id: 'command:query',
        title: 'query',
      },
    ],
    {
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );

  expect(renderPlainOutput(output_view)).toBe(
    'command docs/reference/commands/query.md\n' + '\n' + '    query\n',
  );
});

it('renders empty plain query output with the structural-field hint', () => {
  const output_view = createOutputView('query', []);

  expect(renderPlainOutput(output_view)).toBe(
    'No matches.\n' + 'Try: patram query --where "$class=task"\n',
  );
});

it('renders a query pagination hint after the summary', () => {
  const output_view = createOutputView(
    'query',
    [
      {
        $class: 'task',
        $id: 'doc:docs/tasks/v0/query-command.md',
        $path: 'docs/tasks/v0/query-command.md',
        id: 'doc:docs/tasks/v0/query-command.md',
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
      repo_config: OUTPUT_REPO_CONFIG,
      total_count: 40,
    },
  );

  expect(renderPlainOutput(output_view)).toBe(
    'task docs/tasks/v0/query-command.md\n' +
      'status: pending\n' +
      '\n' +
      '    Implement query command\n' +
      '\n' +
      'Showing 1 of 40 matches.\n' +
      'Hint: use --offset <n> or --limit <n> to page through more matches.\n',
  );
});

it('renders query json output with the structural-plus-fields split', () => {
  const output_view = createOutputView(
    'query',
    [
      {
        $class: 'task',
        $id: 'doc:docs/tasks/v0/query-command.md',
        $path: 'docs/tasks/v0/query-command.md',
        id: 'doc:docs/tasks/v0/query-command.md',
        status: 'pending',
        title: 'Implement query command',
      },
    ],
    {
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );

  expect(renderJsonOutput(output_view)).toBe(
    '{\n' +
      '  "results": [\n' +
      '    {\n' +
      '      "$class": "task",\n' +
      '      "$id": "doc:docs/tasks/v0/query-command.md",\n' +
      '      "fields": {\n' +
      '        "status": "pending"\n' +
      '      },\n' +
      '      "title": "Implement query command",\n' +
      '      "$path": "docs/tasks/v0/query-command.md"\n' +
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

it('creates and renders show output with the same structural-plus-fields split', () => {
  const output_view = createShowOutputView(
    {
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
    },
    {
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );

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
      '[2] decision docs/decisions/query-language-v0.md\n' +
      '    status: accepted\n' +
      '\n' +
      '    Query Language v0\n',
  );
});

it('renders show json output with structural fields and metadata fields', () => {
  const output_view = createShowOutputView(
    {
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
    },
    {
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );

  expect(renderJsonOutput(output_view)).toBe(
    '{\n' +
      '  "source": "# Patram\\n\\nSee [guide](./guide.md).\\n",\n' +
      '  "resolved_links": [\n' +
      '    {\n' +
      '      "reference": 1,\n' +
      '      "label": "Some Guide",\n' +
      '      "target": {\n' +
      '        "$class": "document",\n' +
      '        "$id": "doc:docs/guide.md",\n' +
      '        "fields": {},\n' +
      '        "title": "Some Guide",\n' +
      '        "$path": "docs/guide.md"\n' +
      '      }\n' +
      '    }\n' +
      '  ]\n' +
      '}\n',
  );
});

it('renders show json output with canonical semantic ids for promoted document nodes', () => {
  const output_view = createShowOutputView(
    {
      path: 'docs/contracts/release-flow.md',
      rendered_source: '# Release Flow Contract\n\nSee [Decision][1].',
      resolved_links: [
        {
          label: 'Decision',
          reference: 1,
          target: {
            kind: 'decision',
            path: 'docs/decisions/review-gates.md',
            status: 'accepted',
            title: 'Review Gates',
          },
        },
      ],
      source:
        '# Release Flow Contract\n\nSee [Decision](../decisions/review-gates.md).\n',
    },
    {
      document_node_ids: {
        'docs/contracts/release-flow.md': 'contract:release-flow',
        'docs/decisions/review-gates.md': 'decision:review-gates',
      },
      graph_nodes: {
        'contract:release-flow': {
          $class: 'contract',
          $id: 'contract:release-flow',
          $path: 'docs/contracts/release-flow.md',
          id: 'contract:release-flow',
          path: 'docs/contracts/release-flow.md',
          status: 'active',
          title: 'Release Flow Contract',
        },
        'decision:review-gates': {
          $class: 'decision',
          $id: 'decision:review-gates',
          $path: 'docs/decisions/review-gates.md',
          id: 'decision:review-gates',
          path: 'docs/decisions/review-gates.md',
          status: 'accepted',
          title: 'Review Gates',
        },
      },
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );

  expect(JSON.parse(renderJsonOutput(output_view))).toEqual({
    document: {
      $class: 'contract',
      $id: 'contract:release-flow',
      $path: 'docs/contracts/release-flow.md',
      fields: {
        status: 'active',
      },
      title: 'Release Flow Contract',
    },
    resolved_links: [
      {
        label: 'Decision',
        reference: 1,
        target: {
          $class: 'decision',
          $id: 'decision:review-gates',
          $path: 'docs/decisions/review-gates.md',
          fields: {
            status: 'accepted',
          },
          title: 'Review Gates',
        },
      },
    ],
    source:
      '# Release Flow Contract\n\nSee [Decision](../decisions/review-gates.md).\n',
  });
});

it('renders rich query output with the same text layout as plain', async () => {
  const output_view = createOutputView(
    'query',
    [
      {
        $class: 'task',
        $id: 'doc:docs/tasks/v0/query-command.md',
        $path: 'docs/tasks/v0/query-command.md',
        id: 'doc:docs/tasks/v0/query-command.md',
        status: 'pending',
        title: 'Implement query command',
      },
    ],
    {
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );
  const plain_output = renderPlainOutput(output_view);
  const rich_output = await renderRichOutput(output_view, {
    color_enabled: true,
    color_mode: 'always',
  });

  expect(stripAnsi(rich_output)).toBe(plain_output);
  expect(rich_output).toContain('\u001B[');
  expect(rich_output).toContain(
    ansis.green('task docs/tasks/v0/query-command.md'),
  );
  expect(rich_output.split('\n')[1]).toBe('status: pending');
  expect(rich_output.split('\n')[3]).toBe('    Implement query command');
});

it('renders rich show markdown source with custom formatting', async () => {
  const output_view = createShowOutputView(
    {
      path: 'docs/patram.md',
      rendered_source:
        '# Patram\n\nSee [guide][1].\n\n```ts\nconst value = 1;\n```',
      resolved_links: [
        {
          label: 'guide',
          reference: 1,
          target: {
            path: 'docs/guide.md',
            title: 'Some Guide',
          },
        },
      ],
      source:
        '# Patram\n\nSee [guide](./guide.md).\n\n```ts [app.ts]\nconst value = 1;\n```\n',
    },
    {
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );
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

it('renders rich query hints in gray', async () => {
  const rich_output = await renderRichOutput(
    {
      command: 'query',
      hints: ['Try: patram query --where "$class=task"'],
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
    'No matches.\nTry: patram query --where "$class=task"\n',
  );
  expect(rich_output).toContain(
    ansis.gray('Try: patram query --where "$class=task"'),
  );
});

it('dispatches rich output through renderOutputView', async () => {
  const output_view = createOutputView(
    'query',
    [
      {
        $class: 'task',
        $id: 'doc:docs/tasks/v0/query-command.md',
        $path: 'docs/tasks/v0/query-command.md',
        id: 'doc:docs/tasks/v0/query-command.md',
        status: 'pending',
        title: 'Implement query command',
      },
    ],
    {
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );

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
    createOutputView(
      'query',
      [
        {
          $class: 'task',
          $id: 'doc:docs/tasks/v0/query-command.md',
          id: 'doc:docs/tasks/v0/query-command.md',
        },
      ],
      {
        repo_config: OUTPUT_REPO_CONFIG,
      },
    ),
  ).toThrow('Expected graph node "doc:docs/tasks/v0/query-command.md"');
});

it('throws on unsupported output view commands', () => {
  expect(() => {
    createOutputView(
      // @ts-expect-error - Invalid command for output-view coverage.
      'show',
      [],
    );
  }).toThrow('Unsupported output view command "show".');
});

it('normalizes array fields, inherited fields, and legacy mirror fields', () => {
  const graph_node = Object.assign(
    Object.create({
      status: 'pending',
    }),
    {
      $class: ['task'],
      $id: ['task:example'],
      $path: ['docs/tasks/example.md'],
      aliases: ['query', 7, 'show'],
      id: 'task:example',
      kind: 'task',
      owners: ['max', 7, 'ana'],
      path: 'docs/tasks/example.md',
      title: ['Example Task'],
    },
  );
  const output_view = createOutputView('query', [graph_node], {
    repo_config: {
      ...OUTPUT_REPO_CONFIG,
      fields: {
        ...OUTPUT_REPO_CONFIG.fields,
        aliases: {
          type: 'string',
        },
        owners: {
          type: 'string',
        },
      },
    },
  });

  expect(output_view).toEqual({
    command: 'query',
    hints: [],
    items: [
      {
        derived_summary: undefined,
        fields: {
          aliases: ['query', 'show'],
          kind: 'task',
          owners: ['max', 'ana'],
          status: 'pending',
        },
        id: 'task:example',
        kind: 'node',
        node_kind: 'task',
        path: 'docs/tasks/example.md',
        title: 'Example Task',
        visible_fields: [
          {
            name: 'kind',
            value: 'task',
          },
          {
            name: 'status',
            value: 'pending',
          },
          {
            name: 'aliases',
            value: ['query', 'show'],
          },
          {
            name: 'owners',
            value: ['max', 'ana'],
          },
        ],
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

it('sorts equally ordered visible fields alphabetically', () => {
  const output_view = createOutputView(
    'query',
    [
      {
        $class: 'task',
        $id: 'task:example',
        $path: 'docs/tasks/example.md',
        alpha: 'a',
        beta: 'b',
        id: 'task:example',
        title: 'Example Task',
      },
    ],
    {
      repo_config: {
        fields: {
          alpha: {
            type: 'string',
          },
          beta: {
            type: 'string',
          },
        },
        include: [],
        queries: {},
      },
    },
  );

  expect(output_view.items[0]).toEqual(
    expect.objectContaining({
      visible_fields: [
        {
          name: 'alpha',
          value: 'a',
        },
        {
          name: 'beta',
          value: 'b',
        },
      ],
    }),
  );
});

/**
 * @returns {PatramRepoConfig}
 */
function createOutputRepoConfig() {
  return {
    fields: {
      description: {
        display: {
          hidden: true,
        },
        type: 'string',
      },
      kind: {
        display: {
          order: 0,
        },
        type: 'string',
      },
      status: {
        display: {
          order: 1,
        },
        type: 'string',
      },
    },
    include: [],
    queries: {},
  };
}

/**
 * @param {string} value
 * @returns {string}
 */
function stripAnsi(value) {
  return ansis.strip(value);
}
