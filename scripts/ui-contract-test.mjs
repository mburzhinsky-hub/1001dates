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
  "devicePreviewDuration","devicePreviewBudget","filtersOverlay","resultsGrid","moreDates","downloadInvite"
];
for(const id of required)assert(ids.includes(id),`Missing UI contract id #${id}`);

assert(html.includes("./october-reference.css?v=ref2"),"Seasonal reference stylesheet is not wired");
assert(html.includes("./app-final.js?v=oct5"),"Production app asset version is stale");
assert(html.includes("october-phone"),"Reference phone composition is missing");
assert(html.includes("october-stats"),"Premium seasonal stats block is missing");
assert(app.includes('$("#deviceGenerate")?.addEventListener'),"Reference hero CTA is not wired");
assert(app.includes("selectScenarioCover"),"Semantic scenario cover selection is not wired");
assert(app.includes('$("#devicePreviewDate")'),"Reference preview does not sync with selected date");
assert(app.includes("async function shareInvitation()"),"Invitation share handler is missing");
assert(app.includes("await navigator.share(data)"),"Invitation share does not use the native share sheet");
assert(app.includes("scheduleInviteShareFile()"),"Invitation poster is not pre-rendered for file sharing");
assert(app.includes("function downloadBlob("),"Direct invitation PNG download is missing");
assert(app.includes("width:540")&&app.includes("height:675")&&app.includes("scale:2"),"Invitation PNG export is not fixed at 1080x1350");
assert(seasonCss.includes(".october-stats")&&seasonCss.includes(".phone-frame")&&seasonCss.includes(".quick-filters"),"Reference visual layer is incomplete");
assert(!/(^|[^$])\$\("\[data-date-preset\]"\)\.forEach/m.test(app),"querySelector/forEach runtime regression returned");

console.log(`UI contract OK: ${ids.length} unique ids, October reference layer wired.`);
