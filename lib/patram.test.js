import { expect, it } from 'vitest';

import * as package_api from './patram.js';

it('exposes the supported package-root library API', () => {
  expect(package_api).toMatchObject({
    extractTaggedFencedBlocks: expect.any(Function),
    getQuerySemanticDiagnostics: expect.any(Function),
    loadProjectGraph: expect.any(Function),
    loadTaggedFencedBlocks: expect.any(Function),
    overlayGraph: expect.any(Function),
    parseWhereClause: expect.any(Function),
    queryGraph: expect.any(Function),
    selectTaggedBlock: expect.any(Function),
    selectTaggedBlocks: expect.any(Function),
  });
});
