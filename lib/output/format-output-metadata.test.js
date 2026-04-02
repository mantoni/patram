import { expect, it } from 'vitest';

import {
  formatOutputNodeStoredMetadataRow,
  formatResolvedLinkStoredMetadataRow,
} from './format-output-metadata.js';

it('returns undefined when no visible metadata fields exist', () => {
  expect(
    formatOutputNodeStoredMetadataRow({
      fields: {},
      id: 'task:empty',
      kind: 'node',
      node_kind: 'task',
      title: 'Empty Task',
      visible_fields: [],
    }),
  ).toBeUndefined();
});

it('formats scalar and array metadata fields', () => {
  expect(
    formatResolvedLinkStoredMetadataRow({
      fields: {
        owners: ['max', 'ana'],
        status: 'active',
      },
      id: 'doc:docs/plans/example.md',
      kind: 'plan',
      title: 'Example Plan',
      visible_fields: [
        {
          name: 'status',
          value: 'active',
        },
        {
          name: 'owners',
          value: ['max', 'ana'],
        },
      ],
    }),
  ).toBe('status: active  owners: max, ana');
});
