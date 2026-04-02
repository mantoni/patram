import { expect, it } from 'vitest';

import { createClaim } from '../parse/claim-helpers.js';
import {
  resolveTargetReference,
  setCanonicalPath,
} from './build-graph-identity.js';

it('resolves path targets through promoted document references', () => {
  const directive_claim = createClaim('docs/tasks/example.md', 1, 'directive', {
    name: 'tracked_in',
    parser: 'markdown',
    value: '../plans/v0/plan.md',
  });

  expect(
    resolveTargetReference(
      'document',
      'path',
      directive_claim,
      new Map(),
      new Map([
        [
          'docs/plans/v0/plan.md',
          {
            class_name: 'plan',
            id: 'plan:v0-plan',
            key: 'v0-plan',
            path: 'docs/plans/v0/plan.md',
          },
        ],
      ]),
      new Set(['docs/plans/v0/plan.md']),
    ),
  ).toEqual({
    class_name: 'plan',
    key: 'v0-plan',
    path: 'docs/plans/v0/plan.md',
  });
});

it('assigns canonical paths once and rejects conflicting values', () => {
  const graph_node = {
    identity: {
      class_name: 'document',
      id: 'doc:docs/tasks/example.md',
    },
    metadata: {},
  };

  setCanonicalPath(graph_node, undefined);
  setCanonicalPath(graph_node, 'docs/tasks/example.md');

  expect(graph_node).toEqual({
    identity: {
      class_name: 'document',
      id: 'doc:docs/tasks/example.md',
      path: 'docs/tasks/example.md',
    },
    metadata: {},
  });
  expect(() => {
    setCanonicalPath(graph_node, 'docs/tasks/other.md');
  }).toThrow(
    'Node "doc:docs/tasks/example.md" maps to multiple canonical paths.',
  );
});
