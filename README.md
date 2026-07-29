<p align="center">
  <img src="public/banner-ds.jpg" alt="Package Template banner" width="900">
</p>

<h1 align="center">Package Template</h1>

<p align="center">
  <strong>Production-ready TypeScript package starter.</strong>
  pnpm workspaces · Turborepo · Vitest · Changesets · Publish in minutes.
</p>

<p align="center">
  <a href="https://github.com/deessejs/package-template/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/deessejs/package-template" alt="License">
  </a>
  <a href="https://github.com/deessejs/package-template/actions/workflows/build.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/deessejs/package-template/build.yml?label=CI" alt="CI">
  </a>
  <a href="https://github.com/deessejs/package-template/stargazers">
    <img src="https://img.shields.io/github/stars/deessejs/package-template?style=social" alt="Stars">
  </a>
</p>

<p align="center">
  <a href="https://github.com/deessejs/package-template/generate">
    <img src="https://img.shields.io/badge/Use%20this%20template-2ea44f?style=for-the-badge&logo=github" alt="Use this template">
  </a>
</p>

> 👉 **Building an app, not a library?** See [`deessejs/saas-template`](https://github.com/deessejs/saas-template) — a full single-tenant SaaS starter with Next.js, Better Auth, Drizzle, and three deployable apps.

---

## Start here

After clicking **Use this template**, do these five things before your first commit:

```bash
# 1. Install
pnpm install

# 2. Rename the example package
#    packages/example/package.json → set "name" to "@your-scope/your-package"
#    Update the directory name too: git mv packages/example packages/your-package

# 3. Point the repo at yourself
#    package.json        → name, description, author, repository
#    .github/CODEOWNERS  → your team
#    LICENSE             → copyright holder

# 4. Add your npm token as a repo secret
#    Settings → Secrets → Actions → NPM_TOKEN

# 5. Verify everything is green
pnpm lint && pnpm type-check && pnpm test:run && pnpm build
```

That's it. Write code in `packages/your-package/src/`, run `pnpm changeset` when you
want to release, and the pipeline handles the rest.

## What's included

| Layer          | What you get                                                                             | Why it matters                                                       |
| -------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Package**    | `packages/example` — ESM-only, `exports` map, separate build tsconfig, `files` allowlist | Publishes clean. No source, tests, or configs in the tarball.        |
| **Docs site**  | `apps/web` — Next.js 16 + Fumadocs, MDX content, full-text search, `llms.txt`            | Deployable docs from day one, LLM-readable by default.               |
| **Testing**    | Vitest, node environment, globals enabled                                                | Fast, zero-config, ESM-native.                                       |
| **Releases**   | Changesets + label-gated publish workflow                                                | Semver and changelogs are decided in the PR, not at publish time.    |
| **CI**         | Lint, type-check, test, build — each its own workflow, all with Turbo cache              | Failures name themselves. You see _what_ broke from the checks list. |
| **Tooling**    | pnpm 10 workspaces, Turborepo v2, Prettier, ESLint 9 flat config, husky                  | One command lints, types, tests, builds the whole workspace.         |
| **Governance** | 5 issue templates, PR template, CODEOWNERS, Dependabot, SECURITY.md                      | The paperwork a public repo needs, already filled in.                |

## Why this template

- **Modern, but boring where it matters.** TypeScript 6, Vitest 4, Turborepo 2, Next.js 16. Chosen because they're the default for new TypeScript packages in 2026.
- **Publishing is solved.** Changesets is initialized, the `exports` map is correct, and the tarball ships `dist/` and nothing else. You don't have to learn npm packaging to ship.
- **The docs site is real.** Fumadocs with search and `llms.txt` routes, not a placeholder README rendered as HTML.
- **Monorepo from the start, without the tax.** One package today, ten tomorrow. Turbo already knows the dependency graph.
- **CI that tells you what broke.** Four separate workflows instead of one wall of logs.

## Requirements

- Node.js **22+** (`engines.node: ">=22"` is enforced)
- pnpm **10+** — run `corepack enable` if you don't have it
- An npm account with publish rights to your scope, for releases only

## Available commands

Run from the repo root.

| Command             | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `pnpm dev`          | Start the docs site in dev mode                 |
| `pnpm build`        | Build every workspace                           |
| `pnpm test`         | Run tests in watch mode                         |
| `pnpm test:run`     | Run tests once, then exit — use this in scripts |
| `pnpm lint`         | Lint every workspace                            |
| `pnpm type-check`   | Type-check every workspace                      |
| `pnpm format`       | Rewrite files with Prettier                     |
| `pnpm format:check` | Check formatting without writing                |
| `pnpm changeset`    | Record a version bump and changelog entry       |
| `pnpm clean`        | Remove build outputs and `node_modules`         |

Scoped to a single workspace:

```bash
pnpm --filter @deessejs/example build
pnpm --filter @deessejs/example test
pnpm --filter web dev
```

## Project structure

```
.
├── apps/
│   └── web/                  # Next.js 16 + Fumadocs documentation site
│       ├── content/docs/     # Your MDX pages
│       └── src/app/          # Routes, incl. llms.txt and OG image generation
├── packages/
│   └── example/              # The publishable package — rename this
│       ├── src/              # Source
│       ├── tests/            # Vitest suites (outside src so dist/ stays clean)
│       ├── tsconfig.json     # Editor / type-check config (noEmit, includes tests)
│       └── tsconfig.build.json  # Build config (emits dist/, excludes tests)
├── .changeset/               # Pending version bumps
├── .github/
│   ├── workflows/            # lint, types, tests, build, release
│   └── ISSUE_TEMPLATE/       # bug, feature, docs, refactor, task
├── pnpm-workspace.yaml
└── turbo.json                # Task pipeline and cache config
```

## Adding a package

```bash
mkdir -p packages/my-package/src
```

Copy `package.json`, `tsconfig.json`, `tsconfig.build.json`, `eslint.config.js`, and
`vitest.config.ts` from `packages/example`, then update the `name`. Turbo and pnpm pick
it up on the next `pnpm install` — the workspace glob is `packages/*`, so there's no
registry to edit.

To depend on it from another workspace package:

```json
{
  "dependencies": {
    "@deessejs/my-package": "workspace:*"
  }
}
```

## Publishing

Releases are driven by [Changesets](https://github.com/changesets/changesets). Versions
are decided in the PR, not at publish time.

```bash
# 1. On your feature branch, describe the change
pnpm changeset
#    → pick the packages, pick patch/minor/major, write a one-line summary
#    → commit the generated file in .changeset/

# 2. Open your PR as usual
```

When the PR is ready to ship, add the **`version bump`** label before merging. On merge,
the release workflow builds, tests, versions, and publishes to npm.

> [!NOTE]
> No label, no publish. PRs merge normally without one — useful for docs, CI, and
> refactors that shouldn't cut a release.

### Required repository secrets

| Secret        | Required | Purpose                                                       |
| ------------- | -------- | ------------------------------------------------------------- |
| `NPM_TOKEN`   | Yes      | Automation token with publish rights to your scope            |
| `TURBO_TOKEN` | No       | Turborepo remote cache token                                  |
| `TURBO_TEAM`  | No       | Turborepo remote cache team (a repo _variable_, not a secret) |

`GITHUB_TOKEN` is provided automatically.

## Documentation site

`apps/web` is a Fumadocs site. Write MDX in `content/docs/` and it appears in the sidebar
automatically — the file tree is the navigation.

```bash
pnpm --filter web dev     # http://localhost:3000
```

| Env var                    | Required | Purpose                                           |
| -------------------------- | -------- | ------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`      | No       | Canonical URL, used for OG images and metadata    |
| `NEXT_PUBLIC_FUMADOCS_URL` | No       | Override the docs base URL when hosted separately |

Copy `apps/web/.env.example` to `apps/web/.env.local` to start. Defaults work locally.

### Deploying

Point a Vercel project at this repo with **Root Directory** set to `apps/web`. Build and
install commands are detected. The `llms.txt` and `llms-full.txt` routes are generated at
build time, so LLM crawlers get your docs as plain text with no extra setup.

## Architecture notes

- **Two tsconfigs per package, on purpose.** `tsconfig.json` is `noEmit` for your editor and `type-check`. `tsconfig.build.json` emits to `dist/` and excludes tests, so test files never reach the tarball.
- **ESM only.** The `exports` map declares `import` and `types`, with no CommonJS fallback. If you need CJS consumers, add a bundler — `tsc` alone won't produce a dual build.
- **`files`, not `.npmignore`.** The package allowlists what ships. New files are excluded by default, which is the safe direction to be wrong in.
- **Turbo topological ordering.** `build` declares `dependsOn: ["^build"]`, so dependencies build before dependents. Add workspace deps freely; the order follows.
- **Flat ESLint config.** ESLint 9 flat config (`eslint.config.js`), not `.eslintrc`. Each workspace owns its own.
- **Pre-commit runs lint and type-check.** Husky hook in `.husky/pre-commit`. Use `git commit --no-verify` to skip when you need to.

## Contributing

Open an issue to discuss larger changes. For typos, broken links, and small fixes, PRs are
welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the workflow and commit conventions.

Using this template for your own project and hit a rough edge? [Open an issue here](https://github.com/deessejs/package-template/issues) so the template improves for everyone.

## License

[MIT](./LICENSE).

## Support

- Issues: [github.com/deessejs/package-template/issues](https://github.com/deessejs/package-template/issues)
- Discussions: [github.com/deessejs/package-template/discussions](https://github.com/deessejs/package-template/discussions)
