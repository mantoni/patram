import { createIoContext } from './patram.test-helpers.js';

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
