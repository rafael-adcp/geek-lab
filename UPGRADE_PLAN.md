# Node.js Upgrade Plan

**Goal:** move `geek-lab` from Node 10.17 to Node 22 LTS (current active LTS as of 2026-04).

**Branching model:** one feature branch per phase off `master`, open a PR, merge only when CI passes. Small, independent, reversible.

---

## Phase 0 — Baseline
- Branch `chore/upgrade-baseline`.
- Confirm `npm ci && npm run lint && npm test` pass as-is on Node 12 locally.
- Capture `npm audit` output as a reference point.
- Grep-verify which frontend deps are actually used (`d3`, `billboard.js`, `bootstrap`) — may be removable dead weight.

## Phase 1 — Widen CI matrix (safety net, no code changes)
- Branch `ci/expand-matrix`.
- Update `.github/workflows/nodejs.yml` matrix to add `18.x, 20.x, 22.x` alongside the old ones.
- Bump `actions/checkout@v4` and `actions/setup-node@v4`.
- This PR's failures map the real upgrade work.

## Phase 2 — Dev tooling (low risk)
- Branch `chore/upgrade-test-tooling`: `mocha 6→10`, `nyc 15→17`, drop unused `istanbul` (nyc supersedes it), evaluate `expect@24` (legacy) → replace with `chai` or node's built-in `assert`.
- Branch `chore/upgrade-eslint`: `eslint 6→8` (staying on 8 avoids flat-config migration; jump to 9 later).
- Branch `chore/replace-pre-push`: `pre-push@0.1.1` is unmaintained — swap for `husky` or drop entirely (CI already gates merges).

## Phase 3 — Runtime deps (one group per PR)
Each group is small, independent, and reversible:
- `uuid 3→11` — breaking: named imports (`import { v4 } from 'uuid'`).
- `axios 0.21→1.x` — breaking: error shape, some config keys.
- `yargs 15→17`.
- `update-notifier 4→7` — ESM-only; needs dynamic `import()` or stays pinned.
- `sinon 8→19`.
- `mysql2 2→3`.
- `handlebars`, `lodash`, `moment` minor bumps. (`moment` is in maintenance mode — flag for later replacement with `dayjs`, out of scope here.)
- `recursive-readdir-sync` — unmaintained; candidate for removal in favor of `fs.readdirSync({ recursive: true })` (Node 20+).
- Frontend deps (`d3 5→7`, `bootstrap 4→5`, `billboard.js 1→3`) — only if Phase 0 confirms they're used.

## Phase 4 — Flip to Node 22
- Branch `chore/node-22`.
- `.nvmrc` → `22`.
- Add `"engines": { "node": ">=22" }` to `package.json`.
- CI matrix → `[20.x, 22.x]` (drop 8/10/12/18).
- Update `clean` script to use cross-platform delete (`rimraf`) so it works on Windows too.

## Phase 5 — Cleanup
- `npm audit fix`.
- Regenerate `package-lock.json`.
- Update `readme.md` if it states a Node version.

---

**Order rationale:** Phase 1 first so CI can catch Phase 2+ regressions on new Node versions while old Node still works. The Node flip in Phase 4 is last so it's the smallest, most isolated change.
