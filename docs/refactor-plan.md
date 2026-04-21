# Refactor plan — POOD split + e2e-first tests + ESM prep

End goals:
1. Make the codebase easier to read and change (single-responsibility modules, dependency injection).
2. Shrink the eventual CJS → ESM migration to a mechanical rename by removing module-level monkey-patching.

Working rules for this refactor:
- One long-lived branch, small incremental commits.
- Every commit leaves the suite green and the CLI runnable.
- **Tests written during this refactor are e2e through `bin/geek-lab`.** No new sinon.replace on module exports. Keep unit tests only where domain logic is non-trivial and not reachable via e2e (none expected here).
- Delete mock-heavy tests as the behaviour they cover is proven by e2e.

---

## Diagnosis (why we are doing this)

- `src/lib/utils.js` is a god object (13 methods, ~6 reasons to change: paths, config store, metrics store, HTTP, MySQL, action discovery).
- Methods inside `utils.js` talk to each other through the module export (`UTILS.readConfig()` at lines 14, 43, 91, 167). The only seam tests have is `sinon.replace(utils, 'readConfig', ...)`.
- 11 of 12 spec files rely on that pattern. ESM namespaces are read-only — the exact same tests will throw under ESM.
- Several tests assert on wiring rather than outcome (`stub.calledOnce`), stub third-party libs (`lodash.filter` in `test/lib/getActions.spec.js:43`), or exist only for coverage (`action.builder(yargs)` in `test/actions/geek-lab/metrics.spec.js:31-33`).
- `test/bin/geek-lab.spec.js` already proves e2e testing works here — it spawns the real binary and asserts on stdout/stderr. It is underused.

---

## Target shape

All extracted collaborators live under `src/utils/`. Each module is single-responsibility and receives its dependencies as arguments — no cross-calls through the module export.

```
src/
  utils/
    paths.js        userDirectory(os), internalFile(name)
    clock.js        now()                                      // trivial seam for date-dependent code
    config/         readConfig(fs, paths), writeConfig(fs, paths, data), resolveValue(config, key)
    metrics/        readMetrics(fs, paths), recordUsage({ store, clock, command })
    http/           createHttpClient({ axios, getToken, getBaseUrl })
    mysql/          createMysqlClient({ mysql2, getCreds })
    actions/        discoverActions({ fs, loader, paths })     // loader = require today, import() later
  actions/          (unchanged on disk; each file exports a factory — see Phase 2)
  handlebars/       (unchanged)
  scripts/          (unchanged)
bin/geek-lab.js     wires deps and registers actions
```

`src/lib/utils.js` becomes a thin re-export shim during the transition, then is deleted.

---

## Phased plan

Each phase is a series of small commits on the same branch. Each phase ends with the suite green.

### Phase 0 — Raise the e2e safety net first

**Why first:** every later phase is an internal refactor. The existing action specs are coupled to internals and will lie to us about behaviour. Real user-visible behaviour must be locked down before we start moving code.

Commits:
- Add a test harness that runs the CLI against a temp `$HOME` so config / metrics files are isolated per test. (`execSync` with `env: { ...process.env, HOME: tmpDir, USERPROFILE: tmpDir }`.)
- One e2e spec per command, covering the happy path and the main error path, asserting on stdout / stderr / exit code:
  - `geek-lab` with no args (help)
  - `--help`, `--version`, invalid command (already covered — extend)
  - `change-env` (valid env, unknown env)
  - `config`
  - `default-actions`
  - `custom-actions` (empty and populated)
  - `metrics` (plain + `--pretty`, assert a file was written under a predictable location)
  - `auth` (stub the HTTP endpoint with a local `http.createServer` on a random port; point config at it — no axios mocking)
  - `cget` / `cpost` / `cput` / `cdelete` (same local-server pattern)
  - `mysql` — skipped or marked pending unless we stand up a local sqlite/mysql shim. Acceptable gap; covered by unit-style spec for now until Phase 1 gives us an injectable port.

Success criteria: the 4 existing bin tests plus the new ones fully cover every command. At that point the mock-heavy action specs become redundant safety.

### Phase 1 — Extract `src/lib/utils.js` into `src/utils/*`

One commit per extraction. After each commit, `src/lib/utils.js` re-exports from the new location, so no caller changes and the suite stays green.

Extraction order (lowest risk first):
1. `src/utils/paths.js` — `userDirectory`, `getDefaultActionsPath`, `getCustomActionsPath` (with injected `os` / `fs`).
2. `src/utils/clock.js` — `now()`.
3. `src/utils/config/` — `readConfig`, `writeConfig`, `resolveValue` (the old `getConfigValue`).
4. `src/utils/metrics/` — `readMetrics`, `recordUsage` (receives config + clock, no module self-calls).
5. `src/utils/http/` — factory that closes over `{ axios, getToken, getBaseUrl }`.
6. `src/utils/mysql/` — factory that closes over `{ mysql2, getCreds }`.
7. `src/utils/actions/` — `discoverActions({ fs, loader, paths })`. Today `loader = require`; in Phase 4 this becomes `await import()`.

During this phase **no tests are added or changed** beyond keeping green — the e2e suite from Phase 0 is our safety net.

### Phase 2 — Flip action handlers to dependency injection

For each file under `src/actions/`, change the export shape from:

```js
exports.command = 'cget';
exports.builder = (yargs) => ...;
exports.handler = async (argv) => { UTILS.performRequest(...) };
```

to:

```js
module.exports = (deps) => ({
  command: 'cget',
  describe: 'performs a GET request',
  builder: (yargs) => ...,
  handler: async (argv) => { deps.http.get(argv.endpoint); },
});
```

`bin/geek-lab.js` builds `deps` once and calls each factory. `discoverActions` returns factories; `bin` invokes them.

Commit shape: one commit per action file, each one removing the matching `test/actions/**/*.spec.js` that was only testing wiring. The e2e spec for that command (added in Phase 0) is the new proof of behaviour. After each commit, the total `sinon.replace(utils, ...)` count drops.

### Phase 3 — Delete `src/lib/utils.js`

Once nothing imports it:
- Delete the shim.
- Delete any remaining mock-heavy tests whose behaviour is now covered by e2e.
- Check coverage report; add e2e cases if any real branch is uncovered.

At this point there is no module-internal monkey-patching left in the codebase. That is the POOD win and the ESM pre-condition.

### Phase 4 — CJS → ESM and yargs 18

Now mechanical:
- `"type": "module"` in `package.json`.
- `engines.node` to `>=22.12.0` (yargs 18 minimum on the 22 line).
- Rename `require`/`module.exports` to `import`/`export`. Add `.js` extensions to relative imports.
- `__dirname` → `import.meta.url` + `fileURLToPath` (only touches `bin/geek-lab.js` and the new `paths.js`).
- `discoverActions` loader flips from `require(file)` to `await import(file)`; the one-time `await` happens in `bin/geek-lab.js` during boot.
- `yargs` via `import yargs from 'yargs'` + `hideBin(process.argv)` from `yargs/helpers`.
- Verify nyc still behaves with ESM; if coverage breaks, swap to c8. (Separate commit.)
- Document the ESM-only change for custom-action authors in `docs/custom-actions.md` — this is a consumer-facing breaking change; bump the major version.

---

## What gets deleted along the way

- `action.builder(yargs)` coverage-filler tests.
- Stubs on `lodash.filter` / `lodash.find` (`test/lib/getActions.spec.js:43`).
- Every `sinon.replace(utils, ...)`.
- The dual `const { x } = require(...)` + `const utils = require(...)` pattern in specs (only exists to let sinon patch the namespace).
- Most `afterEach(() => sinon.restore())` blocks.

---

## Commit hygiene

- Prefix commits with the phase: `phase-0: add e2e for change-env`, `phase-1: extract paths util`, etc.
- Keep commits small enough that a revert is cheap.
- Never mix a structural move with a behaviour change in the same commit.
- Run `npm run lint && npm test` before every commit.

---

## Coverage rule

Current baseline is 100% (nyc). The number will shift as mock-heavy specs are deleted; that is expected. Rule for every commit on this branch:

**If a line becomes uncovered during the refactor, the commit must either:**
1. **(a) add an e2e that covers it**, or
2. **(b) justify an `/* istanbul ignore next */` in the commit message** (reserved for genuinely-external integrations we cannot drive in CI — e.g. the mysql2 driver), or
3. **(c) delete the line** (if it was defensive code for a scenario we cannot reproduce, it is dead code).

No commit silently lowers coverage. The exit criteria below assume this rule was followed throughout.

---

## Exit criteria

- `src/lib/utils.js` is gone.
- No spec imports a src module and mutates it with sinon.
- `sinon.replace(...)` count in the repo = 0 (or only used on genuinely external objects like `axios`, and only as the very last resort).
- E2e suite covers every command and every user-visible error path.
- yargs 18 installed, project runs on ESM, `npm test` green on Node 22.12+ and 24.x.
