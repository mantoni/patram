import { afterEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  read_file_mock: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  readFile: mocks.read_file_mock,
}));

import { loadPatramConfig } from './load-patram-config.js';

afterEach(() => {
  mocks.read_file_mock.mockReset();
  vi.restoreAllMocks();
});

it('rethrows config file read errors that are not missing-file failures', async () => {
  const file_error = /** @type {NodeJS.ErrnoException} */ (new Error('denied'));
  file_error.code = 'EACCES';
  mocks.read_file_mock.mockRejectedValue(file_error);

  await expect(loadPatramConfig('/tmp/project')).rejects.toThrow('denied');
});

it('reports invalid json origin from explicit byte offsets', async () => {
  mocks.read_file_mock.mockResolvedValue('{}');
  vi.spyOn(JSON, 'parse').mockImplementation(() => {
    throw new SyntaxError('Unexpected token } in JSON at position 5');
  });

  const load_result = await loadPatramConfig('/tmp/project');

  expect(load_result).toEqual({
    config: null,
    config_path: '.patram.json',
    diagnostics: [
      {
        code: 'config.invalid_json',
        column: 3,
        level: 'error',
        line: 1,
        message: 'Invalid JSON syntax.',
        path: '.patram.json',
      },
    ],
  });
});

it('falls back to line 1 column 1 when syntax errors have no origin details', async () => {
  mocks.read_file_mock.mockResolvedValue('{}');
  vi.spyOn(JSON, 'parse').mockImplementation(() => {
    throw new SyntaxError('Unexpected end of JSON input');
  });

  const load_result = await loadPatramConfig('/tmp/project');

  expect(load_result).toEqual({
    config: null,
    config_path: '.patram.json',
    diagnostics: [
      {
        code: 'config.invalid_json',
        column: 1,
        level: 'error',
        line: 1,
        message: 'Invalid JSON syntax.',
        path: '.patram.json',
      },
    ],
  });
});
