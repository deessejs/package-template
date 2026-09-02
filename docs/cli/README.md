# `<CLI> docs` — Internal Architecture

Architecture documents for the `<CLI> docs` command-line interface. Read
these before modifying the CLI or adding a subcommand.

`<CLI>` is a placeholder for the npm package name, which is decided when
the workspace is scaffolded. The shape documented here doesn't depend on
the name.

This is **internal contributor documentation** for the CLI's code, not
end-user documentation of the binary. End-user docs (the manual) will
live in `apps/cli/README.md` once the CLI is scaffolded.

## Read in order

1. [`01-vision.md`](./01-vision.md): what the CLI is, who it serves,
   what it explicitly doesn't do.
2. [`02-design.md`](./02-design.md): the six subcommands, output
   formats, the `.docs.md` convention, and the decisions that shaped
   them.
3. [`03-architecture.md`](./03-architecture.md): modules, types, data
   flow, argv parsing, error model.
4. [`04-corpus.md`](./04-corpus.md): where the corpus comes from, how
   it's indexed, and the option chosen (A / B / C).
5. [`05-testing.md`](./05-testing.md): what's tested, fixtures, and the
   boundary between unit and end-to-end tests.
6. [`06-roadmap.md`](./06-roadmap.md): implementation phases, their
   dependencies, and exit criteria.

## Status

This documentation describes a CLI that hasn't been scaffolded yet.
It's the design contract that implementation must satisfy. Changes to
the CLI that diverge from these documents should land **with** an
update to the relevant document in the same PR.

## Conventions

- English only.
- Code blocks use the language tag explicitly (` ```ts `, not ` ``` `).
- Internal links are relative.
- The numbered prefix on filenames is for reading order, not for any
  sort order enforced by tooling.
