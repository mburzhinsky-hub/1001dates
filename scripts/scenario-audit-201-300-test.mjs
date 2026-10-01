import fs from "node:fs";
import {scenarioBlueprints,scenarioStats} from "../data/scenarios.js";
import {diagnoseTemplate,generateTemplateDates,repairScenarioItem} from "../engine-v14.js?v=duration5&nearby=1&audit=2";

function assert(condition,message){if(!condition)throw new Error(message);}
const slice=scenarioBlueprints.slice(200,300);
assert(slice.length===100,"Expected scenarios 201-300");
assert(scenarioStats.total===1001,"Scenario catalogue must remain 1001");
assert(new Set(scenarioBlueprints.map((item)=>item.id)).size===1001,"Scenario ids must remain unique");
assert(slice.every((item)=>item.duration===180),"Scenarios 201-300 should remain in the 180-minute band");
const unsupportedExact=new Set(["bar:wine","dinner:gastropub"]);
for(const blueprint of slice){
  for(const slot of blueprint.slots)assert(!unsupportedExact.has(String(slot.select)),blueprint.id+": unsupported exact selector "+slot.select);
  const fixed=blueprint.slots.filter((slot)=>!slot.useItemDuration).reduce((sum,slot)=>sum+Number(slot.minutes||0),0);
  assert(fixed<=blueprint.duration+5,blueprint.id+": fixed chapter time exceeds duration");
}
const palace=repairScenarioItem({id:"palace",title:"Петровский путевой дворец",description:"исторический дворец рядом с бассейном и водными объектами",category:"activity",subtype:"water",costForTwo:0});
assert(!(palace.category==="activity"&&palace.subtype==="water"),"Palace still leaks into water activity");
const dance=repairScenarioItem({id:"dance",title:"танцевальные клубы GallaDance",description:"занятия танцами",category:"activity",subtype:"cooking",costForTwo:3000});
assert(dance.category==="activity"&&dance.subtype==="dance","Dance club still leaks into cooking activity");

const source=fs.readFileSync(new URL("../engine-v14.js",import.meta.url),"utf8");
assert(source.includes("generateTemplateDates"),"Production blueprint audit path missing");
assert(typeof diagnoseTemplate==="function"&&typeof generateTemplateDates==="function","Audit exports are not callable");
console.log("Scenario audit 201-300 structural regressions OK");
