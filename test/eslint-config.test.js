import { expect, it } from 'vitest';

import eslint_config from '../eslint.config.js';
import package_json from '../package.json' with { type: 'json' };

it('disables the jsdoc require-jsdoc rule for javascript files', () => {
  const rule_value = getJavaScriptRuleValue();

  expect(rule_value).toBe('off');
});

it('enables typed linting for javascript files through project service', () => {
  const project_service_value = getJavaScriptProjectServiceValue();

  expect(project_service_value).toEqual({
    allowDefaultProject: ['lib/find-close-match.js', 'lib/patram.js'],
  });
});

it('enables typed linting for typescript files through project service', () => {
  const project_service_value = getTypeScriptProjectServiceValue();

  expect(project_service_value).toEqual({
    allowDefaultProject: ['lib/find-close-match.js', 'lib/patram.js'],
  });
});

it('includes the typescript-eslint recommended rules', () => {
  expect(hasConfiguredRule('@typescript-eslint/no-unused-vars')).toBe(true);
});

it('includes the typescript-eslint recommended typed rules', () => {
  expect(hasConfiguredRule('@typescript-eslint/await-thenable')).toBe(true);
});

it('configures typescript-eslint naming conventions for function values and variables', () => {
  expect(
    getConfiguredRuleValue('@typescript-eslint/naming-convention'),
  ).toEqual([
    'error',
    {
      format: ['camelCase'],
      selector: 'variable',
      types: ['function'],
    },
    {
      format: ['camelCase'],
      selector: 'function',
    },
    {
      format: ['snake_case', 'UPPER_CASE'],
      selector: 'variable',
    },
  ]);
});

it('uses a typescript version supported by typescript-eslint', () => {
  expect(package_json.devDependencies.typescript).toBe('^5.9.3');
});

it('does not disable typescript-eslint rules in repo config entries', () => {
  expect(findDisabledTypeScriptEslintRules()).toEqual([]);
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

/**
 * Get the `parserOptions.projectService` value for JavaScript files in this
 * repo.
 */
function getJavaScriptProjectServiceValue() {
  return getProjectServiceValueForFileGlob('**/*.js');
}

/**
 * Get the `parserOptions.projectService` value for TypeScript files in this
 * repo.
 */
function getTypeScriptProjectServiceValue() {
  return getProjectServiceValueForFileGlob('**/*.ts');
}

/**
 * @param {string} file_glob
 */
function getProjectServiceValueForFileGlob(file_glob) {
  for (const config_entry of eslint_config) {
    if (!('files' in config_entry) || !Array.isArray(config_entry.files)) {
      continue;
    }

    if (!config_entry.files.includes(file_glob)) {
      continue;
    }

    if (
      !('languageOptions' in config_entry) ||
      config_entry.languageOptions == null
    ) {
      continue;
    }

    const parser_options = /** @type {{ parserOptions?: object }} */ (
      config_entry.languageOptions
    ).parserOptions;

    if (parser_options == null || !('projectService' in parser_options)) {
      continue;
    }

    return /** @type {{ projectService: unknown }} */ (parser_options)
      .projectService;
  }

  throw new Error(
    `Expected an ESLint config entry with project service enabled for ${file_glob}.`,
  );
}

/**
 * @param {string} rule_name
 */
function hasConfiguredRule(rule_name) {
  return getConfiguredRuleValue(rule_name) !== undefined;
}

/**
 * @param {string} rule_name
 */
function getConfiguredRuleValue(rule_name) {
  for (const config_entry of eslint_config) {
    if (!('rules' in config_entry) || config_entry.rules == null) {
      continue;
    }

    const rule_value = /** @type {Record<string, unknown>} */ (
      config_entry.rules
    )[rule_name];

    if (rule_value !== undefined) {
      return rule_value;
    }
  }

  return undefined;
}

function findDisabledTypeScriptEslintRules() {
  /** @type {string[]} */
  const disabled_rules = [];

  for (const config_entry of eslint_config) {
    if (!('rules' in config_entry) || config_entry.rules == null) {
      continue;
    }

    for (const [rule_name, rule_value] of Object.entries(config_entry.rules)) {
      if (!rule_name.startsWith('@typescript-eslint/')) {
        continue;
      }

      if (ruleValueStartsOff(rule_value)) {
        disabled_rules.push(rule_name);
      }
    }
  }

  return disabled_rules;
}

/**
 * @param {unknown} rule_value
 */
function ruleValueStartsOff(rule_value) {
  if (rule_value === 'off') {
    return true;
  }

  return Array.isArray(rule_value) && rule_value[0] === 'off';
}
