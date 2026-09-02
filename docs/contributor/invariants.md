# Invariants

Rules that must not be broken in a PR. Touching one of the files listed
below without justification is a strong signal that the change needs a
second review.

This is a **checklist**, not a rationale. For the reasoning behind each
invariant, see [`architecture.md`](./architecture.md).

---

## Workspace discovery

| Invariant                                                                       | File                                            |
| ------------------------------------------------------------------------------- | ----------------------------------------------- |
| Only `packages/*` and `apps/*` are registered as workspaces                     | [`pnpm-workspace.yaml`](../pnpm-workspace.yaml) |
| No workspace is added at the repo root or under `scripts/`, `docs/`, `.github/` | [`pnpm-workspace.yaml`](../pnpm-workspace.yaml) |

A workspace is any directory with a `package.json`. If a new directory
ends up registered that wasn't intended, fix `pnpm-workspace.yaml`
rather than fighting Turbo.

---

## Turbo pipeline

| Invariant                                                                               | File                          |
| --------------------------------------------------------------------------------------- | ----------------------------- |
| `build` declares `dependsOn: ["^build"]`                                                | [`turbo.json`](../turbo.json) |
| `type-check` and `test:run` declare `dependsOn: ["^build"]`                             | [`turbo.json`](../turbo.json) |
| Every publishable workspace exposes: `build`, `test:run`, `type-check`, `lint`, `clean` | [`turbo.json`](../turbo.json) |
| `dev` and `test` (watch mode) are marked `persistent: true, cache: false`               | [`turbo.json`](../turbo.json) |

Removing `^build` from the dependency chain breaks the topological order.
A workspace that builds before its dependencies will type-check against
stale inputs.

---

## Package shape

| Invariant                                                                                     | File                                                 |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Two `tsconfig` files per workspace: `tsconfig.json` (noEmit) and `tsconfig.build.json` (emit) | `packages/*/tsconfig*.json`, `apps/*/tsconfig*.json` |
| Publishable workspaces are ESM-only — `exports` declares `import` + `types`, no `require`     | `packages/*/package.json`                            |
| Publishable workspaces use `files`, never `.npmignore`                                        | `packages/*/package.json`                            |
| Build output goes to `dist/` and is the only thing that ships                                 | `packages/*/tsconfig.build.json`                     |
| Tests live outside `src/` so they never reach `dist/`                                         | `packages/*/tests/`, `apps/*/tests/`                 |

### Why no CJS fallback

Adding `require` to `exports` forces dual-emission, which `tsc` does not
do well. If a downstream consumer needs CJS, add a bundler. See
[`architecture.md`](./architecture.md#esm-only-no-commonjs-fallback).

---

## Engines

| Invariant                                              | File                                               |
| ------------------------------------------------------ | -------------------------------------------------- |
| `engines.node` is `">=22"` in the root `package.json`  | [`package.json`](../package.json)                  |
| `engines.pnpm` is `">=10"` in the root `package.json`  | [`package.json`](../package.json)                  |
| CI uses the same Node version as `engines.node` allows | [`.github/workflows/*.yml`](../.github/workflows/) |

`engines` is enforced by `pnpm` and by CI. Lowering the version breaks
the lockfile format and the runtime guarantees.

---

## Release

| Invariant                                                     | File                                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------- |
| Version bumps are decided via `pnpm changeset`, never by hand | [`.changeset/](../.changeset/)                                      |
| `release.yml` is the only path that publishes to npm          | [`.github/workflows/release.yml`](../.github/workflows/release.yml) |
| Every PR that should cut a release contains a changeset file  | [`.changeset/](../.changeset/)                                      |

A PR that changes runtime behavior without a changeset will not produce a
release on merge. Reviewers should call this out.

---

## Linting and formatting

| Invariant                                                              | File                                                   |
| ---------------------------------------------------------------------- | ------------------------------------------------------ |
| Prettier config lives at the repo root, not per-workspace              | [`.prettierrc`](../.prettierrc)                        |
| ESLint flat config is per-workspace, not at the repo root              | `apps/*/eslint.config.*`, `packages/*/eslint.config.*` |
| Vale config lives at the repo root and covers `docs/**/*.md`           | [`.vale.ini`](../.vale.ini)                            |
| The pre-commit hook runs `pnpm lint` + `pnpm type-check`, not Prettier | [`.husky/pre-commit`](../.husky/pre-commit)            |

Prettier on pre-commit would slow every commit. It runs in CI and on
demand via `pnpm format`.

---

## Branching

| Invariant                                                                                               | File                                    |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| The model is `main` <- `staging` <- `dev`                                                               | [`CONTRIBUTING.md`](../CONTRIBUTING.md) |
| Releases are cut from `main` to `staging` and from `staging` to `main`, managed by the release engineer | [`CONTRIBUTING.md`](../CONTRIBUTING.md) |

Long-lived feature branches off `main` break the model. If your work
spans more than one release, base it on `dev`.

---

## How to verify these invariants locally

```bash
pnpm lint && pnpm type-check && pnpm test:run && pnpm build
```

This is the same chain CI runs. If it passes locally, the invariants hold
as far as the automated checks can tell. Reviewer judgement covers the
rest.
