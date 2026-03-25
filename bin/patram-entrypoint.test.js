import process from 'node:process';

import { afterEach, expect, it, vi } from 'vitest';

const original_argv = [...process.argv];
const original_exit_code = process.exitCode;

afterEach(() => {
  process.argv = [...original_argv];
  process.exitCode = original_exit_code;
  vi.resetModules();
  vi.doUnmock('node:fs/promises');
  vi.doUnmock('../lib/patram-cli.js');
});

it('skips CLI dispatch when the module is imported without a process entry path', async () => {
  const main_mock = vi.fn(async () => 0);

  process.argv = [original_argv[0]];

  vi.doMock('../lib/patram-cli.js', () => ({
    main: main_mock,
  }));

  await import('./patram.js');

  expect(main_mock).not.toHaveBeenCalled();
});

it('dispatches to the shared CLI runtime when executed as the entrypoint', async () => {
  const main_mock = vi.fn(async () => 17);

  process.argv = [
    original_argv[0],
    '/tmp/patram/bin/patram.js',
    'query',
    '--where',
    '$class=task',
  ];
  process.exitCode = undefined;

  vi.doMock('../lib/patram-cli.js', () => ({
    main: main_mock,
  }));
  vi.doMock('node:fs/promises', async () => {
    const actual_module = await vi.importActual('node:fs/promises');

    return {
      ...actual_module,
      realpath: vi.fn(async () => '/tmp/patram/bin/patram.js'),
    };
  });

  const patram_module = await import('./patram.js');

  expect(patram_module.main).toBe(main_mock);
  expect(main_mock).toHaveBeenCalledWith(['query', '--where', '$class=task'], {
    stderr: process.stderr,
    stdout: process.stdout,
  });
  expect(process.exitCode).toBe(17);
});
