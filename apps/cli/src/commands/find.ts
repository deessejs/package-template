/**
 * `package-cli docs find <query>` — symbol lookup.
 *
 * Stubbed: parses args, validates them, then errors with
 * `InternalError` ("not implemented") until Phase 3 lands.
 *
 * Spec: `docs/cli/commands/find.md`.
 */

import { InternalError, UserError } from '../errors.js';
import type { SubcommandRegist } from './shared.js';

export const register: SubcommandRegist = (parent, _ctx) => {
  parent
    .command('find <query>')
    .description('Find symbols whose title contains <query>')
    .action((query: string) => {
      if (query.length === 0) {
        throw new UserError('find requires a <query> argument');
      }
      throw new InternalError('find is not implemented yet');
    });
};
