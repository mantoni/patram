/**
 * @import { MappingDefinition } from './patram-config.types.ts';
 */

/**
 * @returns {Record<string, { prefixes: string[] }>}
 */
export function createDirectivePathClasses() {
  return {
    decision_docs: {
      prefixes: ['docs/decisions/'],
    },
    plan_docs: {
      prefixes: ['docs/plans/'],
    },
    task_docs: {
      prefixes: ['docs/tasks/'],
    },
  };
}

/**
 * @returns {Record<string, { from: string[], to: string[] }>}
 */
export function createDirectiveRelations() {
  return {
    decided_by: {
      from: ['document'],
      to: ['document'],
    },
    tracked_in: {
      from: ['document'],
      to: ['document'],
    },
  };
}

/**
 * @returns {Record<string, MappingDefinition>}
 */
export function createMarkdownDirectiveMappings() {
  return {
    'markdown.directive.decided_by': createRelationMapping('decided_by'),
    'markdown.directive.kind': createNodeMapping('$class'),
    'markdown.directive.status': createNodeMapping('status'),
    'markdown.directive.tracked_in': createRelationMapping('tracked_in'),
  };
}

/**
 * @returns {Record<string, MappingDefinition>}
 */
export function createJsdocDirectiveMappings() {
  return {
    'jsdoc.directive.decided_by': createRelationMapping('decided_by'),
    'jsdoc.directive.kind': createNodeMapping('$class'),
    'jsdoc.directive.status': createNodeMapping('status'),
    'jsdoc.directive.tracked_in': createRelationMapping('tracked_in'),
  };
}

/**
 * @param {string} field_name
 * @returns {MappingDefinition}
 */
function createNodeMapping(field_name) {
  return {
    node: {
      class: 'document',
      field: field_name,
    },
  };
}

/**
 * @param {string} relation_name
 * @returns {MappingDefinition}
 */
function createRelationMapping(relation_name) {
  return {
    emit: {
      relation: relation_name,
      target: 'path',
      target_class: 'document',
    },
  };
}
