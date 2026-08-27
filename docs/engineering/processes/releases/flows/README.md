# flows/

Documents describing how a release moves through the pipeline. Read
in order if you ship a release from scratch:

1. [canary-on-staging.md](./canary-on-staging.md): snapshot-mode
   publish to the `@canary` dist-tag on every push to `staging`.
2. [stable-on-main.md](./stable-on-main.md): `changesets/action@v2`
   publish to `@latest` on every push to `main`.
3. [hotfix-on-main.md](./hotfix-on-main.md): bypass-staging flow
   for CVE fixes.
4. [back-merge.md](./back-merge.md): after a hotfix, bring the
   fix back to `staging` without double-bumping.
5. [pr-preview.md](./pr-preview.md): per-PR preview tarballs
   via pkg.pr.new.

For the index of all release docs, see the
[parent README](../README.md).
