import { spawn } from 'node:child_process';
import { once } from 'node:events';
import process from 'node:process';

/**
 * @param {string} output_text
 * @returns {Promise<void>}
 */
export async function writePagedOutput(output_text) {
  const pager_command = process.env.PAGER?.trim();

  if (pager_command) {
    await writeOutputThroughPager(output_text, pager_command, [], true);

    return;
  }

  await writeOutputThroughPager(output_text, 'less', ['-FIRX'], false);
}

/**
 * @param {string} output_text
 * @param {string} pager_command
 * @param {string[]} pager_arguments
 * @param {boolean} use_shell
 * @returns {Promise<void>}
 */
async function writeOutputThroughPager(
  output_text,
  pager_command,
  pager_arguments,
  use_shell,
) {
  const pager_process = spawn(pager_command, pager_arguments, {
    shell: use_shell,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  const close_promise = once(pager_process, 'close');
  const error_promise = once(pager_process, 'error').then(([error]) => {
    throw error;
  });

  await writeToPagerInput(pager_process.stdin, output_text);

  const [exit_code, signal_code] = await Promise.race([
    close_promise,
    error_promise,
  ]);

  if (exit_code === 0) {
    return;
  }

  if (signal_code) {
    throw new Error(`Pager exited with signal "${signal_code}".`);
  }

  throw new Error(`Pager exited with code ${exit_code}.`);
}

/**
 * @param {NodeJS.WritableStream} pager_input
 * @param {string} output_text
 * @returns {Promise<void>}
 */
function writeToPagerInput(pager_input, output_text) {
  return new Promise((resolve, reject) => {
    pager_input.once('error', (error) => {
      if (isBrokenPipe(error)) {
        resolve();

        return;
      }

      reject(error);
    });
    pager_input.end(output_text, 'utf8', resolve);
  });
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
function isBrokenPipe(error) {
  return error instanceof Error && 'code' in error && error.code === 'EPIPE';
}
