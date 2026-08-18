import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { scenarioBlueprints, scenarioStats } from "../data/scenarios.js";

const HERE=dirname(fileURLToPath(import.meta.url));
const OUT=resolve(HERE,"../SCENARIO_CATALOG.md");
const label={120:"2 часа",180:"3 часа",240:"4 часа",360:"6 часов"};
const selector=(slot)=>String(slot?.select||slot||"");
const lines=[
  "# 1001 Dates — полный каталог сценариев v11",
  "",
  `Всего: **${scenarioStats.total} scenario blueprints** из **${scenarioStats.recipes} reviewed base flows**.`,
  "",
  "Каталог генерируется из `data/scenarios.js`. Это технический audit-view: он показывает точный порядок и subtype каждой главы.",
  ""
];
for(const duration of [120,180,240,360]){
  const items=scenarioBlueprints.filter((x)=>x.duration===duration);
  lines.push(`## ${label[duration]} — ${items.length}`,"");
  for(const item of items){
    lines.push(`- **${item.id}** — ${item.concept} · \`${item.family}\` · mood: ${item.vibes.join(", ")} · route: \`${item.routeMode}\` · ${item.slots.map(selector).join(" → ")}`);
  }
  lines.push("");
}
await writeFile(OUT,lines.join("\n"),"utf8");
console.log(`Exported ${scenarioBlueprints.length} scenarios to ${OUT}`);
