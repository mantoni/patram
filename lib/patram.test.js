import { expect, it } from 'vitest';

import * as package_api from './patram.js';

it('exposes the supported package-root library API', () => {
  expect(typeof package_api.extractTaggedFencedBlocks).toBe('function');
  expect(typeof package_api.getQuerySemanticDiagnostics).toBe('function');
  expect(typeof package_api.loadProjectGraph).toBe('function');
  expect(typeof package_api.loadTaggedFencedBlocks).toBe('function');
  expect('overlayGraph' in package_api).toBe(false);
  expect(typeof package_api.parseWhereClause).toBe('function');
  expect(typeof package_api.queryGraph).toBe('function');
  expect(typeof package_api.selectTaggedBlock).toBe('function');
  expect(typeof package_api.selectTaggedBlocks).toBe('function');
});
