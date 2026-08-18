# 1001 Dates v9

Mobile-first date planner for Moscow. The planner treats time and budget as hard constraints and now also enforces a hidden geographic cluster: travel is not shown and is not added to the date duration, but distant points cannot be combined into one date.

## Local check

Run a static server from the project root:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

Planner/data checks:

```bash
node scripts/validate-data.mjs
node scripts/smoke-test.mjs
node scripts/audit-scenarios.mjs
```

Refresh KudaGo data manually if needed:

```bash
node scripts/update-kudago.mjs
```

## GitHub Desktop / GitHub Pages

This version deliberately does **not** let GitHub Actions commit generated city data back to `main`. The previous refresh workflow could create a bot commit immediately after your push, which made GitHub Desktop show `Pull origin` and could cause a conflict if the same generated file was changed locally.

The new workflow builds the fresh KudaGo snapshot inside GitHub Actions and deploys that build directly to Pages. Your repository branch remains untouched by the bot.

One-time GitHub setting:

1. Repository -> `Settings` -> `Pages`.
2. Under `Build and deployment`, set `Source` to **GitHub Actions**.
3. In GitHub Desktop, work normally: `Commit to main` -> `Push origin`.
4. The workflow `Deploy 1001 Dates` will refresh data, run validation/smoke tests, and deploy Pages.

If live KudaGo refresh is temporarily unavailable, the workflow deploys the curated fallback instead of writing anything back to your branch.

## Scenario model

There are exactly **60 scenario templates**. On the bundled fallback data they represent **16,143 raw theoretical combinations** before date, budget, mood, availability and geographic feasibility are applied. The live imported base produces far more combinations.
