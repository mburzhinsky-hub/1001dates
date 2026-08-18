import { seedPlaces, seedEvents } from "../data/seed.js";
import { generateDates, auditPlanConstraints } from "../engine.js";

function assert(condition,message){if(!condition)throw new Error(message);}
const durations=[120,180,240,360],vibes=["romantic","fun","unusual","calm","active"],bool=[false,true],adventures=["safe","balanced","wild"];
let configs=0,plansChecked=0,noResult=0;
for(const duration of durations)for(const vibe of vibes)for(const food of bool)for(const useEvents of bool)for(const indoorOnly of bool)for(const noBars of bool)for(const adventure of adventures){
  configs++;
  const budget=configs%4===0?4000:15000,zone=configs%5===0?"center":"any",time=configs%3===0?"12:00":"19:00";
  const filters={date:"2026-08-22",time,duration,budget,vibes:[vibe],zone,food,useEvents,indoorOnly,noBars,avoidVisited:false,adventure,likedItemIds:[],visitedItemIds:[],dislikedItemIds:[],recentlyShownItemIds:[]};
  const plans=generateDates({places:seedPlaces,events:seedEvents,filters,count:3,variationSeed:configs%17});
  if(!plans.length)noResult++;
  for(const plan of plans){
    plansChecked++;
    const audit=auditPlanConstraints(plan,filters);
    for(const [name,ok] of Object.entries(audit))assert(ok,`${name} leaked: ${JSON.stringify(filters)} :: ${plan.template.id}`);
    if(adventure==="safe")assert(plan.template.adventure<=2,`safe mode leaked level ${plan.template.adventure}`);
    if(adventure==="wild")assert(plan.template.adventure>=2,`wild mode leaked level ${plan.template.adventure}`);
  }
}
console.log(`Filter audit OK: ${configs} configurations; ${plansChecked} plans checked; ${noResult} honest no-result configurations on sparse fallback data.`);
