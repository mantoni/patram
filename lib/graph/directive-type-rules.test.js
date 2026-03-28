import { expect, it } from 'vitest';

import {
  formatQuotedList,
  getInvalidTypeMessage,
  isDirectiveValueValid,
} from './directive-type-rules.js';

it('validates supported directive value types', () => {
  expect(isDirectiveValueValid({ type: 'string' }, '')).toBe(false);
  expect(isDirectiveValueValid({ type: 'string' }, 'active')).toBe(true);
  expect(isDirectiveValueValid({ type: 'integer' }, '42')).toBe(true);
  expect(isDirectiveValueValid({ type: 'integer' }, '4.2')).toBe(false);
  expect(isDirectiveValueValid({ type: 'path' }, 'docs/plans/v0/plan.md')).toBe(
    true,
  );
  expect(isDirectiveValueValid({ type: 'path' }, 'https://example.com')).toBe(
    false,
  );
  expect(isDirectiveValueValid({ type: 'glob' }, '**/*.md')).toBe(true);
});

it('validates real calendar dates and date-times', () => {
  expect(isDirectiveValueValid({ type: 'date' }, '2026-03-24')).toBe(true);
  expect(isDirectiveValueValid({ type: 'date' }, '2026-13-01')).toBe(false);
  expect(isDirectiveValueValid({ type: 'date' }, '2026-02-30')).toBe(false);
  expect(isDirectiveValueValid({ type: 'date_time' }, '2026-03-24 14:30')).toBe(
    true,
  );
  expect(isDirectiveValueValid({ type: 'date_time' }, '2026-03-24T14:30')).toBe(
    false,
  );
  expect(isDirectiveValueValid({ type: 'date_time' }, '2026-03-24 24:00')).toBe(
    false,
  );
  expect(isDirectiveValueValid({ type: 'date_time' }, '2026-02-30 14:30')).toBe(
    false,
  );
});

it('formats directive type messages and enum lists', () => {
  expect(getInvalidTypeMessage('status', 'string')).toBe(
    'Directive "status" must be a non-empty string.',
  );
  expect(getInvalidTypeMessage('priority', 'integer')).toBe(
    'Directive "priority" must be a base-10 integer.',
  );
  expect(getInvalidTypeMessage('tracked_in', 'path')).toBe(
    'Directive "tracked_in" must be a path-like string.',
  );
  expect(getInvalidTypeMessage('include', 'glob')).toBe(
    'Directive "include" must be a non-empty glob string.',
  );
  expect(getInvalidTypeMessage('due_on', 'date')).toBe(
    'Directive "due_on" must use YYYY-MM-DD.',
  );
  expect(getInvalidTypeMessage('scheduled_at', 'date_time')).toBe(
    'Directive "scheduled_at" must use YYYY-MM-DD HH:MM.',
  );
  expect(formatQuotedList(['pending', 'ready', 'blocked'])).toBe(
    '"pending", "ready", "blocked"',
  );
});

it('throws for unsupported directive types', () => {
  expect(() =>
    isDirectiveValueValid(
      /** @type {any} */ ({ type: 'unsupported' }),
      'value',
    ),
  ).toThrow('Unsupported directive type "unsupported".');
  expect(() =>
    getInvalidTypeMessage('status', /** @type {any} */ ('unsupported')),
  ).toThrow('Unsupported directive type.');
});
