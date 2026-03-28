/* eslint-disable max-lines */
/**
 * @import { PatramDiagnostic, PatramRepoConfig } from '../../config/load-patram-config.types.ts';
 * @import {
 *   ParsedExpression,
 *   ParsedRelationTargetTerm,
 *   ParsedRelationTerm,
 *   ParsedTerm,
 *   ParsedTraversalTerm,
 * } from '../parse-where-clause.types.ts';
 */

import { Ansis } from 'ansis';

import { parseWhereClause } from './parse.js';

/**
 * @typedef {{ kind: 'ad_hoc' } | { kind: 'stored_query', name: string }} QuerySource
 */

/**
 * @typedef {import('../parse-where-clause.types.ts').ParsedFieldTerm | import('../parse-where-clause.types.ts').ParsedFieldSetTerm} FieldDiagnosticTerm
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
 *   expression?: ParsedExpression,
 *   inspection_mode: 'explain' | 'lint',
 *   query_source: QuerySource,
 *   where_clause: string,
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

  const diagnostics = getQuerySemanticDiagnostics(
    repo_config,
    resolved_where_clause.query_source,
    parse_result.expression,
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
      execution: {
        limit: inspection_options.limit,
        offset: inspection_options.offset,
      },
      expression: parse_result.expression,
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
 * @param {{ color_enabled: boolean, renderer_name: 'json' | 'plain' | 'rich' }} output_mode
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
    header(value) {
      return ansi.green(value);
    },
    label(value) {
      return ansi.gray(value);
    },
  });
}

/**
 * Collect schema-aware diagnostics for one parsed where clause.
 *
 * @param {PatramRepoConfig} repo_config
 * @param {QuerySource} query_source
 * @param {ParsedExpression} expression
 * @returns {PatramDiagnostic[]}
 */
export function getQuerySemanticDiagnostics(
  repo_config,
  query_source,
  expression,
) {
  const known_relation_names = new Set(
    Object.keys(repo_config.relations ?? {}),
  );
  /** @type {PatramDiagnostic[]} */
  const diagnostics = [];

  collectExpressionDiagnostics(
    expression,
    diagnostics,
    known_relation_names,
    repo_config.fields ?? {},
    formatQueryDiagnosticPath(query_source),
  );

  return diagnostics;
}

/**
 * @param {ParsedExpression} expression
 * @param {PatramDiagnostic[]} diagnostics
 * @param {Set<string>} known_relation_names
 * @param {Record<string, import('../../config/load-patram-config.types.ts').MetadataFieldConfig>} known_field_definitions
 * @param {string} diagnostic_path
 */
function collectExpressionDiagnostics(
  expression,
  diagnostics,
  known_relation_names,
  known_field_definitions,
  diagnostic_path,
) {
  if (expression.kind === 'and' || expression.kind === 'or') {
    for (const subexpression of expression.expressions) {
      collectExpressionDiagnostics(
        subexpression,
        diagnostics,
        known_relation_names,
        known_field_definitions,
        diagnostic_path,
      );
    }

    return;
  }

  if (expression.kind === 'not') {
    collectExpressionDiagnostics(
      expression.expression,
      diagnostics,
      known_relation_names,
      known_field_definitions,
      diagnostic_path,
    );

    return;
  }

  if (expression.kind === 'term') {
    collectTermDiagnostics(
      expression.term,
      diagnostics,
      known_relation_names,
      known_field_definitions,
      diagnostic_path,
    );

    return;
  }

  throw new Error('Unsupported query inspection expression.');
}

/**
 * @param {ParsedTerm} term
 * @param {PatramDiagnostic[]} diagnostics
 * @param {Set<string>} known_relation_names
 * @param {Record<string, import('../../config/load-patram-config.types.ts').MetadataFieldConfig>} known_field_definitions
 * @param {string} diagnostic_path
 */
function collectTermDiagnostics(
  term,
  diagnostics,
  known_relation_names,
  known_field_definitions,
  diagnostic_path,
) {
  if (term.kind === 'aggregate') {
    collectTraversalDiagnostic(
      term.traversal,
      diagnostics,
      known_relation_names,
      diagnostic_path,
    );
    collectExpressionDiagnostics(
      term.expression,
      diagnostics,
      known_relation_names,
      known_field_definitions,
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

    return;
  }

  collectFieldDiagnostics(
    /** @type {FieldDiagnosticTerm} */ (term),
    diagnostics,
    known_field_definitions,
    diagnostic_path,
  );
}

/**
 * @param {FieldDiagnosticTerm} term
 * @param {PatramDiagnostic[]} diagnostics
 * @param {Record<string, import('../../config/load-patram-config.types.ts').MetadataFieldConfig>} known_field_definitions
 * @param {string} diagnostic_path
 */
function collectFieldDiagnostics(
  term,
  diagnostics,
  known_field_definitions,
  diagnostic_path,
) {
  const field_diagnostics_collector = getFieldDiagnosticsCollector(
    term.field_name,
  );

  if (field_diagnostics_collector) {
    field_diagnostics_collector(term, diagnostics, diagnostic_path);
    return;
  }

  if (term.field_name.startsWith('$')) {
    diagnostics.push(
      createQueryDiagnostic(
        diagnostic_path,
        term.column,
        `Reserved field "${term.field_name}" is not available.`,
        'query.reserved_field',
      ),
    );

    return;
  }

  const field_definition = known_field_definitions[term.field_name];

  if (!field_definition) {
    diagnostics.push(
      createQueryDiagnostic(
        diagnostic_path,
        term.column,
        `Unknown field "${term.field_name}".`,
        'query.unknown_field',
      ),
    );

    return;
  }

  if (term.kind === 'field_set') {
    if (term.operator === 'in' || term.operator === 'not in') {
      return;
    }
  }

  if (term.kind === 'field') {
    const operator_diagnostic = getMetadataFieldOperatorDiagnostic(
      term,
      field_definition,
      diagnostic_path,
    );

    if (operator_diagnostic) {
      diagnostics.push(operator_diagnostic);
    }
  }
}

/**
 * @param {string} field_name
 * @returns {((term: FieldDiagnosticTerm, diagnostics: PatramDiagnostic[], diagnostic_path: string) => void) | null}
 */
function getFieldDiagnosticsCollector(field_name) {
  if (field_name === 'title') {
    return collectTitleFieldDiagnostics;
  }

  if (
    field_name === '$id' ||
    field_name === '$class' ||
    field_name === '$path'
  ) {
    return collectStructuralFieldDiagnostics;
  }

  return null;
}

/**
 * @param {FieldDiagnosticTerm} term
 * @param {PatramDiagnostic[]} diagnostics
 * @param {string} diagnostic_path
 */
function collectTitleFieldDiagnostics(term, diagnostics, diagnostic_path) {
  const operator = term.kind === 'field' ? term.operator : term.operator;
  const allowed = new Set(['=', '!=', 'in', 'not in', '~']);

  if (allowed.has(operator)) {
    return;
  }

  diagnostics.push(
    createQueryDiagnostic(
      diagnostic_path,
      term.column,
      `Field "title" does not support the "${operator}" operator.`,
      'query.invalid_operator',
    ),
  );
}

/**
 * @param {FieldDiagnosticTerm} term
 * @param {PatramDiagnostic[]} diagnostics
 * @param {string} diagnostic_path
 */
function collectStructuralFieldDiagnostics(term, diagnostics, diagnostic_path) {
  const operator = term.kind === 'field' ? term.operator : term.operator;
  const allowed_by_field = new Map([
    ['$class', new Set(['=', '!=', 'in', 'not in'])],
    ['$id', new Set(['=', '!=', 'in', 'not in', '^='])],
    ['$path', new Set(['=', '!=', 'in', 'not in', '^='])],
  ]);
  const allowed = allowed_by_field.get(term.field_name);

  if (!allowed || allowed.has(operator)) {
    return;
  }

  diagnostics.push(
    createQueryDiagnostic(
      diagnostic_path,
      term.column,
      `Field "${term.field_name}" does not support the "${operator}" operator.`,
      'query.invalid_operator',
    ),
  );
}

/**
 * @param {import('../parse-where-clause.types.ts').ParsedFieldTerm} term
 * @param {import('../../config/load-patram-config.types.ts').MetadataFieldConfig} field_definition
 * @param {string} diagnostic_path
 * @returns {PatramDiagnostic | null}
 */
function getMetadataFieldOperatorDiagnostic(
  term,
  field_definition,
  diagnostic_path,
) {
  if (supportsMetadataFieldOperator(term.operator, field_definition)) {
    return null;
  }

  return createQueryDiagnostic(
    diagnostic_path,
    term.column,
    getUnsupportedOperatorMessage(term.field_name, term.operator),
    'query.invalid_operator',
  );
}

/**
 * @param {string} operator
 * @param {import('../../config/load-patram-config.types.ts').MetadataFieldConfig} field_definition
 * @returns {boolean}
 */
function supportsMetadataFieldOperator(operator, field_definition) {
  if (operator === '=' || operator === '!=') {
    return true;
  }

  if (operator === '^=') {
    return supportsPrefixOperator(field_definition);
  }

  if (operator === '~') {
    return supportsContainsOperator(field_definition);
  }

  return supportsOrderedComparison(operator, field_definition.type);
}

/**
 * @param {import('../../config/load-patram-config.types.ts').MetadataFieldConfig} field_definition
 * @returns {boolean}
 */
function supportsPrefixOperator(field_definition) {
  if (field_definition.type === 'path') {
    return true;
  }

  return (
    field_definition.type === 'string' &&
    field_definition.query?.prefix === true
  );
}

/**
 * @param {import('../../config/load-patram-config.types.ts').MetadataFieldConfig} field_definition
 * @returns {boolean}
 */
function supportsContainsOperator(field_definition) {
  return (
    field_definition.type === 'string' &&
    field_definition.query?.contains === true
  );
}

/**
 * @param {string} operator
 * @param {string} field_type
 * @returns {boolean}
 */
function supportsOrderedComparison(operator, field_type) {
  if (
    operator !== '<' &&
    operator !== '<=' &&
    operator !== '>' &&
    operator !== '>='
  ) {
    return false;
  }

  return (
    field_type === 'integer' ||
    field_type === 'date' ||
    field_type === 'date_time'
  );
}

/**
 * @param {string} field_name
 * @param {string} operator
 * @returns {string}
 */
function getUnsupportedOperatorMessage(field_name, operator) {
  return `Field "${field_name}" does not support the "${operator}" operator.`;
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
    diagnostics: [],
    execution: query_inspection.execution,
    expression: query_inspection.expression,
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
    `${render_options.label('expression:')}`,
    ...formatExplainExpressionBlock(
      query_inspection.expression ?? {
        expressions: [],
        kind: 'and',
      },
      render_options,
      '',
    ),
  );

  return `${output_lines.join('\n')}\n`;
}

/**
 * @param {ParsedExpression} expression
 * @param {{ header: (value: string) => string, label: (value: string) => string }} render_options
 * @param {string} indentation
 * @returns {string[]}
 */
function formatExplainExpressionBlock(expression, render_options, indentation) {
  if (expression.kind === 'and') {
    return formatExplainExpressionItems(
      expression.expressions,
      render_options,
      indentation,
    );
  }

  return formatExplainExpressionItems(
    [expression],
    render_options,
    indentation,
  );
}

/**
 * @param {ParsedExpression[]} expressions
 * @param {{ header: (value: string) => string, label: (value: string) => string }} render_options
 * @param {string} indentation
 * @returns {string[]}
 */
function formatExplainExpressionItems(
  expressions,
  render_options,
  indentation,
) {
  /** @type {string[]} */
  const output_lines = [];

  expressions.forEach((expression, expression_index) => {
    const expression_number = expression_index + 1;

    output_lines.push(
      `${indentation}${expression_number}. ${formatExpressionSummary(expression)}`,
    );
    output_lines.push(
      ...formatExpressionDetailLines(expression, render_options, indentation),
    );
  });

  return output_lines;
}

/**
 * @param {ParsedExpression} expression
 * @returns {string}
 */
function formatExpressionSummary(expression) {
  if (expression.kind === 'and') {
    return 'all of';
  }

  if (expression.kind === 'or') {
    return 'any of';
  }

  if (expression.kind === 'not') {
    if (expression.expression.kind === 'term') {
      return `not ${formatTermSummary(expression.expression.term)}`;
    }

    return 'not';
  }

  if (expression.kind === 'term') {
    return formatTermSummary(expression.term);
  }

  throw new Error('Unsupported explain expression.');
}

/**
 * @param {ParsedExpression} expression
 * @param {{ header: (value: string) => string, label: (value: string) => string }} render_options
 * @param {string} indentation
 * @returns {string[]}
 */
function formatExpressionDetailLines(expression, render_options, indentation) {
  if (expression.kind === 'and' || expression.kind === 'or') {
    return formatExplainExpressionItems(
      expression.expressions,
      render_options,
      `${indentation}   `,
    );
  }

  if (expression.kind === 'not') {
    if (expression.expression.kind === 'term') {
      return [];
    }

    return formatExplainExpressionBlock(
      expression.expression,
      render_options,
      `${indentation}   `,
    );
  }

  if (expression.kind !== 'term') {
    throw new Error('Unsupported explain expression details.');
  }

  if (expression.term.kind !== 'aggregate') {
    return [];
  }

  /** @type {string[]} */
  const output_lines = [
    `${indentation}   ${render_options.label('traversal:')} ${formatTraversal(expression.term.traversal)}`,
  ];

  if (expression.term.aggregate_name === 'count') {
    output_lines.push(
      `${indentation}   ${render_options.label('comparison:')} ${expression.term.comparison} ${expression.term.value}`,
    );
  }

  output_lines.push(
    `${indentation}   ${render_options.label('nested expression:')}`,
    ...formatExplainExpressionBlock(
      expression.term.expression,
      render_options,
      `${indentation}     `,
    ),
  );

  return output_lines;
}

/**
 * @param {ParsedTerm} term
 * @returns {string}
 */
function formatTermSummary(term) {
  if (term.kind === 'aggregate') {
    return `aggregate ${term.aggregate_name}`;
  }

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

  throw new Error('Expected a parsed query term.');
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
 * @param {PatramDiagnostic['code']} [code]
 * @returns {PatramDiagnostic}
 */
function createQueryDiagnostic(diagnostic_path, column, message, code) {
  return {
    code: code ?? 'query.unknown_relation',
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
