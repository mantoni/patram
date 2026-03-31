import { expect, it } from 'vitest';

import {
  formatCompactMetadataLabel,
  formatCompactTitleRow,
  getCompactLeftTitleWidth,
  wrapCompactBodyText,
} from './compact-layout.js';

it('formats compact metadata labels and left-title widths', () => {
  expect(getCompactLeftTitleWidth([])).toBe(0);
  expect(getCompactLeftTitleWidth(['a', 'longer'])).toBe(6);
  expect(formatCompactMetadataLabel([])).toBeUndefined();
  expect(formatCompactMetadataLabel(['status: ready', 'kind: task'])).toBe(
    '[status: ready  kind: task]',
  );
});

it('formats compact title rows for plain output', () => {
  expect(
    formatCompactTitleRow({
      left_title: 'left',
      left_title_width: 4,
    }),
  ).toBe('left');
  expect(
    formatCompactTitleRow({
      left_title: 'left',
      left_title_width: 6,
      right_title: 'right',
    }),
  ).toBe('left  right');
  expect(
    formatCompactTitleRow({
      format_left: (text) => `<${text}>`,
      format_right: (text) => `(${text})`,
      left_title: 'left',
      left_title_width: 4,
      right_title: 'right',
    }),
  ).toBe('<left>  (right)');
});

it('formats compact title rows for tty truncation edge cases', () => {
  expect(
    formatCompactTitleRow({
      is_tty: true,
      left_title: 'left',
      left_title_width: 6,
      right_title: 'right',
      terminal_width: 7,
    }),
  ).toBe('left  …');
  expect(
    formatCompactTitleRow({
      is_tty: true,
      left_title: 'left',
      left_title_width: 6,
      right_title: '[right-title]',
      terminal_width: 11,
    }),
  ).toBe('left  [ri…]');
  expect(
    formatCompactTitleRow({
      is_tty: true,
      left_title: 'left',
      left_title_width: 6,
      right_title: 'right-title',
      terminal_width: 8,
    }),
  ).toBe('left  r…');
});

it('retains a closing bracket while truncating bracketed tty right parts', () => {
  expect(
    formatCompactTitleRow({
      is_tty: true,
      left_title: 'left',
      left_title_width: 6,
      right_title: '[right-title]',
      terminal_width: 12,
    }),
  ).toBe('left  [rig…]');
  expect(
    formatCompactTitleRow({
      is_tty: true,
      left_title: 'left',
      left_title_width: 6,
      right_title: '[right-title]',
      terminal_width: 13,
    }),
  ).toBe('left  [righ…]');
});

it('wraps compact body text only in tty output and preserves blank lines', () => {
  expect(wrapCompactBodyText('alpha\nbeta')).toEqual(['alpha', 'beta']);
  expect(
    wrapCompactBodyText('alpha beta\n\nomega', {
      is_tty: true,
      terminal_width: 8,
    }),
  ).toEqual(['alpha ', 'beta', '', 'omega']);
});

it('derives compact body width from the indent in tty output', () => {
  expect(
    wrapCompactBodyText('alpha beta', {
      is_tty: true,
      terminal_width: 10,
    }),
  ).toEqual(['alpha ', 'beta']);
  expect(
    wrapCompactBodyText('aa bb cc', {
      body_indent: '    ',
      is_tty: true,
      terminal_width: 8,
    }),
  ).toEqual(['aa ', 'bb ', 'cc']);
});
