import {scenarioBlueprints} from "../data/scenarios.js";
import {buildPreparationTasks,needsTickets} from "../preparation.js";
import {repairScenarioItem} from "../engine-v14.js?v=duration5&nearby=1";

function assert(condition,message){if(!condition)throw new Error(message);}

const first100=scenarioBlueprints.slice(0,100);
for(const scenario of first100){
  for(const slot of scenario.slots){
    const select=String(slot.select||"");
    if((select==="activity"||select==="art")&&!slot.semantic){
      throw new Error(`${scenario.id}: broad selector ${select} lacks a semantic guard`);
    }
  }
}

for(const subtype of ["climbing","karting","games","bowling","vr","quest","workshop","water"]){
  const item={id:`activity-${subtype}`,title:subtype,category:"activity",subtype,costForTwo:2000,sourceUrl:"https://example.com"};
  assert(needsTickets(item),`Paid activity subtype ${subtype} is missing preparation`);
  const tasks=buildPreparationTasks({items:[item]},{date:"2026-10-03",time:"19:00"});
  assert(tasks.some(task=>task.id===`ticket:${item.id}`),`No preparation task for ${subtype}`);
}

const freeEvent={id:"free-event",title:"Бесплатная выставка",category:"event",eventType:"exhibition",costForTwo:0,sourceUrl:"https://example.com/event"};
const freeTasks=buildPreparationTasks({items:[freeEvent]},{date:"2026-10-03",time:"19:00"});
assert(freeTasks.some(task=>task.id==="ticket:free-event"&&task.title==="Проверить вход и регистрацию"),"Free event must still have an access-check preparation task");

const moreon=repairScenarioItem({id:"moreon",title:"комплекс водных развлечений «Мореон»",category:"viewpoint",subtype:"rooftop",costForTwo:3000,indoor:false});
assert(moreon.category==="activity"&&moreon.subtype==="water","Water complex is still classified as viewpoint");

const luzhniki=repairScenarioItem({id:"luzhniki",title:"аквакомплекс «Лужники»",category:"dinner",subtype:"restaurant",costForTwo:4800,includesFood:true});
assert(luzhniki.category==="activity"&&luzhniki.subtype==="water"&&!luzhniki.includesFood,"Aquacomplex is still classified as dinner");

const bridge=repairScenarioItem({id:"bridge",title:"мост Богдана Хмельницкого",category:"viewpoint",subtype:"observation",costForTwo:3000,costEstimated:true,indoor:true});
assert(bridge.costForTwo===0&&!bridge.costEstimated&&!bridge.indoor,"Public bridge still looks ticketed/indoor");

const cathedral=repairScenarioItem({id:"cathedral",title:"Римско-католический Кафедральный собор",category:"art",subtype:"museum",costForTwo:1700,costEstimated:true});
assert(cathedral.category==="walk"&&cathedral.subtype==="architecture"&&cathedral.costForTwo===0,"Religious architecture still leaks into art/museum scenarios");

console.log("First-100 scenario audit fixes OK");
