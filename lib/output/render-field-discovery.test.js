/**
 * @import { FieldDiscoveryResult } from '../scan/discover-fields.types.ts';
 */

import { expect, it } from 'vitest';

import { renderFieldDiscovery } from './render-field-discovery.js';
import { stripAnsi } from '../../bin/patram.test-helpers.js';

/** @type {FieldDiscoveryResult} */
const discovery_result = {
  fields: [
    {
      confidence: 0.92,
      conflicting_evidence: [],
      evidence_references: [
        {
          column: 1,
          line: 3,
          path: 'docs/tasks/alpha.md',
          value: 'docs/reference/terms/graph.md',
        },
      ],
      likely_multiplicity: {
        confidence: 1,
        name: 'single',
      },
      likely_on: {
        types: ['task'],
      },
      likely_to: {
        confidence: 1,
        type: 'term',
      },
      likely_type: {
        confidence: 1,
        name: 'ref',
      },
      name: 'uses_term',
    },
  ],
  summary: {
    claim_count: 1,
    count: 1,
    source_file_count: 1,
  },
};

const expected_plain_output = [
  'Field discovery',
  'Found 1 suggested fields from 1 source files.',
  '',
  'uses_term',
  '  likely type: ref',
  '  likely multiplicity: single',
  '  likely to: term',
  '  likely on: task',
  '  confidence: 0.92',
  '  evidence:',
  '    docs/tasks/alpha.md:3:1 "docs/reference/terms/graph.md"',
].join('\n');

it('renders field discovery in plain text', () => {
  expect(
    renderFieldDiscovery(discovery_result, {
      color_enabled: false,
      renderer_name: 'plain',
    }),
  ).toBe(`${expected_plain_output}\n`);
});

it('renders field discovery as json', () => {
  expect(
    JSON.parse(
      renderFieldDiscovery(discovery_result, {
        color_enabled: false,
        renderer_name: 'json',
      }),
    ),
  ).toEqual(discovery_result);
});

it('renders field discovery in rich text', () => {
  const rich_output = renderFieldDiscovery(discovery_result, {
    color_enabled: true,
    renderer_name: 'rich',
  });

  expect(stripAnsi(rich_output)).toBe(`${expected_plain_output}\n`);
  expect(rich_output).toContain('\u001B[');
});
