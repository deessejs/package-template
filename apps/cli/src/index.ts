#!/usr/bin/env node
import { Command } from 'commander';

const VERSION = '0.0.0';

const program = new Command();
program
  .name('package-cli')
  .description('CLI for the package-template docs corpus')
  .version(VERSION);

program
  .command('docs')
  .description('Subcommands for browsing the docs corpus (not implemented yet)')
  .action(() => {
    console.error('[error] the "docs" subcommand is not implemented yet');
    process.exit(2);
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('[error]', message);
  process.exit(2);
});
