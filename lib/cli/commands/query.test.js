/**
 * @import { ParsedCliCommandRequest } from '../arguments.types.ts';
 */

import { afterEach, expect, it, vi } from 'vitest';

import { createIoContext } from '../test-helpers.js';

const mocks = vi.hoisted(() => ({
  create_derived_summary_evaluator_mock: vi.fn(() => ({ evaluate: vi.fn() })),
  create_output_view_mock: vi.fn(() => ({ command: 'query', items: [] })),
  inspect_query_mock: vi.fn(),
  load_patram_config_mock: vi.fn(),
  load_project_graph_mock: vi.fn(),
  query_graph_mock: vi.fn(),
  render_check_diagnostics_mock: vi.fn(() => 'diagnostics\n'),
  render_cli_parse_error_mock: vi.fn(() => 'parse error\n'),
  render_invalid_where_diagnostic_mock: vi.fn(() => 'invalid where\n'),
  render_query_inspection_mock: vi.fn(() => 'inspection\n'),
  resolve_command_output_mode_mock: vi.fn(() => ({
    color_enabled: false,
    renderer_name: 'plain',
  })),
  resolve_where_clause_mock: vi.fn(),
  should_page_command_output_mock: vi.fn(() => false),
  write_command_output_mock: vi.fn(),
  write_diagnostics_mock: vi.fn(),
}));

vi.mock('../../output/command-output.js', () => ({
  shouldPageCommandOutput: mocks.should_page_command_output_mock,
  writeCommandOutput: mocks.write_command_output_mock,
}));

vi.mock('../../output/derived-summary.js', () => ({
  createDerivedSummaryEvaluator: mocks.create_derived_summary_evaluator_mock,
}));

vi.mock('../../output/render-check-output.js', () => ({
  renderCheckDiagnostics: mocks.render_check_diagnostics_mock,
}));

vi.mock('../render-help.js', () => ({
  renderCliParseError: mocks.render_cli_parse_error_mock,
  renderInvalidWhereDiagnostic: mocks.render_invalid_where_diagnostic_mock,
}));

vi.mock('../../output/render-output-view.js', () => ({
  createOutputView: mocks.create_output_view_mock,
}));

vi.mock('../../config/load-patram-config.js', () => ({
  loadPatramConfig: mocks.load_patram_config_mock,
}));

vi.mock('../../graph/load-project-graph.js', () => ({
  loadProjectGraph: mocks.load_project_graph_mock,
}));

vi.mock('../../graph/query/execute.js', () => ({
  DEFAULT_QUERY_LIMIT: 25,
  queryGraph: mocks.query_graph_mock,
}));

vi.mock('../../graph/query/inspect.js', () => ({
  inspectQuery: mocks.inspect_query_mock,
  renderQueryInspection: mocks.render_query_inspection_mock,
}));

vi.mock('../../graph/query/resolve.js', () => ({
  resolveWhereClause: mocks.resolve_where_clause_mock,
}));

vi.mock('../command-helpers.js', () => ({
  resolveCommandOutputMode: mocks.resolve_command_output_mode_mock,
  writeDiagnostics: mocks.write_diagnostics_mock,
}));

import { runQueryCommand } from './query.js';

afterEach(() => {
  Object.values(mocks).forEach((mock_value) => {
    mock_value.mockReset();
  });
  mocks.create_derived_summary_evaluator_mock.mockReturnValue({
    evaluate: vi.fn(),
  });
  mocks.create_output_view_mock.mockReturnValue({
    command: 'query',
    items: [],
  });
  mocks.render_check_diagnostics_mock.mockReturnValue('diagnostics\n');
  mocks.render_cli_parse_error_mock.mockReturnValue('parse error\n');
  mocks.render_invalid_where_diagnostic_mock.mockReturnValue('invalid where\n');
  mocks.render_query_inspection_mock.mockReturnValue('inspection\n');
  mocks.resolve_command_output_mode_mock.mockReturnValue({
    color_enabled: false,
    renderer_name: 'plain',
  });
  mocks.should_page_command_output_mock.mockReturnValue(false);
  mocks.write_command_output_mock.mockResolvedValue(undefined);
});

it('reports project graph diagnostics before querying', async () => {
  mocks.load_project_graph_mock.mockResolvedValue({
    config: null,
    diagnostics: [{ message: 'broken graph' }],
    graph: {},
  });

  const io_context = createIoContext();
  const exit_code = await runQueryCommand(createParsedCommand(), io_context);

  expect(exit_code).toBe(1);
  expect(mocks.write_diagnostics_mock).toHaveBeenCalledWith(io_context.stderr, [
    { message: 'broken graph' },
  ]);
});

it('writes invalid where-clause resolution messages', async () => {
  mocks.load_project_graph_mock.mockResolvedValue(createProjectGraphResult());
  mocks.resolve_where_clause_mock.mockReturnValue({
    error: {
      code: 'unknown_stored_query',
      name: 'unknown',
    },
    success: false,
  });

  const io_context = createIoContext();
  const exit_code = await runQueryCommand(createParsedCommand(), io_context);

  expect(exit_code).toBe(1);
  expect(mocks.render_cli_parse_error_mock).toHaveBeenCalledWith({
    code: 'unknown_stored_query',
    name: 'unknown',
  });
  expect(io_context.stderr_chunks).toEqual(['parse error\n']);
});

it('writes query diagnostics returned from execution', async () => {
  mocks.load_project_graph_mock.mockResolvedValue(createProjectGraphResult());
  mocks.resolve_where_clause_mock.mockReturnValue({
    success: true,
    value: {
      query_source: { kind: 'ad_hoc' },
      where_clause: '$class=task',
    },
  });
  mocks.query_graph_mock.mockReturnValue({
    diagnostics: [{ code: 'query.invalid' }],
    nodes: [],
    total_count: 0,
  });

  const io_context = createIoContext();
  const exit_code = await runQueryCommand(createParsedCommand(), io_context);

  expect(exit_code).toBe(1);
  expect(mocks.render_invalid_where_diagnostic_mock).toHaveBeenCalledWith({
    code: 'query.invalid',
  });
  expect(io_context.stderr_chunks).toEqual(['invalid where\n']);
});

it('writes successful query output', async () => {
  mocks.should_page_command_output_mock.mockReturnValue(true);
  mocks.load_project_graph_mock.mockResolvedValue(createProjectGraphResult());
  mocks.resolve_where_clause_mock.mockReturnValue({
    success: true,
    value: {
      query_source: { kind: 'stored_query', name: 'ready-tasks' },
      where_clause: '$class=task',
    },
  });
  mocks.query_graph_mock.mockReturnValue({
    diagnostics: [],
    nodes: [{ id: 'task:1' }],
    total_count: 1,
  });

  const io_context = createIoContext();
  const parsed_command = createParsedCommand({
    query_limit: 10,
    query_offset: 5,
  });
  const exit_code = await runQueryCommand(parsed_command, io_context);

  expect(exit_code).toBe(0);
  expect(mocks.create_output_view_mock).toHaveBeenCalledWith(
    'query',
    [{ id: 'task:1' }],
    expect.objectContaining({
      limit: 10,
      offset: 5,
      total_count: 1,
    }),
  );
  expect(mocks.write_command_output_mock).toHaveBeenCalled();
});

it('writes config diagnostics during query inspection', async () => {
  mocks.load_patram_config_mock.mockResolvedValue({
    config: null,
    diagnostics: [{ code: 'config.invalid' }],
  });

  const io_context = createIoContext();
  const exit_code = await runQueryCommand(
    createParsedCommand({
      query_inspection_mode: 'lint',
    }),
    io_context,
  );

  expect(exit_code).toBe(1);
  expect(mocks.render_check_diagnostics_mock).toHaveBeenCalledWith(
    [{ code: 'config.invalid' }],
    { color_enabled: false, renderer_name: 'plain' },
  );
  expect(io_context.stderr_chunks).toEqual(['diagnostics\n']);
});

it('throws when query inspection resolves without a config', async () => {
  mocks.load_patram_config_mock.mockResolvedValue({
    config: null,
    diagnostics: [],
  });

  await expect(
    runQueryCommand(
      createParsedCommand({
        query_inspection_mode: 'explain',
      }),
      createIoContext(),
    ),
  ).rejects.toThrow('Expected a valid Patram repo config.');
});

it('writes invalid where output during query inspection', async () => {
  mocks.load_patram_config_mock.mockResolvedValue({
    config: createRepoConfig(),
    diagnostics: [],
  });
  mocks.resolve_where_clause_mock.mockReturnValue({
    error: {
      code: 'message',
      message: 'Bad where',
    },
    success: false,
  });

  const io_context = createIoContext();
  const exit_code = await runQueryCommand(
    createParsedCommand({
      query_inspection_mode: 'lint',
    }),
    io_context,
  );

  expect(exit_code).toBe(1);
  expect(mocks.render_cli_parse_error_mock).toHaveBeenCalledWith({
    code: 'message',
    message: 'Bad where',
  });
  expect(io_context.stderr_chunks).toEqual(['parse error\n']);
});

it('writes semantic diagnostics during query inspection', async () => {
  mocks.load_patram_config_mock.mockResolvedValue({
    config: createRepoConfig(),
    diagnostics: [],
  });
  mocks.resolve_where_clause_mock.mockReturnValue({
    success: true,
    value: {
      query_source: { kind: 'ad_hoc' },
      where_clause: '$class=task',
    },
  });
  mocks.inspect_query_mock.mockReturnValue({
    diagnostics: [{ code: 'query.unknown_relation' }],
    success: false,
  });

  const io_context = createIoContext();
  const exit_code = await runQueryCommand(
    createParsedCommand({
      query_inspection_mode: 'lint',
    }),
    io_context,
  );

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual(['diagnostics\n']);
});

it('writes rendered inspection output when inspection succeeds', async () => {
  mocks.should_page_command_output_mock.mockReturnValue(true);
  mocks.load_patram_config_mock.mockResolvedValue({
    config: createRepoConfig(),
    diagnostics: [],
  });
  mocks.resolve_where_clause_mock.mockReturnValue({
    success: true,
    value: {
      query_source: { kind: 'stored_query', name: 'ready-tasks' },
      where_clause: '$class=task',
    },
  });
  mocks.inspect_query_mock.mockReturnValue({
    success: true,
    value: {
      inspection_mode: 'explain',
      query_source: { kind: 'stored_query', name: 'ready-tasks' },
      where_clause: '$class=task',
    },
  });

  const io_context = createIoContext();
  const exit_code = await runQueryCommand(
    createParsedCommand({
      query_inspection_mode: 'explain',
    }),
    io_context,
  );

  expect(exit_code).toBe(0);
  expect(mocks.inspect_query_mock).toHaveBeenCalledWith(
    createRepoConfig(),
    {
      query_source: { kind: 'stored_query', name: 'ready-tasks' },
      where_clause: '$class=task',
    },
    {
      inspection_mode: 'explain',
      limit: null,
      offset: 0,
    },
  );
  expect(io_context.stdout_chunks).toEqual(['inspection\n']);
});

/**
 * @param {Partial<ParsedCliCommandRequest>=} overrides
 * @returns {ParsedCliCommandRequest}
 */
function createParsedCommand(overrides = {}) {
  return {
    color_mode: 'auto',
    command_arguments: ['ready-tasks'],
    command_name: 'query',
    kind: 'command',
    output_mode: 'default',
    query_inspection_mode: undefined,
    query_limit: undefined,
    query_offset: undefined,
    ...overrides,
  };
}

function createProjectGraphResult() {
  return {
    config: createRepoConfig(),
    diagnostics: [],
    graph: {
      edges: [],
      nodes: {},
    },
  };
}

function createRepoConfig() {
  return {
    include: ['docs/**/*.md'],
    queries: {},
  };
}
