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
