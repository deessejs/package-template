# 6. Roadmap

Implementation phases for `vgpu docs`. Each phase has an explicit exit
criterion; we do not move to the next phase until the criterion is
met.

The phases are ordered. Each phase's commit is reviewable on its own.

---

## Phase 0 — Scaffold

**Goal**: an `apps/cli/` workspace that builds, lints, and exposes a
no-op `vgpu` binary.

**Exit criterion**:

- `apps/cli/` exists with the file layout from `03-architecture.md`.
- `pnpm --filter vgpu build` succeeds.
- `pnpm --filter vgpu lint && pnpm --filter vgpu type-check && pnpm --filter vgpu test:run` succeed.
- `node apps/cli/bin/vgpu.mjs --version` prints the package version.
- `node apps/cli/bin/vgpu.mjs --help` prints a stub help screen.

---

## Phase 1 — Corpus loader

**Goal**: read the corpus from `.source/`, validate frontmatter,
produce a `Corpus` object.

**Exit criterion**:

- `loadCorpus(path)` reads `.source/`, returns a `Corpus` with
  non-empty `files` for the real corpus.
- Frontmatter is parsed; missing `title` produces an `InternalError`
  pointing at the offending file.
- Unit tests in `tests/corpus.test.ts` cover: empty corpus, missing
  directory, malformed frontmatter, happy path.
- `--corpus <path>` flag is wired.

---

## Phase 2 — Read commands (`ls`, `cat`, `path`)

**Goal**: three subcommands that read the corpus without indexing.

**Exit criterion**:

- `vgpu docs ls <path>` returns the relative paths under `<path>`.
- `vgpu docs cat <symbol>` returns the body of the file hosting
  `<symbol>`. Unknown symbol exits `1` with a one-line message.
- `vgpu docs path <symbol-or-file>` returns the path.
- Integration tests for all three pass.
- Acceptance criteria 1, 2, 5, 6 from `01-vision.md` are satisfied.

---

## Phase 3 — Indexer and search commands (`find`, `grep`, `symbols`)

**Goal**: build the inverted index, expose `find`, `grep`, `symbols`.

**Exit criterion**:

- `vgpu docs symbols` lists every title in the corpus, one per line.
- `vgpu docs find <query>` returns the
  `Symbol · Source · Path` table.
- `vgpu docs grep <pattern>` returns
  `<path>:<line>:<text>` for every matching line.
- Duplicate-symbol warnings go to stderr and do not crash.
- Integration tests for all three pass.
- Acceptance criteria 3, 4, 6 from `01-vision.md` are satisfied.

---

## Phase 4 — Polish

**Goal**: ship-ready CLI.

**Exit criterion**:

- `--help` text for every subcommand is informative (one paragraph
  plus usage line).
- All eight acceptance criteria from `01-vision.md` are met.
- Smoke test (`VGPU_SMOKE=1`) passes against the real corpus.
- Vale (`docs-lint.yml`) is green on the docs in `docs/cli/`.
- `pnpm changeset` is recorded for the first npm publish.

---

## Phase 5 — Publish

**Goal**: the CLI is on npm and installable via `npx vgpu docs …`.

**Exit criterion**:

- Changesets `release.yml` workflow publishes `@<scope>/vgpu` (or
  whatever the binary's npm name resolves to) on merge to `main`.
- `npm view @<scope>/vgpu` from a clean machine shows the package.
- `npx @<scope>/vgpu docs ls /` works against an installed copy.

---

## Dependencies between phases

```
Phase 0 ──► Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 5
                  │           │           │
                  └─── Phase 3 can start once Phase 2's `cat` proves the corpus shape.
```

`Phase 1` blocks `Phase 2` (no `Corpus`, no commands).
`Phase 2` blocks `Phase 3` (`find`/`grep` reuse `Corpus`).
`Phase 4` is the gating phase; nothing depends on `Phase 5` other than
the publish itself.

## What this roadmap does **not** promise

- **No MCP server.** A future binary, not this one.
- **No `tree` subcommand.** See `02-design.md` for why.
- **No JSON output.** See `02-design.md` for why.
- **No watch mode.** Caching within one invocation is enough; if a
  real use case appears, we add it.

If a future phase emerges that contradicts these documents, the
documents change **first**, then the code.
