# `<CLI> docs`: Internal Architecture

Architecture documents for the `<CLI> docs` command-line interface. Read
these before modifying the CLI or adding a subcommand.

`<CLI>` is a placeholder for the npm package name, which is decided when
the workspace is scaffolded. The shape documented here doesn't depend on
the name.

This is **internal contributor documentation** for the CLI's code, not
end-user documentation of the binary. End-user docs (the manual) will
live in `apps/cli/README.md` once the CLI is scaffolded.

## Vision

`<CLI> docs` is a single-purpose command-line interface that reads a
**corpus of `.docs.md` files** and exposes it in agent- and
human-friendly forms:

- **Listing** what's available (`ls`).
- **Resolving** a name to a path (`path`).
- **Reading** a file or a named symbol within it (`cat`).
- **Searching** by symbol (`find`, `symbols`).
- **Searching** by free text (`grep`).

The binary is invoked as `<CLI> docs <command> [args] [flags]`. It's
installed via npm (`npx <CLI> docs …` or a global install) and runs
locally. There's no daemon, no server, no network call.

### Audience

Two users, in order of priority:

1. **LLM agents** that need to ground their answers in the project's
   documentation. The output format is deliberately parseable: flat
   tables, one symbol per row, paths that resolve directly. An agent
   should be able to consume the output with no post-processing.
2. **Human contributors** exploring the docs corpus. The same commands
   serve them. They'll use `ls`, `cat`, and `find` more often than
   agents will.

### Why a CLI rather than a web API or library

- **Local-first.** No server to deploy, no auth to manage, no rate
  limit. Works offline.
- **Composable.** Plays well with shell pipelines and with code that
  shells out (`child_process.execFileSync`).
- **Stable surface.** Once shipped, the subcommands form a contract.
  Library APIs drift; CLI flags and exit codes are visible and
  reviewable in the diff.
- **Cheap to scaffold.** A Node CLI with a single `bin` field is the
  smallest publishable unit in this template.

### What this isn't

To keep the scope honest, the following are explicitly out:

- **Not a documentation server.** No `<CLI> docs serve`, no HTTP API, no
  MCP. If we need that later, it goes in a separate binary.
- **Not a documentation generator.** The CLI doesn't write docs,
  doesn't validate them, doesn't lint them. (Vale already covers prose
  linting in CI.)
- **Not a documentation renderer.** The CLI returns markdown. It
  doesn't produce HTML, ANSI-coloured output, or anything else.
  Terminal pager responsibility is delegated to the user (`| less`).
- **Not a documentation search engine.** No fuzzy matching, no ranking,
  no relevance scoring. `find` is exact; `grep` is substring.
- **Not a multi-corpus tool.** One corpus per invocation. The path is
  configurable (see `04-corpus.md`), but the CLI doesn't merge or
  cross-reference corpora.

### Success criteria

A first release of `<CLI> docs` is successful when:

1. `npx <CLI> docs ls <path>` returns a newline-separated list of
   relative file paths.
2. `npx <CLI> docs cat <symbol>` returns the markdown of the file
   hosting that symbol, or a non-zero exit code if no such symbol
   exists.
3. `npx <CLI> docs find <query>` returns a table with the columns
   `Symbol · Source · Path`, one row per match.
4. `npx <CLI> docs grep <pattern>` returns the matching lines with
   `<file>:<line>:<text>` format.
5. `npx <CLI> docs path <file>` returns a single path, or a non-zero
   exit code.
6. `npx <CLI> docs symbols` returns the full symbol index, one per
   line.
7. The CLI installs and runs on Node ≥ 22 (matching the repo's
   `engines.node`).
8. Exit codes are documented and stable: `0` on success, `1` on a
   user error (missing symbol, bad path), `2` on an internal error
   (corpus unreadable).

These eight points are the **acceptance test** for the first
implementation milestone. See `06-roadmap.md` for phasing.

## Read in order

1. [`02-design.md`](./02-design.md): the six subcommands at a glance,
   output conventions, the `.docs.md` format, and the decisions that
   shaped them. Per-command detail lives in
   [`commands/`](./commands/); read the relevant one when you start
   implementing or modifying a subcommand.
2. [`03-architecture.md`](./03-architecture.md): modules, types, data
   flow, argv parsing, error model.
3. [`04-corpus.md`](./04-corpus.md): where the corpus comes from, how
   it's indexed, and the option chosen (A / B / C).
4. [`05-testing.md`](./05-testing.md): what's tested, fixtures, and the
   boundary between unit and end-to-end tests.
5. [`06-roadmap.md`](./06-roadmap.md): implementation phases, their
   dependencies, and exit criteria.

## Status

This documentation describes a CLI that hasn't been scaffolded yet.
It's the design contract that implementation must satisfy. Changes to
the CLI that diverge from these documents should land **with** an
update to the relevant document in the same PR.

## Conventions

- English only.
- Code blocks use the language tag explicitly (` ```ts `, not ` ``` `).
- Internal links are relative.
- The numbered prefix on filenames is for reading order, not for any
  sort order enforced by tooling.
