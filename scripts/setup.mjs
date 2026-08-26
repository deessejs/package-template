#!/usr/bin/env node
// @ts-check
/**
 * Bootstrap script for the package-template.
 *
 * Idempotent. Run with `pnpm setup` after cloning the template. Rewrites
 * the publishable package's name and repository metadata across the
 * repo so downstream consumers don't have to do a manual
 * find-and-replace.
 *
 * Usage:
 *   pnpm setup                       # interactive
 *   pnpm setup --yes                 # accept defaults
 *   pnpm setup --name @scope/foo     # pre-fill the package name
 *   pnpm setup --repo org/foo        # pre-fill the GitHub repo
 *
 * If `.setup-done` exists and matches the current configuration, exits 0
 * without writing. To force a re-run, delete `.setup-done`.
 */

import { existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output, argv, exit } from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SETUP_DONE = join(ROOT, '.setup-done');
const PKG_DIR = join(ROOT, 'packages', 'example');
const PKG_JSON = join(PKG_DIR, 'package.json');
const CHANGESET_CFG = join(ROOT, '.changeset', 'config.json');
const WEB_PKG = join(ROOT, 'apps', 'web', 'package.json');
const ROOT_PKG = join(ROOT, 'package.json');
const README = join(ROOT, 'README.md');

function parseArgs() {
  const args = { yes: false, name: undefined, repo: undefined };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--yes' || a === '-y') args.yes = true;
    else if (a === '--name') args.name = argv[++i];
    else if (a.startsWith('--name=')) args.name = a.slice('--name='.length);
    else if (a === '--repo') args.repo = argv[++i];
    else if (a.startsWith('--repo=')) args.repo = a.slice('--repo='.length);
  }
  return args;
}

function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

function writeJson(p, o) {
  writeFileSync(p, JSON.stringify(o, null, 2) + '\n');
}

function defaultPackageName(current) {
  return current?.startsWith('@') ? current : '@scope/example';
}

function defaultRepo(currentUrl) {
  const m = currentUrl?.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
  return m ? `${m[1]}/${m[2]}` : 'org/repo';
}

async function prompt(question, fallback) {
  if (parseArgs().yes) return fallback;
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(`${question} [${fallback}]: `);
    return answer.trim() || fallback;
  } finally {
    rl.close();
  }
}

function rewriteRepository(obj, repo, directory) {
  obj.repository = {
    type: 'git',
    url: `git+https://github.com/${repo}.git`,
    directory,
  };
  obj.homepage = `https://github.com/${repo}#readme`;
  obj.bugs = { url: `https://github.com/${repo}/issues` };
}

function applyToPackageJson(name, repo) {
  // NOTE: this rewrite MUST stay surgical. Anything added by the template
  // (scripts, devDependencies, vitest config contents, etc.) is preserved by
  // re-serializing the entire object — only the keys we touch are modified.
  const pkg = readJson(PKG_JSON);
  pkg.name = name;
  rewriteRepository(pkg, repo, 'packages/example');
  writeJson(PKG_JSON, pkg);
  return pkg.name;
}

function applyToWebPackageJson(repo) {
  // apps/web is a private workspace; keep its homepage/bugs in sync only
  // when they already exist. Don't introduce new fields on private packages.
  if (!existsSync(WEB_PKG)) return;
  const pkg = readJson(WEB_PKG);
  let changed = false;
  if (pkg.homepage !== undefined) {
    pkg.homepage = `https://github.com/${repo}#readme`;
    changed = true;
  }
  if (pkg.bugs !== undefined) {
    pkg.bugs = { url: `https://github.com/${repo}/issues` };
    changed = true;
  }
  if (changed) writeJson(WEB_PKG, pkg);
}

function applyToChangesetConfig(_name) {
  // The current Changesets config uses `access: "public"` + `ignore` rather
  // than the newer `publicPackages`/`privatePackages` arrays. Don't switch
  // schemas — consumers upgrading Changesets separately will adopt the new
  // shape themselves.
  return;
}

function applyToRootPackageJson(repo) {
  // The root is a workspace aggregator (private, not published). Only
  // sync the repository URL when the field is already there — don't add a
  // `directory` field, because the root has no `directory` in npm's sense.
  const pkg = readJson(ROOT_PKG);
  if (pkg.repository?.url) {
    pkg.repository = {
      ...pkg.repository,
      type: 'git',
      url: `git+https://github.com/${repo}.git`,
    };
  }
  writeJson(ROOT_PKG, pkg);
}

function updateReadme(repo) {
  if (!existsSync(README)) return;
  const current = readFileSync(README, 'utf8');
  const next = current
    .replaceAll('deessejs/package-template', `${repo}`)
    .replaceAll('https://github.com/deessejs/package-template', `https://github.com/${repo}`);
  if (next !== current) writeFileSync(README, next);
}

function readMarker() {
  if (!existsSync(SETUP_DONE)) return null;
  try {
    return JSON.parse(readFileSync(SETUP_DONE, 'utf8'));
  } catch {
    return null;
  }
}

function writeMarker(name, repo, author) {
  writeFileSync(
    SETUP_DONE,
    JSON.stringify({ name, repo, author, timestamp: new Date().toISOString() }, null, 2) + '\n'
  );
}

function maybeRenamePackageDir(currentName) {
  const shortName = currentName.replace(/^@.*?\//, '');
  const target = join(ROOT, 'packages', shortName);
  if (PKG_DIR === target) return;
  if (!existsSync(target)) renameSync(PKG_DIR, target);
}

async function main() {
  const args = parseArgs();
  const currentPkg = readJson(PKG_JSON);
  const marker = readMarker();

  const name = args.name ?? (await prompt('Package name', defaultPackageName(currentPkg.name)));
  const repo =
    args.repo ??
    (await prompt('GitHub repo (owner/name)', defaultRepo(currentPkg.repository?.url)));
  const author = await prompt('Author (e.g. "Acme <hello@acme.com>")', marker?.author ?? '');

  if (marker && marker.name === name && marker.repo === repo) {
    console.log(`✓ Already configured: ${name} → ${repo}.`);
    return;
  }

  const newName = applyToPackageJson(name, repo);
  applyToWebPackageJson(repo);
  applyToChangesetConfig(newName);
  applyToRootPackageJson(repo);
  updateReadme(repo);
  maybeRenamePackageDir(newName);
  writeMarker(newName, repo, author);

  console.log('');
  console.log(`  Setup complete: ${newName} → ${repo}`);
  console.log('');
  console.log(
    '  Next: pnpm install && pnpm lint && pnpm type-check && pnpm test:run && pnpm build'
  );
}

main().catch((err) => {
  console.error(err);
  exit(1);
});
