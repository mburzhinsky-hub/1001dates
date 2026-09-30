import { readFile } from "node:fs/promises";
import { seedPlaces, seedEvents } from "../data/seed.js";
import { kudagoPlaces, kudagoEvents, kudagoMeta } from "../data/kudago.generated.js";
import { scenarioStats } from "../data/scenarios.js";
import { generateDates, auditPlanConstraints } from "../engine-v14.js?v=duration4";

function assert(condition,message){if(!condition)throw new Error(message);}
function daysInMonth(month){
  const [year,m]=month.split("-").map(Number);
  return new Date(Date.UTC(year,m,0)).getUTCDate();
}
function eventAvailableOn(item,date){
  if(item.exactDates?.includes(date)||item.occurrences?.[date])return true;
  return Boolean(item.activeFrom||item.activeUntil) && (!item.activeFrom||date>=item.activeFrom) && (!item.activeUntil||date<=item.activeUntil);
}
function dateAt(month,day){return `${month}-${String(day).padStart(2,"0")}`;}

const [indexHtml,appJs,engineV14,serviceWorker]=await Promise.all([
  readFile(new URL("../index.html",import.meta.url),"utf8"),
  readFile(new URL("../app-final.js",import.meta.url),"utf8"),
  readFile(new URL("../engine-v14.js",import.meta.url),"utf8"),
  readFile(new URL("../sw.js",import.meta.url),"utf8")
]);

assert(indexHtml.includes("./app-final.js?v=oct2"),"index.html is not wired to the hotfixed October production app asset");
assert(appJs.includes("./data/kudago.generated.js"),"app-final.js does not import the production snapshot");
assert(appJs.includes("kudagoMeta"),"app-final.js does not bind UI dates to monthly snapshot metadata");
assert(appJs.includes("clampDataDate"),"app-final.js does not clamp selectable dates to snapshot coverage");
assert(indexHtml.includes("season-stats"),"October seasonal visual block is missing");
assert(!appJs.includes('$("[data-date-preset]").forEach'),"UI runtime regression: querySelector result is used as a NodeList");
assert(appJs.includes("OCTOBER_HERO_IMAGE"),"October hero is not pinned to a seasonal production image");
assert(indexHtml.includes("https://media.kudago.com/images/place/a6/54/a6549e6c298c995a05a5ccab6af0f8a8.jpg"),"October hero image is not wired in index.html");
assert(appJs.includes("./engine-v14.js?v=duration4"),"app-final.js does not import the production engine wrapper");
assert(engineV14.includes("./engine.js?base=duration4"),"engine-v14.js is not wired to the duration-aware base engine");
assert(serviceWorker.includes('SNAPSHOT_PATH="/data/kudago.generated.js"'),"service worker does not special-case the monthly snapshot");
assert(serviceWorker.includes("networkFirst(event.request)"),"monthly snapshot is not network-first");
assert(scenarioStats.total===1001,`Expected 1001 blueprints, got ${scenarioStats.total}`);

const month=kudagoMeta.targetMonth;
const days=daysInMonth(month);
assert(kudagoMeta.windowStart===dateAt(month,1),"Snapshot starts outside target month");
assert(kudagoMeta.windowEnd===dateAt(month,days),"Snapshot does not cover the complete target month");
assert(kudagoPlaces.length>=100,`Snapshot has too few places: ${kudagoPlaces.length}`);
assert(kudagoEvents.length>=30,`Snapshot has too few events: ${kudagoEvents.length}`);

const places=[...seedPlaces,...kudagoPlaces];
const events=[...seedEvents,...kudagoEvents];
const base={
  time:"19:00",duration:180,budget:7000,vibes:["romantic"],zone:"any",food:true,useEvents:true,
  indoorOnly:false,noBars:false,avoidVisited:false,adventure:"balanced",
  likedItemIds:[],visitedItemIds:[],dislikedItemIds:[],recentlyShownItemIds:[]
};

let generated=0;
for(let day=1;day<=days;day++){
  const date=dateAt(month,day);
  assert(kudagoEvents.some(event=>eventAvailableOn(event,date)),`No live event coverage on ${date}`);
  const filters={...base,date};
  const plans=generateDates({places,events,filters,count:3,variationSeed:day});
  assert(plans.length===3,`${date}: expected 3 production plans, got ${plans.length}`);
  for(const plan of plans){
    generated++;
    const audit=auditPlanConstraints(plan,filters);
    for(const [name,ok] of Object.entries(audit))assert(ok,`${date}: ${name} leaked in ${plan.template.id}`);
    assert(plan.totalMinutes===plan.elapsedMinutes,`${date}: displayed duration excludes route/wait time in ${plan.template.id}`);
    assert(plan.totalMinutes<=filters.duration+5,`${date}: real elapsed duration exceeds selected duration`);
  }
}

let recent=[];
const pageDate=dateAt(month,Math.min(15,days));
for(let variationSeed=0;variationSeed<10;variationSeed++){
  const filters={...base,date:pageDate,recentlyShownItemIds:recent};
  const plans=generateDates({places,events,filters,count:3,variationSeed});
  assert(plans.length===3,`Pagination run ${variationSeed+1}: expected 3 plans`);
  const ids=[...new Set(plans.flatMap(plan=>plan.items.map(item=>item.id)))];
  assert(ids.every(id=>!recent.includes(id)),`Pagination run ${variationSeed+1}: recently shown venue repeated`);
  recent=[...new Set([...ids,...recent])].slice(0,90);
}

console.log(`Production integration OK: ${month}, ${days} days, ${generated} plans audited, ${kudagoPlaces.length} places, ${kudagoEvents.length} events.`);
