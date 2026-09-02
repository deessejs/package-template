/**
 * Shared helpers for subcommand modules.
 *
 * Each subcommand module exports a `register()` function that wires
 * itself into the `docs` parent command. This file holds the shared
 * signature so the modules can be loaded uniformly.
 */

import type { Command } from 'commander';

/**
 * The context every subcommand needs: the resolved corpus root and
 * any future shared state (logger, cache handle, etc.).
 *
 * Today this is just the root path. As Phase 1 lands it will gain the
 * loaded `Corpus`.
 */
export interface CommandContext {
  readonly corpusRoot: string;
}

/**
 * A subcommand module exports a single `register` function. The
 * function attaches the subcommand to the parent `docs` program.
 */
export type SubcommandRegist = (parent: Command, ctx: CommandContext) => void;
