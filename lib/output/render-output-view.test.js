/* eslint-disable max-lines, max-lines-per-function */
/**
 * @import { PatramRepoConfig } from '../config/load-patram-config.types.ts';
 * @import { GraphNode } from '../graph/build-graph.types.ts';
 */
import ansis from 'ansis';
import { Ansis } from 'ansis';
import { expect, it } from 'vitest';

import {
  createOutputView,
  createRefsOutputView,
  createShowOutputView,
  renderOutputView,
} from './render-output-view.js';
import { renderJsonOutput } from './renderers/json.js';
import { renderPlainOutput } from './renderers/plain.js';
import { renderRichOutput } from './renderers/rich.js';

const FULL_WIDTH_DIVIDER = ` ${'─'.repeat(78)} `;
const OUTPUT_REPO_CONFIG = createOutputRepoConfig();
const colorAnsi = new Ansis(3);

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
    `${formatCompactTitle(
      'task docs/tasks/v0/query-command.md',
      '(status=pending)',
      'decision docs/decisions/query-language-v0.md'.length,
    )}\n` +
      '  Implement query command\n' +
      '\n' +
      `${formatCompactTitle(
        'decision docs/decisions/query-language-v0.md',
        '(status=accepted)',
        'decision docs/decisions/query-language-v0.md'.length,
      )}\n` +
      '  Query Language v0\n',
  );
});

it('renders compact query blocks with metadata in the title row', () => {
  const output_view = createOutputView(
    'query',
    [
      {
        $class: 'document',
        $id: 'doc:lib/graph/query/execute.js',
        $path: 'lib/graph/query/execute.js',
        description: 'Applies the where-clause language.',
        id: 'doc:lib/graph/query/execute.js',
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
    'document lib/graph/query/execute.js  (kind=graph, status=active)\n' +
      '  Query graph filtering.\n' +
      '  Applies the where-clause language.\n',
  );
});

it('truncates only the query right title in tty output', () => {
  const output_view = createOutputView(
    'query',
    [
      {
        $class: 'plan',
        $id: 'doc:docs/plans/v0/query-traversal-and-aggregation.md',
        $path: 'docs/plans/v0/query-traversal-and-aggregation.md',
        id: 'doc:docs/plans/v0/query-traversal-and-aggregation.md',
        path: 'docs/plans/v0/query-traversal-and-aggregation.md',
        status: 'active',
        title: 'Query Traversal And Aggregation Plan',
      },
    ],
    {
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );

  expect(
    renderPlainOutput(output_view, {
      is_tty: true,
      terminal_width: 70,
    }),
  ).toBe(
    'plan docs/plans/v0/query-traversal-and-aggregation.md  (status=active)\n' +
      '  Query Traversal And Aggregation Plan\n',
  );
});

it('renders visible source metadata while hiding configured fields', () => {
  const output_view = createOutputView(
    'query',
    [
      {
        $class: 'document',
        $id: 'doc:lib/graph/query/execute.js',
        $path: 'lib/graph/query/execute.js',
        description: 'Applies the where-clause language.',
        id: 'doc:lib/graph/query/execute.js',
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
    `${formatCompactTitle(
      'document lib/graph/query/execute.js',
      '(kind=graph, status=active)',
    )}\n` +
      '  Query graph filtering.\n' +
      '  Applies the where-clause language.\n',
  );
});

it('renders node descriptions as an indented paragraph after the title', () => {
  const output_view = createOutputView(
    'query',
    [
      {
        $class: 'document',
        $id: 'doc:lib/graph/query/execute.js',
        $path: 'lib/graph/query/execute.js',
        description: 'Applies the where-clause language.',
        id: 'doc:lib/graph/query/execute.js',
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
    `${formatCompactTitle(
      'document lib/graph/query/execute.js',
      '(kind=graph, status=active)',
    )}\n` +
      '  Query graph filtering.\n' +
      '  Applies the where-clause language.\n',
  );
});

it('renders rich node descriptions in gray with the same layout as plain output', async () => {
  const output_view = createOutputView(
    'query',
    [
      {
        $class: 'document',
        $id: 'doc:lib/graph/query/execute.js',
        $path: 'lib/graph/query/execute.js',
        description: 'Applies the where-clause language.',
        id: 'doc:lib/graph/query/execute.js',
        kind: 'graph',
        status: 'active',
        title: 'Query graph filtering.',
      },
    ],
    {
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );

  const rich_output = await renderRichOutput(output_view, {
    color_enabled: true,
    color_mode: 'always',
  });

  expect(stripAnsi(rich_output)).toBe(
    `${formatCompactTitle(
      'document lib/graph/query/execute.js',
      '(kind=graph, status=active)',
    )}\n` +
      '  Query graph filtering.\n' +
      '  Applies the where-clause language.\n',
  );
  expect(rich_output).toContain(
    colorAnsi.gray('Applies the where-clause language.'),
  );
});

it('renders resolved-link descriptions from the target node', () => {
  const output_view = createShowOutputView(
    {
      incoming_summary: {},
      path: 'docs/patram.md',
      rendered_source: '# Patram\n\nSee [Document][1].',
      resolved_links: [
        {
          label: 'Document',
          reference: 1,
          target: {
            path: 'docs/reference/terms/document.md',
            title: 'Document',
          },
        },
      ],
      source: '# Patram\n\nSee [Document](./reference/terms/document.md).',
    },
    {
      document_node_ids: {
        'docs/reference/terms/document.md': 'term:document',
      },
      graph_nodes: {
        'term:document': {
          $class: 'term',
          $id: 'term:document',
          $path: 'docs/reference/terms/document.md',
          description:
            'The built-in file-backed graph node kind keyed by normalized relative path.',
          id: 'term:document',
          title: 'document',
        },
      },
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );

  expect(renderPlainOutput(output_view)).toBe(
    '# Patram\n' +
      '\n' +
      'See [Document][1].\n' +
      '\n' +
      '----------------\n' +
      '[1] term docs/reference/terms/document.md\n' +
      '    document\n' +
      '    The built-in file-backed graph node kind keyed by normalized relative path.\n',
  );
});

it('renders rich resolved-link descriptions in gray', async () => {
  const output_view = createShowOutputView(
    {
      incoming_summary: {},
      path: 'docs/patram.md',
      rendered_source: '# Patram\n\nSee [Document][1].',
      resolved_links: [
        {
          label: 'Document',
          reference: 1,
          target: {
            path: 'docs/reference/terms/document.md',
            title: 'Document',
          },
        },
      ],
      source: '# Patram\n\nSee [Document](./reference/terms/document.md).',
    },
    {
      document_node_ids: {
        'docs/reference/terms/document.md': 'term:document',
      },
      graph_nodes: {
        'term:document': {
          $class: 'term',
          $id: 'term:document',
          $path: 'docs/reference/terms/document.md',
          description:
            'The built-in file-backed graph node kind keyed by normalized relative path.',
          id: 'term:document',
          title: 'document',
        },
      },
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );
  const rich_output = await renderRichOutput(output_view, {
    color_enabled: true,
    color_mode: 'always',
  });

  expect(rich_output).toContain(
    colorAnsi.gray(
      'The built-in file-backed graph node kind keyed by normalized relative path.',
    ),
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
    'command docs/reference/commands/query.md\n' + '  query\n',
  );
});

it('renders empty plain query output with the structural-field hint', () => {
  const output_view = createOutputView('query', []);

  expect(renderPlainOutput(output_view)).toBe(
    'No matches.\n' + 'Try: patram query --cypher "MATCH (n:Task) RETURN n"\n',
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
    `${formatCompactTitle(
      'task docs/tasks/v0/query-command.md',
      '(status=pending)',
    )}\n` +
      '  Implement query command\n' +
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
      incoming_summary: {},
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
      '    Some Guide\n' +
      '\n' +
      `${formatCompactTitle(
        '[2] decision docs/decisions/query-language-v0.md',
        '(status=accepted)',
      )}\n` +
      '    Query Language v0\n',
  );
});

it('truncates only the show footnote metadata label in tty output', () => {
  const output_view = createShowOutputView(
    {
      incoming_summary: {},
      path: 'docs/patram.md',
      rendered_source: '# Patram\n\nSee [Plan][1].',
      resolved_links: [
        {
          label: 'Plan',
          reference: 1,
          target: {
            kind: 'plan',
            path: 'docs/plans/v0/output-contract-alignment.md',
            title: 'Output Contract Alignment Plan',
          },
        },
      ],
      source:
        '# Patram\n\nSee [Plan](./plans/v0/output-contract-alignment.md).\n',
    },
    {
      document_node_ids: {
        'docs/plans/v0/output-contract-alignment.md':
          'plan:output-contract-alignment',
      },
      graph_nodes: {
        'plan:output-contract-alignment': {
          $class: 'plan',
          $id: 'plan:output-contract-alignment',
          $path: 'docs/plans/v0/output-contract-alignment.md',
          id: 'plan:output-contract-alignment',
          path: 'docs/plans/v0/output-contract-alignment.md',
          status: 'active',
          title: 'Output Contract Alignment Plan',
        },
      },
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );

  expect(
    renderPlainOutput(output_view, {
      is_tty: true,
      terminal_width: 75,
    }),
  ).toBe(
    '# Patram\n' +
      '\n' +
      'See [Plan][1].\n' +
      '\n' +
      '----------------\n' +
      '[1] plan docs/plans/v0/output-contract-alignment.md  (status=active)\n' +
      '    Output Contract Alignment Plan\n',
  );
});

it('renders show json output with structural fields and metadata fields', () => {
  const output_view = createShowOutputView(
    {
      incoming_summary: {},
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
      '  "incoming_summary": {},\n' +
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

it('renders show json output with canonical semantic ids for promoted resolved links', () => {
  const output_view = createShowOutputView(
    {
      incoming_summary: {},
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
    incoming_summary: {},
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
  expect(rich_output).toContain(ansis.gray('('));
  expect(rich_output).toContain(ansis.gray('='));
  expect(rich_output).toContain(ansis.gray(')'));
  expect(rich_output.split('\n')[1]).toBe('  Implement query command');
});

it('renders rich show markdown source with custom formatting', async () => {
  const output_view = createShowOutputView(
    {
      incoming_summary: {},
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
      '    Some Guide\n',
  );
  expect(rich_output).toContain('\u001B[');
  expect(rich_output).toContain(ansis.gray('[1]'));
  expect(rich_output).toContain(ansis.gray(FULL_WIDTH_DIVIDER));
});

it('creates and renders refs output grouped by relation', async () => {
  const output_view = createRefsOutputView(
    {
      incoming: {
        decided_by: [
          {
            $class: 'document',
            $id: 'doc:lib/reconcile.js',
            $path: 'lib/reconcile.js',
            id: 'doc:lib/reconcile.js',
            path: 'lib/reconcile.js',
            title: 'Reconciler entrypoint.',
          },
          {
            $class: 'document',
            $id: 'doc:lib/resume.js',
            $path: 'lib/resume.js',
            id: 'doc:lib/resume.js',
            path: 'lib/resume.js',
            title: 'Resume entrypoint.',
          },
        ],
        implements: [
          {
            $class: 'task',
            $id: 'task:reverse-reference-inspection',
            $path: 'docs/tasks/v0/reverse-reference-inspection.md',
            id: 'task:reverse-reference-inspection',
            path: 'docs/tasks/v0/reverse-reference-inspection.md',
            status: 'ready',
            title: 'Implement reverse reference inspection',
          },
        ],
      },
      node: {
        $class: 'decision',
        $id: 'decision:query-language',
        $path: 'docs/decisions/query-language.md',
        id: 'decision:query-language',
        path: 'docs/decisions/query-language.md',
        status: 'accepted',
        title: 'Query Language',
      },
    },
    {
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );

  expect(renderPlainOutput(output_view)).toBe(
    `${formatCompactTitle(
      'decision docs/decisions/query-language.md',
      '(status=accepted)',
      'task docs/tasks/v0/reverse-reference-inspection.md'.length,
    )}\n` +
      '  Query Language\n' +
      '\n' +
      'decided_by (2)\n' +
      '  ├─ document lib/reconcile.js\n' +
      '  │    Reconciler entrypoint.\n' +
      '  └─ document lib/resume.js\n' +
      '       Resume entrypoint.\n' +
      '\n' +
      'implements (1)\n' +
      `  └─ ${formatCompactTitle(
        'task docs/tasks/v0/reverse-reference-inspection.md',
        '(status=ready)',
        'task docs/tasks/v0/reverse-reference-inspection.md'.length,
      )}\n` +
      '       Implement reverse reference inspection\n',
  );
  expect(renderJsonOutput(output_view)).toBe(
    '{\n' +
      '  "node": {\n' +
      '    "$class": "decision",\n' +
      '    "$id": "decision:query-language",\n' +
      '    "fields": {\n' +
      '      "status": "accepted"\n' +
      '    },\n' +
      '    "title": "Query Language",\n' +
      '    "$path": "docs/decisions/query-language.md"\n' +
      '  },\n' +
      '  "incoming": {\n' +
      '    "decided_by": [\n' +
      '      {\n' +
      '        "$class": "document",\n' +
      '        "$id": "doc:lib/reconcile.js",\n' +
      '        "fields": {},\n' +
      '        "title": "Reconciler entrypoint.",\n' +
      '        "$path": "lib/reconcile.js"\n' +
      '      },\n' +
      '      {\n' +
      '        "$class": "document",\n' +
      '        "$id": "doc:lib/resume.js",\n' +
      '        "fields": {},\n' +
      '        "title": "Resume entrypoint.",\n' +
      '        "$path": "lib/resume.js"\n' +
      '      }\n' +
      '    ],\n' +
      '    "implements": [\n' +
      '      {\n' +
      '        "$class": "task",\n' +
      '        "$id": "task:reverse-reference-inspection",\n' +
      '        "fields": {\n' +
      '          "status": "ready"\n' +
      '        },\n' +
      '        "title": "Implement reverse reference inspection",\n' +
      '        "$path": "docs/tasks/v0/reverse-reference-inspection.md"\n' +
      '      }\n' +
      '    ]\n' +
      '  }\n' +
      '}\n',
  );

  const rich_output = await renderRichOutput(output_view, {
    color_enabled: true,
    color_mode: 'always',
  });

  expect(stripAnsi(rich_output)).toBe(renderPlainOutput(output_view));
  expect(rich_output).toContain(ansis.bold('decided_by'));
  expect(rich_output).toContain(ansis.gray('(2)'));
  expect(rich_output).toContain(ansis.bold('implements'));
  expect(rich_output).toContain(ansis.gray('(1)'));
});

it('renders refs node blocks without empty metadata brackets', () => {
  const output_view = createRefsOutputView(
    {
      incoming: {
        links_to: [
          {
            $class: 'document',
            $id: 'doc:docs/patram.md',
            $path: 'docs/patram.md',
            id: 'doc:docs/patram.md',
            path: 'docs/patram.md',
            title: 'Patram',
          },
        ],
      },
      node: {
        $class: 'document',
        $id: 'doc:docs/reference/commands/query.md',
        $path: 'docs/reference/commands/query.md',
        description: 'nodes.',
        id: 'doc:docs/reference/commands/query.md',
        path: 'docs/reference/commands/query.md',
        title: 'Query',
      },
    },
    {
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );

  expect(renderPlainOutput(output_view)).toBe(
    'document docs/reference/commands/query.md\n' +
      '  Query\n' +
      '  nodes.\n' +
      '\n' +
      'links_to (1)\n' +
      '  └─ document docs/patram.md\n' +
      '       Patram\n',
  );
});

it('renders refs node descriptions in gray in rich output', async () => {
  const output_view = createRefsOutputView(
    {
      incoming: {
        links_to: [
          {
            $class: 'document',
            $id: 'doc:docs/patram.md',
            $path: 'docs/patram.md',
            description: 'Explore docs and graph nodes.',
            id: 'doc:docs/patram.md',
            path: 'docs/patram.md',
            title: 'Patram',
          },
        ],
      },
      node: {
        $class: 'document',
        $id: 'doc:docs/reference/commands/query.md',
        $path: 'docs/reference/commands/query.md',
        description: 'Inspect graph nodes by Cypher query.',
        id: 'doc:docs/reference/commands/query.md',
        path: 'docs/reference/commands/query.md',
        title: 'Query',
      },
    },
    {
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );
  const rich_output = await renderRichOutput(output_view, {
    color_enabled: true,
    color_mode: 'always',
  });

  expect(stripAnsi(rich_output)).toBe(renderPlainOutput(output_view));
  expect(rich_output).toContain(
    colorAnsi.gray('Inspect graph nodes by Cypher query.'),
  );
  expect(rich_output).toContain(
    colorAnsi.gray('Explore docs and graph nodes.'),
  );
});

it('truncates refs incoming metadata labels with tree indentation in tty output', async () => {
  const output_view = createRefsOutputView(
    {
      incoming: {
        tracked_in: [
          {
            $class: 'plan',
            $id: 'plan:field-discovery-onboarding-signal',
            $path: 'docs/plans/v1/field-discovery-onboarding-signal.md',
            id: 'plan:field-discovery-onboarding-signal',
            path: 'docs/plans/v1/field-discovery-onboarding-signal.md',
            status: 'active',
            title: 'Field Discovery Onboarding Signal',
          },
        ],
      },
      node: {
        $class: 'decision',
        $id: 'decision:field-discovery',
        $path: 'docs/decisions/field-discovery.md',
        id: 'decision:field-discovery',
        path: 'docs/decisions/field-discovery.md',
        status: 'accepted',
        title: 'Field Discovery',
      },
    },
    {
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );

  const expected_output =
    'decision docs/decisions/field-discovery.md  (status=accepted)\n' +
    '  Field Discovery\n' +
    '\n' +
    'tracked_in (1)\n' +
    '  └─ plan docs/plans/v1/field-discovery-onboarding-signal.md  (status=…)\n' +
    '       Field Discovery Onboarding Signal\n';

  expect(
    renderPlainOutput(output_view, {
      is_tty: true,
      terminal_width: 72,
    }),
  ).toBe(expected_output);
  expect(
    stripAnsi(
      await renderRichOutput(output_view, {
        color_enabled: true,
        color_mode: 'always',
        is_tty: true,
        terminal_width: 72,
      }),
    ),
  ).toBe(expected_output);
});

it('renders show output with a compact incoming summary and hides the empty incoming state', () => {
  const with_incoming_output_view = createShowOutputView(
    {
      incoming_summary: {
        decided_by: 2,
        implements: 1,
      },
      path: 'docs/decisions/query-language.md',
      rendered_source: '# Query Language',
      resolved_links: [],
      source: '# Query Language\n',
    },
    {
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );
  const empty_incoming_output_view = createShowOutputView(
    {
      incoming_summary: {},
      path: 'docs/guide.md',
      rendered_source: '# Guide',
      resolved_links: [],
      source: '# Guide\n',
    },
    {
      repo_config: OUTPUT_REPO_CONFIG,
    },
  );

  expect(renderPlainOutput(with_incoming_output_view)).toBe(
    '# Query Language\n' +
      '\n' +
      '----------------\n' +
      'incoming refs:\n' +
      '  decided_by: 2\n' +
      '  implements: 1\n' +
      '\n' +
      'Hint: patram refs docs/decisions/query-language.md\n',
  );
  expect(renderPlainOutput(empty_incoming_output_view)).toBe('# Guide\n');
});

it('renders rich query hints in gray', async () => {
  const rich_output = await renderRichOutput(
    {
      command: 'query',
      hints: ['Try: patram query --cypher "MATCH (n:Task) RETURN n"'],
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
    'No matches.\nTry: patram query --cypher "MATCH (n:Task) RETURN n"\n',
  );
  expect(rich_output).toContain(
    ansis.gray('Try: patram query --cypher "MATCH (n:Task) RETURN n"'),
  );
});

it('renders empty rich stored queries and refs states', async () => {
  const empty_queries_output = await renderRichOutput(
    {
      command: 'queries',
      hints: [],
      items: [],
      summary: {
        count: 0,
        kind: 'stored_query_list',
      },
    },
    {
      color_enabled: true,
      color_mode: 'always',
    },
  );
  const empty_refs_output = await renderRichOutput(
    createRefsOutputView(
      {
        incoming: {},
        node: {
          $class: 'document',
          $id: 'doc:docs/patram.md',
          $path: 'docs/patram.md',
          id: 'doc:docs/patram.md',
          path: 'docs/patram.md',
          title: 'Patram',
        },
      },
      {
        repo_config: OUTPUT_REPO_CONFIG,
      },
    ),
    {
      color_enabled: true,
      color_mode: 'always',
    },
  );

  expect(empty_queries_output).toBe('');
  expect(stripAnsi(empty_refs_output)).toBe(
    'document docs/patram.md\n' +
      '  Patram\n' +
      '\n' +
      'No incoming references.\n',
  );
});

it('renders rich show incoming summaries with counts', async () => {
  const rich_output = await renderRichOutput(
    createShowOutputView(
      {
        incoming_summary: {
          decided_by: 2,
        },
        path: 'docs/decisions/query-language.md',
        rendered_source: '# Query Language',
        resolved_links: [],
        source: '# Query Language\n',
      },
      {
        repo_config: OUTPUT_REPO_CONFIG,
      },
    ),
    {
      color_enabled: true,
      color_mode: 'always',
    },
  );

  expect(stripAnsi(rich_output)).toBe(
    '# Query Language\n' +
      '\n' +
      `${FULL_WIDTH_DIVIDER}\n` +
      '\n' +
      'incoming refs:\n' +
      '  decided_by: 2\n' +
      '\n' +
      'Hint: patram refs docs/decisions/query-language.md\n',
  );
  expect(rich_output).toContain(ansis.bold('incoming refs:'));
});

it('omits the rich show incoming summary and hint when there are no incoming refs', async () => {
  const rich_output = await renderRichOutput(
    createShowOutputView(
      {
        incoming_summary: {},
        path: 'docs/guide.md',
        rendered_source: '# Guide',
        resolved_links: [],
        source: '# Guide\n',
      },
      {
        repo_config: OUTPUT_REPO_CONFIG,
      },
    ),
    {
      color_enabled: true,
      color_mode: 'always',
    },
  );

  expect(stripAnsi(rich_output)).toBe('# Guide\n');
  expect(rich_output).not.toContain('incoming refs:');
  expect(rich_output).not.toContain('Hint: patram refs docs/guide.md');
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
  }).toThrow('Unsupported output view command.');
});

it('normalizes array fields, inherited fields, and legacy mirror fields', () => {
  const inherited_fields = {
    status: 'pending',
  };
  const graph_node_value = /** @type {unknown} */ ({
    $class: ['task'],
    $id: ['task:example'],
    $path: ['docs/tasks/example.md'],
    aliases: ['query', 7, 'show'],
    id: 'task:example',
    kind: 'task',
    owners: ['max', 7, 'ana'],
    path: 'docs/tasks/example.md',
    title: ['Example Task'],
  });
  /** @type {GraphNode} */
  const graph_node = /** @type {GraphNode} */ (graph_node_value);

  Object.setPrototypeOf(graph_node, inherited_fields);
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

  if (output_view.command !== 'query') {
    throw new Error('Expected a query output view.');
  }

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
 * @param {string} left_title
 * @param {string} right_title
 * @param {number=} left_title_width
 * @returns {string}
 */
function formatCompactTitle(left_title, right_title, left_title_width) {
  void left_title_width;

  return `${left_title}  ${right_title}`;
}

/**
 * @param {string} value
 * @returns {string}
 */
function stripAnsi(value) {
  return ansis.strip(value);
}
