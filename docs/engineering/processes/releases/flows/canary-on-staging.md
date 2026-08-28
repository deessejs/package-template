# Canary releases on `staging`

## What this flow does

Every push (PR merge) to `staging` triggers a canary publish:

1. CI checks run (lint, types, build, tests).
2. `.github/workflows/release.yml`'s `publish-canary` job runs.
3. Changesets runs in **snapshot mode**: `pnpm changeset version --snapshot canary`.
4. The publishable package is published to the npm dist-tag `canary` with
   `pnpm changeset publish --tag canary --no-git-tag`.
5. The changes for this push are now installable as
   `npm install @scope/example@canary`.

The canary job is **read-only on git**, no commits, no pushes. This is the
key invariant that lets the same changeset files survive from `staging` all
the way to `main`.

## Why snapshot mode

Changesets normally consumes `.changeset/*.md` files when it versions
packages. Once consumed, they can't be replayed. This is fine for a single
release branch but breaks the `staging → main` promotion: if the same
changesets are consumed on `staging`, no version bump happens when the same
content reaches `main`.

Snapshot mode (`--snapshot canary`) runs the same versioning logic but treats
the result as ephemeral:

- The package.json version becomes `<next-version>-canary`. Today this is
  typically a `minor` bump over the last stable (for example, `1.0.0`
  yields `1.1.0-canary`).
- The changeset files are still consumed on the runner's filesystem.
- **Nothing is committed.** The runner exits with a modified working tree
  that no one ever sees again.

When the same changes reach `main`, a fresh `changeset version` (normal mode)
runs against the un-modified `.changeset/*.md` files and consumes them for
the real release.

## Version format

Configured in `.changeset/config.json`:

```jsonc
"snapshot": {
  "useCalculatedVersion": true,
  "prereleaseTemplate": "{tag}"
}
```

- `useCalculatedVersion: true`: snapshot versions follow the next semver
  derived from current changesets, not `0.0.0-canary.<…>`. After a
  stable `1.2.0`, the first canary is `1.3.0-canary` (or `1.2.1-canary`,
  depending on what the changesets say), not `0.0.0-canary.<…>`.
- `prereleaseTemplate: "{tag}"`: produces versions like `1.3.0-canary`
  where `1.3.0` is the computed next semver.

This template doesn't embed the commit SHA in the canary version. Changesets
in `--snapshot` mode doesn't substitute `{commit-short}` (that placeholder
only works in `pre enter` pre-release mode). Without a SHA suffix:

- Two canaries built from the same commit conflict at npm publish time
  (npm refuses duplicate versions). This is acceptable: re-publishes of
  the same commit are rare and a no-op anyway.
- The SHA is recoverable from the GitHub Actions run provenance or from
  the GitHub commit the run targeted, both of which npm records alongside
  the published tarball.

## What the workflow actually does

```
1. checkout@v4 with persist-credentials: false, fetch-depth: 0
2. pnpm/action-setup@v6
3. actions/setup-node@v6 (node-version: '24.x')
4. pnpm install --frozen-lockfile
5. pnpm --filter @scope/example build
6. pnpm --filter @scope/example test:run
7. pnpm changeset version --snapshot canary
8. pnpm changeset publish --tag canary --no-git-tag
   env: NPM_CONFIG_PROVENANCE=true
```

Note: node-version `'24.x'` is required to get a recent enough npm that
satisfies Trusted Publishing's minimum. Earlier requirements included a
`npm install -g npm@latest` step; this is no longer needed because the
default npm on the 24.x runner is recent enough.

Step 5 is non-obvious. The default `ubuntu-latest` GitHub runner ships with
npm 10.x. Trusted Publishing requires npm 11.5.1 or later. Without the
upgrade, the publish fails with a generic `ENEEDAUTH` and OIDC is never even
attempted.

`--no-git-tag` on both `version` and `publish` prevents the runner from
creating local git tags for snapshot canaries; they're ephemeral and don't
deserve long-lived pointers.

`NPM_CONFIG_PROVENANCE=true` is belt-and-suspenders. Trusted Publishing
attaches provenance automatically, but pinning the env var makes the
intent explicit and survives any future action-version drift.

## Why this job doesn't use `changesets/action@v2`

`changesets/action@v2` creates a "Version Packages" PR after versioning, which
is the wrong behaviour on `staging`. Snapshot mode's entire point is that
the result is ephemeral; we want to publish, not commit a version PR.

The canary job uses raw `changeset version` + `changeset publish` instead.
Same tool, no action wrapper, no PR creation.

## What gets published

Only packages that are neither `private` nor in the `ignore` list of
`.changeset/config.json`. Today, the publishable package is `@scope/example`
(named `@deessejs/example` in the template, renamed by `pnpm setup`).
The docs site (`apps/web`) is `private: true` and ignored; it never reaches
npm.

## Re-running a failed canary

A re-run with the same commit produces the same canary version
(`1.3.0-canary`). npm rejects republishing an existing version. This
is acceptable: re-runs only succeed when the underlying issue was transient
(network, npm registry hiccup) and the previous publish didn't actually
land. If the publish did land but a downstream step failed, a new canary
requires a new commit.

## Promotion to `main`

When the release engineer is satisfied with the canary artifact, they open a
PR from `staging` into `main`. The `publish-stable` job runs on that merge;
see `stable-on-main.md`. The same changeset files that produced
`1.3.0-canary` are now consumed for the real `1.3.0` stable release.

The canary tag on npm is left in place. `npm install @scope/example@canary`
continues to resolve to the most recent canary.

## What happens without changesets

If a push to `staging` happens with no `.changeset/*.md` files, the snapshot
job still runs and publishes a canary version anyway. Changesets computes a
bump from the current version (typically `minor` when nothing has changed
on `main` since the last canary). This is rarely the desired behaviour;
include a changeset in any PR that should produce a meaningful canary.

## Operational checklist (canary)

Before opening a PR against `staging`:

- [ ] The PR has at least one `.changeset/*.md` file describing the change
      with the correct semver bump.
- [ ] Local `pnpm changeset version --snapshot canary` produces a sensible
      version.
- [ ] Local `pnpm changeset publish --tag canary --no-git-tag` succeeds
      against a clean tag.
- [ ] The branch is up to date with `staging`.

After merge:

- [ ] The `publish-canary` job on the merge commit completes.
- [ ] `npm view @scope/example dist-tags` shows `canary` pointing at
      `<next-version>-canary`.
- [ ] Downstream consumers on `@canary` install successfully.
