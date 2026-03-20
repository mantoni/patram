import { expect, it, vi } from 'vitest';

it('works', async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});

  await import('./patram.js');

  expect(console.log).toHaveBeenCalled();
});
