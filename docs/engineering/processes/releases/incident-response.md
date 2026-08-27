# Incident response, release failures

## When to use this document

Something in the release pipeline failed: a canary publish, a stable publish,
or a step in between. This document is the runbook for diagnosing and
recovering.

The flow described here assumes the release workflow
(`.github/workflows/release.yml`) is in place and the
[release process overview](./overview.md) is already understood.

## Diagnostic entry points

Start from the failure surface and work back to the cause:

1. **GitHub Actions run log**, Open the failed run, look at the failing
   step's output. Most failures are visible in plain text.
2. **npm publish attempt**, If the publish step itself failed, the npm
   CLI prints an error code and a message. These are the most useful
   diagnostic messages we get.
3. **Workflow file**, Compare against `release.yml` in the repo. Has it
   been edited locally without being merged?
4. **Trusted publisher config**, https://www.npmjs.com/package/`<scope>/<package>`/access.
   Is the entry present? Does the filename match?

## Common failure modes

### OIDC / authentication failures

**Symptoms**: `ENEEDAUTH`, `Forbidden`, or `npm ERR! code E401` in the
publish step output.

**Likely causes** (in order of frequency):

1. `id-token: write` is missing from the publish job's `permissions:`
   block. Check `release.yml`.
2. `npm` version on the runner is below 11.5.1. The runner ships with
   npm 10. Check whether the `npm install -g npm@latest` step ran
   successfully.
3. `NODE_AUTH_TOKEN` is set in the job's environment, bypassing OIDC.
   Check whether a previous step exports it.
4. Trusted publisher entry on npmjs.com doesn't match the running
   workflow's filename or repository.

**Fix**: address the underlying cause, then re-run the workflow.

### npm registry rejects the version

**Symptoms**: `EPUBLISHCONFLICT`, `403 Forbidden - PUT
https://registry.npmjs.org/...`, or `You cannot publish over the
previously published versions`.

**Likely causes**:

1. The version already exists on npm (a previous run succeeded but a
   later step failed). For canaries this is expected on re-run with the
   same SHA, see "Canary re-run" below.
2. The version was published by a different publisher (for example, a manual
   `npm publish` from a developer's machine).

**Fix**: bump the version (commit a change to a file, push a new commit)
and let the new version run through the workflow.

### Snapshot canary modifies the repo

**Symptoms**: After a canary publish, `git log` on `staging` shows a new
commit that wasn't authored by you, OR `.changeset/*.md` files are
missing on `staging` after a canary run.

**Likely cause**: A `changesets/action@v2` step was added to the canary
job by mistake. Snapshot mode's whole point is to be ephemeral, no
commits.

**Fix**: Remove the action wrapper from the canary job. Use raw
`pnpm changeset version --snapshot canary --no-git-tag` and
`pnpm changeset publish --tag canary --no-git-tag` only.

### Stable publish leaves version bumped but not published

**Symptoms**: The "Version Packages" commit is on `main`, but the new
version isn't on npm.

**Likely cause**: `pnpm release` (which runs `changeset publish`) failed
mid-flight, usually an OIDC auth failure (see above) or an npm registry
outage.

**Fix**:

1. Diagnose the publish failure using the run log.
2. Fix the underlying cause.
3. Re-run the workflow. Changesets will see that the version in
   `package.json` matches a version already prepared, and skip the version
   step on retry, going straight to `changeset publish`. If the version
   has already been published to npm somehow, the publish step will
   detect it and skip cleanly.

### Wrong package name published

**Symptoms**: A canary or stable version appears under an unexpected
package name (for example,`@deessejs/example` after `pnpm setup` renamed it).

**Likely cause**: `pnpm setup` didn't update the trusted publisher
config on npmjs.com. The publish still succeeds because OIDC
authenticates against the **workflow file**, not the package, but the
provenance attestation points at the wrong repository state.

**Fix**: Update the trusted publisher entry on npmjs.com to point at the
correct package name (see `trusted-publishing-setup.md`).

### Half-bumped version after failed stable publish

**Symptoms**: `package.json` has been bumped to `1.2.2` but npm still
shows `1.2.1` as `latest`. The "Version Packages" commit is on `main`.

**Likely causes**:

1. `changeset version` ran successfully, but `changeset publish` failed.
2. Someone manually re-ran `changeset version` thinking the previous
   attempt had been reverted.

**Fix**: Re-run the publish step only (`pnpm release`). If the workflow
is set up correctly, a re-run of the entire job will detect the existing
version and skip the version step.

If a developer has manually edited `package.json` or created commits
after the failed publish, don't push, this creates version drift. The
correct recovery is to manually revert the version-bump commit on `main`
and re-run the workflow from a clean state.

## Canary re-run

A canary publish with the **same SHA** will attempt to publish the same
version (`1.2.1-canary.a1b2c3d`). npm rejects republishing an existing
version. This is expected behavior:

- If the previous run failed **before** `npm publish` succeeded, the
  re-run succeeds (the version doesn't yet exist on npm).
- If the previous run failed **after** `npm publish` succeeded, the
  re-run fails with `EPUBLISHCONFLICT`. The new canary requires a new
  commit.

This is documented as expected behavior, not a bug. The 7-character SHA
in the canary version is the commit identifier, so a new canary requires
a new commit.

## When to disable the canary

If canaries are causing persistent failures (for example, npm registry issues
that prevent any snapshot publish from succeeding), the workflow can
be temporarily disabled by removing `staging` from the `on.push.branches`
list. This stops canary publishes without affecting the stable path.

Don't disable the stable job unless absolutely necessary; a disabled
stable job means merges to `main` don't produce npm releases.

## When to roll back a stable release

A bad stable release on `latest` should be **deprecated**, not
unpublished. `npm unpublish` is restricted (24-hour window for new
packages, 72-hour window for others) and removes the version entirely,
which can break consumers who pinned to it.

The standard rollback:

```bash
npm deprecate @scope/example@1.2.1 "Critical bug; use 1.2.2 instead"
```

Then ship a new version (1.2.2 or 1.3.0 depending on the nature of the
regression) that fixes the issue. The deprecated version stays on npm
but is skipped by `npm install` unless explicitly pinned.

For very serious incidents (for example, security vulnerability), follow the
process in `SECURITY.md` at the repository root. Coordinate with the
security contact before any public disclosure.

## Communication

For incidents that affect external consumers (a broken canary on
`@canary` is acceptable; a broken stable on `@latest` isn't):

1. Open a GitHub issue labeled `incident`.
2. Pin the issue so it stays visible.
3. Post status updates in the issue as the recovery progresses.
4. After resolution, write a short post-mortem comment on the issue
   covering: what happened, what was the impact, what was the fix, and
   what we'll do to prevent it next time.

The canary-on-`@canary` errors are by design opt-in and don't require
external communication.
