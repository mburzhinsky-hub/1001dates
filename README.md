# 1001 Dates

Production web app for generating curated date scenarios in Moscow.

## Runtime

The published app is wired as:

`index.html → app-final.js → engine-v14.js → engine.js → data/scenarios.js + data/seed.js + data/kudago.generated.js`

The catalogue contains exactly 1001 curated scenario blueprints. Concrete dates are assembled from the monthly Moscow venue/event snapshot and then filtered by time, budget, mood, geography, opening hours and user preferences.

## Monthly KudaGo snapshot

`data/kudago.generated.js` now represents one complete calendar month. The snapshot metadata contains:

- `targetMonth` — `YYYY-MM`
- `windowStart` — first day of the month
- `windowEnd` — last day of the month
- source counts and normalized counts

To build an explicit month:

```bash
KUDAGO_MONTH=2026-10 node scripts/update-kudago.mjs
```

To refresh the current Moscow month:

```bash
KUDAGO_MONTH_OFFSET=0 node scripts/update-kudago.mjs
```

The scheduled workflow `.github/workflows/monthly-kudago.yml` runs on the 1st of every month at 02:17 UTC (05:17 Moscow) and refreshes that calendar month. It validates and tests the snapshot before committing it to `main`. A manual workflow run may specify any `YYYY-MM`.

## Validation and tests

Run from the repository root:

```bash
node scripts/validate-data.mjs --strict
node scripts/audit-scenarios.mjs
node scripts/smoke-test.mjs
node scripts/audit-filters.mjs
node scripts/production-integration-test.mjs
```

`production-integration-test.mjs` verifies the actual production asset chain, the complete target-month window, daily event coverage, three valid default plans for every day in the month, real elapsed duration, and repeated-result mechanics.

## Duration semantics

The duration shown to the user is the real elapsed date duration: activities + routing buffers + waiting time. The same duration is used for calendar exports. Hidden transfer/wait time can no longer make a selected 3-hour date silently last longer than three hours (within the existing 5-minute tolerance).

## Service worker

The monthly KudaGo snapshot is network-first with cached offline fallback. Versioned application assets remain cache-first and respect their query-string versions. Updating `data/kudago.generated.js` therefore no longer requires a service-worker cache-version bump.

## Local preview

```bash
python -m http.server 8080
```

Open `http://localhost:8080`.

## GitHub Pages

Use:

- Source: Deploy from a branch
- Branch: `main`
- Folder: `/ (root)`

The standard GitHub Pages deployment can coexist with the two repository workflows: Production CI and Monthly KudaGo Snapshot.
