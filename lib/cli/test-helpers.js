export function createIoContext() {
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
