# Follow-up — deps to revisit after the Node 22 upgrade

This is a punch list of dependencies that are either in maintenance mode, misclassified, or over-sized for what the codebase actually needs. None of these block the current Node 10 → Node 22 effort — they are deferred so that each can land as its own small, focused change.

Listed roughly in order of effort-vs-payoff.

---

## 1. `sinon` is in `dependencies`, should be in `devDependencies`

**Observation:** `sinon` is only `require`d from files under `test/`; no `src/` file imports it. Shipping it as a runtime dep pulls its entire transitive tree (dozens of packages) into end-user installs of the `geek-lab` CLI for no runtime benefit.

**Change:** `npm install --save-dev sinon && npm uninstall sinon` (or edit package.json directly and regenerate the lockfile).

**Effort:** trivial. **Payoff:** ~20 fewer packages in installs, smaller audit surface.

---

## 2. `moment` — officially in maintenance mode

**Observation:** https://momentjs.com/docs/#/-project-status/ explicitly recommends migrating to another library. We use it for:
- formatting today's date as `DD/MM/YYYY` (metrics collection)
- the `isSameOrAfter` comparison on `tokenExpires` in `src/actions/auth.js`
- timestamp arithmetic (`.add(..., 'minutes')`) in the same file

All of these are one-liners in `dayjs`, `date-fns`, or plain `Intl.DateTimeFormat` + `Date` arithmetic.

**Candidate replacement:** `dayjs` (2kB, drop-in API for the surface we use) or native `Intl.DateTimeFormat`.

**Effort:** small — ~4 call sites.

---

## 3. `eslint` 8 is end-of-life

**Observation:** eslint 8 reached EOL in October 2024. We intentionally stayed on 8 during the Node upgrade to avoid the flat-config migration that v9+ forces. Current latest is `eslint@10`.

**Change:** migrate `.eslintrc` → `eslint.config.js` (flat config), upgrade to `eslint@10`.

**Effort:** medium — mechanical but touches the entire rules block. There are automated migrators (`@eslint/migrate-config`).

---

## 4. `d3` may be unused

**Observation:** no `src/` file imports `d3`. It's only referenced via a `<script>` tag in `src/handlebars/metrics_template.hb`, which predates `billboard.js@3`. Modern `billboard.js` (v3+) bundles the `d3-*` submodules it needs, so the external `d3` script tag is likely dead weight.

**Change:** remove the `<script src=".../d3/...">` tag from the template; confirm the chart still renders; drop `d3` from `dependencies`.

**Effort:** small, but requires opening the generated HTML in a browser to verify the charts still render.

---

## 5. `expect` standalone is an orphan split of Jest

**Observation:** the `expect` npm package is a standalone release of Jest's assertion library, maintained only as a byproduct of the Jest monorepo. It's functional but not positioned as a long-term standalone choice. Jest's own guidance is to use their bundled expect in-tree.

**Candidate replacement:** `chai` (stable, widely adopted with mocha) or `node:assert` (zero-dep, strict mode gives the same guarantees with slightly more verbose call sites).

**Effort:** medium — ~30 assertion sites across 14 spec files, mostly `toContain`/`toBe`/`toStrictEqual`. Mechanical.

---

## 6. Dev-only audit findings remaining after the Node 22 upgrade

**Observation:** after Phase 5 `npm audit fix`, two vulnerabilities remain, both in dev-only transitive deps:

- `diff` (via `sinon@19`) — low severity, fixed in `sinon@21`.
- `serialize-javascript` (via `mocha@10`) — high severity, fixed in `mocha@11`.

Neither ships to end users (both are `devDependencies` or test-only transitives), but they surface in `npm audit`. Each fix is a one-major bump and was deliberately deferred out of the upgrade plan's Phase 5 (which excluded breaking changes).

**Change:** `npm install --save-dev sinon@21 mocha@11`, then re-run the test suite to confirm no API breakage.

**Effort:** trivial — one commit per bump.

---

## 7. `axios` call has a vestigial `json: true` option

**Observation:** in `src/lib/utils.js` the `axios({ ... })` call passes `json: true`. Axios has never read that key — it's a leftover from `request`-era HTTP libs. It's harmless, but it misleads future readers.

**Change:** delete the `json: true` line.

**Effort:** one line. Include in any other touch to `utils.js`.
