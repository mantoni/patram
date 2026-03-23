import { expect, it } from 'vitest';

import { listQueries } from './list-queries.js';

it('lists stored queries in stable name order', () => {
  const query_list = listQueries({
    'ready-tasks': {
      where: 'kind=task and status=ready',
    },
    'active-plans': {
      where: 'kind=plan and status=active',
    },
  });

  expect(query_list).toEqual([
    {
      name: 'active-plans',
      where: 'kind=plan and status=active',
    },
    {
      name: 'ready-tasks',
      where: 'kind=task and status=ready',
    },
  ]);
});
