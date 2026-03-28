/**
 * @import { ParsedCliCommandRequest } from './arguments.types.ts';
 */

import { afterEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  parse_cli_arguments_mock: vi.fn(),
  run_check_command_mock: vi.fn(),
  run_fields_command_mock: vi.fn(),
  run_queries_command_mock: vi.fn(),
  run_query_command_mock: vi.fn(),
  run_refs_command_mock: vi.fn(),
  run_show_command_mock: vi.fn(),
  render_cli_parse_error_mock: vi.fn(() => 'parse error\n'),
  render_help_request_mock: vi.fn(() => 'help\n'),
}));

vi.mock('./parse-arguments.js', () => ({
  parseCliArguments: mocks.parse_cli_arguments_mock,
}));

vi.mock('./commands/check.js', () => ({
  runCheckCommand: mocks.run_check_command_mock,
}));

vi.mock('./commands/fields.js', () => ({
  runFieldsCommand: mocks.run_fields_command_mock,
}));

vi.mock('./commands/queries.js', () => ({
  runQueriesCommand: mocks.run_queries_command_mock,
}));

vi.mock('./commands/query.js', () => ({
  runQueryCommand: mocks.run_query_command_mock,
}));

vi.mock('./commands/refs.js', () => ({
  runRefsCommand: mocks.run_refs_command_mock,
}));

vi.mock('./commands/show.js', () => ({
  runShowCommand: mocks.run_show_command_mock,
}));

vi.mock('./render-help.js', () => ({
  renderCliParseError: mocks.render_cli_parse_error_mock,
  renderHelpRequest: mocks.render_help_request_mock,
}));

import { main } from './main.js';

afterEach(() => {
  Object.values(mocks).forEach((mock_value) => {
    mock_value.mockReset();
  });
  mocks.render_cli_parse_error_mock.mockReturnValue('parse error\n');
  mocks.render_help_request_mock.mockReturnValue('help\n');
  mocks.run_check_command_mock.mockResolvedValue(0);
  mocks.run_fields_command_mock.mockResolvedValue(0);
  mocks.run_queries_command_mock.mockResolvedValue(0);
  mocks.run_query_command_mock.mockResolvedValue(0);
  mocks.run_refs_command_mock.mockResolvedValue(0);
  mocks.run_show_command_mock.mockResolvedValue(0);
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

it('dispatches refs and show commands through their dedicated handlers', async () => {
  const io_context = createIoContext();

  mocks.parse_cli_arguments_mock.mockReturnValueOnce({
    success: true,
    value: createParsedCommand('refs', {
      command_arguments: ['docs/decisions/query-language.md'],
    }),
  });

  await expect(
    main(['refs', 'docs/decisions/query-language.md'], io_context),
  ).resolves.toBe(0);
  expect(mocks.run_refs_command_mock).toHaveBeenCalledWith(
    expect.objectContaining({
      command_arguments: ['docs/decisions/query-language.md'],
      command_name: 'refs',
    }),
    io_context,
  );

  mocks.parse_cli_arguments_mock.mockReturnValueOnce({
    success: true,
    value: createParsedCommand('show', {
      command_arguments: ['docs/patram.md'],
    }),
  });

  await expect(main(['show', 'docs/patram.md'], io_context)).resolves.toBe(0);
  expect(mocks.run_show_command_mock).toHaveBeenCalledWith(
    expect.objectContaining({
      command_arguments: ['docs/patram.md'],
      command_name: 'show',
    }),
    io_context,
  );
});

it('dispatches the check command through its dedicated handler', async () => {
  const io_context = createIoContext();

  mocks.parse_cli_arguments_mock.mockReturnValue({
    success: true,
    value: createParsedCommand('check'),
  });

  await expect(main(['check'], io_context)).resolves.toBe(0);
  expect(mocks.run_check_command_mock).toHaveBeenCalledWith(
    expect.objectContaining({
      command_name: 'check',
    }),
    io_context,
  );
});

it('dispatches the query command through its dedicated handler', async () => {
  const io_context = createIoContext();

  mocks.parse_cli_arguments_mock.mockReturnValue({
    success: true,
    value: createParsedCommand('query'),
  });

  await expect(main(['query'], io_context)).resolves.toBe(0);
  expect(mocks.run_query_command_mock).toHaveBeenCalledWith(
    expect.objectContaining({
      command_name: 'query',
    }),
    io_context,
  );
});

it('dispatches the queries command through its dedicated handler', async () => {
  const io_context = createIoContext();

  mocks.parse_cli_arguments_mock.mockReturnValue({
    success: true,
    value: createParsedCommand('queries'),
  });

  await expect(main(['queries'], io_context)).resolves.toBe(0);
  expect(mocks.run_queries_command_mock).toHaveBeenCalledWith(
    expect.objectContaining({
      command_name: 'queries',
    }),
    io_context,
  );
});

it('dispatches the fields command through its dedicated handler', async () => {
  const io_context = createIoContext();

  mocks.parse_cli_arguments_mock.mockReturnValue({
    success: true,
    value: createParsedCommand('fields'),
  });

  await expect(main(['fields'], io_context)).resolves.toBe(0);
  expect(mocks.run_fields_command_mock).toHaveBeenCalledWith(
    expect.objectContaining({
      command_name: 'fields',
    }),
    io_context,
  );
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
