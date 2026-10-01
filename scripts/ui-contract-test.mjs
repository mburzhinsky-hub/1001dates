import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";

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
  "devicePreviewDuration","devicePreviewBudget","filtersOverlay","resultsGrid","moreDates","downloadInvite","sharedInviteOverlay","sharedInvitePoster","sharedInviteSave","inviteSaveOverlay","inviteSaveImage","prepareDate","prepareDateStatus","preparationOverlay","preparationProgressBar","preparationList","nearbyGenerate","nearbyPanel","nearbyStatus","nearbyReset","nearbyChooseZone"
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
assert(app.includes("async function prepareInviteLink(")&&app.includes("function inviteLinkNow("),"Shareable invitation link is missing");
assert(app.includes("drawPostcard(")&&app.includes("async function invitePngBlob("),"Native postcard PNG renderer is missing");
assert(app.includes("canvas.width=POSTCARD.width")&&app.includes("canvas.height=POSTCARD.height")&&/POSTCARD = \{ width: 1080, height: 1350/.test(readFileSync(new URL("../invite.js",import.meta.url),"utf8")),"Invitation PNG export is not fixed at 1080x1350");
assert(!app.includes("html2canvas"),"Invitation export still depends on html2canvas");
assert(app.includes("showSharedInviteFromHash()"),"Shared invitation deep-link renderer is missing");
assert(app.includes("buildPreparationTasks"),"Preparation task builder is not wired");
assert(app.includes("PREPARATION_KEY"),"Preparation storage key is not wired");
assert(app.includes("function renderPreparation()"),"Preparation renderer is missing");
assert(app.includes("function openPreparation()"),"Preparation CTA is not wired");
assert(app.includes("downloadCalendarInvite"),"Preparation calendar action is missing");
assert(app.includes("generateNearbyDates"),"Nearby planner is not wired");
assert(app.includes("navigator.geolocation.getCurrentPosition"),"Nearby mode does not request geolocation on demand");
assert(!app.includes("navigator.geolocation.watchPosition"),"Nearby mode must not track location continuously");
assert(app.includes("scenarioMapSectionHTML")&&app.includes("mountScenarioMap"),"Scenario map UI is not wired");
assert(app.includes("destroyScenarioMap"),"Scenario map cleanup is missing");
assert(app.includes("$(`[data-prep-toggle]`")||app.includes("$(\'[data-prep-toggle]\'"),"Preparation toggle binding must use querySelectorAll");
assert(app.includes("$(`[data-prep-action]`")||app.includes("$(\'[data-prep-action]\'"),"Preparation action binding must use querySelectorAll");
assert(!/(^|[^$])\$\([\'\"]\[data-prep-(?:toggle|action)\][\'\"]/m.test(app),"Preparation controls regress to querySelector/forEach");
assert(app.includes("$([\'data-dislike-item\']")||app.includes("$(\'[data-dislike-item]\'"),"Dislike controls must use querySelectorAll");
assert(app.includes("$(\"[data-chapter-index]\""),"Chapter map controls must use querySelectorAll");
assert(app.includes("$(\"[data-map-stop]\""),"Map stops must use querySelectorAll");
assert(!/(^|[^$])\$\([\'\"]\[data-(?:dislike-item|chapter-index|map-stop)\][\'\"][^;\n]*\.forEach/m.test(app),"Detail/map controls regress to querySelector before forEach");
assert(seasonCss.includes(".october-stats")&&seasonCss.includes(".phone-frame")&&seasonCss.includes(".quick-filters"),"Reference visual layer is incomplete");
assert(!/(^|[^$])\$\("\[data-date-preset\]"\)\.forEach/m.test(app),"querySelector/forEach runtime regression returned");

console.log(`UI contract OK: ${ids.length} unique ids, October reference layer wired.`);
