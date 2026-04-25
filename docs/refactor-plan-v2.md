# Refactor plan v2 — post-ESM cleanup (POOD round 2)

End goals:
1. Fix the one production bug surfaced by the v2 audit (`metrics --pretty` writes inside the installed package).
2. Kill the smells that survived (or were created during) the ESM migration: duplicated mysql actions, god-method in `metrics.js`, leaky composition root, console.log inside `utils/*`.
3. Keep the e2e-first discipline: every behavior change is locked down by a spec going through `bin/geek-lab.js` against an isolated `$HOME`.

Working rules (same as v1):
- One long-lived branch, small thematic commits.
- Every commit leaves the suite green and the CLI runnable.
- No new `sinon.replace` on internal modules.
- Coverage stays at 100% (lines/branches/funcs/statements). If a line is hard to cover, the commit either (a) adds an e2e, (b) justifies a `c8 ignore` in the message, or (c) deletes the line.

---

## Phased plan

Each phase is a series of small commits on the same branch. Each phase ends with the suite green.

### Phase A — Hotfix: `metrics --pretty` writes to the installed package dir

**Why first / urgent:** today [src/actions/geek-lab/metrics.js:118](../src/actions/geek-lab/metrics.js#L118) writes the HTML report to `path.resolve(__dirname, '../../handlebars/...')`. After `npm i -g geek-lab` that resolves to `~/.../node_modules/geek-lab/src/handlebars/`. On read-only global prefixes the command crashes; on writable ones it slowly pollutes the installed package. This wants to ship as `v2.0.1`.

Commits:
- `fix(metrics): write --pretty report to user dir, not the installed package` — destination becomes `paths.userDirectory()` (or `os.tmpdir()` if user dir is missing). Update the e2e in [test/e2e/metrics.spec.js](../test/e2e/metrics.spec.js) to assert the report lives under `env.geekDir`, not under `src/handlebars`.

Exit: the fixed file path is verifiable from outside the repo (e2e isolates `$HOME`).

### Phase B — Collapse duplication, extract god-methods

**Why:** the heaviest source-of-change clusters left in the codebase.

Commits (one per change, same order):
1. `refactor(actions): extract createMysqlAction factory` — collapse the 4 near-identical files in [src/actions/mysql/](../src/actions/mysql/) into a single factory `createMysqlAction({ command, describe, argName, buildQuery })`. The 4 files become thin spec entries that call the factory. Update [test/actions/mysql/mysql.spec.js](../test/actions/mysql/mysql.spec.js) to test the factory once + each spec entry's identity.
2. `refactor(metrics): extract buildReport/renderReport/writeReport into utils/metrics` — move report-shape code out of [src/actions/geek-lab/metrics.js](../src/actions/geek-lab/metrics.js) into pure helpers in [src/utils/metrics/](../src/utils/metrics/). The action handler becomes a 15-line orchestrator: read store → build → render → write → log. Add unit tests for `buildReport` (pure function, easy to assert on) — the e2e keeps proving the integration.
3. `refactor(metrics): move recordCommand policy out of bin into utils/metrics` — the "if collectMetrics is false skip; if command is empty default to 'geek-lab'" rule lives in [bin/geek-lab.js:70-75](../bin/geek-lab.js#L70-L75). Move it to `metrics.recordCommand({ store, clock, command, enabled })` and let bin call it once.

### Phase C — Fix the wiring smells

Commits:
1. `refactor(bin): rename paths.list to actions.list in the deps bag` — `paths` exposing a file-listing helper is feature envy. Move it to `deps.actions.list(dirs)`. Update consumers in [src/actions/geek-lab/custom-actions.js](../src/actions/geek-lab/custom-actions.js) and [src/actions/geek-lab/default-actions.js](../src/actions/geek-lab/default-actions.js).
2. `refactor(bin): replace hand-rolled invalid-cmd check with yargs.strictCommands` — delete [bin/geek-lab.js:116-134](../bin/geek-lab.js#L116-L134) and let yargs 18 emit the error. Verify the existing `#bin` spec (`should show invalid command phrase + help`) still passes — adjust assertions to match yargs's wording if needed. Bonus: `gik <cmd> --help` will start working correctly.
3. `refactor(bin): simplify customActionsPath dance` — replace the `customActionsPath()` helper + `union` call ([bin/geek-lab.js:63-66, 99](../bin/geek-lab.js#L63-L66)) with `[paths.defaultActionsPath(), ...(readConfig().customActionsPath ?? [])]`.
4. `refactor(actions): tolerate non-action files in customActionsPath` — [src/utils/actions/index.js:20-37](../src/utils/actions/index.js#L20-L37) crashes the CLI on any non-factory file. Filter to `.js`/`.mjs`/`.cjs`, wrap each loader call in try/catch, log a warning to stderr, and continue. Add an e2e: drop a `README.md` and a broken `.js` into a custom-actions dir, assert CLI still boots and warns.

### Phase D — Clean up the cruft

Commits:
1. `refactor(actions): drop dead 'return msg' from handlers` — every handler ends with `console.log(msg); return msg;` but the return value is no longer read (e2e asserts on stdout). Delete from all 10 action files.
2. `refactor(config): readConfig throws diagnostic in cause; no console.log` — [src/utils/config/index.js:7-13](../src/utils/config/index.js#L7-L13) console.logs 5 lines before re-throw. Move the diagnostic into the `Error.cause` chain; the bin (or the user's terminal) can decide what to print.
3. `chore: drop low-value lodash wrappers` — `_.toString(x)` → `String(x)`, `_.startsWith(s, '@')` → `s.startsWith('@')`, `_.isEmpty(arr)` → `arr.length === 0` where the type is known to be array. **Lodash stays as a dep.** Only the wrappers that add zero clarity go.
4. `chore: cleanup stale comment + nyc residue` — fix the comment at [bin/geek-lab.js:108-112](../bin/geek-lab.js#L108-L112) (`.commandDir` was removed in yargs 17), and `git rm -r .nyc_output/`.
5. `test: add per-command --help e2e` — yargs has known footguns at the per-command help path. One e2e per built-in command asserting `gik <cmd> --help` exits 0 and includes the command's `describe`.

### Phase E — Optional / discuss before starting

- `test: e2e for mysql via mysql2 shim` — close the gap inherited from v1 plan (Phase 0 line 69). Probably needs a `customActionsPath`-like seam to inject a fake `mysql2` driver, or running an actual mysql via testcontainers. Worth a separate design discussion.
- `refactor(paths): inline os.homedir() if env-var seam is enough` — the e2e already drives via `HOME`/`USERPROFILE` env vars; the `os` injection may be vestigial.
- `chore(bin): forward update-notifier failures to stderr in debug mode` — the silent catch at [bin/geek-lab.js:34](../bin/geek-lab.js#L34) hides future regressions of update-notifier itself.

---

## Coverage rule (unchanged from v1)

Current baseline is 100% (c8). Every commit must keep it.

**If a line becomes uncovered during the refactor, the commit must either:**
1. **(a) add an e2e that covers it**, or
2. **(b) justify a `/* c8 ignore next */` in the commit message** (reserved for genuinely-external integrations we cannot drive in CI), or
3. **(c) delete the line** (if it was defensive code for a scenario we cannot reproduce, it is dead code).

---

## Exit criteria

- `metrics --pretty` works on a globally installed read-only prefix and writes outside the package.
- `bin/geek-lab.js` < 80 lines (today: 144). Pure wiring, no policy.
- `src/actions/geek-lab/metrics.js` handler < 25 lines (today: ~110).
- `src/actions/mysql/` collapsed to ≤ 2 files (1 factory + 1 spec table).
- Zero `console.log` in `src/utils/**`.
- E2e covers `--help` per command.
- Custom-actions folder tolerates junk files.
- Coverage stays at 100%; lint clean; suite green on Node 22.x and 24.x.

---

## Commit hygiene (unchanged from v1)

- Prefix commits with the phase: `phase-A: ...`, `phase-B-1: ...`, etc.
- Keep commits small enough that a revert is cheap.
- Never mix a structural move with a behavior change in the same commit.
- Run `npm run lint && npm test` before every commit.
