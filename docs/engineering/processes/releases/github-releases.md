# GitHub Releases

## Purpose

When a published version reaches npm `@latest`, it should also produce
a GitHub Release on this repository, so consumers browsing the GitHub
UI can see what's in each version. This document describes which
publishes produce a GitHub Release, and how to configure
`changesets/action@v2` to generate them.

Cross-references:
[`stable-on-main.md`](./stable-on-main.md) describes the npm side of the
stable publish; [`hotfix-on-main.md`](./hotfix-on-main.md) describes
the hotfix flow.

## Which channels produce a GitHub Release

The release pipeline has four publish channels. GitHub Releases are
created only on the two that ship to `@latest`:

| Channel | npm dist-tag | GitHub Release? | Why                                   |
| ------- | ------------ | --------------- | ------------------------------------- |
| Preview | (pkg.pr.new) | No              | Internal PR review, no version bump.  |
| Canary  | `canary`     | No              | Internal smoke test, ephemeral.       |
| Stable  | `latest`     | **Yes**         | Production milestone.                 |
| Hotfix  | `latest`     | **Yes**         | Production milestone, security track. |

Canary versions get a tag and a dist-tag on npm but **no** GitHub
Release. The volume would be too high and the audience is too narrow
(internal smoke testing only). Preview tarballs via pkg.pr.new never
reach npm or GitHub Releases.

## How `changesets/action@v2` creates a Release

The action creates a GitHub Release when its `create-github-releases`
input is `true`. The Release body is generated automatically from:

- The changeset(s) consumed in the version bump.
- The commit log between the previous tag and the new tag.
- The PRs linked to those commits, when accessible.

The default value of `create-github-releases` is `false`; the project
must opt in by setting it explicitly. There is no separate
`prerelease` flag; canaries skip the Release step entirely by using
the raw `changeset publish` command instead of the action.

## Required workflow step

In `.github/workflows/release.yml`, the `publish-stable` job uses
`changesets/action@v2`. Add the input:

```yaml
- uses: changesets/action@v2
  with:
    publish: pnpm release
    create-github-releases: true
```

This produces a Release on every successful stable publish. Git tags
are pushed automatically (`push-git-tags` defaults to `true` when
`create-github-releases` is `true`).

For the hotfix flow, the same workflow file is reused
(see [`hotfix-on-main.md`](./hotfix-on-main.md)). The same
`create-github-releases: true` setting applies; the action does not
distinguish between stable and hotfix promotions, both look like
"merge to `main`" events.

## What goes in the Release body

The action fills the body with:

- A header line with the new version.
- Bullet points, one per consumed changeset, formatted from the
  `.changeset/*.md` body.
- A list of contributors extracted from the commit authors.
- A "Full Changelog" link comparing the previous tag to the new tag.

For hotfix releases, the changeset body carries a `[HOTFIX]` or
`[SECURITY]` prefix (per `hotfix-on-main.md`), which surfaces
prominently in the generated Release notes. Consumers scanning
release notes for a security fix can find it without reading the
CHANGELOG.

## Provenance and attestation

GitHub Releases are not the same as npm provenance. npm provenance
attestation is a signed statement attached to the npm tarball via
Trusted Publishing (OIDC), and is independent of any GitHub Release.

The two are complementary: npm provenance tells consumers where the
tarball was built; the GitHub Release tells them what changed and
links to the PRs. Both should be present for a senior-level release
process.

## What does not need to change

- `.github/release.yml` is **not required** for `changesets/action@v2`
  to work. That file controls GitHub's auto-generated release notes
  UI categorization (Breaking Changes / Features / Dependencies)
  based on PR labels. It is orthogonal to `changesets/action`.
- Branch protection on `main` does not need to be relaxed. The
  action's `contents: write` permission is sufficient.
- The npm version is not affected. The Release is a GitHub-side
  artifact; the npm tarball is what consumers install.

## When to disable GitHub Releases

If the team prefers to keep release notes only in `CHANGELOG.md` and
on npm, set `create-github-releases: false` (or omit the input). The
release workflow still works; only the Release artifact is skipped.

## Open questions

These are decisions the team should make and document elsewhere:

1. **Auto-generated categories.** Should the project configure
   `.github/release.yml` to categorize PRs by labels
   (`breaking-change`, `feature`, `fix`)? It is independent of
   Changesets and can be added later without a workflow change.
2. **Security advisory linkage.** Should hotfix Releases that address
   a CVE include a "Reported by" credit and a link to the GitHub
   Security Advisory? Recommended for projects with external
   security researchers, overkill for internal-only releases.
3. **Pre-release versioning.** If the project ever ships a `2.0.0-rc.1`
   line, `changesets/action@v2` will create a Release automatically.
   That Release is fine to mark as a prerelease on the GitHub side,
   but the action does not handle this; it would need a custom step.
