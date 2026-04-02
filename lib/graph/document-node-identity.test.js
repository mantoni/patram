/**
 * @import { PatramConfig } from '../config/patram-config.types.ts';
 */
import { expect, it } from 'vitest';

import { createClaim } from '../parse/claim-helpers.js';
import {
  collectDocumentEntityKeys,
  collectDocumentNodeReferences,
  normalizeRepoRelativePath,
  resolveDocumentNodeId,
} from './document-node-identity.js';

it('collects semantic entity keys from claim-value identities', () => {
  const document_entity_keys = collectDocumentEntityKeys(
    createClaimValueIdentityConfig(),
    [
      createClaim('docs\\plans\\v0\\example.md', 1, 'directive', {
        name: 'plan',
        parser: 'markdown',
        value: 'example-plan',
      }),
    ],
  );

  expect(document_entity_keys).toEqual(
    new Map([['plan:docs/plans/v0/example.md', 'example-plan']]),
  );
  expect(normalizeRepoRelativePath('docs\\plans\\v0\\example.md')).toBe(
    'docs/plans/v0/example.md',
  );
});

it('rejects conflicting claim-value identities for one document', () => {
  expect(() => {
    collectDocumentEntityKeys(createClaimValueIdentityConfig(), [
      createClaim('docs/plans/v0/example.md', 1, 'directive', {
        name: 'plan',
        parser: 'markdown',
        value: 'example-plan',
      }),
      createClaim('docs/plans/v0/example.md', 2, 'directive', {
        name: 'plan',
        parser: 'markdown',
        value: 'different-plan',
      }),
    ]);
  }).toThrow(
    'Document "docs/plans/v0/example.md" defines multiple semantic ids for class "plan".',
  );
});

it('collects canonical node references for claim-value identities', () => {
  const document_node_references = collectDocumentNodeReferences(
    createClaimValueIdentityConfig(),
    [
      createClaim('docs/plans/v0/example.md', 1, 'directive', {
        name: 'plan',
        parser: 'markdown',
        value: 'example-plan',
      }),
    ],
  );

  expect(document_node_references.get('docs/plans/v0/example.md')).toEqual({
    class_name: 'plan',
    id: 'plan:example-plan',
    key: 'example-plan',
    path: 'docs/plans/v0/example.md',
  });
});

it('collects canonical node references for document-path identities', () => {
  const document_node_references = collectDocumentNodeReferences(
    createDocumentPathIdentityConfig(),
    [
      createClaim('docs/decisions/query-language.md', 1, 'directive', {
        name: 'status',
        parser: 'markdown',
        value: 'accepted',
      }),
    ],
  );

  expect(
    document_node_references.get('docs/decisions/query-language.md'),
  ).toEqual({
    class_name: 'decision',
    id: 'decision:query-language',
    key: 'query-language',
    path: 'docs/decisions/query-language.md',
  });
  expect(resolveDocumentNodeId(undefined, 'docs/reference/example.md')).toBe(
    'doc:docs/reference/example.md',
  );
});

it('rejects conflicting semantic classes for one document', () => {
  expect(() => {
    collectDocumentNodeReferences(createConflictingIdentityConfig(), [
      createClaim('docs/work/example.md', 1, 'directive', {
        name: 'plan',
        parser: 'markdown',
        value: 'example-plan',
      }),
      createClaim('docs/work/example.md', 2, 'directive', {
        name: 'decision',
        parser: 'markdown',
        value: 'example-decision',
      }),
    ]);
  }).toThrow(
    'Document "docs/work/example.md" defines multiple semantic classes.',
  );
});

it('rejects non-string values for claim-value identities', () => {
  expect(() => {
    collectDocumentEntityKeys(createClaimValueIdentityConfig(), [
      createClaim('docs/plans/v0/example.md', 1, 'directive', {
        name: 'plan',
        parser: 'markdown',
        value: {
          target: './other.md',
          text: 'other',
        },
      }),
    ]);
  }).toThrow(
    'Claim "claim:doc:docs/plans/v0/example.md:1" does not carry a string value.',
  );
});

it('ignores non-directive and unmapped claims when collecting node references', () => {
  const document_node_references = collectDocumentNodeReferences(
    createClaimValueIdentityConfig(),
    [
      createClaim('docs/plans/v0/example.md', 1, 'markdown.link', {
        value: {
          target: './guide.md',
          text: 'guide',
        },
      }),
      createClaim('docs/plans/v0/example.md', 2, 'directive', {
        value: 'plan',
      }),
      createClaim('docs/plans/v0/example.md', 3, 'directive', {
        name: 'status',
        parser: 'markdown',
        value: 'active',
      }),
    ],
  );

  expect(document_node_references.get('docs/plans/v0/example.md')).toEqual({
    class_name: 'document',
    id: 'doc:docs/plans/v0/example.md',
    key: 'docs/plans/v0/example.md',
    path: 'docs/plans/v0/example.md',
  });
});

/**
 * @returns {PatramConfig}
 */
function createClaimValueIdentityConfig() {
  return {
    classes: {
      document: {
        builtin: true,
      },
      plan: {
        identity: {
          claim_types: ['markdown.directive.plan'],
          type: 'claim_value',
        },
        label: 'Plan',
      },
    },
    mappings: {},
    relations: {},
  };
}

/**
 * @returns {PatramConfig}
 */
function createDocumentPathIdentityConfig() {
  return {
    classes: {
      decision: {
        identity: {
          type: 'document_path',
        },
        label: 'Decision',
        schema: {
          fields: {},
          document_path_class: 'decision_docs',
        },
      },
      document: {
        builtin: true,
      },
    },
    mappings: {},
    path_classes: {
      decision_docs: {
        prefixes: ['docs/decisions/'],
      },
    },
    relations: {},
  };
}

/**
 * @returns {PatramConfig}
 */
function createConflictingIdentityConfig() {
  return {
    classes: {
      decision: {
        identity: {
          claim_types: ['markdown.directive.decision'],
          type: 'claim_value',
        },
        label: 'Decision',
      },
      document: {
        builtin: true,
      },
      plan: {
        identity: {
          claim_types: ['markdown.directive.plan'],
          type: 'claim_value',
        },
        label: 'Plan',
      },
    },
    mappings: {},
    relations: {},
  };
}
