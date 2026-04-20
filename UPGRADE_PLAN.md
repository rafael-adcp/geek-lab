# Node.js Upgrade Plan

**Goal:** move `geek-lab` from Node 10.17 to Node 22 LTS (current active LTS as of 2026-04).

**Branching model:** a single long-lived branch `chore/upgrade-baseline` holds all the work. Within that branch, each logical change is its own small commit (one dep group, one tooling bump, one fix per commit) so history is bisectable and reviewable step-by-step. The branch only merges to `master` once CI is fully green.

**Commit discipline:**
- One concern per commit (e.g. "upgrade mocha to v10", not "upgrade test tooling").
- Conventional-style prefixes (`chore:`, `fix:`, `ci:`, `docs:`) to make `git log --oneline` scan-friendly.
- Push early and often so GitHub Actions runs against each commit.

---

All commits land on branch `chore/upgrade-baseline`. Phase numbers below describe the commit *groups* — each bullet is typically its own commit.

## Phase 0 — Baseline
- `docs: add Node upgrade plan`.
- Confirm current state: lint passes, 48/49 tests pass on Node 22 (one flaky test hits a live URL), 52 `npm audit` findings.
- Finding: `d3`/`billboard.js`/`bootstrap` only referenced via static `<script>` tags in `src/handlebars/metrics_template.hb` — no JS import surface, only file-path compat matters.
- `fix(test): stub network in auth.spec shape-validation case` so CI can go green.

## Phase 1 — Widen CI matrix (safety net, no code changes)
- `ci: add Node 18/20/22 to test matrix`.
- `ci: bump actions/checkout and actions/setup-node to v4`.
- Purpose: each subsequent commit will be validated against new Node versions while old ones still work. The matrix failures map the real upgrade work.

## Phase 2 — Dev tooling (low risk)
- `chore: upgrade mocha 6 → 10`.
- `chore: upgrade nyc 15 → 17`.
- `chore: drop istanbul (superseded by nyc)`.
- `chore: replace expect@24 with chai or node:assert`.
- `chore: upgrade eslint 6 → 8` (flat-config jump to 9 deferred).
- `chore: drop pre-push in favour of CI gating` (pre-push@0.1.1 is unmaintained).

## Phase 3 — Runtime deps (one commit per dep group)
Each group is small, independent, and reversible:
- `chore: upgrade uuid 3 → 11` — breaking: named imports (`const { v4 } = require('uuid')`).
- `chore: upgrade axios 0.21 → 1.x` — breaking: error shape, some config keys.
- `chore: upgrade yargs 15 → 17`.
- `chore: upgrade update-notifier 4 → 7` — ESM-only; needs dynamic `import()`.
- `chore: upgrade sinon 8 → 19`.
- `chore: upgrade mysql2 2 → 3`.
- `chore: bump handlebars/lodash/moment` (moment is in maintenance mode — flag for later replacement with `dayjs`, out of scope here).
- `chore: drop recursive-readdir-sync for fs.readdirSync({ recursive: true })` (Node 20+).
- `chore: upgrade d3/bootstrap/billboard.js` — only the static-asset paths matter; verify the template still resolves the files.

## Phase 4 — Flip to Node 22
- `chore: set .nvmrc to 22`.
- `chore: add engines.node >=22 in package.json`.
- `ci: drop legacy Node versions from matrix` (keep `20.x, 22.x`).
- `chore: replace rm -Rf in clean script with rimraf` (cross-platform).

## Phase 5 — Cleanup
- `chore: npm audit fix` (only the ones that don't require breaking changes; the rest should be resolved by earlier phases).
- `chore: regenerate package-lock.json`.
- `docs: update readme with supported Node versions` if it states one.
- Final commit: merge branch into `master` via PR once the full CI matrix is green.

---

**Order rationale:** Phase 1 first so CI can catch Phase 2+ regressions on new Node versions while old Node still works. The Node flip in Phase 4 is last so it's the smallest, most isolated change.
