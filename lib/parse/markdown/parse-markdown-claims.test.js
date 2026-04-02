/** @import { PatramClaim } from '../parse-claims.types.ts'; */
import { expect, it } from 'vitest';

import { parseSourceFile } from '../parse-claims.js';

it('extracts a markdown description after a lower_snake_case metadata block', () => {
  const claims = parseClaims({
    path: 'docs/reference/terms/document.md',
    source: [
      '# Document',
      '',
      'term: document',
      'kind: graph',
      '',
      'The built-in file-backed graph node kind keyed by normalized relative path.',
    ].join('\n'),
  });

  expect(getStringClaimValue(claims, 'document.title')).toBe('Document');
  expect(getStringClaimValue(claims, 'document.description')).toBe(
    'The built-in file-backed graph node kind keyed by normalized relative path.',
  );
});

it('does not extract a markdown description when a list follows the metadata block', () => {
  const claims = parseClaims({
    path: 'docs/reference/terms/document.md',
    source: [
      '# Document',
      '',
      'term: document',
      '',
      '- Bullet',
      '- Another bullet',
    ].join('\n'),
  });

  expect(findClaim(claims, 'document.description')).toBe(undefined);
});

it('extracts a markdown description after wrapped list-item directive content', () => {
  const claims = parseClaims({
    path: 'docs/reference/commands/check.md',
    source: [
      '# Check',
      '',
      'command: check',
      '- summary: Validate a project, directory, or file and report',
      '  diagnostics.',
      '',
      '`patram check [<path>...]` validates configuration.',
    ].join('\n'),
  });

  expect(getStringClaimValue(claims, 'document.description')).toBe(
    '`patram check [<path>...]` validates configuration.',
  );
});

/**
 * @param {{ path: string, source: string }} parse_input
 * @returns {PatramClaim[]}
 */
function parseClaims(parse_input) {
  return parseSourceFile(parse_input).claims;
}

/**
 * @param {PatramClaim[]} claims
 * @param {string} claim_type
 * @returns {PatramClaim | undefined}
 */
function findClaim(claims, claim_type) {
  return claims.find((claim) => claim.type === claim_type);
}

/**
 * @param {PatramClaim[]} claims
 * @param {string} claim_type
 * @returns {string | undefined}
 */
function getStringClaimValue(claims, claim_type) {
  for (const claim of claims) {
    if (claim.type === claim_type && typeof claim.value === 'string') {
      return claim.value;
    }
  }

  return undefined;
}
