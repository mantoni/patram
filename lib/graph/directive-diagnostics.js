/**
 * @import { PatramDiagnostic } from '../config/load-patram-config.types.ts';
 * @import { PatramClaim } from '../parse/parse-claims.types.ts';
 */

/**
 * @param {PatramClaim} claim
 * @param {string} code
 * @param {string} message
 * @returns {PatramDiagnostic}
 */
export function createOriginDiagnostic(claim, code, message) {
  return {
    code,
    column: claim.origin.column,
    level: 'error',
    line: claim.origin.line,
    message,
    path: claim.origin.path,
  };
}

/**
 * @param {string} document_path
 * @param {string} code
 * @param {string} message
 * @returns {PatramDiagnostic}
 */
export function createDocumentDiagnostic(document_path, code, message) {
  return {
    code,
    column: 1,
    level: 'error',
    line: 1,
    message,
    path: document_path,
  };
}
