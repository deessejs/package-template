# Contributor Documentation

Documentation for **contributors to the template itself**, not for end
users of packages generated from it. End-user docs live in
`apps/web/content/docs/` and are served by the Fumadocs site.

## Start here

Read in this order if you are new to the template:

1. [`architecture.md`](./architecture.md) — the decisions that shape this
   repository (pnpm workspaces, two tsconfigs per package, ESM-only, etc.) and
   the reasoning behind them. Read once, then keep it as a reference.
2. [`invariants.md`](./invariants.md) — the rules that must not be broken in a
   PR. Re-read whenever you touch `turbo.json`, `pnpm-workspace.yaml`, a
   package's `exports` map, or the `engines` field.
3. [`adding-a-workspace.md`](./adding-a-workspace.md) — the runbook for
   adding a new `apps/*` or `packages/*` workspace. Follow it before creating
   the directory.

## Conventions

- Files are kebab-case Markdown (`*.md`), singular topic per file.
- English only — match the rest of the repository.
- Code blocks use the language tag explicitly (` ```ts `, not ` ``` `).
- Internal links are relative: `[architecture](./architecture.md)`.
