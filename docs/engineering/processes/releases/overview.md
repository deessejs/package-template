# Release Process — Overview

<!-- dummy edit for verification -->


## Purpose

This document describes the release engineering model used by the
`package-template` monorepo. It is the entry point for new maintainers and
contributors who need to understand how a code change becomes a published
artifact on npm.

## The model in one paragraph

We publish to npm through two **dist-tags** driven by two **protected
branches**:

- `staging` → publishes a **canary** to the npm dist-tag `canary`.
- `main` → publishes a **stable** to the npm dist-tag `latest`.

Both branches use the same Changesets workflow, the same GitHub Actions file
(`.github/workflows/release.yml`), and the same npm Trusted Publishing (OIDC)
configuration. The only difference is which dist-tag the publish targets and
which mode Changesets runs in (`--snapshot canary` for canary, normal mode for
stable).

## Branches

| Branch   | Role                | Publishes to  | Changesets mode              |
| -------- | ------------------- | ------------- | ---------------------------- |
| `dev`    | Day-to-day work     | (nothing)     | (nothing)                    |
| `staging`| Release candidate   | `canary` tag  | `version --snapshot canary`  |
| `main`   | Production          | `latest` tag  | `version` (normal)           |

The promotion flow is `dev → staging → main`. `dev` is unrestricted; `staging`
and `main` are branch-protected and accept merges only via PR.

## Why two branches, not one

A single branch publishing on every merge makes the "is this safe to ship?"
question hard to answer. With two branches, the question is localized:

- Every PR merged on `staging` produces a tagged, installable canary artifact
  within minutes. Smoke tests, contract tests, and downstream consumers can
  pin `@canary` to validate integrations.
- Promotion to `main` is a deliberate human action — opening and merging the
  `staging → main` PR. That merge publishes the same artifacts under
  `@latest`, with the same Changesets having been consumed on `main` for a
  real semver bump.

The cost of the second branch is one PR per release. The benefit is that
"latest" always means "passed staging", and "canary" always means
"currently being validated."

## What the workflow file looks like

`.github/workflows/release.yml` is a single workflow with two jobs, gated by
`if: github.ref == 'refs/heads/<branch>'`. Trusted Publishing (OIDC) is
configured against this filename on npmjs.com; npm validates the file name,
not the job, so a single trusted-publisher entry covers both publish paths.

```
push to staging  → publish-canary  job runs (changeset version --snapshot canary + publish --tag canary)
push to main     → publish-stable  job runs (changesets/action@v2 — version + publish)
workflow_dispatch with dist-tag=canary → publish-canary job runs manually
workflow_dispatch with dist-tag=latest → publish-stable job runs manually
```

## Why Trusted Publishing

Trusted Publishing replaces long-lived `NPM_TOKEN` secrets with short-lived
OIDC tokens issued by GitHub Actions at job time. Two practical benefits:

- **No secrets to rotate.** The OIDC token is minted, used, and discarded
  within the publish job. There is no `NPM_TOKEN` in the repository's secrets
  list.
- **Provenance by default.** npm attaches a signed provenance attestation to
  every published tarball, attesting that the build was produced by this
  repository's CI on this commit.

Trade-off: npm allows only **one trusted publisher per package**. This is
why both branches publish through the same workflow file (`release.yml`).

## What this documentation set covers

| Document                              | Covers                                                                                       |
| ------------------------------------- | -------------------------------------------------------------------------------------------- |
| `overview.md` (this file)             | The model, branches, rationale                                                               |
| `canary-on-staging.md`                | Snapshot mode, version format, why no commit, re-run behaviour                               |
| `stable-on-main.md`                   | The `changesets/action` flow, version-PR mechanics, promotion staging → main                 |
| `trusted-publishing-setup.md`         | One-time npm configuration, post-`pnpm setup` reconfiguration, common pitfalls                |
| `incident-response.md`                | What to do when a canary or stable publish fails, half-bumped versions, version conflicts    |

Read this file first, then the canary doc if you ship daily, then the stable
and Trusted Publishing docs when you cut a release or onboard a new package.

## Glossary

- **Canary** — A pre-release build published to the npm dist-tag `canary`.
  Identified by a version like `1.2.1-canary.a1b2c3d` (tag + 7-char commit SHA).
- **Stable** — A production release published to the npm dist-tag `latest`.
  Identified by a plain semver version like `1.2.1`.
- **Dist-tag** — A pointer on the npm registry that maps a label (`canary`,
  `latest`, `next`, …) to a specific version. `npm install pkg@canary`
  resolves through this mapping.
- **Snapshot release** — A Changesets mode (`changeset version --snapshot <tag>`)
  that produces a pre-release version without consuming the changeset files.
  Used for the canary path.
- **Trusted Publishing** — npm's OIDC-based authentication mechanism for CI.
  Replaces `NPM_TOKEN` secrets.
- **OIDC** — OpenID Connect. The protocol GitHub Actions uses to mint
  short-lived identity tokens that npm validates before publishing.
