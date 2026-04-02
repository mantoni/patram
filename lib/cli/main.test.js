import { expect, it } from 'vitest';

import { main } from './main.js';

it('renders stored query explanations through the query command', async () => {
  /** @type {string[]} */
  const stderr_chunks = [];
  /** @type {string[]} */
  const stdout_chunks = [];
  const exit_code = await main(
    ['query', 'ready-tasks', '--plain', '--explain'],
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

  expect(exit_code).toBe(0);
  expect(stderr_chunks).toEqual([]);
  expect(stdout_chunks.join('')).toBe(
    'Query explanation\n' +
      'source: stored query "ready-tasks"\n' +
      "where: MATCH (n:Task) WHERE n.status = 'ready' RETURN n\n" +
      'offset: 0\n' +
      'limit: 25\n' +
      '\n' +
      'expression:\n' +
      '1. $class = task\n' +
      '2. status = ready\n',
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
      '--cypher',
      "MATCH (n:Plan) WHERE NOT EXISTS { MATCH (task:Task)-[:TRACKED_TYPO]->(n) WHERE task.status = 'pending' } RETURN n",
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
  expect(stderr_chunks.join('')).toContain(
    'Unknown relation "tracked_typo" in traversal clause.',
  );
});
