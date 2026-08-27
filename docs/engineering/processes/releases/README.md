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
  subgraph Branches["Git branches"]
    direction TB
    dev[dev<br/>day-to-day work]:::dev
    staging[staging<br/>validation]:::staging
    main[main<br/>production]:::main
    hotfix["hotfix/&lt;name&gt;<br/>off main"]:::hotfix
  end

  subgraph NPM["npm registry"]
    direction TB
    canaryTag[("@canary<br/>1.2.1-canary.&lt;sha&gt;")]:::canary
    latestTag[("@latest<br/>1.2.1")]:::latest
    hotfixTag[("@hotfix<br/>1.2.2-hotfix.&lt;sha&gt;<br/>validation only")]:::canary
  end

  dev -->|PR merge| staging
  staging -->|snapshot mode<br/>auto-publish| canaryTag
  staging ==>|"PR: staging → main<br/>after canary validated"| main
  main -->|changesets/action@v2<br/>auto-publish| latestTag

  main -.->|branch off for CVE| hotfix
  hotfix ==>|"PR merge to main<br/>patch bump"| main
  hotfix -.->|snapshot hotfix<br/>optional validation| hotfixTag
  hotfix -->|forward-merge<br/>see back-merge.md| staging

  classDef dev fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
  classDef staging fill:#fed7aa,stroke:#ea580c,color:#7c2d12
  classDef main fill:#bbf7d0,stroke:#16a34a,color:#14532d
  classDef hotfix fill:#fecaca,stroke:#dc2626,color:#7f1d1d
  classDef canary fill:#ede9fe,stroke:#7c3aed,color:#4c1d95
  classDef latest fill:#dcfce7,stroke:#16a34a,color:#14532d
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
