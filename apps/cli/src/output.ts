/**
 * Output contract for the CLI.
 *
 * Stdout holds records (one per line). Stderr holds warnings and
 * errors. The exit code carries the rest of the signal.
 *
 * Documented in `docs/cli/03-architecture.md#output-contract`.
 */

/**
 * Write one record per line to stdout. No header, no trailing blank
 * line, no ANSI colour. Each row gets exactly one trailing `\n`.
 */
export function writeRecords(rows: Iterable<string>): void {
  for (const row of rows) {
    process.stdout.write(`${row}\n`);
  }
}

/**
 * Write a recoverable warning to stderr. Format: `[warn] <message>\n`.
 *
 * Used for issues the caller can keep going through (a malformed
 * frontmatter in one file, a duplicate symbol, etc.).
 */
export function writeWarning(message: string): void {
  console.error(`[warn] ${message}`);
}
