import { expect, it } from 'vitest';

import { formatNodeHeader } from './format-node-header.js';

it('formats node headers with a path when one is available', () => {
  expect(
    formatNodeHeader({
      derived_summary: undefined,
      fields: {},
      id: 'doc:docs/tasks/task.md',
      kind: 'node',
      node_kind: 'task',
      path: 'docs/tasks/task.md',
      title: 'Task',
      visible_fields: [],
    }),
  ).toBe('task docs/tasks/task.md');
});

it('formats node headers from the semantic key when no path is available', () => {
  expect(
    formatNodeHeader({
      derived_summary: undefined,
      fields: {},
      id: 'command:query',
      kind: 'node',
      node_kind: 'command',
      title: 'Query',
      visible_fields: [],
    }),
  ).toBe('command query');
});

it('keeps bare ids when they do not use a semantic prefix', () => {
  expect(
    formatNodeHeader({
      derived_summary: undefined,
      fields: {},
      id: 'standalone',
      kind: 'node',
      node_kind: 'document',
      title: 'Standalone',
      visible_fields: [],
    }),
  ).toBe('document standalone');
});
