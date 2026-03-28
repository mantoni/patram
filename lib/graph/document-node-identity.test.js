/**
 * @import { MappingDefinition } from '../config/patram-config.types.ts';
 */
/* eslint-disable max-lines-per-function */
import { expect, it } from 'vitest';

import { createClaim } from '../parse/claim-helpers.js';
import {
  collectDocumentEntityKeys,
  collectDocumentNodeReferences,
  normalizeRepoRelativePath,
  resolveDocumentNodeId,
} from './document-node-identity.js';

it('collects semantic entity keys from value-backed document mappings', () => {
  const document_entity_keys = collectDocumentEntityKeys(
    createEntityKeyMappings(),
    [
      createClaim('docs\\plans\\v0\\example.md', 1, 'directive', {
        name: 'id',
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

it('rejects conflicting semantic entity ids for one document', () => {
  expect(() => {
    collectDocumentEntityKeys(createEntityKeyMappings(), [
      createClaim('docs/plans/v0/example.md', 1, 'directive', {
        name: 'id',
        parser: 'markdown',
        value: 'example-plan',
      }),
      createClaim('docs/plans/v0/example.md', 2, 'directive', {
        name: 'id',
        parser: 'markdown',
        value: 'different-plan',
      }),
    ]);
  }).toThrow('Document "docs/plans/v0/example.md" defines multiple plan ids.');
});

it('applies pending semantic ids after a document kind is known', () => {
  const document_node_references = collectDocumentNodeReferences(
    createDocumentNodeMappings(),
    [
      createClaim('docs/plans/v0/example.md', 1, 'directive', {
        name: 'id',
        parser: 'markdown',
        value: 'example-plan',
      }),
      createClaim('docs/plans/v0/example.md', 2, 'directive', {
        name: 'kind',
        parser: 'markdown',
        value: 'plan',
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

it('keeps document ids when kind resolves back to the document class', () => {
  const document_node_references = collectDocumentNodeReferences(
    createDocumentNodeMappings(),
    [
      createClaim('docs/reference/example.md', 1, 'directive', {
        name: 'id',
        parser: 'markdown',
        value: 'ignored-id',
      }),
      createClaim('docs/reference/example.md', 2, 'directive', {
        name: 'kind',
        parser: 'markdown',
        value: 'document',
      }),
    ],
  );

  expect(document_node_references.get('docs/reference/example.md')).toEqual({
    class_name: 'document',
    id: 'doc:docs/reference/example.md',
    key: 'docs/reference/example.md',
    path: 'docs/reference/example.md',
  });
  expect(resolveDocumentNodeId(undefined, 'docs/reference/example.md')).toBe(
    'doc:docs/reference/example.md',
  );
});

it('allows duplicate pending ids with the same value before class assignment', () => {
  const document_node_references = collectDocumentNodeReferences(
    createDocumentNodeMappings(),
    [
      createClaim('docs/plans/v0/example.md', 1, 'directive', {
        name: 'id',
        parser: 'markdown',
        value: 'example-plan',
      }),
      createClaim('docs/plans/v0/example.md', 2, 'directive', {
        name: 'id',
        parser: 'markdown',
        value: 'example-plan',
      }),
      createClaim('docs/plans/v0/example.md', 3, 'directive', {
        name: 'kind',
        parser: 'markdown',
        value: 'plan',
      }),
    ],
  );

  expect(document_node_references.get('docs/plans/v0/example.md')?.id).toBe(
    'plan:example-plan',
  );
});

it('rejects conflicting class and id assignments for one document', () => {
  expect(() => {
    collectDocumentNodeReferences(createDocumentNodeMappings(), [
      createClaim('docs/work/example.md', 1, 'directive', {
        name: 'kind',
        parser: 'markdown',
        value: 'plan',
      }),
      createClaim('docs/work/example.md', 2, 'directive', {
        name: 'kind',
        parser: 'markdown',
        value: 'decision',
      }),
    ]);
  }).toThrow(
    'Document "docs/work/example.md" defines multiple semantic classes.',
  );

  expect(() => {
    collectDocumentNodeReferences(createDocumentNodeMappings(), [
      createClaim('docs/work/example.md', 1, 'directive', {
        name: 'kind',
        parser: 'markdown',
        value: 'plan',
      }),
      createClaim('docs/work/example.md', 2, 'directive', {
        name: 'id',
        parser: 'markdown',
        value: 'example-plan',
      }),
      createClaim('docs/work/example.md', 3, 'directive', {
        name: 'id',
        parser: 'markdown',
        value: 'different-plan',
      }),
    ]);
  }).toThrow('Document "docs/work/example.md" defines multiple semantic ids.');

  expect(() => {
    collectDocumentNodeReferences(createDocumentNodeMappings(), [
      createClaim('docs/work/example.md', 1, 'directive', {
        name: 'id',
        parser: 'markdown',
        value: 'example-plan',
      }),
      createClaim('docs/work/example.md', 2, 'directive', {
        name: 'id',
        parser: 'markdown',
        value: 'different-plan',
      }),
    ]);
  }).toThrow('Document "docs/work/example.md" defines multiple semantic ids.');
});

it('rejects non-string values for semantic document mappings', () => {
  expect(() => {
    collectDocumentEntityKeys(createEntityKeyMappings(), [
      createClaim('docs/plans/v0/example.md', 1, 'directive', {
        name: 'id',
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

it('ignores non-directive and unmapped directive claims when collecting node references', () => {
  const document_node_references = collectDocumentNodeReferences(
    createDocumentNodeMappings(),
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
 * @returns {Record<string, MappingDefinition>}
 */
function createEntityKeyMappings() {
  return {
    'markdown.directive.id': {
      node: {
        class: 'plan',
        field: '$id',
        key: 'value',
      },
    },
    'markdown.directive.kind': {
      node: {
        class: 'plan',
        field: '$class',
      },
    },
  };
}

/**
 * @returns {Record<string, MappingDefinition>}
 */
function createDocumentNodeMappings() {
  return {
    'markdown.directive.id': {
      node: {
        class: 'document',
        field: '$id',
        key: 'value',
      },
    },
    'markdown.directive.kind': {
      node: {
        class: 'document',
        field: '$class',
      },
    },
  };
}
