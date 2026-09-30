import {buildPreparationTasks,needsReservation,needsTickets,preparationUrl,preparationStateKey,preparationProgress} from "../preparation.js";

function assert(condition,message){if(!condition)throw new Error(message);}

const filters={date:"2026-10-03",time:"19:00"};

const walkPlan={items:[
  {id:"walk-1",title:"Парк",category:"walk",sourceUrl:"https://example.com/park"}
]};
let tasks=buildPreparationTasks(walkPlan,filters);
assert(tasks.length===2,"Plain walk should only have calendar and invitation tasks");
assert(tasks.some(t=>t.id==="calendar"),"Calendar task missing");
assert(tasks.some(t=>t.id==="invite"),"Invite task missing");

const event={id:"event-1",title:"Концерт",category:"event",eventType:"concert",officialUrl:"https://tickets.example.com",sourceUrl:"https://source.example.com"};
assert(needsTickets(event),"Ticketed event was not detected");
assert(preparationUrl(event)==="https://tickets.example.com","officialUrl must win over sourceUrl");
tasks=buildPreparationTasks({items:[event]},filters);
assert(tasks.some(t=>t.id==="ticket:event-1"&&t.url==="https://tickets.example.com"),"Ticket task missing or wrong URL");

const dinner={id:"dinner-1",title:"Restaurant X",category:"dinner",officialUrl:"https://restaurant.example.com"};
assert(needsReservation(dinner),"Dinner was not detected as reservation-oriented");
tasks=buildPreparationTasks({items:[dinner]},filters);
assert(tasks.some(t=>t.id==="booking:dinner-1"),"Booking task missing");

const unknown={id:"unknown-1",title:"Набережная",category:"walk"};
assert(!needsReservation(unknown),"Unknown/walk category created a fake reservation");
assert(!needsTickets(unknown),"Unknown/walk category created a fake ticket");

const fallback={id:"event-2",title:"Выставка",category:"event",sourceUrl:"https://source.example.com"};
assert(preparationUrl(fallback)==="https://source.example.com","sourceUrl fallback is broken");

const keyA=preparationStateKey("plan:a","2026-10-03","19:00");
const keyB=preparationStateKey("plan:a","2026-10-04","19:00");
assert(keyA!==keyB,"Different dates must not share preparation state");
const keyC=preparationStateKey("plan:a","2026-10-03","20:00");
assert(keyA!==keyC,"Different times must not share preparation state");

const progress=preparationProgress([{id:"a"},{id:"b"},{id:"c"}],{a:true,c:true});
assert(progress.completed===2&&progress.total===3&&progress.percent===67&&!progress.done,"Progress calculation is wrong");
const done=preparationProgress([{id:"a"},{id:"b"}],{a:true,b:true});
assert(done.done&&done.percent===100,"Completed progress state is wrong");

console.log("Preparation model OK");
