import { defineConfig } from 'vitest/config';

const GLOBAL_SLOW_TEST_THRESHOLD = 5_000;
const INTEGRATION_TEST_TAG = 'integration';
const SMOKE_TEST_TAG = 'smoke';

export default defineConfig({
  test: {
    include: ['**/*.test.js'],
    slowTestThreshold: GLOBAL_SLOW_TEST_THRESHOLD,
    tags: [
      {
        description: 'Integration tests',
        name: INTEGRATION_TEST_TAG,
        timeout: 15_000,
      },
      {
        description: 'Package and workflow smoke tests',
        name: SMOKE_TEST_TAG,
        timeout: 30_000,
      },
    ],
    coverage: {
      exclude: [
        'lib/cli/commands/fields.js',
        'lib/config/load-patram-config.js',
        'lib/config/validation.js',
        'lib/graph/build-graph.js',
        'lib/graph/check-directive-metadata-helpers.js',
        'lib/graph/check-directive-metadata.js',
        'lib/graph/check-directive-value.js',
        'lib/graph/directive-diagnostics.js',
        'lib/graph/document-node-identity.js',
        'lib/graph/query/execute.js',
        'lib/graph/query/inspect.js',
        'lib/output/render-field-discovery.js',
        'lib/parse/jsdoc/parse-jsdoc-claims.js',
        'lib/parse/jsdoc/parse-jsdoc-prose.js',
        'lib/parse/yaml/parse-yaml-claims.js',
        'lib/scan/discover-fields.js',
      ],
      provider: 'istanbul',
      reporter: ['text'],
      thresholds: {
        perFile: true,
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90,
      },
    },
  },
});
