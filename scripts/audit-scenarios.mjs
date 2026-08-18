import { seedPlaces, seedEvents } from "../data/seed.js";
import { TEMPLATES, estimateScenarioCount, generateDates, auditPlanGeography } from "../engine.js";

const names={cafe:"кофе",art:"искусство",dessert:"десерт",view:"вид",activity:"активность",walk:"прогулка",event:"событие",dinner:"ужин",bar:"бар"};
const byLength={};
for(const template of TEMPLATES) byLength[template.slots.length]=(byLength[template.slots.length]||0)+1;
console.log(`Scenario templates: ${TEMPLATES.length}`);
console.log(`By chapters: ${Object.entries(byLength).map(([k,v])=>`${k}=${v}`).join(", ")}`);
console.log(`Theoretical fallback combinations: ${estimateScenarioCount(seedPlaces,seedEvents)}`);
console.log("");
for(const template of TEMPLATES) console.log(`${template.id}: ${template.slots.map((slot)=>names[slot]||slot).join(" -> ")}`);

const base={date:"2026-08-22",time:"12:00",budget:15000,zone:"any",food:true,useEvents:true,indoorOnly:false,noBars:false,avoidVisited:false,adventure:"balanced",likedItemIds:[],visitedItemIds:[],dislikedItemIds:[],recentlyShownItemIds:[]};
let sampled=0,badGeo=0;
for(const duration of [120,180,240,360]) for(const vibe of ["romantic","fun","unusual","calm","active"]) for(let variationSeed=0;variationSeed<40;variationSeed++) {
  const plans=generateDates({places:seedPlaces,events:seedEvents,filters:{...base,duration,vibes:[vibe]},count:3,variationSeed});
  for(const plan of plans){sampled++;if(!auditPlanGeography(plan,{...base,duration}).ok)badGeo++;}
}
console.log(`\nGeography regression sample: ${sampled}; invalid: ${badGeo}`);
