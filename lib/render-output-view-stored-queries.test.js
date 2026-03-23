import { expect, it } from 'vitest';
import ansis from 'ansis';

import { createOutputView, renderOutputView } from './render-output-view.js';
import { renderJsonOutput } from './render-json-output.js';
import { renderPlainOutput } from './render-plain-output.js';
import { renderRichOutput } from './render-rich-output.js';

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

it('renders exact relation-target stored query terms', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'query-impl',
      where: 'implements_command=command:query and not uses_term=term:graph',
    },
  ]);

  expect(renderPlainOutput(output_view)).toBe(
    'query-impl  implements_command=command:query and not uses_term=term:graph\n',
  );
});

it('renders traversal aggregate stored query terms', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'done',
      where:
        'kind=decision and none(in:decided_by, kind=task and status not in [done, dropped, superseded])',
    },
  ]);

  expect(renderPlainOutput(output_view)).toBe(
    'done  kind=decision and none(in:decided_by, kind=task and status not in [done, dropped, superseded])\n',
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

it('renders rich stored queries with the same text layout as plain', async () => {
  const output_view = createOutputView('queries', [
    {
      name: 'query-impl',
      where: 'implements_command=command:query and not uses_term=term:graph',
    },
  ]);
  const plain_output = renderPlainOutput(output_view);
  const rich_output = await renderRichOutput(output_view, {
    color_enabled: true,
    color_mode: 'always',
  });

  expect(stripAnsi(rich_output)).toBe(plain_output);
  expect(rich_output).toContain('\u001B[');
  expect(rich_output).toContain(ansis.green('query-impl'));
  expect(rich_output).toContain(ansis.gray('='));
  expect(rich_output).toContain(ansis.yellow('and'));
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

it('dispatches rich stored query output through renderOutputView', async () => {
  const output_view = createOutputView('queries', [
    {
      name: 'query-impl',
      where: 'implements_command=command:query',
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
          command_name: 'queries',
          output_mode: 'default',
          query_limit: 25,
          query_offset: 0,
        },
      ),
    ),
  ).toBe(renderPlainOutput(output_view));
});

/**
 * @param {string} value
 * @returns {string}
 */
function stripAnsi(value) {
  return ansis.strip(value);
}
