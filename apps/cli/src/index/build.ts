/**
 * Build the in-memory inverted index from a `Corpus`.
 *
 * Implementation lands in Phase 3 of `docs/cli/06-roadmap.md`. The
 * shape matches `docs/cli/03-architecture.md#core-types` so the rest
 * of the code can compile against it today.
 *
 * Behaviour when called: throws `InternalError` ("not implemented").
 * The build is lazy (triggered on the first call that needs it).
 */

import type { Corpus, DocsFile } from '../corpus.js';
import { InternalError } from '../errors.js';
import { writeWarning } from '../output.js';

/**
 * Build the symbol map from a corpus. Throws `InternalError` until
 * Phase 3 implements the indexer.
 */
export async function buildIndex(_corpus: Corpus): Promise<ReadonlyMap<string, DocsFile>> {
  throw new InternalError('index builder is not implemented yet');
}

/**
 * Track and report duplicate symbols. Phase 3 will wire this into
 * `buildIndex` so that the later file wins and the earlier one
 * emits a `[warn]`. The function exists now so the warning format
 * is fixed and tests can pin it.
 */
export function reportDuplicateSymbol(loser: DocsFile, winner: DocsFile): void {
  writeWarning(`duplicate symbol "${loser.title}" in ${loser.path}; ${winner.path} wins`);
}
