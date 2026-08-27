# GitHub Packages

## Purpose

In addition to publishing to the public npm registry, the project
publishes the same package to GitHub Packages
(`https://npm.pkg.github.com`). The two destinations are kept in
sync by separate jobs inside the same release workflow. This
document describes the architecture, the configuration, and the
operational differences from the npm registry.

Cross-references:
[`github-releases.md`](./github-releases.md) describes the
GitHub.com-side Release artifact (tags, notes); this document
covers the package registry mirror.

## Why publish to GitHub Packages

Three reasons, in order of importance for this project:

1. **Internal consumption within the same organization.** GitHub
   Packages scopes a package to its repository or organization by
   default, which makes it well-suited for distributing internal
   packages without exposing them on the public npm registry.
2. **Discoverability in the GitHub UI.** A package published to
   GitHub Packages appears in the repository sidebar next to
   Releases. Consumers browsing the repo find the install command
   without navigating to npmjs.com.
3. **Per-repository access control.** A package on GitHub Packages
   inherits the repository's visibility (public or private).
   Publishing only to npm means internal distribution requires a
   separate mechanism (a private registry, a Verdaccio, etc.).

The trade-off: GitHub Packages isn't a substitute for npm. Public
consumers will install from `registry.npmjs.org` and the GitHub
Packages copy is a mirror, not the source of truth.

## Architecture

The release workflow contains two publish jobs that share the same
SHA but target different registries:

```
release.yml (same workflow, two jobs)
├── publish-stable    →  npm (Trusted Publishing, OIDC)
└── publish-gh-packages →  npm.pkg.github.com (GITHUB_TOKEN)
```

`publish-stable` runs first and is the source of truth for the
npm version. `publish-gh-packages` runs after it, idempotently,
using `GITHUB_TOKEN` for authentication. Either job can fail
independently; the workflow report shows both statuses.

## Why two jobs, not one

A single `npm publish` invocation can't target two registries at
once. `npm publish --registry=...` accepts one registry per call.
Splitting into two jobs keeps the responsibilities distinct:

- `publish-stable` uses Trusted Publishing (OIDC), no token. Critical
  path; success required for release.
- `publish-gh-packages` uses `GITHUB_TOKEN`. Best-effort mirror;
  failure doesn't block the npm publish.

The same pattern works if more registries are added later (for example,a
private Verdaccio for an internal-only distribution).

## Required workflow steps

```yaml
publish-gh-packages:
  needs: publish-stable
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  permissions:
    contents: read
    packages: write
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
        persist-credentials: false

    - uses: pnpm/action-setup@v6
    - uses: actions/setup-node@v6
      with:
        node-version: 22.14
        registry-url: 'https://npm.pkg.github.com'
        scope: '<your-github-org>'

    - run: pnpm install --frozen-lockfile
    - run: pnpm --filter @scope/example build
    - run: pnpm --filter @scope/example test:run

    - name: Publish to GitHub Packages
      run: |
        pnpm --filter @scope/example exec npm publish \
          --registry=https://npm.pkg.github.com \
          --tag latest \
          --provenance
      env:
        NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Three things to notice:

- `registry-url: 'https://npm.pkg.github.com'` on `setup-node`
  configures the `.npmrc` for the GitHub Packages registry. The
  `scope` input restricts the scope to the GitHub organization.
- The `--provenance` flag is supported on GitHub Packages even
  though provenance is hosted by npm's signing service, not
  GitHub's. Tarballs published to GitHub Packages carry a
  provenance attestation pointing to the GitHub Actions run.
- `permissions.packages: write` is the new permission required for
  the job. The base workflow doesn't declare this; each job
  declares its own.

## What gets mirrored

Only the publishable package. Today that's
`packages/example`. The docs site (`apps/web`) is `private: true`
and `pnpm changeset publish` skips it automatically.

The GitHub Packages copy lives in the GitHub organization's npm
namespace:
`https://github.com/orgs/<your-github-org>/packages`.

## Authentication differences vs npm

| Concern             | npm (Trusted Publishing)       | GitHub Packages                             |
| ------------------- | ------------------------------ | ------------------------------------------- |
| Auth mechanism      | OIDC token issued by Actions   | `GITHUB_TOKEN` (long-lived per job)         |
| Required permission | `id-token: write`              | `packages: write`                           |
| Setup               | One entry on npmjs.com per pkg | Implicit (token is automatic)               |
| Revocation          | Rotate the trusted publisher   | Rotate via GitHub org settings (rare)       |
| Token leakage risk  | None (OIDC, no static secret)  | Low (`GITHUB_TOKEN` is short-lived per job) |

The npm publish uses no static secret. The GitHub Packages publish
uses `GITHUB_TOKEN`, which is generated by GitHub per workflow run
and disposed of at the end. It can't be exfiltrated from the job
runner in a meaningful way, but it does have `packages: write`
across the org, which is broader than OIDC's per-package scope.

## Idempotence and failure handling

If `publish-stable` succeeds and `publish-gh-packages` fails, the
state is asymmetric: npm has the new version, GitHub Packages
doesn't. Three mitigations:

1. **`needs: publish-stable`** ensures GitHub Packages only runs
   after npm succeeds. A failure on the npm path short-circuits.
2. **Re-running** the failed `publish-gh-packages` job retries
   the publish. GitHub Packages allows republishing of the same
   version if the previous one was deleted; the workflow doesn't
   delete-on-fail.
3. **Asymmetric cleanup** is a separate concern: if `publish-stable`
   succeeds but is later rolled back via `npm deprecate` (see
   [`rollback.md`](../policies/rollback.md)), the GitHub Packages copy is
   not deprecated. A future `publish-gh-packages` will republish
   the new version, leaving the deprecated one visible on GitHub
   Packages until manually removed.

## Versions of published packages

GitHub Packages doesn't enforce the "1 version per package tag"
invariant that npm does. Multiple tarballs with the same version
can coexist if the workflow is re-run after a failure. The
`publish-gh-packages` job doesn't clean up old versions; if a
re-run needs to publish a missing version, the cleanup is manual
through the GitHub Packages UI.

## When to skip GitHub Packages

A team adopting this template may not want dual publishes. To
disable:

1. Remove the `publish-gh-packages` job from `release.yml`.
2. Delete this document.

The `publish-stable` job is unaffected and continues to publish to
npm alone. The GitHub Release artifact (covered in
[`github-releases.md`](./github-releases.md)) is also unaffected.

## Open questions

1. **Source-of-truth semantics.** Is npm the source of truth and
   GitHub Packages a mirror, or vice versa? The current setup is
   npm-first; reversing it would require swapping which job blocks
   the other.
2. **Retention.** GitHub Packages doesn't surface a retention
   policy. Old versions accumulate unless manually cleaned. A
   periodic cleanup script or a CI job is out of scope for this
   document but should be considered for monorepos with many
   packages.
3. **Private vs public.** When the package is published to npm
   with `access: "public"`, the GitHub Packages copy is, by
   default, visible only to org members. To make it public, the
   package needs an explicit visibility flag on the GitHub side
   after publish.
