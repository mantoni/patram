import { afterEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create_stored_query_definition_mock: vi.fn(() => ({
    cypher: 'MATCH (n:Task) RETURN n',
  })),
  create_updated_stored_query_definition_mock: vi.fn(() => ({
    cypher: "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
  })),
  ensure_raw_queries_mock: vi.fn(() => ({})),
  load_patram_config_mock: vi.fn(),
  load_raw_config_mock: vi.fn(),
  persist_stored_query_mutation_mock: vi.fn(),
  raw_query_value_to_record_mock: vi.fn(() => ({ description: 'raw' })),
}));

vi.mock('./load-patram-config.js', () => ({
  loadPatramConfig: mocks.load_patram_config_mock,
}));

vi.mock('./manage-stored-queries-helpers.js', () => ({
  createStoredQueryDefinition: mocks.create_stored_query_definition_mock,
  createUpdatedStoredQueryDefinition:
    mocks.create_updated_stored_query_definition_mock,
  ensureRawQueries: mocks.ensure_raw_queries_mock,
  loadRawConfig: mocks.load_raw_config_mock,
  persistStoredQueryMutation: mocks.persist_stored_query_mutation_mock,
  rawQueryValueToRecord: mocks.raw_query_value_to_record_mock,
}));

import { manageStoredQueries } from './manage-stored-queries.js';

afterEach(() => {
  Object.values(mocks).forEach((mock_value) => {
    mock_value.mockReset();
  });
  mocks.create_stored_query_definition_mock.mockReturnValue({
    cypher: 'MATCH (n:Task) RETURN n',
  });
  mocks.create_updated_stored_query_definition_mock.mockReturnValue({
    cypher: "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
  });
  mocks.ensure_raw_queries_mock.mockReturnValue({});
  mocks.raw_query_value_to_record_mock.mockReturnValue({
    description: 'raw',
  });
});

it('returns load diagnostics before mutating stored queries', async () => {
  mocks.load_patram_config_mock.mockResolvedValue({
    config: null,
    diagnostics: [{ code: 'config.invalid' }],
  });

  await expect(
    manageStoredQueries('/repo', {
      action: 'add',
      name: 'ready',
      cypher: 'MATCH (n:Task) RETURN n',
    }),
  ).resolves.toEqual({
    diagnostics: [{ code: 'config.invalid' }],
    success: false,
  });
});

it('throws when config loading succeeds without a config object', async () => {
  mocks.load_patram_config_mock.mockResolvedValue({
    config: null,
    diagnostics: [],
  });

  await expect(
    manageStoredQueries('/repo', {
      action: 'add',
      name: 'ready',
      cypher: 'MATCH (n:Task) RETURN n',
    }),
  ).rejects.toThrow('Expected a valid Patram repo config.');
});

it('adds stored queries when the name is new', async () => {
  /** @type {Record<string, { cypher: string, description?: string }>} */
  const raw_queries = {};

  mocks.load_patram_config_mock.mockResolvedValue({
    config: {
      include: ['docs/**/*.md'],
      queries: {},
    },
    diagnostics: [],
  });
  mocks.load_raw_config_mock.mockResolvedValue({
    success: true,
    value: {},
  });
  mocks.ensure_raw_queries_mock.mockReturnValue(raw_queries);
  mocks.persist_stored_query_mutation_mock.mockResolvedValue({
    success: true,
    value: {
      action: 'added',
      name: 'ready',
    },
  });

  await expect(
    manageStoredQueries('/repo', {
      action: 'add',
      description: 'Show ready tasks.',
      name: 'ready',
      cypher: "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
    }),
  ).resolves.toEqual({
    success: true,
    value: {
      action: 'added',
      name: 'ready',
    },
  });
  expect(mocks.create_stored_query_definition_mock).toHaveBeenCalledWith(
    "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
    'Show ready tasks.',
  );
  expect(raw_queries.ready).toEqual({
    cypher: 'MATCH (n:Task) RETURN n',
  });
});

it('rejects duplicate add and missing remove names', async () => {
  mocks.load_patram_config_mock.mockResolvedValue({
    config: {
      include: ['docs/**/*.md'],
      queries: {
        ready: {
          cypher: 'MATCH (n:Task) RETURN n',
        },
      },
    },
    diagnostics: [],
  });
  mocks.load_raw_config_mock.mockResolvedValue({
    success: true,
    value: {},
  });

  await expect(
    manageStoredQueries('/repo', {
      action: 'add',
      name: 'ready',
      cypher: "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
    }),
  ).resolves.toEqual({
    error: {
      code: 'message',
      message: 'Stored query already exists: ready.',
    },
    success: false,
  });

  await expect(
    manageStoredQueries('/repo', {
      action: 'remove',
      name: 'missing',
    }),
  ).resolves.toEqual({
    error: {
      code: 'unknown_stored_query',
      name: 'missing',
    },
    success: false,
  });
});

it('removes stored queries when the name exists', async () => {
  /** @type {Record<string, { cypher: string, description?: string }>} */
  const raw_queries = {
    ready: {
      cypher: 'MATCH (n:Task) RETURN n',
    },
  };

  mocks.load_patram_config_mock.mockResolvedValue({
    config: {
      include: ['docs/**/*.md'],
      queries: {
        ready: {
          cypher: 'MATCH (n:Task) RETURN n',
        },
      },
    },
    diagnostics: [],
  });
  mocks.load_raw_config_mock.mockResolvedValue({
    success: true,
    value: {},
  });
  mocks.ensure_raw_queries_mock.mockReturnValue(raw_queries);
  mocks.persist_stored_query_mutation_mock.mockResolvedValue({
    success: true,
    value: {
      action: 'removed',
      name: 'ready',
    },
  });

  await expect(
    manageStoredQueries('/repo', {
      action: 'remove',
      name: 'ready',
    }),
  ).resolves.toEqual({
    success: true,
    value: {
      action: 'removed',
      name: 'ready',
    },
  });
  expect(raw_queries.ready).toBeUndefined();
});

it('rejects conflicting stored query renames', async () => {
  mocks.load_patram_config_mock.mockResolvedValue({
    config: {
      include: ['docs/**/*.md'],
      queries: {
        blocked: {
          description: 'Show blocked tasks.',
          cypher: "MATCH (n:Task) WHERE n.status = 'blocked' RETURN n",
        },
        ready: {
          cypher: "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
        },
      },
    },
    diagnostics: [],
  });
  mocks.load_raw_config_mock.mockResolvedValue({
    success: true,
    value: {},
  });

  await expect(
    manageStoredQueries('/repo', {
      action: 'update',
      name: 'blocked',
      next_name: 'ready',
    }),
  ).resolves.toEqual({
    error: {
      code: 'message',
      message: 'Stored query already exists: ready.',
    },
    success: false,
  });
});

it('updates stored queries', async () => {
  /** @type {Record<string, { cypher: string, description?: string }>} */
  const raw_queries = {
    blocked: {
      description: 'Show blocked tasks.',
      cypher: "MATCH (n:Task) WHERE n.status = 'blocked' RETURN n",
    },
  };

  mockBlockedQueryConfig();
  mocks.ensure_raw_queries_mock.mockReturnValue(raw_queries);
  mocks.persist_stored_query_mutation_mock.mockResolvedValue({
    success: true,
    value: {
      action: 'updated',
      name: 'done',
      previous_name: 'blocked',
    },
  });

  await expect(
    manageStoredQueries('/repo', {
      action: 'update',
      description: '',
      name: 'blocked',
      next_name: 'done',
      cypher: "MATCH (n:Task) WHERE n.status = 'done' RETURN n",
    }),
  ).resolves.toEqual({
    success: true,
    value: {
      action: 'updated',
      name: 'done',
      previous_name: 'blocked',
    },
  });
  expect(mocks.raw_query_value_to_record_mock).toHaveBeenCalledWith({
    description: 'Show blocked tasks.',
    cypher: "MATCH (n:Task) WHERE n.status = 'blocked' RETURN n",
  });
  expect(mocks.create_updated_stored_query_definition_mock).toHaveBeenCalled();
  expect(raw_queries.blocked).toBeUndefined();
  expect(raw_queries.done).toEqual({
    cypher: "MATCH (n:Task) WHERE n.status = 'ready' RETURN n",
  });
});

it('returns raw-config diagnostics', async () => {
  mocks.load_patram_config_mock.mockResolvedValue({
    config: {
      include: ['docs/**/*.md'],
      queries: {},
    },
    diagnostics: [],
  });
  mocks.load_raw_config_mock.mockResolvedValue({
    diagnostic: { code: 'config.invalid_json' },
    success: false,
  });

  await expect(
    manageStoredQueries('/repo', {
      action: 'add',
      name: 'ready',
      cypher: 'MATCH (n:Task) RETURN n',
    }),
  ).resolves.toEqual({
    diagnostics: [{ code: 'config.invalid_json' }],
    success: false,
  });
});

it('returns missing update errors', async () => {
  mocks.load_patram_config_mock.mockResolvedValue({
    config: {
      include: ['docs/**/*.md'],
      queries: {},
    },
    diagnostics: [],
  });
  mocks.load_raw_config_mock.mockResolvedValue({
    success: true,
    value: {},
  });

  await expect(
    manageStoredQueries('/repo', {
      action: 'update',
      name: 'missing',
      cypher: 'MATCH (n:Task) RETURN n',
    }),
  ).resolves.toEqual({
    error: {
      code: 'unknown_stored_query',
      name: 'missing',
    },
    success: false,
  });
});

function mockBlockedQueryConfig() {
  mocks.load_patram_config_mock.mockResolvedValue({
    config: {
      include: ['docs/**/*.md'],
      queries: {
        blocked: {
          description: 'Show blocked tasks.',
          cypher: "MATCH (n:Task) WHERE n.status = 'blocked' RETURN n",
        },
      },
    },
    diagnostics: [],
  });
  mocks.load_raw_config_mock.mockResolvedValue({
    success: true,
    value: {},
  });
}
