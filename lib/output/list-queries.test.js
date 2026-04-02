import { expect, it } from 'vitest';

import { listQueries } from './list-queries.js';

it('lists stored queries in stable name order', () => {
  const query_list = listQueries({
    'ready-tasks': {
      description: 'Show tasks that are ready to start.',
      where: '$class=task and status=ready',
    },
    'active-plans': {
      where: '$class=plan and status=active',
    },
  });

  expect(query_list).toEqual([
    {
      name: 'active-plans',
      where: '$class=plan and status=active',
    },
    {
      name: 'ready-tasks',
      description: 'Show tasks that are ready to start.',
      where: '$class=task and status=ready',
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
