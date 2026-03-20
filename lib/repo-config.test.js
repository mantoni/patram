import { expect, it } from 'vitest';

import repo_config from '../.patram.json' with { type: 'json' };

it('indexes repo docs and defines the documented stored queries', () => {
  expect(repo_config).toEqual({
    include: ['docs/**/*.md'],
    queries: {
      pending: {
        where: 'kind=task and status=pending',
      },
      blocked: {
        where: 'kind=task and status=blocked',
      },
      'accepted-decisions': {
        where: 'kind=decision and status=accepted',
      },
    },
  });
});
