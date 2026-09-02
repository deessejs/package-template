# 2. Design

The shape of the user-facing surface: subcommands, output formats, the
`.docs.md` convention, and the rationale for each.

This file is the **overview**. Per-command detail (signatures, exact
output formats, edge cases, internal modules) lives in
[`commands/`](./commands/):

- [`ls`](./commands/ls.md)
- [`cat`](./commands/cat.md)
- [`grep`](./commands/grep.md)
- [`find`](./commands/find.md)
- [`path`](./commands/path.md)
- [`symbols`](./commands/symbols.md)

## The six subcommands

| Command   | Args               | Returns                                                   | When to use          |
| --------- | ------------------ | --------------------------------------------------------- | -------------------- |
| `ls`      | `<path>`           | Newline-separated list of `.docs.md` files under `<path>` | Browsing what exists |
| `cat`     | `<symbol>`         | Markdown content of the file hosting `<symbol>`           | Reading one symbol   |
| `grep`    | `<pattern>`        | `<file>:<line>:<text>` for every matching line            | Free-text search     |
| `find`    | `<query>`          | Table `Symbol · Source · Path`, one match per row         | Symbol lookup        |
| `path`    | `<file-or-symbol>` | A single absolute or corpus-relative path                 | Resolving a name     |
| `symbols` | none               | Newline-separated list of every symbol in the corpus      | Building an index    |

### Why these six and not more

- `ls` and `cat` are the floor: you can browse and read anything.
- `find` and `symbols` answer the agent's most common question,
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
  multiple spaces, not tabs or pipes. Agents should split on
  `\s{2,}`.
- **No ANSI colour.** Pipe to `less -R` or `grep --color` if you want
  colour; the CLI doesn't own that.
- **No JSON or structured flags.** A `--json` flag was considered and
  rejected. If a consumer needs JSON, they should shell out and parse.
  The CLI's job is the canonical text representation.
- **Errors go to stderr, exit code is non-zero.** Stdout is reserved
  for the record stream.

Per-command output specifics (column widths, exact separator, what
goes in each column) are in the per-command files under `commands/`.

## Exit codes

| Code | Meaning                                                         | Examples                                                      |
| ---- | --------------------------------------------------------------- | ------------------------------------------------------------- |
| `0`  | Success, including "no match" cases (`find`, `grep`, `symbols`) | `find` with no results, `grep` with no matches                |
| `1`  | User error                                                      | Unknown symbol, path outside the corpus, ambiguous match      |
| `2`  | Internal error                                                  | Corpus unreadable, malformed frontmatter that breaks indexing |

Commands exit `0` on "no match" by design: shell pipelines that pipe
into `find` or `grep` shouldn't need `|| true`. The distinction
between "user error" and "internal error" matters for scripts that
want to retry on transient failures.

## The `.docs.md` convention

A `.docs.md` file is a markdown file with three properties:

1. **Filename ends in `.docs.md`**, not `.md`. This distinguishes
   documentation intent from generic markdown (READMEs, blog posts).
2. **Top-of-file frontmatter** with at least:
   ```yaml
   ---
   title: Buffer
   source: @scope/core
   ---
   ```
   `title` is the canonical name. `source` is the module/package the
   symbol belongs to; it appears in the `find` output's middle column.
3. **One symbol per file**, where a _symbol_ is the smallest unit a
   reader would `cat` directly. In practice this is usually one class,
   one function, or one type definition. Multi-symbol files are
   allowed but discouraged: when `find` matches a symbol inside a file
   hosting many, the output still resolves to the file, not to a
   sub-section. See [`04-corpus.md`](./04-corpus.md) for the indexing
   implications.

### Why `.docs.md` and not `.md` or `.mdx`

- **`.md`** is too generic: this repo's `README.md`, `CONTRIBUTING.md`,
  and `CHANGELOG.md` are all `.md`. The CLI mustn't consume those.
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
$ npx <CLI> docs find "Buffer"
Buffer       @scope/web     /path/to/web/buffer.docs.md
Buffer       @scope/core    /path/to/core/buffer.docs.md
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
`symbols`). All six are single-word, lowercase, and don't collide
with POSIX `ls(1)`, `cat(1)`, `grep(1)`, or `find(1)` semantics.
They're scoped under the `docs` subcommand.
