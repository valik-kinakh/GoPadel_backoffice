# CI/CD Pipeline for GoPadel Backoffice — Design Spec

**Date:** 2026-06-03
**Status:** Approved (design) — pending implementation plan
**Scope:** DevOps assignment tasks 7 (Continuous Integration) & 8 (Continuous Delivery/Deployment)

## Context

This implements **tasks 7 (Continuous Integration) and 8 (Continuous Delivery/Deployment)** from a
university DevOps assignment, applied to the real GoPadel backoffice app
(Next.js 16 / React 19 / TypeScript strict, npm, Node 22.20.0, deployed on Vercel).

Today the project has **no CI/CD, no test framework, no test files, and no versioning automation**;
deployment is manual. The goal is a real, working, documented CI/CD pipeline on **GitHub Actions +
Vercel** that satisfies every bullet of the rubric: automated build/lint/test/coverage, SemVer
versioning, build reports, PR/push triggers, automated staging + production deploys, a blue-green
deploy strategy, post-deploy monitoring, rollback, and team documentation.

## Locked decisions

| Area | Decision |
|------|----------|
| Host / deploy target | **Vercel** |
| Test stack | **Vitest + React Testing Library**, representative starter suite + coverage report, modest enforced threshold to grow later |
| Versioning | **release-please** (Conventional Commits → release PR → version bump + CHANGELOG + git tag + GitHub Release) |
| Deploy strategy | **Blue-green via Vercel alias promotion** (immutable green deploy → smoke check → atomic promote; rollback = re-promote previous). Canary documented as the alternative. |
| Monitoring | **Vercel built-in** (Analytics + Speed Insights + deployment health / post-deploy smoke checks) |
| Branch model | **Two-branch**: `develop` → staging, new `main` → production (the one decision easiest to flip to single-branch trunk if desired) |
| Actions ↔ Vercel | **CLI-driven**: Actions owns deploys (Vercel native Git auto-deploy disabled) so blue-green promotion + scripted rollback are controllable |

## Repo-specific constraints (must design around)

- `next build` validates env via `@t3-oss/env-nextjs` (`src/env.js:73`). CI non-deploy jobs must run with
  `SKIP_ENV_VALIDATION=1`; real env lives in Vercel project settings.
- App env vars (set in Vercel Production + Preview scopes): `NEXT_PUBLIC_SANITY_PROJECT_ID`,
  `NEXT_PUBLIC_SANITY_DATASET`, `SECRET_SANITY_VIEW_TOKEN`, `SECRET_SANITY_EDIT_TOKEN`,
  `NEXT_PUBLIC_API_URL`, `PERMISSIONS_ENCRYPTION_SECRET`, `NEXT_PUBLIC_PERMISSIONS_DECRYPTION_SECRET`.
- Node pinned to **22.20.0** via `.nvmrc` → CI uses `actions/setup-node` with `node-version-file: .nvmrc`.
- Existing `lint` = `eslint ./src/* --fix` (`package.json:9`) is **mutating** and uses a narrow glob →
  add a non-mutating `lint:ci`.
- **No health endpoint** → add a tiny `GET /api/health` route for blue-green smoke checks.
- Default branch is `develop`; no `main`, no git tags, version `2.0.2` static.
- Husky pre-commit already runs lint-staged + typecheck + nodecheck — keep and extend.

## Architecture

### Branch & environment flow
```
PR ───────────────► CI (lint, typecheck, test+coverage, build) + Vercel preview deployment
push develop ─────► CI ─► deploy-staging (Vercel preview alias) ─► smoke check
push main ────────► release-please (maintains Release PR: version bump + CHANGELOG)
merge Release PR ─► GitHub Release published ─► deploy-production (blue-green) ─► smoke ─► promote
```

### Workflows (`.github/workflows/`)

1. **ci.yml** — on `pull_request` + `push` to `develop`/`main`. Jobs (parallel):
   `lint:ci` · `tsc --noEmit` · `vitest run --coverage` (upload coverage HTML artifact + write summary to
   `$GITHUB_STEP_SUMMARY`; enforce thresholds) · `next build` with `SKIP_ENV_VALIDATION=1` + dummy public
   env to prove compilation. Provides the rubric's "build report / build status available to the team".
2. **release-please.yml** — on `push` to `main`: `googleapis/release-please-action` opens/updates a Release
   PR that bumps `package.json` version + `CHANGELOG.md`; on merge creates the git tag + GitHub Release.
3. **deploy-staging.yml** — on `push` to `develop` (needs CI green): `vercel pull --environment=preview` →
   `vercel build` → `vercel deploy --prebuilt` → alias to staging URL → smoke check `/api/health`.
4. **deploy-production.yml** — on `release: published` (blue-green):
   1. `vercel pull --environment=production` → `vercel build --prod`
   2. deploy **green** without promoting: `vercel deploy --prebuilt --prod --skip-domain` → capture `GREEN_URL`
   3. smoke-check `GREEN_URL` (`/api/health` 200, homepage 200)
   4. optional manual approval via GitHub Environment protection rule
   5. **promote** (atomic blue→green swap): `vercel promote $GREEN_URL`
   6. post-promote smoke-check the production domain
   7. on any failure → auto-rollback (`vercel rollback`) + fail the job
5. **rollback.yml** — manual `workflow_dispatch`: roll production back to previous/chosen deployment via
   `vercel rollback` / `vercel promote <url>`. Documented runbook for the team.

### Secrets / config
- GitHub repo secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- Vercel project: app env vars in Production + Preview scopes; disable native Git auto-deploy
  (`vercel.json` `git.deploymentEnabled=false` or project settings) so Actions owns deploys.
- `vercel.json` committed.

### New / changed files
- `vitest.config.ts`, `vitest.setup.ts` (jsdom + RTL + v8 coverage + thresholds).
- `src/app/api/health/route.ts` — `GET` → `{ status:'ok', version }` 200.
- Tests: 1 unit test of a pure util in `src/lib/**` + 1 RTL component/integration test (representative,
  prove pipeline + emit coverage).
- `package.json` scripts: `test`, `test:run`, `test:coverage`, `lint:ci`.
- `release-please-config.json` + `.release-please-manifest.json`.
- `commitlint.config.js` + Husky `commit-msg` hook (enforce Conventional Commits for release-please).
- `@vercel/analytics` + `@vercel/speed-insights` wired into the root layout.
- Docs: `docs/ci-cd.md` (architecture, deploy flow, **blue-green explanation**, rollback runbook,
  monitoring, SemVer policy) — satisfies "document the CD process for the whole team";
  `CONTRIBUTING.md` Conventional Commits guide; optional `.github/pull_request_template.md`.

## Rubric coverage map

| Rubric requirement | Where satisfied |
|--------------------|-----------------|
| CI: auto build | `ci.yml` build job (`next build`, `SKIP_ENV_VALIDATION=1`) |
| CI: run linters | `ci.yml` lint job (`lint:ci`) |
| CI: unit + integration tests | `ci.yml` test job (Vitest + RTL) |
| CI: code coverage | `vitest run --coverage` + artifact + step summary |
| Versioning scheme (SemVer) | release-please + Conventional Commits + commitlint |
| Build reports | coverage artifact + GitHub Step Summary + GitHub Release notes/CHANGELOG |
| Trigger on every push/PR | `ci.yml` `on: [pull_request, push]` |
| CD: staging and/or production | `deploy-staging.yml` (staging) + `deploy-production.yml` (prod) |
| CD: automate deploy from pipeline | Vercel CLI driven entirely by Actions |
| CD: auto deploy on code change | push develop → staging; release → production |
| Deploy strategy (blue-green) | `deploy-production.yml` green deploy → smoke → promote |
| Monitoring after deploy | Vercel Analytics + Speed Insights + post-deploy smoke checks |
| Rollback process | auto-rollback in deploy job + manual `rollback.yml` runbook |
| Document CD for team | `docs/ci-cd.md` |

## Verification (end-to-end)

1. **CI gate**: open a PR → all CI jobs green; coverage artifact + step summary visible; PR gets a Vercel
   preview. Break a test → CI fails and deploy is blocked (proves gating).
2. **Staging**: push to `develop` → `deploy-staging` runs, staging alias updates, `/api/health` smoke passes.
3. **Versioning**: land a `feat:`/`fix:` commit on `main` → release-please opens a Release PR with the
   correct SemVer bump + CHANGELOG; merge it → git tag + GitHub Release created.
4. **Blue-green prod**: Release published → `deploy-production` deploys green, smoke-tests it, promotes it
   atomically; production `/api/health` passes; previous deployment remains for instant rollback.
5. **Rollback**: run `rollback.yml` (or force a failing smoke check) → production reverts to prior
   deployment; verify health.

## Out of scope (YAGNI)

- Canary traffic-splitting (requires Vercel Pro/Enterprise) — documented as the alternative strategy only.
- Broad test coverage of the whole app — starter suite proves the pipeline; threshold grows over time.
- Sentry / external APM — Vercel built-in monitoring chosen for this milestone.
- Database migration automation — app uses Sanity + an external API, no owned DB schema in this repo.
