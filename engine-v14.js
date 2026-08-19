import * as base from "./engine.js?base=final2";

const CENTER={lat:55.7558,lon:37.6173};
const RADIUS_KM=30;
const GENERIC=new Set(["сеть","ресторан","ресторанов","кафе","кофейня","кофеен","бар","баров","паб","бистро","клуб","клубов","гастробар","пиццерия","кондитерская","restaurant","cafe","coffee","bar","pub","bistro","club"]);
function key(value=""){const text=String(value).toLowerCase().replace(/ё/g,"е").replace(/[«»“”„"']/g,"").replace(/[.,:;!?–—/\\-]+/g," ").replace(/\s+/g," ").trim();const tokens=text.split(/\s+/).filter((x)=>x.length>1&&!GENERIC.has(x));return tokens.join(" ")||text;}
function coords(item){const a=item?.coords?.lat,b=item?.coords?.lon;if(a==null||b==null)return null;const lat=Number(a),lon=Number(b);if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat===0||lon===0||Math.abs(lat)>90||Math.abs(lon)>180)return null;return {lat,lon};}
function distanceKm(a,b){const R=6371,r=(x)=>x*Math.PI/180,dp=r(b.lat-a.lat),dl=r(b.lon-a.lon),q=Math.sin(dp/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.sqrt(q));}
function live(item){return String(item?.id||"").startsWith("kudago-");}
function titleSane(item){const t=String(item?.title||"").toLowerCase().replace(/ё/g,"е");if(/^\s*сеть\s+/.test(t)&&(!item.address||/^(москва|центр москвы)$/i.test(String(item.address))))return false;if(/детск(?:ий|ая|ое|ие)|для детей/i.test(t))return false;if(item.category==="event"&&(/^\d[\d\s./-]*$/.test(t)||t.replace(/[^a-zа-я0-9]/gi,"").length<4))return false;if(item.category==="cafe"&&/(собор|храм|церков|музей|галере|парк|сад|театр|стадион)/i.test(t))return false;if(item.category==="bar"&&/(парк|сад|музей|галере|собор|храм|церков|стадион)/i.test(t))return false;if(item.category==="dinner"&&/(парк|сад|музей|галере|собор|храм|церков|стадион)/i.test(t)&&!/(ресторан|кафе|бистро|гастро)/i.test(t))return false;if(item.category==="dessert"&&/(фабрик|завод|парк|сад|музей|галере|театр|трц|торгов)/i.test(t)&&!/(кондитер|десерт|морож|джелат|шоколадн|пекар|cake|gelato)/i.test(t))return false;return true;}
function validLive(item){const c=coords(item);return Boolean(c&&distanceKm(CENTER,c)<=RADIUS_KM&&titleSane(item));}
function selectSource(items,minimum){const liveItems=items.filter(live).filter(validLive);return liveItems.length>=minimum?liveItems:items.filter((x)=>!live(x)||validLive(x));}
function prepare(items,filters,minimum,anchorItem=null){const original=items||[],idKey=new Map(original.map((x)=>[x.id,key(x.title)]));const recentIds=new Set(filters?.recentlyShownItemIds||[]);const recentKeys=new Set([...recentIds].map((id)=>idKey.get(id)).filter(Boolean));for(const k of filters?.recentlyShownItemKeys||[])recentKeys.add(k);const anchorKey=anchorItem?key(anchorItem.title):(filters?.anchorItem?key(filters.anchorItem.title):null);const source=selectSource(original,minimum).filter((x)=>anchorKey===key(x.title)||!recentKeys.has(key(x.title)));const best=new Map();for(const item of source){const k=key(item.title),prev=best.get(k);const score=(item.sourceUrl||item.officialUrl?10:0)+Number(item.quality||0);const prevScore=prev?((prev.sourceUrl||prev.officialUrl?10:0)+Number(prev.quality||0)):-Infinity;if(!prev||score>prevScore)best.set(k,item);}return [...best.values()];}
function guardedArgs(args){const filters=args?.filters||{},anchorItem=args?.anchorItem||null;return {...args,places:prepare(args?.places||[],filters,100,anchorItem),events:prepare(args?.events||[],filters,30,anchorItem)};}
export function generateDates(args){return base.generateDates(guardedArgs(args));}
export function replacePlanItem(args){return base.replacePlanItem(guardedArgs(args));}
export const planRows=base.planRows;
export const formatMoney=base.formatMoney;
export const formatDuration=base.formatDuration;
export const estimateScenarioCount=base.estimateScenarioCount;
export const auditPlanConstraints=base.auditPlanConstraints;
export const auditPlanGeography=base.auditPlanGeography;
