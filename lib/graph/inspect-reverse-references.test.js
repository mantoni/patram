/**
 * @import { BuildGraphResult } from './build-graph.types.ts';
 * @import { PatramRepoConfig } from '../config/load-patram-config.types.ts';
 */

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { expect, it } from 'vitest';

import { inspectReverseReferences } from './inspect-reverse-references.js';
import {
  createDecisionNode,
  createGraphEdge,
  createReconcileNode,
  createResumeNode,
  createTaskNode,
} from './reverse-reference-test-helpers.js';

it('collects incoming edges for a canonical target and groups them by relation', () => {
  expect(
    inspectReverseReferences(
      createGraph(),
      'docs/decisions/query-language.md',
      createRepoConfig(),
      undefined,
    ),
  ).toEqual(createExpectedIncomingInspection());
});

it('filters incoming source nodes with Cypher predicates', () => {
  expect(
    inspectReverseReferences(
      createGraph(),
      'docs/decisions/query-language.md',
      createRepoConfig(),
      'MATCH (n:Document) RETURN n',
    ),
  ).toEqual(createExpectedDocumentOnlyInspection());
});

it('returns where-clause diagnostics without changing the target resolution', () => {
  expect(
    inspectReverseReferences(
      createGraph(),
      'docs/decisions/query-language.md',
      undefined,
      'title:bad',
    ),
  ).toEqual({
    diagnostics: [
      expect.objectContaining({
        code: 'query.invalid',
      }),
    ],
    incoming: {},
    node: createDecisionNode(),
  });
});

it('falls back to a path-backed target and skips missing incoming source nodes', () => {
  expect(
    inspectReverseReferences(
      createFallbackGraph(),
      'docs/missing.md',
      undefined,
      undefined,
    ),
  ).toEqual({
    diagnostics: [],
    incoming: {
      decided_by: [createArrayClassNode(), createDefaultClassNode()],
    },
    node: {
      identity: {
        class_name: 'document',
        id: 'doc:docs/missing.md',
        path: 'docs/missing.md',
      },
      metadata: {
        title: 'docs/missing.md',
      },
    },
  });
});

/**
 * @returns {BuildGraphResult}
 */
function createGraph() {
  return {
    document_path_ids: {
      'docs/decisions/query-language.md': 'decision:query-language',
    },
    edges: [
      createGraphEdge(
        'edge:1',
        'doc:lib/reconcile.js',
        'lib/reconcile.js',
        'decided_by',
        'decision:query-language',
      ),
      createGraphEdge(
        'edge:2',
        'doc:lib/resume.js',
        'lib/resume.js',
        'decided_by',
        'decision:query-language',
      ),
      createGraphEdge(
        'edge:3',
        'task:reverse-reference-inspection',
        'docs/tasks/v0/reverse-reference-inspection.md',
        'implements',
        'decision:query-language',
      ),
      createGraphEdge(
        'edge:4',
        'doc:lib/other.js',
        'lib/other.js',
        'decided_by',
        'decision:other',
      ),
    ],
    nodes: createGraphNodes(),
  };
}

/**
 * @returns {BuildGraphResult}
 */
function createFallbackGraph() {
  return {
    edges: [
      createGraphEdge(
        'edge:1',
        'doc:lib/array-class.js',
        'lib/array-class.js',
        'decided_by',
        'doc:docs/missing.md',
      ),
      createGraphEdge(
        'edge:2',
        'doc:lib/default-class.js',
        'lib/default-class.js',
        'decided_by',
        'doc:docs/missing.md',
      ),
      createGraphEdge(
        'edge:3',
        'doc:lib/missing-source.js',
        'lib/missing-source.js',
        'decided_by',
        'doc:docs/missing.md',
      ),
    ],
    nodes: {
      'doc:lib/array-class.js': createArrayClassNode(),
      'doc:lib/default-class.js': createDefaultClassNode(),
    },
  };
}

/**
 * @returns {PatramRepoConfig}
 */
function createRepoConfig() {
  return {
    fields: {
      status: {
        type: 'string',
      },
    },
    classes: {
      document: {
        builtin: true,
        label: 'Document',
      },
    },
    include: [],
    queries: {},
  };
}

function createExpectedIncomingInspection() {
  return {
    diagnostics: [],
    incoming: {
      decided_by: [createReconcileNode(), createResumeNode()],
      implements: [createTaskNode()],
    },
    node: createDecisionNode(),
  };
}

function createExpectedDocumentOnlyInspection() {
  return {
    diagnostics: [],
    incoming: {
      decided_by: [createReconcileNode(), createResumeNode()],
    },
    node: createDecisionNode(),
  };
}

function createGraphNodes() {
  return {
    'decision:other': createOtherDecisionNode(),
    'decision:query-language': createDecisionNode(),
    'doc:lib/other.js': createOtherDocumentNode(),
    'doc:lib/reconcile.js': createReconcileNode(),
    'doc:lib/resume.js': createResumeNode(),
    'task:reverse-reference-inspection': createTaskNode(),
  };
}

function createOtherDecisionNode() {
  return {
    $class: 'decision',
    $id: 'decision:other',
    $path: 'docs/decisions/other.md',
    id: 'decision:other',
    path: 'docs/decisions/other.md',
    title: 'Other Decision',
  };
}

function createOtherDocumentNode() {
  return {
    $class: 'document',
    $id: 'doc:lib/other.js',
    $path: 'lib/other.js',
    id: 'doc:lib/other.js',
    path: 'lib/other.js',
    title: 'Other entrypoint.',
  };
}

function createArrayClassNode() {
  return /** @type {BuildGraphResult['nodes'][string]} */ (
    /** @type {unknown} */ ({
      $class: ['document'],
      $id: 'doc:lib/array-class.js',
      $path: 'lib/array-class.js',
      id: 'doc:lib/array-class.js',
      path: 'lib/array-class.js',
      title: 'Array class node.',
    })
  );
}

function createDefaultClassNode() {
  return {
    $id: 'doc:lib/default-class.js',
    $path: 'lib/default-class.js',
    id: 'doc:lib/default-class.js',
    path: 'lib/default-class.js',
    title: 'Default class node.',
  };
}
