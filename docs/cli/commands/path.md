# `path`

Resolve a symbol or filename to its canonical path in the corpus.

## Signature

```
<CLI> docs path <file-or-symbol> [--corpus <path>]
```

| Argument           | Required | Description                                                                                                |
| ------------------ | -------- | ---------------------------------------------------------------------------------------------------------- |
| `<file-or-symbol>` | yes      | Either a symbol title (looks up in the index) or a corpus-relative path (returned as-is, after validation) |

| Flag              | Effect                           |
| ----------------- | -------------------------------- |
| `--corpus <path>` | Override the default corpus root |

## Output format

A single POSIX-style path, with no trailing newline beyond the line
terminator.

If the input is a symbol title, the output is the corpus-relative
path of the file hosting that symbol.

```
/path/to/file.docs.md
```

If the input is a path, the output is that path, normalised (no `..`,
no `.`, no leading `./`).

```
input:  ./path/./to/file.docs.md
output: path/to/file.docs.md
```

### Example

```bash
$ npx <CLI> docs path Buffer
/path/to/buffer.docs.md

$ npx <CLI> docs path path/to/file.docs.md
path/to/file.docs.md
```

## Disambiguation rules

The CLI checks the index first. If `<file-or-symbol>` matches a title
in the index, that path is returned. Otherwise, it's treated as a
path: normalised and validated against the corpus root.

If the input matches both a symbol and a path, the **symbol wins**.

If the input matches neither, the command exits `1`.

## Exit codes

| Code | When                                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------- |
| `0`  | Resolved to a single path                                                                                     |
| `1`  | Symbol unknown and path outside the corpus (UserError)                                                        |
| `1`  | Ambiguous symbol (multiple files with the same title and source) (UserError: `ambiguous: <name>; try 'find'`) |
| `2`  | Corpus unreadable (InternalError)                                                                             |

## Edge cases

- **Path with `..`.** Normalised first. If the normalised result is
  outside the corpus, exit `1`. This prevents reading files the user
  didn't intend.
- **Path with absolute prefix.** The CLI accepts both `/path/...` and
  `path/...`. The leading `/` is stripped before normalisation.
- **Path to a non-`.docs.md` file.** Allowed (returns the path) but
  discouraged. The corpus convention is `.docs.md`; other files are
  not indexed and won't be returned by `find`, `grep`, etc.
- **Path is a directory.** Returns the directory path. Useful as
  input to `ls`.
- **Symbol with same name as a path.** Symbol wins, by design.
  Agents that want to look up by path literally should pass the
  path explicitly.

## Internal modules

| Module                 | Role                                              |
| ---------------------- | ------------------------------------------------- |
| `src/index/build.ts`   | Provides the `symbols` map                        |
| `src/corpus.ts`        | Path normalisation, corpus-root containment check |
| `src/commands/path.ts` | Symbol-vs-path disambiguation                     |

`path` is the cheapest way to convert a name to a usable path without
loading the file body. Agents use it before `cat` to confirm the
symbol exists.
