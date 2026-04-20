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

**Observation:** eslint 8 reached EOL in October 2024. We intentionally stayed on 8 during the Node upgrade to avoid the flat-config migration that v9 forces.

**Change:** migrate `.eslintrc` → `eslint.config.js` (flat config), upgrade to `eslint@9`.

**Effort:** medium — mechanical but touches the entire rules block. There are automated migrators (`@eslint/migrate-config`).

---

## 4. `d3` may be unused

**Observation:** no `src/` file imports `d3`. It's only referenced via a `<script>` tag in `src/handlebars/metrics_template.hb`, which predates `billboard.js@3`. Modern `billboard.js` (v3+) bundles the `d3-*` submodules it needs, so the external `d3` script tag is likely dead weight.

**Change:** remove the `<script src=".../d3/...">` tag from the template; confirm the chart still renders; drop `d3` from `dependencies`.

**Effort:** small, but requires opening the generated HTML in a browser to verify the charts still render.

---

## 5. `bootstrap` is oversized for our use

**Observation:** the entire bootstrap CSS is loaded into the metrics HTML template purely for four grid classes: `container-fluid`, `row`, `col-md-6`, `col-md-4`. That's ~230 KB of CSS for a handful of flex-layout rules we could write in 10 lines.

**Candidate replacement:** inline the minimal grid CSS directly in `metrics_template.hb` or in a small sibling `.css` file, drop bootstrap entirely.

**Effort:** small, improves page load, removes a transitive `jquery`/`popper.js` chain.

---

## 6. `lodash` — many call sites redundant with modern JS

**Observation:** usages include `_.isEmpty`, `_.union`, `_.startsWith`, `_.find`, `_.toString`, `_.get`. All are either trivial in modern JS or one-liners (`[...new Set([...a, ...b])]` for union, `str.startsWith(...)`, `arr.find(...)`, optional chaining for get).

**Change:** replace call-by-call; delete lodash when no more references. Could be done incrementally across commits.

**Effort:** medium — ~dozen call sites.

---

## 7. `handlebars` is heavy for one template

**Observation:** Handlebars is a full mustache-style template engine pulled in to render one HTML file (`metrics_template.hb`) at CLI time. The template uses basic `{{#each}}`, `{{#if}}`, and variable interpolation — all of which are trivial in tagged template literals.

**Change:** replace with a ~30-line template-literal renderer, drop handlebars.

**Effort:** medium — template has ~10 interpolation points. Worth it only if we also clean up items 4 and 5 above (the three together would leave the metrics HTML generation completely dep-free).

---

## 8. `expect` standalone is an orphan split of Jest

**Observation:** the `expect` npm package is a standalone release of Jest's assertion library, maintained only as a byproduct of the Jest monorepo. It's functional but not positioned as a long-term standalone choice. Jest's own guidance is to use their bundled expect in-tree.

**Candidate replacement:** `chai` (stable, widely adopted with mocha) or `node:assert` (zero-dep, strict mode gives the same guarantees with slightly more verbose call sites).

**Effort:** medium — ~30 assertion sites across 14 spec files, mostly `toContain`/`toBe`/`toStrictEqual`. Mechanical.

---

## 9. `axios` call has a vestigial `json: true` option

**Observation:** in `src/lib/utils.js` the `axios({ ... })` call passes `json: true`. Axios has never read that key — it's a leftover from `request`-era HTTP libs. It's harmless, but it misleads future readers.

**Change:** delete the `json: true` line.

**Effort:** one line. Include in any other touch to `utils.js`.
