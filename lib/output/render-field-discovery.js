/**
 * @import { ResolvedOutputMode } from './output-view.types.ts';
 * @import { FieldDiscoveryResult, FieldDiscoverySuggestion } from '../scan/discover-fields.types.ts';
 */

import { Ansis } from 'ansis';

const MAX_TEXT_EVIDENCE_ROWS = 5;

/**
 * Render field discovery output.
 *
 * @param {FieldDiscoveryResult} discovery_result
 * @param {ResolvedOutputMode} output_mode
 * @returns {string}
 */
export function renderFieldDiscovery(discovery_result, output_mode) {
  if (output_mode.renderer_name === 'json') {
    return `${JSON.stringify(formatJsonFieldDiscovery(discovery_result), null, 2)}\n`;
  }

  return renderTextFieldDiscovery(discovery_result, output_mode);
}

/**
 * @param {FieldDiscoveryResult} discovery_result
 * @returns {{ fields: Array<Record<string, unknown>>, summary: FieldDiscoveryResult['summary'] }}
 */
function formatJsonFieldDiscovery(discovery_result) {
  return {
    fields: discovery_result.fields.map(formatJsonFieldSuggestion),
    summary: discovery_result.summary,
  };
}

/**
 * @param {FieldDiscoverySuggestion} field_suggestion
 * @returns {Record<string, unknown>}
 */
function formatJsonFieldSuggestion(field_suggestion) {
  return {
    confidence: field_suggestion.confidence,
    conflicting_evidence: field_suggestion.conflicting_evidence,
    evidence_references: field_suggestion.evidence_references,
    likely_class_usage: field_suggestion.likely_class_usage,
    likely_multiplicity: field_suggestion.likely_multiplicity,
    likely_type: field_suggestion.likely_type,
    name: field_suggestion.name,
  };
}

/**
 * @param {FieldDiscoveryResult} discovery_result
 * @param {ResolvedOutputMode} output_mode
 * @returns {string}
 */
function renderTextFieldDiscovery(discovery_result, output_mode) {
  const ansi = new Ansis(
    output_mode.renderer_name === 'rich' && output_mode.color_enabled ? 3 : 0,
  );
  /** @type {string[]} */
  const output_lines = [];

  output_lines.push(
    output_mode.renderer_name === 'rich'
      ? ansi.green('Field discovery')
      : 'Field discovery',
  );

  output_lines.push(
    output_mode.renderer_name === 'rich'
      ? ansi.gray(
          `Found ${discovery_result.summary.count} suggested fields from ${discovery_result.summary.source_file_count} source files.`,
        )
      : `Found ${discovery_result.summary.count} suggested fields from ${discovery_result.summary.source_file_count} source files.`,
  );

  for (const field_suggestion of discovery_result.fields) {
    output_lines.push(
      '',
      ...formatTextFieldSuggestion(field_suggestion, {
        header: (value) =>
          output_mode.renderer_name === 'rich' ? ansi.green(value) : value,
        label: (value) =>
          output_mode.renderer_name === 'rich' ? ansi.gray(value) : value,
      }),
    );
  }

  if (discovery_result.fields.length === 0) {
    output_lines.push('', 'No field candidates discovered.');
  }

  return `${output_lines.join('\n')}\n`;
}

/**
 * @param {FieldDiscoverySuggestion} field_suggestion
 * @param {{ header: (value: string) => string, label: (value: string) => string }} render_options
 * @returns {string[]}
 */
function formatTextFieldSuggestion(field_suggestion, render_options) {
  /** @type {string[]} */
  const lines = [render_options.header(field_suggestion.name)];

  lines.push(
    `${render_options.label('  likely type:')} ${field_suggestion.likely_type.name}`,
    `${render_options.label('  likely multiplicity:')} ${field_suggestion.likely_multiplicity.name}`,
    `${render_options.label('  likely class usage:')} ${field_suggestion.likely_class_usage.classes.join(', ')}`,
    `${render_options.label('  confidence:')} ${formatConfidence(field_suggestion.confidence)}`,
  );

  if (field_suggestion.evidence_references.length > 0) {
    lines.push(
      ...formatTextEvidenceSection(
        '  evidence:',
        field_suggestion.evidence_references,
        render_options,
      ),
    );
  }

  if (field_suggestion.conflicting_evidence.length > 0) {
    lines.push(
      ...formatTextEvidenceSection(
        '  conflicting evidence:',
        field_suggestion.conflicting_evidence,
        render_options,
      ),
    );
  }

  return lines;
}

/**
 * @param {string} section_title
 * @param {import('../scan/discover-fields.types.ts').FieldDiscoveryEvidenceReference[]} evidence_references
 * @param {{ header: (value: string) => string, label: (value: string) => string }} render_options
 * @returns {string[]}
 */
function formatTextEvidenceSection(
  section_title,
  evidence_references,
  render_options,
) {
  /** @type {string[]} */
  const lines = [render_options.label(section_title)];
  const visible_evidence_references = evidence_references.slice(
    0,
    MAX_TEXT_EVIDENCE_ROWS,
  );

  lines.push(
    ...visible_evidence_references.map(
      (evidence_reference) =>
        `${render_options.label('    ')}${formatEvidenceReference(evidence_reference)}`,
    ),
  );

  if (evidence_references.length > MAX_TEXT_EVIDENCE_ROWS) {
    const remaining_count = evidence_references.length - MAX_TEXT_EVIDENCE_ROWS;

    lines.push(render_options.label(`    ${remaining_count} more ...`));
  }

  return lines;
}

/**
 * @param {import('../scan/discover-fields.types.ts').FieldDiscoveryEvidenceReference} evidence_reference
 * @returns {string}
 */
function formatEvidenceReference(evidence_reference) {
  return `${evidence_reference.path}:${evidence_reference.line}:${evidence_reference.column} ${JSON.stringify(evidence_reference.value)}`;
}

/**
 * @param {number} confidence
 * @returns {string}
 */
function formatConfidence(confidence) {
  return confidence.toFixed(2);
}
