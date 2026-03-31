import { expect, it } from 'vitest';

import {
  formatResolvedLinkBodyLines,
  formatResolvedLinkHeader,
} from './resolved-link-layout.js';

it('formats resolved-link headers from canonical target identity fields', () => {
  expect(
    formatResolvedLinkHeader({
      kind: 'resolved_link',
      label: 'Guide',
      reference: 3,
      target: {
        fields: {},
        id: 'decision:guide',
        kind: 'decision',
        title: 'Guide',
        visible_fields: [],
      },
    }),
  ).toBe('[3] decision decision:guide');
});

it('formats resolved-link body lines with default indentation', () => {
  expect(
    formatResolvedLinkBodyLines({
      kind: 'resolved_link',
      label: 'Guide',
      reference: 1,
      target: {
        description: 'Body text',
        fields: {},
        id: 'doc:docs/guide.md',
        kind: 'document',
        path: 'docs/guide.md',
        title: 'Guide',
        visible_fields: [],
      },
    }),
  ).toEqual(['    Guide', '    Body text']);
});

it('wraps descriptions with custom indentation in tty output and preserves blank lines', () => {
  expect(
    formatResolvedLinkBodyLines(
      {
        kind: 'resolved_link',
        label: 'Guide',
        reference: 1,
        target: {
          description: 'alpha beta\n\nomega',
          fields: {},
          id: 'doc:docs/guide.md',
          kind: 'document',
          path: 'docs/guide.md',
          title: 'Guide',
          visible_fields: [],
        },
      },
      {
        body_indent: '  ',
        is_tty: true,
        terminal_width: 8,
      },
    ),
  ).toEqual(['  Guide', '  alpha ', '  beta', '', '  omega']);
});
