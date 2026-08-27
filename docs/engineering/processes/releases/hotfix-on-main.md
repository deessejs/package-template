# Hotfix releases on `main`

## Purpose

A hotfix is a release that ships to `@latest` **without going through the
normal `staging → main` promotion**. The round-trip is too slow for confirmed
production-impacting bugs and security CVEs. This document describes when to
invoke the hotfix process and how it works.

The companion documents (`canary-on-staging.md`, `stable-on-main.md`,
`trusted-publishing-setup.md`, `incident-response.md`) describe the regular
flow and its failure modes. This document only covers what's different when
bypassing that flow.

## What "hotfix" means here

A hotfix is a **patch-level** semver bump (`1.2.1` → `1.2.2`) that addresses a
confirmed production bug or security CVE, and ships without the staging
gate. Anything that needs a `minor` or `major` bump isn't a hotfix; it's
a release that should still go through `staging → main`.

This definition is deliberately strict. The cost of a hotfix is that the
release was never validated as a `@canary` artifact on `staging`. Limiting
hotfixes to patch bumps keeps that blast radius small.

## When to invoke this process

All of the following must be true:

- The change is a **patch-level** semver bump.
- The change addresses a **confirmed production-impacting bug** or a
  **published security advisory** (or an actively exploited CVE).
- The release engineer or security team authorizes bypassing staging.

If any of these isn't true, use the normal `staging → main` flow.

## Branching

- Branch from `main`, not from `staging`. `staging` may contain unreleased
  dev work that shouldn't ship in a hotfix.
- Convention: `hotfix/<ticket-or-short-desc>`, for example,`hotfix/CVE-2024-1234`
  or `hotfix/fix-token-revocation`.
- Open a PR against `main`.
- Label the PR `hotfix` so it can be filtered downstream.
- One approver from the release engineering or security team is sufficient
  (not the normal two-reviewer rule).

## Changeset

The PR must include a `.changeset/*.md` file with a `patch` bump for the
affected packages. Body format:

```md
---
'@scope/example': patch
---

[HOTFIX] or [SECURITY] one-line description of the fix.
```

The `[HOTFIX]` or `[SECURITY]` prefix is mandatory. It surfaces in the
auto generated CHANGELOG entry and makes grep-based filtering trivial for
post-mortems.

When the PR merges to `main`, the changeset file is consumed by
`changesets/action@v2` like any other release changeset.

## How the hotfix ships

The hotfix ships through the **existing** release workflow file
(`.github/workflows/release.yml`). It doesn't need a separate workflow
file because npm Trusted Publishing allows only one trusted publisher per
package, and that entry already points at `release.yml`.

Two-phase publication:

1. **Validation phase** (optional but recommended): a snapshot-style canary
   publish to the `@hotfix` npm dist-tag, produced from the `hotfix/*`
   branch. The artifact is ephemeral; no commit's pushed, no changeset
   is consumed. The release engineer smoke-tests the artifact.

2. **Promotion phase**: merge the hotfix PR into `main`. The existing
   `publish-stable` job runs normally, consumes the changeset for a real
   semver bump (`1.2.2`), and publishes to `@latest`.

Both phases reuse the trusted publisher configuration. No npm-side
reconfiguration is required.

## What happens to `@canary`

Nothing. The hotfix publish path targets `@latest` (and optionally
`@hotfix` for the validation phase). The `@canary` dist-tag is unchanged.
Consumers who pinned `@canary` continue to resolve to the most recent dev
snapshot.

## Post-merge cleanup

After the hotfix ships to `@latest`, do these three things in order.

### 1. Back-merge the fix to `staging`

The fix code must reach `staging` so that the next regular release contains
it, and so that the next canary on `staging` doesn't compute a version
that collides with the hotfix already on npm.

The canonical approach is a forward-merge (`git merge --no-ff
origin/hotfix/<name>`) when the hotfix branch is still alive. Cherry-pick
is a fallback when the branch has been deleted or staging has churn that
makes forward-merging impractical.

The full procedure, conflict-resolution rules, and audit checklist are in
[`back-merge.md`](./back-merge.md). don't cherry-pick the changeset file
under any approach; it has already been consumed on `main` and would
double-bump if reintroduced.

### 2. Watch the next canary version

After the cherry-pick, the next `staging` canary publishes as
`1.2.3-canary.<sha>` (or higher if pending changesets demand it). This
version is greater than the hotfix `1.2.2` on `@latest`, so no collision.

If the cherry-pick is delayed and you need to publish a canary before it
lands, add a no-op `patch` changeset to `staging` to force the version to
skip past the hotfix. Acceptable but pollutes the CHANGELOG.

### 3. Communicate

- Pin a GitHub issue with label `incident`.
- If the hotfix addresses a CVE, follow the disclosure timeline in
  `SECURITY.md` at the repository root. Coordinate with the security
  contact before any public disclosure.
- `@latest` consumers get the fix on their next install; a notification is
  recommended for security fixes but not required.
- `@canary` consumers don't need to be notified.

## Failure modes

### Half-bumped hotfix

`changeset version` ran on the hotfix branch, but `changeset publish`
failed (OIDC misconfig, npm outage, network). State of the world:

- The "Version Packages" commit's on `main` with the new version in
  `package.json`.
- The new version isn't on npm.
- `latest` still points to the previous version.

Re-run the workflow. Changesets will detect that `package.json` already
contains the next version and skip the version step on retry, going
straight to `changeset publish`.

### Hotfix merged before validation completes

If the validation phase surfaces a problem after the merge, don't
publish a corrective patch on the same PR. The hotfix has already shipped
to `@latest`. The corrective patch goes through the normal `staging →
main` flow as a regular release.

### Hotfix superseded by a regular release

If a regular staging release ships a newer version before the hotfix is
published (rare race), the hotfix PR must be rebased on the new `main`
before merging. The hotfix changeset must be updated to reflect the new
base version. Changesets won't auto correct this.

## Decisions

The following operational choices have been made for this repository.
they're documented here so they survive across maintainer rotations.

1. **Authorization.** A single release engineer authorizes a hotfix. The
   release engineer is identified in `CODEOWNERS` for the release-process
   docs.
2. **Validation SLA.** Best-effort smoke test. The release engineer
   installs the canary artifact in a sandbox or reproduction environment,
   verifies the fix is present, then merges. Full CI plus manual
   verification is reserved for releases with larger blast radius.
3. **Release-line policy.** Single active line for now. When `2.x`
   ships, `1.x` continues receiving security fixes for a grace period
   defined elsewhere. This document assumes a single line and doesn't
   describe the backport procedure; revisit when `2.x` is cut.
4. **CODEOWNERS review.** Single-reviewer approval is sufficient for
   `hotfix/*` PRs. The reviewer must be the release engineer or a
   security team member. Two-reviewer approval is still required for
   regular `staging → main` promotions.

These decisions are operational defaults. The release engineer can
deviate from them with justification documented in the hotfix PR's merge
commit message.
