import { expect, it } from 'vitest';
import ansis from 'ansis';
import { Ansis } from 'ansis';

import { createOutputView } from './render-output-view.js';
import { layoutStoredQueryRow } from './layout-stored-queries.js';
import { renderJsonOutput } from './renderers/json.js';
import { renderPlainOutput } from './renderers/plain.js';
import { renderRichOutput } from './renderers/rich.js';

const colorAnsi = new Ansis(3);

it('renders stored queries through the shared view model', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'active-plans',
      where: "MATCH (n:Plan) WHERE n.status = 'active' RETURN n",
    },
    {
      name: 'blocked-tasks',
      where: "MATCH (n:Task) WHERE n.status = 'blocked' RETURN n",
    },
  ]);

  expect(renderPlainOutput(output_view)).toBe(
    "active-plans  MATCH (n:Plan) WHERE n.status = 'active' RETURN n\n" +
      "blocked-tasks  MATCH (n:Task) WHERE n.status = 'blocked' RETURN n\n" +
      'Hint: patram help query-language\n',
  );
});

it('renders stored queries with descriptions', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'active-plans',
      where: "MATCH (n:Plan) WHERE n.status = 'active' RETURN n",
      description: 'Show active plans.',
    },
  ]);

  expect(renderPlainOutput(output_view)).toBe(
    "active-plans  MATCH (n:Plan) WHERE n.status = 'active' RETURN n\n" +
      '  Show active plans.\n' +
      'Hint: patram help query-language\n',
  );
});

it('wraps long stored query rows in tty output', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'decisions-needing-tasks',
      where:
        "MATCH (n:Decision) WHERE n.status = 'accepted' AND COUNT { MATCH (task:Task)-[:DECIDED_BY]->(n) } = 0 RETURN n",
      description: 'Show accepted decisions that do not yet have tasks.',
    },
  ]);

  const plain_output = renderPlainOutput(output_view, {
    is_tty: true,
    terminal_width: 60,
  });

  expect(plain_output).toContain('decisions-needing-tasks');
  expect(plain_output).toContain('MATCH (n:Decision)');
  expect(plain_output).toContain('COUNT { MATCH');
  expect(plain_output).toContain(
    'Show accepted decisions that do not yet have',
  );
});

it('lays out empty stored query clauses as a single empty literal token', () => {
  expect(layoutStoredQueryRow('', 40, 40)).toEqual([
    [{ kind: 'literal', text: '' }],
  ]);
});

it('renders stored queries as json output', () => {
  const output_view = createOutputView('queries', [
    {
      name: 'ready-tasks',
      where: "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
      description: 'Show tasks that are ready to start.',
    },
  ]);

  expect(renderJsonOutput(output_view)).toBe(
    '{\n' +
      '  "queries": [\n' +
      '    {\n' +
      '      "name": "ready-tasks",\n' +
      '      "where": "MATCH (n:Task) WHERE n.status = \'ready\' RETURN n",\n' +
      '      "description": "Show tasks that are ready to start."\n' +
      '    }\n' +
      '  ]\n' +
      '}\n',
  );
});

it('renders rich stored query names and descriptions', async () => {
  const output_view = createOutputView('queries', [
    {
      name: 'active-plans',
      where: "MATCH (n:Plan) WHERE n.status = 'active' RETURN n",
      description: 'Show active plans.',
    },
  ]);
  const plain_output = renderPlainOutput(output_view);
  const rich_output = await renderRichOutput(output_view, {
    color_enabled: true,
    color_mode: 'always',
  });

  expect(ansis.strip(rich_output)).toBe(plain_output);
  expect(rich_output).toContain(colorAnsi.green('active-plans'));
  expect(rich_output).toContain(colorAnsi.gray('Show active plans.'));
  expect(rich_output).toContain(
    colorAnsi.gray('Hint: patram help query-language'),
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
