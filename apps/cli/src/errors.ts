/**
 * Exit codes for the CLI. Documented in `docs/cli/02-design.md#exit-codes`.
 *
 *   0  Success, including "no match" cases
 *   1  User error (unknown symbol, bad path, ambiguous match)
 *   2  Internal error (corpus unreadable, malformed frontmatter)
 */
export const ExitCode = {
  Success: 0,
  UserError: 1,
  InternalError: 2,
} as const;

export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode];

/**
 * Caller did something wrong. Exit code 1. The message should be a
 * one-liner that tells the user what to fix.
 */
export class UserError extends Error {
  readonly exit: ExitCode = ExitCode.UserError;
}

/**
 * Something broke that the user can't fix. Exit code 2. The message
 * should include enough context for a bug report.
 */
export class InternalError extends Error {
  readonly exit: ExitCode = ExitCode.InternalError;
}

/**
 * Inspect an error's `exit` property (or fall back to `InternalError`),
 * print `[error] <message>` to stderr, and call `process.exit`.
 *
 * Used by the top-level handler in `src/cli.ts`. Command modules throw
 * instead of calling this directly so they're easier to test.
 */
export function exitWithError(err: unknown): never {
  const e =
    err instanceof UserError || err instanceof InternalError
      ? err
      : new InternalError(err instanceof Error ? err.message : String(err));
  console.error(`[error] ${e.message}`);
  process.exit(e.exit);
}
