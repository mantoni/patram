import { expect, it } from 'vitest';

import repo_config from '../.patram.json' with { type: 'json' };

const EXPECTED_REPO_CONFIG = {
  fields: {
    about_command: {
      many: true,
      to: 'command',
      type: 'ref',
    },
    blocked_by: {
      many: true,
      to: 'document',
      type: 'ref',
    },
    command: {
      hidden: true,
      on: ['command'],
      type: 'string',
    },
    decided_by: {
      many: true,
      to: 'document',
      type: 'ref',
    },
    definition: {
      on: ['term'],
      type: 'string',
    },
    implements: {
      many: true,
      to: 'document',
      type: 'ref',
    },
    implements_command: {
      many: true,
      to: 'command',
      type: 'ref',
    },
    kind: {
      type: 'enum',
      values: [
        'cli',
        'command',
        'config',
        'convention',
        'decision',
        'discovery',
        'entrypoint',
        'graph',
        'idea',
        'output',
        'parse',
        'plan',
        'release',
        'roadmap',
        'scan',
        'support',
        'task',
        'term',
      ],
    },
    status: {
      type: 'enum',
      values: [
        'accepted',
        'active',
        'blocked',
        'captured',
        'done',
        'dropped',
        'exploring',
        'in_progress',
        'pending',
        'planned',
        'proposed',
        'ready',
        'superseded',
      ],
    },
    supersedes: {
      many: true,
      to: 'document',
      type: 'ref',
    },
    summary: {
      on: ['command'],
      type: 'string',
    },
    term: {
      hidden: true,
      on: ['term'],
      type: 'string',
    },
    tracked_in: {
      many: true,
      to: 'document',
      type: 'ref',
    },
    uses_term: {
      many: true,
      to: 'term',
      type: 'ref',
    },
  },
  include: [
    'docs/**/*.md',
    'docs/**/*.yaml',
    'docs/**/*.yml',
    'bin/**/*.js',
    'lib/**/*.js',
    'scripts/**/*.js',
    'test/**/*.js',
  ],
  queries: {
    'accepted-decisions': {
      cypher: "MATCH (n:Decision) WHERE n.status = 'accepted' RETURN n",
      description: 'Show accepted decisions.',
    },
    'active-plans': {
      cypher: "MATCH (n:Plan) WHERE n.status = 'active' RETURN n",
      description: 'Show active implementation plans.',
    },
    'active-roadmaps': {
      cypher: "MATCH (n:Roadmap) WHERE n.status = 'active' RETURN n",
      description: 'Show active roadmaps.',
    },
    'blocked-tasks': {
      cypher: "MATCH (n:Task) WHERE n.status = 'blocked' RETURN n",
      description: 'Show blocked tasks.',
    },
    'command-implementations': {
      cypher:
        'MATCH (n) WHERE EXISTS { MATCH (n)-[:IMPLEMENTS_COMMAND]->(command:Command) } RETURN n',
      description: 'Show source anchors that implement documented commands.',
    },
    'command-taxonomy': {
      cypher: 'MATCH (n:Command) RETURN n',
      description: 'Show canonical command reference nodes.',
    },
    'decision-review-queue': {
      cypher: "MATCH (n:Decision) WHERE n.status = 'proposed' RETURN n",
      description: 'Show proposed decisions awaiting review.',
    },
    'decisions-needing-tasks': {
      cypher:
        "MATCH (n:Decision) WHERE n.status = 'accepted' AND COUNT { MATCH (task:Task)-[:DECIDED_BY]->(n) } = 0 RETURN n",
      description: 'Show accepted decisions that do not yet have tasks.',
    },
    'decisions-with-open-tasks': {
      cypher:
        "MATCH (n:Decision) WHERE n.status = 'accepted' AND EXISTS { MATCH (task:Task)-[:DECIDED_BY]->(n) WHERE task.status NOT IN ['done', 'dropped', 'superseded'] } RETURN n",
      description: 'Show accepted decisions with unfinished tasks.',
    },
    ideas: {
      cypher:
        "MATCH (n:Idea) WHERE n.status IN ['captured', 'exploring', 'planned'] RETURN n",
      description: 'Show captured, exploring, and planned ideas.',
    },
    'in-progress-tasks': {
      cypher: "MATCH (n:Task) WHERE n.status = 'in_progress' RETURN n",
      description: 'Show tasks currently in progress.',
    },
    'pending-tasks': {
      cypher: "MATCH (n:Task) WHERE n.status = 'pending' RETURN n",
      description: 'Show tasks that have not started yet.',
    },
    'plans-with-open-tasks': {
      cypher:
        "MATCH (n:Plan) WHERE n.status = 'active' AND EXISTS { MATCH (task:Task)-[:TRACKED_IN]->(n) WHERE task.status NOT IN ['done', 'dropped', 'superseded'] } RETURN n",
      description: 'Show active plans with unfinished tasks.',
    },
    'plans-without-decisions': {
      cypher:
        "MATCH (n:Plan) WHERE n.status = 'active' AND NOT EXISTS { MATCH (decision:Decision)-[:TRACKED_IN]->(n) } RETURN n",
      description: 'Show active plans that are missing linked decisions.',
    },
    'ready-tasks': {
      cypher: "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
      description: 'Show tasks that are ready to start.',
    },
    'source-entrypoints': {
      cypher: "MATCH (n) WHERE n.kind = 'entrypoint' RETURN n",
      description: 'Show documented entrypoint source anchors.',
    },
    'source-cli': {
      cypher: "MATCH (n) WHERE n.kind = 'cli' RETURN n",
      description: 'Show CLI-related source anchors.',
    },
    'source-config': {
      cypher: "MATCH (n) WHERE n.kind = 'config' RETURN n",
      description: 'Show config-related source anchors.',
    },
    'source-graph': {
      cypher: "MATCH (n) WHERE n.kind = 'graph' RETURN n",
      description: 'Show graph-related source anchors.',
    },
    'source-output': {
      cypher: "MATCH (n) WHERE n.kind = 'output' RETURN n",
      description: 'Show output-related source anchors.',
    },
    'source-parse': {
      cypher: "MATCH (n) WHERE n.kind = 'parse' RETURN n",
      description: 'Show parse-related source anchors.',
    },
    'source-release': {
      cypher: "MATCH (n) WHERE n.kind = 'release' RETURN n",
      description: 'Show release-related source anchors.',
    },
    'source-scan': {
      cypher: "MATCH (n) WHERE n.kind = 'scan' RETURN n",
      description: 'Show scan-related source anchors.',
    },
    'source-support': {
      cypher: "MATCH (n) WHERE n.kind = 'support' RETURN n",
      description: 'Show support source anchors.',
    },
    'term-taxonomy': {
      cypher: 'MATCH (n:Term) RETURN n',
      description: 'Show canonical term reference nodes.',
    },
    'term-usage': {
      cypher:
        'MATCH (n) WHERE EXISTS { MATCH (n)-[:USES_TERM]->(term:Term) } RETURN n',
      description: 'Show nodes that use canonical terms.',
    },
  },
  types: {
    command: {
      defined_by: 'command',
      label: 'Command',
    },
    convention: {
      in: 'docs/conventions/**/*.md',
      label: 'Convention',
    },
    decision: {
      in: 'docs/decisions/**/*.md',
      label: 'Decision',
    },
    idea: {
      in: 'docs/research/**/*.md',
      label: 'Idea',
    },
    plan: {
      in: 'docs/plans/**/*.md',
      label: 'Plan',
    },
    roadmap: {
      in: 'docs/roadmap/**/*.md',
      label: 'Roadmap',
    },
    task: {
      in: 'docs/tasks/**/*.md',
      label: 'Task',
    },
    term: {
      defined_by: 'term',
      label: 'Term',
    },
  },
};

/**
 * Repo config contract coverage.
 *
 * Verifies `.patram.json` keeps the documented repo index boundary, `types`,
 * `fields`, and stored queries.
 *
 * kind: support
 * status: active
 * tracked_in: ../docs/plans/v2/types-and-fields-config.md
 * decided_by: ../docs/decisions/types-and-fields-config.md
 * @patram
 * @see {@link ./repo-source-anchors.test.js}
 * @see {@link ../docs/decisions/types-and-fields-config.md}
 */

it('indexes repo docs and defines the documented stored queries', () => {
  expect(repo_config).toEqual(EXPECTED_REPO_CONFIG);
});
