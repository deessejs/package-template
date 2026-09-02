# 3. Architecture

How the code is organised. This document is the source of truth for
module boundaries, types, and data flow. If implementation disagrees,
update this document in the same PR.

## High-level shape

```
apps/cli/
├── src/
│   ├── index.ts             # shebang entry, argv parsing, dispatch
│   ├── cli.ts               # command registration, error wrapping
│   ├── corpus.ts            # loadCorpus(), listFiles(), readFile()
│   ├── index/
│   │   ├── build.ts         # in-memory inverted index, symbols
│   │   └── search.ts        # find(), grep() over the index
│   ├── commands/
│   │   ├── ls.ts
│   │   ├── cat.ts
│   │   ├── grep.ts
│   │   ├── find.ts
│   │   ├── path.ts
│   │   └── symbols.ts
│   ├── output.ts            # stdout/stderr/exit-code contract
│   └── errors.ts            # typed errors, exit-code mapping
├── bin/
│   └── vgpu.mjs             # shebang + re-export of src/index.ts
├── tests/
│   ├── corpus.test.ts
│   ├── commands/            # one test file per command
│   └── fixtures/
│       └── corpus/          # small .docs.md corpus for tests
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── eslint.config.js
└── vitest.config.ts
```

This mirrors the shape of `packages/example/` and `apps/web/`, so
`adding-a-workspace.md` applies directly.

## Module responsibilities

| Module                | Owns                                                                      | Does not own                          |
| --------------------- | ------------------------------------------------------------------------- | ------------------------------------- |
| `src/index.ts`        | argv parsing, command dispatch                                            | business logic, formatting            |
| `src/cli.ts`          | command registration table, top-level error handler                       | argv conventions per command          |
| `src/corpus.ts`       | reading the corpus from disk, validating frontmatter                      | searching, formatting                 |
| `src/index/build.ts`  | building the in-memory inverted index                                     | reading files (delegates to `corpus`) |
| `src/index/search.ts` | querying the index, producing result shapes                               | rendering results to text             |
| `src/commands/*.ts`   | per-command shape: parse its own args, call corpus + index, format output | knowing about other commands          |
| `src/output.ts`       | writing records to stdout, errors to stderr, exit codes                   | producing records                     |
| `src/errors.ts`       | error classes, exit-code mapping                                          | recovery (no automatic retry)         |

## Core types

```ts
// A single docs file in the corpus.
export interface DocsFile {
  /** Path relative to the corpus root, always POSIX-style ("/" separators). */
  readonly path: string;
  /** Canonical name from frontmatter `title`. */
  readonly title: string;
  /** Source from frontmatter `source` (e.g. "@vgpu/web"). */
  readonly source: string;
  /** Raw markdown body (frontmatter stripped). */
  readonly body: string;
}

// The corpus as a whole.
export interface Corpus {
  readonly root: string;
  readonly files: ReadonlyMap<string, DocsFile>; // keyed by path
  readonly symbols: ReadonlyMap<string, DocsFile>; // keyed by title
}

// A row returned by `find`.
export interface SymbolMatch {
  readonly symbol: string;
  readonly source: string;
  readonly path: string;
}

// A row returned by `grep`.
export interface TextMatch {
  readonly path: string;
  readonly line: number;
  readonly text: string;
}

// Exit codes.
export const ExitCode = {
  Success: 0,
  UserError: 1,
  InternalError: 2,
} as const;
export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode];

// Typed errors.
export class UserError extends Error {
  readonly exit: ExitCode = ExitCode.UserError;
}
export class InternalError extends Error {
  readonly exit: ExitCode = ExitCode.InternalError;
}
```

These types live in `src/corpus.ts`, `src/index/search.ts`, and
`src/errors.ts` respectively. Other modules import them.

## Data flow

For every command, the flow is the same:

```
argv  →  command(args)  →  Corpus (loaded once, cached)
                          →  indexer (built once, cached)
                          →  query
                          →  result rows
                          →  output formatter
                          →  stdout (records) + stderr (warnings)
                          →  process.exit(ExitCode)
```

Two caches live in module scope:

- **Corpus cache.** The corpus is read from disk the first time any
  command needs it, then held in memory. There is no watch mode; the
  cache is invalidated only on process exit.
- **Index cache.** The inverted index is built lazily on the first
  `find`/`grep`/`symbols` call, then held in memory.

If the corpus is large enough that this hurts, the next iteration can
add a `--no-cache` flag and a streaming mode. Not now.

## argv parsing

We use **`commander`**, not `yargs` or `process.argv` slicing:

- Battle-tested.
- Generates `--help` automatically.
- TypeScript types are first-class.
- Plays well with subcommands (`vgpu docs <command>` is a nested
  commander program).

The argv shape is:

```
vgpu [global flags] docs <command> [command args] [command flags]
```

Global flags (`--corpus`, `--help`, `--version`) are registered on the
top-level program. Per-command flags are registered on the subcommand.
**Per-command flags are off by default in the first release** — see
`02-design.md`.

## Output contract

`src/output.ts` exposes three functions:

```ts
export function writeRecords(rows: Iterable<string>): void;
export function writeWarning(message: string): void;
export function exitWithError(err: unknown): never;
```

- `writeRecords` writes each row followed by `\n` to stdout. No
  trailing blank line, no header.
- `writeWarning` writes `[warn] <message>\n` to stderr. Used for
  recoverable issues (e.g. a malformed frontmatter in one file).
- `exitWithError` inspects the error's `exit` property (or falls back
  to `InternalError`), prints `[error] <message>\n` to stderr, and
  calls `process.exit`.

Commands return `void` on success; on failure they throw and let the
top-level handler in `src/cli.ts` call `exitWithError`. This keeps
command modules free of `process.exit` calls and makes them easier to
test.

## Error model

Two error classes is enough:

- **`UserError`** — the caller did something wrong (unknown symbol,
  path outside the corpus, malformed query). Exit code `1`. The
  message should be a one-liner that tells the user what to fix.
- **`InternalError`** — something broke that the user can't fix
  (corpus unreadable, malformed frontmatter that prevents indexing).
  Exit code `2`. The message should include enough context for a bug
  report.

Anything thrown that is neither a `UserError` nor an `InternalError`
is treated as an `InternalError` with the original error attached.

## Performance expectations

The CLI is sized for a corpus of **a few hundred `.docs.md` files**.
Concretely:

- Cold start (corpus load + index build): under 500 ms on a developer
  laptop for a 500-file corpus.
- `find` over 5000 symbols: under 50 ms.
- `grep` over 500 files: under 200 ms.

These are aspirational — they guide the choice of in-memory index and
the lazy-build pattern. They are not enforced by tests in the first
release.

## What the CLI does **not** own

To prevent scope creep:

- **No configuration file.** No `.vgpurc`, no `vgpu.config.ts`. Flags
  only.
- **No plugin system.** Adding a subcommand is a code change, not a
  config change.
- **No caching across invocations.** Each `npx vgpu docs …` call
  starts fresh. In-memory caching within one invocation is enough.
- **No telemetry.** Nothing phones home.
