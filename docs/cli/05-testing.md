# 5. Testing

What we test, how, and what we explicitly don't test.

## Three layers

| Layer           | What                                            | Lives in                                      | Runs in                                      |
| --------------- | ----------------------------------------------- | --------------------------------------------- | -------------------------------------------- |
| **Unit**        | One function in isolation                       | `tests/*.test.ts`, `tests/commands/*.test.ts` | Vitest, fast, in-process                     |
| **Integration** | One command end-to-end against a fixture corpus | `tests/integration/*.test.ts`                 | Vitest, spawning the CLI binary              |
| **Smoke**       | The six subcommands against the real corpus     | `tests/smoke/*.test.ts` (or a CI-only job)    | Vitest, runs after `pnpm --filter web build` |

## Unit tests

Each module gets a co-located test file. Examples:

- `src/corpus.ts` → `tests/corpus.test.ts`. Covers: frontmatter
  parsing, path normalisation, error on missing corpus, error on
  malformed frontmatter.
- `src/index/build.ts` → `tests/index/build.test.ts`. Covers:
  building the symbol map, the duplicate-symbol warning.
- `src/index/search.ts` → `tests/index/search.test.ts`. Covers:
  exact-match `find`, substring `grep`, `symbols` listing.
- `src/output.ts` → `tests/output.test.ts`. Covers: stdout vs stderr
  separation, exit code mapping.

Unit tests use small in-memory `Corpus` instances built from fixtures
in `tests/fixtures/corpus/`. They don't touch the filesystem beyond
reading fixtures.

## Integration tests

Each command has one integration test that spawns the CLI binary
(`node bin/<CLI>.mjs …`) and asserts on stdout, stderr, and exit code.
These tests run in `tests/integration/<command>.test.ts`.

Why spawn the binary rather than call the command function directly:

- The argv parser is part of the contract. Integration tests catch
  regressions in `commander` wiring that unit tests miss.
- Exit codes are part of the contract. Spawning is the only way to
  verify them.

The integration tests use a fixture corpus assembled in
`tests/fixtures/integration-corpus/` (a hand-written set of
`.docs.md` files exercising each edge case the command faces).

## Smoke tests

A separate `tests/smoke/cli.test.ts` runs the six subcommands against
the **real corpus** at `apps/web/.source`. It's skipped unless
`process.env.<CLI>_SMOKE=1` is set, so it doesn't break local
development. CI sets the variable after running
`pnpm --filter web build`.

The smoke test is the canary: if the shape of Fumadocs' processed
output changes, this test fails immediately and points at the right
file.

## Fixtures

Fixtures live under `tests/fixtures/`. They're committed and
hand-curated, not generated. The reason: when a test fails, a human
needs to read the fixture and decide whether the test or the fixture
is wrong. Generated fixtures obscure that.

Minimum fixture corpus (for unit + integration):

```
tests/fixtures/corpus/
├── path/
│   ├── symbol.docs.md      # hosts three symbols in one file
│   ├── other-symbol.docs.md
│   └── malformed.docs.md   # intentionally bad frontmatter
└── web/
    └── symbol.docs.md      # same title as path/symbol.docs.md (duplicate)
```

The fixture names align with the worked examples in `02-design.md` so
the docs and tests stay in sync.

## What we don't test

- **Performance.** No benchmark suite. The numbers in
  `03-architecture.md` are aspirational. If they become a problem, we
  add a benchmark later.
- **Colour or terminal rendering.** The CLI doesn't produce colour.
  Nothing to test.
- **Cross-platform paths.** The CLI normalises to POSIX-style paths
  internally. Windows tests run on the same Vitest environment as
  everything else in this template (Node); we rely on the runtime to
  handle the boundary.
- **npm packaging.** `apps/cli/package.json` uses the same allowlist
  (`files`) and `exports` map conventions as `packages/example/`. If
  the package shape breaks, `packages/example/` breaks too; we don't
  duplicate that test here.

## Coverage

The repo's `coverage.yml` workflow posts a PR comment with
line/branch/function coverage. The CLI is expected to land above 80%
line coverage in the first release. If it lands below, the PR comment
will surface it but the workflow doesn't block.

## Local loop

```bash
# Fast loop: unit + integration, no smoke
pnpm --filter <CLI> test:run

# Full loop: includes smoke against the real corpus
pnpm --filter web build
<CLI>_SMOKE=1 pnpm --filter <CLI> test:run
```
