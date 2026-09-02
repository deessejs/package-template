# Internal Documentation

This directory holds documentation for **contributors to the template
itself**, not for end users of packages generated from it. End-user docs
live in `apps/web/content/docs/` and are served by the Fumadocs site.

## Domains

Each subdirectory covers one area of contributor knowledge.

| Domain                                                                            | Audience                              | Start here                                                                                 |
| --------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| [`contributor/`](./contributor/README.md)                                         | Anyone modifying the template         | [`contributor/README.md`](./contributor/README.md) — read this first                       |
| [`engineering/processes/releases/`](./engineering/processes/releases/README.md)   | Release engineers                     | [`engineering/processes/releases/README.md`](./engineering/processes/releases/README.md)   |
| [`learnings/claude-code/subagents/`](./learnings/claude-code/subagents/README.md) | Anyone using Claude Code on this repo | [`learnings/claude-code/subagents/README.md`](./learnings/claude-code/subagents/README.md) |

## Conventions

- Files are kebab-case Markdown (`*.md`), singular topic per file.
- English only — match the rest of the repository.
- Code blocks use the language tag explicitly (` ```ts `, not ` ``` `).
- Internal links are relative: `[example](./contributor/architecture.md)`.
- Every domain has a `README.md` at its root that points to the rest of
  the domain.
