import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../data/kudago.generated.js");
const API = "https://kudago.com/public-api/v1.4";
const CITY = process.env.KUDAGO_CITY || "msk";
const PLACE_PAGES = Number(process.env.KUDAGO_PLACE_PAGES || 12);
const EVENT_PAGES = Number(process.env.KUDAGO_EVENT_PAGES || 5);
const PER_CATEGORY = Number(process.env.KUDAGO_PER_CATEGORY || 170);

const zoneCenters = {
  center:[55.7558,37.6173], city:[55.7487,37.5378], vdnh:[55.8298,37.6320],
  west:[55.735,37.47], south:[55.64,37.63], east:[55.76,37.77]
};
const knownCategories = new Set(["dinner","cafe","bar","dessert","walk","viewpoint","art","activity"]);

function nearestZone(coords) {
  if (!coords?.lat || !coords?.lon) return "center";
  const lat=Number(coords.lat),lon=Number(coords.lon); let best="center",bestD=Infinity;
  for (const [zone,[zlat,zlon]] of Object.entries(zoneCenters)) {
    const d=((lat-zlat)*1.8)**2+(lon-zlon)**2;
    if(d<bestD){bestD=d;best=zone;}
  }
  return best;
}
function textOf(value) { return Array.isArray(value) ? value.join(" ") : String(value || ""); }
function classifyPlace(categories=[], title="", description="") {
  const text=`${textOf(categories)} ${title} ${description}`.toLowerCase();
  if (/restaurant|restaurants|ресторан|гастробар|гастроном/.test(text)) return "dinner";
  if (/coffee|coffee-shop|кофейн|cafe|кафе|чай/.test(text)) return "cafe";
  if (/dessert|ice-cream|кондитер|морожен|десерт/.test(text)) return "dessert";
  if (/bar|pub|бар|паб/.test(text)) return "bar";
  if (/viewpoint|observation|смотров|панорам/.test(text)) return "viewpoint";
  if (/museum|gallery|art-space|exhibition|музе|галере|искусств|арт-простран/.test(text)) return "art";
  if (/quest|entertainment|amusement|bowling|karting|climbing|батут|квест|развлеч|боулинг|каток|скалодром|мастер-класс/.test(text)) return "activity";
  if (/park|garden|estate|landmark|attraction|парк|сад|усадьб|набереж|прогул/.test(text)) return "walk";
  return null;
}
function vibesFor(category,text="") {
  const base={dinner:["romantic","calm"],cafe:["calm","romantic"],bar:["fun","romantic"],dessert:["romantic","calm","fun"],walk:["romantic","calm","active"],viewpoint:["romantic","unusual"],art:["calm","unusual","romantic"],activity:["fun","unusual","active"],event:["fun","unusual"]}[category]||["calm"];
  const result=[...base],t=text.toLowerCase();
  for (const [regex,vibe] of [[/роман|любов|свидан/,"romantic"],[/интерактив|иммерсив|необыч|мультимед|секрет/,"unusual"],[/спорт|актив|игр|квест|танц/,"active"],[/стендап|комед|вечерин|игр/,"fun"],[/тих|камер|уют|спокой/,"calm"]]) if(regex.test(t)&&!result.includes(vibe))result.push(vibe);
  return result.slice(0,5);
}
function roughPlaceCost(category) { return {dinner:4800,cafe:1600,bar:3600,dessert:1500,walk:0,viewpoint:2500,art:1700,activity:3200}[category]??2200; }
function roughDuration(category) { return {dinner:90,cafe:55,bar:75,dessert:50,walk:60,viewpoint:60,art:75,activity:85,event:100}[category]??70; }
function trimText(value,max=240) { const text=String(value||"").replace(/\s+/g," ").trim(); return text.length>max?`${text.slice(0,max-1).trim()}…`:text; }
function isHTTP(value) { try { const u=new URL(value); return u.protocol==="http:"||u.protocol==="https:"; } catch { return false; } }
function concreteKudaGo(value) {
  if(!isHTTP(value))return null; const u=new URL(value);
  if(!u.hostname.endsWith("kudago.com"))return value;
  return /^\/msk\/(place|event)\/[^/]+\/?$/.test(u.pathname)?value:null;
}
function parsePrice(text="",isFree=false) {
  if(isFree||/бесплат/i.test(text))return{value:0,estimated:false};
  const nums=[...String(text).matchAll(/\d[\d\s]{1,8}/g)].map((m)=>Number(m[0].replace(/\s/g,""))).filter((n)=>n>=100&&n<100000);
  if(nums.length)return{value:Math.min(...nums)*2,estimated:false};
  return{value:2500,estimated:true};
}
async function fetchJSON(path,params) {
  const url=new URL(API+path); for(const [key,value] of Object.entries(params))if(value!==undefined&&value!==null&&value!=="")url.searchParams.set(key,String(value));
  let lastError;
  for(let attempt=1;attempt<=3;attempt++){
    try{const response=await fetch(url,{headers:{"User-Agent":"1001-Dates/2.0"}});if(!response.ok)throw new Error(`${response.status} ${response.statusText}: ${url}`);return response.json();}
    catch(error){lastError=error;if(attempt<3)await new Promise((resolveDelay)=>setTimeout(resolveDelay,attempt*1400));}
  }
  throw lastError;
}
async function fetchPages(path,baseParams,pages) {
  const all=[]; for(let page=1;page<=pages;page++){const payload=await fetchJSON(path,{...baseParams,page,page_size:100});all.push(...(payload.results||[]));if(!payload.next)break;} return all;
}
function normalizePlace(p) {
  const category=classifyPlace(p.categories||[],p.title,p.description); if(!category||!knownCategories.has(category)||p.is_closed)return null;
  return {id:`kudago-place-${p.id}`,title:p.title,category,zone:nearestZone(p.coords),address:p.address||(p.subway?`метро ${p.subway}`:"Москва"),costForTwo:roughPlaceCost(category),costEstimated:true,duration:roughDuration(category),indoor:!["walk","viewpoint"].includes(category),vibes:vibesFor(category,`${p.title||""} ${p.description||""}`),quality:Math.min(9.7,7+Math.log10(1+(p.favorites_count||0))*.58),description:trimText(p.description),image:p.images?.[0]?.image||null,coords:p.coords||null,source:"KudaGo API",sourceUrl:concreteKudaGo(p.site_url),officialUrl:isHTTP(p.foreign_url)?p.foreign_url:null};
}
function balancePlaces(items) {
  const groups=new Map(); for(const item of items){if(!groups.has(item.category))groups.set(item.category,[]);groups.get(item.category).push(item);}
  const selected=[]; for(const category of knownCategories){const group=(groups.get(category)||[]).sort((a,b)=>b.quality-a.quality);selected.push(...group.slice(0,PER_CATEGORY));}
  return selected.sort((a,b)=>b.quality-a.quality);
}
function eventCategory(categories=[]) {
  const text=textOf(categories).toLowerCase(); if(/exhibition/.test(text))return"exhibition";if(/concert/.test(text))return"concert";if(/theater|theatre/.test(text))return"theater";if(/standup|comedy/.test(text))return"standup";if(/quest/.test(text))return"quest";if(/festival/.test(text))return"festival";return"event";
}
function normalizeDates(dates=[]) {
  const clean=dates.filter((d)=>d?.start||d?.start_date); const exactDates=[...new Set(clean.map((d)=>d.start_date||(d.start?new Date(d.start*1000).toISOString().slice(0,10):null)).filter(Boolean))];
  const startTimes=[...new Set(clean.map((d)=>d.start_time||(d.start?new Date(d.start*1000).toISOString().slice(11,16):null)).filter(Boolean))].slice(0,8);
  if(exactDates.length&&exactDates.length<=35)return{exactDates,startTimes}; if(exactDates.length)return{activeFrom:exactDates[0],activeUntil:exactDates.at(-1),startTimes}; return{};
}
function normalizeEvent(e) {
  const place=e.place||{},pricing=parsePrice(e.price||"",e.is_free),type=eventCategory(e.categories||[]),categoryText=textOf(e.categories).toLowerCase();
  return {id:`kudago-event-${e.id}`,title:e.short_title||e.title,category:"event",eventType:type,zone:nearestZone(place.coords),address:place.address||place.title||"Москва",costForTwo:pricing.value,costEstimated:pricing.estimated,duration:type==="exhibition"?80:type==="theater"?130:type==="concert"?110:type==="standup"?100:105,indoor:!(/festival|excursion|open-air/.test(categoryText)),vibes:vibesFor("event",`${e.title||""} ${e.description||""}`),quality:Math.min(9.8,7.2+Math.log10(1+(e.favorites_count||0))*.58),description:trimText(e.description),...normalizeDates(e.dates||[]),image:e.images?.[0]?.image||null,coords:place.coords||null,source:"KudaGo API",sourceUrl:concreteKudaGo(e.site_url),officialUrl:null};
}
function uniqueById(items){const map=new Map();for(const item of items)if(item?.id&&!map.has(item.id))map.set(item.id,item);return[...map.values()];}

const now=Math.floor(Date.now()/1000),until=now+60*24*60*60;
console.log(`Fetching KudaGo data for ${CITY}: up to ${PLACE_PAGES*100} places and ${EVENT_PAGES*100} events...`);
const rawPlaces=await fetchPages("/places/",{location:CITY,order_by:"-favorites_count",text_format:"text",fields:"id,title,slug,address,coords,subway,site_url,foreign_url,categories,is_closed,images,favorites_count,description",expand:"images"},PLACE_PAGES);
const rawEvents=await fetchPages("/events/",{location:CITY,actual_since:now,actual_until:until,order_by:"-favorites_count",text_format:"text",fields:"id,title,short_title,dates,place,description,categories,age_restriction,price,is_free,images,favorites_count,site_url",expand:"place,dates,images"},EVENT_PAGES);
const places=balancePlaces(uniqueById(rawPlaces.map(normalizePlace).filter(Boolean)));
const events=uniqueById(rawEvents.map(normalizeEvent).filter((e)=>e?.title&&(e.exactDates?.length||e.activeFrom||e.activeUntil)));
const categoryCounts=Object.fromEntries([...knownCategories].map((category)=>[category,places.filter((item)=>item.category===category).length]));
const updatedAt=new Date().toISOString();
const meta={updatedAt,city:CITY,source:"KudaGo public API",rawPlaces:rawPlaces.length,rawEvents:rawEvents.length,places:places.length,events:events.length,categoryCounts,concretePlaceLinks:places.filter((x)=>x.sourceUrl||x.officialUrl).length,concreteEventLinks:events.filter((x)=>x.sourceUrl).length};
const js=`// Generated automatically from the KudaGo public API. Do not edit manually.\nexport const kudagoPlaces = ${JSON.stringify(places,null,2)};\n\nexport const kudagoEvents = ${JSON.stringify(events,null,2)};\n\nexport const kudagoMeta = ${JSON.stringify(meta,null,2)};\n`;
await writeFile(OUT,js,"utf8");
console.log(`Saved ${places.length} balanced places and ${events.length} current events to ${OUT}`);
console.log("Category counts:",categoryCounts);
