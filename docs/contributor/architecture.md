# Architecture

The reasoning behind the shape of this repository. Read this once when you
join, then keep it as a reference when reviewing or extending the template.

This is a **decision log**, not a tutorial. For "how to use the template", see
[`README.md`](../README.md). For "what must not change", see
[`invariants.md`](./invariants.md).

---

## Tooling choices

### pnpm 10 workspaces, not npm/yarn

- **Why pnpm**: strict dependency graph, content-addressable store, fast
  installs, first-class support for `workspace:*` protocol.
- **Why 10 specifically**: `engines.pnpm` is pinned to `>=10` and the lockfile
  is `pnpm-lock.yaml` v10. Downgrading breaks the lockfile format.
- **Considered**: npm workspaces (looser resolution, slower), Yarn Berry
  (PnP incompatible with some build tools we depend on).
- **Reconsider if**: pnpm stops being maintained or the project needs a
  feature only available in another package manager.

### Turborepo v2 for task orchestration

- **Why Turbo**: topological task ordering (`dependsOn: ["^build"]`), remote
  cache, JSON pipeline config that plays well with IDEs.
- **Pipeline contract** (each workspace must expose): `build`, `test:run`,
  `type-check`, `lint`, `clean`. `test` (watch mode) and `dev` are
  optional.
- **Reconsider if**: Turbo's pricing model changes in a way that breaks the
  OSS workflow, or we need a feature unique to Nx/Lage.

### TypeScript 6

- Pinned in `apps/web/package.json`. Re-read the pinned version before
  bumping — Turborepo, Next.js, and Vitest each have their own compat
  matrix.

### Vitest 4 for testing

- **Why Vitest**: ESM-native, Jest-compatible API, faster cold start.
- **Environment**: `node`. Browsers are out of scope — this template
  produces server-side packages and a Next.js app, both running on Node.
- **Globals enabled** in test config: tests can call `describe`, `it`,
  `expect` without imports.

### ESLint 9 flat config

- **Why flat config**: the legacy `.eslintrc` format is deprecated.
- **Per-workspace config**: each workspace owns its `eslint.config.js`.
  The root of the repo has no ESLint config — the workspaces are the units
  of linting.

### Prettier 3

- Configured at the root (`.prettierrc`). Run `pnpm format` before
  committing. The pre-commit hook does **not** run Prettier — it runs
  `pnpm lint` and `pnpm type-check` only.

---

## Repository structure

### Monorepo layout

```
.
├── apps/         # Deployable applications (Next.js site, future CLIs)
├── packages/     # Publishable libraries
├── docs/         # Internal contributor documentation (you are here)
├── scripts/      # Bootstrap and maintenance scripts (e.g. setup.mjs)
├── public/       # Static assets shipped to the docs site
└── .github/      # Workflows, issue templates, CODEOWNERS
```

### Workspace discovery

`pnpm-workspace.yaml` registers `packages/*` and `apps/*`. Adding a folder
under either glob is enough — no registry to edit. See
[`adding-a-workspace.md`](./adding-a-workspace.md) for the full procedure.

### Branching model

`main` <- `staging` <- `dev`, as documented in `CONTRIBUTING.md`.

- **`main`**: production-ready, release history. The release engineer
  merges `staging` into `main` when cutting a release.
- **`staging`**: release candidate. Integration branch for a planned
  release.
- **`dev`**: day-to-day work in progress.

---

## Package conventions

### Two `tsconfig` files per workspace, on purpose

- `tsconfig.json`: `noEmit`, includes tests, used by the editor and the
  `type-check` task.
- `tsconfig.build.json`: emits `dist/`, excludes tests, used by the
  `build` task.

This separation guarantees test files never reach the npm tarball, even
if a contributor forgets to update `.npmignore` (we don't have one — see
below).

### ESM only, no CommonJS fallback

- The `exports` map declares `import` and `types` only.
- `tsconfig.build.json` sets `"module": "NodeNext"` and emits `.js` files
  with `.js` extensions in imports.
- **Reconsider if**: a downstream consumer requires CJS. Add a bundler
  (tsup, unbuild) rather than dual-emitting from `tsc` — the latter
  produces brittle output.

### `files` field, not `.npmignore`

- `files` in `package.json` is an **allowlist**. New files are excluded
  by default.
- `.npmignore` is an **inhibit list** — easy to forget to update when
  adding a file. Wrong direction to be wrong in.

### Two-tsconfig rationale extended

The publishable package pattern (`packages/example/`) is the canonical
shape for any new `packages/*`. Copy it as a starting point and adjust the
`name`, `description`, and source files.

---

## Release pipeline

### Changesets, not semver-by-hand

- **Why Changesets**: semver and changelog are decided in the PR, not at
  publish time. Reviewers see the proposed version bump before merging.
- **Flow**: `pnpm changeset` on a feature branch → commit the generated
  file in `.changeset/` → PR → merge to `main` → release workflow runs.

### Label-gated publish

The release workflow (`.github/workflows/release.yml`) is fully
automatic. **No manual label to add.** The PR description and the
changeset entry together determine the version bump.

### Preview releases on every PR

`pkg.pr.new` builds and uploads a tarball on every push to a branch and
every PR. Install with `npm i https://pkg.pr.new/<owner>/<repo>/<pkg>@<sha>`.
The bot posts the install command on each PR when the GitHub App is
installed; the workflow runs without it.

---

## CI design

Six workflows, each with a single responsibility:

| Workflow        | Responsibility                                                |
| --------------- | ------------------------------------------------------------- |
| `bootstrap.yml` | Keeps the bootstrap path green after template changes         |
| `ci.yml`        | lint + type-check + test + build (the canonical pipeline)     |
| `coverage.yml`  | V8 coverage; posts a PR comment with thresholds, never blocks |
| `docs-lint.yml` | Vale prose linter over `docs/**/*.md`                         |
| `preview.yml`   | pkg.pr.new tarball upload per PR                              |
| `release.yml`   | Changesets-driven npm publish on push to `main`               |

**Why split them**: failures name themselves. One wall of logs makes it
harder to tell whether the test failed or the build failed.

### Required secrets

| Secret        | Required? | Purpose                                                       |
| ------------- | --------- | ------------------------------------------------------------- |
| `NPM_TOKEN`   | No        | Only if you opt out of npm Trusted Publishing (OIDC)          |
| `TURBO_TOKEN` | No        | Turborepo remote cache token                                  |
| `TURBO_TEAM`  | No        | Turborepo remote cache team (a repo _variable_, not a secret) |

`GITHUB_TOKEN` is provided automatically.

---

## What this template is **not**

- **Not a SaaS starter.** For an app with auth, DB, and three deployable
  surfaces, use [`deessejs/saas-template`](https://github.com/deessejs/saas-template).
- **Not a monorepo framework.** It uses pnpm and Turbo, but it does not
  abstract them. If you outgrow it, fork it.
- **Not exhaustive governance.** It ships with5 issue templates and a
  PR template, but not with a code-of-conduct, contributor license
  agreement, or financial model. Add what your fork needs.
