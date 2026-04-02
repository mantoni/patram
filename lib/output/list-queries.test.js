import { expect, it } from 'vitest';

import { listQueries } from './list-queries.js';

it('lists stored queries in stable name order', () => {
  const query_list = listQueries({
    'ready-tasks': {
      cypher: "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
      description: 'Show tasks that are ready to start.',
    },
    'active-plans': {
      cypher: "MATCH (n:Plan) WHERE n.status = 'active' RETURN n",
    },
  });

  expect(query_list).toEqual([
    {
      name: 'active-plans',
      where: "MATCH (n:Plan) WHERE n.status = 'active' RETURN n",
    },
    {
      name: 'ready-tasks',
      description: 'Show tasks that are ready to start.',
      where: "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
    },
  ]);
});

it('prefers cypher text and falls back to an empty string', () => {
  expect(
    listQueries({
      empty: {},
      pending: {
        cypher: "MATCH (n:Task) WHERE n.status = 'pending' RETURN n",
      },
    }),
  ).toEqual([
    {
      name: 'empty',
      where: '',
    },
    {
      name: 'pending',
      where: "MATCH (n:Task) WHERE n.status = 'pending' RETURN n",
    },
  ]);
});
