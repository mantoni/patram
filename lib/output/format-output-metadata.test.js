import { expect, it } from 'vitest';

import { formatOutputNodeStoredMetadataRow } from './format-output-metadata.js';

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
    formatOutputNodeStoredMetadataRow({
      fields: {
        owners: ['max', 'ana'],
        status: 'active',
      },
      id: 'plan:example',
      kind: 'node',
      node_kind: 'plan',
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
