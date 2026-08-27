# Per-PR preview releases

## Purpose

Every pull request on any branch produces a temporary preview tarball
that reviewers and downstream consumers can install. This document
describes how that channel works and how it relates to the regular
release flow.

The preview channel is implemented by `.github/workflows/preview.yml`
and uses [pkg.pr.new](https://pkg.pr.new), a service that builds and
publishes tarballs from any branch or PR without npm authentication.

## How it differs from the other channels

The package-template publishes to four distinct targets, with different
purposes:

| Channel | Triggered by                    | npm dist-tag           | Lifetime         | Audience                              |
| ------- | ------------------------------- | ---------------------- | ---------------- | ------------------------------------- |
| Preview | Any PR opened/synced            | (none, pkg.pr.new)     | Until PR closes  | PR reviewers, downstream integrations |
| Canary  | Push to `staging`               | `canary`               | Until superseded | Internal smoke testing                |
| Stable  | Push to `main`                  | `latest`               | Forever          | Production consumers                  |
| Hotfix  | Push of `hotfix/*` PR to `main` | `latest` (after merge) | Forever          | Production consumers (CVE fix)        |

The preview channel is **orthogonal** to the others. It runs at review
time, on every branch's PR, regardless of where the PR is targeted. The
canary, stable, and hotfix channels run at merge time, scoped to a
specific branch.

## What the workflow does

For every pull request opened, synchronized, or reopened, on any branch,
the workflow:

1. Checks out the PR's HEAD commit.
2. Installs dependencies with frozen lockfile.
3. Builds the publishable package (`pnpm --filter @scope/example build`).
4. Calls `pkg-pr-new publish './packages/example'`.

The output is a tarball published under the pkg.pr.new URL space,
identified by the PR number and commit SHA.

## What consumers see

When the pkg-pr-new GitHub App is installed on the repository, the
service posts (or updates) a comment on the PR with the install
command:

```bash
npm install https://pkg.pr.new/<owner>/<repo>/<package>@<sha>
```

Without the GitHub App, the workflow still runs and produces a tarball,
but no comment is posted. The tarball URL is still valid; consumers
find it through the workflow logs or a CI badge.

Each new commit on the PR rebuilds and re-posts the comment in place.
The bot never duplicates the comment.

## Interaction with the regular flow

The preview channel is **independent** of the canary/stable/hotfix
flow. A PR on `staging` produces both:

- A preview tarball at the moment the PR is opened (review-time).
- A canary dist-tag update at the moment the PR is merged (merge-time).

The two artifacts share the same commit SHA but live in different
registries. `@canary` is a dist-tag on npmjs.com; the preview is a
tarball on pkg.pr.new. They serve different audiences (PR reviewers
vs. internal validation) and have different lifetimes.

A PR on `main` is unusual in this repo because contributors should not
push directly to `main`. If one does, the PR still gets a preview
tarball, and after merge the canary/stable job on `main` runs to
publish to `@latest`.

A PR on `hotfix/*` is a regular PR for code review. The preview tarball
lets reviewers install and smoke-test the fix before approving it. The
hotfix publish to `@latest` happens only after the PR merges.

## Why use pkg.pr.new

Three reasons:

- **No secrets.** pkg.pr.new is a public service that does not require
  npm Trusted Publishing configuration. The `preview.yml` workflow has
  no `id-token: write` and no NPM_TOKEN.
- **No npm registry pollution.** Preview tarballs never reach npmjs.com,
  so `@canary` / `@latest` are not cluttered with intermediate builds.
- **Per-commit granularity.** Every PR commit gets its own tarball
  without consuming Changesets or bumping versions.

The trade-off: pkg.pr.new is an external service. If it goes down, the
preview channel is unavailable, but the canary/stable/hotfix channels
are unaffected because they use npm directly.

## Failure modes

### pkg.pr.new is unreachable

The workflow fails with a network or 5xx error. The PR comment is not
posted, but the canary/stable/hotfix flows continue to work on merge.
Downstream consumers who pinned to a preview tarball see no impact
until they try to install again.

### pkg-pr-new GitHub App is not installed

The tarball is still published. The PR comment is not posted. Reviewers
have to look at the workflow logs or check the pkg.pr.new dashboard to
find the install command. This is documented as accepted behaviour in
the existing `preview.yml`.

### Build fails on the PR commit

The workflow fails at the `build` step before reaching the publish step.
No preview tarball is produced. This is the same failure mode as any
other CI build failure: the PR cannot be merged until the build is
green.

## When to skip the preview

In rare cases, you may want to skip the preview workflow on a specific
PR. The cleanest way is to add the label `skip-preview` to the PR and
add a path filter to the workflow:

```yaml
on:
  pull_request:
    branches: [main, staging, dev]
    types: [opened, synchronize, reopened]
```

The path filter would exclude PRs that only touch docs or non-published
files. This is not currently configured; the workflow runs on every PR.
Adding such a filter is a separate change from this document's scope.

## Open questions

These are decisions the team should make and document elsewhere:

1. **Path filtering.** Should the preview workflow skip PRs that touch
   only docs, README, or `.github/workflows/`? Running on every PR is
   cheap but produces noise in the workflow list.
2. **Retention.** pkg.pr.new tarballs are kept indefinitely by default.
   Should the team configure a retention policy? pkg.pr.new does not
   expose this directly; tarball cleanup is the maintainer's
   responsibility.
3. **Notification channels.** Beyond the pkg-pr-new PR comment, should
   the team be notified on Slack/Discord when a preview is published?
   Useful for downstream teams that consume previews regularly.

Until these are answered, treat this document as a description of the
existing workflow, not an SOP.
