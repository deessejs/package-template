/**
 * `package-cli docs symbols` — list every symbol in the corpus.
 *
 * Stubbed: takes no args, errors with `InternalError`
 * ("not implemented") until Phase 3 lands.
 *
 * Spec: `docs/cli/commands/symbols.md`.
 */

import { InternalError } from '../errors.js';
import type { SubcommandRegist } from './shared.js';

export const register: SubcommandRegist = (parent, _ctx) => {
  parent
    .command('symbols')
    .description('List every symbol in the corpus')
    .action(() => {
      throw new InternalError('symbols is not implemented yet');
    });
};
