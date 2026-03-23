/* eslint-disable max-lines */
/**
 * @import { PatramDiagnostic, PatramRepoConfig } from './load-patram-config.types.ts';
 * @import { ResolvedOutputMode } from './output-view.types.ts';
 * @import {
 *   ParsedClause,
 *   ParsedRelationTargetTerm,
 *   ParsedRelationTerm,
 *   ParsedTerm,
 *   ParsedTraversalTerm,
 * } from './parse-where-clause.types.ts';
 */

import { Ansis } from 'ansis';

import { parseWhereClause } from './parse-where-clause.js';

/**
 * @typedef {{ kind: 'ad_hoc' } | { kind: 'stored_query', name: string }} QuerySource
 */

/**
 * @typedef {{ query_source: QuerySource, where_clause: string }} ResolvedWhereClause
 */

/**
 * @typedef {{ inspection_mode: 'explain' | 'lint', limit: number | null, offset: number }} QueryInspectionOptions
 */

/**
 * @typedef {{
 *   execution?: {
 *     limit: number | null,
 *     offset: number,
 *   },
 *   inspection_mode: 'explain' | 'lint',
 *   query_source: QuerySource,
 *   where_clause: string,
 *   clauses?: ParsedClause[],
 * }} QueryInspectionSuccess
 */

/**
 * Inspect one resolved query without executing it.
 *
 * @param {PatramRepoConfig} repo_config
 * @param {ResolvedWhereClause} resolved_where_clause
 * @param {QueryInspectionOptions} inspection_options
 * @returns {{ success: true, value: QueryInspectionSuccess } | { diagnostics: PatramDiagnostic[], success: false }}
 */
export function inspectQuery(
  repo_config,
  resolved_where_clause,
  inspection_options,
) {
  const parse_result = parseWhereClause(resolved_where_clause.where_clause);

  if (!parse_result.success) {
    return {
      diagnostics: [
        replaceDiagnosticPath(
          parse_result.diagnostic,
          formatQueryDiagnosticPath(resolved_where_clause.query_source),
        ),
      ],
      success: false,
    };
  }

  const diagnostics = collectRelationDiagnostics(
    repo_config,
    resolved_where_clause.query_source,
    parse_result.clauses,
  );

  if (diagnostics.length > 0) {
    return {
      diagnostics,
      success: false,
    };
  }

  if (inspection_options.inspection_mode === 'lint') {
    return {
      success: true,
      value: {
        inspection_mode: 'lint',
        query_source: resolved_where_clause.query_source,
        where_clause: resolved_where_clause.where_clause,
      },
    };
  }

  return {
    success: true,
    value: {
      clauses: parse_result.clauses,
      execution: {
        limit: inspection_options.limit,
        offset: inspection_options.offset,
      },
      inspection_mode: 'explain',
      query_source: resolved_where_clause.query_source,
      where_clause: resolved_where_clause.where_clause,
    },
  };
}

/**
 * Render a successful query inspection in one output mode.
 *
 * @param {QueryInspectionSuccess} query_inspection
 * @param {ResolvedOutputMode} output_mode
 * @returns {string}
 */
export function renderQueryInspection(query_inspection, output_mode) {
  if (output_mode.renderer_name === 'json') {
    return `${JSON.stringify(formatJsonQueryInspection(query_inspection), null, 2)}\n`;
  }

  if (output_mode.renderer_name === 'plain') {
    return renderTextQueryInspection(query_inspection, {
      header: identity,
      label: identity,
    });
  }

  const ansi = new Ansis(output_mode.color_enabled ? 3 : 0);

  return renderTextQueryInspection(query_inspection, {
    header: ansi.green.bind(ansi),
    label: ansi.gray.bind(ansi),
  });
}

/**
 * @param {PatramRepoConfig} repo_config
 * @param {QuerySource} query_source
 * @param {ParsedClause[]} clauses
 * @returns {PatramDiagnostic[]}
 */
function collectRelationDiagnostics(repo_config, query_source, clauses) {
  if (!repo_config.relations) {
    return [];
  }

  const known_relation_names = new Set(Object.keys(repo_config.relations));
  /** @type {PatramDiagnostic[]} */
  const diagnostics = [];

  collectClauseDiagnostics(
    clauses,
    diagnostics,
    known_relation_names,
    formatQueryDiagnosticPath(query_source),
  );

  return diagnostics;
}

/**
 * @param {ParsedClause[]} clauses
 * @param {PatramDiagnostic[]} diagnostics
 * @param {Set<string>} known_relation_names
 * @param {string} diagnostic_path
 */
function collectClauseDiagnostics(
  clauses,
  diagnostics,
  known_relation_names,
  diagnostic_path,
) {
  for (const clause of clauses) {
    collectTermDiagnostics(
      clause.term,
      diagnostics,
      known_relation_names,
      diagnostic_path,
    );
  }
}

/**
 * @param {ParsedTerm} term
 * @param {PatramDiagnostic[]} diagnostics
 * @param {Set<string>} known_relation_names
 * @param {string} diagnostic_path
 */
function collectTermDiagnostics(
  term,
  diagnostics,
  known_relation_names,
  diagnostic_path,
) {
  if (term.kind === 'aggregate') {
    collectTraversalDiagnostic(
      term.traversal,
      diagnostics,
      known_relation_names,
      diagnostic_path,
    );
    collectClauseDiagnostics(
      term.clauses,
      diagnostics,
      known_relation_names,
      diagnostic_path,
    );

    return;
  }

  if (term.kind === 'relation') {
    collectRelationDiagnostic(
      term,
      diagnostics,
      known_relation_names,
      diagnostic_path,
      'relation clause',
    );

    return;
  }

  if (term.kind === 'relation_target') {
    collectRelationDiagnostic(
      term,
      diagnostics,
      known_relation_names,
      diagnostic_path,
      'relation clause',
    );
  }
}

/**
 * @param {ParsedRelationTerm | ParsedRelationTargetTerm} term
 * @param {PatramDiagnostic[]} diagnostics
 * @param {Set<string>} known_relation_names
 * @param {string} diagnostic_path
 * @param {string} clause_kind
 */
function collectRelationDiagnostic(
  term,
  diagnostics,
  known_relation_names,
  diagnostic_path,
  clause_kind,
) {
  if (known_relation_names.has(term.relation_name)) {
    return;
  }

  diagnostics.push(
    createQueryDiagnostic(
      diagnostic_path,
      term.column,
      `Unknown relation "${term.relation_name}" in ${clause_kind}.`,
    ),
  );
}

/**
 * @param {ParsedTraversalTerm} traversal
 * @param {PatramDiagnostic[]} diagnostics
 * @param {Set<string>} known_relation_names
 * @param {string} diagnostic_path
 */
function collectTraversalDiagnostic(
  traversal,
  diagnostics,
  known_relation_names,
  diagnostic_path,
) {
  if (known_relation_names.has(traversal.relation_name)) {
    return;
  }

  diagnostics.push(
    createQueryDiagnostic(
      diagnostic_path,
      traversal.column,
      `Unknown relation "${traversal.relation_name}" in traversal clause.`,
    ),
  );
}

/**
 * @param {QueryInspectionSuccess} query_inspection
 * @returns {object}
 */
function formatJsonQueryInspection(query_inspection) {
  if (query_inspection.inspection_mode === 'lint') {
    return {
      diagnostics: [],
      mode: 'lint',
      source: query_inspection.query_source,
      where: query_inspection.where_clause,
    };
  }

  return {
    clauses: query_inspection.clauses,
    diagnostics: [],
    execution: query_inspection.execution,
    mode: 'explain',
    source: query_inspection.query_source,
    where: query_inspection.where_clause,
  };
}

/**
 * @param {QueryInspectionSuccess} query_inspection
 * @param {{ header: (value: string) => string, label: (value: string) => string }} render_options
 * @returns {string}
 */
function renderTextQueryInspection(query_inspection, render_options) {
  /** @type {string[]} */
  const output_lines = [
    render_options.header(
      query_inspection.inspection_mode === 'lint'
        ? 'Query is valid.'
        : 'Query explanation',
    ),
    formatLabeledLine(
      render_options,
      'source',
      formatQuerySource(query_inspection.query_source),
    ),
    formatLabeledLine(render_options, 'where', query_inspection.where_clause),
  ];

  if (query_inspection.inspection_mode === 'lint') {
    return `${output_lines.join('\n')}\n`;
  }

  output_lines.push(
    formatLabeledLine(
      render_options,
      'offset',
      String(query_inspection.execution?.offset ?? 0),
    ),
    formatLabeledLine(
      render_options,
      'limit',
      query_inspection.execution?.limit === null
        ? 'none'
        : String(query_inspection.execution?.limit ?? ''),
    ),
    '',
    `${render_options.label('clauses:')}`,
    ...formatExplainClauseBlock(
      query_inspection.clauses ?? [],
      render_options,
      '',
    ),
  );

  return `${output_lines.join('\n')}\n`;
}

/**
 * @param {ParsedClause[]} clauses
 * @param {{ header: (value: string) => string, label: (value: string) => string }} render_options
 * @param {string} indentation
 * @returns {string[]}
 */
function formatExplainClauseBlock(clauses, render_options, indentation) {
  /** @type {string[]} */
  const output_lines = [];

  clauses.forEach((clause, clause_index) => {
    const clause_number = clause_index + 1;
    const clause_text = formatClauseSummary(clause);

    output_lines.push(`${indentation}${clause_number}. ${clause_text}`);

    if (clause.term.kind !== 'aggregate') {
      return;
    }

    output_lines.push(
      `${indentation}   ${render_options.label('traversal:')} ${formatTraversal(clause.term.traversal)}`,
    );

    if (clause.term.aggregate_name === 'count') {
      output_lines.push(
        `${indentation}   ${render_options.label('comparison:')} ${clause.term.comparison} ${clause.term.value}`,
      );
    }

    output_lines.push(
      `${indentation}   ${render_options.label('nested clauses:')}`,
      ...formatExplainClauseBlock(
        clause.term.clauses,
        render_options,
        `${indentation}     `,
      ),
    );
  });

  return output_lines;
}

/**
 * @param {ParsedClause} clause
 * @returns {string}
 */
function formatClauseSummary(clause) {
  const clause_prefix = clause.is_negated ? 'not ' : '';

  if (clause.term.kind === 'aggregate') {
    return `${clause_prefix}aggregate ${clause.term.aggregate_name}`;
  }

  return `${clause_prefix}${formatTermSummary(clause.term)}`;
}

/**
 * @param {ParsedTerm} term
 * @returns {string}
 */
function formatTermSummary(term) {
  if (term.kind === 'field') {
    return `${term.field_name} ${term.operator} ${term.value}`;
  }

  if (term.kind === 'field_set') {
    return `${term.field_name} ${term.operator} [${term.values.join(', ')}]`;
  }

  if (term.kind === 'relation') {
    return `${term.relation_name} exists`;
  }

  if (term.kind === 'relation_target') {
    return `${term.relation_name} = ${term.target_id}`;
  }

  throw new Error('Expected a non-aggregate query term.');
}

/**
 * @param {ParsedTraversalTerm} traversal
 * @returns {string}
 */
function formatTraversal(traversal) {
  return `${traversal.direction}:${traversal.relation_name}`;
}

/**
 * @param {{ header: (value: string) => string, label: (value: string) => string }} render_options
 * @param {string} label
 * @param {string} value
 * @returns {string}
 */
function formatLabeledLine(render_options, label, value) {
  return `${render_options.label(`${label}:`)} ${value}`;
}

/**
 * @param {QuerySource} query_source
 * @returns {string}
 */
function formatQuerySource(query_source) {
  if (query_source.kind === 'stored_query') {
    return `stored query "${query_source.name}"`;
  }

  return 'ad hoc query';
}

/**
 * @param {QuerySource} query_source
 * @returns {string}
 */
function formatQueryDiagnosticPath(query_source) {
  if (query_source.kind === 'stored_query') {
    return `<query:${query_source.name}>`;
  }

  return '<query>';
}

/**
 * @param {string} diagnostic_path
 * @param {number} column
 * @param {string} message
 * @returns {PatramDiagnostic}
 */
function createQueryDiagnostic(diagnostic_path, column, message) {
  return {
    code: 'query.unknown_relation',
    column,
    level: 'error',
    line: 1,
    message,
    path: diagnostic_path,
  };
}

/**
 * @param {PatramDiagnostic} diagnostic
 * @param {string} diagnostic_path
 * @returns {PatramDiagnostic}
 */
function replaceDiagnosticPath(diagnostic, diagnostic_path) {
  return {
    ...diagnostic,
    path: diagnostic_path,
  };
}

/**
 * @param {string} value
 * @returns {string}
 */
function identity(value) {
  return value;
}
