import { fileURLToPath } from 'node:url';
import process from 'node:process';

import { afterEach, expect, it, vi } from 'vitest';

const entry_path = fileURLToPath(new URL('./patram.js', import.meta.url));
const original_argv = [...process.argv];
const original_exit_code = process.exitCode;
const { main_mock } = vi.hoisted(() => ({
  main_mock: vi.fn(),
}));

vi.mock('../lib/patram-cli.js', () => ({
  main: main_mock,
}));

afterEach(() => {
  process.argv = [...original_argv];
  process.exitCode = original_exit_code;
  main_mock.mockReset();
  vi.resetModules();
});

it('skips CLI dispatch when the module is imported without a process entry path', async () => {
  process.argv = [original_argv[0]];

  await import('./patram.js');

  expect(main_mock).not.toHaveBeenCalled();
});

it('dispatches to the shared CLI runtime when executed as the entrypoint', async () => {
  process.argv = [
    original_argv[0],
    entry_path,
    'query',
    '--where',
    '$class=task',
  ];
  process.exitCode = undefined;
  main_mock.mockResolvedValueOnce(17);

  const patram_module = await import('./patram.js');

  expect(patram_module.main).toBe(main_mock);
  expect(main_mock).toHaveBeenCalledWith(['query', '--where', '$class=task'], {
    stderr: process.stderr,
    stdout: process.stdout,
  });
  expect(process.exitCode).toBe(17);
});
