import { EventEmitter } from 'node:events';
import process from 'node:process';

import { afterEach, expect, it, vi } from 'vitest';

const original_pager = process.env.PAGER;

afterEach(() => {
  vi.resetModules();
  vi.doUnmock('node:child_process');

  if (original_pager === undefined) {
    delete process.env.PAGER;
    return;
  }

  process.env.PAGER = original_pager;
});

it('rejects pager input errors that are not broken pipes', async () => {
  process.env.PAGER = 'custom-pager';
  const spawnMock = vi.fn(() =>
    createPagerProcess({
      input_error: new Error('pager failed'),
    }),
  );

  vi.doMock('node:child_process', () => ({
    spawn: spawnMock,
  }));

  const { writePagedOutput } = await import('./write-paged-output.js');

  await expect(writePagedOutput('alpha\nbeta\n')).rejects.toThrow(
    'pager failed',
  );
  expect(spawnMock).toHaveBeenCalledWith(
    'custom-pager',
    [],
    expect.objectContaining({
      shell: true,
      stdio: ['pipe', 'inherit', 'inherit'],
    }),
  );
});

it('resolves broken pipe pager input errors when the pager closes cleanly', async () => {
  process.env.PAGER = 'custom-pager';
  const broken_pipe_error = new Error('broken pipe');

  // @ts-expect-error - Test-only error shape for broken pipe handling.
  broken_pipe_error.code = 'EPIPE';

  vi.doMock('node:child_process', () => ({
    spawn: () =>
      createPagerProcess({
        exit_code: 0,
        input_error: broken_pipe_error,
      }),
  }));

  const { writePagedOutput } = await import('./write-paged-output.js');

  await expect(writePagedOutput('alpha\nbeta\n')).resolves.toBeUndefined();
});

/**
 * @param {{ exit_code?: number, input_error: Error, signal_code?: NodeJS.Signals | null }} options
 * @returns {FakePagerProcess}
 */
function createPagerProcess(options) {
  const pager_process = new FakePagerProcess(options);

  return pager_process;
}

class FakePagerProcess extends EventEmitter {
  /**
   * @param {{ exit_code?: number, input_error: Error, signal_code?: NodeJS.Signals | null }} options
   */
  constructor(options) {
    super();

    this.stdin = new FakePagerInput(this, options.input_error);
    this.exit_code = options.exit_code;
    this.signal_code = options.signal_code ?? null;
  }
}

class FakePagerInput extends EventEmitter {
  /**
   * @param {FakePagerProcess} pager_process
   * @param {Error} input_error
   */
  constructor(pager_process, input_error) {
    super();

    this.input_error = input_error;
    this.pager_process = pager_process;
  }

  end() {
    this.emit('error', this.input_error);

    if (this.pager_process.exit_code !== undefined) {
      queueMicrotask(() => {
        this.pager_process.emit(
          'close',
          this.pager_process.exit_code,
          this.pager_process.signal_code,
        );
      });
    }
  }
}
