# Adding a Workspace

Runbook for adding a new `apps/*` or `packages/*` workspace to this
template. Read it once end-to-end before scaffolding; the sequence
matters.

---

## 1. Decide which kind

| Kind         | When                                | Example                         |
| ------------ | ----------------------------------- | ------------------------------- |
| `apps/*`     | Deployable surface or runnable tool | Next.js site, CLI binary        |
| `packages/*` | Library intended for npm publish    | SDK, utility, framework adapter |

A workspace that is both runnable and importable (a CLI you can also
`import` as a library) still lives in `apps/*` if its primary delivery
is the binary; the importable parts can be split into a `packages/*`
later.

---

## 2. Scaffold from a neighbour

Pick the closest existing workspace and copy it. The shapes are kept
intentionally similar so that copying is the correct default — do not
invent a new layout.

| Starting point      | Use when                         |
| ------------------- | -------------------------------- |
| `packages/example/` | Adding a new publishable library |
| `apps/web/`         | Adding a Next.js / web app       |

The files you must copy:

- `package.json`
- `tsconfig.json` and `tsconfig.build.json` (if your workspace builds)
- `eslint.config.js` or `eslint.config.mjs`
- `vitest.config.ts` (if your workspace has tests)
- `src/` skeleton

Then change:

- `name` in `package.json` to your scoped name (`@scope/workspace-name`)
- The `description`
- The `repository` URL if it differs from the template's
- The directory name itself (`git mv packages/example packages/your-name`)

The `pnpm-workspace.yaml` glob `packages/*` / `apps/*` picks the new
directory up automatically. No registry to edit.

---

## 3. Match the Turbo pipeline contract

Every workspace must expose at least:

| Script       | Purpose                                        |
| ------------ | ---------------------------------------------- |
| `build`      | Produces the deployable / publishable artifact |
| `test:run`   | Single-run test (CI-safe)                      |
| `type-check` | `tsc --noEmit` against `tsconfig.json`         |
| `lint`       | ESLint flat config over the workspace          |
| `clean`      | Removes build outputs and caches               |

Optional:

| Script | Purpose                 |
| ------ | ----------------------- |
| `test` | Watch mode (Vitest)     |
| `dev`  | Long-running dev server |

If your workspace omits any required script, `turbo run build` from the
root will silently skip it. Verify with `pnpm turbo run <task> --dry` if
in doubt.

---

## 4. Match the package conventions

If the workspace is publishable (`packages/*` or an `apps/*` you intend
to ship on npm):

- ESM only — `exports` declares `import` + `types`, no `require`.
- `files` allowlist, no `.npmignore`.
- Two `tsconfig` files: one for the editor/type-check, one for emit.
- Tests live in `tests/` (or `src/**/*.test.ts` if you prefer), but
  never inside the path that ends up in `dist/`.

See [`architecture.md`](./architecture.md#package-conventions) for the
full set of conventions and [`invariants.md`](./invariants.md#package-shape)
for the rules that must not be broken.

---

## 5. Wire up workspace dependencies

To depend on another workspace package:

```json
{
  "dependencies": {
    "@scope/other-package": "workspace:*"
  }
}
```

Run `pnpm install` from the repo root. The lockfile is updated
automatically. Never write a version range for a workspace dependency —
`workspace:*` is the only correct value.

---

## 6. Extend CI if needed

The default `ci.yml` runs `pnpm lint && pnpm type-check && pnpm
test:run && pnpm build` over all workspaces. If your workspace needs
extra steps (e.g. publishing a tarball, deploying a preview), add a new
workflow in `.github/workflows/` rather than overloading `ci.yml`. See
[`architecture.md`](./architecture.md#ci-design) for the split.

---

## 7. Document and changelog

- Add a `README.md` inside the workspace explaining what it does and
  how to run it. Keep it short — Fumadocs is for end-user docs, not
  contributor docs.
- If the workspace is a new public package, add an entry to the
  root `README.md` table of contents.
- For changes that should cut a release, run `pnpm changeset` on the
  feature branch and commit the generated file.

---

## 8. Verify locally before opening the PR

```bash
pnpm install
pnpm --filter @scope/your-workspace build
pnpm --filter @scope/your-workspace test:run
pnpm --filter @scope/your-workspace type-check
pnpm --filter @scope/your-workspace lint
```

Then from the repo root:

```bash
pnpm lint && pnpm type-check && pnpm test:run && pnpm build
```

If any of those fail, the PR will fail. Fix locally first.

---

## Worked example: adding `apps/cli`

The pattern for a CLI workspace:

1. `git mv apps/web apps/cli.tmp && git mv apps/web content apps/cli/content` —
   no, this is wrong; copy the shape, don't move the web app.
2. `mkdir -p apps/cli/src apps/cli/bin apps/cli/tests`
3. Copy `apps/web/package.json`, `apps/web/tsconfig.json`,
   `apps/web/eslint.config.mjs`, `apps/web/vitest.config.ts` (if used).
4. Strip the Next.js / React dependencies from `package.json`. Add the
   CLI runner you chose (e.g. `commander`, `yargs`, `gunzip`).
5. Add a `bin` field:
   ```json
   {
     "bin": {
       "your-cli": "./bin/your-cli.mjs"
     }
   }
   ```
6. Create `bin/your-cli.mjs` with a shebang (`#!/usr/bin/env node`) and
   re-export the `src/index.ts` entrypoint.
7. Match the pipeline contract (§3).
8. Verify (§8).

This example is intentionally generic — the actual `apps/cli/` shape
will depend on whether it consumes the docs corpus directly (Option A),
the build artifacts (Option B), or a shared indexer package (Option C).
Resolve that decision before scaffolding, not after.
