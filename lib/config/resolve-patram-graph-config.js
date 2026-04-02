/**
 * @import { PatramConfig } from './patram-config.types.ts';
 * @import { PatramRepoConfig } from './load-patram-config.types.ts';
 */

/**
 * Normalize the loaded repo config for graph materialization.
 *
 * @param {PatramRepoConfig} repo_config
 * @returns {PatramConfig}
 */
export function resolvePatramGraphConfig(repo_config) {
  return {
    ...repo_config,
  };
}
