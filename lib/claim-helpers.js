/**
 * @import { PatramClaim, PatramClaimFields } from './parse-claims.types.ts';
 */

const URI_SCHEME_PATTERN = /^[A-Za-z][A-Za-z0-9+.-]*:/du;

/**
 * @param {string} target_value
 * @returns {boolean}
 */
export function isPathLikeTarget(target_value) {
  if (target_value.startsWith('#')) {
    return false;
  }

  return !URI_SCHEME_PATTERN.test(target_value);
}

/**
 * @param {string} file_path
 * @param {number} claim_number
 * @param {string} claim_type
 * @param {PatramClaimFields} claim_fields
 * @returns {PatramClaim}
 */
export function createClaim(file_path, claim_number, claim_type, claim_fields) {
  const document_id = `doc:${file_path}`;
  const origin = claim_fields.origin ?? {
    column: 1,
    line: 1,
    path: file_path,
  };

  return {
    ...claim_fields,
    document_id,
    id: `claim:${document_id}:${claim_number}`,
    origin,
    type: claim_type,
  };
}

/**
 * @param {string} file_path
 * @returns {string}
 */
export function getFileExtension(file_path) {
  const last_dot_index = file_path.lastIndexOf('.');

  if (last_dot_index < 0) {
    return '';
  }

  return file_path.slice(last_dot_index);
}
