import { seedPlaces, seedEvents } from "../data/seed.js";
import { kudagoPlaces, kudagoEvents } from "../data/kudago.generated.js";
import { generateNearbyDates, auditPlanConstraints } from "../engine-v14.js?v=duration5";
import { distanceKm, nearbyProximityScore } from "../engine.js?base=duration5";

function assert(condition,message){if(!condition)throw new Error(message);}

const places=[...seedPlaces,...kudagoPlaces],events=[...seedEvents,...kudagoEvents];
const origin={lat:55.7558,lon:37.6173};
const filters={
  date:"2026-10-03",time:"19:00",duration:180,budget:7000,vibes:["romantic"],zone:"any",food:true,useEvents:true,
  indoorOnly:false,noBars:true,avoidVisited:false,adventure:"balanced",likedItemIds:[],visitedItemIds:[],dislikedItemIds:[],recentlyShownItemIds:[]
};

const result=generateNearbyDates({places,events,filters,count:3,variationSeed:0,origin,radii:[0.5,2,4,6]});
assert(result.plans.length>0,"Nearby planner returned no plans for central Moscow fixture");
assert([0.5,2,4,6].includes(result.radiusKm),"Nearby planner did not report the selected progressive radius");

for(const plan of result.plans){
  const audit=auditPlanConstraints(plan,{...filters,zone:"any",nearbyOrigin:origin,nearbyRadiusKm:result.radiusKm});
  assert(audit.budget,"Nearby mode leaked over budget");
  assert(audit.bars,"Nearby mode leaked a bar under noBars");
  assert(audit.eventTimes,"Nearby mode leaked an invalid fixed-time event");
  assert(audit.nearby,"Nearby mode returned a point outside the active radius");
  assert(plan.nearby&&plan.nearby.startDistanceKm<=result.radiusKm+1e-9,"Nearby summary start distance exceeds radius");
}

const nearItems=[{coords:{lat:55.756,lon:37.618}},{coords:{lat:55.758,lon:37.620}}];
const farItems=[{coords:{lat:55.80,lon:37.70}},{coords:{lat:55.81,lon:37.71}}];
assert(nearbyProximityScore(nearItems,{nearbyOrigin:origin})>nearbyProximityScore(farItems,{nearbyOrigin:origin}),"Proximity scoring does not prefer an equivalent local route");
assert(distanceKm({coords:{lat:origin.lat,lon:origin.lon}},nearItems[0])<distanceKm({coords:{lat:origin.lat,lon:origin.lon}},farItems[0]),"Distance helper is inconsistent");

const secondOrigin={lat:55.748,lon:37.535};
assert(nearbyProximityScore(nearItems,{nearbyOrigin:origin})!==nearbyProximityScore(nearItems,{nearbyOrigin:secondOrigin}),"Changing origin does not affect geographic ranking signal");

console.log(`Nearby planner OK: ${result.plans.length} plans within ${result.radiusKm} km`);
