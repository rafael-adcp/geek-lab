# Follow-up — deps to revisit after the Node 22 upgrade

This is a punch list of dependencies that are either in maintenance mode, misclassified, or over-sized for what the codebase actually needs. None of these block the current Node 10 → Node 22 effort — they are deferred so that each can land as its own small, focused change.

Listed roughly in order of effort-vs-payoff.

---

## 1. Residual `npm audit` findings — upstream-blocked in `mocha`

**Observation:** even after bumping `mocha` to the current major (`11.7.5`), `npm audit` still reports two transitive findings:

- `serialize-javascript <= 7.0.4` (high severity, GHSA-5c6j-r48x-rmvq + GHSA-qj8w-gfj5-8c6v) — pulled in by `mocha`, which still pins `^6.0.2`. A patched `serialize-javascript@7.0.5` exists but mocha has not bumped to it.
- `diff 6.0.0 - 8.0.2` (low severity, GHSA-73rr-hh4g-fpgx) — pulled in by `mocha`, which pins `^7.0.0`. A patched `diff@8.0.3+` exists but mocha has not bumped to it.

Both are dev-only (mocha is a `devDependency`); nothing in this advisory chain ships to end users of the CLI.

**Options:**
- **Wait for upstream:** track the next mocha minor/major and re-run `npm audit` when it lands.
- **Force via `overrides`:** add an `overrides` block to `package.json` pinning `serialize-javascript@^7.0.5` and `diff@^8.0.3`. Risk: mocha relies on the older API surface; needs a full test run to confirm.

**Effort:** trivial if waiting; small if going the overrides route (requires verifying mocha still works against the forced versions).
