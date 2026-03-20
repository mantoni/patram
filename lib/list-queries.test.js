import { expect, it } from 'vitest';

import { listQueries } from './list-queries.js';

it('lists stored queries in stable name order', () => {
  const query_list = listQueries({
    pending: {
      where: 'kind=task and status=pending',
    },
    blocked: {
      where: 'kind=task and status=blocked',
    },
  });

  expect(query_list).toEqual([
    {
      name: 'blocked',
      where: 'kind=task and status=blocked',
    },
    {
      name: 'pending',
      where: 'kind=task and status=pending',
    },
  ]);
});
