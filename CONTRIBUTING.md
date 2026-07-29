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
pnpm test      # Watch mode — for local development
pnpm test:run  # Single run — for scripts and CI
```

## Pull Request Process

1. Add a changeset if your change should cut a release: `pnpm changeset`
2. Update documentation if needed
3. Add tests for new functionality
4. Ensure all CI checks pass
5. Add the `version bump` label before merging if a release is intended

## Questions?

Open an issue or reach out to the maintainers.
