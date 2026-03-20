import { expect, it } from 'vitest';

import { resolveOutputMode } from './resolve-output-mode.js';

it('uses json when explicitly requested', () => {
  expect(
    resolveOutputMode(
      {
        color_mode: 'auto',
        command_arguments: [],
        command_name: 'query',
        output_mode: 'json',
      },
      {
        is_tty: false,
        no_color: false,
        term: 'xterm-256color',
      },
    ),
  ).toEqual({
    color_enabled: false,
    renderer_name: 'json',
  });
});

it('uses plain output by default when stdout is not a tty', () => {
  expect(
    resolveOutputMode(
      {
        color_mode: 'auto',
        command_arguments: [],
        command_name: 'query',
        output_mode: 'default',
      },
      {
        is_tty: false,
        no_color: false,
        term: 'xterm-256color',
      },
    ),
  ).toEqual({
    color_enabled: false,
    renderer_name: 'plain',
  });
});

it('uses rich output by default on a tty', () => {
  expect(
    resolveOutputMode(
      {
        color_mode: 'auto',
        command_arguments: [],
        command_name: 'query',
        output_mode: 'default',
      },
      {
        is_tty: true,
        no_color: false,
        term: 'xterm-256color',
      },
    ),
  ).toEqual({
    color_enabled: true,
    renderer_name: 'rich',
  });
});

it('uses plain output when explicitly requested', () => {
  expect(
    resolveOutputMode(
      {
        color_mode: 'auto',
        command_arguments: [],
        command_name: 'query',
        output_mode: 'plain',
      },
      {
        is_tty: true,
        no_color: false,
        term: 'xterm-256color',
      },
    ),
  ).toEqual({
    color_enabled: false,
    renderer_name: 'plain',
  });
});

it('disables color in rich mode when NO_COLOR is set', () => {
  expect(
    resolveOutputMode(
      {
        color_mode: 'auto',
        command_arguments: [],
        command_name: 'query',
        output_mode: 'default',
      },
      {
        is_tty: true,
        no_color: true,
        term: 'xterm-256color',
      },
    ),
  ).toEqual({
    color_enabled: false,
    renderer_name: 'rich',
  });
});

it('disables color in rich mode for TERM=dumb', () => {
  expect(
    resolveOutputMode(
      {
        color_mode: 'auto',
        command_arguments: [],
        command_name: 'query',
        output_mode: 'default',
      },
      {
        is_tty: true,
        no_color: false,
        term: 'dumb',
      },
    ),
  ).toEqual({
    color_enabled: false,
    renderer_name: 'rich',
  });
});

it('forces color when --color=always is used in rich mode', () => {
  expect(
    resolveOutputMode(
      {
        color_mode: 'always',
        command_arguments: [],
        command_name: 'query',
        output_mode: 'default',
      },
      {
        is_tty: true,
        no_color: true,
        term: 'dumb',
      },
    ),
  ).toEqual({
    color_enabled: true,
    renderer_name: 'rich',
  });
});

it('disables color when --no-color is used in rich mode', () => {
  expect(
    resolveOutputMode(
      {
        color_mode: 'never',
        command_arguments: [],
        command_name: 'query',
        output_mode: 'default',
      },
      {
        is_tty: true,
        no_color: false,
        term: 'xterm-256color',
      },
    ),
  ).toEqual({
    color_enabled: false,
    renderer_name: 'rich',
  });
});
