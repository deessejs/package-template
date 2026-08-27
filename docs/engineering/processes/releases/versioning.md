# Versioning policy

## Purpose

This document defines the rules for version numbers in this repository.
It exists so that every maintainer applies the same bump type for the
same change, and so that consumers can rely on semver signals.

## Semver

The repository follows [Semantic Versioning 2.0.0](https://semver.org/).
Every published version is `MAJOR.MINOR.PATCH` with the optional
`-canary.<sha>` suffix for snapshot canary releases.

| Bump type | When to use                                                 | Changesets entry   |
| --------- | ----------------------------------------------------------- | ------------------ |
| `patch`   | Bug fix, internal refactor with no API change, security fix | `## Patch Changes` |
| `minor`   | New feature, additive API change, deprecation of an old API | `## Minor Changes` |
| `major`   | Breaking change to a public API                             | `## Major Changes` |

The bump type is declared per package in each `.changeset/*.md` file.
See the existing `initial-release.md` and `preview-and-trusted-publishing.md`
in `.changeset/` for the format.

## Breaking changes

A breaking change is any change that requires a consumer to modify
their code, configuration, or data to upgrade. Concretely:

- Removing or renaming an exported function, type, or class.
- Changing the signature of an exported function (parameter order,
  type, or required-ness).
- Changing the runtime semantics of an existing function in a way
  observable to consumers.
- Removing or changing the format of a persisted artifact (config
  file, lockfile, on-disk schema).
- Changing the Node.js minimum version, peer dependency range, or
  supported platforms.

Every breaking change requires:

1. A `## Major Changes` entry in the `.changeset/*.md` file.
2. A `BREAKING CHANGE:` footer in the commit message body, per
   [Conventional Commits 1.0.0](https://www.conventionalcommits.org/).
3. A migration note in the `CHANGELOG.md` describing what consumers
   need to do.

The release engineer is the final arbiter of whether a change is
breaking. When in doubt, treat the change as breaking and ship a `minor`
upgrade that introduces the new API alongside the old one, then deprecate
the old API in a subsequent release.

## Deprecation

Deprecated APIs continue to work but emit a runtime warning. The
deprecation cycle is:

1. Mark the API as deprecated in the source code with a `@deprecated`
   JSDoc tag.
2. Add a `## Minor Changes` entry in the changeset explaining the
   deprecation.
3. Ship a `minor` release with the deprecation warning.
4. In a later release (typically the next `major`), remove the API.

Deprecated APIs are removed in `major` releases only. The interval
between deprecation and removal is at least one `minor` release to
give consumers a migration window.

## Deprecation messages on npm

When a published version is known to be broken or unsafe, mark it with
`npm deprecate @scope/example@"<1.2.1" "reason"`. The message should:

- Identify the affected version range using a semver range (e.g.
  `<1.2.1`, `>=1.0.0 <1.2.0`).
- State the reason in one short sentence (security, regression, etc.).
- Point to the fixed version when applicable.

See [`rollback.md`](./rollback.md) for the operational procedure.

## EOL and support window

This repository ships a single major version at a time. When a new
major (`2.x`) is cut:

- The previous major (`1.x`) receives security fixes only, for a grace
  period of six months from the `2.0.0` release date.
- After the grace period, the previous major is EOL; no further
  releases are made.

The release engineer announces the cut and the EOL date on the issue
tracker at the time of the `2.0.0` release.

## Cross-references

- [Stable releases on `main`](./stable-on-main.md): how a `minor` or
  `major` release is shipped.
- [Hotfix on `main`](./hotfix-on-main.md): when a security fix
  overrides the normal versioning flow.
- [Rollback](./rollback.md): how to mark a published version as
  deprecated or unsafe.
- `.changeset/README.md`: format of a changeset file.
