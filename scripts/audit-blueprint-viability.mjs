import {pathToFileURL} from "node:url";
import {seedPlaces,seedEvents} from "../data/seed.js";
import {kudagoPlaces,kudagoEvents,kudagoMeta} from "../data/kudago.generated.js";
import {scenarioBlueprints} from "../data/scenarios.js";
import {generateTemplateDates,diagnoseTemplate,auditPlanConstraints} from "../engine-v14.js?v=duration5&nearby=1&audit=2";
import {buildPreparationTasks} from "../preparation.js";
import {selectScenarioCover,scenarioImageUsable} from "../scenario-visuals.js";

function assert(condition,message){if(!condition)throw new Error(message);}
function daysInMonth(month){const[y,m]=month.split("-").map(Number);return new Date(Date.UTC(y,m,0)).getUTCDate();}
function dateAt(day){return kudagoMeta.targetMonth+"-"+String(day).padStart(2,"0");}
function baseFilters(blueprint,date,time){return {
  date,time,duration:blueprint.duration,budget:999999,zone:"any",vibes:[],food:null,useEvents:true,
  indoorOnly:false,noBars:false,avoidVisited:false,adventure:"balanced",
  likedItemIds:[],visitedItemIds:[],dislikedItemIds:[],recentlyShownItemIds:[]
};}
function selectedPreparation(plan,filters){
  const tasks=buildPreparationTasks(plan,filters);
  assert(tasks.some((task)=>task.id==="calendar"),plan.template.id+": calendar task missing");
  assert(tasks.some((task)=>task.id==="invite"),plan.template.id+": invite task missing");
  const action=tasks.filter((task)=>task.type==="ticket"||task.type==="booking");
  return plan.items.map((item)=>({
    item:item.title,
    action:action.filter((task)=>task.itemTitle===item.title).map((task)=>task.title)
  }));
}
function classifyDead(blueprint,diagnostics){
  const eligible=diagnostics.filter((d)=>d.eligible);
  if(!eligible.length)return {code:"OTHER",detail:"No tested date/time matched blueprint daypart eligibility"};
  const nonEmpty=eligible.filter((d)=>Array.isArray(d.poolSizes)&&d.poolSizes.length&&d.poolSizes.every((n)=>n>0));
  if(!nonEmpty.length){
    const empty=[...new Set(eligible.flatMap((d)=>d.emptySelectors||[]))];
    const eventOnly=empty.length&&empty.every((selector)=>String(selector).startsWith("event"));
    return {code:eventOnly?"DEAD_EVENT":"DEAD_SUBTYPE",detail:"Empty production pools: "+empty.join(", ")};
  }
  const minActivity=Math.min(...nonEmpty.map((d)=>Number(d.minActivityMinutes||Infinity)));
  if(Number.isFinite(minActivity)&&minActivity>Number(blueprint.duration)+5)return {code:"DEAD_DURATION",detail:"Minimum activity time "+minActivity+" > "+blueprint.duration+" min"};
  if(Math.max(...nonEmpty.map((d)=>Number(d.geographicCombinations||0)))===0)return {code:"DEAD_GEOGRAPHY",detail:"Pools exist but no geographically valid combination enters production candidate set"};
  if(Math.max(...nonEmpty.map((d)=>Number(d.schedulePass||0)))===0)return {code:"DEAD_TIMETABLE",detail:"Geographically valid combinations exist, but none pass production scheduling/opening/fixed-time constraints"};
  return {code:"OTHER",detail:"Production candidate was not returned despite diagnostic schedule passes"};
}

export function auditRange(start=201,end=300,{verbose=true}={}){
  const places=[...seedPlaces,...kudagoPlaces],events=[...seedEvents,...kudagoEvents];
  const times=["10:00","12:00","15:00","18:00","19:00","20:00","22:00"];
  const maxDay=daysInMonth(kudagoMeta.targetMonth);
  const rows=[],dead=[];
  for(let number=start;number<=end;number++){
    const blueprint=scenarioBlueprints[number-1];
    assert(blueprint,"Missing blueprint #"+number);
    const usesEvents=blueprint.slots.some((slot)=>String(slot.select||"").startsWith("event"));
    const auditDays=usesEvents?Array.from({length:maxDay},(_,index)=>index+1):[1,2,3,4,5,6,7];
    let chosen=null,chosenFilters=null;
    outer: for(const day of auditDays){
      for(const time of times){
        const filters=baseFilters(blueprint,dateAt(day),time);
        const plans=generateTemplateDates({places,events,filters,templateId:blueprint.id,count:1,variationSeed:0});
        if(plans.length){chosen=plans[0];chosenFilters=filters;break outer;}
      }
    }
    if(!chosen){
      const diagnostics=[];
      for(const day of auditDays){
        for(const time of times){
          const filters=baseFilters(blueprint,dateAt(day),time);
          diagnostics.push(diagnoseTemplate({places,events,filters,templateId:blueprint.id}));
        }
      }
      const failure=classifyDead(blueprint,diagnostics);
      const row={number,id:blueprint.id,concept:blueprint.concept,status:"DEAD",failure};
      rows.push(row);dead.push(row);
      if(verbose)console.log("AUDIT "+JSON.stringify(row));
      continue;
    }
    const hard=auditPlanConstraints(chosen,chosenFilters);
    for(const [name,ok] of Object.entries(hard))assert(ok,blueprint.id+": hard constraint failed: "+name);
    assert(new Set(chosen.items.map((item)=>item.id)).size===chosen.items.length,blueprint.id+": duplicate item");
    const cover=selectScenarioCover(chosen);
    if(cover){
      assert(scenarioImageUsable(cover),blueprint.id+": selected cover is unusable");
      assert(chosen.items.some((item)=>item.image===cover),blueprint.id+": cover does not belong to a real scenario item");
    }
    const prep=selectedPreparation(chosen,chosenFilters);
    const row={
      number,id:blueprint.id,concept:blueprint.concept,status:"OK",
      date:chosenFilters.date,time:chosenFilters.time,duration:chosen.totalMinutes,cost:chosen.totalCost,
      geo:chosen.geo||null,
      route:chosen.items.map((item)=>({title:item.title,category:item.category,subtype:item.subtype||item.eventType||null,image:item.image||null})),
      cover:cover||null,preparation:prep,story:chosen.story,why:chosen.why
    };
    rows.push(row);
    if(verbose)console.log("AUDIT "+JSON.stringify(row));
  }
  const summary={start,end,total:rows.length,valid:rows.length-dead.length,dead:dead.length,deadByClass:dead.reduce((acc,row)=>{acc[row.failure.code]=(acc[row.failure.code]||0)+1;return acc;},{})};
  if(verbose)console.log("SUMMARY "+JSON.stringify(summary));
  return {rows,dead,summary};
}

const direct=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(direct){
  const start=Number(process.argv[2]||201),end=Number(process.argv[3]||300);
  const result=auditRange(start,end,{verbose:true});
  if(result.dead.length)process.exitCode=1;
}
