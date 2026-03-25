/**
 * @import { ParsedCliCommandRequest } from './parse-cli-arguments.types.ts';
 * @import { PatramDiagnostic } from './load-patram-config.types.ts';
 */

/* eslint-disable max-lines, max-lines-per-function */
import { afterEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create_derived_summary_evaluator_mock: vi.fn(() => ({
    evaluate() {
      return null;
    },
  })),
  create_output_view_mock: vi.fn(
    (command_name, command_items, command_options) => ({
      command_items,
      command_name,
      command_options,
    }),
  ),
  create_show_output_view_mock: vi.fn((show_output, command_options) => ({
    command_options,
    show_output,
  })),
  discover_fields_mock: vi.fn(() => ({ fields: [] })),
  inspect_query_mock: vi.fn(),
  list_queries_mock: vi.fn(() => []),
  load_patram_config_mock: vi.fn(),
  load_project_graph_mock: vi.fn(),
  load_show_output_mock: vi.fn(),
  parse_cli_arguments_mock: vi.fn(),
  query_graph_mock: vi.fn(),
  render_check_diagnostics_mock: vi.fn(() => 'rendered check diagnostics\n'),
  render_check_success_mock: vi.fn(() => 'check passed\n'),
  render_cli_parse_error_mock: vi.fn(() => 'parse error\n'),
  render_field_discovery_mock: vi.fn(() => 'field discovery\n'),
  render_help_request_mock: vi.fn(() => 'help\n'),
  render_invalid_where_diagnostic_mock: vi.fn(() => 'invalid where\n'),
  render_query_inspection_mock: vi.fn(() => 'query inspection\n'),
  resolve_check_target_mock: vi.fn(),
  resolve_output_mode_mock: vi.fn(() => ({
    color_enabled: false,
    renderer_name: 'plain',
  })),
  resolve_where_clause_mock: vi.fn(),
  select_check_target_diagnostics_mock: vi.fn(() => []),
  select_check_target_source_files_mock: vi.fn(() => []),
  should_page_command_output_mock: vi.fn(() => false),
  write_command_output_mock: vi.fn(async () => {}),
  write_rendered_command_output_mock: vi.fn(async () => {}),
}));

vi.mock('./check-graph.js', () => ({
  checkGraph: vi.fn(() => []),
}));

vi.mock('./command-output.js', () => ({
  shouldPageCommandOutput: mocks.should_page_command_output_mock,
  writeCommandOutput: mocks.write_command_output_mock,
  writeRenderedCommandOutput: mocks.write_rendered_command_output_mock,
}));

vi.mock('./derived-summary.js', () => ({
  createDerivedSummaryEvaluator: mocks.create_derived_summary_evaluator_mock,
}));

vi.mock('./discover-fields.js', () => ({
  discoverFields: mocks.discover_fields_mock,
}));

vi.mock('./list-queries.js', () => ({
  listQueries: mocks.list_queries_mock,
}));

vi.mock('./list-source-files.js', () => ({
  listRepoFiles: vi.fn(async () => []),
}));

vi.mock('./load-patram-config.js', () => ({
  loadPatramConfig: mocks.load_patram_config_mock,
}));

vi.mock('./load-project-graph.js', () => ({
  loadProjectGraph: mocks.load_project_graph_mock,
}));

vi.mock('./parse-cli-arguments.js', () => ({
  parseCliArguments: mocks.parse_cli_arguments_mock,
}));

vi.mock('./query-graph.js', () => ({
  DEFAULT_QUERY_LIMIT: 25,
  queryGraph: mocks.query_graph_mock,
}));

vi.mock('./query-inspection.js', () => ({
  inspectQuery: mocks.inspect_query_mock,
  renderQueryInspection: mocks.render_query_inspection_mock,
}));

vi.mock('./render-check-output.js', () => ({
  renderCheckDiagnostics: mocks.render_check_diagnostics_mock,
  renderCheckSuccess: mocks.render_check_success_mock,
}));

vi.mock('./render-cli-help.js', () => ({
  renderCliParseError: mocks.render_cli_parse_error_mock,
  renderHelpRequest: mocks.render_help_request_mock,
  renderInvalidWhereDiagnostic: mocks.render_invalid_where_diagnostic_mock,
}));

vi.mock('./render-field-discovery.js', () => ({
  renderFieldDiscovery: mocks.render_field_discovery_mock,
}));

vi.mock('./render-output-view.js', () => ({
  createOutputView: mocks.create_output_view_mock,
  createShowOutputView: mocks.create_show_output_view_mock,
}));

vi.mock('./resolve-check-target.js', () => ({
  resolveCheckTarget: mocks.resolve_check_target_mock,
  selectCheckTargetDiagnostics: mocks.select_check_target_diagnostics_mock,
  selectCheckTargetSourceFiles: mocks.select_check_target_source_files_mock,
}));

vi.mock('./resolve-output-mode.js', () => ({
  resolveOutputMode: mocks.resolve_output_mode_mock,
}));

vi.mock('./resolve-where-clause.js', () => ({
  resolveWhereClause: mocks.resolve_where_clause_mock,
}));

vi.mock('./show-document.js', () => ({
  loadShowOutput: mocks.load_show_output_mock,
}));

import { main } from './patram-cli.js';

afterEach(() => {
  Object.values(mocks).forEach((mock_value) => {
    mock_value.mockReset();
  });

  mocks.create_derived_summary_evaluator_mock.mockReturnValue({
    evaluate() {
      return null;
    },
  });
  mocks.create_output_view_mock.mockImplementation(
    (command_name, command_items, command_options) => ({
      command_items,
      command_name,
      command_options,
    }),
  );
  mocks.create_show_output_view_mock.mockImplementation(
    (show_output, command_options) => ({
      command_options,
      show_output,
    }),
  );
  mocks.discover_fields_mock.mockReturnValue({ fields: [] });
  mocks.list_queries_mock.mockReturnValue([]);
  mocks.render_check_diagnostics_mock.mockReturnValue(
    'rendered check diagnostics\n',
  );
  mocks.render_check_success_mock.mockReturnValue('check passed\n');
  mocks.render_cli_parse_error_mock.mockReturnValue('parse error\n');
  mocks.render_field_discovery_mock.mockReturnValue('field discovery\n');
  mocks.render_help_request_mock.mockReturnValue('help\n');
  mocks.render_invalid_where_diagnostic_mock.mockReturnValue('invalid where\n');
  mocks.render_query_inspection_mock.mockReturnValue('query inspection\n');
  mocks.resolve_output_mode_mock.mockReturnValue({
    color_enabled: false,
    renderer_name: 'plain',
  });
  mocks.should_page_command_output_mock.mockReturnValue(false);
  mocks.write_command_output_mock.mockResolvedValue(undefined);
  mocks.write_rendered_command_output_mock.mockResolvedValue(undefined);
});

it('renders parse failures and help requests before dispatching commands', async () => {
  const io_context = createIoContext();

  mocks.parse_cli_arguments_mock.mockReturnValueOnce({
    error: new Error('bad arguments'),
    success: false,
  });

  await expect(main([], io_context)).resolves.toBe(1);
  expect(io_context.stderr_chunks).toEqual(['parse error\n']);

  mocks.parse_cli_arguments_mock.mockReturnValueOnce({
    success: true,
    value: {
      kind: 'help',
      topic_name: 'query',
    },
  });

  await expect(main(['help', 'query'], io_context)).resolves.toBe(0);
  expect(io_context.stdout_chunks).toEqual(['help\n']);
});

it('reports unknown commands after parsing succeeds', async () => {
  const io_context = createIoContext();

  mocks.parse_cli_arguments_mock.mockReturnValue({
    success: true,
    value: {
      command_name: 'bogus',
      kind: 'command',
    },
  });

  await expect(main(['bogus'], io_context)).resolves.toBe(1);
  expect(io_context.stderr_chunks).toEqual(['Unknown command.\n']);
});

it('handles check command graph diagnostics, filtered diagnostics, and success', async () => {
  const io_context = createIoContext();

  mocks.parse_cli_arguments_mock.mockReturnValueOnce({
    success: true,
    value: createParsedCommand('check'),
  });
  mocks.resolve_check_target_mock.mockResolvedValue({
    project_directory: process.cwd(),
  });
  mocks.load_project_graph_mock.mockResolvedValueOnce({
    claims: [],
    config: {},
    diagnostics: [createDiagnostic('graph failed')],
    graph: {},
    source_file_paths: [],
  });

  await expect(main(['check'], io_context)).resolves.toBe(1);
  expect(io_context.stderr_chunks.at(-1)).toBe('rendered check diagnostics\n');

  mocks.parse_cli_arguments_mock.mockReturnValueOnce({
    success: true,
    value: createParsedCommand('check'),
  });
  mocks.load_project_graph_mock.mockResolvedValueOnce({
    claims: [],
    config: {},
    diagnostics: [],
    graph: {},
    source_file_paths: ['docs/tasks/a.md'],
  });
  mocks.select_check_target_diagnostics_mock.mockReturnValueOnce(
    /** @type {any} */ ([createDiagnostic('selected diagnostic')]),
  );

  await expect(main(['check'], io_context)).resolves.toBe(1);
  expect(io_context.stderr_chunks.at(-1)).toBe('rendered check diagnostics\n');

  mocks.parse_cli_arguments_mock.mockReturnValueOnce({
    success: true,
    value: createParsedCommand('check'),
  });
  mocks.load_project_graph_mock.mockResolvedValueOnce({
    claims: [],
    config: {},
    diagnostics: [],
    graph: {},
    source_file_paths: ['docs/tasks/a.md', 'docs/tasks/b.md'],
  });
  mocks.select_check_target_diagnostics_mock.mockReturnValueOnce([]);
  mocks.select_check_target_source_files_mock.mockReturnValueOnce(
    /** @type {any} */ (['docs/tasks/a.md', 'docs/tasks/b.md']),
  );

  await expect(main(['check'], io_context)).resolves.toBe(0);
  expect(io_context.stdout_chunks.at(-1)).toBe('check passed\n');
  expect(mocks.render_check_success_mock).toHaveBeenCalledWith(
    2,
    expect.any(Object),
  );
});

it('writes query graph diagnostics and query hints through the query command', async () => {
  const io_context = createIoContext();

  mocks.parse_cli_arguments_mock.mockReturnValue({
    success: true,
    value: createParsedCommand('query'),
  });
  mocks.load_project_graph_mock.mockResolvedValueOnce({
    claims: [],
    config: {},
    diagnostics: [createDiagnostic('config load failed')],
    graph: {},
    source_file_paths: [],
  });

  await expect(main(['query'], io_context)).resolves.toBe(1);
  expect(io_context.stderr_chunks.join('')).toBe(
    '<query>:1:1 error diagnostic config load failed\n',
  );

  io_context.stderr_chunks.length = 0;

  mocks.load_project_graph_mock.mockResolvedValueOnce({
    claims: [],
    config: {},
    diagnostics: [],
    graph: {},
    source_file_paths: [],
  });
  mocks.resolve_where_clause_mock.mockReturnValue({
    success: true,
    value: {
      query_source: {
        kind: 'ad_hoc',
      },
      where_clause: '$class=task',
    },
  });
  mocks.query_graph_mock.mockReturnValue({
    diagnostics: [],
    nodes: [],
    total_count: 0,
  });

  await expect(main(['query'], io_context)).resolves.toBe(0);
  expect(mocks.create_output_view_mock).toHaveBeenCalledWith(
    'query',
    [],
    expect.objectContaining({
      hints: ['Try: patram query --where "$class=task"'],
      limit: 25,
      offset: 0,
      total_count: 0,
    }),
  );
});

it('handles query where failures, invalid diagnostics, and pagination hints', async () => {
  const io_context = createIoContext();

  mocks.parse_cli_arguments_mock.mockReturnValueOnce({
    success: true,
    value: createParsedCommand('query'),
  });
  mocks.load_project_graph_mock.mockResolvedValueOnce({
    claims: [],
    config: {},
    diagnostics: [],
    graph: {},
    source_file_paths: [],
  });
  mocks.resolve_where_clause_mock.mockReturnValueOnce({
    message: 'Where clause required.',
    success: false,
  });

  await expect(main(['query'], io_context)).resolves.toBe(1);
  expect(io_context.stderr_chunks.at(-1)).toBe('Where clause required.\n');

  mockPlainQueryRun({
    diagnostics: [createDiagnostic('invalid where')],
    nodes: [],
    total_count: 0,
  });

  await expect(main(['query'], io_context)).resolves.toBe(1);
  expect(io_context.stderr_chunks.at(-1)).toBe('invalid where\n');

  mockPlainQueryRun({
    diagnostics: [],
    nodes: [{ id: 'task-1' }],
    total_count: 26,
  });

  await expect(main(['query'], io_context)).resolves.toBe(0);
  expect(mocks.create_output_view_mock).toHaveBeenCalledWith(
    'query',
    [{ id: 'task-1' }],
    expect.objectContaining({
      hints: [
        'Hint: use --offset <n> or --limit <n> to page through more matches.',
      ],
      limit: 25,
      offset: 0,
      total_count: 26,
    }),
  );
});

it('uses an explicit query limit and null inspection limit when paging changes the defaults', async () => {
  const io_context = createIoContext();

  mocks.parse_cli_arguments_mock.mockReturnValueOnce({
    success: true,
    value: createParsedCommand('query', {
      query_limit: 3,
      query_offset: 2,
    }),
  });
  mocks.load_project_graph_mock.mockResolvedValue({
    claims: [],
    config: {},
    diagnostics: [],
    graph: {},
    source_file_paths: [],
  });
  mocks.resolve_where_clause_mock.mockReturnValue({
    success: true,
    value: {
      query_source: {
        kind: 'ad_hoc',
      },
      where_clause: '$class=task',
    },
  });
  mocks.query_graph_mock.mockReturnValue({
    diagnostics: [],
    nodes: [],
    total_count: 2,
  });

  await expect(main(['query'], io_context)).resolves.toBe(0);
  expect(mocks.query_graph_mock).toHaveBeenCalledWith(
    {},
    '$class=task',
    {},
    {
      limit: 3,
      offset: 2,
    },
  );

  mocks.parse_cli_arguments_mock.mockReturnValueOnce({
    success: true,
    value: createParsedCommand('query', {
      query_inspection_mode: 'lint',
    }),
  });
  mocks.should_page_command_output_mock.mockReturnValue(true);
  mocks.load_patram_config_mock.mockResolvedValue({
    config: {
      queries: {},
    },
    diagnostics: [],
  });
  mocks.resolve_where_clause_mock.mockReturnValue({
    success: true,
    value: {
      query_source: {
        kind: 'ad_hoc',
      },
      where_clause: '$class=task',
    },
  });
  mocks.inspect_query_mock.mockReturnValue({
    success: true,
    value: {
      inspection_mode: 'lint',
      query_source: {
        kind: 'ad_hoc',
      },
      where_clause: '$class=task',
    },
  });

  await expect(main(['query', '--lint'], io_context)).resolves.toBe(0);
  expect(mocks.inspect_query_mock).toHaveBeenCalledWith(
    {
      queries: {},
    },
    {
      query_source: {
        kind: 'ad_hoc',
      },
      where_clause: '$class=task',
    },
    {
      inspection_mode: 'lint',
      limit: null,
      offset: 0,
    },
  );
});

it('handles config diagnostics and missing configs for inspection and queries commands', async () => {
  const io_context = createIoContext();

  mocks.parse_cli_arguments_mock.mockReturnValueOnce({
    success: true,
    value: createParsedCommand('query', {
      query_inspection_mode: 'lint',
    }),
  });
  mocks.load_patram_config_mock.mockResolvedValueOnce({
    config: null,
    diagnostics: [createDiagnostic('bad config')],
  });

  await expect(main(['query', '--lint'], io_context)).resolves.toBe(1);
  expect(io_context.stderr_chunks).toEqual(['rendered check diagnostics\n']);

  mocks.parse_cli_arguments_mock.mockReturnValueOnce({
    success: true,
    value: createParsedCommand('query', {
      query_inspection_mode: 'lint',
    }),
  });
  mocks.load_patram_config_mock.mockResolvedValueOnce({
    config: null,
    diagnostics: [],
  });

  await expect(main(['query', '--lint'], io_context)).rejects.toThrow(
    'Expected a valid Patram repo config.',
  );

  mocks.parse_cli_arguments_mock.mockReturnValueOnce({
    success: true,
    value: createParsedCommand('queries'),
  });
  mocks.load_patram_config_mock.mockResolvedValueOnce({
    config: null,
    diagnostics: [createDiagnostic('bad config')],
  });

  await expect(main(['queries'], io_context)).resolves.toBe(1);
  expect(io_context.stderr_chunks.at(-1)).toBe(
    '<query>:1:1 error diagnostic bad config\n',
  );

  mocks.parse_cli_arguments_mock.mockReturnValueOnce({
    success: true,
    value: createParsedCommand('queries'),
  });
  mocks.load_patram_config_mock.mockResolvedValueOnce({
    config: null,
    diagnostics: [],
  });

  await expect(main(['queries'], io_context)).rejects.toThrow(
    'Expected a valid Patram repo config.',
  );
});

it('lists queries and handles show command failures and success', async () => {
  const io_context = createIoContext();

  mocks.parse_cli_arguments_mock.mockReturnValueOnce({
    success: true,
    value: createParsedCommand('queries'),
  });
  mocks.load_patram_config_mock.mockResolvedValueOnce({
    config: {
      queries: {
        ready: {
          where: '$class=task',
        },
      },
    },
    diagnostics: [],
  });
  mocks.list_queries_mock.mockReturnValueOnce(
    /** @type {any} */ ([
      {
        id: 'ready',
        kind: 'stored_query',
      },
    ]),
  );

  await expect(main(['queries'], io_context)).resolves.toBe(0);
  expect(mocks.create_output_view_mock).toHaveBeenCalledWith('queries', [
    {
      id: 'ready',
      kind: 'stored_query',
    },
  ]);

  mocks.parse_cli_arguments_mock.mockReturnValueOnce({
    success: true,
    value: createParsedCommand('show', {
      command_arguments: ['docs/patram.md'],
    }),
  });
  mocks.load_project_graph_mock.mockResolvedValueOnce({
    claims: [],
    config: {},
    diagnostics: [],
    graph: {
      document_node_ids: {},
      nodes: {},
    },
    source_file_paths: [],
  });
  mocks.load_show_output_mock.mockResolvedValueOnce({
    diagnostic: createDiagnostic('missing document'),
    success: false,
  });

  await expect(main(['show', 'docs/patram.md'], io_context)).resolves.toBe(1);
  expect(io_context.stderr_chunks.at(-1)).toBe(
    '<query>:1:1 error diagnostic missing document\n',
  );

  mocks.parse_cli_arguments_mock.mockReturnValueOnce({
    success: true,
    value: createParsedCommand('show', {
      command_arguments: ['docs/patram.md'],
    }),
  });
  mocks.load_project_graph_mock.mockResolvedValueOnce({
    claims: [],
    config: {
      fields: {},
    },
    diagnostics: [],
    graph: {
      document_node_ids: {
        'docs/patram.md': 'doc:docs/patram.md',
      },
      nodes: {
        'doc:docs/patram.md': {
          id: 'doc:docs/patram.md',
        },
      },
    },
    source_file_paths: [],
  });
  mocks.load_show_output_mock.mockResolvedValueOnce({
    success: true,
    value: {
      source_path: 'docs/patram.md',
    },
  });

  await expect(main(['show', 'docs/patram.md'], io_context)).resolves.toBe(0);
  expect(mocks.create_show_output_view_mock).toHaveBeenCalledWith(
    {
      source_path: 'docs/patram.md',
    },
    expect.objectContaining({
      document_node_ids: {
        'docs/patram.md': 'doc:docs/patram.md',
      },
      graph_nodes: {
        'doc:docs/patram.md': {
          id: 'doc:docs/patram.md',
        },
      },
    }),
  );
});

it('handles inspection where-clause errors, show graph diagnostics, and fields config fallbacks', async () => {
  const io_context = createIoContext();

  mocks.parse_cli_arguments_mock.mockReturnValueOnce({
    success: true,
    value: createParsedCommand('query', {
      query_inspection_mode: 'lint',
    }),
  });
  mocks.load_patram_config_mock.mockResolvedValueOnce({
    config: {
      queries: {},
    },
    diagnostics: [],
  });
  mocks.resolve_where_clause_mock.mockReturnValueOnce({
    message: 'Need a where clause.',
    success: false,
  });

  await expect(main(['query', '--lint'], io_context)).resolves.toBe(1);
  expect(io_context.stderr_chunks.at(-1)).toBe('Need a where clause.\n');

  mocks.parse_cli_arguments_mock.mockReturnValueOnce({
    success: true,
    value: createParsedCommand('show', {
      command_arguments: ['docs/patram.md'],
    }),
  });
  mocks.load_project_graph_mock.mockResolvedValueOnce({
    claims: [],
    config: {},
    diagnostics: [createDiagnostic('graph failed')],
    graph: {},
    source_file_paths: [],
  });

  await expect(main(['show', 'docs/patram.md'], io_context)).resolves.toBe(1);
  expect(io_context.stderr_chunks.join('')).toContain('graph failed');

  mocks.parse_cli_arguments_mock.mockReturnValueOnce({
    success: true,
    value: createParsedCommand('fields'),
  });
  mocks.load_patram_config_mock.mockResolvedValueOnce({
    config: null,
    diagnostics: [createDiagnostic('config warning')],
  });

  await expect(main(['fields'], io_context)).resolves.toBe(0);
  expect(mocks.discover_fields_mock).toHaveBeenCalledWith(process.cwd(), {
    defined_field_names: new Set(),
  });
});

/**
 * @param {ParsedCliCommandRequest['command_name']} command_name
 * @param {Partial<ParsedCliCommandRequest>} overrides
 * @returns {ParsedCliCommandRequest}
 */
function createParsedCommand(command_name, overrides = {}) {
  return {
    color_mode: 'auto',
    command_arguments: [],
    command_name,
    kind: 'command',
    output_mode: 'default',
    query_inspection_mode: undefined,
    query_limit: undefined,
    query_offset: undefined,
    ...overrides,
  };
}

/**
 * @param {string} message
 * @returns {PatramDiagnostic}
 */
function createDiagnostic(message) {
  return {
    code: 'diagnostic',
    column: 1,
    level: 'error',
    line: 1,
    message,
    path: '<query>',
  };
}

function createIoContext() {
  /** @type {{ stderr_chunks: string[], stdout_chunks: string[] }} */
  const io_context = {
    stderr_chunks: [],
    stdout_chunks: [],
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
      isTTY: false,
      /**
       * @param {string} chunk
       */
      write(chunk) {
        io_context.stdout_chunks.push(chunk);
        return true;
      },
    },
  };
}

/**
 * @param {{ diagnostics: PatramDiagnostic[], nodes: any[], total_count: number }} query_result
 */
function mockPlainQueryRun(query_result) {
  mocks.parse_cli_arguments_mock.mockReturnValueOnce({
    success: true,
    value: createParsedCommand('query'),
  });
  mocks.load_project_graph_mock.mockResolvedValueOnce({
    claims: [],
    config: {},
    diagnostics: [],
    graph: {},
    source_file_paths: [],
  });
  mocks.resolve_where_clause_mock.mockReturnValueOnce({
    success: true,
    value: {
      query_source: {
        kind: 'ad_hoc',
      },
      where_clause: '$class=task',
    },
  });
  mocks.query_graph_mock.mockReturnValueOnce(query_result);
}
