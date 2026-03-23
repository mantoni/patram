import { expect, it } from 'vitest';

import { main } from './patram-cli.js';

it('renders stored query explanations through the query command', async () => {
  /** @type {string[]} */
  const stderr_chunks = [];
  /** @type {string[]} */
  const stdout_chunks = [];
  const exit_code = await main(['query', 'pending', '--plain', '--explain'], {
    stderr: {
      write(chunk) {
        stderr_chunks.push(chunk);
        return true;
      },
    },
    stdout: {
      isTTY: false,
      write(chunk) {
        stdout_chunks.push(chunk);
        return true;
      },
    },
  });

  expect(exit_code).toBe(0);
  expect(stderr_chunks).toEqual([]);
  expect(stdout_chunks.join('')).toBe(
    'Query explanation\n' +
      'source: stored query "pending"\n' +
      'where: kind=task and status=pending\n' +
      'offset: 0\n' +
      'limit: 25\n' +
      '\n' +
      'clauses:\n' +
      '1. kind = task\n' +
      '2. status = pending\n',
  );
});

it('renders lint diagnostics for invalid nested traversal relations', async () => {
  /** @type {string[]} */
  const stderr_chunks = [];
  /** @type {string[]} */
  const stdout_chunks = [];
  const exit_code = await main(
    [
      'query',
      '--where',
      'kind=plan and none(in:tracked_typo, kind=task and status=pending)',
      '--plain',
      '--lint',
    ],
    {
      stderr: {
        write(chunk) {
          stderr_chunks.push(chunk);
          return true;
        },
      },
      stdout: {
        isTTY: false,
        write(chunk) {
          stdout_chunks.push(chunk);
          return true;
        },
      },
    },
  );

  expect(exit_code).toBe(1);
  expect(stdout_chunks).toEqual([]);
  expect(stderr_chunks.join('')).toBe(
    'file <query>\n' +
      '  1:20  error  Unknown relation "tracked_typo" in traversal clause.  query.unknown_relation\n' +
      '\n' +
      '✖ 1 problem (1 error, 0 warnings)\n',
  );
});
