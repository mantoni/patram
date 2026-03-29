/**
 * @import { PatramClaim } from '../parse/parse-claims.types.ts';
 * @import { ParseClaimsInput } from '../parse/parse-claims.types.ts';
 * @import { PatramConfig } from '../config/patram-config.types.ts';
 */

import { expect, it } from 'vitest';

import { buildGraph } from './build-graph.js';
import { parseSourceFile } from '../parse/parse-claims.js';

it('emits relations from promoted document-backed semantic nodes', () => {
  const graph = buildGraph(
    createPromotedDocumentRelationConfig(),
    createPromotedDocumentRelationClaims(),
  );

  expect(graph.edges).toContainEqual({
    from: 'contract:release-flow',
    id: 'edge:1',
    origin: {
      column: 1,
      line: 5,
      path: 'docs/contracts/release-flow.md',
    },
    relation: 'decided_by',
    to: 'decision:review-gates',
  });
});

it('resolves path-based references to promoted document-backed nodes', () => {
  const graph = buildGraph(
    createPromotedDocumentRelationConfig(),
    createPromotedDocumentRelationClaims(),
  );

  expect(graph.edges).toContainEqual({
    from: 'plan:release-plan',
    id: 'edge:2',
    origin: {
      column: 1,
      line: 5,
      path: 'docs/plans/release-plan.md',
    },
    relation: 'depends_on',
    to: 'contract:release-flow',
  });
});

/**
 * @returns {PatramConfig}
 */
function createPromotedDocumentRelationConfig() {
  return {
    classes: {
      contract: {
        label: 'Contract',
      },
      decision: {
        label: 'Decision',
      },
      document: {
        builtin: true,
      },
      plan: {
        label: 'Plan',
      },
    },
    fields: {
      status: {
        type: 'string',
      },
    },
    mappings: {
      'document.title': createDocumentTitleMapping(),
      ...createPromotedDocumentRelationMappings(),
    },
    relations: {
      decided_by: {
        from: ['contract'],
        to: ['decision'],
      },
      depends_on: {
        from: ['contract', 'plan'],
        to: ['contract'],
      },
    },
  };
}

/**
 * @returns {PatramConfig['mappings']}
 */
function createPromotedDocumentRelationMappings() {
  return {
    'markdown.directive.decided_by': {
      emit: {
        relation: 'decided_by',
        target: 'path',
        target_class: 'decision',
      },
    },
    'markdown.directive.depends_on': {
      emit: {
        relation: 'depends_on',
        target: 'path',
        target_class: 'contract',
      },
    },
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
    'markdown.directive.status': {
      node: {
        class: 'document',
        field: 'status',
      },
    },
  };
}

/**
 * @returns {PatramClaim[]}
 */
function createPromotedDocumentRelationClaims() {
  return [
    ...parseClaims({
      path: 'docs/contracts/release-flow.md',
      source: [
        '# Release Flow Contract',
        '',
        '- Kind: contract',
        '- Id: release-flow',
        '- Decided by: docs/decisions/review-gates.md',
      ].join('\n'),
    }),
    ...parseClaims({
      path: 'docs/contracts/graph-foundation.md',
      source: ['# Graph Foundation Contract', '', '- Kind: contract'].join(
        '\n',
      ),
    }),
    ...parseClaims({
      path: 'docs/decisions/review-gates.md',
      source: [
        '# Review Gates Decision',
        '',
        '- Kind: decision',
        '- Id: review-gates',
      ].join('\n'),
    }),
    ...parseClaims({
      path: 'docs/plans/release-plan.md',
      source: [
        '# Release Plan',
        '',
        '- Kind: plan',
        '- Id: release-plan',
        '- Depends on: docs/contracts/release-flow.md',
      ].join('\n'),
    }),
  ];
}

/**
 * @returns {PatramConfig['mappings']['document.title']}
 */
function createDocumentTitleMapping() {
  return {
    node: {
      class: 'document',
      field: 'title',
    },
  };
}

/**
 * @param {ParseClaimsInput} parse_input
 * @param {{ multi_value_directive_names?: ReadonlySet<string> }} [parse_options]
 * @returns {PatramClaim[]}
 */
function parseClaims(parse_input, parse_options) {
  return parseSourceFile(parse_input, parse_options).claims;
}
