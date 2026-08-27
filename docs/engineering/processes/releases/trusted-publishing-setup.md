# Trusted Publishing, one-time setup

## What Trusted Publishing gives us

Trusted Publishing replaces a long-lived `NPM_TOKEN` GitHub secret with a
short-lived OIDC token that npm mints on demand, valid only for the
duration of a single publish job. Two practical benefits:

- **No secrets to manage.** There is no `NPM_TOKEN` to rotate, leak, or
  accidentally commit.
- **Provenance by default.** Every published tarball carries a signed
  attestation linking it back to the exact commit and CI run that produced
  it.

The trade-off is operational: npm requires each package to have **exactly
one** trusted publisher configured, and adding a second one overwrites the
first. This is why both branches in our flow publish through the same
workflow file; see `overview.md` for the rationale.

## The single trusted publisher

The trusted publisher entry on npmjs.com looks like this:

| Field             | Value                                        |
| ----------------- | -------------------------------------------- |
| Provider          | GitHub Actions                               |
| Repository        | `<owner>/<repo>` (for example,`acme/widget`) |
| Workflow filename | `release.yml`                                |
| Environment name  | (blank, unless using GitHub Environments)    |

The "Workflow filename" field must match the path of the workflow file
**inside `.github/workflows/`**. Because both jobs (canary and stable) live
in the same file, one trusted publisher entry covers both publish paths.

## Step-by-step setup (initial)

For each publishable package in the monorepo:

1. **npm ≥ 11.5.1** on the publish job. GitHub-hosted runners ship with
   npm 10; the workflow includes an explicit `npm install -g npm@latest`
   step before publish to guarantee the minimum version.

2. **Node ≥ 22.14** on the publish job. Pinned in
   `actions/setup-node@v6` with `node-version: 22.14`.

3. **`registry-url: 'https://registry.npmjs.org'`** on the `setup-node`
   call. Without it, OIDC can't resolve.

4. **`id-token: write` permission** on the publish job. Both jobs in
   `release.yml` have this.

5. **Configure the trusted publisher on npmjs.com**:
   - Go to https://www.npmjs.com/package/`<scope>/<package>`/access.
   - Under "Trusted Publisher", click "Add trusted publisher".
   - Select "GitHub Actions".
   - Fill in:
     - Owner: `<owner>` (your GitHub org or user).
     - Repository: `<repo>` (your forked/cloned repository).
     - Workflow filename: `release.yml`.
     - Environment name: leave blank for now.
   - Save.

6. **Verify provenance** on the next published release:
   - The tarball on npm shows a green "provenance" badge.
   - Clicking the badge reveals the GitHub Actions run URL and commit SHA.

## Setup after `pnpm setup`

`pnpm setup` renames the publishable package (for example,`@deessejs/example` →
`@your-scope/your-package`). The workflow file name doesn't change, but
the **package** it publishes changes, so the trusted publisher config on
npmjs.com must be updated:

- Go to https://www.npmjs.com/package/`<new-scope>/<new-package>`/access.
- Add a trusted publisher entry as in step 5 above, pointing at the same
  workflow filename (`release.yml`) and the same repository.
- npm allows multiple trusted publishers across **different** packages. The
  one-trusted-publisher-per-package limit applies only to entries for the
  same package.

If this step is skipped, the publish still succeeds (OIDC authenticates the
GitHub workflow against the repository), but **provenance is missing or
broken**; the tarball on npm lacks the green provenance badge. This is
silent and easy to miss.

## Required conditions for OIDC to succeed

For the publish job to authenticate via OIDC, **all** of these must hold:

- `id-token: write` is declared on the job.
- `actions/setup-node@v6` (or later) is used with `registry-url: 'https://registry.npmjs.org'`.
- The job is running on a GitHub-hosted runner. **Self-hosted runners
  can't mint OIDC tokens for npm Trusted Publishing**; this is enforced
  by npm, not by GitHub.
- The job is running Node ≥ 22.14 with npm ≥ 11.5.1.
- The trusted publisher entry on npmjs.com matches the running workflow's
  filename and repository.

If any of these fails, the publish fails with a generic `ENEEDAUTH` or
`Forbidden` message. There is no "your OIDC token expired" diagnostic;
npm intentionally returns the same error for all OIDC failures to avoid
leaking auth state.

## Common pitfalls

### `NODE_AUTH_TOKEN` silently bypasses OIDC

If a step earlier in the job sets `NODE_AUTH_TOKEN`, npm uses it instead of
OIDC. This is silent: the publish succeeds, but no provenance is generated
because provenance is an OIDC-only feature.

The workflow doesn't set `NODE_AUTH_TOKEN` anywhere. If a future
contributor adds a step that does (for example, to install from a private
registry), it must scope `NODE_AUTH_TOKEN` to the install step only and
unset it before publish.

### Wrong workflow filename

If the trusted publisher entry on npmjs.com says `release.yml` but the
workflow file is actually at `.github/workflows/release.yml` (with leading
dot), npm rejects the OIDC token. The entry must match the path component
**after** `.github/workflows/`, not the full path.

### Wrong repository owner/name

Case-sensitive. `acme/Widget` and `acme/widget` are different entries. If
the repository was renamed or transferred, the trusted publisher entry
must be updated.

### Workflows not running on `pull_request` events

Trusted Publishing checks the workflow's filename and repository, not its
trigger. A `pull_request` event against `main` will mint a valid OIDC
token if the workflow's filename matches, but the publish itself will
fail because `GITHUB_TOKEN` can't push to the protected `main` branch
from a fork PR. The standard solution is to publish from `push` events
(after merge), not from `pull_request` events.

## Verifying the setup is correct

After the first canary publish from `staging`:

```bash
npm view @scope/example@canary --json | jq '.dist, .distTags'
```

The `dist` field should contain a `tarball` URL. The `distTags` should
include `canary` pointing at the expected version. The tarball URL on
npmjs.com should display a green "provenance" badge.

After the first stable publish from `main`:

```bash
npm view @scope/example dist-tags
```

Should show `latest` pointing at the new stable version, and `canary`
still pointing at the most recent canary.

## Reconfiguration checklist

When any of these change, re-check the trusted publisher entry on
npmjs.com:

- Repository is renamed or transferred.
- Workflow file is renamed or moved (for example,`release.yml` → `release-v2.yml`).
- The publishable package is renamed via `pnpm setup` (different package
  → different trusted publisher entry required).
- A second GitHub Environment is introduced for `main` (the trusted
  publisher entry's "Environment name" field must match).
