# Contributing

Thanks for working on the **GoPadel backoffice**. Keep changes small, well-tested,
and conventionally committed. Full pipeline details live in
[`docs/ci-cd.md`](docs/ci-cd.md).

## Prerequisites

- Node `22.20.0` (pinned in `.nvmrc` — run `nvm use`).
- `npm ci` to install dependencies. This sets up Git hooks via husky.

## Branch model

| Branch    | Purpose             | Deploys to     |
| --------- | ------------------- | -------------- |
| `develop` | Integration branch  | **Staging**    |
| `main`    | Production releases  | **Production** |

- Branch off `develop`, do your work, and open a **Pull Request into `develop`**.
- Never push directly to `develop` or `main` — both are protected and require
  green CI.
- Production releases are cut from `main` by `release-please` (see `docs/ci-cd.md`).

## Conventional Commits

Commit messages **must** follow [Conventional Commits](https://www.conventionalcommits.org/).
They drive automatic SemVer versioning and the changelog.

```
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s), e.g. BREAKING CHANGE: ...]
```

| Type / form                                   | Effect on next release |
| --------------------------------------------- | ---------------------- |
| `feat:`                                        | **minor** bump         |
| `fix:`                                         | **patch** bump         |
| `feat!:` / any `BREAKING CHANGE:` footer        | **major** bump         |
| `docs:` `chore:` `ci:` `refactor:` `test:` `style:` `perf:` | no release |

**Examples**

```
feat: add admin invitation flow
feat(auth): support SSO login
fix: correct token decryption on cold start
docs: document the rollback runbook
feat!: drop legacy permissions format
```

> Commit messages are **linted by commitlint** (`@commitlint/config-conventional`)
> via the **`commit-msg`** Git hook. A non-conforming message is rejected locally
> before the commit is created.

## Running checks locally

Run these before opening a PR — they mirror what CI runs:

```bash
npm run test            # run the test suite (vitest)
npm run test:coverage   # run tests with a coverage report
npm run lint:ci         # ESLint, non-mutating (CI uses this, not `lint`)
npm run lint:typecheck  # tsc --noEmit (strict type check)
npm run build           # production build
```

> Use `npm run lint:ci`, **not** `npm run lint` — the plain `lint` script runs
> `--fix` and is for local cleanup only, never CI.

## Pull requests

- PR **title** must be a valid Conventional Commit (it becomes the squash-merge subject).
- Fill out the PR template checklist.
- **CI must pass** (lint, typecheck, tests, build) before a PR can be merged.
- Add or update tests for the behavior you change.
- Link the related issue and include screenshots for any UI change.
