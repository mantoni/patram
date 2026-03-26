/**
 * Shared reverse-reference graph fixtures for tests.
 */

export function createDecisionNode() {
  return {
    $class: 'decision',
    $id: 'decision:query-language',
    $path: 'docs/decisions/query-language.md',
    id: 'decision:query-language',
    path: 'docs/decisions/query-language.md',
    status: 'accepted',
    title: 'Query Language',
  };
}

export function createReconcileNode() {
  return {
    $class: 'document',
    $id: 'doc:lib/reconcile.js',
    $path: 'lib/reconcile.js',
    id: 'doc:lib/reconcile.js',
    path: 'lib/reconcile.js',
    title: 'Reconciler entrypoint.',
  };
}

export function createResumeNode() {
  return {
    $class: 'document',
    $id: 'doc:lib/resume.js',
    $path: 'lib/resume.js',
    id: 'doc:lib/resume.js',
    path: 'lib/resume.js',
    title: 'Resume entrypoint.',
  };
}

export function createTaskNode() {
  return {
    $class: 'task',
    $id: 'task:reverse-reference-inspection',
    $path: 'docs/tasks/v0/reverse-reference-inspection.md',
    id: 'task:reverse-reference-inspection',
    path: 'docs/tasks/v0/reverse-reference-inspection.md',
    status: 'ready',
    title: 'Implement reverse reference inspection',
  };
}

/**
 * @param {string} edge_id
 * @param {string} from_id
 * @param {string} origin_path
 * @param {string} relation_name
 * @param {string} to_id
 */
export function createGraphEdge(
  edge_id,
  from_id,
  origin_path,
  relation_name,
  to_id,
) {
  return {
    from: from_id,
    id: edge_id,
    origin: {
      column: 1,
      line: 1,
      path: origin_path,
    },
    relation: relation_name,
    to: to_id,
  };
}
