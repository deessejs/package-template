# Stable releases on `main`

## What this flow does

When a PR is merged into `main` and Changesets finds pending changeset files,
the release workflow produces a stable release:

1. CI checks run (lint, types, build, tests).
2. `.github/workflows/release.yml`'s `publish-stable` job runs.
3. `changesets/action@v2` runs `pnpm version` (consumes the `.changeset/*.md`
   files, bumps the package version, regenerates the CHANGELOG, and creates
   a "Version Packages" commit).
4. The "Version Packages" commit is pushed to `main` and a "Version Packages"
   pull request is opened against `main` if there are leftover changesets,
   or the commit is pushed straight to `main` if everything was consumable
   in one pass.
5. `pnpm release` runs `changeset publish`, which publishes the package to
   the npm dist-tag `latest`.

The result: a tagged `git` commit on `main`, a CHANGELOG entry, and a new
npm release on `@latest`.

## Why `main` isn't the canary branch

`main` only receives changes that have already been validated on `staging`.
The release engineer opens the `staging → main` PR explicitly, it's a
deliberate human gate, not an automatic squash.

This is what makes `@latest` safe to install by default: every version on
that dist-tag was, at some prior point, a `@canary` version that passed
real-world smoke testing.

## What the workflow actually does

```
1. checkout@v4 with persist-credentials: false, fetch-depth: 0
2. pnpm/action-setup@v6
3. actions/setup-node@v6 (node-version: 22.14, registry-url: 'https://registry.npmjs.org')
4. pnpm install --frozen-lockfile
5. npm install -g npm@latest                 # Trusted Publishing needs npm ≥ 11.5.1
6. pnpm turbo build
7. pnpm turbo test:run
8. uses: changesets/action@v2
   with:
     version: pnpm version
     publish: pnpm release
     commit: 'chore: version packages'
     title: 'chore: version packages'
   env:
     GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

`registry-url: 'https://registry.npmjs.org'` on `setup-node` is required so
that the npm CLI knows which registry to authenticate against. Without it,
OIDC can't resolve.

## `changesets/action@v2` mechanics

The action does three things, in order:

1. **Version**, runs `pnpm version`, which calls `changeset version`. This:
   - Reads all `.changeset/*.md` files.
   - Computes the next semver for each package based on the bump types.
   - Updates `package.json` versions.
   - Rewrites `CHANGELOG.md` with the changeset entries.
   - Deletes the consumed `.changeset/*.md` files.
   - Creates a commit with message `chore: version packages`.

2. **Branch / PR**, if the action is triggered by a push to `main`, it
   pushes the version commit straight to `main`. If the trigger was something
   else, it opens a "Version Packages" PR against the configured base branch.

3. **Publish**, runs `pnpm release` (which is `changeset publish`):
   - Reads the package version from each publishable workspace's
     `package.json`.
   - Publishes the tarball to npm with the `latest` dist-tag.

The action uses the workflow's `GITHUB_TOKEN` to push the version commit and
open the PR. It uses **OIDC** (via the job's `id-token: write` permission)
to authenticate the actual `npm publish` call.

## Why this job uses `changesets/action@v2` (and canary doesn't)

The canary job runs raw `changeset version` + `changeset publish` because it
must not commit anything to git. The stable job runs `changesets/action@v2`
because committing the version bump to `main` is exactly what we want; it
records the released version in the repo's history.

If we ever needed an "ephemeral stable" mode (for example, a dry-run), the same raw
command pattern as the canary job would apply.

## Promotion mechanics: `staging → main`

The release engineer opens a PR from `staging` into `main`. Required checks
on this PR must include all CI jobs. Once the PR is approved and merged:

- The merge commit lands on `main`.
- The `publish-stable` job runs against the merge commit.
- The same changeset files that produced the canary versions on `staging`
  are now consumed on `main`.

The version number on `main` is what Changesets computes from the changeset
bump types, typically `1.2.1` (one bump over the previous stable), or
higher if the changesets collectively requested a minor or major bump.

## Manual trigger (`workflow_dispatch`)

The release workflow also accepts a manual trigger with a `dist-tag` input:

- `dist-tag=canary`, runs `publish-canary` against the current ref.
- `dist-tag=latest`, runs `publish-stable` against the current ref.

The manual trigger is a safety hatch for cases where:

- The auto publish on `main` failed and we need to retry without a new push.
- The release engineer wants to publish a hotfix from a non-default ref.

Manual runs respect the same OIDC and provenance requirements as automated
runs. There is no special "force" mode that bypasses them.

## Concurrency and re-runs

The workflow has a concurrency group keyed on
`${{ github.workflow }}-${{ github.ref }}`. Each ref has its own group, so
a `main` push never blocks a `staging` push and vice versa.

`cancel-in-progress: false`. A release that's mid-flight when a new commit
arrives will run to completion. This is deliberate: abandoning a release
mid-publish leaves the version bumped in the repo without a corresponding
npm artifact.

A failed publish on `main` is recoverable by a re-run of the same workflow
run, Changesets will re-consume the same changeset files. If the version
has already been published but the post-publish step failed, the next run
will detect that the version is already on npm and skip publish cleanly.

## Operational checklist (stable)

Before opening a PR into `main`:

- [ ] The current `staging` HEAD has a fresh `@canary` artifact that has been
      smoke-tested.
- [ ] The PR branch is up to date with `staging` (no merge conflicts).
- [ ] All required checks on the PR are green.
- [ ] The release engineer has explicitly approved the promotion.

After merge:

- [ ] The `publish-stable` job completes.
- [ ] A "Version Packages" commit appears on `main`.
- [ ] `npm view @scope/example dist-tags` shows `latest` pointing at the
      new version.
- [ ] The CHANGELOG is updated.

## Rollback

A bad stable release is rolled back by:

1. Publishing a new version that reverts the bad change (preferred;
   `npm unpublish` is restricted and discouraged).
2. Marking the bad version as `npm deprecate @scope/example@1.2.1`.

There is no automatic rollback from a canary. A canary is, by design,
ephemeral and exposed only to consumers who opt in by pinning `@canary`.
