# 4. Corpus

Where the `.docs.md` files come from, how they are discovered, and how
they are indexed.

## Three options were on the table

| Option                        | Source of truth                                                                  | How the CLI consumes it                                  |
| ----------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **A. Direct read**            | `apps/web/content/docs/**/*.mdx` (the Fumadocs source)                           | CLI parses MDX and frontmatter directly, at runtime      |
| **B. Build artefacts**        | `.source/` directory produced by `fumadocs-mdx` during `pnpm --filter web build` | CLI reads the pre-processed markdown from `.source/`     |
| **C. Shared indexer package** | A new `packages/docs-index/` that both `apps/web` and `apps/cli` depend on       | CLI calls into the package; the package does the parsing |

## Decision: **Option B**

The CLI consumes the build artefacts produced by Fumadocs into `.source/`.

### Why B over A

- **MDX is JSX.** Parsing it correctly at runtime requires a parser
  that handles JSX expressions, components (`<Card>`), and frontmatter.
  That's a lot of code to ship in the CLI for one job.
- Fumadocs already runs that pipeline during `apps/web` build, with
  `includeProcessedMarkdown: true` enabled in
  `apps/web/source.config.ts`. The output is plain markdown with
  frontmatter, which is what we want.
- **No double work.** If A and B both parse the same MDX, we drift
  the moment either side upgrades its parser. B reads what Fumadocs
  produced; we trust it.

### Why B over C

- C is the cleanest in the long run, but it adds a workspace, a
  package.json, a build pipeline, and a versioning story — for one
  consumer (the CLI). The cost is justified when there are two
  consumers; right now there is one.
- We can promote B to C the day a second consumer appears. Migration
  is a refactor of one module, not a redesign.

### Cost of B

The CLI now has a **build dependency** on `apps/web`. Two
consequences:

1. `pnpm --filter vgpu build` (the CLI build) must run after
   `pnpm --filter web build` produces fresh artefacts in `.source/`.
   This is already handled by `turbo.json`'s `dependsOn: ["^build"]`
   rule.
2. `apps/web` cannot be removed without breaking the CLI. This is
   acceptable: `apps/web` is part of the template's core, and a CLI
   without a docs site is not a use case we're targeting.

## Corpus root and discovery

The corpus root is resolved in this order:

1. The `--corpus <path>` flag, if provided.
2. The `DOCS_CORPUS` environment variable, if set.
3. The default: `<repo-root>/apps/web/.source`, resolved relative to
   the CLI's working directory.

If the resolved path does not exist or is not a directory, the CLI
emits an `InternalError`:

```
[error] corpus not found at <path>; run `pnpm --filter web build` first
```

## What the CLI reads inside `.source/`

The CLI consumes only the artefacts produced by Fumadocs with
`includeProcessedMarkdown: true`. Concretely:

- One processed markdown file per source `.mdx` page.
- A manifest (JSON) listing every page, its path, its frontmatter,
  and its processed body.

The CLI does **not** parse the original `.mdx` files. It only reads
the processed output. This is the contract.

### Schema assumed of the processed artefact

```ts
interface ProcessedPage {
  /** Original path under content/docs/, without extension, POSIX-style. */
  readonly slug: string;
  /** Frontmatter as parsed by Fumadocs. */
  readonly frontmatter: { title: string; source?: string; [k: string]: unknown };
  /** Processed markdown body (frontmatter stripped, MDX components resolved). */
  readonly body: string;
}
```

If Fumadocs changes this shape, the CLI breaks. The mitigation is to
pin `fumadocs-mdx` in the root `package.json` and to add a CI check
that loads one processed page and validates the shape (see
`05-testing.md`).

## Indexing

Once the corpus is loaded into a `Corpus` (see `03-architecture.md`),
the CLI builds an **in-memory inverted index** of symbols. The index
is a `Map<symbol, DocsFile>` keyed by the file's `title` field
(treating it as the canonical symbol name).

If two files share the same `title`, the later one wins and a warning
goes to stderr:

```
[warn] duplicate symbol "Buffer" in /vgpu/web/buffer.docs.md; /vgpu/core/buffer.docs.md ignored
```

The index is built lazily, on the first `find`, `grep`, or `symbols`
call. `ls`, `cat`, and `path` work without it.

### Why a `Map`, not a tree or a trie

- Symbols are flat strings. No natural hierarchy.
- `Map.get` is O(1); everything we need is O(1) lookup plus a linear
  scan for `grep` and `symbols`.

## Cache invalidation

Within one invocation: see `03-architecture.md`. Across invocations:
there is no cache. Each `npx vgpu docs …` is fresh.

## Local development

When working on the CLI locally, the typical loop is:

```bash
# 1. Make sure .source/ is fresh
pnpm --filter web build

# 2. Run the CLI against the local corpus
pnpm --filter vgpu dev -- ls /

# 3. Or, with the binary pointed at a custom corpus
pnpm --filter vgpu dev -- --corpus ./apps/web/.source ls /
```

The `dev` script in `apps/cli/package.json` should resolve to
`tsx src/index.ts` so that TypeScript runs without a build step.

## Future: supporting multiple corpora

If we later need to point the CLI at a corpus other than the
template's own (e.g. a downstream consumer's docs), the `--corpus`
flag is the extension point. The CLI already supports it; no design
change is required.
