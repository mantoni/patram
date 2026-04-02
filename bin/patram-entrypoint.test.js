import { fileURLToPath } from 'node:url';
import process from 'node:process';

import { afterEach, expect, it, vi } from 'vitest';

const entry_path = fileURLToPath(new URL('./patram.js', import.meta.url));
const original_argv = [...process.argv];
const original_exit_code = process.exitCode;
const { mainMock } = vi.hoisted(() => ({
  mainMock: vi.fn(),
}));

vi.mock('../lib/cli/main.js', () => ({
  main: mainMock,
}));

afterEach(() => {
  process.argv = [...original_argv];
  process.exitCode = original_exit_code;
  mainMock.mockReset();
  vi.resetModules();
});

it('skips CLI dispatch when the module is imported without a process entry path', async () => {
  process.argv = [original_argv[0]];

  await import('./patram.js');

  expect(mainMock).not.toHaveBeenCalled();
});

it('dispatches to the shared CLI runtime when executed as the entrypoint', async () => {
  process.argv = [
    original_argv[0],
    entry_path,
    'query',
    '--cypher',
    'MATCH (n:Task) RETURN n',
  ];
  process.exitCode = undefined;
  mainMock.mockResolvedValueOnce(17);

  const patram_module = await import('./patram.js');

  expect(patram_module.main).toBe(mainMock);
  expect(mainMock).toHaveBeenCalledWith(
    ['query', '--cypher', 'MATCH (n:Task) RETURN n'],
    {
      stderr: process.stderr,
      stdout: process.stdout,
    },
  );
  expect(process.exitCode).toBe(17);
});
