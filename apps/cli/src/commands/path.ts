/**
 * `package-cli docs path <file-or-symbol>` — resolve a name to a path.
 *
 * Stubbed: parses args, validates them, then errors with
 * `InternalError` ("not implemented") until Phase 2 lands.
 *
 * Spec: `docs/cli/commands/path.md`.
 */

import { InternalError, UserError } from '../errors.js';
import type { SubcommandRegist } from './shared.js';

export const register: SubcommandRegist = (parent, _ctx) => {
  parent
    .command('path <file-or-symbol>')
    .description('Resolve a symbol or path to its canonical corpus path')
    .action((name: string) => {
      if (name.length === 0) {
        throw new UserError('path requires a <file-or-symbol> argument');
      }
      throw new InternalError('path is not implemented yet');
    });
};
