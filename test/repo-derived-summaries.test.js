import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, it } from 'vitest';

import { createDerivedSummaryEvaluator } from '../lib/derived-summary.js';
import { loadProjectGraph } from '../lib/load-project-graph.js';
import {
  createOutputView,
  createShowOutputView,
} from '../lib/render-output-view.js';
import { renderJsonOutput } from '../lib/render-json-output.js';
import { renderPlainOutput } from '../lib/render-plain-output.js';
import { loadShowOutput } from '../lib/show-document.js';

/**
 * Repo derived summary contract.
 *
 * Verifies the repo-owned derived summary config produces execution metadata for
 * worktracking documents in `query` and `show`.
 *
 * Kind: support
 * Status: active
 * Tracked in: ../docs/plans/v0/declarative-derived-summaries.md
 * Decided by: ../docs/decisions/declarative-derived-summary-config.md
 * Decided by: ../docs/decisions/declarative-derived-summary-side-effects.md
 * @patram
 * @see {@link ../lib/derived-summary.js}
 * @see {@link ../docs/decisions/declarative-derived-summary-config.md}
 */

const repo_directory = dirname(
  fileURLToPath(new URL('../package.json', import.meta.url)),
);

it('renders derived execution metadata for plan query results', async () => {
  const project_graph_result = await loadProjectGraph(repo_directory);

  expect(project_graph_result.diagnostics).toEqual([]);
  const graph_node =
    project_graph_result.graph.nodes[
      'doc:docs/plans/v0/output-contract-alignment.md'
    ];

  if (!graph_node) {
    throw new Error('Expected the output contract plan to be indexed.');
  }

  const derived_summary_evaluator = createDerivedSummaryEvaluator(
    project_graph_result.config,
    project_graph_result.graph,
  );
  const output_view = createOutputView('query', [graph_node], {
    derived_summary_evaluator,
  });

  expect(renderPlainOutput(output_view)).toContain(
    'execution: done  open_tasks: 0  blocked_tasks: 0  total_tasks: 5',
  );
  expect(renderJsonOutput(output_view)).toContain(
    '"derived_summary": "plan_execution"',
  );
});

it('renders the shown document self-summary in show output', async () => {
  const project_graph_result = await loadProjectGraph(repo_directory);

  expect(project_graph_result.diagnostics).toEqual([]);
  const derived_summary_evaluator = createDerivedSummaryEvaluator(
    project_graph_result.config,
    project_graph_result.graph,
  );
  const show_output = await loadShowOutput(
    'docs/plans/v0/declarative-derived-summaries.md',
    repo_directory,
    project_graph_result.graph,
  );

  expect(show_output.success).toBe(true);

  if (!show_output.success) {
    throw new Error('Expected show output to load.');
  }

  const output_view = createShowOutputView(show_output.value, {
    derived_summary_evaluator,
    graph_nodes: project_graph_result.graph.nodes,
  });
  const plain_output = renderPlainOutput(output_view);

  expect(plain_output).toContain(
    '----------------\nplan docs/plans/v0/declarative-derived-summaries.md\nstatus: active\nexecution: done  open_tasks: 0  blocked_tasks: 0  total_tasks: 1',
  );
});
