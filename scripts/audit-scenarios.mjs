import { seedPlaces, seedEvents } from "../data/seed.js";
import { scenarioStats } from "../data/scenarios.js";
import { TEMPLATES, estimateScenarioCount, generateDates, auditPlanGeography } from "../engine.js";

function assert(condition,message){if(!condition)throw new Error(message);}
const baseCategory=(value)=>String(value?.select||value||"").split(":")[0];
const selector=(value)=>String(value?.select||value||"");
const foodCats=new Set(["cafe","dessert","dinner"]);
const eventNominal={exhibition:80,lecture:90,excursion:100,concert:110,theater:130,standup:100,movie:120,show:105,festival:105,party:120,event:105};
const floor=(duration)=>Math.floor((duration*(duration>=330?.875:duration>=220?.80:duration>=170?.82:.80))/5)*5;
const nominal=(slot)=>{if(!slot.useItemDuration)return Number(slot.minutes||60);const subtype=(selector(slot).split(":")[1]||"event").split("|")[0];return eventNominal[subtype]||105;};

assert(TEMPLATES.length===1001,`Expected 1001 scenario blueprints, got ${TEMPLATES.length}`);
assert(scenarioStats.total===1001,"scenarioStats out of sync");
assert(scenarioStats.byDuration[120]===200&&scenarioStats.byDuration[180]===250&&scenarioStats.byDuration[240]===275&&scenarioStats.byDuration[360]===276,`Unexpected distribution ${JSON.stringify(scenarioStats.byDuration)}`);
assert(new Set(TEMPLATES.map((x)=>x.id)).size===1001,"Duplicate scenario ids");
const selectorFlows=new Set();
let semanticIssues=0;
for(const t of TEMPLATES){
  const cats=t.slots.map(baseCategory),sum=t.slots.reduce((a,b)=>a+nominal(b),0),key=`${t.duration}|${t.slots.map(selector).join(">")}`;
  assert(!selectorFlows.has(key),`${t.id}: duplicate selector flow`);selectorFlows.add(key);
  assert(sum>=floor(t.duration)&&sum<=t.duration+5,`${t.id}: nominal duration ${sum} outside ${floor(t.duration)}..${t.duration+5}`);
  assert(cats.filter((x)=>foodCats.has(x)).length<=2,`${t.id}: too many food chapters`);
  assert(cats.filter((x)=>x==="event").length<=1,`${t.id}: more than one fixed event`);
  if(cats.includes("bar"))assert(cats.at(-1)==="bar",`${t.id}: bar is not final`);
  if(cats.includes("dinner")&&cats.includes("dessert"))assert(cats.indexOf("dinner")<cats.indexOf("dessert"),`${t.id}: dessert before meal`);
  const dinnerIndex=cats.indexOf("dinner");
  const dinnerSelector=dinnerIndex>=0?selector(t.slots[dinnerIndex]):"";
  const daytimeMeal=/dinner:(breakfast|brunch|breakfast\|brunch)/.test(dinnerSelector);
  if(dinnerIndex>=0&&cats.includes("cafe")&&!daytimeMeal)assert(cats.indexOf("cafe")<dinnerIndex,`${t.id}: cafe after regular meal`);
  if(dinnerIndex>=0&&cats.includes("activity")&&!daytimeMeal)assert(cats.indexOf("activity")<dinnerIndex,`${t.id}: activity after regular meal`);
  for(let i=1;i<cats.length;i++)if(cats[i]===cats[i-1]&&cats[i]!=="art")semanticIssues++;
  if(t.duration===120)assert(t.slots.length<=2,`${t.id}: too many chapters for 2h`);
  if(t.duration===180)assert(t.slots.length<=3,`${t.id}: too many chapters for 3h`);
  if(t.duration===240)assert(t.slots.length>=3&&t.slots.length<=4,`${t.id}: wrong chapter count for 4h`);
  if(t.duration===360)assert(t.slots.length>=4&&t.slots.length<=5,`${t.id}: wrong chapter count for 6h`);
  assert(["micro","compact","district","extended"].includes(t.routeMode),`${t.id}: unknown route mode`);
}
assert(semanticIssues===0,`Adjacent duplicate category issues: ${semanticIssues}`);

const familyCounts=Object.entries(scenarioStats.byFamily).sort((a,b)=>b[1]-a[1]);
console.log(`Scenario catalogue: ${TEMPLATES.length} blueprints from ${scenarioStats.recipes} reviewed base flows.`);
console.log(`By duration: ${JSON.stringify(scenarioStats.byDuration)}`);
console.log(`Families: ${familyCounts.map(([k,v])=>`${k}=${v}`).join(", ")}`);
console.log(`Theoretical fallback combinations: ${estimateScenarioCount(seedPlaces,seedEvents)}`);

const base={date:"2026-08-22",time:"18:00",budget:15000,zone:"any",food:true,useEvents:true,indoorOnly:false,noBars:false,avoidVisited:false,adventure:"balanced",likedItemIds:[],visitedItemIds:[],dislikedItemIds:[],recentlyShownItemIds:[]};
let sampled=0,badGeo=0,repeatedStructureSets=0,repeatedFamilySets=0;
for(const duration of [120,180,240,360])for(const vibe of ["romantic","fun","unusual","calm","active"])for(let variationSeed=0;variationSeed<20;variationSeed++){
  const plans=generateDates({places:seedPlaces,events:seedEvents,filters:{...base,duration,vibes:[vibe]},count:3,variationSeed});
  const structures=plans.map((x)=>x.template.structureKey),families=plans.map((x)=>x.template.family);
  if(new Set(structures).size<plans.length)repeatedStructureSets++;
  if(new Set(families).size<plans.length)repeatedFamilySets++;
  for(const plan of plans){sampled++;if(!auditPlanGeography(plan,{...base,duration}).ok)badGeo++;}
}
assert(badGeo===0,`Route regression: ${badGeo}/${sampled} invalid selected plans`);
console.log(`Route regression: ${sampled} selected plans; invalid geography=${badGeo}; sets with repeated broad structure=${repeatedStructureSets}; sets with repeated family=${repeatedFamilySets}.`);
