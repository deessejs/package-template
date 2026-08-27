# Back-merging hotfixes into `staging`

## Purpose

After a hotfix ships to `@latest` from `main`, the fix must reach `staging`
so that:

1. `staging`'s `package.json` is bumped past the hotfix version. Otherwise
   the next canary on `staging` computes a version (`1.2.2-canary.<sha>`)
   that collides with the hotfix already on npm (`1.2.2`).
2. The fix code itself reaches `staging`. Otherwise the next regular
   release omits the fix entirely.
3. The next regular release's CHANGELOG mentions the fix.

This document describes how to perform that back-merge safely. It assumes
you have already read [`hotfix-on-main.md`](./hotfix-on-main.md).

## Why this is non-trivial

When `changesets/action@v2` runs on the hotfix PR merged into `main`, it
produces a single commit that bundles several changes:

| File                   | Change in the "Version Packages" commit        |
| ---------------------- | ---------------------------------------------- |
| `package.json`         | Version bumped to the hotfix version (`1.2.2`) |
| `CHANGELOG.md`         | New entry for the hotfix at the top            |
| `.changeset/<name>.md` | **Deleted** (consumed by the action)           |
| `pnpm-lock.yaml`       | Updated to reflect the new version             |
| source files           | The actual fix code                            |

Naively cherry-picking that commit onto `staging` breaks at least one of
the three objectives. The changeset file is deleted on `main` but still
exists on `staging` (snapshot mode is ephemeral on the runner), producing
a `deleted by them` conflict. `package.json` and `CHANGELOG.md` both have
`modify/modify` conflicts.

There are two viable approaches: forward-merge (preferred) and
cherry-pick (fallback). The project recommends forward-merge when the
hotfix branch is still alive.

## Approach A: forward-merge (preferred)

This is GitFlow's canonical "finishing a hotfix" pattern, applied to our
branch topology.

### Prerequisites

- The `hotfix/<name>` branch still exists. It wasn't deleted when the PR
  merged to `main`.
- You have push access to `staging`.

### Steps

```bash
# 1. Make sure your local staging is current.
git fetch origin
git checkout staging
git pull --ff-only origin staging

# 2. Merge the hotfix branch into staging. Use --no-ff to preserve the
#    branch identity in history.
git merge --no-ff origin/hotfix/<name>

# 3. Resolve any conflicts. Most hotfixes touch disjoint files from
#    active staging work, so conflicts are rare. If conflicts appear:
#    - For source files: resolve normally.
#    - For package.json or CHANGELOG.md: take the version from staging
#      (it has been bumped by the canary workflow, which is fine), then
#      manually re-bump package.json to match main's version.
#    - For .changeset/<name>.md: KEEP the file on staging. Do not delete
#      it. It will be consumed on the next regular staging → main
#      promotion.

# 4. Push the result.
git push origin staging
```

After this merge:

- `staging`'s `package.json` is at the hotfix version (`1.2.2`).
- The fix code is on `staging`.
- The `.changeset/<name>.md` file is still present on `staging`. When
  the next regular promotion happens, `changesets/action@v2` will consume
  it on `main`, which produces a forward bump (`1.2.2 → 1.2.3`) and a
  CHANGELOG entry referencing the same PR.

The forward bump from `1.2.2` to `1.2.3` is acceptable: it represents the
next regular release that "re-applies" the fix on its way through the
canonical staging validation. The version is monotonic and the CHANGELOG
explicitly cites the hotfix PR.

### Why --no-ff

`--no-ff` keeps the merge as a merge commit rather than fast-forwarding.
This preserves the branch identity in the history graph, which makes
`git log --first-parent` and `git log --graph` output meaningful. it's
also what the GitFlow pattern recommends.

## Approach B: cherry-pick (fallback)

Use this when the hotfix branch was deleted after merge, or when a
forward-merge is impractical due to staging churn.

### Which commit to cherry-pick

The PR introduced on `main` has two commits (assuming default merge
strategy):

1. The PR's own commit(s), authored by the developer.
2. The "Version Packages" commit from `changesets/action@v2`.

Cherry-pick only the **PR's own commit(s)**, not the "Version Packages"
commit. To find them:

```bash
# Get the merge commit SHA of the hotfix PR on main.
MERGE_SHA=$(gh pr view <PR_NUMBER> --json mergeCommit -q '.mergeCommit.oid')

# List the commits that were in the PR (excluding the merge commit itself).
git log --oneline "$MERGE_SHA^2"~.."$MERGE_SHA^2"
```

Alternatively, if the repo uses squash-merge, there is only one commit
from the PR. `gh pr view <PR_NUMBER> --json commits` lists it.

### Cherry-picking the PR commits

```bash
git checkout staging
git pull --ff-only origin staging

# Cherry-pick each PR commit, oldest first.
git cherry-pick -x <commit-sha-1>
# Resolve conflicts if any. See below.
git cherry-pick -x <commit-sha-2>
# Etc.
```

The `-x` flag records the source SHA in the cherry-picked commit message,
which provides an audit trail back to the hotfix.

### Conflict resolution

Conflicts will typically appear on three files:

1. **`package.json`**: likely a `modify/modify` conflict because both
   `main` (post-hotfix) and `staging` (post-canary) have bumped the
   version.

   Resolution: take `main`'s version. The post-hotfix `package.json` on
   `main` has the bumped version; `staging`'s may have an older canary
   version. We want staging to track main's version going forward.

   ```bash
   git checkout --theirs -- package.json
   ```

2. **`CHANGELOG.md`**: `modify/modify` conflict. Both sides have
   appended entries.

   Resolution: take `main`'s CHANGELOG. It has the hotfix entry already.
   When the next regular staging → main promotion happens,
   `changesets/action@v2` will regenerate the CHANGELOG from the
   remaining `.changeset/*.md` files, which will preserve all entries
   including the hotfix.

   ```bash
   git checkout --theirs -- CHANGELOG.md
   ```

3. **`.changeset/<name>.md`**: `deleted by them` conflict. The
   upstream commit deletes the file (it was consumed on main), but the
   file still exists on staging (snapshot mode didn't commit it).

   Resolution: **keep the file on staging**. Take `staging`'s version.

   ```bash
   git checkout --ours -- .changeset/
   ```

### Lockfile

After resolving conflicts:

```bash
pnpm install --no-frozen-lockfile
git add pnpm-lock.yaml
git cherry-pick --continue   # or git commit if all commits were applied
```

Regenerating the lockfile ensures it matches the new `package.json`
version. Without this step, subsequent CI runs fail with a lockfile
mismatch.

## Audit step

After the back-merge (whether forward-merge or cherry-pick), verify the
state:

```bash
# Confirm the hotfix code is on staging.
git log --oneline staging --grep='hotfix/\|HOTFIX\|hotfix:' -n 5

# Confirm the changeset file is still on staging.
git ls-tree --name-only -r staging -- .changeset/ | sort

# Confirm the version on staging is at or above the hotfix version.
git show staging:packages/example/package.json | jq .version
# Should be "1.2.2" or higher (no canary suffix).
```

If any check fails, the back-merge is incomplete. Investigate before
pushing the next staging canary.

## Automation fallback

When the back-merge is forgotten, the next canary on `staging` will
collide with the hotfix on npm. Detect this:

```bash
git log --all --oneline --grep='HOTFIX\|hotfix/' \
  | head -1 \
  | xargs -I {} git branch --contains {} --all \
  | grep -q staging || echo "Hotfix not back-merged to staging"
```

This is intentionally a manual check. Any automation around it should be
opt-in: the release engineer is responsible for the back-merge, not a
bot. Automated back-merge PRs introduce a different class of bugs
(cherry-pick conflicts that go undetected) and should only be enabled
after the team has run the manual flow successfully several times.

## Common failure modes

### Forward-merge conflicts on package.json

When staging has its own pending changesets that bump the version, the
forward-merge produces a `modify/modify` conflict on `package.json`.

Resolution: take main's version (`git checkout --theirs -- package.json`)
and re-apply staging's pending changesets manually. Then run `pnpm
changeset version` to verify the resulting version makes sense before
pushing.

### Cherry-pick conflict on a file unrelated to the hotfix

If staging has evolved a file the hotfix also touches, the cherry-pick
produces a real conflict that needs human resolution. This is the
~25% case referenced in the research. Resolve by combining the changes
from both sides; don't blindly take `--ours` or `--theirs` for source
files.

### Changeset file deleted on staging by accident

If `--theirs` was accepted on the `.changeset/` conflict, the file is
gone from staging. The next regular release won't mention the hotfix
in CHANGELOG. Recovery: re-create the changeset file on staging by
copying it from the hotfix PR's commit, then continue the cherry-pick.

### Lockfile out of sync

If `pnpm install --no-frozen-lockfile` is skipped, subsequent CI runs
fail with a lockfile mismatch. The fix is trivial: run the install
command, commit the regenerated lockfile. The back-merge is otherwise
intact.

## When to skip the back-merge

In rare cases, skip the back-merge entirely:

- The hotfix is **not patch-level** (contradicts the hotfix definition
  in `hotfix-on-main.md`; revisit that definition first).
- The hotfix is to a **completely separate package** that staging has
  already published independently. Cherry-picking is unnecessary
  because no version collision is possible.

In both cases, document the decision in the hotfix PR's merge commit
message so future maintainers know the back-merge was intentionally
skipped.
