import { seedPlaces, seedEvents } from "../data/seed.js";
import { generateDates, replacePlanItem, estimateScenarioCount, TEMPLATES, auditPlanGeography } from "../engine.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
const base = {
  date:"2026-08-22", time:"12:00", budget:15000, vibes:["romantic"], zone:"any", food:true,
  useEvents:true, indoorOnly:false, noBars:false, avoidVisited:false, adventure:"balanced",
  likedItemIds:[], visitedItemIds:[], dislikedItemIds:[], recentlyShownItemIds:[]
};

// Scenario grammar audit.
assert(TEMPLATES.length === 60, `Expected exactly 60 scenario templates, got ${TEMPLATES.length}`);
assert(new Set(TEMPLATES.map((t)=>t.slots.join(">"))).size === 60, "Scenario templates contain duplicate sequences");
for (const template of TEMPLATES) {
  const foodSlots = template.slots.filter((slot)=>["cafe","dessert","dinner"].includes(slot));
  assert(foodSlots.length <= 2, `${template.id} is too food-heavy: ${template.slots.join(" > ")}`);
  if (template.slots.includes("dinner") && template.slots.includes("dessert")) {
    assert(template.slots.indexOf("dinner") < template.slots.indexOf("dessert"), `${template.id}: dessert comes before dinner`);
  }
}

for (const duration of [120,180,240,360]) {
  const plans = generateDates({ places:seedPlaces, events:seedEvents, filters:{...base,duration}, count:3, variationSeed:2 });
  assert(plans.length === 3, `Expected 3 plans for ${duration} minutes, got ${plans.length}`);
  assert(plans.every((plan) => plan.totalMinutes <= duration + 5), `Plan exceeds duration ${duration}`);
  const floor = duration >= 330 ? 300 : Math.floor(duration * .80);
  assert(plans.every((plan) => plan.totalMinutes >= floor), `Plan is materially too short for ${duration}`);
  assert(new Set(plans.map((p) => p.archetype?.id)).size === 3, `Expected 3 archetypes for ${duration}`);
  assert(plans.every((plan)=>auditPlanGeography(plan,{...base,duration}).ok), `Geography constraint failed for ${duration}`);
}

const activePlans = generateDates({ places:seedPlaces, events:seedEvents, filters:{...base,duration:240,vibes:["active"]}, count:3, variationSeed:4 });
assert(activePlans.length === 3, "Expected active plans");
assert(activePlans.every((plan) => plan.template.vibes.includes("active") || plan.items.some((item) => item.vibes?.includes("active"))), "Active mood returned a plan with no active signal");

const comboPlans = generateDates({ places:seedPlaces, events:seedEvents, filters:{...base,duration:360,vibes:["romantic","unusual"]}, count:3, variationSeed:5 });
assert(comboPlans.length === 3, "Expected multi-vibe long plans");
assert(comboPlans.every((plan) => ["romantic","unusual"].every((vibe) => plan.template.vibes.includes(vibe) || plan.items.some((item) => item.vibes?.includes(vibe)))), "Multi-vibe coverage failed");

const indoorNoBars = generateDates({ places:seedPlaces, events:seedEvents, filters:{...base,duration:360,indoorOnly:true,noBars:true}, count:3, variationSeed:3 });
assert(indoorNoBars.length === 3, "Expected 3 indoor/no-bar plans");
assert(indoorNoBars.every((plan) => plan.items.every((item) => item.indoor !== false)), "Indoor-only contains outdoor item");
assert(indoorNoBars.every((plan) => plan.items.every((item) => item.category !== "bar")), "No-bars contains a bar");

const basePlans = generateDates({ places:seedPlaces, events:seedEvents, filters:{...base,duration:240}, count:3, variationSeed:6 });
const original = basePlans[0];
let replaceIndex = original.items.findIndex((item) => seedPlaces.filter((p) => p.category === item.category && p.zone === item.zone).length > 1);
if (replaceIndex < 0) replaceIndex = 0;
const replaced = replacePlanItem({ plan:original, itemIndex:replaceIndex, places:seedPlaces, events:seedEvents, filters:{...base,duration:240}, variationSeed:9 });
assert(replaced.totalMinutes <= 245, "Replacement broke duration");
assert(replaced.totalCost <= 15000, "Replacement broke budget");
assert(auditPlanGeography(replaced,{...base,duration:240}).ok, "Replacement broke geographic cohesion");

const anchor = seedPlaces.find((item) => item.category === "art" && item.zone === "center");
const around = generateDates({ places:seedPlaces, events:seedEvents, filters:{...base,duration:240}, count:3, variationSeed:7, anchorItem:anchor });
assert(around.length > 0, "Expected plans around anchor");
assert(around.every((plan) => plan.items.some((item) => item.id === anchor.id)), "Anchor plan lost anchor item");
assert(around.every((plan)=>auditPlanGeography(plan,{...base,duration:240}).ok), "Anchor plan escaped its geographic cluster");

// Regression: on the coordinate-less fallback seed, no generated plan may jump between coarse Moscow zones.
let sampled=0, crossZone=0;
for (const duration of [120,180,240,360]) for (const vibe of ["romantic","fun","unusual","calm","active"]) for (let variationSeed=0; variationSeed<18; variationSeed++) {
  const plans=generateDates({places:seedPlaces,events:seedEvents,filters:{...base,duration,vibes:[vibe]},count:3,variationSeed});
  for (const plan of plans) {
    sampled++;
    const zones=new Set(plan.items.map((item)=>item.zone).filter(Boolean));
    if (zones.size>1) crossZone++;
  }
}
assert(crossZone===0, `Geography regression: ${crossZone}/${sampled} sampled fallback plans cross zones`);

assert(estimateScenarioCount(seedPlaces,seedEvents) > 1000, "Fallback model should expose >1000 theoretical combinations");
console.log("1001 Dates v9 smoke test: OK");
console.log(`Scenario templates: ${TEMPLATES.length}; theoretical fallback combinations: ${estimateScenarioCount(seedPlaces,seedEvents)}`);
console.log(`Geography sample: ${sampled} plans checked; cross-zone: ${crossZone}`);
console.log("6h example:", generateDates({ places:seedPlaces, events:seedEvents, filters:{...base,duration:360}, count:3, variationSeed:8 }).map((p) => `${p.archetype.id}:${p.totalMinutes}m/${p.totalCost}/${[...new Set(p.items.map(i=>i.zone))].join("+")}`).join(" | "));
