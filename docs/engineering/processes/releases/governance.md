# Governance and branch protection

## Purpose

This document defines the rules for who can do what on each branch in
this repository, and how those rules are enforced by GitHub branch
protection. It exists so that every contributor and maintainer knows
the boundaries, and so that a security review can audit the repository
against a stated policy.

## Branch roles

| Branch     | Who can push                    | Who can merge PRs                 | Notes                                  |
| ---------- | ------------------------------- | --------------------------------- | -------------------------------------- |
| `dev`      | Any contributor                 | Any contributor                   | Day-to-day work; unprotected.          |
| `staging`  | None (PR only)                  | Release engineer                  | Auto-publishes `@canary`.              |
| `main`     | None (PR only)                  | Release engineer                  | Auto-publishes `@latest`.              |
| `hotfix/*` | Release engineer, security team | Release engineer or security team | Short-lived; deleted after back-merge. |

`dev` is the only branch that accepts direct pushes. `staging` and
`main` accept merges only via pull request.

## Required status checks

The following CI jobs must pass on every PR into `staging` or `main`
before the merge button is enabled:

- **Lint**: `pnpm format:check && pnpm turbo lint`
- **Type Check**: `pnpm turbo type-check`
- **Build**: `pnpm turbo build`
- **Test**: `pnpm turbo test:run`
- **Coverage**: `pnpm turbo test:coverage` (non-blocking; comment-only)
- **Publish Dry Run**: `pnpm --filter @scope/example exec npm pack --dry-run`
- **Vale**: docs lint via `vale-cli/vale-action@v3`

The `Coverage` job is configured to comment but never block; see
[`.github/workflows/coverage.yml`](../../../workflows/coverage.yml) for
the implementation.

## Review requirements

- PRs against `dev` require **no review** (open contribution model).
- PRs against `staging` require **one reviewer** from `@deessejs/engineering`
  via `CODEOWNERS`.
- PRs against `main` require **one reviewer** from `@deessejs/engineering`.
- PRs against `hotfix/*` follow the rules in
  [`hotfix-on-main.md`](./hotfix-on-main.md): single-reviewer fast path
  is sufficient when the reviewer is on the release engineering or
  security team.

## CODEOWNERS

`.github/CODEOWNERS` declares the teams that own different parts of the
repository. Today the default is:

```
* @deessejs/engineering
/.github/ @deessejs/engineering
```

A team adopting this template should update the team handle to their
own. CODEOWNERS assignments automatically request review when a PR
touches a matching path.

## Two-person rule for hotfixes

A hotfix PR requires a single approver, but the approver **must not** be
the same person who wrote the fix. This is the four-eyes rule for
hotfix merges. The release engineer is the typical approver; the
security team is the fallback.

## Signed commits

Commits to `staging` and `main` should be signed. This is not
currently enforced by branch protection; it is a recommended practice
for new contributors. To enable signing locally, see
[GitHub: About commit signature verification](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification).

## Force-push and deletion

`staging` and `main` reject force-pushes and branch deletion via
branch protection. `dev` allows both. `hotfix/*` is deleted after the
back-merge completes (see [`back-merge.md`](./back-merge.md)).

## How to update this document

Changes to branch protection rules require a PR that:

1. Updates this document.
2. Updates the actual branch protection settings in the GitHub UI or
   via the GitHub API.
3. Updates `.github/CODEOWNERS` if ownership is changing.

The release engineer is the default owner of this document.
