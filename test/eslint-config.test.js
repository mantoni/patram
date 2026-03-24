import { expect, it } from 'vitest';

import eslint_config from '../eslint.config.js';

it('disables the jsdoc require-jsdoc rule for javascript files', () => {
  const rule_value = getJavaScriptRuleValue();

  expect(rule_value).toBe('off');
});

/**
 * Get the `jsdoc/require-jsdoc` rule value for JavaScript files in this repo.
 */
function getJavaScriptRuleValue() {
  for (const config_entry of eslint_config) {
    if (!('files' in config_entry) || !Array.isArray(config_entry.files)) {
      continue;
    }

    if (!config_entry.files.includes('**/*.js')) {
      continue;
    }

    if (!('rules' in config_entry) || config_entry.rules == null) {
      break;
    }

    return /** @type {Record<string, unknown>} */ (config_entry.rules)[
      'jsdoc/require-jsdoc'
    ];
  }

  throw new Error('Expected a JavaScript ESLint config entry.');
}
