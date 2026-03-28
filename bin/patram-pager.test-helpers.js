import { createIoContext } from './patram.test-helpers.js';

/**
 * Pager test fixtures.
 *
 * Provides paged IO doubles for tests that exercise interactive output
 * behavior.
 *
 * Kind: support
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * @patram
 * @see {@link ./patram.test-helpers.js}
 * @see {@link ../lib/output/command-output.js}
 */

/**
 * @returns {{ paged_output_chunks: string[], stderr: { write(chunk: string): boolean }, stderr_chunks: string[], stdout: { isTTY: boolean, write(chunk: string): boolean }, stdout_chunks: string[], write_paged_output(output_text: string): Promise<void> }}
 */
export function createPagedIoContext() {
  const io_context = createIoContext(true);
  /** @type {string[]} */
  const paged_output_chunks = [];

  return {
    ...io_context,
    paged_output_chunks,
    async write_paged_output(output_text) {
      paged_output_chunks.push(output_text);
    },
  };
}
