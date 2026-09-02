# `grep`

Substring search across all `.docs.md` files. Returns matching lines
with their file and line number.

## Signature

```
<CLI> docs grep <pattern> [--corpus <path>]
```

| Argument    | Required | Description                                      |
| ----------- | -------- | ------------------------------------------------ |
| `<pattern>` | yes      | A substring to search for (literal, not a regex) |

| Flag              | Effect                           |
| ----------------- | -------------------------------- |
| `--corpus <path>` | Override the default corpus root |

## Output format

One record per matching line. Each record is
`<path>:<line>:<text>` where:

- `<path>` is the corpus-relative POSIX path of the file
- `<line>` is the 1-indexed line number
- `<text>` is the content of the matching line (with leading
  whitespace preserved, no trailing newline)

```
/path/to/file.docs.md:42: line containing the pattern
/another/file.docs.md:7: another matching line
…
```

If a single line matches multiple times, it appears once.

### Example

```bash
$ npx <CLI> docs grep "resize"
/path/to/buffer.docs.md:42: Resize events …
/path/to/buffer.docs.md:58: On resize, the buffer …
```

## Exit codes

| Code | When                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------- |
| `0`  | At least one line matched                                                                      |
| `0`  | No match (empty stdout). Distinct from `1` so that callers can use `grep` in a chain without ` |     | true` |
| `1`  | Reserved for future use (for example invalid pattern syntax). Currently unused                 |
| `2`  | Corpus unreadable (InternalError)                                                              |

## Edge cases

- **Pattern is empty string.** Matches every line. Exit `0` with the
  full corpus dumped. Users probably didn't mean that; `find` is
  better for "everything" discovery.
- **Pattern contains shell metacharacters.** The CLI receives the
  literal string. The shell is responsible for quoting. The CLI does
  no globbing or regex.
- **Pattern is multi-line.** Not supported. `grep` is line-based.
- **Case sensitivity.** Always case-sensitive. Case-insensitive search
  is out of scope for the first release.
- **Binary or non-UTF8 files.** The corpus is markdown by convention;
  `grep` assumes UTF8 and doesn't validate. A non-UTF8 byte will
  appear as a replacement glyph in `<text>`.

## Internal modules

| Module                 | Role                                                       |
| ---------------------- | ---------------------------------------------------------- |
| `src/corpus.ts`        | Provides the `files` map and per-file body access          |
| `src/index/search.ts`  | Iterates files, splits into lines, filters by substring    |
| `src/commands/grep.ts` | Validates `<pattern>`, formats `<path>:<line>:<text>` rows |

`grep` triggers corpus loading but doesn't need the inverted index.

## Performance

For a corpus of 500 files averaging 100 lines each, `grep` is
expected to finish in under 200 ms (see
[`../03-architecture.md`](../03-architecture.md#performance-expectations)).
The current implementation is a simple linear scan; if this becomes a
bottleneck, the next iteration can switch to a tokenised inverted
index. Not now.
