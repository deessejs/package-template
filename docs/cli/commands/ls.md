# `ls`

List `.docs.md` files under a corpus path.

## Signature

```
<CLI> docs ls <path> [--corpus <path>]
```

| Argument | Required | Description                                                                               |
| -------- | -------- | ----------------------------------------------------------------------------------------- |
| `<path>` | yes      | Path within the corpus. Leading and trailing `/` are optional. `/` means the corpus root. |

| Flag              | Effect                                                                      |
| ----------------- | --------------------------------------------------------------------------- |
| `--corpus <path>` | Override the default corpus root (see [`../04-corpus.md`](../04-corpus.md)) |

## Output format

One record per line. Each record is the relative POSIX path of a
`.docs.md` file under `<path>`, sorted alphabetically.

```
relative/path/file.docs.md
another/path/file.docs.md
…
```

No header, no decoration, no trailing newline beyond the per-line
`\n`. A consumer can `split('\n')` and get records directly.

### Example

```bash
$ npx <CLI> docs ls /guides
getting-started.docs.md
concepts-effects.docs.md
shader-workflow.docs.md
texture-formats.docs.md
```

## Exit codes

| Code | When                                                                        |
| ---- | --------------------------------------------------------------------------- |
| `0`  | Success, including the case where no files match (empty stdout)             |
| `1`  | `<path>` is outside the corpus root (UserError: `path escapes corpus root`) |
| `2`  | The corpus is unreadable, or the corpus root doesn't exist (InternalError)  |

## Edge cases

- **Empty directory.** `<path>` resolves to a directory with no
  `.docs.md` files. The command succeeds with empty stdout. Exit `0`.
- **Path equal to corpus root.** `ls /` and `ls` both list every file
  in the corpus.
- **Path outside the corpus.** `ls ../` or `ls /etc` is a UserError,
  not silently empty.
- **Path is a file, not a directory.** This is a UserError
  (`<path> is not a directory`).
- **Symbolic links.** Not followed. The CLI doesn't dereference
  symlinks; if the corpus uses them, they appear as their link name.
- **Hidden files.** Files starting with `.` are excluded unless the
  path ends with `.*` (Fumadocs doesn't, so this is theoretical).

## Internal modules

| Module               | Role                                                 |
| -------------------- | ---------------------------------------------------- |
| `src/corpus.ts`      | Resolves the corpus root, lists files under `<path>` |
| `src/commands/ls.ts` | Validates `<path>`, formats output                   |
| `src/output.ts`      | `writeRecords()` writes the result to stdout         |

`ls` doesn't touch the index. It works without `index/search.ts` or
`index/build.ts`.

## Symlink behaviour

See `04-corpus.md` for the corpus shape. The CLI assumes the corpus
is a flat directory tree of files; symlinks aren't in the contract.
