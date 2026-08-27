# Rollback procedure

## Purpose

When a release to `@latest` is found to be broken or harmful, the team
must roll it back safely. This document describes the standard
procedure: deprecate (preferred) versus unpublish (last resort), and
the operational steps for each.

This document is the operational playbook referenced from
[`incident-response.md`](./incident-response.md) and
[`hotfix-on-main.md`](./hotfix-on-main.md).

## Decision: deprecate, don't unpublish

The standard rollback action is to **deprecate** the bad version, not
to **unpublish** it. Unpublishing is heavily restricted by npm:

- Versions published less than 72 hours ago can be unpublished by the
  publisher, but only if no other package depends on them and they
  have fewer than 300 weekly downloads.
- Versions older than 72 hours **can't be unpublished** except by
  npm support, who only intervene in extreme cases.

The full policy is at
[npm Unpublish Policy](https://docs.npmjs.com/policies/unpublish).

Unpublishing also breaks every consumer who pinned to the removed
version. They get install errors immediately, with no migration path.

Deprecating keeps the version on npm but marks it as unsafe. Consumers
see a warning on install and `npm install @latest` skips it. Consumers
who pinned explicitly aren't blocked, but they see the warning.

## Deprecate a single version

```bash
npm deprecate @scope/example@1.2.1 "Critical regression; use 1.2.2 instead"
```

The message should:

- Identify the reason in one short sentence.
- Point to the fixed version when applicable.

Verify with:

```bash
npm view @scope/example@1.2.1 deprecated
```

The field should print the deprecation message.

## Deprecate a version range

When multiple versions are affected (for example,a security advisory covering
several releases):

```bash
npm deprecate "@scope/example@<1.2.1" "Security CVE-2024-1234; upgrade to 1.2.1+"
npm deprecate "@scope/example@>=2.0.0 <2.1.0" "Security CVE-2024-1234; upgrade to 2.1.0+"
```

Quoting the argument is required because the shell otherwise interprets
the `<` and `>` as redirections.

## Move the `latest` dist-tag

If the bad release was published to `@latest`, move the dist-tag to
the previous good version so that fresh installs skip the bad version:

```bash
npm dist-tag add @scope/example@1.2.0 latest
```

Verify with:

```bash
npm view @scope/example dist-tags
```

This is independent of deprecating. Both are usually done together:
deprecate the bad version, then point `latest` at the previous good
one.

## Ship a corrective release

A deprecation is a signal, not a fix. The actual recovery is a new
release that supersedes the bad one. The new release goes through the
normal release flow:

1. Land a fix on `dev` or on a `hotfix/*` branch off `main`.
2. If a hotfix: follow [`hotfix-on-main.md`](./hotfix-on-main.md) and
   the back-merge procedure in [`back-merge.md`](./back-merge.md).
3. If a regular fix: follow the normal `staging → main` promotion.
4. The new version (`1.2.2`) is the one consumers should upgrade to.

The deprecation message on the bad version references the new version
number explicitly so consumers have a clear migration target.

## Update the CHANGELOG

Add an entry at the top of `CHANGELOG.md` describing the rollback:

```md
## [1.2.1] (deprecated)

This release contains a critical regression introduced in
[#PR_NUMBER](https://github.com/owner/repo/pull/NUMBER).
It is deprecated; please use 1.2.2 or later.
```

The entry stays at the top so consumers reading the CHANGELOG see the
warning first.

## Communicate

Open a GitHub issue labeled `incident` and pinned to the top of the
issue list. The issue body should include:

- The affected version range.
- The reason for the rollback.
- The recommended upgrade target.
- A link to the fix PR.

If the rollback addresses a security vulnerability, follow the
disclosure timeline in `SECURITY.md` at the repository root.

## When unpublish is appropriate

Unpublish is reserved for two narrow cases:

1. A version was published accidentally and has **zero** downstream
   dependents and **zero** weekly downloads. This is rare in
   practice; the 72-hour window catches most cases.
2. A version contains content that must be removed for legal or
   security reasons and deprecation is insufficient. This requires
   contacting npm support.

Outside these cases, deprecate. Unpublishing in the wrong situation
hurts consumers more than the original problem did.
