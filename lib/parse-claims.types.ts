import type { PatramDiagnostic } from './load-patram-config.types.ts';

export interface ParseClaimsInput {
  path: string;
  source: string;
}

export interface ClaimOrigin {
  path: string;
  line: number;
  column: number;
}

export interface PatramClaim {
  document_id: string;
  id: string;
  name?: string;
  origin: ClaimOrigin;
  parser?: string;
  type: string;
  value: string | { target: string; text: string };
}

export type PatramClaimFields = Omit<
  PatramClaim,
  'document_id' | 'id' | 'origin' | 'type'
> & {
  origin?: ClaimOrigin;
};

export interface ParseSourceFileResult {
  claims: PatramClaim[];
  diagnostics: PatramDiagnostic[];
}
