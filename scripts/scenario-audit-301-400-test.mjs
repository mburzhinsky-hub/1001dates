import fs from "node:fs";
import {scenarioBlueprints,scenarioStats} from "../data/scenarios.js";
import {diagnoseTemplate,generateTemplateDates} from "../engine-v14.js?v=duration5&nearby=1&audit=2";

function assert(condition,message){if(!condition)throw new Error(message);}
const slice=scenarioBlueprints.slice(300,400);
assert(slice.length===100,"Expected scenarios 301-400");
assert(scenarioStats.total===1001,"Scenario catalogue must remain 1001");
assert(new Set(scenarioBlueprints.map((item)=>item.id)).size===1001,"Scenario ids must remain unique");
assert(slice.every((item)=>item.duration===180),"Scenarios 301-400 should remain in the 180-minute band");
const unsupportedExact=new Set(["bar:wine","dinner:gastropub"]);
for(const blueprint of slice){
  for(const slot of blueprint.slots)assert(!unsupportedExact.has(String(slot.select)),blueprint.id+": unsupported exact selector "+slot.select);
  const fixed=blueprint.slots.filter((slot)=>!slot.useItemDuration).reduce((sum,slot)=>sum+Number(slot.minutes||0),0);
  assert(fixed<=blueprint.duration+5,blueprint.id+": fixed chapter time exceeds duration");
}
const source=fs.readFileSync(new URL("../engine-v14.js",import.meta.url),"utf8");
assert(source.includes("generateTemplateDates"),"Production blueprint audit path missing");
assert(typeof diagnoseTemplate==="function"&&typeof generateTemplateDates==="function","Audit exports are not callable");
console.log("Scenario audit 301-400 structural regressions OK");
