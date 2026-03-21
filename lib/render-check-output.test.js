import { Ansis } from 'ansis';
import { expect, it } from 'vitest';

import {
  renderCheckDiagnostics,
  renderCheckSuccess,
} from './render-check-output.js';

it('renders document headers and aligns the diagnostic code column in plain mode', () => {
  expect(
    renderCheckDiagnostics(createDocumentDiagnostics(), {
      color_enabled: false,
      renderer_name: 'plain',
    }),
  ).toBe(
    'document docs/patram.md\n' +
      '  3:5  error  Same message.   graph.link_broken\n' +
      '  10:5  error  Same message.  graph.edge_missing_to\n' +
      '\n' +
      '\u2716 2 problems (2 errors, 0 warnings)\n',
  );
});

it('renders file headers for non-indexed files in plain mode', () => {
  expect(
    renderCheckDiagnostics(
      [
        {
          code: 'config.not_found',
          column: 1,
          level: 'error',
          line: 1,
          message: 'Config file ".patram.json" was not found.',
          path: '.patram.json',
        },
      ],
      {
        color_enabled: false,
        renderer_name: 'plain',
      },
    ),
  ).toBe(
    'file .patram.json\n' +
      '  1:1  error  Config file ".patram.json" was not found.  config.not_found\n' +
      '\n' +
      '\u2716 1 problem (1 error, 0 warnings)\n',
  );
});

it('uses the shared accent color for document headers and renders locations and codes gray in rich mode', () => {
  const ansi = new Ansis(3);
  const rich_output = renderCheckDiagnostics(createDocumentDiagnostics(), {
    color_enabled: true,
    renderer_name: 'rich',
  });

  expect(ansi.strip(rich_output)).toBe(
    renderCheckDiagnostics(createDocumentDiagnostics(), {
      color_enabled: false,
      renderer_name: 'plain',
    }),
  );
  expect(rich_output).toContain(ansi.green('document docs/patram.md'));
  expect(rich_output).toContain(ansi.gray('3:5'));
  expect(rich_output).toContain(ansi.gray('graph.link_broken'));
});

it('renders the rich success summary detail line in gray', () => {
  expect(
    renderCheckSuccess(2, {
      color_enabled: true,
      renderer_name: 'rich',
    }),
  ).toBe(
    `${new Ansis(3).green('Check passed.')}\n${new Ansis(3).gray('Scanned 2 files. Found 0 errors.')}\n`,
  );
});

/**
 * @returns {Array<{ code: string, column: number, level: 'error', line: number, message: string, path: string }>}
 */
function createDocumentDiagnostics() {
  return [
    {
      code: 'graph.link_broken',
      column: 5,
      level: 'error',
      line: 3,
      message: 'Same message.',
      path: 'docs/patram.md',
    },
    {
      code: 'graph.edge_missing_to',
      column: 5,
      level: 'error',
      line: 10,
      message: 'Same message.',
      path: 'docs/patram.md',
    },
  ];
}
