/**
 * @import { MetadataFieldConfig } from './load-patram-config.types.ts';
 */

import { isPathLikeTarget } from './claim-helpers.js';

/**
 * @param {MetadataFieldConfig} type_definition
 * @param {string} directive_value
 * @returns {boolean}
 */
export function isDirectiveValueValid(type_definition, directive_value) {
  if (directive_value.length === 0) {
    return false;
  }

  switch (type_definition.type) {
    case 'string':
      return true;
    case 'integer':
      return /^-?\d+$/du.test(directive_value);
    case 'path':
      return isPathLikeTarget(directive_value);
    case 'glob':
      return true;
    case 'date':
      return isValidDateValue(directive_value);
    case 'date_time':
      return isValidDateTimeValue(directive_value);
    default:
      throw new Error(`Unsupported directive type "${type_definition.type}".`);
  }
}

/**
 * @param {string} directive_name
 * @param {Exclude<MetadataFieldConfig['type'], 'enum'>} type_name
 * @returns {string}
 */
export function getInvalidTypeMessage(directive_name, type_name) {
  switch (type_name) {
    case 'string':
      return `Directive "${directive_name}" must be a non-empty string.`;
    case 'integer':
      return `Directive "${directive_name}" must be a base-10 integer.`;
    case 'path':
      return `Directive "${directive_name}" must be a path-like string.`;
    case 'glob':
      return `Directive "${directive_name}" must be a non-empty glob string.`;
    case 'date':
      return `Directive "${directive_name}" must use YYYY-MM-DD.`;
    case 'date_time':
      return `Directive "${directive_name}" must use YYYY-MM-DD HH:MM.`;
    default:
      throw new Error(`Unsupported directive type "${type_name}".`);
  }
}

/**
 * @param {string[]} values
 * @returns {string}
 */
export function formatQuotedList(values) {
  return values.map((value) => `"${value}"`).join(', ');
}

/**
 * @param {string} directive_value
 * @returns {boolean}
 */
function isValidDateValue(directive_value) {
  const date_match = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/du.exec(
    directive_value,
  );

  if (!date_match?.groups) {
    return false;
  }

  return isRealCalendarDate(
    Number(date_match.groups.year),
    Number(date_match.groups.month),
    Number(date_match.groups.day),
  );
}

/**
 * @param {string} directive_value
 * @returns {boolean}
 */
function isValidDateTimeValue(directive_value) {
  const date_time_match =
    /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2}) (?<hour>\d{2}):(?<minute>\d{2})$/du.exec(
      directive_value,
    );

  if (!date_time_match?.groups) {
    return false;
  }

  const hour = Number(date_time_match.groups.hour);
  const minute = Number(date_time_match.groups.minute);

  if (hour > 23 || minute > 59) {
    return false;
  }

  return isRealCalendarDate(
    Number(date_time_match.groups.year),
    Number(date_time_match.groups.month),
    Number(date_time_match.groups.day),
  );
}

/**
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {boolean}
 */
function isRealCalendarDate(year, month, day) {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const candidate_date = new Date(Date.UTC(year, month - 1, day));

  return (
    candidate_date.getUTCFullYear() === year &&
    candidate_date.getUTCMonth() === month - 1 &&
    candidate_date.getUTCDate() === day
  );
}
