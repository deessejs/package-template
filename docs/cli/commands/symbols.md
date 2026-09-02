# `symbols`

List every symbol in the corpus, one per line.

## Signature

```
<CLI> docs symbols [--corpus <path>]
```

| Flag              | Effect                           |
| ----------------- | -------------------------------- |
| `--corpus <path>` | Override the default corpus root |

No positional arguments.

## Output format

One symbol title per line, sorted alphabetically. No header, no
decoration, no per-symbol metadata.

```
Buffer
BufferOptions
BufferResize
Symbol
…
```

The order is **alphabetical, ascending, ASCII order** (that is, uppercase
before lowercase, digits before letters, `/` and `.` sorted by code
point). This matches the default sort order of `Array.prototype.sort`
on string titles.

### Example

```bash
$ npx <CLI> docs symbols
Buffer
BufferOptions
BufferResize
Symbol
SymbolB
SymbolC
```

## Exit codes

| Code | When                                                    |
| ---- | ------------------------------------------------------- |
| `0`  | Success, including the empty corpus case (empty stdout) |
| `2`  | Corpus unreadable (InternalError)                       |

## Edge cases

- **Empty corpus.** Empty stdout, exit `0`. The empty case is
  indistinguishable from "no symbols indexed", which is fine.
- **Duplicate symbols.** The index keeps only one entry per
  (title, source) tuple; `symbols` reflects what `find` would see.
  See [`../04-corpus.md`](../04-corpus.md#indexing).
- **Very large corpus.** `symbols` outputs the full list. There's no
  pagination or limit. For 10k+ symbols, the output becomes hard to
  pipe; users should use `find` with a query instead.
- **Symbols with surrounding whitespace.** Titles aren't trimmed.
  A frontmatter `title: "  Buffer  "` will appear in the output
  verbatim. Users should fix the corpus, not the CLI.

## Internal modules

| Module                    | Role                                        |
| ------------------------- | ------------------------------------------- |
| `src/index/build.ts`      | Provides the `symbols` map                  |
| `src/index/search.ts`     | Sorts the keys alphabetically               |
| `src/commands/symbols.ts` | Calls `writeRecords()` with one row per key |

`symbols` triggers index construction on first call.

## Use cases

- **Building a local index.** Pipe `symbols` to `fzf` or another tool.
- **Diffing two corpora.** `diff <(./cli docs symbols) <(./cli docs
--corpus=other symbols)` shows what's in one but not the other.
- **Discoverability.** A quick "what exists?" check before drilling
  into a specific symbol with `cat`.
