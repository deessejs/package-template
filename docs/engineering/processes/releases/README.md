# Release process

This directory documents the release engineering process for the
`package-template` monorepo.

## Documents

| Document                                                                | Audience                            | When to read                                                                                                                        |
| ----------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [`overview.md`](./overview.md)                                          | Anyone                              | First. Read this to understand the model.                                                                                           |
| [`canary-on-staging.md`](./flows/canary-on-staging.md)                  | Day-to-day contributors             | When you open or merge a PR against `staging`.                                                                                      |
| [`stable-on-main.md`](./flows/stable-on-main.md)                        | Release engineers                   | When you ship a release from `main`.                                                                                                |
| [`trusted-publishing-setup.md`](./channels/trusted-publishing-setup.md) | First-time setup, post-`pnpm setup` | When configuring npm Trusted Publishing.                                                                                            |
| [`incident-response.md`](./channels/incident-response.md)               | On-call                             | When a release fails or a bad release ships.                                                                                        |
| [`hotfix-on-main.md`](./flows/hotfix-on-main.md)                        | Release engineers, security team    | When shipping a patch-level fix that bypasses staging for a CVE or production-impacting bug.                                        |
| [`back-merge.md`](./flows/back-merge.md)                                | Release engineers                   | After a hotfix lands on `main`: bring the fix to `staging` without double-bumping.                                                  |
| [`pr-preview.md`](./flows/pr-preview.md)                                | Anyone reviewing a PR               | When you want to install a build from a PR to review or smoke-test it before merge.                                                 |
| [`versioning.md`](./policies/versioning.md)                             | Release engineers, contributors     | When you are unsure what semver bump to use, or when shipping a breaking change or deprecation.                                     |
| [`governance.md`](./policies/governance.md)                             | Maintainers                         | When you need to know who can push which branch, or how to update branch protection rules.                                          |
| [`rollback.md`](./policies/rollback.md)                                 | Release engineers, on-call          | When a release to `@latest` is broken or unsafe, and consumers need to be steered away from it.                                     |
| [`github-releases.md`](./channels/github-releases.md)                   | Release engineers, contributors     | When you want to understand which publish channels create a GitHub Release, and how `changesets/action` generates the release body. |
| [`github-packages.md`](./channels/github-packages.md)                   | Release engineers                   | When you want to publish to GitHub Packages in addition to npm, and how the dual-publish architecture works.                        |

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
[`hotfix-on-main.md`](./flows/hotfix-on-main.md). Hotfixes are patch-level only
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
    previewTag[("pkg.pr.new<br/>per-PR preview<br/>tarball")]:::preview
  end

  subgraph PRPreview["PR preview (per branch)"]
    direction TB
    prToStaging[PR: dev to staging]:::prNode
    prToMain[PR: staging to main]:::prNode
    prHotfix[PR: hotfix to main]:::prNode
  end

  prToStaging -.->|pkg-pr-new<br/>per-PR tarball| previewTag
  prToMain -.->|pkg-pr-new<br/>per-PR tarball| previewTag
  prHotfix -.->|pkg-pr-new<br/>per-PR tarball| previewTag

  prToStaging -->|merge| staging
  prToMain -->|merge after<br/>canary validated| main
  prHotfix -->|merge<br/>patch bump| main

  dev -->|feature branch| prToStaging
  staging -.->|feature branch| prToMain
  main -.->|feature branch| prHotfix

  staging -->|snapshot mode<br/>auto-publish| canaryTag
  main -->|changesets action v2<br/>auto-publish| latestTag

  main -.->|branch off for CVE| hotfix
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
