import { itemCoordinates as engineCoordinates, distanceKm, estimateTransferMinutes } from "./engine.js?base=duration5&nearby=1";

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
function numberedIcon(L,index){
  return L.divIcon({className:"scenario-map-marker-shell",html:`<span class="scenario-map-marker">${index}</span>`,iconSize:[34,34],iconAnchor:[17,17]});
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
    points.forEach(point=>{
      const marker=L.marker([point.lat,point.lng],{icon:numberedIcon(L,point.index)}).addTo(map);
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
