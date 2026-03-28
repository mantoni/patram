/**
 * @import { ParsedCliCommandRequest } from '../arguments.types.ts';
 */

import { afterEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create_derived_summary_evaluator_mock: vi.fn(() => ({ evaluate: vi.fn() })),
  create_refs_output_view_mock: vi.fn(() => ({ command: 'refs', items: [] })),
  inspect_reverse_references_mock: vi.fn(),
  load_project_graph_mock: vi.fn(),
  render_invalid_where_diagnostic_mock: vi.fn(() => 'invalid where\n'),
  write_command_output_mock: vi.fn(),
  write_diagnostics_mock: vi.fn(),
}));

vi.mock('../../graph/load-project-graph.js', () => ({
  loadProjectGraph: mocks.load_project_graph_mock,
}));

vi.mock('../../graph/inspect-reverse-references.js', () => ({
  inspectReverseReferences: mocks.inspect_reverse_references_mock,
}));

vi.mock('../../output/command-output.js', () => ({
  writeCommandOutput: mocks.write_command_output_mock,
}));

vi.mock('../../output/derived-summary.js', () => ({
  createDerivedSummaryEvaluator: mocks.create_derived_summary_evaluator_mock,
}));

vi.mock('../../output/render-output-view.js', () => ({
  createRefsOutputView: mocks.create_refs_output_view_mock,
}));

vi.mock('../render-help.js', () => ({
  renderInvalidWhereDiagnostic: mocks.render_invalid_where_diagnostic_mock,
}));

vi.mock('../command-helpers.js', () => ({
  writeDiagnostics: mocks.write_diagnostics_mock,
}));

import { runRefsCommand } from './refs.js';

afterEach(() => {
  Object.values(mocks).forEach((mock_value) => {
    mock_value.mockReset();
  });
  mocks.create_derived_summary_evaluator_mock.mockReturnValue({
    evaluate: vi.fn(),
  });
  mocks.create_refs_output_view_mock.mockReturnValue({
    command: 'refs',
    items: [],
  });
  mocks.render_invalid_where_diagnostic_mock.mockReturnValue('invalid where\n');
  mocks.write_command_output_mock.mockResolvedValue(undefined);
});

it('writes graph diagnostics before inspecting refs', async () => {
  mocks.load_project_graph_mock.mockResolvedValue({
    diagnostics: [{ code: 'graph.invalid' }],
  });

  const exit_code = await runRefsCommand(
    createParsedCommand(),
    createIoContext(),
  );

  expect(exit_code).toBe(1);
  expect(mocks.write_diagnostics_mock).toHaveBeenCalledWith(
    expect.any(Object),
    [{ code: 'graph.invalid' }],
  );
});

it('writes invalid refs diagnostics returned from inspection', async () => {
  mocks.load_project_graph_mock.mockResolvedValue(createProjectGraphResult());
  mocks.inspect_reverse_references_mock.mockReturnValue({
    diagnostics: [{ code: 'query.invalid' }],
    incoming: {},
    node: {},
  });
  const io_context = createIoContext();
  const exit_code = await runRefsCommand(
    createParsedCommand({
      command_arguments: ['docs/patram.md', '--where', '$class=task'],
    }),
    io_context,
  );

  expect(exit_code).toBe(1);
  expect(mocks.inspect_reverse_references_mock).toHaveBeenCalledWith(
    createProjectGraphResult().graph,
    'docs/patram.md',
    createProjectGraphResult().config,
    '$class=task',
  );
  expect(io_context.stderr_chunks).toEqual(['invalid where\n']);
});

it('writes refs output when reverse references resolve', async () => {
  mocks.load_project_graph_mock.mockResolvedValue(createProjectGraphResult());
  mocks.inspect_reverse_references_mock.mockReturnValue({
    diagnostics: [],
    incoming: {},
    node: { id: 'doc:docs/patram.md' },
  });

  const io_context = createIoContext();
  const exit_code = await runRefsCommand(createParsedCommand(), io_context);

  expect(exit_code).toBe(0);
  expect(mocks.inspect_reverse_references_mock).toHaveBeenCalledWith(
    createProjectGraphResult().graph,
    'docs/patram.md',
    createProjectGraphResult().config,
    undefined,
  );
  expect(mocks.write_command_output_mock).toHaveBeenCalled();
});

/**
 * @param {Partial<ParsedCliCommandRequest>=} overrides
 * @returns {ParsedCliCommandRequest}
 */
function createParsedCommand(overrides = {}) {
  return {
    color_mode: 'auto',
    command_arguments: ['docs/patram.md'],
    command_name: 'refs',
    kind: 'command',
    output_mode: 'default',
    query_inspection_mode: undefined,
    query_limit: undefined,
    query_offset: undefined,
    ...overrides,
  };
}

function createIoContext() {
  /** @type {{ stderr_chunks: string[] }} */
  const io_context = {
    stderr_chunks: [],
  };

  return {
    ...io_context,
    stderr: {
      /**
       * @param {string} chunk
       */
      write(chunk) {
        io_context.stderr_chunks.push(chunk);
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
      edges: [],
      nodes: {},
    },
  };
}
