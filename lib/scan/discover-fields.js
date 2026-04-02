/* eslint-disable max-lines, max-lines-per-function */
/**
 * @import { ClaimOrigin, PatramClaim } from '../parse/parse-claims.types.ts';
 * @import {
 *   DiscoveredFieldTypeName,
 *   FieldDiscoveryEvidenceReference,
 *   FieldDiscoveryMultiplicitySuggestion,
 *   FieldDiscoveryOnUsage,
 *   FieldDiscoveryResult,
 *   FieldDiscoverySuggestion,
 *   FieldDiscoveryTargetSuggestion,
 *   FieldDiscoveryTypeSuggestion,
 * } from './discover-fields.types.ts';
 */

import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { posix, resolve } from 'node:path';

import { DEFAULT_INCLUDE_PATTERNS } from '../config/source-file-defaults.js';
import { listSourceFiles } from './list-source-files.js';
import { parseSourceFile } from '../parse/parse-claims.js';
import {
  matchHiddenDirectiveFields,
  matchVisibleDirectiveFields,
} from '../parse/markdown/parse-markdown-directives.js';
import { isPathLikeTarget } from '../parse/claim-helpers.js';

const TYPE_NAME_ORDER = /** @type {const} */ ([
  'ref',
  'integer',
  'date_time',
  'date',
  'glob',
  'path',
  'enum',
  'string',
]);

const INTEGER_PATTERN = /^-?\d+$/du;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/du;
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/du;
const ENUM_PATTERN = /^[a-z0-9_][a-z0-9_-]*$/du;
const PATH_PATTERN = /^[a-z0-9_.-]+\.[a-z0-9]+$/du;

/**
 * @typedef {FieldDiscoveryOnUsage & { confidence: number }} InferredFieldOnUsage
 */

/**
 * @typedef {FieldDiscoveryTargetSuggestion & { confidence: number }} InferredFieldTargetSuggestion
 */

/**
 * @typedef {(value: string) => number} FieldTypeScorer
 */

/**
 * Discover likely field schema from source files.
 *
 * @param {string} [project_directory]
 * @param {{ defined_field_names?: ReadonlySet<string> }} [options]
 * @returns {Promise<FieldDiscoveryResult>}
 */
export async function discoverFields(
  project_directory = process.cwd(),
  options,
) {
  const defined_field_names = options?.defined_field_names ?? new Set();
  const source_file_paths = (
    await listSourceFiles(DEFAULT_INCLUDE_PATTERNS, project_directory)
  ).filter((source_file_path) => source_file_path.includes('/'));
  const parse_results = await Promise.all(
    source_file_paths.map(async (source_file_path) => {
      const source_text = await readFile(
        resolve(project_directory, source_file_path),
        'utf8',
      );

      return {
        claims: parseSourceFile({
          path: source_file_path,
          source: source_text,
        }).claims,
        path: source_file_path,
        source_text,
      };
    }),
  );
  /** @type {FieldObservation[]} */
  const field_observations = parse_results.flatMap((parse_result) => {
    const document_types = inferDocumentTypes(
      parse_result.path,
      parse_result.claims,
    );
    const allowed_markdown_lines = collectAllowedMarkdownDirectiveLines(
      parse_result.path,
      parse_result.source_text,
      parse_result.claims,
    );

    return parse_result.claims.flatMap((claim) => {
      if (
        claim.type !== 'directive' ||
        !claim.name ||
        claim.name.startsWith('$') ||
        typeof claim.value !== 'string' ||
        claim.value.length === 0 ||
        !shouldIncludeDiscoveryClaim(claim, allowed_markdown_lines)
      ) {
        return [];
      }

      return [
        {
          document_id: claim.document_id,
          name: claim.name,
          normalized_value: normalizeDiscoveryValue(claim.value),
          origin: claim.origin,
          type_names: new Set(document_types),
          value: claim.value,
        },
      ];
    });
  });
  /** @type {Map<string, FieldBucket>} */
  const field_buckets = field_observations.reduce(
    (buckets, field_observation) => {
      /** @type {FieldBucket} */
      const bucket = buckets.get(field_observation.name) ?? {
        name: field_observation.name,
        observations: [],
      };

      bucket.observations.push(field_observation);
      buckets.set(field_observation.name, bucket);
      return buckets;
    },
    /** @type {Map<string, FieldBucket>} */ (new Map()),
  );
  const fields = [...field_buckets.values()]
    .map(buildFieldSuggestion)
    .filter(
      (field_suggestion) =>
        !defined_field_names.has(field_suggestion.name) &&
        isPlausibleFieldName(field_suggestion.name),
    )
    .sort((left_suggestion, right_suggestion) =>
      left_suggestion.confidence !== right_suggestion.confidence
        ? right_suggestion.confidence - left_suggestion.confidence
        : left_suggestion.name.localeCompare(right_suggestion.name, 'en'),
    );

  return {
    fields,
    summary: {
      claim_count: parse_results.reduce(
        (sum, parse_result) => sum + parse_result.claims.length,
        0,
      ),
      count: fields.length,
      source_file_count: source_file_paths.length,
    },
  };
}

/**
 * @param {FieldBucket} field_bucket
 * @returns {FieldDiscoverySuggestion}
 */
function buildFieldSuggestion(field_bucket) {
  const target_result = inferFieldTarget(field_bucket.observations);
  const type_result = inferFieldType(field_bucket.observations, target_result);
  const multiplicity_result = inferFieldMultiplicity(field_bucket.observations);
  const on_result = inferFieldOn(field_bucket.observations);
  const evidence_references = buildEvidenceReferences(
    field_bucket.observations,
  );
  const conflicting_evidence = buildEvidenceReferences(
    field_bucket.observations.filter((field_observation) => {
      if (type_result.name === 'ref') {
        return (
          scoreFieldValue(field_observation.normalized_value, 'path') === 0
        );
      }

      return (
        scoreFieldValue(
          field_observation.normalized_value,
          type_result.name,
        ) === 0
      );
    }),
  );

  return {
    confidence:
      Math.round(
        ((type_result.confidence +
          multiplicity_result.confidence +
          on_result.confidence) /
          3) *
          100,
      ) / 100,
    conflicting_evidence,
    evidence_references,
    likely_multiplicity: multiplicity_result,
    likely_on: {
      types: on_result.types,
    },
    likely_to: type_result.name === 'ref' ? target_result : undefined,
    likely_type: type_result,
    name: field_bucket.name,
  };
}

/**
 * @param {FieldObservation[]} observations
 * @returns {FieldDiscoveryEvidenceReference[]}
 */
function buildEvidenceReferences(observations) {
  return observations
    .map((observation) => ({
      column: observation.origin.column,
      line: observation.origin.line,
      path: observation.origin.path,
      value: observation.value,
    }))
    .sort(compareEvidenceReferences);
}

/**
 * @param {FieldObservation[]} observations
 * @returns {FieldDiscoveryMultiplicitySuggestion}
 */
function inferFieldMultiplicity(observations) {
  /** @type {Map<string, Set<string>>} */
  const values_by_document = observations.reduce((values, observation) => {
    const normalized_value = observation.normalized_value;
    const current_values = values.get(observation.document_id);

    if (current_values) {
      current_values.add(normalized_value);
    } else {
      values.set(observation.document_id, new Set([normalized_value]));
    }

    return values;
  }, /** @type {Map<string, Set<string>>} */ (new Map()));
  const repeated_identical_documents = [...values_by_document.values()].reduce(
    (count, values) => {
      if (values.size > 1) {
        return Infinity;
      }

      return values.size === 1 ? count + 1 : count;
    },
    0,
  );

  if (repeated_identical_documents === Infinity) {
    return {
      confidence: 1,
      name: 'multiple',
    };
  }

  return {
    confidence:
      Math.round(
        (values_by_document.size > 1 && repeated_identical_documents > 0
          ? 0.9
          : 0.8) * 100,
      ) / 100,
    name: 'single',
  };
}

/**
 * @param {FieldObservation[]} observations
 * @returns {InferredFieldOnUsage}
 */
function inferFieldOn(observations) {
  /** @type {Map<string, number>} */
  const type_counts = new Map();
  let documented_observation_count = 0;

  for (const observation of observations) {
    if (observation.type_names.size === 0) {
      continue;
    }

    documented_observation_count += 1;

    for (const type_name of observation.type_names) {
      type_counts.set(type_name, (type_counts.get(type_name) ?? 0) + 1);
    }
  }

  if (type_counts.size === 0) {
    return {
      confidence: 0.2,
      types: ['document'],
    };
  }

  return {
    confidence:
      Math.round(
        (documented_observation_count / Math.max(observations.length, 1)) * 100,
      ) / 100,
    types: [...type_counts.keys()].sort((left_type, right_type) =>
      left_type.localeCompare(right_type, 'en'),
    ),
  };
}

/**
 * @param {FieldObservation[]} observations
 * @param {InferredFieldTargetSuggestion | undefined} target_result
 * @returns {FieldDiscoveryTypeSuggestion}
 */
function inferFieldType(observations, target_result) {
  if (target_result && scoreFieldType(observations, 'path') >= 0.9) {
    return {
      confidence: target_result.confidence,
      name: 'ref',
    };
  }

  /** @type {FieldDiscoveryTypeSuggestion[]} */
  const type_candidates = TYPE_NAME_ORDER.map((type_name) => ({
    confidence: scoreFieldType(observations, type_name),
    name: type_name,
  }));

  type_candidates.sort((left_candidate, right_candidate) => {
    if (left_candidate.confidence !== right_candidate.confidence) {
      return right_candidate.confidence - left_candidate.confidence;
    }

    return (
      TYPE_NAME_ORDER.indexOf(left_candidate.name) -
      TYPE_NAME_ORDER.indexOf(right_candidate.name)
    );
  });

  return type_candidates[0];
}

/**
 * @param {FieldObservation[]} observations
 * @returns {InferredFieldTargetSuggestion | undefined}
 */
function inferFieldTarget(observations) {
  /** @type {Map<string, number>} */
  const target_counts = new Map();
  let path_observation_count = 0;

  for (const observation of observations) {
    const target_type = inferTargetTypeFromObservation(observation);

    if (!target_type) {
      continue;
    }

    path_observation_count += 1;
    target_counts.set(target_type, (target_counts.get(target_type) ?? 0) + 1);
  }

  if (path_observation_count === 0 || target_counts.size !== 1) {
    return undefined;
  }

  const [type_name, count] = [...target_counts.entries()][0];

  return {
    confidence: Math.round((count / path_observation_count) * 100) / 100,
    type: type_name,
  };
}

/**
 * @param {FieldDiscoveryEvidenceReference} left_reference
 * @param {FieldDiscoveryEvidenceReference} right_reference
 * @returns {number}
 */
function compareEvidenceReferences(left_reference, right_reference) {
  const path_compare = left_reference.path.localeCompare(
    right_reference.path,
    'en',
  );

  if (path_compare !== 0) {
    return path_compare;
  }

  if (left_reference.line !== right_reference.line) {
    return left_reference.line - right_reference.line;
  }

  if (left_reference.column !== right_reference.column) {
    return left_reference.column - right_reference.column;
  }

  return left_reference.value.localeCompare(right_reference.value, 'en');
}

/**
 * @param {FieldObservation[]} observations
 * @param {DiscoveredFieldTypeName} field_type_name
 * @returns {number}
 */
function scoreFieldType(observations, field_type_name) {
  if (observations.length === 0) {
    return 0;
  }

  const total_score = observations.reduce(
    (sum, observation) =>
      sum + scoreFieldValue(observation.normalized_value, field_type_name),
    0,
  );

  return Math.round((total_score / observations.length) * 100) / 100;
}

/**
 * @param {string} value
 * @param {DiscoveredFieldTypeName} field_type_name
 * @returns {number}
 */
function scoreFieldValue(value, field_type_name) {
  const scorer = FIELD_TYPE_SCORERS[field_type_name];
  return scorer ? scorer(value) : 0;
}

/** @type {Record<DiscoveredFieldTypeName, FieldTypeScorer>} */
const FIELD_TYPE_SCORERS = {
  date: (value) => (DATE_PATTERN.test(value) ? 1 : 0),
  date_time: (value) => (DATE_TIME_PATTERN.test(value) ? 1 : 0),
  enum: (value) =>
    ENUM_PATTERN.test(value) && value.includes(' ') === false ? 1 : 0,
  glob: (value) =>
    value.includes('*') ||
    value.includes('?') ||
    value.includes('[') ||
    value.includes(']')
      ? 1
      : 0,
  integer: (value) => (INTEGER_PATTERN.test(value) ? 1 : 0),
  path: (value) =>
    !(
      value.includes('/') ||
      PATH_PATTERN.test(value) ||
      value.startsWith('docs/') ||
      value.startsWith('lib/') ||
      value.startsWith('test/')
    )
      ? 0
      : value.includes('*') ||
          value.includes('?') ||
          value.includes('[') ||
          value.includes(']')
        ? 0.8
        : 1,
  ref: () => 0,
  string: () => 0.5,
};

/**
 * @typedef {{
 *   document_id: string,
 *   name: string,
 *   normalized_value: string,
 *   origin: ClaimOrigin,
 *   type_names: Set<string>,
 *   value: string,
 * }} FieldObservation
 */

/**
 * @typedef {{
 *   name: string,
 *   observations: FieldObservation[],
 * }} FieldBucket
 */

/**
 * @param {PatramClaim} claim
 * @param {Set<number> | null} allowed_markdown_lines
 * @returns {boolean}
 */
function shouldIncludeDiscoveryClaim(claim, allowed_markdown_lines) {
  if (claim.parser !== 'markdown') {
    return true;
  }

  if (claim.markdown_style === 'front_matter') {
    return true;
  }

  return allowed_markdown_lines?.has(claim.origin.line) ?? false;
}

/**
 * @param {string} file_path
 * @param {string} source_text
 * @param {PatramClaim[]} claims
 * @returns {Set<number> | null}
 */
function collectAllowedMarkdownDirectiveLines(file_path, source_text, claims) {
  if (!file_path.endsWith('.md')) {
    return null;
  }

  const title_claim = claims.find((claim) => claim.type === 'document.title');

  if (!title_claim) {
    return new Set();
  }

  const lines = source_text.split('\n');
  /** @type {Set<number>} */
  const allowed_lines = new Set();

  for (
    let line_index = title_claim.origin.line;
    line_index < lines.length;
    line_index += 1
  ) {
    const line = lines[line_index];

    if (line.trim().length === 0) {
      continue;
    }

    if (isMarkdownDiscoveryDirective(file_path, line, line_index + 1)) {
      allowed_lines.add(line_index + 1);
      continue;
    }

    break;
  }

  return allowed_lines;
}

/**
 * @param {string} file_path
 * @param {string} line
 * @param {number} line_number
 * @returns {boolean}
 */
function isMarkdownDiscoveryDirective(file_path, line, line_number) {
  return (
    matchVisibleDirectiveFields(file_path, line, line_number) !== null ||
    matchHiddenDirectiveFields(file_path, line, line_number) !== null
  );
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalizeDiscoveryValue(value) {
  const trimmed_value = value.trim();
  const markdown_link_match = trimmed_value.match(
    /^\[([^\]]+)\]\(([^)]+)\)$/du,
  );

  if (markdown_link_match && isPathLikeTarget(markdown_link_match[2])) {
    return markdown_link_match[2];
  }

  const code_span_match = trimmed_value.match(/^`([^`]+)`[.,;:]?$/du);

  if (code_span_match) {
    return code_span_match[1];
  }

  return trimmed_value;
}

/**
 * @param {string} source_path
 * @param {PatramClaim[]} claims
 * @returns {string[]}
 */
function inferDocumentTypes(source_path, claims) {
  /** @type {Set<string>} */
  const document_types = new Set();
  const path_type = inferPathBackedType(source_path);

  if (path_type) {
    document_types.add(path_type);
  }

  for (const claim of claims) {
    if (
      claim.type === 'directive' &&
      (claim.name === 'command' || claim.name === 'term') &&
      typeof claim.value === 'string' &&
      claim.value.length > 0
    ) {
      document_types.add(claim.name);
    }
  }

  return [...document_types].sort((left_type, right_type) =>
    left_type.localeCompare(right_type, 'en'),
  );
}

/**
 * @param {string} source_path
 * @returns {string | null}
 */
function inferPathBackedType(source_path) {
  if (source_path.startsWith('docs/conventions/')) {
    return 'convention';
  }

  if (source_path.startsWith('docs/decisions/')) {
    return 'decision';
  }

  if (source_path.startsWith('docs/plans/')) {
    return 'plan';
  }

  if (source_path.startsWith('docs/research/')) {
    return 'idea';
  }

  if (source_path.startsWith('docs/roadmap/')) {
    return 'roadmap';
  }

  if (source_path.startsWith('docs/tasks/')) {
    return 'task';
  }

  return null;
}

/**
 * @param {FieldObservation} observation
 * @returns {string | null}
 */
function inferTargetTypeFromObservation(observation) {
  const value = resolveDiscoveryTargetPath(
    observation.origin.path,
    observation.normalized_value,
  );

  if (
    !value.includes('/') &&
    !PATH_PATTERN.test(value) &&
    !value.startsWith('docs/') &&
    !value.startsWith('lib/') &&
    !value.startsWith('test/')
  ) {
    return null;
  }

  if (value.startsWith('docs/reference/commands/')) {
    return 'command';
  }

  if (value.startsWith('docs/reference/terms/')) {
    return 'term';
  }

  return inferPathBackedType(value) ?? 'document';
}

/**
 * @param {string} source_path
 * @param {string} target_value
 * @returns {string}
 */
function resolveDiscoveryTargetPath(source_path, target_value) {
  if (target_value.startsWith('./') || target_value.startsWith('../')) {
    const parent_directory = posix.dirname(source_path);

    return posix.normalize(posix.join(parent_directory, target_value));
  }

  return target_value;
}

/**
 * @param {string} field_name
 * @returns {boolean}
 */
function isPlausibleFieldName(field_name) {
  const field_name_tokens = field_name.split('_');

  return field_name.length <= 32 && field_name_tokens.length <= 4;
}
