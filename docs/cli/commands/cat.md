# `cat`

Print the markdown body of the file hosting a given symbol.

## Signature

```
<CLI> docs cat <symbol> [--corpus <path>]
```

| Argument   | Required | Description                                                                    |
| ---------- | -------- | ------------------------------------------------------------------------------ |
| `<symbol>` | yes      | The canonical symbol name (matches frontmatter `title`, exact, case-sensitive) |

| Flag              | Effect                           |
| ----------------- | -------------------------------- |
| `--corpus <path>` | Override the default corpus root |

## Output format

The full markdown body of the file hosting `<symbol>`, with frontmatter
stripped. Output goes to stdout. No header, no decoration.

```
# Heading

Body content of the file …
```

Trailing newline is preserved if present in the source.

### Example

```bash
$ npx <CLI> docs cat Buffer
# Buffer

The Buffer type represents a typed array of bytes …

## Methods

### `Buffer.alloc(size)`

…
```

## Exit codes

| Code | When                                                                                                                                |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `0`  | Symbol found, body printed                                                                                                          |
| `1`  | Unknown symbol (UserError: `unknown symbol: <name>`)                                                                                |
| `1`  | Multiple files share the same title and the symbol is ambiguous (UserError: `ambiguous symbol: <name>; use 'path' to disambiguate`) |
| `2`  | Corpus unreadable (InternalError)                                                                                                   |

## Edge cases

- **Symbol exists in one file.** Body is printed, exit `0`.
- **Symbol exists in multiple files** (same `title` in different
  files, same `source` is unlikely but possible). Behaviour: the later
  file wins (see `04-corpus.md`), exit `0`. If two files share both
  `title` and `source`, the index is ambiguous; `cat` exits `1` and
  points the user at `path` or `find`.
- **Symbol with surrounding whitespace.** `<CLI> docs cat ' Buffer '`
  trims? No: the CLI matches exactly. Whitespace is the user's
  problem.
- **Body is empty.** The file has frontmatter but no body. `cat`
  succeeds with empty stdout. Exit `0`.
- **File is huge.** `cat` prints the whole body. There's no streaming
  or paging. If a file is megabytes, `cat` is the wrong command; pipe
  to `less` after running it.

## Internal modules

| Module                | Role                                                      |
| --------------------- | --------------------------------------------------------- |
| `src/corpus.ts`       | Reads the file by path or title                           |
| `src/index/build.ts`  | Provides the `symbols` map (built lazily on first lookup) |
| `src/commands/cat.ts` | Resolves `<symbol>` → `DocsFile`, prints `body`           |

`cat` triggers index construction lazily if it's the first command
that needs the symbol map. `ls`, `grep`, `symbols`, `find`, and `path`
do too. See `04-corpus.md` for the lazy-build policy.
