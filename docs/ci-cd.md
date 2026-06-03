# CI/CD & Deployment Guide

Authoritative reference for how the **GoPadel backoffice** (a.k.a. `padel-net-admin-dashboard`)
is tested, released, and deployed. This is the team-facing CD documentation
(assignment Task 8: _"document the CD process for the whole team"_).

- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5.9 (strict) · npm · Node `22.20.0` (pinned via `.nvmrc`).
- **Hosting:** Vercel.
- **Source of truth for deploys:** **GitHub Actions**. Vercel's own Git
  auto-deploy is **disabled** (enforced by `vercel.json` _and_ a setting in the
  Vercel dashboard) so that the pipeline — not Vercel — owns every promotion.

---

## 1. Overview

We run a **two-branch / two-environment** model:

| Branch    | Role                       | Deploys to     | How                                                        |
| --------- | -------------------------- | -------------- | --------------------------------------------------------- |
| `develop` | Integration branch         | **Staging**    | Every push auto-deploys after CI passes.                  |
| `main`    | Production release branch  | **Production** | `release-please` cuts a Release; publishing it deploys.   |

- All work happens on short-lived branches that open **Pull Requests into `develop`**.
- Merging to `develop` ships to **staging** automatically.
- `main` is updated only by merging a **`release-please` Release PR**. Publishing
  the resulting GitHub Release triggers a **blue-green** production deploy.
- Production deploys go out **blue-green**: a new ("green") deployment is built,
  smoke-tested while still un-promoted, then atomically swapped live. The old
  ("blue") deployment stays warm as an **instant rollback target**.

### Architecture / flow diagram

```
                          ┌──────────────────────────────────────────────┐
   Feature branch         │                  CI (ci.yml)                  │
        │                 │  install ─ lint:ci ─ typecheck ─ test ─ build │
        │  open PR ─────▶  │  (SKIP_ENV_VALIDATION=1, HUSKY=0)             │
        ▼                 └──────────────────────────────────────────────┘
   Pull Request                              │ required checks must be green
        │                                     ▼
        │  merge                         ┌─────────┐
        ▼                                │ branch  │
   ┌─────────┐   push    ┌────────────┐  │protection│
   │ develop │ ────────▶ │     CI     │ ─┴─────────┘──▶ deploy-staging.yml
   └─────────┘           └────────────┘                 (vercel build+deploy,
        │                                                 Preview env) ──▶ STAGING
        │
        │  open/merge Release PR (release-please)
        ▼
   ┌─────────┐  push   ┌───────────────────┐  maintains  ┌────────────────────┐
   │  main   │ ──────▶ │ release-please.yml │ ──────────▶ │  Release PR (open) │
   └─────────┘         └───────────────────┘             └────────────────────┘
        ▲                                                          │
        │  merge Release PR ──▶ tag vX.Y.Z ──▶ publish GitHub Release
        │                                                          │
        │                                                          ▼
        │                                          ┌─────────────────────────────┐
        │                                          │   deploy-production.yml     │
        │                                          │  1. vercel build --prod     │
        │                                          │  2. vercel deploy (GREEN,   │
        │                                          │       un-promoted)          │
        │                                          │  3. smoke test /api/health  │
        │                                          │  4. vercel promote (swap)   │
        │                                          │  5. post-promote smoke      │
        │                                          │     against PRODUCTION_URL   │
        │                                          └─────────────────────────────┘
        │                                                          │
        │                            on failure ──▶ vercel rollback (auto)
        │                                                          ▼
        │                                                     PRODUCTION
        │                                                          │
        └──────────────── manual rollback (rollback.yml, workflow_dispatch) ◀──┘
                          Actions ▶ Run workflow "rollback" [deployment_url?]
```

---

## 2. The five workflows

All workflows live in `.github/workflows/`. Shared conventions:

- `actions/checkout@v4`, `actions/setup-node@v4` with
  `node-version-file: '.nvmrc'` and `cache: 'npm'`.
- `npm ci` for installs, with **`HUSKY=0`** in the env so the `prepare`
  (husky) script is a no-op in CI.
- Any step that runs `next build` / `tsc` sets **`SKIP_ENV_VALIDATION=1`**
  (see [Env validation gotcha](#5-environment-variables--the-validation-gotcha)).

| # | Workflow                  | Trigger                                              | What it does |
| - | ------------------------- | ---------------------------------------------------- | ------------ |
| 1 | `ci.yml`                  | PRs + pushes to `develop`/`main`                     | Quality gate: install → `lint:ci` → `lint:typecheck` → `test:run` (uploads coverage artifact) → `build`. These are the **required status checks** for branch protection. |
| 2 | `deploy-staging.yml`      | push to `develop` (after CI)                         | Builds with the Vercel CLI in **Preview** scope and deploys to the **staging** environment. |
| 3 | `release-please.yml`      | push to `main`                                       | Runs `googleapis/release-please-action@v4`. Parses Conventional Commits, maintains the **Release PR** (changelog + version bump). Merging it tags `vX.Y.Z` and creates the GitHub Release. |
| 4 | `deploy-production.yml`   | GitHub **Release published**                         | **Blue-green** production deploy (build → deploy green → smoke → `vercel promote` → post-promote smoke). On failure, runs `vercel rollback`. Gated by the `production` GitHub Environment (required reviewers). |
| 5 | `rollback.yml`            | `workflow_dispatch` (manual)                         | Manual rollback. Optional `deployment_url` input; with no input, `vercel rollback` reverts to the previous production deployment. |

> The exact step list lives in each YAML file — treat the files as the
> implementation and this table as the contract.

---

## 3. Versioning: SemVer + Conventional Commits

We follow [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`) and
drive it **automatically** from [Conventional Commits](https://www.conventionalcommits.org/).

`release-please` reads the commit history on `main` and decides the next
version + changelog entry from the commit **types**:

| Commit                                    | Example                                         | Version bump   |
| ----------------------------------------- | ----------------------------------------------- | -------------- |
| `feat:`                                   | `feat: add admin invitation flow`               | **MINOR** (x.**+1**.0) |
| `fix:`                                     | `fix: correct token decryption on cold start`   | **PATCH** (x.y.**+1**) |
| `feat!:` or any `BREAKING CHANGE:` footer  | `feat!: drop legacy permissions format`         | **MAJOR** (**+1**.0.0) |
| `docs:`, `chore:`, `ci:`, `refactor:`, `test:`, `style:`, `perf:` | `chore: bump deps` | No release (still in changelog where relevant) |

How it flows:

1. You merge Conventional Commits into `develop`, then into `main` (via a normal
   PR merge of `develop` → `main`, or however the team integrates).
2. `release-please.yml` opens/updates a **Release PR** that bumps the version in
   `package.json` + `.release-please-manifest.json` and writes `CHANGELOG.md`.
3. When the team is ready to ship, **merge the Release PR**. `release-please`
   tags `vX.Y.Z` and publishes a **GitHub Release**.
4. The published Release triggers `deploy-production.yml`.

Because the version is derived from commit messages, **commit message quality is
release quality**. Messages are linted locally by commitlint (see `CONTRIBUTING.md`).

---

## 4. Blue-green deployment (and the canary alternative)

### What we do: blue-green

Production deploys are **blue-green**, orchestrated by `deploy-production.yml`:

1. **Build** the app for production with the Vercel CLI
   (`vercel build --prod`, `SKIP_ENV_VALIDATION` not needed here because real
   env vars are pulled from Vercel).
2. **Deploy GREEN, un-promoted.** `vercel deploy --prebuilt --prod` produces a
   new production-grade deployment **without** assigning it the production
   alias/domain. Live traffic still goes to the current ("blue") deployment.
3. **Smoke test the green deployment** at its unique URL — hit `/api/health`
   (and any other smoke checks). If it fails, we abort **before** any user sees it.
4. **Atomic swap:** `vercel promote <green-deployment-url>` instantly moves the
   production alias to green. There is no half-migrated state — it flips at once.
5. **Post-promote smoke** against the real production domain
   (`vars.PRODUCTION_URL`, e.g. `/api/health`) to confirm the live site is healthy.

The previous ("blue") deployment is **not destroyed** — it stays warm on Vercel,
so rolling back is an instant alias swap, not a rebuild (see the runbook below).

```
        ┌──────────┐  promote  ┌──────────┐
 BLUE   │ v1.4.2   │ ◀──────── │  alias   │   (rollback target: still live, instant)
 (old)  └──────────┘           └────┬─────┘
                                    │ atomic swap on success
        ┌──────────┐  smoke OK      ▼
 GREEN  │ v1.5.0   │ ───────────▶ PRODUCTION
 (new)  └──────────┘
```

### What we did NOT do: canary / rolling releases

The documented alternative is a **canary / rolling release** using **Vercel
Rolling Releases** (available on **Pro/Enterprise** plans), where a new version
receives a small percentage of traffic that is gradually ramped (e.g.
1% → 10% → 50% → 100%) while metrics are watched, with automatic halt/rollback
on regressions.

We deliberately chose **blue-green** instead because:

- It works on our current Vercel plan without rolling-release features.
- The swap is **atomic and simple** (no traffic-splitting math, no per-percent gates).
- Rollback is equally atomic (re-alias the old deployment).

Canary remains the natural future upgrade if/when we move to a plan that
supports Rolling Releases and want progressive delivery.

---

## 5. Environment variables & the validation gotcha

App env vars are validated by `@t3-oss/env-nextjs` in `src/env.js`:

```js
skipValidation: !!process.env.SKIP_ENV_VALIDATION
```

> **Gotcha:** any CI job that runs `next build`, `tsc`, etc. **without real
> secrets** MUST set **`SKIP_ENV_VALIDATION=1`**, or the build throws on missing
> env. The CI workflow (`ci.yml`) sets this; deploy workflows do **not** need it
> because the Vercel CLI injects the real env from the Vercel project.

The real values live in **Vercel project settings**, scoped to both
**Production** and **Preview**:

```
NEXT_PUBLIC_SANITY_PROJECT_ID
NEXT_PUBLIC_SANITY_DATASET
SECRET_SANITY_VIEW_TOKEN
SECRET_SANITY_EDIT_TOKEN
NEXT_PUBLIC_API_URL
PERMISSIONS_ENCRYPTION_SECRET
NEXT_PUBLIC_PERMISSIONS_DECRYPTION_SECRET
```

---

## 6. Monitoring & health checks

| Tool                   | What it gives us                                                                 | Where it's wired |
| ---------------------- | -------------------------------------------------------------------------------- | ---------------- |
| **Vercel Analytics**   | Privacy-friendly traffic / page-view analytics, no cookies.                      | `<Analytics />` in `src/app/(main)/layout.tsx` (`@vercel/analytics/next`). |
| **Vercel Speed Insights** | Real-user Core Web Vitals (LCP, CLS, INP, …) from production traffic.          | `<SpeedInsights />` in `src/app/(main)/layout.tsx` (`@vercel/speed-insights/next`). |
| **`/api/health` smoke** | Liveness probe used by the deploy pipeline to gate promotion and verify the live site. | Hit by `deploy-production.yml` (pre-promote on the green URL, post-promote on `PRODUCTION_URL`). |

Both monitoring components render **just before `</body>`** so they load on every
page of the main app. Data appears in the Vercel dashboard under
**Analytics** and **Speed Insights** for the project.

---

## 7. Rollback runbook

### 7a. Automatic rollback (production deploy failed)

If `deploy-production.yml` fails — typically the **pre-promote smoke test** on
the green deployment, or the **post-promote smoke** against `PRODUCTION_URL` —
the workflow runs **`vercel rollback`** to revert production to the previous
healthy deployment. No human action required; the failure is visible in the
Actions run and the production alias is restored to "blue".

### 7b. Manual rollback (on demand)

Use this when a regression is discovered **after** a deploy reported success.

1. Go to **GitHub → Actions → "rollback"** workflow.
2. Click **Run workflow** (`workflow_dispatch`).
3. Optionally set the **`deployment_url`** input to roll back to a **specific**
   previous deployment. Leave it blank to roll back to the **immediately
   previous** production deployment (plain `vercel rollback`).
4. Run it. The alias swaps back atomically — no rebuild, near-instant.

> Because blue-green keeps old deployments warm, rollback is an **alias swap**,
> not a rebuild. Expect it to take seconds.

---

## 8. One-time setup checklist

Do this once when wiring the pipeline to a fresh repo / Vercel project.

- [ ] **Create the `main` branch** from `develop` (production branch):
      `git switch develop && git switch -c main && git push -u origin main`.
- [ ] **Link the repo to Vercel** to discover the org/project IDs:
      run `vercel link`, then read `.vercel/project.json` — it contains
      `orgId` and `projectId`.
- [ ] **Create a Vercel token** at <https://vercel.com/account/tokens>.
- [ ] **Add GitHub repo secrets** (Settings → Secrets and variables → Actions → Secrets):
  - [ ] `VERCEL_TOKEN` — the token above.
  - [ ] `VERCEL_ORG_ID` — `orgId` from `.vercel/project.json`.
  - [ ] `VERCEL_PROJECT_ID` — `projectId` from `.vercel/project.json`.
- [ ] **Add the GitHub Actions variable** (same page → Variables):
  - [ ] `PRODUCTION_URL` — the production domain, used by the post-promote smoke check.
- [ ] **Disable Vercel Git auto-deploy** in the Vercel dashboard
      (Project → Settings → Git). It is also enforced by `vercel.json`, but turn
      it off in the dashboard too so Vercel never deploys behind the pipeline's back.
- [ ] **Set all app env vars in Vercel** for **both Production and Preview**
      scopes (the seven vars listed in §5).
- [ ] **Create a GitHub `production` Environment**
      (Settings → Environments → `production`) and add **required reviewers** —
      this is the approval gate `deploy-production.yml` waits on.
- [ ] **Configure branch protection** on `develop` and `main` requiring the
      **CI status checks** (lint, typecheck, test, build) to pass before merge.

---

## 9. Assignment coverage map (Tasks 7 & 8)

Where each assignment bullet is satisfied.

| Task | Bullet                                                       | Satisfied by |
| ---- | ----------------------------------------------------------- | ------------ |
| 7    | CI pipeline (lint, typecheck, test, build)                  | `ci.yml` · §2 |
| 7    | Auto-deploy `develop` → staging                             | `deploy-staging.yml` · §1, §2 |
| 7    | Production release flow via `release-please` + SemVer       | `release-please.yml` · §3 |
| 7    | Blue-green production deploy with smoke gate                 | `deploy-production.yml` · §4 |
| 7    | Automatic + manual rollback                                 | `deploy-production.yml` (auto), `rollback.yml` (manual) · §7 |
| 7    | Env validation handled in CI                                | `SKIP_ENV_VALIDATION=1` · §5 |
| 7    | Husky no-op in CI                                           | `HUSKY=0` · §2 |
| 7    | Monitoring (Analytics, Speed Insights, health checks)       | `src/app/(main)/layout.tsx`, `/api/health` · §6 |
| 8    | Document the CD process for the whole team                  | **This file** (`docs/ci-cd.md`) |
| 8    | Branch/environment model documented                         | §1 (+ diagram) |
| 8    | SemVer / Conventional Commits policy documented             | §3, `CONTRIBUTING.md` |
| 8    | Blue-green explained + canary alternative noted             | §4 |
| 8    | Rollback runbook                                            | §7 |
| 8    | One-time setup checklist                                    | §8 |
| 8    | Contribution rules for the team                             | `CONTRIBUTING.md`, `.github/pull_request_template.md` |
