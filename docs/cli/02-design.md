# 2. Design

The shape of the user-facing surface: subcommands, output formats, the
`.docs.md` convention, and the rationale for each.

## The six subcommands

| Command   | Args               | Returns                                                   | When to use          |
| --------- | ------------------ | --------------------------------------------------------- | -------------------- |
| `ls`      | `<path>`           | Newline-separated list of `.docs.md` files under `<path>` | Browsing what exists |
| `cat`     | `<symbol>`         | Markdown content of the file hosting `<symbol>`           | Reading one symbol   |
| `grep`    | `<pattern>`        | `<file>:<line>:<text>` for every matching line            | Free-text search     |
| `find`    | `<query>`          | Table `Symbol · Source · Path`, one match per row         | Symbol lookup        |
| `path`    | `<file-or-symbol>` | A single absolute or corpus-relative path                 | Resolving a name     |
| `symbols` | —                  | Newline-separated list of every symbol in the corpus      | Building an index    |

### Worked examples

```bash
# List everything under /guides
$ npx vgpu docs ls /guides
getting-started.docs.md
concepts-effects.docs.md
shader-workflow.docs.md
texture-formats.docs.md

# Find every symbol whose name contains "surface"
$ npx vgpu docs find "surface"
Surface             vgpu    /vgpu/surface.docs.md
SurfaceOptions      vgpu    /vgpu/surface.docs.md
SurfaceResizeEvent  vgpu    /vgpu/surface.docs.md

# Print the markdown of one symbol
$ npx vgpu docs cat Surface
# Surface
…

# Resolve a name to a path (returns the canonical location)
$ npx vgpu docs path Surface
/vgpu/surface.docs.md

# All symbols
$ npx vgpu docs symbols
Surface
SurfaceOptions
SurfaceResizeEvent
…

# Substring search across all files
$ npx vgpu docs grep "resize"
/vgpu/surface.docs.md:42: Resize events …
```

### Why these six and not more

- `ls` and `cat` are the floor — you can browse and read anything.
- `find` and `symbols` answer the agent's most common question:
  _"what exists?"_ and _"where is X defined?"_
- `grep` covers the long tail where `find` is too rigid (free-text
  matching).
- `path` exists so that an agent can convert a name to a path without
  re-implementing the resolution logic.

A `tree` command was considered and dropped: it duplicates `ls` with
cosmetic indentation, and shell tools (`find`) handle it.

## Output formats

Output is **plain text, machine-friendly, no decoration**. Specifically:

- **One record per line.** A consumer can `split('\n')` and get records.
- **Columns aligned by whitespace** in `find`, so the output is
  human-readable without sacrificing parseability. The separator is
  multiple spaces, not tabs or pipes — agents should split on
  `\s{2,}`.
- **No ANSI colour.** Pipe to `less -R` or `grep --color` if you want
  colour; the CLI does not own that.
- **No JSON / no structured flags.** A `--json` flag was considered
  and rejected. If a consumer needs JSON, they should shell out and
  parse — the CLI's job is the canonical text representation.
- **Errors go to stderr, exit code is non-zero.** Stdout is reserved
  for the record stream.

## The `.docs.md` convention

A `.docs.md` file is a markdown file with three properties:

1. **Filename ends in `.docs.md`**, not `.md`. This distinguishes
   documentation intent from generic markdown (READMEs, blog posts).
2. **Top-of-file frontmatter** with at least:
   ```yaml
   ---
   title: Surface
   source: vgpu
   ---
   ```
   `title` is the canonical name. `source` is the module/package the
   symbol belongs to; it appears in the `find` output's middle column.
3. **One symbol per file**, where a _symbol_ is the smallest unit a
   reader would `cat` directly. In practice this is usually one class,
   one function, or one type definition. Multi-symbol files are
   allowed but discouraged: when `find` matches a symbol inside a file
   hosting many, the output still resolves to the file, not to a
   sub-section. See `04-corpus.md` for the indexing implications.

### Why `.docs.md` and not `.md` or `.mdx`

- **`.md`** is too generic: this repo's `README.md`, `CONTRIBUTING.md`,
  and `CHANGELOG.md` are all `.md`. The CLI must not consume those.
- **`.mdx`** would conflict with Fumadocs' MDX content under
  `apps/web/content/docs/`. We want the CLI corpus to be independent
  of the docs site.
- **`.docs.md`** is unambiguous: it says _"this is a docs entry"_.
  The dot-prefix (`docs.md`) is also self-similar to conventions like
  `.test.ts` in this repo.

## The `Source` column in `find`

The middle column of `find` is the `source` frontmatter field. It
exists so that an agent can disambiguate symbols with the same name in
different packages. Example:

```bash
$ npx vgpu docs find "Buffer"
Buffer       @vgpu/web    /vgpu/web/buffer.docs.md
Buffer       @vgpu/core   /vgpu/core/buffer.docs.md
```

Same name, different sources, different files. The agent picks by
source. This is the closest the CLI gets to a namespace system.

## Flags (shared)

| Flag              | Effect                               |
| ----------------- | ------------------------------------ |
| `--corpus <path>` | Override the default corpus location |
| `--help`          | Per-command help                     |
| `--version`       | Print the CLI version and exit       |

Per-command flags are allowed but discouraged in the first release.
Anything that needs a flag is usually a candidate for a new
subcommand.

## Naming consistency

Subcommand names are **verbs where possible** (`ls`, `cat`, `grep`,
`find`), **noun where the verb would be ambiguous** (`path`,
`symbols`). All six are single-word, lowercase, and do not collide
with POSIX `ls(1)`, `cat(1)`, `grep(1)`, or `find(1)` semantics —
they are scoped under the `docs` subcommand.
