# Commands

Per-command specification for the six subcommands of `<CLI> docs`. Read
the file for a subcommand before implementing or modifying it.

Each file has the same five sections:

1. **Signature**: args, flags, and the call shape.
2. **Output format**: what goes to stdout, byte by byte.
3. **Exit codes**: when `0`, `1`, or `2` is returned and what they
   mean.
4. **Edge cases**: empty input, ambiguous input, malformed input.
5. **Internal modules**: which `src/*.ts` modules participate.

The exit code contract (`0` success, `1` user error, `2` internal
error) is shared across all six commands and is summarised in
[`../02-design.md`](../02-design.md#exit-codes). The per-command tables
in each file are authoritative for that command's specifics.

## Files

| File                         | Subcommand | Purpose                                     |
| ---------------------------- | ---------- | ------------------------------------------- |
| [`ls.md`](./ls.md)           | `ls`       | List `.docs.md` files under a corpus path   |
| [`cat.md`](./cat.md)         | `cat`      | Print the body of the file hosting a symbol |
| [`grep.md`](./grep.md)       | `grep`     | Substring search across the corpus          |
| [`find.md`](./find.md)       | `find`     | Symbol lookup with source and path          |
| [`path.md`](./path.md)       | `path`     | Resolve a name to its canonical path        |
| [`symbols.md`](./symbols.md) | `symbols`  | List every symbol in the corpus             |

Each file is **standalone**: an implementer can open any one of them
and find what they need without reading the rest of `docs/cli/`. The
shared context (vision, design, corpus source, testing strategy,
roadmap) lives one level up.
