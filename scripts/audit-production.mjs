import { seedPlaces, seedEvents } from "../data/seed.js";
import { kudagoPlaces, kudagoEvents } from "../data/kudago.generated.js";
import { generateDates, auditPlanConstraints, auditPlanGeography } from "../engine-v14.js?v=audit";
const places=[...seedPlaces,...kudagoPlaces],events=[...seedEvents,...kudagoEvents];
const cases=[[120,"romantic","19:00",5000,true,false],[120,"fun","12:00",15000,true,true],[180,"unusual","19:00",15000,true,false],[180,"calm","12:00",7000,false,true],[240,"active","19:00",15000,true,false],[240,"romantic","12:00",15000,false,true],[360,"unusual","19:00",20000,true,false],[360,"calm","12:00",15000,true,true]];
const generic=/^(?:торговый центр|торгово-развлекательный центр|торговый комплекс|трц|тц|развлекательный центр|культурный центр|арт[- ]?пространство|пространство|центр|кафе|кофейня|ресторан|бар|паб|парк|сад|музей|галерея|выставка|театр|кинотеатр|клуб)$/i;
let checked=0;
for(let i=0;i<cases.length;i++){
  const [duration,vibe,time,budget,useEvents,noBars]=cases[i];
  const filters={date:"2026-08-22",time,duration,budget,vibes:[vibe],zone:"any",food:true,useEvents,indoorOnly:false,noBars,avoidVisited:false,adventure:i%3===0?"safe":i%3===1?"balanced":"wild",likedItemIds:[],visitedItemIds:[],dislikedItemIds:[],recentlyShownItemIds:[]};
  const plans=generateDates({places,events,filters,count:3,variationSeed:i});
  if(plans.length>3)throw new Error(`${duration}/${vibe}: more than 3 plans`);
  for(const plan of plans){checked++;const constraints=auditPlanConstraints(plan,filters),geo=auditPlanGeography(plan,filters);if(Object.values(constraints).some(ok=>!ok)||!geo.ok)throw new Error(`Production constraint leak: ${plan.template.id}`);if(plan.items.some(item=>generic.test(String(item.title||'').trim())))throw new Error(`Generic venue leaked: ${plan.template.id}`);if(!plan.why||plan.why.length<60)throw new Error(`Weak explanation: ${plan.template.id}`);}
}
console.log(`Production wrapper audit OK: ${checked} plans over ${places.length} places + ${events.length} events.`);
