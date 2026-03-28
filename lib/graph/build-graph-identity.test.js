import { expect, it } from 'vitest';

import { createClaim } from '../parse/claim-helpers.js';
import {
  resolveNodeKey,
  resolveTargetReference,
  setCanonicalPath,
} from './build-graph-identity.js';

it('resolves node keys from document paths, string values, and promoted ids', () => {
  const value_claim = createClaim('docs/tasks/example.md', 1, 'directive', {
    name: 'slug',
    parser: 'markdown',
    value: 'task:example',
  });

  expect(
    resolveNodeKey(
      { class: 'document', field: 'title' },
      value_claim,
      new Map(),
    ),
  ).toBe('docs/tasks/example.md');
  expect(
    resolveNodeKey(
      { class: 'task', field: '$id', key: 'value' },
      value_claim,
      new Map(),
    ),
  ).toBe('task:example');
  expect(
    resolveNodeKey(
      { class: 'task', field: '$id' },
      value_claim,
      new Map([['task:docs/tasks/example.md', 'task:canonical']]),
    ),
  ).toBe('task:canonical');
  expect(
    resolveNodeKey({ class: 'task', field: '$id' }, value_claim, new Map()),
  ).toBe('docs/tasks/example.md');
});

it('resolves value targets for document and non-document classes', () => {
  const value_claim = createClaim('docs/tasks/example.md', 1, 'directive', {
    name: 'defined_by',
    parser: 'markdown',
    value: 'docs/terms/task.md',
  });

  expect(
    resolveTargetReference(
      'document',
      'value',
      value_claim,
      new Map(),
      new Map(),
      new Set(),
    ),
  ).toEqual({
    class_name: 'document',
    key: 'docs/terms/task.md',
    path: 'docs/terms/task.md',
  });
  expect(
    resolveTargetReference(
      'term',
      'value',
      value_claim,
      new Map(),
      new Map(),
      new Set(),
    ),
  ).toEqual({
    class_name: 'term',
    key: 'docs/terms/task.md',
    path: 'docs/tasks/example.md',
  });
});

it('resolves promoted path targets for document and semantic classes', () => {
  const { directive_claim, document_node_references } =
    createPromotedTargetFixture();

  expect(
    resolveTargetReference(
      'document',
      'path',
      directive_claim,
      new Map(),
      document_node_references,
      new Set(['docs/plans/v0/plan.md']),
    ),
  ).toEqual({
    class_name: 'plan',
    key: 'v0-plan',
    path: 'docs/plans/v0/plan.md',
  });
});

it('resolves relative path targets through semantic ids', () => {
  const link_claim = createClaim('docs/tasks/example.md', 2, 'markdown.link', {
    value: {
      target: '../plans/v0/plan.md',
      text: 'plan',
    },
  });

  expect(
    resolveTargetReference(
      'plan',
      'path',
      link_claim,
      new Map([['plan:docs/plans/v0/plan.md', 'plan:semantic']]),
      new Map(),
      new Set(),
    ),
  ).toEqual({
    class_name: 'plan',
    key: 'plan:semantic',
    path: 'docs/plans/v0/plan.md',
  });
});

it('resolves relative path targets through document fallbacks', () => {
  const link_claim = createClaim('docs/tasks/example.md', 2, 'markdown.link', {
    value: {
      target: '../plans/v0/plan.md',
      text: 'plan',
    },
  });

  expect(
    resolveTargetReference(
      'document',
      'path',
      link_claim,
      new Map(),
      new Map(),
      new Set(),
    ),
  ).toEqual({
    class_name: 'document',
    key: 'docs/plans/v0/plan.md',
    path: 'docs/plans/v0/plan.md',
  });
});

it('assigns canonical paths once and rejects conflicting values', () => {
  const graph_node = {
    id: 'doc:docs/tasks/example.md',
  };

  setCanonicalPath(graph_node, undefined);
  setCanonicalPath(graph_node, 'docs/tasks/example.md');

  expect(graph_node).toEqual({
    $path: 'docs/tasks/example.md',
    id: 'doc:docs/tasks/example.md',
    path: 'docs/tasks/example.md',
  });
  expect(() => {
    setCanonicalPath(graph_node, 'docs/tasks/other.md');
  }).toThrow(
    'Node "doc:docs/tasks/example.md" maps to multiple canonical paths.',
  );
});

function createPromotedTargetFixture() {
  return {
    directive_claim: createClaim('docs/tasks/example.md', 1, 'directive', {
      name: 'tracked_in',
      parser: 'markdown',
      value: 'docs/plans/v0/plan.md',
    }),
    document_node_references: new Map([
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
  };
}
