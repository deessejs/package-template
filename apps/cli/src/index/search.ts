/**
 * Search operations over the in-memory index.
 *
 * Implementation lands in Phase 3 of `docs/cli/06-roadmap.md`. The
 * shapes match `docs/cli/03-architecture.md#core-types` so the rest
 * of the code can compile against them today.
 */

import type { Corpus, DocsFile } from '../corpus.js';
import { InternalError } from '../errors.js';

/** A row returned by `find`. */
export interface SymbolMatch {
  readonly symbol: string;
  readonly source: string;
  readonly path: string;
}

/** A row returned by `grep`. */
export interface TextMatch {
  readonly path: string;
  readonly line: number;
  readonly text: string;
}

/**
 * Substring-match against symbol titles. Stubbed until Phase 3.
 */
export async function findSymbols(_corpus: Corpus, _query: string): Promise<SymbolMatch[]> {
  throw new InternalError('find is not implemented yet');
}

/**
 * Substring search across file bodies. Stubbed until Phase 3.
 */
export async function grepCorpus(_corpus: Corpus, _pattern: string): Promise<TextMatch[]> {
  throw new InternalError('grep is not implemented yet');
}

/**
 * List every symbol in the corpus, alphabetically. Stubbed until
 * Phase 3.
 */
export async function listSymbols(_corpus: Corpus): Promise<string[]> {
  throw new InternalError('symbols is not implemented yet');
}

/** Unused export to silence the linter about the bare type. */
export type { DocsFile };
