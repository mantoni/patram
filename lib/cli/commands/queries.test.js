/**
 * @import { ParsedCliCommandRequest } from '../arguments.types.ts';
 */

import { afterEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create_output_view_mock: vi.fn(() => ({ command: 'queries', items: [] })),
  list_queries_mock: vi.fn(() => []),
  load_patram_config_mock: vi.fn(),
  manage_stored_queries_mock: vi.fn(),
  render_check_diagnostics_mock: vi.fn(() => 'diagnostics\n'),
  render_cli_parse_error_mock: vi.fn(() => 'parse error\n'),
  resolve_command_output_mode_mock: vi.fn(() => ({
    color_enabled: false,
    renderer_name: 'plain',
  })),
  write_command_output_mock: vi.fn(),
  write_diagnostics_mock: vi.fn(),
}));

vi.mock('../../config/manage-stored-queries.js', () => ({
  manageStoredQueries: mocks.manage_stored_queries_mock,
}));

vi.mock('../../config/load-patram-config.js', () => ({
  loadPatramConfig: mocks.load_patram_config_mock,
}));

vi.mock('../../output/command-output.js', () => ({
  writeCommandOutput: mocks.write_command_output_mock,
}));

vi.mock('../../output/list-queries.js', () => ({
  listQueries: mocks.list_queries_mock,
}));

vi.mock('../../output/render-output-view.js', () => ({
  createOutputView: mocks.create_output_view_mock,
}));

vi.mock('../../output/render-check-output.js', () => ({
  renderCheckDiagnostics: mocks.render_check_diagnostics_mock,
}));

vi.mock('../command-helpers.js', () => ({
  resolveCommandOutputMode: mocks.resolve_command_output_mode_mock,
  writeDiagnostics: mocks.write_diagnostics_mock,
}));

vi.mock('../render-help.js', () => ({
  renderCliParseError: mocks.render_cli_parse_error_mock,
}));

import { runQueriesCommand } from './queries.js';

afterEach(() => {
  Object.values(mocks).forEach((mock_value) => {
    mock_value.mockReset();
  });
  mocks.create_output_view_mock.mockReturnValue({
    command: 'queries',
    items: [],
  });
  mocks.list_queries_mock.mockReturnValue([]);
  mocks.render_check_diagnostics_mock.mockReturnValue('diagnostics\n');
  mocks.render_cli_parse_error_mock.mockReturnValue('parse error\n');
  mocks.resolve_command_output_mode_mock.mockReturnValue({
    color_enabled: false,
    renderer_name: 'plain',
  });
  mocks.write_command_output_mock.mockResolvedValue(undefined);
});

it('writes config diagnostics before rendering stored queries', async () => {
  mocks.load_patram_config_mock.mockResolvedValue({
    config: null,
    diagnostics: [{ code: 'config.invalid' }],
  });

  const exit_code = await runQueriesCommand(
    createParsedCommand(),
    createIoContext(),
  );

  expect(exit_code).toBe(1);
  expect(mocks.write_diagnostics_mock).toHaveBeenCalledWith(
    expect.any(Object),
    [{ code: 'config.invalid' }],
  );
});

it('throws when stored queries load without a config', async () => {
  mocks.load_patram_config_mock.mockResolvedValue({
    config: null,
    diagnostics: [],
  });

  await expect(
    runQueriesCommand(createParsedCommand(), createIoContext()),
  ).rejects.toThrow('Expected a valid Patram repo config.');
});

it('renders stored query output when config loading succeeds', async () => {
  mocks.load_patram_config_mock.mockResolvedValue({
    config: {
      queries: {
        pending: {
          cypher: 'MATCH (n:Task) RETURN n',
        },
      },
    },
    diagnostics: [],
  });
  mocks.list_queries_mock.mockReturnValue(
    /** @type {any} */ ([
      { name: 'pending', where: 'MATCH (n:Task) RETURN n' },
    ]),
  );

  const io_context = createIoContext();
  const parsed_command = createParsedCommand();
  const exit_code = await runQueriesCommand(parsed_command, io_context);

  expect(exit_code).toBe(0);
  expect(mocks.create_output_view_mock).toHaveBeenCalledWith('queries', [
    { name: 'pending', where: 'MATCH (n:Task) RETURN n' },
  ]);
  expect(mocks.write_command_output_mock).toHaveBeenCalledWith(
    io_context,
    parsed_command,
    { command: 'queries', items: [] },
  );
});

it('writes parse errors for unknown mutation subcommands', async () => {
  const io_context = createIoContext();
  const exit_code = await runQueriesCommand(
    createParsedCommand({
      command_arguments: ['bogus'],
    }),
    io_context,
  );

  expect(exit_code).toBe(1);
  expect(mocks.render_cli_parse_error_mock).toHaveBeenCalledWith({
    code: 'unexpected_argument',
    command_name: 'queries',
    token: 'bogus',
  });
});

it('writes successful mutation output', async () => {
  mocks.manage_stored_queries_mock.mockResolvedValue({
    success: true,
    value: {
      action: 'updated',
      name: 'ready',
      previous_name: 'blocked',
    },
  });

  const io_context = createIoContext();
  const exit_code = await runQueriesCommand(
    createParsedCommand({
      command_arguments: [
        'update',
        'blocked',
        '--name',
        'ready',
        '--cypher',
        'MATCH (n:Task) RETURN n',
        '--desc',
        '',
      ],
    }),
    io_context,
  );

  expect(exit_code).toBe(0);
  expect(io_context.stdout_chunks).toEqual([
    'Updated stored query: blocked -> ready\n',
  ]);
  expect(mocks.manage_stored_queries_mock).toHaveBeenCalledWith(
    expect.any(String),
    {
      action: 'update',
      description: '',
      name: 'blocked',
      next_name: 'ready',
      cypher: 'MATCH (n:Task) RETURN n',
    },
  );
});

it('writes json mutation output for successful adds', async () => {
  mocks.manage_stored_queries_mock.mockResolvedValue({
    success: true,
    value: {
      action: 'added',
      name: 'ready',
    },
  });

  const io_context = createIoContext();
  const exit_code = await runQueriesCommand(
    createParsedCommand({
      command_arguments: [
        'add',
        'ready',
        '--cypher',
        'MATCH (n:Task) RETURN n',
      ],
      output_mode: 'json',
    }),
    io_context,
  );

  expect(exit_code).toBe(0);
  expect(io_context.stdout_chunks).toEqual([
    '{\n  "action": "added",\n  "name": "ready"\n}\n',
  ]);
});

it('writes mutation parse errors returned from storage helpers', async () => {
  mocks.manage_stored_queries_mock.mockResolvedValue({
    error: {
      code: 'unknown_stored_query',
      name: 'missing',
    },
    success: false,
  });

  const io_context = createIoContext();
  const exit_code = await runQueriesCommand(
    createParsedCommand({
      command_arguments: ['remove', 'missing'],
    }),
    io_context,
  );

  expect(exit_code).toBe(1);
  expect(mocks.render_cli_parse_error_mock).toHaveBeenCalledWith({
    code: 'unknown_stored_query',
    name: 'missing',
  });
});

it('writes mutation diagnostics returned from storage helpers', async () => {
  mocks.manage_stored_queries_mock.mockResolvedValue({
    diagnostics: [{ code: 'config.invalid' }],
    success: false,
  });

  const io_context = createIoContext();
  const exit_code = await runQueriesCommand(
    createParsedCommand({
      command_arguments: [
        'add',
        'broken',
        '--cypher',
        "MATCH (n:Task) WHERE n.owner = 'max' RETURN n",
      ],
    }),
    io_context,
  );

  expect(exit_code).toBe(1);
  expect(mocks.render_check_diagnostics_mock).toHaveBeenCalledWith(
    [{ code: 'config.invalid' }],
    { color_enabled: false, renderer_name: 'plain' },
  );
});

/**
 * @param {Partial<ParsedCliCommandRequest>} overrides
 * @returns {ParsedCliCommandRequest}
 */
function createParsedCommand(overrides = {}) {
  return {
    color_mode: 'auto',
    command_arguments: [],
    command_name: 'queries',
    kind: 'command',
    output_mode: 'default',
    query_inspection_mode: undefined,
    query_limit: undefined,
    query_offset: undefined,
    ...overrides,
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
