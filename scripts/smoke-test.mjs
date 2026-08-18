import { seedPlaces, seedEvents } from "../data/seed.js";
import { scenarioStats } from "../data/scenarios.js";
import {
  generateDates,
  replacePlanItem,
  estimateScenarioCount,
  TEMPLATES,
  auditPlanGeography,
  auditPlanConstraints
} from "../engine.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
const base = {
  date:"2026-08-22", time:"18:00", budget:15000, vibes:["romantic"], zone:"any", food:true,
  useEvents:true, indoorOnly:false, noBars:false, avoidVisited:false, adventure:"balanced",
  likedItemIds:[], visitedItemIds:[], dislikedItemIds:[], recentlyShownItemIds:[]
};
const foodCategories = new Set(["cafe","dessert","dinner"]);
const baseCategory = (slot) => String(slot?.select || slot || "").split(":")[0];

assert(TEMPLATES.length === 1001, `Expected exactly 1001 curated scenario blueprints, got ${TEMPLATES.length}`);
assert(scenarioStats.total === 1001, "scenarioStats is out of sync");
assert(scenarioStats.recipes === 154, `Expected 154 reviewed base flows, got ${scenarioStats.recipes}`);
assert(
  scenarioStats.byDuration[120] === 200 &&
  scenarioStats.byDuration[180] === 250 &&
  scenarioStats.byDuration[240] === 275 &&
  scenarioStats.byDuration[360] === 276,
  `Unexpected duration distribution: ${JSON.stringify(scenarioStats.byDuration)}`
);
assert(new Set(TEMPLATES.map((t)=>t.id)).size === TEMPLATES.length, "Duplicate scenario ids");

function assertAudited(plans, filters, label) {
  for (const plan of plans) {
    const audit = auditPlanConstraints(plan, filters);
    for (const [key, ok] of Object.entries(audit)) assert(ok, `${label}: ${key} constraint leaked in ${plan.template.id}`);
  }
}

for (const duration of [120,180,240,360]) {
  const filters={...base,duration};
  const plans = generateDates({ places:seedPlaces, events:seedEvents, filters, count:3, variationSeed:2 });
  assert(plans.length === 3, `Expected 3 plans for ${duration} minutes, got ${plans.length}`);
  assertAudited(plans,filters,`duration/${duration}`);
  assert(new Set(plans.map((p)=>p.template.id)).size === plans.length, `${duration}: repeated exact scenario`);
  assert(new Set(plans.map((p)=>p.template.structureKey)).size === plans.length, `${duration}: repeated broad structure`);
}

for (const vibe of ["romantic","fun","unusual","calm","active"]) {
  for (const duration of [120,180,240,360]) {
    const filters={...base,duration,vibes:[vibe]};
    const plans=generateDates({places:seedPlaces,events:seedEvents,filters,count:3,variationSeed:4});
    assert(plans.length >= 2, `${vibe}/${duration}: expected at least 2 honest plans, got ${plans.length}`);
    assertAudited(plans,filters,`${vibe}/${duration}`);
  }
}

for (const vibes of [["romantic","unusual"],["romantic","active"],["fun","active"],["calm","unusual"]]) {
  const filters={...base,duration:360,vibes};
  const plans=generateDates({places:seedPlaces,events:seedEvents,filters,count:3,variationSeed:5});
  assert(plans.length > 0, `Expected at least one long multi-vibe plan for ${vibes.join("+")}`);
  assertAudited(plans,filters,`multivibe/${vibes.join("+")}`);
}

const indoorNoBarsFilters={...base,duration:360,indoorOnly:true,noBars:true};
const indoorNoBars = generateDates({ places:seedPlaces, events:seedEvents, filters:indoorNoBarsFilters, count:3, variationSeed:3 });
assert(indoorNoBars.length > 0, "Expected indoor/no-bar plans");
assertAudited(indoorNoBars,indoorNoBarsFilters,"indoor-no-bars");

const noFoodFilters={...base,duration:360,food:false,vibes:["unusual"],adventure:"wild"};
const noFood = generateDates({ places:seedPlaces, events:seedEvents, filters:noFoodFilters, count:3, variationSeed:7 });
assert(noFood.length > 0, "Expected six-hour no-food plans");
assert(noFood.every((plan)=>plan.items.every((item)=>!foodCategories.has(item.category) && !item.includesFood)), "No-food plan contains food");
assertAudited(noFood,noFoodFilters,"no-food");

const noEventFilters={...base,duration:240,useEvents:false};
const noEvents = generateDates({ places:seedPlaces, events:seedEvents, filters:noEventFilters, count:3, variationSeed:8 });
assert(noEvents.length === 3, "Expected 3 non-event plans");
assertAudited(noEvents,noEventFilters,"no-events");

const centerFilters={...base,duration:240,zone:"center"};
const centerOnly = generateDates({ places:seedPlaces, events:seedEvents, filters:centerFilters, count:3, variationSeed:9 });
assert(centerOnly.length === 3, "Expected center-only plans");
assertAudited(centerOnly,centerFilters,"center-only");

const lowBudgetFilters={...base,duration:120,budget:4000};
const lowBudget = generateDates({ places:seedPlaces, events:seedEvents, filters:lowBudgetFilters, count:3, variationSeed:11 });
assert(lowBudget.length > 0, "Expected at least one low-budget compact plan");
assertAudited(lowBudget,lowBudgetFilters,"low-budget");

const earlyFilters={...base,duration:180,time:"11:00",vibes:["fun"]};
const earlyFun = generateDates({ places:seedPlaces, events:seedEvents, filters:earlyFilters, count:3, variationSeed:12 });
assert(earlyFun.length > 0, "Expected daytime fun plans");
assert(earlyFun.every((plan)=>!plan.items.some((item)=>item.category === "bar")), "Early daytime date contains a bar");
assertAudited(earlyFun,earlyFilters,"early");

const safeFilters={...base,duration:240,adventure:"safe"};
const safePlans = generateDates({ places:seedPlaces, events:seedEvents, filters:safeFilters, count:3, variationSeed:13 });
assert(safePlans.length > 0 && safePlans.every((plan)=>plan.template.adventure<=2), "Safe adventure leaked level 3");
assertAudited(safePlans,safeFilters,"safe");

const wildFilters={...base,duration:240,adventure:"wild",vibes:["unusual"]};
const wildPlans = generateDates({ places:seedPlaces, events:seedEvents, filters:wildFilters, count:3, variationSeed:14 });
assert(wildPlans.length > 0 && wildPlans.every((plan)=>plan.template.adventure>=2), "Wild adventure admitted safe-only scenario");
assertAudited(wildPlans,wildFilters,"wild");

// Replacement must preserve the original curated structure and every hard constraint.
const replaceFilters={...base,duration:240};
const basePlans = generateDates({ places:seedPlaces, events:seedEvents, filters:replaceFilters, count:3, variationSeed:6 });
const original=basePlans[0];
let replaced=original;
for(let i=0;i<original.items.length;i++){
  const candidate=replacePlanItem({plan:original,itemIndex:i,places:seedPlaces,events:seedEvents,filters:replaceFilters,variationSeed:9+i});
  if(candidate.items.some((item,index)=>item.id!==original.items[index].id)){replaced=candidate;break;}
}
assert(replaced.template.id===original.template.id,"Replacement changed scenario structure");
assertAudited([replaced],replaceFilters,"replace");

// Anchoring around a real place must keep the anchor and route cohesion.
const anchor=seedPlaces.find((item)=>item.category==="art"&&item.zone==="center") || seedPlaces.find((item)=>item.zone==="center");
const anchorFilters={...base,duration:240};
const around=generateDates({places:seedPlaces,events:seedEvents,filters:anchorFilters,count:3,variationSeed:7,anchorItem:anchor});
assert(around.length>0,"Expected plans around anchor");
assert(around.every((plan)=>plan.items.some((item)=>item.id===anchor.id)),"Anchor plan lost anchor item");
assertAudited(around,anchorFilters,"anchor");

// Regression on coordinate-less fallback: no selected plan may jump coarse Moscow zones.
let sampled=0,crossZone=0;
for(const duration of [120,180,240,360]) for(const vibe of ["romantic","fun","unusual","calm","active"]) for(let variationSeed=0;variationSeed<12;variationSeed++){
  const filters={...base,duration,vibes:[vibe]};
  const plans=generateDates({places:seedPlaces,events:seedEvents,filters,count:3,variationSeed});
  for(const plan of plans){
    sampled++;
    if(!auditPlanGeography(plan,filters).ok) throw new Error(`Invalid route leaked: ${plan.template.id}`);
    const zones=new Set(plan.items.map((item)=>item.zone).filter(Boolean));
    if(zones.size>1)crossZone++;
  }
}
assert(crossZone===0,`Fallback route regression: ${crossZone}/${sampled} plans cross coarse zones`);

// User history/dislike hard exclusions.
const excluded=seedPlaces.find((item)=>item.category==="dinner") || seedPlaces[0];
const visitedFilters={...base,duration:240,avoidVisited:true,visitedItemIds:[excluded.id]};
const withoutVisited=generateDates({places:seedPlaces,events:seedEvents,filters:visitedFilters,count:3,variationSeed:15});
assert(withoutVisited.every((plan)=>plan.items.every((item)=>item.id!==excluded.id)),"avoidVisited leaked a visited place");
const dislikedFilters={...base,duration:240,dislikedItemIds:[excluded.id]};
const withoutDisliked=generateDates({places:seedPlaces,events:seedEvents,filters:dislikedFilters,count:3,variationSeed:16});
assert(withoutDisliked.every((plan)=>plan.items.every((item)=>item.id!==excluded.id)),"disliked leaked a disliked place");


// Date-specific event times must stay attached to their actual date. Anchoring a
// one-day event on another date must never force it into a plan.
const datedEvent={id:"test-occurrence",title:"Тестовая лекция",category:"event",eventType:"lecture",subtype:"lecture",zone:"center",address:"Москва",costForTwo:1000,duration:80,indoor:true,vibes:["fun","unusual","calm"],quality:10,occurrences:{"2026-08-22":["18:15"],"2026-08-23":["21:00"]}};
const datedFilters={...base,date:"2026-08-22",time:"18:00",duration:120,vibes:["unusual"],zone:"center",food:true};
const onDate=generateDates({places:seedPlaces,events:[datedEvent],filters:datedFilters,count:3,variationSeed:17,anchorItem:datedEvent});
assert(onDate.length>0,"Date-specific event should be usable on its occurrence date");
assert(onDate.every((plan)=>plan.items.some((item)=>item.id===datedEvent.id)),"Date-specific anchor was lost");
assert(onDate.some((plan)=>plan.timeline.some((node)=>node.item.id===datedEvent.id&&node.fixedStart)),"Fixed event time was not preserved in timeline");
const offDate=generateDates({places:seedPlaces,events:[datedEvent],filters:{...datedFilters,date:"2026-08-24"},count:3,variationSeed:17,anchorItem:datedEvent});
assert(offDate.length===0,"Date-specific event leaked onto a date with no occurrence");

// Coordinate route regression: compact route passes; long jump and backtracking fail.
const point=(id,lat,lon)=>({id,title:id,zone:"center",coords:{lat,lon}});
const routeTemplate={routeMode:"district"};
const compactPlan={items:[point("a",55.750,37.600),point("b",55.751,37.610),point("c",55.752,37.620),point("d",55.753,37.630)],template:routeTemplate};
assert(auditPlanGeography(compactPlan,{...base,duration:360}).ok,"Compact coordinate route was rejected");
const farPlan={items:[point("a",55.750,37.600),point("far",55.750,37.760)],template:routeTemplate};
assert(!auditPlanGeography(farPlan,{...base,duration:360}).ok,"Cross-city coordinate route was accepted");
const zigzagPlan={items:[point("a",55.750,37.600),point("b",55.750,37.650),point("c",55.750,37.605),point("d",55.750,37.655)],template:routeTemplate};
assert(!auditPlanGeography(zigzagPlan,{...base,duration:360}).ok,"Backtracking zig-zag route was accepted");

assert(estimateScenarioCount(seedPlaces,seedEvents)>40000,"Fallback catalogue should expose >40k concrete combinations");
console.log("1001 Dates v11 smoke test: OK");
console.log(`Scenario blueprints: ${TEMPLATES.length}; reviewed base flows: ${scenarioStats.recipes}`);
console.log(`Distribution: ${JSON.stringify(scenarioStats.byDuration)}`);
console.log(`Theoretical fallback combinations: ${estimateScenarioCount(seedPlaces,seedEvents)}`);
console.log(`Route sample: ${sampled} chosen plans; cross-zone: ${crossZone}`);
