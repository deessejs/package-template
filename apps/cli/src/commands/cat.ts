/**
 * `package-cli docs cat <symbol>` — print the body of a symbol's file.
 *
 * Stubbed: parses args, validates them, then errors with
 * `InternalError` ("not implemented") until Phase 2 lands.
 *
 * Spec: `docs/cli/commands/cat.md`.
 */

import { InternalError, UserError } from '../errors.js';
import type { SubcommandRegist } from './shared.js';

export const register: SubcommandRegist = (parent, _ctx) => {
  parent
    .command('cat <symbol>')
    .description('Print the markdown body of the file hosting a symbol')
    .action((symbol: string) => {
      if (symbol.length === 0) {
        throw new UserError('cat requires a <symbol> argument');
      }
      throw new InternalError('cat is not implemented yet');
    });
};
