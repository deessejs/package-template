# 1. Vision

## What this is

`vgpu docs` is a single-purpose command-line interface that reads a
**corpus of `.docs.md` files** and exposes it in agent- and
human-friendly forms:

- **Listing** what is available (`ls`).
- **Resolving** a name to a path (`path`).
- **Reading** a file or a named symbol within it (`cat`).
- **Searching** by symbol (`find`, `symbols`).
- **Searching** by free text (`grep`).

The binary is invoked as `vgpu docs <command> [args] [flags]`. It is
installed via npm (`npx vgpu docs …` or a global install) and runs
locally. There is no daemon, no server, no network call.

## Audience

Two users, in order of priority:

1. **LLM agents** that need to ground their answers in the project's
   documentation. The output format is deliberately parseable: flat
   tables, one symbol per row, paths that resolve directly. An agent
   should be able to consume the output with no post-processing.
2. **Human contributors** exploring the docs corpus. The same commands
   serve them — they will use `ls`, `cat`, and `find` more often than
   agents will.

## Why a CLI rather than a web API or library

- **Local-first.** No server to deploy, no auth to manage, no rate
  limit. Works offline.
- **Composable.** Plays well with shell pipelines and with code that
  shells out (`child_process.execFileSync`).
- **Stable surface.** Once shipped, the subcommands form a contract.
  Library APIs drift; CLI flags and exit codes are visible and
  reviewable in the diff.
- **Cheap to scaffold.** A Node CLI with a single `bin` field is the
  smallest publishable unit in this template.

## What this is **not**

To keep the scope honest, the following are explicitly out:

- **Not a documentation server.** No `vgpu docs serve`, no HTTP API, no
  MCP. If we need that later, it goes in a separate binary.
- **Not a documentation generator.** The CLI does not write docs, does
  not validate them, does not lint them. (Vale already covers prose
  linting in CI.)
- **Not a documentation renderer.** The CLI returns markdown. It does
  not produce HTML, ANSI-coloured output, or anything else. Terminal
  pager responsibility is delegated to the user (`| less`).
- **Not a documentation search engine.** No fuzzy matching, no ranking,
  no relevance scoring. `find` is exact; `grep` is substring.
- **Not a multi-corpus tool.** One corpus per invocation. The path is
  configurable (see `04-corpus.md`), but the CLI does not merge or
  cross-reference corpora.

## Success criteria

A first release of `vgpu docs` is successful when:

1. `npx vgpu docs ls <path>` returns a newline-separated list of
   relative file paths.
2. `npx vgpu docs cat <symbol>` returns the markdown of the file
   hosting that symbol, or a non-zero exit code if no such symbol
   exists.
3. `npx vgpu docs find <query>` returns a table with the columns
   `Symbol · Source · Path`, one row per match.
4. `npx vgpu docs grep <pattern>` returns the matching lines with
   `<file>:<line>:<text>` format.
5. `npx vgpu docs path <file>` returns a single path, or a non-zero
   exit code.
6. `npx vgpu docs symbols` returns the full symbol index, one per line.
7. The CLI installs and runs on Node ≥ 22 (matching the repo's
   `engines.node`).
8. Exit codes are documented and stable: `0` on success, `1` on a
   user error (missing symbol, bad path), `2` on an internal error
   (corpus unreadable).

These eight points are the **acceptance test** for the first
implementation milestone. See `06-roadmap.md` for phasing.
