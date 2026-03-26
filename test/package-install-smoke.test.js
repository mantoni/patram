// @module-tag smoke

import { execFile } from 'node:child_process';
import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { it } from 'vitest';
import { expect } from 'vitest';

/**
 * Published package smoke coverage.
 *
 * Packs the repo, installs it in a consumer project, and verifies the
 * published CLI can be imported.
 *
 * Kind: support
 * Status: active
 * Tracked in: ../docs/plans/v0/source-anchor-dogfooding.md
 * Decided by: ../docs/decisions/package-install-smoke-test.md
 * @patram
 * @see {@link ./package-metadata.test.js}
 * @see {@link ../docs/decisions/package-install-smoke-test.md}
 */

const exec_file = promisify(execFile);
const repo_directory = dirname(
  fileURLToPath(new URL('../package.json', import.meta.url)),
);

it('installs and imports the packed npm package in a consumer project', async () => {
  const temp_directory = await createTempDirectory();

  try {
    const tarball_path = await packRepo(temp_directory);
    const consumer_directory = join(temp_directory, 'consumer');

    await createConsumerProject(consumer_directory);
    await installTarball(consumer_directory, tarball_path);
    await assertTarballIncludesDeclarations(tarball_path);
    await importPackedLibrary(consumer_directory);
    await importPackedCli(consumer_directory);
    await typecheckPackedLibrary(consumer_directory);
    await assertGeneratedDeclarationsAreCleared();
  } finally {
    await rm(temp_directory, { force: true, recursive: true });
  }
});

/**
 * @param {string} parent_directory
 */
async function packRepo(parent_directory) {
  const npm_cache_directory = join(parent_directory, 'npm-cache');

  await mkdir(npm_cache_directory, { recursive: true });

  const { stdout } = await runCommand(
    'npm',
    ['pack', '--json', '--pack-destination', parent_directory],
    repo_directory,
    {
      HUSKY: '0',
      npm_config_cache: npm_cache_directory,
    },
  );
  const pack_result = parsePackResult(stdout);

  return join(parent_directory, pack_result[0].filename);
}

/**
 * @param {string} consumer_directory
 */
async function createConsumerProject(consumer_directory) {
  await mkdir(consumer_directory, { recursive: true });

  await writeFile(
    join(consumer_directory, 'package.json'),
    createConsumerPackageJsonText(),
  );
  await writeFile(
    join(consumer_directory, 'index.ts'),
    createConsumerIndexText(),
  );
  await writeFile(
    join(consumer_directory, 'tsconfig.json'),
    createConsumerTsconfigText(),
  );
}

/**
 * @param {string} consumer_directory
 * @param {string} tarball_path
 */
async function installTarball(consumer_directory, tarball_path) {
  const npm_cache_directory = join(consumer_directory, '.npm-cache');

  await mkdir(npm_cache_directory, { recursive: true });

  await runCommand(
    'npm',
    ['install', '--ignore-scripts', '--no-package-lock', tarball_path],
    consumer_directory,
    {
      npm_config_cache: npm_cache_directory,
    },
  );
}

/**
 * @param {string} consumer_directory
 */
async function importPackedCli(consumer_directory) {
  await runCommand(
    'node',
    [
      '--input-type=module',
      '--eval',
      "await import('./node_modules/patram/bin/patram.js')",
    ],
    consumer_directory,
  );
}

/**
 * @param {string} consumer_directory
 */
async function importPackedLibrary(consumer_directory) {
  await runCommand(
    'node',
    [
      '--input-type=module',
      '--eval',
      [
        "const package_module = await import('patram');",
        "if (typeof package_module.extractTaggedFencedBlocks !== 'function') {",
        "  throw new Error('Expected extractTaggedFencedBlocks export.');",
        '}',
        "if (typeof package_module.loadProjectGraph !== 'function') {",
        "  throw new Error('Expected loadProjectGraph export.');",
        '}',
        "if (typeof package_module.parseWhereClause !== 'function') {",
        "  throw new Error('Expected parseWhereClause export.');",
        '}',
        "if (typeof package_module.queryGraph !== 'function') {",
        "  throw new Error('Expected queryGraph export.');",
        '}',
        "if (typeof package_module.getQuerySemanticDiagnostics !== 'function') {",
        "  throw new Error('Expected getQuerySemanticDiagnostics export.');",
        '}',
      ].join('\n'),
    ],
    consumer_directory,
  );
}

/**
 * @param {string} tarball_path
 */
async function assertTarballIncludesDeclarations(tarball_path) {
  const { stdout } = await runCommand(
    'tar',
    ['-tf', tarball_path],
    repo_directory,
  );

  expect(stdout).toContain('package/lib/patram.d.ts');
  expect(stdout).toContain('package/lib/load-project-graph.d.ts');
  expect(stdout).toContain('package/lib/query-graph.d.ts');
  expect(stdout).not.toContain('package/lib/patram.test.d.ts');
  expect(stdout).not.toContain('package/lib/build-graph.test.d.ts');
}

/**
 * @param {string} consumer_directory
 */
async function typecheckPackedLibrary(consumer_directory) {
  await runCommand(
    'node',
    [join(repo_directory, 'node_modules/typescript/bin/tsc'), '-p', '.'],
    consumer_directory,
  );
}

async function assertGeneratedDeclarationsAreCleared() {
  await access(join(repo_directory, 'lib/patram.d.ts'));
  await expect(
    access(join(repo_directory, 'lib/load-project-graph.d.ts')),
  ).rejects.toThrow();
  await expect(
    access(join(repo_directory, 'lib/query-graph.d.ts')),
  ).rejects.toThrow();
}

/**
 * @param {string} stdout
 * @returns {{ filename: string }[]}
 */
function parsePackResult(stdout) {
  const json_start = stdout.indexOf('[');

  if (json_start < 0) {
    throw new Error(`Expected npm pack JSON output.\n${stdout}`);
  }

  const json_text = stdout.slice(json_start).trim();
  const json_end = json_text.lastIndexOf(']');

  if (json_end < 0) {
    throw new Error(`Expected npm pack JSON array.\n${stdout}`);
  }

  return JSON.parse(json_text.slice(0, json_end + 1));
}

/**
 * Creates a temporary directory for the package smoke test.
 */
async function createTempDirectory() {
  return mkdtemp(join(tmpdir(), 'patram-package-install-'));
}

/**
 * Builds the consumer package manifest fixture.
 */
function createConsumerPackageJsonText() {
  return `${JSON.stringify(
    {
      name: 'patram-smoke-test-consumer',
      private: true,
      type: 'module',
    },
    null,
    2,
  )}\n`;
}

/**
 * Builds the consumer TypeScript entrypoint fixture.
 */
function createConsumerIndexText() {
  return [
    createConsumerImportText(),
    '',
    createConsumerGraphText(),
    '',
    createConsumerQueryText(),
    '',
    createConsumerDiagnosticText(),
    '',
    "const load_result: Promise<PatramProjectGraphResult> = loadProjectGraph('.');",
    'void load_result;',
    '',
    "const query_result: PatramQueryResult = queryGraph(graph, '$id=@node_id', repo_config, {",
    "  bindings: { node_id: 'doc:index.md' },",
    '});',
    'void query_result;',
    'void diagnostic;',
    '',
  ].join('\n');
}

/**
 * Builds the consumer import fixture text.
 */
function createConsumerImportText() {
  return [
    'import {',
    '  getQuerySemanticDiagnostics,',
    '  loadProjectGraph,',
    '  parseWhereClause,',
    '  queryGraph,',
    '  type PatramBuildGraphResult,',
    '  type PatramDiagnostic,',
    '  type PatramGraphEdge,',
    '  type PatramGraphNode,',
    '  type PatramParseWhereClauseResult,',
    '  type PatramParsedExpression,',
    '  type PatramProjectGraphResult,',
    '  type PatramQuerySource,',
    '  type PatramQueryResult,',
    '  type PatramRepoConfig,',
    "} from 'patram';",
  ].join('\n');
}

/**
 * Builds the consumer graph fixture text.
 */
function createConsumerGraphText() {
  return [
    "const graph_node: PatramGraphNode = { id: 'doc:index.md' };",
    'const graph_edge: PatramGraphEdge = {',
    '  from: graph_node.id,',
    "  id: 'edge:doc:index.md:defines:term:graph',",
    '  origin: {',
    "    path: 'index.md',",
    '    line: 1,',
    '    column: 1,',
    '  },',
    "  relation: 'defines',",
    "  to: 'term:graph',",
    '};',
    '',
    'const graph: PatramBuildGraphResult = {',
    '  edges: [graph_edge],',
    '  nodes: {',
    '    [graph_node.id]: graph_node,',
    '  },',
    '};',
  ].join('\n');
}

/**
 * Builds the consumer query fixture text.
 */
function createConsumerQueryText() {
  return [
    'const repo_config: PatramRepoConfig = {',
    '  fields: {},',
    '  include: [],',
    '  queries: {},',
    '  relations: {},',
    '};',
    '',
    "const query_source: PatramQuerySource = { kind: 'ad_hoc' };",
    '',
    "const parse_result: PatramParseWhereClauseResult = parseWhereClause('$id=@node_id', {",
    "  bindings: { node_id: 'doc:index.md' },",
    '});',
    '',
    'if (parse_result.success) {',
    '  const parsed_expression: PatramParsedExpression = parse_result.expression;',
    '  const diagnostics: PatramDiagnostic[] = getQuerySemanticDiagnostics(',
    '    repo_config,',
    '    query_source,',
    '    parsed_expression,',
    '  );',
    '  void diagnostics;',
    '} else {',
    '  void parse_result.diagnostic;',
    '}',
  ].join('\n');
}

/**
 * Builds the consumer diagnostic fixture text.
 */
function createConsumerDiagnosticText() {
  return [
    'const diagnostic: PatramDiagnostic = {',
    "  code: 'example',",
    '  column: 1,',
    "  level: 'error',",
    '  line: 1,',
    "  message: 'Example diagnostic',",
    "  path: 'index.md',",
    '};',
  ].join('\n');
}

/**
 * Builds the consumer TypeScript config fixture.
 */
function createConsumerTsconfigText() {
  return `${JSON.stringify(
    {
      compilerOptions: {
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        noEmit: true,
        target: 'ES2023',
      },
      include: ['index.ts'],
    },
    null,
    2,
  )}\n`;
}

/**
 * @param {string} command
 * @param {string[]} command_arguments
 * @param {string} working_directory
 * @param {NodeJS.ProcessEnv} [environment]
 */
async function runCommand(
  command,
  command_arguments,
  working_directory,
  environment,
) {
  return exec_file(command, command_arguments, {
    cwd: working_directory,
    env: {
      ...process.env,
      ...environment,
    },
  });
}
