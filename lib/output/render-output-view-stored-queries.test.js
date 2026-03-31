import { expect, it } from 'vitest';
import ansis from 'ansis';
import { Ansis } from 'ansis';

import { createOutputView, renderOutputView } from './render-output-view.js';
import { renderJsonOutput } from './renderers/json.js';
import { renderPlainOutput } from './renderers/plain.js';
import { renderRichOutput } from './renderers/rich.js';

const colorAnsi = new Ansis(3);

it('renders stored queries through the shared view model', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'active-plans',
      where: '$class=plan and status=active',
    },
    {
      name: 'blocked-tasks',
      where: '$class=task and status=blocked',
    },
  ]);

  expect(renderPlainOutput(output_view)).toBe(
    'active-plans  $class=plan and status=active\n' +
      'blocked-tasks  $class=task and status=blocked\n' +
      'Hint: patram help query-language\n',
  );
});

it('renders stored queries with the query on the first row and description in the body', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'active-plans',
      where: '$class=plan and status=active',
      description: 'Show active plans.',
    },
  ]);

  expect(renderPlainOutput(output_view)).toBe(
    'active-plans  $class=plan and status=active\n' +
      '  Show active plans.\n' +
      'Hint: patram help query-language\n',
  );
});

it('wraps long stored query rows per result in tty output', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'decisions-needing-tasks',
      where:
        '$class=decision and status=accepted and count(in:decided_by, $class=task) = 0',
      description: 'Show accepted decisions that do not yet have tasks.',
    },
  ]);

  expect(
    renderPlainOutput(output_view, {
      is_tty: true,
      terminal_width: 50,
    }),
  ).toBe(
    'decisions-needing-tasks  $class=decision\n' +
      '                         and status=accepted\n' +
      '                         and count(in:decided_by, $class=task) = 0\n' +
      '  Show accepted decisions that do not yet have \n' +
      '  tasks.\n' +
      'Hint: patram help query-language\n',
  );
});

it('renders adjacent stored query descriptions without blank separators', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'active-plans',
      where: '$class=plan and status=active',
      description: 'Show active plans.',
    },
    {
      name: 'blocked-tasks',
      where: '$class=task and status=blocked',
    },
  ]);

  expect(renderPlainOutput(output_view)).toBe(
    'active-plans  $class=plan and status=active\n' +
      '  Show active plans.\n' +
      'blocked-tasks  $class=task and status=blocked\n' +
      'Hint: patram help query-language\n',
  );
});

it('wraps long stored query terms with a hanging indent', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'plans-without-decisions',
      where:
        '$class=plan and status=active and $path^=docs/plans/ and title~Output and not tracked_in:*',
    },
  ]);

  expect(renderPlainOutput(output_view)).toBe(
    'plans-without-decisions  $class=plan and status=active and $path^=docs/plans/ and title~Output and not tracked_in:*\n' +
      'Hint: patram help query-language\n',
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
    'query-impl  implements_command=command:query and not uses_term=term:graph\n' +
      'Hint: patram help query-language\n',
  );
});

it('renders traversal aggregate stored query terms', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'done',
      where:
        '$class=decision and none(in:decided_by, $class=task and status not in [done, dropped, superseded])',
    },
  ]);

  expect(renderPlainOutput(output_view)).toBe(
    'done  $class=decision and none(in:decided_by, $class=task and status not in [done, dropped, superseded])\n' +
      'Hint: patram help query-language\n',
  );
});

it('renders the query-language help hint after stored queries', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'done',
      where:
        '$class=decision and none(in:decided_by, $class=task and status not in [done, dropped, superseded])',
    },
  ]);

  expect(renderPlainOutput(output_view)).toBe(
    'done  $class=decision and none(in:decided_by, $class=task and status not in [done, dropped, superseded])\n' +
      'Hint: patram help query-language\n',
  );
});

it('renders stored queries with grouped `or` expressions', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'decision-status',
      where: '$class=decision and (status=accepted or status=active)',
    },
  ]);

  expect(renderPlainOutput(output_view)).toBe(
    'decision-status  $class=decision and (status=accepted or status=active)\n' +
      'Hint: patram help query-language\n',
  );
});

it('renders stored queries as json output', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'ready-tasks',
      where: '$class=task and status=ready',
      description: 'Show tasks that are ready to start.',
    },
  ]);

  expect(renderJsonOutput(output_view)).toBe(
    '{\n' +
      '  "queries": [\n' +
      '    {\n' +
      '      "name": "ready-tasks",\n' +
      '      "where": "$class=task and status=ready",\n' +
      '      "description": "Show tasks that are ready to start."\n' +
      '    }\n' +
      '  ]\n' +
      '}\n',
  );
});

it('renders rich stored query boolean keywords in gray', async () => {
  const output_view = createOutputView('queries', [
    {
      name: 'plans-without-decisions',
      where: '$class=plan and (not tracked_in:* or status=active)',
    },
  ]);
  const plain_output = renderPlainOutput(output_view);
  const rich_output = await renderRichOutput(output_view, {
    color_enabled: true,
    color_mode: 'always',
  });

  expect(stripAnsi(rich_output)).toBe(plain_output);
  expect(rich_output).toContain('\u001B[');
  expect(rich_output).toContain(colorAnsi.green('plans-without-decisions'));
  expect(rich_output).toContain(colorAnsi.gray('='));
  expect(rich_output).toContain(colorAnsi.gray('and'));
  expect(rich_output).toContain(colorAnsi.gray('or'));
  expect(rich_output).toContain(colorAnsi.gray('not'));
  expect(rich_output).toContain(
    colorAnsi.gray('Hint: patram help query-language'),
  );
  expect(rich_output).not.toContain(colorAnsi.yellow('and'));
});

it('renders rich stored query descriptions in gray', async () => {
  const output_view = createOutputView('queries', [
    {
      name: 'active-plans',
      where: '$class=plan and status=active',
      description: 'Show active plans.',
    },
  ]);
  const plain_output = renderPlainOutput(output_view);
  const rich_output = await renderRichOutput(output_view, {
    color_enabled: true,
    color_mode: 'always',
  });

  expect(stripAnsi(rich_output)).toBe(plain_output);
  expect(rich_output).toContain('\u001B[');
  expect(rich_output).toContain(colorAnsi.green('active-plans'));
  expect(rich_output).toContain(colorAnsi.gray('Show active plans.'));
  expect(rich_output).toContain(colorAnsi.gray('and'));
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

it('falls back to literal token wrapping for invalid stored queries', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'broken',
      where: '(',
    },
    {
      name: 'blank',
      where: '   ',
    },
  ]);

  expect(renderPlainOutput(output_view)).toBe(
    'broken  (\n' + 'blank     \n' + 'Hint: patram help query-language\n',
  );
});

it('renders count aggregate comparisons in stored queries', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'busy-plans',
      where: 'count(in:tracked_in, $class=task) > 2',
    },
  ]);

  expect(renderPlainOutput(output_view)).toBe(
    'busy-plans  count(in:tracked_in, $class=task) > 2\n' +
      'Hint: patram help query-language\n',
  );
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
