import { itemCoordinates, scenarioMapPoints, scenarioGeoBounds, scenarioLegs, scenarioRouteSummary } from "../scenario-map.js";

function assert(condition,message){if(!condition)throw new Error(message);}

const a={id:"a",title:"A",coords:{lat:55.75,lon:37.61}};
const b={id:"b",title:"B",coords:{lat:55.76,lon:37.62}};
const c={id:"c",title:"C",coords:{lat:55.77,lon:37.63}};
const bad={id:"bad",title:"Bad",coords:{lat:999,lon:37.6}};

assert(itemCoordinates(a)?.lat===55.75&&itemCoordinates(a)?.lng===37.61,"Valid coordinates were not normalized");
assert(itemCoordinates(bad)===null,"Invalid coordinates were not rejected");

const plan={items:[a,b,c]};
const points=scenarioMapPoints(plan);
assert(points.length===3,"Three coordinate-bearing items must produce three map points");
assert(points.map(point=>point.item.id).join(",")==="a,b,c","Map point order must follow plan.items");

const mixed=scenarioMapPoints({items:[a,bad,c]});
assert(mixed.length===2&&mixed[0].item.id==="a"&&mixed[1].item.id==="c","Missing coordinates must be skipped without breaking order");

const bounds=scenarioGeoBounds(plan);
assert(bounds&&bounds.south===55.75&&bounds.north===55.77&&bounds.west===37.61&&bounds.east===37.63,"Scenario bounds are wrong");

const legs=scenarioLegs(plan);
assert(legs.length===2,"Three points must create two route legs");
assert(legs.every(leg=>leg.km>0&&leg.minutes>0),"Route legs must contain distance and transfer time");

const summary=scenarioRouteSummary(plan);
assert(summary.pointCount===3&&summary.totalMinutes===legs.reduce((sum,leg)=>sum+leg.minutes,0),"Route summary is inconsistent");

console.log("Scenario map model OK");
