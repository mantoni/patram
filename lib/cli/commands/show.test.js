/**
 * @import { ParsedCliCommandRequest } from '../arguments.types.ts';
 */

import { afterEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create_derived_summary_evaluator_mock: vi.fn(() => ({ evaluate: vi.fn() })),
  create_show_output_view_mock: vi.fn(() => ({ command: 'show', items: [] })),
  load_project_graph_mock: vi.fn(),
  load_show_output_mock: vi.fn(),
  write_command_output_mock: vi.fn(),
  write_diagnostics_mock: vi.fn(),
}));

vi.mock('../../graph/load-project-graph.js', () => ({
  loadProjectGraph: mocks.load_project_graph_mock,
}));

vi.mock('../../output/command-output.js', () => ({
  writeCommandOutput: mocks.write_command_output_mock,
}));

vi.mock('../../output/derived-summary.js', () => ({
  createDerivedSummaryEvaluator: mocks.create_derived_summary_evaluator_mock,
}));

vi.mock('../../output/render-output-view.js', () => ({
  createShowOutputView: mocks.create_show_output_view_mock,
}));

vi.mock('../../output/show-document.js', () => ({
  loadShowOutput: mocks.load_show_output_mock,
}));

vi.mock('../command-helpers.js', () => ({
  writeDiagnostics: mocks.write_diagnostics_mock,
}));

import { runShowCommand } from './show.js';

afterEach(() => {
  Object.values(mocks).forEach((mock_value) => {
    mock_value.mockReset();
  });
  mocks.create_derived_summary_evaluator_mock.mockReturnValue({
    evaluate: vi.fn(),
  });
  mocks.create_show_output_view_mock.mockReturnValue({
    command: 'show',
    items: [],
  });
  mocks.write_command_output_mock.mockResolvedValue(undefined);
});

it('writes graph diagnostics before loading show output', async () => {
  mocks.load_project_graph_mock.mockResolvedValue({
    diagnostics: [{ code: 'graph.invalid' }],
  });

  const exit_code = await runShowCommand(
    createParsedCommand(),
    createIoContext(),
  );

  expect(exit_code).toBe(1);
  expect(mocks.write_diagnostics_mock).toHaveBeenCalledWith(
    expect.any(Object),
    [{ code: 'graph.invalid' }],
  );
});

it('writes show diagnostics when show output fails', async () => {
  mocks.load_project_graph_mock.mockResolvedValue(createProjectGraphResult());
  mocks.load_show_output_mock.mockResolvedValue({
    diagnostic: { code: 'document.missing' },
    success: false,
  });

  const exit_code = await runShowCommand(
    createParsedCommand(),
    createIoContext(),
  );

  expect(exit_code).toBe(1);
  expect(mocks.write_diagnostics_mock).toHaveBeenCalledWith(
    expect.any(Object),
    [{ code: 'document.missing' }],
  );
});

it('writes show output when loading succeeds', async () => {
  mocks.load_project_graph_mock.mockResolvedValue(createProjectGraphResult());
  mocks.load_show_output_mock.mockResolvedValue({
    success: true,
    value: {
      incoming_summary: {},
      items: [],
      path: 'docs/patram.md',
      rendered_source: '# Patram',
      resolved_links: [],
      source: '# Patram',
    },
  });

  const io_context = createIoContext();
  const exit_code = await runShowCommand(createParsedCommand(), io_context);

  expect(exit_code).toBe(0);
  expect(mocks.load_show_output_mock).toHaveBeenCalledWith(
    'docs/patram.md',
    process.cwd(),
    createProjectGraphResult().graph,
  );
  expect(mocks.write_command_output_mock).toHaveBeenCalled();
});

/**
 * @returns {ParsedCliCommandRequest}
 */
function createParsedCommand() {
  return {
    color_mode: 'auto',
    command_arguments: ['docs/patram.md'],
    command_name: 'show',
    kind: 'command',
    output_mode: 'default',
    query_inspection_mode: undefined,
    query_limit: undefined,
    query_offset: undefined,
  };
}

function createIoContext() {
  return {
    stderr: {
      write() {
        return true;
      },
    },
    stdout: {
      write() {
        return true;
      },
    },
  };
}

function createProjectGraphResult() {
  return {
    config: {
      queries: {},
    },
    diagnostics: [],
    graph: {
      document_node_ids: {},
      edges: [],
      nodes: {},
    },
  };
}
