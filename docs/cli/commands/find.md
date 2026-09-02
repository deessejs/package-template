# `find`

Symbol lookup. Returns the symbols whose title contains the query
substring, with their `source` and path.

## Signature

```
<CLI> docs find <query> [--corpus <path>]
```

| Argument  | Required | Description                                                 |
| --------- | -------- | ----------------------------------------------------------- |
| `<query>` | yes      | A substring to match against symbol titles (case-sensitive) |

| Flag              | Effect                           |
| ----------------- | -------------------------------- |
| `--corpus <path>` | Override the default corpus root |

## Output format

A whitespace-aligned table, one match per row. Three columns:

- **Symbol**: the symbol title (exact, as it appears in frontmatter)
- **Source**: the `source` frontmatter field (the package or module
  the symbol belongs to)
- **Path**: the corpus-relative POSIX path of the file hosting the
  symbol

Columns are separated by **two or more spaces**. There is no header
row. Agents should split on `\s{2,}` to recover the three columns.

```
Buffer           @scope/core    /path/to/core/buffer.docs.md
BufferOptions    @scope/core    /path/to/core/buffer-options.docs.md
BufferResize     @scope/core    /path/to/core/buffer-resize.docs.md
```

Symbol and source columns are padded to a fixed width computed from
the longest cell in the result set. The path column isn't padded:
variable-length paths stay left-aligned without trailing spaces.

### Example

```bash
$ npx <CLI> docs find "Buffer"
Buffer           @scope/core    /path/to/core/buffer.docs.md
BufferOptions    @scope/core    /path/to/core/buffer-options.docs.md
BufferResize     @scope/core    /path/to/core/buffer-resize.docs.md

$ npx <CLI> docs find "Nonexistent"
# (no output)
```

## Exit codes

| Code | When                                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------- |
| `0`  | At least one match, or no match (empty stdout). Distinct from `1` so that `find` composes in shells without ` |     | true` |
| `1`  | Reserved for future use. Currently unused                                                                     |
| `2`  | Corpus unreadable, or the inverted index failed to build (InternalError)                                      |

## Edge cases

- **Query is empty string.** Matches every symbol. Exit `0` with the
  full symbol table. Probably not what the user wants; `symbols` is
  better for that.
- **Query is multi-character, exact.** `<CLI> docs find Buffer` returns
  only `Buffer`, not `BufferOptions`. Substring matching is on, exact
  match is a special case of substring.
- **Case sensitivity.** Always case-sensitive. `<CLI> docs find
buffer` doesn't match `Buffer`. Same policy as `grep`.
- **Many matches.** No upper bound. `find` is allowed to return
  thousands of rows. The output column widths adapt to the longest
  cell, so very long paths make the table hard to read; this is
  intentional, not a bug.
- **Duplicate symbols.** The index keeps only one file per
  (title, source) tuple. If two files share both fields, the later
  one wins and a `[warn]` goes to stderr (see
  [`../04-corpus.md`](../04-corpus.md#indexing)).

## Internal modules

| Module                 | Role                                   |
| ---------------------- | -------------------------------------- |
| `src/index/build.ts`   | Builds the `symbols` map on first call |
| `src/index/search.ts`  | Substring-filters the symbols map      |
| `src/commands/find.ts` | Computes column widths, formats rows   |

`find` requires the inverted index to be built. The first call
triggers the build; subsequent calls reuse it. See
[`../03-architecture.md`](../03-architecture.md#data-flow).
