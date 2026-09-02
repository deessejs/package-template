# Contributing to package-template

Thank you for your interest in contributing to this project!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/package-template.git`
3. Install dependencies: `pnpm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Workflow

### Working on the Template Itself

If you are improving the template:

1. Make your changes
2. Run the verification chain: `pnpm lint && pnpm type-check && pnpm test:run`
3. Build the project: `pnpm build`
4. Commit your changes
5. Open a pull request

### Using the Template for a New Project

If you cloned this template to start a new project and found an issue or have a feature idea:

- **Create an issue** on the template repository: https://github.com/deessejs/package-template/issues
- Use the appropriate issue template for your report

## Branching Strategy

This project follows `main` <- `staging` <- `dev` branching:

- `main`: Production-ready code. Releases are cut from here.
- `staging`: Release candidate testing.
- `dev`: Work-in-progress development.

All developers push directly to `main`. The release engineer manages the flow into
`staging` and the final cut from `staging` to `main`.

## Commit Messages

Use conventional commits:

- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `refactor: improve code structure`
- `test: add or update tests`
- `chore: maintenance tasks`

## Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Run Prettier before committing: `pnpm format`

The pre-commit hook runs `pnpm lint` and `pnpm type-check`. Skip with
`git commit --no-verify` when you need to.

## Testing

Run tests before submitting a PR:

```bash
pnpm test           # Watch mode — for local development
pnpm test:run       # Single run — for scripts and CI
pnpm coverage       # Single run with V8 coverage — writes packages/example/coverage/
```

The coverage workflow posts a PR comment with line/branch/function coverage and a
visual status (🟢 / 🟠 / 🔴). It never blocks the PR — even a failure _only_ shows
a red icon. To inspect the full HTML report locally, open
`packages/example/coverage/index.html` in your browser.

## Pull Request Process

1. Add a changeset if your change should cut a release: `pnpm changeset`
2. Update documentation if needed
3. Add tests for new functionality
4. Ensure all CI checks pass
5. The release workflow is fully automatic — no label to add.

## Adding a Workspace

When you add a new `apps/*` or `packages/*` directory:

1. **Scaffold from a neighbour.** Copy the closest existing workspace's
   `package.json`, `tsconfig*.json`, `eslint.config.*`, and
   `vitest.config.ts` as a starting point. Adjust the `name`, the
   directory name (`git mv`), and the `description`.
2. **Match the Turbo pipeline contract.** Every workspace must expose
   `build`, `test:run`, `type-check`, `lint`, and `clean`. `test` (watch)
   and `dev` are optional.
3. **Respect the package conventions.** Publishable workspaces are
   ESM-only, use `files` (never `.npmignore`), and keep two
   `tsconfig` files (`noEmit` for editor/type-check, emit for build).
   Tests live outside `src/` so they never reach `dist/`.
4. **For workspace deps**, use `"@scope/other": "workspace:*"` and run
   `pnpm install` from the root. Never pin a version range for a
   workspace dependency.
5. **Verify locally** before pushing:
   ```bash
   pnpm install
   pnpm --filter @scope/your-workspace build
   pnpm --filter @scope/your-workspace test:run
   pnpm lint && pnpm type-check && pnpm test:run && pnpm build
   ```

The full runbook — including a worked example for a CLI workspace —
lives in [`docs/contributor/adding-a-workspace.md`](docs/contributor/adding-a-workspace.md).
The rules that must not be broken live in
[`docs/contributor/invariants.md`](docs/contributor/invariants.md). The
reasoning behind the template's shape lives in
[`docs/contributor/architecture.md`](docs/contributor/architecture.md).

## Questions?

Open an issue or reach out to the maintainers.
