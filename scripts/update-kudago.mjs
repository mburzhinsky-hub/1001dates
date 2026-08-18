import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../data/kudago.generated.js");
const API = "https://kudago.com/public-api/v1.4";
const CITY = process.env.KUDAGO_CITY || "msk";
const PLACE_PAGES = Number(process.env.KUDAGO_PLACE_PAGES || 20);
const EVENT_PAGES = Number(process.env.KUDAGO_EVENT_PAGES || 8);
const PER_CATEGORY = Number(process.env.KUDAGO_PER_CATEGORY || 280);
const PER_SUBTYPE = Number(process.env.KUDAGO_PER_SUBTYPE || 90);

const zoneCenters = {
  center:[55.7558,37.6173], city:[55.7487,37.5378], vdnh:[55.8298,37.6320],
  west:[55.735,37.47], south:[55.64,37.63], east:[55.76,37.77]
};
const knownCategories = new Set(["dinner","cafe","bar","dessert","walk","viewpoint","art","activity"]);

function validCoords(coords) {
  const lat=Number(coords?.lat),lon=Number(coords?.lon);
  return Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180;
}
function nearestZone(coords) {
  if (!validCoords(coords)) return "center";
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
  if (/quest|entertainment|amusement|bowling|karting|climbing|батут|квест|развлеч|боулинг|каток|скалодром|мастер-класс|гончар|керами|рисован|кулинар|танц|бильярд|караоке|виртуальн|vr|мини.?гольф|книж|винил|маркет|рынок/.test(text)) return "activity";
  if (/park|garden|estate|landmark|attraction|парк|сад|усадьб|набереж|прогул/.test(text)) return "walk";
  return null;
}

function classifySubtype(category,text="") {
  const t=String(text).toLowerCase();
  if(category==="art"){
    if(/мультимед|digital|immersive|иммерсив|медиа.?арт/.test(t))return"digital";
    if(/фото|photograph/.test(t))return"photo";
    if(/наук|science|планетар|космос|техник/.test(t))return"science";
    if(/современн|contemporary/.test(t))return"contemporary";
    if(/галере|gallery/.test(t))return"gallery";
    return"museum";
  }
  if(category==="walk"){
    if(/набереж|река|озер|пруд|river|waterfront/.test(t))return"waterfront";
    if(/архитект|улиц|переул|бульвар|landmark|attraction/.test(t))return"architecture";
    return"park";
  }
  if(category==="viewpoint")return/крыша|rooftop|террас/.test(t)?"rooftop":"observation";
  if(category==="cafe"){
    if(/чай|tea/.test(t))return"tea";if(/пекар|bakery|булоч/.test(t))return"bakery";return"coffee";
  }
  if(category==="dessert"){
    if(/морож|ice.?cream|gelato/.test(t))return"icecream";if(/шоколад|chocolate/.test(t))return"chocolate";return"pastry";
  }
  if(category==="dinner"){
    if(/завтрак|breakfast/.test(t))return"breakfast";if(/бранч|brunch/.test(t))return"brunch";
    if(/гастробар|gastropub/.test(t))return"gastropub";if(/бистро|casual/.test(t))return"casual";return"restaurant";
  }
  if(category==="bar"){
    if(/винн|wine/.test(t))return"wine";if(/джаз|jazz|live music|живая музык/.test(t))return"jazz";return"cocktail";
  }
  if(category==="activity"){
    if(/керами|гончар|potter/.test(t))return"pottery";if(/рисован|живопис|paint/.test(t))return"painting";
    if(/кулинар|готов|cooking/.test(t))return"cooking";if(/танц|dance/.test(t))return"dance";
    if(/боулинг|bowling/.test(t))return"bowling";if(/бильярд|billiard/.test(t))return"billiards";if(/караоке|karaoke/.test(t))return"karaoke";
    if(/vr|виртуальн/.test(t))return"vr";if(/квест|quest/.test(t))return"quest";if(/скалодром|climb/.test(t))return"climbing";
    if(/каток|коньк|skating/.test(t))return"skating";if(/картинг|karting/.test(t))return"karting";if(/мини.?гольф|mini.?golf/.test(t))return"mini_golf";
    if(/книж|bookstore/.test(t))return"bookstore";if(/винил|vinyl/.test(t))return"vinyl";if(/маркет|рынок|market/.test(t))return"market";
    if(/настоль|board.?game|игр/.test(t))return"games";if(/мастер.?класс|workshop/.test(t))return"workshop";return"activity";
  }
  return category;
}
function indoorFor(category,subtype,text="") {
  const t=String(text).toLowerCase();
  if(category==="walk")return false;
  if(category==="viewpoint")return subtype==="rooftop"?false:!(/открыт|open.?air/.test(t));
  if(category==="activity"&&["skating"].includes(subtype)&&/парк|открыт|open.?air/.test(t))return false;
  return true;
}
function roughPlaceCost(category,subtype) {
  const specific={breakfast:3000,brunch:3600,gastropub:4300,cocktail:3800,wine:4200,jazz:4200,pottery:3600,painting:3200,cooking:5200,dance:3000,bowling:3000,billiards:2600,vr:3600,quest:4000,climbing:3000,skating:2200,karting:5000,mini_golf:2600,bookstore:0,vinyl:0,market:1000,observation:3000,rooftop:3000,digital:2200};
  return specific[subtype] ?? ({dinner:4800,cafe:1600,bar:3600,dessert:1500,walk:0,viewpoint:2500,art:1700,activity:3200}[category]??2200);
}
function roughDuration(category,subtype) {
  const specific={breakfast:75,brunch:80,pottery:90,painting:80,cooking:100,dance:80,bowling:80,billiards:75,vr:70,quest:80,climbing:85,skating:85,karting:75,mini_golf:70,bookstore:55,vinyl:50,market:60,digital:75,observation:60,rooftop:55};
  return specific[subtype] ?? ({dinner:90,cafe:55,bar:75,dessert:50,walk:60,viewpoint:60,art:75,activity:85,event:100}[category]??70);
}

function vibesFor(category,text="") {
  const base={dinner:["romantic","calm"],cafe:["calm","romantic"],bar:["fun","romantic"],dessert:["romantic","calm","fun"],walk:["romantic","calm","active"],viewpoint:["romantic","unusual"],art:["calm","unusual","romantic"],activity:["fun","unusual","active"],event:["fun","unusual"]}[category]||["calm"];
  const result=[...base],t=text.toLowerCase();
  for (const [regex,vibe] of [[/роман|любов|свидан/,"romantic"],[/интерактив|иммерсив|необыч|мультимед|секрет/,"unusual"],[/спорт|актив|игр|квест|танц/,"active"],[/стендап|комед|вечерин|игр/,"fun"],[/тих|камер|уют|спокой/,"calm"]]) if(regex.test(t)&&!result.includes(vibe))result.push(vibe);
  return result.slice(0,5);
}
function trimText(value,max=240) { const text=String(value||"").replace(/\s+/g," ").trim(); return text.length>max?`${text.slice(0,max-1).trim()}…`:text; }
function isHTTP(value) { try { const u=new URL(value); return u.protocol==="http:"||u.protocol==="https:"; } catch { return false; } }
function concreteKudaGo(value) {
  if(!isHTTP(value))return null; const u=new URL(value);
  if(!u.hostname.endsWith("kudago.com"))return value;
  return /^\/msk\/(place|event)\/[^/]+\/?$/.test(u.pathname)?value:null;
}

const DAY_INDEX={"вс":0,"пн":1,"вт":2,"ср":3,"чт":4,"пт":5,"сб":6};
function daysFromExpr(expr=""){
  const cleaned=expr.toLowerCase().replace(/ё/g,"е");
  if(/ежеднев|каждый день/.test(cleaned))return[0,1,2,3,4,5,6];
  const tokens=Object.keys(DAY_INDEX),out=new Set();
  const range=cleaned.match(/(пн|вт|ср|чт|пт|сб|вс)\s*[–—-]\s*(пн|вт|ср|чт|пт|сб|вс)/);
  if(range){let d=DAY_INDEX[range[1]],end=DAY_INDEX[range[2]];out.add(d);while(d!==end){d=(d+1)%7;out.add(d);if(out.size>7)break;}}
  for(const token of tokens)if(new RegExp(`(^|[^а-я])${token}([^а-я]|$)`).test(cleaned))out.add(DAY_INDEX[token]);
  return[...out];
}
function parseTimetable(value=""){
  const text=String(value||"").toLowerCase().replace(/ё/g,"е").replace(/—/g,"–");
  if(!text.trim())return null;
  if(/круглосуточ/.test(text))return Object.fromEntries([0,1,2,3,4,5,6].map((d)=>[d,[["00:00","23:59"]]]));
  const result={};
  const re=/(ежедневно|(?:(?:пн|вт|ср|чт|пт|сб|вс)(?:\s*[–-]\s*(?:пн|вт|ср|чт|пт|сб|вс))?(?:\s*,\s*(?:пн|вт|ср|чт|пт|сб|вс))*))\s+(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/g;
  let match;
  while((match=re.exec(text))){
    const days=daysFromExpr(match[1]);if(!days.length)continue;
    const norm=(x)=>{const [h,m]=x.split(":");return`${String(Number(h)).padStart(2,"0")}:${m}`;};
    for(const day of days){if(!result[day])result[day]=[];result[day].push([norm(match[2]),norm(match[3])]);}
  }
  return Object.keys(result).length?result:null;
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
  const rawText=`${textOf(p.categories||[])} ${textOf(p.tags||[])} ${p.title||""} ${p.description||""}`;
  const category=classifyPlace(p.categories||[],p.title,p.description); if(!category||!knownCategories.has(category)||p.is_closed||!validCoords(p.coords))return null;
  const subtype=classifySubtype(category,rawText);
  return {id:`kudago-place-${p.id}`,title:p.title,category,subtype,zone:nearestZone(p.coords),address:p.address||(p.subway?`метро ${p.subway}`:"Москва"),costForTwo:roughPlaceCost(category,subtype),costEstimated:true,duration:roughDuration(category,subtype),indoor:indoorFor(category,subtype,rawText),includesFood:["dinner","cafe","dessert"].includes(category),vibes:vibesFor(category,rawText),quality:Math.min(9.7,7+Math.log10(1+(p.favorites_count||0))*.58),description:trimText(p.description),timetable:p.timetable||null,weeklyHours:parseTimetable(p.timetable),image:p.images?.[0]?.image||null,coords:p.coords||null,source:"KudaGo API",sourceUrl:concreteKudaGo(p.site_url),officialUrl:isHTTP(p.foreign_url)?p.foreign_url:null};
}
function balancePlaces(items) {
  const categoryGroups=new Map(); for(const item of items){if(!categoryGroups.has(item.category))categoryGroups.set(item.category,[]);categoryGroups.get(item.category).push(item);}
  const selected=[];
  for(const category of knownCategories){
    const group=(categoryGroups.get(category)||[]).sort((a,b)=>b.quality-a.quality),subtypeCounts=new Map();
    for(const item of group){
      const count=subtypeCounts.get(item.subtype)||0;
      if(count>=PER_SUBTYPE)continue;
      selected.push(item);subtypeCounts.set(item.subtype,count+1);
      if([...subtypeCounts.values()].reduce((a,b)=>a+b,0)>=PER_CATEGORY)break;
    }
  }
  return selected.sort((a,b)=>b.quality-a.quality);
}
function eventCategory(categories=[],title="") {
  const text=`${textOf(categories)} ${title}`.toLowerCase(); if(/exhibition|выстав/.test(text))return"exhibition";if(/concert|концерт|music/.test(text))return"concert";if(/theater|theatre|театр|спектак/.test(text))return"theater";if(/standup|comedy|стендап/.test(text))return"standup";if(/lecture|лекц/.test(text))return"lecture";if(/excursion|экскурс/.test(text))return"excursion";if(/festival|фестив/.test(text))return"festival";if(/cinema|movie|film|кино|показ/.test(text))return"movie";if(/party|вечерин/.test(text))return"party";if(/show|шоу/.test(text))return"show";return"event";
}
function moscowParts(timestamp){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Moscow",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(timestamp*1000));
  const get=(type)=>parts.find((p)=>p.type===type)?.value;return{date:`${get("year")}-${get("month")}-${get("day")}`,time:`${get("hour")}:${get("minute")}`};
}
function normalizeISODate(value=""){
  const match=String(value||"").trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if(!match)return null;
  const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
  const date=new Date(Date.UTC(year,month-1,day));
  if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
  return String(year)+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
}
function normalizeClock(value=""){
  const match=String(value||"").trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if(!match)return null;
  const hour=Number(match[1]),minute=Number(match[2]);
  if(hour<0||hour>23||minute<0||minute>59)return null;
  return String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0');
}
const IMPORT_NOW=Math.floor(Date.now()/1000);
const WINDOW_START=moscowParts(IMPORT_NOW).date;
const WINDOW_END=moscowParts(IMPORT_NOW+60*24*60*60).date;
function inImportWindow(date){return Boolean(date&&date>=WINDOW_START&&date<=WINDOW_END);}
function normalizeDates(dates=[]) {
  const clean=dates.filter((d)=>d?.start||d?.start_date);
  const exactDates=new Set(),occurrences={},ranges=[];
  const addOccurrence=(date,time)=>{if(!inImportWindow(date))return;exactDates.add(date);if(time){if(!occurrences[date])occurrences[date]=[];if(!occurrences[date].includes(time))occurrences[date].push(time);}};
  for(const d of clean){
    const startParts=d.start?moscowParts(d.start):null,endParts=d.end?moscowParts(d.end):null;
    const startDate=normalizeISODate(d.start_date)||startParts?.date||null,endDate=normalizeISODate(d.end_date)||endParts?.date||startDate;
    const startTime=normalizeClock(d.start_time)||normalizeClock(startParts?.time)||null;
    if(!startDate)continue;
    const spanDays=endDate?Math.round((new Date(`${endDate}T12:00:00`)-new Date(`${startDate}T12:00:00`))/86400000):0;
    if(spanDays>=1){if(endDate<WINDOW_START||startDate>WINDOW_END)continue;ranges.push([startDate<WINDOW_START?WINDOW_START:startDate,endDate>WINDOW_END?WINDOW_END:endDate]);continue;}
    addOccurrence(startDate,startTime);
  }
  const result={};
  const exact=[...exactDates].sort();
  if(exact.length)result.exactDates=exact;
  if(Object.keys(occurrences).length){for(const value of Object.values(occurrences))value.sort();result.occurrences=occurrences;}
  if(ranges.length){result.activeFrom=ranges.map((x)=>x[0]).sort()[0];result.activeUntil=ranges.map((x)=>x[1]).sort().at(-1);}
  return result;
}
function normalizeEvent(e) {
  const place=e.place||{},pricing=parsePrice(e.price||"",e.is_free),type=eventCategory(e.categories||[],e.title||""),categoryText=textOf(e.categories).toLowerCase();
  if(!validCoords(place.coords)) return null;
  return {id:`kudago-event-${e.id}`,title:e.short_title||e.title,category:"event",subtype:type,eventType:type,zone:nearestZone(place.coords),address:place.address||place.title||"Москва",costForTwo:pricing.value,costEstimated:pricing.estimated,duration:type==="exhibition"?80:type==="theater"?130:type==="concert"?110:type==="standup"?100:type==="lecture"?90:type==="excursion"?100:type==="movie"?120:type==="party"?120:105,indoor:!(/festival|excursion|open-air/.test(categoryText)),vibes:vibesFor("event",`${e.title||""} ${e.description||""}`),quality:Math.min(9.8,7.2+Math.log10(1+(e.favorites_count||0))*.58),description:trimText(e.description),...normalizeDates(e.dates||[]),image:e.images?.[0]?.image||null,coords:place.coords||null,source:"KudaGo API",sourceUrl:concreteKudaGo(e.site_url),officialUrl:null};
}
function uniqueById(items){const map=new Map();for(const item of items)if(item?.id&&!map.has(item.id))map.set(item.id,item);return[...map.values()];}

const now=IMPORT_NOW,until=now+60*24*60*60;
console.log(`Fetching KudaGo data for ${CITY}: up to ${PLACE_PAGES*100} places and ${EVENT_PAGES*100} events...`);
const rawPlaces=await fetchPages("/places/",{location:CITY,order_by:"-favorites_count",text_format:"text",fields:"id,title,slug,address,coords,subway,site_url,foreign_url,categories,tags,timetable,is_closed,images,favorites_count,description",expand:"images"},PLACE_PAGES);
const rawEvents=await fetchPages("/events/",{location:CITY,actual_since:now,actual_until:until,order_by:"-favorites_count",text_format:"text",fields:"id,title,short_title,dates,place,description,categories,age_restriction,price,is_free,images,favorites_count,site_url",expand:"place,dates,images"},EVENT_PAGES);
const places=balancePlaces(uniqueById(rawPlaces.map(normalizePlace).filter(Boolean)));
const events=uniqueById(rawEvents.map(normalizeEvent).filter((e)=>e?.title&&(e.exactDates?.length||e.activeFrom||e.activeUntil)));
const categoryCounts=Object.fromEntries([...knownCategories].map((category)=>[category,places.filter((item)=>item.category===category).length]));
const subtypeCounts=Object.fromEntries([...new Set(places.map((x)=>x.subtype))].sort().map((subtype)=>[subtype,places.filter((x)=>x.subtype===subtype).length]));
const updatedAt=new Date().toISOString();
const meta={updatedAt,city:CITY,source:"KudaGo public API",rawPlaces:rawPlaces.length,rawEvents:rawEvents.length,places:places.length,events:events.length,categoryCounts,subtypeCounts,concretePlaceLinks:places.filter((x)=>x.sourceUrl||x.officialUrl).length,concreteEventLinks:events.filter((x)=>x.sourceUrl).length};
const js=`// Generated automatically from the KudaGo public API. Do not edit manually.\nexport const kudagoPlaces = ${JSON.stringify(places,null,2)};\n\nexport const kudagoEvents = ${JSON.stringify(events,null,2)};\n\nexport const kudagoMeta = ${JSON.stringify(meta,null,2)};\n`;
await writeFile(OUT,js,"utf8");
console.log(`Saved ${places.length} balanced places and ${events.length} current events to ${OUT}`);
console.log("Category counts:",categoryCounts);
