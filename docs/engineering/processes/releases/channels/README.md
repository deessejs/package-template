# channels/

Documents describing where a published release lands. Read in
order if you set up the publish pipeline for a new repo:

1. [trusted-publishing-setup.md](./trusted-publishing-setup.md):
   npm Trusted Publishing (OIDC), including post-`pnpm setup`
   reconfiguration.
2. [github-releases.md](./github-releases.md): which channels
   produce a GitHub Release; how `changesets/action` generates
   the body.
3. [github-packages.md](./github-packages.md): dual-publish
   architecture (npm + npm.pkg.github.com).
4. [incident-response.md](./incident-response.md): runbook for
   publish failures and bad releases.

For the index of all release docs, see the
[parent README](../README.md).
