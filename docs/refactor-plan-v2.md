# Refactor plan v2 — post-ESM cleanup (POOD round 2)

> **Status (2026-04-26):** Phases A, B, C, D, E, F (new), G (new), H (new), I (new), and J (new) are landed on `refactor-v2`. Tests went 63 → 127 passing, coverage stayed at 100% (lines/branches/funcs/statements), lint clean. The Sandi/POOD invariants the earlier phases established by inspection are now machine-enforced via ESLint (Phase I), and the e2e suite itself was tightened to one-concept-per-it with shared `withHttpServer` / extended `writeMysqlShim` helpers (Phase J). See per-phase "What landed" notes below and `git log master..refactor-v2` for the commit trail.

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

   **✅ Done in `phase-C-4`:** [src/utils/actions/index.js](../src/utils/actions/index.js) filters by extension, wraps `loader` in try/catch, validates `action.command` shape, and warns-and-skips. E2e in [test/e2e/custom-actions.spec.js](../test/e2e/custom-actions.spec.js) drops `README.md`, a throw-on-load `.js`, and a no-shape `.js` and asserts the CLI still boots.

### Phase D — Clean up the cruft ✅ Done

Commits:
1. `refactor(actions): drop dead 'return msg' from handlers` — every handler ends with `console.log(msg); return msg;` but the return value is no longer read (e2e asserts on stdout). Delete from all 10 action files.

   **✅ Done in `phase-D-1`:** dropped from `auth`, `config`, `custom-actions`, `default-actions`, and the `createMysqlAction` factory. Yargs ignores handler return values; nothing in the suite read them.
2. `refactor(config): readConfig throws diagnostic in cause; no console.log` — [src/utils/config/index.js:7-13](../src/utils/config/index.js#L7-L13) console.logs 5 lines before re-throw. Move the diagnostic into the `Error.cause` chain; the bin (or the user's terminal) can decide what to print.

   **✅ Done in `phase-D-2`:** four `console.log` lines collapsed into a single thrown `Error` with the parse/IO failure preserved as `Error.cause`. Existing e2e at [test/e2e/config.spec.js:44-46](../test/e2e/config.spec.js#L44-L46) still passes (asserts on `'Failed to read file'` + path, both preserved).
3. `chore: drop low-value lodash wrappers` — `_.toString(x)` → `String(x)`, `_.startsWith(s, '@')` → `s.startsWith('@')`, `_.isEmpty(arr)` → `arr.length === 0` where the type is known to be array. **Lodash stays as a dep.** Only the wrappers that add zero clarity go.

   **✅ Done in `phase-D-3`:** `_.startsWith` → native, `_.isEmpty(string)` → `!string`, `isEmpty(field)` → `!field` for known-string fields. Narrowed `utils/http`'s full lodash import to targeted `lodash/isEmpty.js` (the only wrapper still earning its keep — `params` can be null/undefined/{}). Added `typeof === 'string'` guard around the new `.startsWith` call to preserve `auth.js`'s object-payload tolerance that lodash silently coerced.
4. `chore: cleanup stale comment + nyc residue` — fix the comment at [bin/geek-lab.js:108-112](../bin/geek-lab.js#L108-L112) (`.commandDir` was removed in yargs 17), and `git rm -r .nyc_output/`.

   **✅ Done in `phase-D-4`:** dropped `.nycrc` (c8 reads `.c8rc.json`, never `.nycrc` — it was dead config from the nyc days). `.nyc_output/` is already gitignored and untracked; nothing to `git rm`. The stale `.commandDir` comment was already gone in earlier phases.
5. `test: add per-command --help e2e` — yargs has known footguns at the per-command help path. One e2e per built-in command asserting `gik <cmd> --help` exits 0 and includes the command's `describe`.

   **✅ Done in `phase-D-5`:** [test/e2e/per-command-help.spec.js](../test/e2e/per-command-help.spec.js) drives 14 isolated CLI invocations (one per built-in) and asserts each exits 0 and surfaces its own `describe` text.

### Phase E — Optional / discuss before starting

- ~~`test: e2e for mysql via mysql2 shim`~~ — **✅ Landed as `phase-G-2`** (see Phase G below).
- ~~`refactor(paths): inline os.homedir() if env-var seam is enough`~~ — **✅ Landed as `phase-F-5`** (see Phase F below).
- `chore(bin): forward update-notifier failures to stderr in debug mode`

   **✅ Done in `phase-E`:** the silent `.catch(() => {})` is replaced with a handler that surfaces the original error to stderr when `config.debugMode === true`, defensively wrapped in a try/catch so an unreadable config keeps the advisory path a no-op. Block stays under `c8 ignore` — the debug branch needs both a debug-mode config AND a real update-notifier failure simultaneously, which isn't reasonable to drive from CI.

---

### Phase F — POOD round-3 work surfaced after D ✅ Done

POOD smells the original v2 plan didn't catch, addressed after Phase D.

Commits:
1. `refactor(actions): use Map/Set for dedup, structured Error.cause for duplicates`

   **✅ Done in `phase-F-1`:** `seen = []` + `_.find` + `_.isEqual` → `seen = new Map()` keyed on `action.command`. `listFiles` uses an inline `Set` instead of `_.union`, dropping lodash from [src/utils/actions/index.js](../src/utils/actions/index.js) entirely. Duplicate-command path no longer `console.log`s from inside a util; throws a single message with `cause: { command, file, existingFile }`. The literal `'Duplicate command provided'` is preserved so the e2e still asserts on it.
2. `refactor(http): split validate / resolveBody / normalizeEndpoint`

   **✅ Done in `phase-F-2`:** the 45-line `request()` that did three jobs is now four pure pieces — `validateRequest(params)`, `resolveBody(fs, raw)`, `normalizeEndpoint(s)`, and a thin `createHttpClient` orchestrator. Two more `console.log` lines from inside a util folded into the `Error` message itself (finishes the "no console.log in src/utils/**" rule). Each piece has its own unit test in [test/utils/http.spec.js](../test/utils/http.spec.js).
3. `refactor(auth): extract isTokenValid + parseAuthResponse + computeTokenExpires`

   **✅ Done in `phase-F-3`:** four-job auth handler split into orchestration over three pure helpers in [src/utils/auth/index.js](../src/utils/auth/index.js). `now` is sourced from the injected `clock` (already in the deps bag for metrics) so the policy is fully deterministic in unit tests at [test/utils/auth.spec.js](../test/utils/auth.spec.js) — no HTTP fixture needed.
4. `refactor(actions): extract createRestAction factory`

   **✅ Done in `phase-F-4`:** same Sandi extraction `phase-B-1` did for the four mysql actions, applied to `cget`/`cpost`/`cput`/`cdelete`. Each file is now 8 lines of `{ command, method, describe, hasBody }` spec data pointing at one [src/utils/http/create-action.js](../src/utils/http/create-action.js) factory. Adding a fifth verb (cpatch, copts) is now a one-file change.
5. `chore(paths): drop vestigial os injection`

   **✅ Done in `phase-F-5`:** `paths.userDirectory(os)` and `paths.internalFile(os, fileName)` accepted `os` as a parameter so test code could swap it out — but no test ever did. The e2e helper isolates each invocation by setting `HOME`/`USERPROFILE` on the spawned child, and `os.homedir()` already honors those env vars. Inlined the `os` import into [src/utils/paths.js](../src/utils/paths.js); full e2e suite still passes (proves the env-var seam was sufficient).

### Phase J — Tighten e2e suite to Sandi style ✅ Done

After Phase I made the production code Sandi-clean, a fresh pass over the e2e
suite surfaced three tactical smells: multi-assertion `it()` blocks, assertions
on yargs's rendered chrome (which would break on cosmetic library updates),
and per-spec setup duplication.

Commits:
1. `phase-J-1: refactor(test/bin): split multi-assertion #bin tests, drop yargs-chrome assertions`

   The four `#bin` tests packed up to 5 assertions each on yargs-rendered substrings (`'<command>'`, `'--help'`, `'invalid command'`, `'see available'`). Split into 7 focused tests under four describe blocks asserting on geek-lab behavior — exit code, presence of geek-lab's own command names in help output, the version from package.json, and the unknown-command recommendation. Extracted small `runExpectingFailure` / `runExpectingSuccess` helpers so each test reads as 1–3 lines of intent.
2. `phase-J-2: refactor(test): withHttpServer + writeMysqlShim({ rejectsWith }), drop inline path/fs from mysql.spec`

   - `withHttpServer({ handler, config, configOverrides })` collapses the `startHttpServer` + `createCliEnv` + `apiUrl` wiring + close-on-cleanup choreography that [test/e2e/rest.spec.js](../test/e2e/rest.spec.js) (and the in-flight auth.spec) were inlining.
   - `writeMysqlShim(home, { rejectsWith })` extends the helper so [test/e2e/mysql.spec.js](../test/e2e/mysql.spec.js) no longer has to `await import('path')` / `await import('fs')` inline to write a custom rejecting shim.
3. `phase-J-3: chore(test): one-concept-per-it for #e2e/auth — before-and-observe pattern`

   The four `#e2e/auth` tests packed up to 5 assertions per CLI invocation (the worst was 5 mixed assertions covering exit code, stdout, request shape, persisted token, persisted expiry). Refactored to the canonical Sandi pattern for expensive setup with multiple observations: one `before()` runs the CLI once and stores the result, then sibling `it()`s each assert one observable. 12 focused tests in total (was 4). Side fix: cleanup() now passes `maxRetries: 5, retryDelay: 100` to `fs.rmSync` to defend against Windows EBUSY when the OS still holds a handle on the temp dir for ~50ms after the spawned child exits.

### Phase I — Machine-enforce Sandi/POOD rules via ESLint ✅ Done

Promotes the rules phases A–H established by inspection into machine-enforced
ones via `eslint.config.js`, so the next regression surfaces in lint instead
of code review.

Commits:
1. `phase-I-1: chore(lint): boundary rules`

   Three boundary rules:
   - `no-console: ['error', { allow: ['warn', 'error'] }]` scoped to `src/utils/**` (the rule phases D-2, F-2, H-1 had to enforce by hand each time a util smuggled diagnostics through stdout). The two action-factory files in `src/utils/{mysql,http}/create-action.js` carry per-call `eslint-disable-next-line` directives — the `console.log` lives inside the returned action handler closure (its output channel), not at util level.
   - `no-restricted-imports` for `axios`/`mysql2`/`mysql2/promise`/`os`/`update-notifier` scoped to `src/**` with `bin/` and `src/utils/bootstrap/` exempt. Locks the DI seam phases A and H-3 established.
   - `no-restricted-syntax` blocking bare `new Date()` (no-arg) outside [src/utils/clock.js](../src/utils/clock.js). Time enters via `clock.now()`. `new Date(timestamp)` stays legal.

   Side-fix: [test/bin/geek-lab.spec.js](../test/bin/geek-lab.spec.js) now locks `LANG/LC_ALL/LANGUAGE=en` on its `execSync` calls so yargs's translated help text doesn't fail the assertions on translated-locale machines.
2. `phase-I-2: chore(lint): Sandi mechanical caps`

   Adds `complexity: 8`, `max-depth: 3`, `max-lines-per-function: 25`, `max-lines: 200` (tests get the per-function/per-file caps disabled — describe blocks aren't real functions). The four real violations the cap surfaced were all genuine POOD candidates and got fixed rather than relaxed:
   - [src/actions/auth.js](../src/actions/auth.js) handler/factory → extracted `fetchToken({ http, config })` into [src/utils/auth/index.js](../src/utils/auth/index.js) with focused unit tests for happy/transport-failure/bad-shape.
   - [src/utils/actions/index.js](../src/utils/actions/index.js) `discoverActions` → extracted `loadActionFromFile`.
   - [src/utils/metrics/report.js](../src/utils/metrics/report.js) `buildReportData` → extracted `buildOverallGraph` and `buildEachActionGraph` over a shared `(actions, days, perDay)` view-model.

### Phase H — POOD round-3 (post-G re-analysis) ✅ Done

After G landed, a fresh POOD pass surfaced five smells that the previous plans
hadn't caught — most centered on residual `console.log` inside throw paths and
new bootstrap responsibilities that had crept into the bin.

Commits:
1. `phase-H-1: refactor(actions): drop console.log + throw pairs`

   The auth handler ([src/actions/auth.js](../src/actions/auth.js)) and the mysql action factory ([src/utils/mysql/create-action.js](../src/utils/mysql/create-action.js)) each `console.log`'d before re-throwing — same anti-pattern Phase D-2 fixed for utils/config. Errors now embed the cause inline so e2e assertions on stdout+stderr still match (yargs prints the thrown message to stderr).
2. `phase-H-2: refactor(auth): extract resolveAuthBody, drop JSON.parse from handler`

   The handler used to call `JSON.parse(config.resolveValue('apiAuthenticationJson'))` inline — config-shape policy leaking into the action. Pulled into [src/utils/auth/index.js](../src/utils/auth/index.js) as `resolveAuthBody(config)` with focused unit tests covering the previously-untested invalid-JSON failure.
3. `phase-H-3: refactor(bin): extract loadMysql2 + scheduleUpdateNotifier bootstrap helpers`

   Two new bootstrap responsibilities had crept into [bin/geek-lab.js](../bin/geek-lab.js) since the v2 plan was written — the `GEEK_LAB_MYSQL2_MODULE`-aware dynamic import and the update-notifier wiring. Moved both to [src/utils/bootstrap/index.js](../src/utils/bootstrap/index.js); the bin returns to pure DI wiring. Bootstrap helpers got their own unit tests covering all four update-notifier branches (success, silent failure, debug-logged failure, unreadable-config defensive path) which were previously c8-ignored in the bin and untested.
4. `phase-H-4: chore: drop unused 'main' field from package.json`

   `main` is meaningful for libraries (`require('foo')`); useless for a CLI where `bin` is the entrypoint. The pointer was dead metadata.
5. `phase-H-5: chore(auth): fix 'happend' typo in auth error message`

   The error read 'Something wrong happend on authentication' (missing 'e'); the e2e asserted on the typo, locking it in. Fixed both in one commit.

### Phase G — Close e2e workflow gaps ✅ Done

Commits:
1. ~~`test: e2e for malformed custom actions`~~ — landed alongside `phase-C-4`.
2. `test: e2e for mysql via injectable mysql2 shim`

   **✅ Done in `phase-G-2`:** seam at the composition root — [bin/geek-lab.js](../bin/geek-lab.js) loads `mysql2/promise` via dynamic import that honors `GEEK_LAB_MYSQL2_MODULE` when set (production unchanged when unset). E2e helper grew `writeMysqlShim(home, { rows, fields })` writing a small ESM module with a fake driver that appends events to a log file. [test/e2e/mysql.spec.js](../test/e2e/mysql.spec.js) covers all four mysql commands plus the `execute()`-rejects failure path. With the e2e in place, the `c8 ignore` block around `getCreds` in the bin was deleted — it's exercised on every mysql e2e run.
3. `test: harden e2e helper`

   **✅ Done in `phase-G-3`:** spawned child now runs with `cwd: home` (full hermeticity — no inheriting the test runner's cwd). The 10s `SIGKILL` fallback used to silently resolve with `status=null, signal='SIGKILL'`; now rejects `run()` with a clear timeout error embedding stdout/stderr.

---

## Coverage rule (unchanged from v1)

Current baseline is 100% (c8). Every commit must keep it.

**If a line becomes uncovered during the refactor, the commit must either:**
1. **(a) add an e2e that covers it**, or
2. **(b) justify a `/* c8 ignore next */` in the commit message** (reserved for genuinely-external integrations we cannot drive in CI), or
3. **(c) delete the line** (if it was defensive code for a scenario we cannot reproduce, it is dead code).

---

## Exit criteria

- ✅ `metrics --pretty` works on a globally installed read-only prefix and writes outside the package.
- ✅ `bin/geek-lab.js` < 80 lines (today: ~75 after F-5). Pure wiring, no policy.
- ✅ `src/actions/geek-lab/metrics.js` handler < 25 lines (today: ~15).
- ✅ `src/actions/mysql/` collapsed (1 factory + 4 thin spec entries).
- ✅ `src/actions/rest/` collapsed (1 factory + 4 thin spec entries — added in F-4).
- ✅ Zero `console.log` in `src/utils/**`.
- ✅ E2e covers `--help` per command (14 cases).
- ✅ Custom-actions folder tolerates junk files.
- ✅ E2e covers mysql workflow end-to-end (added in G-2).
- ✅ Coverage stays at 100%; lint clean; 116 tests passing.
- ✅ Zero `console.log` in throw paths anywhere in `src/` (closes the rule for actions, not just utils — added in H-1).
- ✅ `bin/geek-lab.js` is pure DI wiring; bootstrap policy lives in `src/utils/bootstrap/` (H-3).
- ✅ POOD/Sandi invariants are machine-enforced (Phase I): no console.log in utils, no infrastructure imports outside bin/bootstrap, no bare `new Date()` outside clock, complexity ≤ 8, depth ≤ 3, function ≤ 25 lines, file ≤ 200 lines.
- ✅ E2e suite follows Sandi style (Phase J): one-concept-per-it via before-and-observe, no yargs-chrome assertions, shared `withHttpServer` / extended `writeMysqlShim` helpers, no inline `fs`/`path` in test bodies.

---

## Commit hygiene (unchanged from v1)

- Prefix commits with the phase: `phase-A: ...`, `phase-B-1: ...`, etc.
- Keep commits small enough that a revert is cheap.
- Never mix a structural move with a behavior change in the same commit.
- Run `npm run lint && npm test` before every commit.
