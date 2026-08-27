# Release process

This directory documents the release engineering process for the
`package-template` monorepo.

## Documents

| Document                                                       | Audience                            | When to read                                                                                 |
| -------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------- |
| [`overview.md`](./overview.md)                                 | Anyone                              | First. Read this to understand the model.                                                    |
| [`canary-on-staging.md`](./canary-on-staging.md)               | Day-to-day contributors             | When you open or merge a PR against `staging`.                                               |
| [`stable-on-main.md`](./stable-on-main.md)                     | Release engineers                   | When you ship a release from `main`.                                                         |
| [`trusted-publishing-setup.md`](./trusted-publishing-setup.md) | First-time setup, post-`pnpm setup` | When configuring npm Trusted Publishing.                                                     |
| [`incident-response.md`](./incident-response.md)               | On-call                             | When a release fails or a bad release ships.                                                 |
| [`hotfix-on-main.md`](./hotfix-on-main.md)                     | Release engineers, security team    | When shipping a patch-level fix that bypasses staging for a CVE or production-impacting bug. |
| [`back-merge.md`](./back-merge.md)                             | Release engineers                   | After a hotfix lands on `main`: bring the fix to `staging` without double-bumping.           |

## Process summary

1. Contributors open PRs against `dev`.
2. PRs are merged into `staging`, which auto publishes a canary to the
   `canary` npm dist-tag on every merge.
3. The release engineer validates the canary, then opens a PR from
   `staging` into `main`.
4. Merging into `main` publishes a stable release to the `latest` npm
   dist-tag.

**Exception**: production-impacting bugs and security CVEs may bypass the
`staging → main` flow via the hotfix process documented in
[`hotfix-on-main.md`](./hotfix-on-main.md). Hotfixes are patch-level only
and ship directly to `@latest`.

## Release flow diagram

```mermaid
flowchart LR
  dev[dev<br/>day-to-day work]:::devBranch
  staging[staging<br/>publishes @canary]:::stagingBranch
  main[main<br/>publishes @latest]:::mainBranch
  hotfix[hotfix/&lt;name&gt;<br/>off main]:::hotfixBranch
  npmCanary[(npm<br/>dist-tag: canary)]:::npmTag
  npmLatest[(npm<br/>dist-tag: latest)]:::npmTag
  npmCanaryHot[(npm<br/>dist-tag: hotfix<br/>validation only)]:::npmTag

  dev -- "PR merge" --> staging
  staging -- "auto-publish<br/>snapshot mode" --> npmCanary
  staging -- "PR: staging → main<br/>after canary validated" --> main
  main -- "auto-publish<br/>changesets/action@v2" --> npmLatest

  main -. "branch off<br/>for CVE" .-> hotfix
  hotfix -- "PR merge to main<br/>patch bump<br/>ship to @latest" --> main
  hotfix -. "optional validation<br/>snapshot --snapshot hotfix" .-> npmCanaryHot
  hotfix -- "forward-merge<br/>after hotfix ships" --> staging

  classDef devBranch fill:#e8f4f8,stroke:#4a90c2,color:#000
  classDef stagingBranch fill:#fff4e6,stroke:#d68a3c,color:#000
  classDef mainBranch fill:#e6f4ea,stroke:#3c8c5a,color:#000
  classDef hotfixBranch fill:#fce8e6,stroke:#c2453c,color:#000
  classDef npmTag fill:#f3e8fc,stroke:#7a4ca8,color:#000
```

Both publish paths use npm Trusted Publishing (OIDC). No `NPM_TOKEN`
secret is required.

## See also

- [`CLAUDE.md`](../../../CLAUDE.md): branching strategy and contributor
  guidelines.
- [`CONTRIBUTING.md`](../../../CONTRIBUTING.md): workflow conventions.
- [Changesets documentation](https://changesets.dev): versioning tool.
- [npm Trusted Publishers](https://docs.npmjs.com/trusted-publishers/).
  OIDC authentication mechanism.
