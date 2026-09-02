/**
 * Corpus types and loader.
 *
 * Implementation lives in Phase 1 of `docs/cli/06-roadmap.md`. For
 * now we export the shapes the rest of the code consumes and stub the
 * loader so the wiring can be exercised end to end.
 *
 * Documented in `docs/cli/03-architecture.md#core-types` and
 * `docs/cli/04-corpus.md`.
 */

/** A single docs file in the corpus. */
export interface DocsFile {
  /** Path relative to the corpus root, always POSIX-style. */
  readonly path: string;
  /** Canonical name from frontmatter `title`. */
  readonly title: string;
  /** Source from frontmatter `source` (for example "@scope/core"). */
  readonly source: string;
  /** Raw markdown body (frontmatter stripped). */
  readonly body: string;
}

/** The corpus as a whole. */
export interface Corpus {
  readonly root: string;
  readonly files: ReadonlyMap<string, DocsFile>; // keyed by path
  readonly symbols: ReadonlyMap<string, DocsFile>; // keyed by title
}

import { InternalError } from './errors.js';

/**
 * Load a corpus from the given root directory. Stubbed until Phase 1
 * lands. Throws `InternalError` if the root is missing.
 */
export async function loadCorpus(root: string): Promise<Corpus> {
  throw new InternalError(`corpus loading is not implemented yet (requested root: ${root})`);
}

/**
 * Resolve the corpus root from the CLI flags, environment, and
 * default. Stubbed until Phase 1 lands.
 */
export async function resolveCorpusRoot(override?: string): Promise<string> {
  const env = process.env['DOCS_CORPUS'];
  const root = override ?? env ?? '<corpus root not yet resolved>';
  return root;
}
