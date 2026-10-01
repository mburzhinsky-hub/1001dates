import { itemCoordinates, scenarioMapPoints, scenarioGeoBounds, scenarioLegs, scenarioRouteSummary, markerFanOffsets, routeSchematic, schematicLayout } from "../scenario-map.js";

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

// Chapters in the same venue complex get fanned-out pins; distant chapters keep the exact position.
const twin={id:"t",title:"T",coords:{lat:55.7501,lon:37.6101}};
const fan=markerFanOffsets(scenarioMapPoints({items:[a,twin,c]}));
assert(fan[0]!==0&&fan[1]!==0&&fan[0]!==fan[1]&&fan[2]===0,"Overlapping pins must be fanned out sideways, distant pins left alone");
assert(markerFanOffsets(points).every(x=>x===0),"Well separated pins must not move");

console.log("Scenario map model OK");

// Route schematic: network-free fallback for the map
const schematic=routeSchematic(points,{legs});
assert(schematic.startsWith("<svg")&&schematic.includes("data-schematic-stop=\"0\"")&&schematic.includes("data-schematic-stop=\"2\""),"Schematic must draw every stop");
assert((schematic.match(/class="sch-leg"/g)||[]).length===2,"Schematic must label every leg");
const layout=schematicLayout(points);
assert(layout.length===3&&layout.every(pt=>pt.x>=0&&pt.x<=330&&pt.y>=0&&pt.y<=260),"Schematic points must stay inside the frame");
for(let i=0;i<layout.length;i++)for(let j=i+1;j<layout.length;j++)assert(Math.hypot(layout[i].x-layout[j].x,layout[i].y-layout[j].y)>=30,"Schematic stops must not overlap");
const same=scenarioMapPoints({items:[{id:"p",title:"P",coords:{lat:55.7,lon:37.6}},{id:"q",title:"Q",coords:{lat:55.7,lon:37.6}},{id:"r",title:"R <b>&",coords:{lat:55.70001,lon:37.60001}}]});
const sameLayout=schematicLayout(same);
assert(sameLayout.length===3&&Math.hypot(sameLayout[0].x-sameLayout[1].x,sameLayout[0].y-sameLayout[1].y)>=30,"Stops with identical coordinates must be spread apart");
assert(!routeSchematic(same).includes("<b>"),"Schematic must escape titles");
assert(routeSchematic([])==="","Schematic must be empty without points");
console.log("Route schematic OK");
