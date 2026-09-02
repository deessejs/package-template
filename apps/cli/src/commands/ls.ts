/**
 * `package-cli docs ls <path>` — list `.docs.md` files under a path.
 *
 * Stubbed: parses args, validates them, then errors with
 * `InternalError` ("not implemented") until Phase 2 lands.
 *
 * Spec: `docs/cli/commands/ls.md`.
 */

import { InternalError, UserError } from '../errors.js';
import type { SubcommandRegist } from './shared.js';

export const register: SubcommandRegist = (parent, _ctx) => {
  parent
    .command('ls <path>')
    .description('List .docs.md files under a corpus path')
    .action((path: string) => {
      if (path.length === 0) {
        throw new UserError('ls requires a <path> argument');
      }
      throw new InternalError('ls is not implemented yet');
    });
};
