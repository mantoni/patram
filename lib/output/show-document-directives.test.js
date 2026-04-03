/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * @import { PatramRepoConfig } from '../config/load-patram-config.types.ts';
 * @import { PatramClaim } from '../parse/parse-claims.types.ts';
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { resolvePatramGraphConfig } from '../config/resolve-patram-graph-config.js';
import { buildGraph } from '../graph/build-graph.js';
import { createParseOptions, parseSourceFile } from '../parse/parse-claims.js';

import { loadShowOutput } from './show-document.js';

/** @type {string | null} */
let project_directory = null;

afterEach(async () => {
  if (project_directory) {
    await rm(project_directory, { force: true, recursive: true });
    project_directory = null;
  }
});

it('renders markdown directive list-item references inline and includes them in resolved links', async () => {
  project_directory = await mkdtemp(join(tmpdir(), 'patram-show-document-'));

  await writeDirectiveProjectFiles(project_directory, {
    'docs/decisions/check-command.md': createDirectiveListSource(),
    'docs/roadmap/v0-dogfood.md': createRoadmapSource(),
  });

  await expect(
    loadDirectiveShowOutput(
      'docs/decisions/check-command.md',
      project_directory,
      {
        'docs/decisions/check-command.md': createDirectiveListSource(),
        'docs/roadmap/v0-dogfood.md': createRoadmapSource(),
      },
    ),
  ).resolves.toEqual({
    success: true,
    value: {
      incoming_summary: {},
      path: 'docs/decisions/check-command.md',
      rendered_source: createDirectiveListRenderedSource(),
      resolved_links: [createExpectedDirectiveResolvedLink(5)],
      source: createDirectiveListSource(),
    },
  });
});

it('renders visible directive references as section footnotes', async () => {
  project_directory = await mkdtemp(join(tmpdir(), 'patram-show-document-'));

  await writeDirectiveProjectFiles(project_directory, {
    'docs/contracts/release-flow.md': createVisibleDirectiveSource(),
    'docs/roadmap/v0-dogfood.md': createRoadmapSource(),
  });

  await expect(
    loadDirectiveShowOutput(
      'docs/contracts/release-flow.md',
      project_directory,
      {
        'docs/contracts/release-flow.md': createVisibleDirectiveSource(),
        'docs/roadmap/v0-dogfood.md': createRoadmapSource(),
      },
    ),
  ).resolves.toEqual({
    success: true,
    value: {
      incoming_summary: {},
      path: 'docs/contracts/release-flow.md',
      rendered_source: createVisibleDirectiveRenderedSource(),
      resolved_links: [createExpectedDirectiveResolvedLink(3)],
      source: createVisibleDirectiveSource(),
    },
  });
});

/**
 * @param {string} file_path
 * @param {string} directory_path
 * @param {Record<string, string>} source_by_path
 */
async function loadDirectiveShowOutput(
  file_path,
  directory_path,
  source_by_path,
) {
  const repo_config = createShowDirectiveRepoConfig();
  const project_claims = createProjectClaims(repo_config, source_by_path);
  const graph = buildGraph(
    resolvePatramGraphConfig(repo_config),
    project_claims,
  );

  return loadShowOutput(file_path, directory_path, graph, {
    project_claims,
    repo_config,
  });
}

/**
 * @returns {PatramRepoConfig}
 */
function createShowDirectiveRepoConfig() {
  return {
    fields: {
      kind: {
        type: 'string',
      },
      status: {
        type: 'enum',
        values: ['accepted', 'active'],
      },
      tracked_in: {
        to: 'roadmap',
        type: 'ref',
      },
    },
    include: ['docs/**/*.md'],
    queries: {},
    types: {
      contract: {
        in: ['docs/contracts/**/*.md'],
      },
      decision: {
        in: ['docs/decisions/**/*.md'],
      },
      roadmap: {
        in: ['docs/roadmap/**/*.md'],
      },
    },
  };
}

/**
 * @param {PatramRepoConfig} repo_config
 * @param {Record<string, string>} source_by_path
 * @returns {PatramClaim[]}
 */
function createProjectClaims(repo_config, source_by_path) {
  /** @type {PatramClaim[]} */
  const claims = [];
  const parse_options = createParseOptions(repo_config);

  for (const [path, source] of Object.entries(source_by_path)) {
    claims.push(...parseSourceFile({ path, source }, parse_options).claims);
  }

  return claims;
}

/**
 * @param {string} directory_path
 * @param {Record<string, string>} source_by_path
 */
async function writeDirectiveProjectFiles(directory_path, source_by_path) {
  for (const [file_path, source_text] of Object.entries(source_by_path)) {
    const absolute_path = join(directory_path, file_path);

    await mkdir(join(absolute_path, '..'), { recursive: true });
    await writeFile(absolute_path, source_text);
  }
}

function createDirectiveListSource() {
  return [
    '# Check Command Proposal',
    '',
    '- kind: decision',
    '- status: accepted',
    '- tracked_in: docs/roadmap/v0-dogfood.md',
    '',
    '- v0 validates paths.',
  ].join('\n');
}

function createDirectiveListRenderedSource() {
  return [
    '# Check Command Proposal',
    '',
    '- kind: decision',
    '- status: accepted',
    '- tracked_in: docs/roadmap/v0-dogfood.md',
    '  -> roadmap docs/roadmap/v0-dogfood.md  (status=active)',
    '     V0 Dogfood',
    '',
    '- v0 validates paths.',
  ].join('\n');
}

function createVisibleDirectiveSource() {
  return [
    '# Release Flow',
    '',
    'tracked_in: docs/roadmap/v0-dogfood.md',
    '',
    'Keep the output contract aligned.',
  ].join('\n');
}

function createVisibleDirectiveRenderedSource() {
  return [
    '# Release Flow',
    '',
    'tracked_in: docs/roadmap/v0-dogfood.md[^1]',
    '',
    'Keep the output contract aligned.',
    '',
    '[^1] roadmap docs/roadmap/v0-dogfood.md  (status=active)',
    '    V0 Dogfood',
  ].join('\n');
}

function createRoadmapSource() {
  return ['# V0 Dogfood', '', '- kind: roadmap', '- status: active'].join('\n');
}

/**
 * @param {number} line_number
 * @returns {{ label: string, reference: number, source: { claim_type: 'directive', column: number, line: number, parser: string, raw_target: string }, target: { kind: string, path: string, status: string, title: string } }}
 */
function createExpectedDirectiveResolvedLink(line_number) {
  return {
    label: 'tracked_in',
    reference: 1,
    source: {
      claim_type: 'directive',
      column: 1,
      line: line_number,
      parser: 'markdown',
      raw_target: 'docs/roadmap/v0-dogfood.md',
    },
    target: {
      kind: 'roadmap',
      path: 'docs/roadmap/v0-dogfood.md',
      status: 'active',
      title: 'V0 Dogfood',
    },
  };
}
