import { coverageConfigDefaults, defineConfig } from 'vitest/config';

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
        ...coverageConfigDefaults.exclude,
        'bin/patram.js',
        'lib/build-graph.js',
        'lib/check-directive-metadata.js',
        'lib/check-directive-value.js',
        'lib/derived-summary.js',
        'lib/document-node-identity.js',
        'lib/layout-stored-queries.js',
        'lib/parse-where-clause.js',
        'lib/patram-cli.js',
        'lib/query-graph.js',
        'lib/query-inspection.js',
        'lib/render-output-view.js',
        'lib/render-rich-source.js',
        'lib/show-document.js',
        'lib/tagged-fenced-block-markdown.js',
      ],
      provider: 'v8',
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
