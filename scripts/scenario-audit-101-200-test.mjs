import fs from "node:fs";
import {scenarioBlueprints,scenarioStats} from "../data/scenarios.js";
import {repairScenarioItem} from "../engine-v14.js?v=duration5&nearby=1&audit=1";
import {buildPreparationTasks,needsTickets} from "../preparation.js";

function assert(condition,message){if(!condition)throw new Error(message);}

assert(scenarioStats.total===1001,"Scenario catalogue must remain exactly 1001 blueprints");
assert(scenarioStats.byDuration[120]===200&&scenarioStats.byDuration[180]===250&&scenarioStats.byDuration[240]===275&&scenarioStats.byDuration[360]===276,"Scenario duration distribution changed");

const unsupportedExact=new Set([
  "cafe:tea","cafe:bakery","dessert:icecream","dessert:chocolate","viewpoint:rooftop",
  "activity:pottery","activity:billiards","activity:mini_golf","activity:vinyl","dinner:brunch"
]);
for(const scenario of scenarioBlueprints.slice(0,200)){
  for(const slot of scenario.slots){
    assert(!unsupportedExact.has(String(slot.select)),`${scenario.id}: unsupported exact selector ${slot.select}`);
  }
  if(scenario.duration===120){
    const fixed=scenario.slots.filter(slot=>!slot.useItemDuration).reduce((sum,slot)=>sum+Number(slot.minutes||0),0);
    const eventCount=scenario.slots.filter(slot=>slot.useItemDuration).length;
    if(eventCount)assert(fixed<=30,`${scenario.id}: 2h event scenario leaves too little room for the event (${fixed} fixed minutes)`);
    else assert(fixed<=125,`${scenario.id}: 2h scenario exceeds its duration before travel/waiting (${fixed} minutes)`);
  }
}

const cinema=repairScenarioItem({id:"cinema",title:"Кинотеатр «Синема Парк» в ТРЦ «Ривьера»",category:"walk",subtype:"park",costForTwo:1800});
assert(cinema.category==="activity"&&cinema.subtype==="cinema","Cinema Park still leaks into walk:park");
assert(needsTickets(cinema),"Cinema must require ticket preparation");
assert(buildPreparationTasks({items:[cinema]},{date:"2026-10-03",time:"19:00"}).some(task=>task.id==="ticket:cinema"),"Cinema preparation task is missing");

const panorama=repairScenarioItem({id:"panorama",title:"музей-панорама «Бородинская битва»",category:"viewpoint",subtype:"observation",costForTwo:1200});
assert(panorama.category==="art"&&panorama.subtype==="museum","Museum-panorama still leaks into viewpoint");

const theater=repairScenarioItem({id:"theater",title:"Московский академический музыкальный театр имени Станиславского и Немировича-Данченко",category:"activity",subtype:"dance",costForTwo:4000});
assert(theater.category==="art"&&theater.subtype==="theater","Theater still leaks into dance activity");

const zuart=repairScenarioItem({id:"zuart",title:"студия рисования и живописи ZuART",description:"занятия и мастер-классы по живописи",category:"art",subtype:"museum",costForTwo:3000});
assert(zuart.category==="activity"&&zuart.subtype==="painting","ZuART still leaks into museum");

const lumiere=repairScenarioItem({id:"lumiere",title:"креативное пространство «Люмьер-Холл»",description:"мультимедийные выставки",category:"walk",subtype:"architecture",costForTwo:2200});
assert(lumiere.category==="art"&&lumiere.subtype==="digital","Lumiere Hall still leaks into walk");

const basseyn=repairScenarioItem({id:"pool",title:"The Bassein в Сокольниках",description:"открытый бассейн",category:"walk",subtype:"park",costForTwo:3000});
assert(basseyn.category==="activity"&&basseyn.subtype==="water","The Bassein still leaks into walk:park");

const engineSource=fs.readFileSync(new URL("../engine.js",import.meta.url),"utf8");
assert(engineSource.includes('slow:new Set(["bookstore","market"])'),"Slow discovery semantic guard still allows generic games");

console.log("Scenario audit 101-200 fixes OK");
