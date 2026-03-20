import { execFile as execFileCallback } from 'node:child_process';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { symlink } from 'node:fs/promises';

import { afterEach, expect, it } from 'vitest';

import {
  cleanupTestContext,
  createBlockedTaskSource,
  createBrokenLinkSource,
  createDecisionSource,
  createIoContext,
  createTaskSource,
  createTempProjectDirectory,
  createTestContext,
  createValidLinkSource,
  stripAnsi,
  writeProjectConfig,
  writeProjectFile,
  writeShowProject,
} from './patram.test-helpers.js';
import { main } from './patram.js';

const execFile = promisify(execFileCallback);
const test_context = createTestContext();

afterEach(async () => {
  await cleanupTestContext(test_context);
});

it('prints config diagnostics for check failures', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  const exit_code = await main(['check', test_context.project_directory], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([
    '.patram.json:1:1 error config.not_found Config file ".patram.json" was not found.\n',
  ]);
  expect(io_context.stdout_chunks).toEqual([]);
});

it('prints broken link diagnostics for check failures', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  await writeProjectFile(
    test_context.project_directory,
    'docs/patram.md',
    createBrokenLinkSource(),
  );

  const exit_code = await main(['check', test_context.project_directory], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([
    'docs/patram.md:3:5 error graph.link_broken Document link target "docs/missing.md" was not found.\n',
  ]);
});

it('defaults check to the current working directory and exits 0 on valid input', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  await writeProjectFile(
    test_context.project_directory,
    'docs/patram.md',
    createValidLinkSource(),
  );
  await writeProjectFile(
    test_context.project_directory,
    'docs/guide.md',
    '# Guide\n',
  );
  process.chdir(test_context.project_directory);

  const exit_code = await main(['check'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([]);
});

it('prints matching nodes for query --where', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  await writeProjectFile(
    test_context.project_directory,
    'docs/tasks/v0/query-command.md',
    createTaskSource('pending'),
  );
  await writeProjectFile(
    test_context.project_directory,
    'docs/tasks/v0/show-command.md',
    createBlockedTaskSource(),
  );
  await writeProjectFile(
    test_context.project_directory,
    'docs/decisions/query-language-v0.md',
    createDecisionSource(),
  );
  process.chdir(test_context.project_directory);

  const exit_code = await main(
    ['query', '--where', 'kind=task and status=pending'],
    {
      stderr: io_context.stderr,
      stdout: io_context.stdout,
    },
  );

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([
    'Implement query command\n' +
      'docs/tasks/v0/query-command.md\n' +
      'kind: task  status: pending\n',
  ]);
});

it('runs a stored query by name', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  await writeProjectFile(
    test_context.project_directory,
    'docs/tasks/v0/query-command.md',
    createTaskSource('pending'),
  );
  await writeProjectFile(
    test_context.project_directory,
    'docs/tasks/v0/show-command.md',
    createBlockedTaskSource(),
  );
  process.chdir(test_context.project_directory);

  const exit_code = await main(['query', 'pending'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([
    'Implement query command\n' +
      'docs/tasks/v0/query-command.md\n' +
      'kind: task  status: pending\n',
  ]);
});

it('prints stored queries', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  process.chdir(test_context.project_directory);

  const exit_code = await main(['queries'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([
    'blocked kind=task and status=blocked\n' +
      'pending kind=task and status=pending\n',
  ]);
});

it('prints resolved source and links for show', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  await writeShowProject(test_context.project_directory);
  process.chdir(test_context.project_directory);

  const exit_code = await main(['show', 'docs/patram.md'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([
    '# Patram\n' +
      '\n' +
      'See [Some Guide][1], [Query Language v0][2], and [Implement query command][3].\n' +
      '\n' +
      '----------------\n' +
      '[1] Some Guide\n' +
      '    docs/guide.md\n' +
      '[2] Query Language v0\n' +
      '    docs/decisions/query-language-v0.md\n' +
      '    kind: decision  status: accepted\n' +
      '[3] Implement query command\n' +
      '    docs/tasks/v0/query-command.md\n' +
      '    kind: task  status: pending\n',
  ]);
});

it('prints show results as json', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  await writeProjectFile(
    test_context.project_directory,
    'docs/patram.md',
    createValidLinkSource(),
  );
  await writeProjectFile(
    test_context.project_directory,
    'docs/guide.md',
    '# Some Guide\n',
  );
  process.chdir(test_context.project_directory);

  const exit_code = await main(['show', 'docs/patram.md', '--json'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([
    '{\n' +
      '  "source": "# Patram\\n\\nSee [guide](./guide.md).",\n' +
      '  "resolved_links": [\n' +
      '    {\n' +
      '      "reference": 1,\n' +
      '      "label": "Some Guide",\n' +
      '      "target": {\n' +
      '        "title": "Some Guide",\n' +
      '        "path": "docs/guide.md"\n' +
      '      }\n' +
      '    }\n' +
      '  ]\n' +
      '}\n',
  ]);
});

it('reports a missing show file on stderr', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  process.chdir(test_context.project_directory);

  const exit_code = await main(['show', 'docs/missing.md'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([
    'docs/missing.md:1:1 error show.file_not_found File "docs/missing.md" was not found.\n',
  ]);
  expect(io_context.stdout_chunks).toEqual([]);
});

it('prints query results as json', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  await writeProjectFile(
    test_context.project_directory,
    'docs/tasks/v0/query-command.md',
    createTaskSource('pending'),
  );
  process.chdir(test_context.project_directory);

  const exit_code = await main(
    ['query', '--where', 'kind=task and status=pending', '--json'],
    {
      stderr: io_context.stderr,
      stdout: io_context.stdout,
    },
  );

  expect(exit_code).toBe(0);
  expect(io_context.stderr_chunks).toEqual([]);
  expect(io_context.stdout_chunks).toEqual([
    '{\n' +
      '  "results": [\n' +
      '    {\n' +
      '      "id": "doc:docs/tasks/v0/query-command.md",\n' +
      '      "kind": "task",\n' +
      '      "title": "Implement query command",\n' +
      '      "path": "docs/tasks/v0/query-command.md",\n' +
      '      "status": "pending"\n' +
      '    }\n' +
      '  ]\n' +
      '}\n',
  ]);
});

it('prints rich query results by default on a tty', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext(true);
  const original_no_color = process.env.NO_COLOR;
  const original_term = process.env.TERM;

  await writeProjectConfig(test_context.project_directory);
  await writeProjectFile(
    test_context.project_directory,
    'docs/tasks/v0/query-command.md',
    createTaskSource('pending'),
  );
  process.chdir(test_context.project_directory);

  delete process.env.NO_COLOR;
  process.env.TERM = 'xterm-256color';

  try {
    const exit_code = await main(
      ['query', '--where', 'kind=task and status=pending'],
      {
        stderr: io_context.stderr,
        stdout: io_context.stdout,
      },
    );

    expect(exit_code).toBe(0);
    expect(io_context.stderr_chunks).toEqual([]);
    expect(stripAnsi(io_context.stdout_chunks.join(''))).toBe(
      'Implement query command\n' +
        'docs/tasks/v0/query-command.md\n' +
        'kind: task  status: pending\n',
    );
    expect(io_context.stdout_chunks.join('')).toContain('\u001B[');
  } finally {
    if (original_no_color === undefined) {
      delete process.env.NO_COLOR;
    } else {
      process.env.NO_COLOR = original_no_color;
    }

    if (original_term === undefined) {
      delete process.env.TERM;
    } else {
      process.env.TERM = original_term;
    }
  }
});

it('rejects an unknown stored query name', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  process.chdir(test_context.project_directory);

  const exit_code = await main(['query', 'missing'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([
    'Stored query "missing" was not found.\n',
  ]);
  expect(io_context.stdout_chunks).toEqual([]);
});

it('rejects query without a where clause or query name', async () => {
  const io_context = createIoContext();

  const exit_code = await main(['query'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([
    'Query requires "--where" or a stored query name.\n',
  ]);
  expect(io_context.stdout_chunks).toEqual([]);
});

it('rejects query with an empty where clause', async () => {
  const io_context = createIoContext();

  const exit_code = await main(['query', '--where'], {
    stderr: io_context.stderr,
    stdout: io_context.stdout,
  });

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([
    'Query requires a where clause.\n',
  ]);
  expect(io_context.stdout_chunks).toEqual([]);
});

it('prints query diagnostics for invalid where clauses', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const io_context = createIoContext();

  await writeProjectConfig(test_context.project_directory);
  await writeProjectFile(
    test_context.project_directory,
    'docs/tasks/v0/query-command.md',
    createTaskSource('pending'),
  );
  process.chdir(test_context.project_directory);

  const exit_code = await main(
    ['query', '--where', 'kind=task or status=done'],
    {
      stderr: io_context.stderr,
      stdout: io_context.stdout,
    },
  );

  expect(exit_code).toBe(1);
  expect(io_context.stderr_chunks).toEqual([
    '<query>:1:11 error query.invalid Unsupported query token "or".\n',
  ]);
  expect(io_context.stdout_chunks).toEqual([]);
});

it('runs the CLI when invoked through a symlinked executable path', async () => {
  test_context.project_directory = await createTempProjectDirectory();
  const executable_path = join(test_context.project_directory, 'patram');

  await symlink(join(import.meta.dirname, 'patram.js'), executable_path);

  await expect(
    execFile(executable_path, ['nope'], {
      encoding: 'utf8',
    }),
  ).rejects.toMatchObject({
    code: 1,
    stderr: 'Unknown command.\n',
    stdout: '',
  });
});
