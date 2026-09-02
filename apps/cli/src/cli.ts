/**
 * CLI entry point. Wires the `docs` parent command with every
 * subcommand and registers the top-level error handler.
 *
 * Documented in `docs/cli/03-architecture.md`.
 */

import { Command } from 'commander';
import * as ls from './commands/ls.js';
import * as cat from './commands/cat.js';
import * as grep from './commands/grep.js';
import * as find from './commands/find.js';
import * as path from './commands/path.js';
import * as symbols from './commands/symbols.js';
import { resolveCorpusRoot } from './corpus.js';
import { exitWithError } from './errors.js';

const VERSION = '0.0.0';

/**
 * Build the commander program, register every subcommand, and
 * resolve the corpus root before invoking commander. Exposed for
 * tests; the bin entrypoint calls `run()`.
 */
export async function buildProgram(): Promise<Command> {
  const corpusRoot = await resolveCorpusRoot();
  const ctx = { corpusRoot };

  const program = new Command();
  program
    .name('package-cli')
    .description('CLI for the package-template docs corpus')
    .version(VERSION)
    .option('--corpus <path>', 'override the default corpus location');

  const docs = program.command('docs').description('Subcommands for browsing the docs corpus');

  ls.register(docs, ctx);
  cat.register(docs, ctx);
  grep.register(docs, ctx);
  find.register(docs, ctx);
  path.register(docs, ctx);
  symbols.register(docs, ctx);

  return program;
}

/**
 * Top-level entry point: build the program, run it, and let any
 * thrown error fall through to `exitWithError`.
 */
export async function run(argv: readonly string[]): Promise<void> {
  const program = await buildProgram();
  try {
    await program.parseAsync(argv);
  } catch (err) {
    exitWithError(err);
  }
}
