import { itemCoordinates as engineCoordinates, distanceKm, estimateTransferMinutes } from "./engine.js?base=duration5&nearby=1&audit=1&catalog=2&audit300=2&audit400=1&fix=3";

const LEAFLET_CSS="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
const mapInstances=new WeakMap();
let leafletPromise=null;

export function itemCoordinates(item){
  const point=engineCoordinates(item);
  return point?{lat:point.lat,lng:point.lon}:null;
}
export function scenarioMapPoints(plan){
  const source=Array.isArray(plan?.timeline)&&plan.timeline.length?plan.timeline.map(node=>node.item):(plan?.items||[]);
  return source.map((item,index)=>{
    const coords=itemCoordinates(item);
    return coords?{index:index+1,item,lat:coords.lat,lng:coords.lng}:null;
  }).filter(Boolean);
}
export function scenarioGeoBounds(plan){
  const points=scenarioMapPoints(plan);
  if(!points.length)return null;
  return {
    south:Math.min(...points.map(p=>p.lat)),north:Math.max(...points.map(p=>p.lat)),
    west:Math.min(...points.map(p=>p.lng)),east:Math.max(...points.map(p=>p.lng))
  };
}
export function scenarioLegs(plan){
  const items=Array.isArray(plan?.timeline)&&plan.timeline.length?plan.timeline.map(node=>node.item):(plan?.items||[]);
  const legs=[];
  for(let i=1;i<items.length;i++){
    const a=itemCoordinates(items[i-1]),b=itemCoordinates(items[i]);
    const km=a&&b?distanceKm({coords:{lat:a.lat,lon:a.lng}},{coords:{lat:b.lat,lon:b.lng}}):null;
    const minutes=estimateTransferMinutes(items[i-1],items[i]);
    legs.push({from:i,to:i+1,km,minutes:Number.isFinite(minutes)?minutes:null});
  }
  return legs;
}
export function scenarioRouteSummary(plan){
  const legs=scenarioLegs(plan),minutes=legs.reduce((sum,leg)=>sum+(leg.minutes||0),0);
  return {legs,totalMinutes:minutes,pointCount:scenarioMapPoints(plan).length};
}
export function externalMapUrl(point){
  if(!point)return null;
  return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(point.lat)}&mlon=${encodeURIComponent(point.lng)}#map=17/${encodeURIComponent(point.lat)}/${encodeURIComponent(point.lng)}`;
}

// ---------- Route schematic: always available, needs no network ----------
// Draws the stops as numbered points joined by a dashed line, in their real relative positions.
// It is shown while the map loads and stays as the fallback when tiles or the map library cannot be reached.
function svgEscape(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function shortTitle(value,max=22){const text=String(value||"").replace(/\s+/g," ").trim();return text.length>max?text.slice(0,max-1).trimEnd()+"…":text}
export function schematicLayout(points,{width=330,height=260,pad=40,gap=40}={}){
  if(!Array.isArray(points)||points.length<2)return [];
  const lat0=points.reduce((sum,p)=>sum+p.lat,0)/points.length,kx=Math.cos(lat0*Math.PI/180);
  const raw=points.map(p=>({x:p.lng*kx,y:-p.lat}));
  const minX=Math.min(...raw.map(r=>r.x)),maxX=Math.max(...raw.map(r=>r.x)),minY=Math.min(...raw.map(r=>r.y)),maxY=Math.max(...raw.map(r=>r.y));
  const spanX=maxX-minX,spanY=maxY-minY;
  let pts;
  if(Math.max(spanX,spanY)<0.0012){
    // stops inside one venue complex share almost the same coordinates: space them evenly so each one stays readable
    pts=points.map((_,i)=>({x:pad+(width-2*pad)*(i/(points.length-1)),y:height/2+(i%2?-1:1)*18}));
  }else{
    // keep the bottom edge free for the "schematic" note
    const padBottom=pad+14,usableH=height-pad-padBottom;
    const k=Math.min((width-2*pad)/Math.max(spanX,1e-9),usableH/Math.max(spanY,1e-9));
    const ox=(width-spanX*k)/2,oy=pad+(usableH-spanY*k)/2;
    pts=raw.map(r=>({x:ox+(r.x-minX)*k,y:oy+(r.y-minY)*k}));
  }
  // push apart stops that would overlap on screen
  for(let round=0;round<24;round++){
    let moved=false;
    for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){
      let dx=pts[j].x-pts[i].x,dy=pts[j].y-pts[i].y,d=Math.hypot(dx,dy);
      if(d>=gap)continue;
      if(d<0.01){dx=1;dy=0;d=1}
      const push=(gap-d)/2+0.5;
      pts[i].x-=dx/d*push;pts[i].y-=dy/d*push;pts[j].x+=dx/d*push;pts[j].y+=dy/d*push;moved=true;
    }
    pts.forEach(pt=>{pt.x=Math.min(width-pad/2,Math.max(pad/2,pt.x));pt.y=Math.min(height-pad/2-18,Math.max(pad/2,pt.y))});
    if(!moved)break;
  }
  return pts;
}
export function routeSchematic(points,{legs=[],width=330,height=260}={}){
  const pts=schematicLayout(points,{width,height});
  if(!pts.length)return "";
  const line=pts.map(pt=>`${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" ");
  const roads=[[0,.28,1,.2],[0,.74,1,.82],[.3,0,.38,1],[.72,0,.64,1]].map(([x1,y1,x2,y2])=>`<line x1="${(x1*width).toFixed(0)}" y1="${(y1*height).toFixed(0)}" x2="${(x2*width).toFixed(0)}" y2="${(y2*height).toFixed(0)}"/>`).join("");
  const legPills=pts.slice(1).map((pt,i)=>{
    const leg=legs[i];if(!leg||!Number.isFinite(leg.minutes))return "";
    const mx=(pts[i].x+pt.x)/2,my=(pts[i].y+pt.y)/2,label=`≈ ${leg.minutes} мин`;
    return `<g class="sch-leg"><rect x="${(mx-30).toFixed(1)}" y="${(my-11).toFixed(1)}" width="60" height="22" rx="11"/><text x="${mx.toFixed(1)}" y="${(my+4.5).toFixed(1)}" text-anchor="middle">${svgEscape(label)}</text></g>`;
  }).join("");
  const stops=pts.map((pt,i)=>{
    const point=points[i],title=shortTitle(point.item?.title),below=pt.y<height/2+10,ty=below?pt.y+32:pt.y-23,tx=Math.min(width-86,Math.max(86,pt.x));
    return `<g class="sch-stop" data-schematic-stop="${point.index-1}" tabindex="0" role="button" aria-label="${svgEscape(`${point.index}. ${point.item?.title||""}`)}"><circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="16"/><text class="sch-no" x="${pt.x.toFixed(1)}" y="${(pt.y+5).toFixed(1)}" text-anchor="middle">${point.index}</text><text class="sch-name" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle">${svgEscape(title)}</text></g>`;
  }).join("");
  const label=points.map(p=>`${p.index}. ${p.item?.title||""}`).join(" → ");
  return `<svg class="route-schematic" viewBox="0 0 ${width} ${height}" role="img" aria-label="${svgEscape("Схема маршрута: "+label)}" xmlns="http://www.w3.org/2000/svg"><rect class="sch-bg" width="${width}" height="${height}"/><g class="sch-roads">${roads}</g><polyline class="sch-line" points="${line}"/>${legPills}${stops}</svg>`;
}

function loadLeaflet(){
  if(typeof window==="undefined"||typeof document==="undefined")return Promise.reject(new Error("Browser required"));
  if(window.L)return Promise.resolve(window.L);
  if(leafletPromise)return leafletPromise;
  leafletPromise=new Promise((resolve,reject)=>{
    if(!document.querySelector(`link[href="${LEAFLET_CSS}"]`)){
      const link=document.createElement("link");link.rel="stylesheet";link.href=LEAFLET_CSS;document.head.append(link);
    }
    const existing=document.querySelector(`script[src="${LEAFLET_JS}"]`);
    const done=()=>window.L?resolve(window.L):reject(new Error("Leaflet unavailable"));
    if(existing){existing.addEventListener("load",done,{once:true});existing.addEventListener("error",()=>reject(new Error("Leaflet failed")),{once:true});return}
    const script=document.createElement("script");script.src=LEAFLET_JS;script.async=true;script.onload=done;script.onerror=()=>reject(new Error("Leaflet failed"));document.head.append(script);
  });
  return leafletPromise;
}
function numberedIcon(L,index,offsetX=0){
  return L.divIcon({className:"scenario-map-marker-shell",html:`<span class="scenario-map-marker">${index}</span>`,iconSize:[34,34],iconAnchor:[17-offsetX,17]});
}
// Chapters inside one venue complex (a museum with a bistro, an exhibition at VDNH) share almost the same coordinates.
// Their numbered pins are fanned out sideways in screen pixels so every chapter stays visible and clickable.
export const MARKER_CLUSTER_KM=0.15, MARKER_FAN_PX=38;
export function markerFanOffsets(points){
  const offsets=points.map(()=>0),seen=new Set();
  points.forEach((point,i)=>{
    if(seen.has(i))return;
    const group=[i];
    points.forEach((other,j)=>{if(j!==i&&!seen.has(j)&&distanceKm({coords:{lat:point.lat,lon:point.lng}},{coords:{lat:other.lat,lon:other.lng}})<MARKER_CLUSTER_KM)group.push(j)});
    group.forEach(j=>seen.add(j));
    if(group.length>1)group.forEach((j,k)=>{offsets[j]=Math.round((k-(group.length-1)/2)*MARKER_FAN_PX)});
  });
  return offsets;
}
export function destroyScenarioMap(container){
  if(!container)return;
  const map=mapInstances.get(container);
  if(map){try{map.remove()}catch{}mapInstances.delete(container)}
  container.innerHTML="";
}
export async function renderScenarioMap(container,plan,{onMarker=null}={}){
  if(!container)return {ok:false,reason:"missing-container"};
  destroyScenarioMap(container);
  const points=scenarioMapPoints(plan);
  if(points.length<2){container.dataset.mapState="insufficient";return {ok:false,reason:"insufficient-points",points}}
  container.dataset.mapState="loading";
  try{
    const L=await loadLeaflet();
    const map=L.map(container,{zoomControl:false,attributionControl:true,scrollWheelZoom:false,doubleClickZoom:false,tap:false});
    mapInstances.set(container,map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"&copy; OpenStreetMap contributors"}).addTo(map);
    const latLngs=points.map(p=>[p.lat,p.lng]);
    L.polyline(latLngs,{weight:3,opacity:.72,dashArray:"8 8",interactive:false}).addTo(map);
    const fan=markerFanOffsets(points);
    points.forEach((point,i)=>{
      const marker=L.marker([point.lat,point.lng],{icon:numberedIcon(L,point.index,fan[i])}).addTo(map);
      marker.on("click",()=>onMarker?.(point));
    });
    map.fitBounds(L.latLngBounds(latLngs),{padding:[34,34],maxZoom:15});
    container.dataset.mapState="ready";
    requestAnimationFrame(()=>map.invalidateSize());
    return {ok:true,map,points};
  }catch(error){
    destroyScenarioMap(container);container.dataset.mapState="failed";
    return {ok:false,reason:"load-failed",error};
  }
}
