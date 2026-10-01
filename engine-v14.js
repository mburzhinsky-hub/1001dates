import * as base from "./engine.js?base=duration5&nearby=1&audit=1";

const CENTER={lat:55.7558,lon:37.6173};
const RADIUS_KM=30;
const GENERIC=new Set(["сеть","ресторан","ресторанов","кафе","кофейня","кофеен","бар","баров","паб","бистро","клуб","клубов","гастробар","пиццерия","кондитерская","restaurant","cafe","coffee","bar","pub","bistro","club"]);
const GENERIC_TITLE=/^(?:торговый центр|торгово-развлекательный центр|торговый комплекс|трц|тц|развлекательный центр|культурный центр|арт[- ]?пространство|пространство|центр|кафе|кофейня|ресторан|бар|паб|парк|сад|музей|галерея|выставка|театр|кинотеатр|клуб)$/i;
const COVER_WEIGHT={art:11,viewpoint:10,activity:9,dinner:8,dessert:7,cafe:6,walk:5,event:3,bar:3};
const VIBE_WORD={romantic:"романтичный",fun:"весёлый",unusual:"необычный",calm:"спокойный",active:"активный"};
const CATEGORY_LABEL={art:"искусство",viewpoint:"панорама",activity:"активность",dinner:"ужин",dessert:"десерт",cafe:"кофе",walk:"прогулка",event:"событие",bar:"бар"};
const LIVE_MIN={dinner:18,cafe:8,bar:8,dessert:6,walk:30,viewpoint:8,art:30,activity:30};
const FIXED_EVENT_TYPES=new Set(["concert","theater","standup","show","movie","lecture","excursion","party"]);

function key(value=""){const text=String(value).toLowerCase().replace(/ё/g,"е").replace(/[«»“”„"']/g,"").replace(/[.,:;!?–—/\\-]+/g," ").replace(/\s+/g," ").trim();const tokens=text.split(/\s+/).filter((x)=>x.length>1&&!GENERIC.has(x));return tokens.join(" ")||text;}
function cleanTitle(value=""){return String(value).toLowerCase().replace(/ё/g,"е").replace(/[«»“”„"']/g,"").replace(/[.,:;!?–—/\\]+/g," ").replace(/\s+/g," ").trim();}
function coords(item){const a=item?.coords?.lat,b=item?.coords?.lon;if(a==null||b==null)return null;const lat=Number(a),lon=Number(b);if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat===0||lon===0||Math.abs(lat)>90||Math.abs(lon)>180)return null;return {lat,lon};}
function distanceKm(a,b){const R=6371,r=(x)=>x*Math.PI/180,dp=r(b.lat-a.lat),dl=r(b.lon-a.lon),q=Math.sin(dp/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.sqrt(q));}
function live(item){return String(item?.id||"").startsWith("kudago-");}
function semanticBar(item){const t=cleanTitle(item?.title||"");return item?.category==="bar"||/(^|\s)(бар|паб|pub|bar)(\s|$)|гастробар|пивная|cocktail bar|wine bar/i.test(t);}
function titleSane(item){const t=cleanTitle(item?.title||"");if(!t||GENERIC_TITLE.test(t))return false;if(/^сеть\s+/.test(t)&&(!item.address||/^(москва|центр москвы)$/i.test(String(item.address))))return false;if(/детск(?:ий|ая|ое|ие)|для детей|для малышей/i.test(t))return false;if(item.category==="event"&&(/^\d[\d\s./-]*$/.test(t)||t.replace(/[^a-zа-я0-9]/gi,"").length<4))return false;if(item.category==="cafe"&&/(собор|храм|церков|музей|галере|парк|сад|театр|стадион|торгов)/i.test(t))return false;if(item.category==="bar"&&/(парк|сад|музей|галере|собор|храм|церков|стадион|торгов)/i.test(t))return false;if(item.category==="dinner"&&/(парк|сад|музей|галере|собор|храм|церков|стадион|торгов)/i.test(t)&&!/(ресторан|кафе|бистро|гастро)/i.test(t))return false;if(item.category==="dessert"&&/(фабрик|завод|парк|сад|музей|галере|театр|трц|торгов)/i.test(t)&&!/(кондитер|десерт|морож|джелат|шоколадн|пекар|cake|gelato)/i.test(t))return false;return true;}
function validLive(item){const c=coords(item);return Boolean(titleSane(item)&&c&&distanceKm(CENTER,c)<=RADIUS_KM);}
function normalizeDashes(value=""){return String(value).replace(/[−–—]/g,"-").replace(/\s*;\s*/g," ");}

function parseRuntimeTimetable(value=""){
  const text=normalizeDashes(value).toLowerCase().replace(/ё/g,"е").replace(/\s+/g," ").trim();
  if(!text)return null;
  const allDay=/круглосуточ|24\s*час|весь день/.test(text);
  if(allDay)return Object.fromEntries([0,1,2,3,4,5,6].map(d=>[d,[["00:00","23:59"]]]));
  const D={вс:0,пн:1,вт:2,ср:3,чт:4,пт:5,сб:6},out={};
  const expandDays=(expr)=>{
    if(/ежеднев|каждый день/.test(expr))return[0,1,2,3,4,5,6];
    const set=new Set(),range=expr.match(/(пн|вт|ср|чт|пт|сб|вс)\s*-\s*(пн|вт|ср|чт|пт|сб|вс)/);
    if(range){let x=D[range[1]],end=D[range[2]];set.add(x);while(x!==end){x=(x+1)%7;set.add(x);if(set.size>7)break;}}
    for(const k of Object.keys(D))if(new RegExp(`(^|[^а-я])${k}([^а-я]|$)`).test(expr))set.add(D[k]);
    return[...set];
  };
  const re=/(ежедневно|(?:(?:пн|вт|ср|чт|пт|сб|вс)(?:\s*-\s*(?:пн|вт|ср|чт|пт|сб|вс))?(?:\s*,\s*(?:пн|вт|ср|чт|пт|сб|вс))*))\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/g;
  let m;
  while((m=re.exec(text))){
    const days=expandDays(m[1]),norm=x=>{const[a,b]=x.split(":");return `${String(Number(a)).padStart(2,"0")}:${b}`;};
    for(const day of days){out[day]??=[];out[day].push([norm(m[2]),norm(m[3])]);}
  }
  return Object.keys(out).length?out:null;
}
function repairItem(item){
  let fixed={...item};
  const title=cleanTitle(fixed.title||"");
  if(/(^|\s)(парк|сад)(\s|$)/i.test(title)&&!/(виртуаль|vr|развлеч|аква|зоопарк|аттрак|музей|галере|ресторан|кафе|бар)/i.test(title)&&!["walk","viewpoint"].includes(fixed.category))fixed={...fixed,category:"walk",subtype:"park",indoor:false,includesFood:false};
  if(/аква(?:комплекс|парк)|водных развлечений|бассейн|water park/i.test(title))fixed={...fixed,category:"activity",subtype:"water",indoor:true,includesFood:false};
  if(fixed.category==="art"&&/(собор|храм|церков|монастыр)/i.test(title))fixed={...fixed,category:"walk",subtype:"architecture",indoor:false,includesFood:false,costForTwo:0,costEstimated:false};
  if(fixed.category==="viewpoint"&&/мост/i.test(title))fixed={...fixed,costForTwo:0,costEstimated:false,indoor:false};
  if(semanticBar(fixed)&&["dinner","cafe"].includes(fixed.category))fixed={...fixed,category:"bar",subtype:/винн|wine/i.test(fixed.title||"")?"wine":/джаз|piano|пиано/i.test(fixed.title||"")?"jazz":"cocktail",includesFood:false};
  if(!fixed.weeklyHours&&String(fixed.timetable||"").trim()){
    const parsed=parseRuntimeTimetable(fixed.timetable);
    fixed={...fixed,weeklyHours:parsed||null,scheduleConfidence:parsed?"parsed_runtime":"parse_failed"};
  } else if(fixed.weeklyHours) fixed={...fixed,scheduleConfidence:"known"};
  else fixed={...fixed,scheduleConfidence:"unknown"};
  return fixed;
}
function preparePlaces(items,filters,anchorItem=null){
  const repaired=(items||[]).map(repairItem).filter(titleSane);
  const liveValid=repaired.filter(live).filter(validLive),fallback=repaired.filter(x=>!live(x));
  const categories=new Set([...liveValid.map(x=>x.category),...fallback.map(x=>x.category)]);
  let source=[];
  for(const category of categories){
    const liveCat=liveValid.filter(x=>x.category===category),fallbackCat=fallback.filter(x=>x.category===category);
    source.push(...liveCat);
    if(liveCat.length<(LIVE_MIN[category]||8))source.push(...fallbackCat);
  }
  const recentIds=new Set(filters?.recentlyShownItemIds||[]),idKey=new Map(repaired.map(x=>[x.id,key(x.title)])),recentKeys=new Set([...recentIds].map(id=>idKey.get(id)).filter(Boolean));
  const anchorKey=anchorItem?key(anchorItem.title):null;
  source=source.filter(x=>anchorKey===key(x.title)||(!recentIds.has(x.id)&&!recentKeys.has(key(x.title))));
  const best=new Map();
  for(const item of source){const k=`${item.category}:${key(item.title)}`,prev=best.get(k);const score=(live(item)?20:0)+(item.sourceUrl||item.officialUrl?10:0)+Number(item.quality||0);const prevScore=prev?((live(prev)?20:0)+(prev.sourceUrl||prev.officialUrl?10:0)+Number(prev.quality||0)):-Infinity;if(!prev||score>prevScore)best.set(k,item);}
  return[...best.values()];
}
function eventHasUsableTime(item){
  const type=item?.eventType||item?.subtype;
  if(!FIXED_EVENT_TYPES.has(type))return true;
  if(item?.occurrences&&Object.values(item.occurrences).some(v=>Array.isArray(v)&&v.length))return true;
  return Array.isArray(item?.startTimes)&&item.startTimes.length>0;
}
function prepareEvents(items,filters,anchorItem=null){
  const repaired=(items||[]).map(repairItem).filter(titleSane).filter(eventHasUsableTime);
  const liveValid=repaired.filter(live).filter(validLive),fallback=repaired.filter(x=>!live(x));
  const source=liveValid.length>=30?liveValid:[...liveValid,...fallback];
  const recentIds=new Set(filters?.recentlyShownItemIds||[]),anchorKey=anchorItem?key(anchorItem.title):null,best=new Map();
  for(const item of source){
    if(anchorKey!==key(item.title)&&recentIds.has(item.id))continue;
    const k=key(item.title),prev=best.get(k),score=(live(item)?20:0)+(item.sourceUrl?10:0)+Number(item.quality||0),prevScore=prev?((live(prev)?20:0)+(prev.sourceUrl?10:0)+Number(prev.quality||0)):-Infinity;
    if(!prev||score>prevScore)best.set(k,item);
  }
  return[...best.values()];
}
function guardedArgs(args){const filters=args?.filters||{},anchorItem=args?.anchorItem||null;return {...args,places:preparePlaces(args?.places||[],filters,anchorItem),events:prepareEvents(args?.events||[],filters,anchorItem)};}

function imageSuitable(item){const src=String(item?.image||"");if(!/^https?:\/\//i.test(src)||/logo|poster|banner|afisha|афиш|sprite|icon/i.test(src))return false;return titleSane(item);}
function coverScore(item,filters,index){let score=(COVER_WEIGHT[item?.category]||4)+Math.min(10,Number(item?.quality||0));if((filters?.vibes||[]).some((v)=>item?.vibes?.includes?.(v)))score+=4;if(item?.costEstimated)score-=.5;if(index===0)score+=1;if(/торгов|трц|тц|молл|mall/i.test(String(item?.title||"")))score-=14;return score;}
function chooseCover(plan,filters){const ranked=(plan?.items||[]).map((item,index)=>({item,index,score:coverScore(item,filters,index)})).filter(({item})=>imageSuitable(item)).sort((a,b)=>b.score-a.score);return ranked[0]?.item?.image||(/^https?:\/\//i.test(String(plan?.coverImage||""))?plan.coverImage:null);}
function moodPhrase(filters){const words=(filters?.vibes||[]).slice(0,2).map(v=>VIBE_WORD[v]).filter(Boolean);return words.length?words.join(" и "):"сбалансированный";}
function shortVenueTitle(value="",max=44){const t=String(value).replace(/\s+/g," ").trim();return t.length<=max?t:`${t.slice(0,max-1).trim()}…`;}
function roleFor(plan,index){return String(plan?.template?.slots?.[index]?.role||CATEGORY_LABEL[plan?.items?.[index]?.category]||"глава").replace(/[.]+$/,"");}
function editorialTitle(plan){
  const concept=String(plan?.template?.concept||plan?.template?.label||"Свидание").trim();
  if(concept.length<=48)return concept;
  const labels=(plan?.items||[]).slice(0,2).map(x=>CATEGORY_LABEL[x.category]).filter(Boolean);
  return labels.length?labels.map((x,i)=>i?x:x.charAt(0).toUpperCase()+x.slice(1)).join(" и "):"Свидание в Москве";
}
function editorialStory(plan){
  const items=plan?.items||[],usedRoots=new Set();
  const fallbackRole=(item)=>({
    art:"посмотреть и обсудить",walk:"пройтись и поговорить",viewpoint:"поймать красивый вид",
    cafe:"сделать паузу за кофе",dessert:"оставить сладкий финал",dinner:"поужинать и поговорить",
    bar:"продолжить вечер",activity:"заняться чем-то вдвоём",event:"попасть на событие"
  })[item?.category]||"продолжить маршрут";
  const freshRole=(item,index)=>{
    let role=roleFor(plan,index);
    for(const [root,re] of [["спеш",/спеш/i],["вмест",/вмест/i]]){
      if(re.test(role)&&usedRoots.has(root))role=fallbackRole(item);
      if(re.test(role))usedRoots.add(root);
    }
    return role;
  };
  const parts=items.map((item,index)=>`${freshRole(item,index)} — ${shortVenueTitle(item.title)}`);
  if(parts.length===0)return"Маршрут собран под ваши условия.";
  if(parts.length===1)return`${parts[0]}.`;
  if(parts.length===2)return`Сначала ${parts[0]}. Затем ${parts[1]}.`;
  return`Сначала ${parts[0]}. Затем ${parts.slice(1,-1).join(". После этого ")}. Финал — ${parts.at(-1)}.`;
}
function editorialWhy(plan,filters){
  const bits=[];
  bits.push(`${moodPhrase(filters).replace(/^./,x=>x.toUpperCase())} вариант на ${base.formatDuration(plan.totalMinutes)}`);
  const estimated=plan.items?.some(x=>x.costEstimated),cost=base.formatMoney(plan.totalCost);
  bits.push(`${estimated?"ориентир по бюджету":"бюджет"} — ${estimated?"≈ ":""}${cost}`);
  if(plan.items?.some(x=>x.category==="event"))bits.push("в маршруте есть актуальное событие на выбранную дату");
  if(filters?.indoorOnly)bits.push("все главы проходят в помещении");
  if(filters?.noBars)bits.push("без баров");
  if(filters?.food===false)bits.push("без обязательной гастрономической главы");
  if(plan.geo?.maxSpanKm!=null&&plan.geo.maxSpanKm>0)bits.push(`маршрут компактный: до ${plan.geo.maxSpanKm.toFixed(1)} км между крайними точками`);
  return `${bits.join(". ")}.`;
}
function enrichPlan(plan,filters){if(!plan)return plan;return {...plan,title:editorialTitle(plan),coverImage:chooseCover(plan,filters),why:editorialWhy(plan,filters),story:editorialStory(plan)};}

export function generateDates(args){
  const guarded=guardedArgs(args),filters=guarded.filters||{},used=new Set();
  return base.generateDates(guarded).map((plan)=>{
    let enriched=enrichPlan(plan,filters),title=enriched.title;
    if(used.has(title)){
      const hint=CATEGORY_LABEL[enriched.items?.[0]?.category]||shortVenueTitle(enriched.items?.[0]?.title||"",24);
      title=`${title} — ${hint}`;
    }
    used.add(title);
    return {...enriched,title};
  });
}
function nearbyDistanceSummary(plan,origin,radiusKm){
  const distances=(plan?.items||[]).map(item=>{const c=coords(item);return c?distanceKm(origin,c):null}).filter(Number.isFinite);
  if(!distances.length)return null;
  return {
    radiusKm,
    startDistanceKm:distances[0],
    maxOriginDistanceKm:Math.max(...distances),
    averageOriginDistanceKm:distances.reduce((sum,value)=>sum+value,0)/distances.length
  };
}
export function generateNearbyDates(args){
  const origin=args?.origin;
  if(!origin||!Number.isFinite(Number(origin.lat))||!Number.isFinite(Number(origin.lon)))return {plans:[],radiusKm:null};
  const cleanOrigin={lat:Number(origin.lat),lon:Number(origin.lon)};
  const radii=Array.isArray(args?.radii)&&args.radii.length?args.radii:[2,4,6];
  let bestPlans=[],bestRadius=null;
  for(const radiusKm of radii){
    const filters={...(args.filters||{}),zone:"any",nearbyOrigin:cleanOrigin,nearbyRadiusKm:Number(radiusKm)};
    const plans=generateDates({...args,filters,count:args.count||3,anchorItem:null})
      .map(plan=>({...plan,nearby:nearbyDistanceSummary(plan,cleanOrigin,Number(radiusKm))}));
    if(plans.length>bestPlans.length){bestPlans=plans;bestRadius=Number(radiusKm)}
    if(plans.length>=(args.count||3))return {plans,radiusKm:Number(radiusKm)};
  }
  return {plans:bestPlans,radiusKm:bestRadius};
}
export function replacePlanItem(args){const guarded=guardedArgs(args),filters=guarded.filters||{};return enrichPlan(base.replacePlanItem(guarded),filters);}
export const planRows=base.planRows;
export const formatMoney=base.formatMoney;
export const formatDuration=base.formatDuration;
export const estimateScenarioCount=base.estimateScenarioCount;
export const auditPlanConstraints=base.auditPlanConstraints;
export const auditPlanGeography=base.auditPlanGeography;
export const repairScenarioItem=repairItem;
