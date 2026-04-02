import { expect, it } from 'vitest';

import { parseCliArguments } from './parse-arguments.js';

it('parses cypher query arguments', () => {
  expect(
    parseCliArguments([
      'query',
      '--cypher',
      "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
    ]),
  ).toEqual({
    success: true,
    value: {
      kind: 'command',
      color_mode: 'auto',
      command_arguments: [
        '--cypher',
        "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
      ],
      command_name: 'query',
      output_mode: 'default',
    },
  });
});

it('parses cypher stored-query mutations', () => {
  expect(
    parseCliArguments([
      'queries',
      'add',
      'active-plans',
      '--cypher',
      "MATCH (n:Plan) WHERE n.status = 'active' RETURN n",
    ]),
  ).toEqual({
    success: true,
    value: {
      kind: 'command',
      color_mode: 'auto',
      command_arguments: [
        'add',
        'active-plans',
        '--cypher',
        "MATCH (n:Plan) WHERE n.status = 'active' RETURN n",
      ],
      command_name: 'queries',
      output_mode: 'default',
    },
  });
});

it('rejects mixed query modes', () => {
  expect(
    parseCliArguments(['query', 'pending', '--cypher', 'MATCH (n) RETURN n']),
  ).toEqual({
    success: false,
    error: {
      code: 'message',
      message: 'Query accepts either "--cypher" or a stored query name.',
    },
  });
});

it('rejects legacy where query arguments', () => {
  expect(parseCliArguments(['query', '--where', 'kind=task'])).toEqual({
    success: false,
    error: {
      code: 'option_not_valid_for_command',
      command_name: 'query',
      token: '--where',
    },
  });
  expect(
    parseCliArguments(['queries', 'add', 'ready', '--where', 'kind=task']),
  ).toEqual({
    success: false,
    error: {
      code: 'option_not_valid_for_command',
      command_name: 'queries',
      token: '--where',
    },
  });
  expect(
    parseCliArguments(['refs', 'docs/patram.md', '--where', '$class=document']),
  ).toEqual({
    success: false,
    error: {
      code: 'option_not_valid_for_command',
      command_name: 'refs',
      token: '--where',
    },
  });
});

it('rejects invalid cypher mutation invocations', () => {
  expect(parseCliArguments(['queries', 'add', 'test'])).toEqual({
    success: false,
    error: {
      code: 'message',
      message: 'Queries add requires "--cypher <query>".',
    },
  });
  expect(parseCliArguments(['queries', 'update', 'test'])).toEqual({
    success: false,
    error: {
      code: 'message',
      message:
        'Queries update requires at least one of "--name", "--cypher", or "--desc".',
    },
  });
});
