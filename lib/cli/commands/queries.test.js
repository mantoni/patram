/**
 * @import { ParsedCliCommandRequest } from '../arguments.types.ts';
 */

import { afterEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create_output_view_mock: vi.fn(() => ({ command: 'queries', items: [] })),
  list_queries_mock: vi.fn(() => []),
  load_patram_config_mock: vi.fn(),
  write_command_output_mock: vi.fn(),
  write_diagnostics_mock: vi.fn(),
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

vi.mock('../command-helpers.js', () => ({
  writeDiagnostics: mocks.write_diagnostics_mock,
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
          where: '$class=task',
        },
      },
    },
    diagnostics: [],
  });
  mocks.list_queries_mock.mockReturnValue(
    /** @type {any} */ ([{ name: 'pending', where: '$class=task' }]),
  );

  const io_context = createIoContext();
  const parsed_command = createParsedCommand();
  const exit_code = await runQueriesCommand(parsed_command, io_context);

  expect(exit_code).toBe(0);
  expect(mocks.create_output_view_mock).toHaveBeenCalledWith('queries', [
    { name: 'pending', where: '$class=task' },
  ]);
  expect(mocks.write_command_output_mock).toHaveBeenCalledWith(
    io_context,
    parsed_command,
    { command: 'queries', items: [] },
  );
});

/**
 * @returns {ParsedCliCommandRequest}
 */
function createParsedCommand() {
  return {
    color_mode: 'auto',
    command_arguments: [],
    command_name: 'queries',
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
