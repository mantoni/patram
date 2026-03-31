/** @import { PatramClaim } from '../parse-claims.types.ts'; */
import { expect, it } from 'vitest';

import { parseSourceFile } from '../parse-claims.js';

it('extracts a markdown description from the first paragraph after a pure directive block', () => {
  const claims = parseClaims({
    path: 'docs/reference/terms/document.md',
    source: [
      '# Document',
      '',
      '- Term: document',
      '- Kind: graph',
      '',
      'The built-in file-backed graph node kind keyed by normalized relative path.',
    ].join('\n'),
  });

  expect(getStringClaimValue(claims, 'document.title')).toBe('Document');
  expect(getStringClaimValue(claims, 'document.description')).toBe(
    'The built-in file-backed graph node kind keyed by normalized relative path.',
  );
});

it('does not extract a markdown description when a list follows the title block', () => {
  const claims = parseClaims({
    path: 'docs/reference/terms/document.md',
    source: [
      '# Document',
      '',
      '- Term: document',
      '',
      '- Bullet',
      '- Another bullet',
    ].join('\n'),
  });

  expect(findClaim(claims, 'document.description')).toBe(undefined);
});

it('extracts a markdown description from an opening non-heading paragraph', () => {
  const claims = parseClaims({
    path: 'docs/notes/example.md',
    source: [
      'Opening overview line',
      'continues on the next line.',
      '',
      'Later paragraph.',
    ].join('\n'),
  });

  expect(getStringClaimValue(claims, 'document.title')).toBe(
    'Opening overview line',
  );
  expect(getStringClaimValue(claims, 'document.description')).toBe(
    'Opening overview line continues on the next line.',
  );
});

it('uses the first sentence of a long markdown paragraph as the description', () => {
  const claims = parseClaims({
    path: 'docs/reference/terms/document.md',
    source: [
      '# Document',
      '',
      'This sentence becomes the description because the paragraph is intentionally much longer than one hundred and twenty characters. The remaining text stays out of the extracted description so markdown descriptions stay compact in query output.',
    ].join('\n'),
  });

  expect(getStringClaimValue(claims, 'document.description')).toBe(
    'This sentence becomes the description because the paragraph is intentionally much longer than one hundred and twenty characters.',
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
