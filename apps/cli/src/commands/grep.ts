/**
 * `package-cli docs grep <pattern>` — substring search across files.
 *
 * Stubbed: parses args, validates them, then errors with
 * `InternalError` ("not implemented") until Phase 3 lands.
 *
 * Spec: `docs/cli/commands/grep.md`.
 */

import { InternalError, UserError } from '../errors.js';
import type { SubcommandRegist } from './shared.js';

export const register: SubcommandRegist = (parent, _ctx) => {
  parent
    .command('grep <pattern>')
    .description('Substring search across the corpus')
    .action((pattern: string) => {
      if (pattern.length === 0) {
        throw new UserError('grep requires a <pattern> argument');
      }
      throw new InternalError('grep is not implemented yet');
    });
};
