import { readFile } from "node:fs/promises";

function assert(condition,message){if(!condition)throw new Error(message);}

const [html,app,seasonCss]=await Promise.all([
  readFile(new URL("../index.html",import.meta.url),"utf8"),
  readFile(new URL("../app-final.js",import.meta.url),"utf8"),
  readFile(new URL("../october-reference.css",import.meta.url),"utf8")
]);

const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
const duplicates=[...new Set(ids.filter((id,index)=>ids.indexOf(id)!==index))];
assert(!duplicates.length,`Duplicate ids in index.html: ${duplicates.join(", ")}`);

const required=[
  "quickGenerate","surprise","quickDate","quickTime","quickBudget","quickDuration","quickVibe",
  "seasonPlaces","seasonEvents","seasonDays","deviceGenerate","devicePreviewDate","devicePreviewVibe",
  "devicePreviewDuration","devicePreviewBudget","filtersOverlay","resultsGrid","moreDates"
];
for(const id of required)assert(ids.includes(id),`Missing UI contract id #${id}`);

assert(html.includes("./october-reference.css?v=ref1"),"Seasonal reference stylesheet is not wired");
assert(html.includes("./app-final.js?v=oct3"),"Production app asset version is stale");
assert(html.includes("hero-device-wrap"),"Reference phone composition is missing");
assert(html.includes("season-ledger"),"Premium seasonal stats block is missing");
assert(app.includes('$("#deviceGenerate")?.addEventListener'),"Reference hero CTA is not wired");
assert(app.includes('$("#devicePreviewDate")'),"Reference preview does not sync with selected date");
assert(!/(^|[^$])\$\("\[data-date-preset\]"\)\.forEach/m.test(app),"querySelector/forEach runtime regression returned");
assert(seasonCss.includes(".season-ledger")&&seasonCss.includes(".device-shell")&&seasonCss.includes(".hero-control-dock"),"Reference visual layer is incomplete");

console.log(`UI contract OK: ${ids.length} unique ids, October reference layer wired.`);
