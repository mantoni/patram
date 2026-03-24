/**
 * @import { FieldDiscoveryResult } from './discover-fields.types.ts';
 */

import { expect, it } from 'vitest';

import { renderFieldDiscovery } from './render-field-discovery.js';
import { stripAnsi } from '../bin/patram.test-helpers.js';

/** @type {FieldDiscoveryResult} */
const DISCOVERY_RESULT = {
  fields: [
    {
      confidence: 0.92,
      conflicting_evidence: [
        {
          column: 1,
          line: 4,
          path: 'docs/decisions/beta.md',
          value: 'freeform',
        },
      ],
      evidence_references: [
        {
          column: 1,
          line: 3,
          path: 'docs/tasks/alpha.md',
          value: 'docs/decisions/beta.md',
        },
        {
          column: 1,
          line: 7,
          path: 'docs/tasks/bravo.md',
          value: 'docs/decisions/beta.md',
        },
      ],
      likely_class_usage: {
        classes: ['decision', 'task'],
      },
      likely_multiplicity: {
        confidence: 1,
        name: 'single',
      },
      likely_type: {
        confidence: 0.86,
        name: 'path',
      },
      name: 'reference',
    },
  ],
  summary: {
    claim_count: 2,
    count: 1,
    source_file_count: 2,
  },
};

const EXPECTED_PLAIN_OUTPUT = [
  'Field discovery',
  'Found 1 suggested fields from 2 source files.',
  '',
  'reference',
  '  likely type: path',
  '  likely multiplicity: single',
  '  likely class usage: decision, task',
  '  confidence: 0.92',
  '  evidence:',
  '    docs/tasks/alpha.md:3:1 "docs/decisions/beta.md"',
  '    docs/tasks/bravo.md:7:1 "docs/decisions/beta.md"',
  '  conflicting evidence:',
  '    docs/decisions/beta.md:4:1 "freeform"',
].join('\n');

const EXPECTED_JSON_OUTPUT =
  [
    '{',
    '  "fields": [',
    '    {',
    '      "confidence": 0.92,',
    '      "conflicting_evidence": [',
    '        {',
    '          "column": 1,',
    '          "line": 4,',
    '          "path": "docs/decisions/beta.md",',
    '          "value": "freeform"',
    '        }',
    '      ],',
    '      "evidence_references": [',
    '        {',
    '          "column": 1,',
    '          "line": 3,',
    '          "path": "docs/tasks/alpha.md",',
    '          "value": "docs/decisions/beta.md"',
    '        },',
    '        {',
    '          "column": 1,',
    '          "line": 7,',
    '          "path": "docs/tasks/bravo.md",',
    '          "value": "docs/decisions/beta.md"',
    '        }',
    '      ],',
    '      "likely_class_usage": {',
    '        "classes": [',
    '          "decision",',
    '          "task"',
    '        ]',
    '      },',
    '      "likely_multiplicity": {',
    '        "confidence": 1,',
    '        "name": "single"',
    '      },',
    '      "likely_type": {',
    '        "confidence": 0.86,',
    '        "name": "path"',
    '      },',
    '      "name": "reference"',
    '    }',
    '  ],',
    '  "summary": {',
    '    "claim_count": 2,',
    '    "count": 1,',
    '    "source_file_count": 2',
    '  }',
    '}',
  ].join('\n') + '\n';

it('renders field discovery in plain text', () => {
  expect(
    renderFieldDiscovery(DISCOVERY_RESULT, {
      color_enabled: false,
      renderer_name: 'plain',
    }),
  ).toBe(EXPECTED_PLAIN_OUTPUT + '\n');
});

it('renders field discovery as json', () => {
  expect(
    renderFieldDiscovery(DISCOVERY_RESULT, {
      color_enabled: false,
      renderer_name: 'json',
    }),
  ).toBe(EXPECTED_JSON_OUTPUT);
});

it('renders field discovery in rich text', () => {
  const rich_output = renderFieldDiscovery(DISCOVERY_RESULT, {
    color_enabled: true,
    renderer_name: 'rich',
  });

  expect(stripAnsi(rich_output)).toBe(EXPECTED_PLAIN_OUTPUT + '\n');
  expect(rich_output).toContain('\u001B[');
});

it('renders an empty discovery result', () => {
  expect(
    renderFieldDiscovery(
      {
        fields: [],
        summary: {
          claim_count: 0,
          count: 0,
          source_file_count: 0,
        },
      },
      {
        color_enabled: false,
        renderer_name: 'plain',
      },
    ),
  ).toBe(
    'Field discovery\n' +
      'Found 0 suggested fields from 0 source files.\n' +
      '\n' +
      'No field candidates discovered.\n',
  );
});
