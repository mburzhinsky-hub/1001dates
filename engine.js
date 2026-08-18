import { scenarioBlueprints } from "./data/scenarios.js";

const FOOD_CATEGORIES = new Set(["cafe", "dessert", "dinner"]);

const SUBTYPE_LABELS = Object.freeze({
  coffee:"Кофе", tea:"Чайная", bakery:"Пекарня", pastry:"Кондитерская", icecream:"Мороженое", chocolate:"Десерт",
  gallery:"Галерея", museum:"Музей", contemporary:"Современное искусство", digital:"Мультимедиа", photo:"Фотография", science:"Наука",
  park:"Парк", waterfront:"Прогулка у воды", architecture:"Городская прогулка",
  observation:"Смотровая", rooftop:"Крыша / терраса",
  workshop:"Мастер-класс", pottery:"Керамика", painting:"Рисование", cooking:"Кулинарный класс", dance:"Танцы",
  games:"Игры", bowling:"Боулинг", billiards:"Бильярд", vr:"VR", quest:"Квест", karaoke:"Караоке",
  climbing:"Скалодром", skating:"Катание", karting:"Картинг", mini_golf:"Мини-гольф", bookstore:"Книжный", vinyl:"Винил", market:"Маркет",
  restaurant:"Ресторан", casual:"Ресторан", gastropub:"Гастробар", breakfast:"Завтрак", brunch:"Бранч",
  cocktail:"Коктейльный бар", wine:"Винный бар", jazz:"Бар с музыкой",
  concert:"Концерт", theater:"Спектакль", standup:"Стендап", movie:"Кинопоказ", show:"Шоу", exhibition:"Выставка",
  lecture:"Лекция", excursion:"Экскурсия", festival:"Фестиваль", party:"Вечеринка"
});

function slotSpec(value) { return typeof value === "string" ? { select:value } : (value || {select:""}); }
function slotSelector(value) { return String(slotSpec(value).select || ""); }
function slotCategory(value) { return slotSelector(value).split(":")[0]; }
function slotSubtypes(value) {
  const selector=slotSelector(value),index=selector.indexOf(":");
  return index < 0 ? [] : selector.slice(index+1).split("|").filter(Boolean);
}
function slotHasFood(value) { return FOOD_CATEGORIES.has(slotCategory(value)); }
function itemIncludesFood(item) { return FOOD_CATEGORIES.has(item?.category) || Boolean(item?.includesFood); }
function textForSubtype(item) { return `${item?.title || ""} ${item?.description || ""}`.toLowerCase(); }
function inferSubtype(item) {
  if (item?.subtype) return item.subtype;
  if (item?.category === "event") return item.eventType || "event";
  const t=textForSubtype(item);
  if(item?.category === "art"){
    if(/мультимед|digital|immersive|иммерсив|медиа.?арт/.test(t))return"digital";
    if(/фото|photograph/.test(t))return"photo";
    if(/наук|science|планетар|космос|техник/.test(t))return"science";
    if(/современн|contemporary/.test(t))return"contemporary";
    if(/галере|gallery/.test(t))return"gallery";
    return"museum";
  }
  if(item?.category === "walk"){
    if(/набереж|река|озер|пруд|water|river/.test(t))return"waterfront";
    if(/архитект|улиц|переул|бульвар|городск/.test(t))return"architecture";
    return"park";
  }
  if(item?.category === "viewpoint") return /крыша|rooftop|террас/.test(t)?"rooftop":"observation";
  if(item?.category === "cafe"){
    if(/чай|tea/.test(t))return"tea"; if(/пекар|bakery|булоч/.test(t))return"bakery"; return"coffee";
  }
  if(item?.category === "dessert"){
    if(/морож|ice.?cream|gelato/.test(t))return"icecream"; if(/шоколад|chocolate/.test(t))return"chocolate"; return"pastry";
  }
  if(item?.category === "dinner"){
    if(/завтрак|breakfast/.test(t))return"breakfast"; if(/бранч|brunch/.test(t))return"brunch";
    if(/гастробар|gastropub/.test(t))return"gastropub"; if(/кафе|бистро|casual/.test(t))return"casual"; return"restaurant";
  }
  if(item?.category === "bar"){
    if(/винн|wine/.test(t))return"wine"; if(/джаз|jazz|live music|живая музык/.test(t))return"jazz"; return"cocktail";
  }
  if(item?.category === "activity"){
    if(/керами|гончар|potter/.test(t))return"pottery"; if(/рисован|живопис|paint/.test(t))return"painting";
    if(/кулинар|готов|cooking/.test(t))return"cooking"; if(/танц|dance/.test(t))return"dance";
    if(/боулинг|bowling/.test(t))return"bowling"; if(/бильярд|billiard/.test(t))return"billiards";
    if(/караоке|karaoke/.test(t))return"karaoke"; if(/vr|виртуальн/.test(t))return"vr"; if(/квест|quest/.test(t))return"quest";
    if(/скалодром|climb/.test(t))return"climbing"; if(/каток|коньк|skating/.test(t))return"skating"; if(/картинг|karting/.test(t))return"karting";
    if(/мини.?гольф|mini.?golf/.test(t))return"mini_golf"; if(/книж|bookstore/.test(t))return"bookstore"; if(/винил|vinyl/.test(t))return"vinyl";
    if(/маркет|рынок|market/.test(t))return"market"; if(/настоль|игр|game/.test(t))return"games"; if(/мастер.?класс|workshop/.test(t))return"workshop";
    return"activity";
  }
  return item?.category || "place";
}
function placeMatchesSlot(item,value) {
  if (!item || item.category !== slotCategory(value)) return false;
  const allowed=slotSubtypes(value); if(!allowed.length)return true;
  return allowed.includes(inferSubtype(item));
}
function slotLabel(value) {
  const category=slotCategory(value),subtypes=slotSubtypes(value);
  if(subtypes.length===1 && SUBTYPE_LABELS[subtypes[0]])return SUBTYPE_LABELS[subtypes[0]];
  return ({art:"Искусство",walk:"Прогулка",viewpoint:"Красивый вид",cafe:"Кофе",dessert:"Десерт",dinner:"Ресторан",bar:"Бар",activity:"Активность",event:"Событие"})[category] || category;
}
function plannedSlotMinutes(value,item) {
  const spec=slotSpec(value);
  if(spec.useItemDuration || item?.category === "event") return Number(item?.duration || spec.minutes || 60);
  return Number(spec.minutes || item?.duration || 60);
}
const ARCHETYPES = [
  { id:"reliable", label:"Надёжный", kicker:"Красиво, удобно и без экспериментов ради эксперимента." },
  { id:"discovery", label:"Необычный", kicker:"Есть хотя бы одна идея, которую легко было бы не придумать самому." },
  { id:"wow", label:"Вау", kicker:"Самый насыщенный и эмоциональный вариант в ваших условиях." }
];

const TITLE_POOLS = {
  romantic:["Вечер искусства и вкуса","Только для двоих","Город после семи","Красивый повод","Пятничный побег","До самого финала"],
  fun:["План: не скучать","Два билета на вечер","Городское приключение","Выйти из сценария","Нормально придумали","После этого будет что вспомнить"],
  unusual:["Секретный маршрут","Чуть левее привычного","Не как обычно","Другой вечер","Операция «Свидание»","Сценарий с поворотом"],
  calm:["Атмосферный вечер","Медленный вечер","Никуда не спешим","Пауза на двоих","Тихий город","Долго разговаривать"],
  active:["Город в движении","Не сидим дома","Поймать вечер","Дальше интереснее","План с характером","С места в карьер"]
};

const CATEGORY_LABELS = {
  art:"Искусство", walk:"Прогулка", viewpoint:"Красивый вид", cafe:"Кофе", dessert:"Десерт",
  dinner:"Ресторан", bar:"Бар", activity:"Активность", event:"Событие"
};

const CATEGORY_SYMBOLS = {
  art:"◌", walk:"↗", viewpoint:"◇", cafe:"☕", dessert:"✦", dinner:"◐", bar:"◒", activity:"◎", event:"★"
};

const EVENT_TYPE_LABELS = {
  standup:"стендап", concert:"концерт", exhibition:"выставка", show:"шоу", theater:"спектакль", festival:"фестиваль", quest:"квест", event:"событие"
};

const ITEM_DESCRIPTIONS = {
  art:"Место, где тема для разговора появляется сама: можно смотреть, спорить и выбирать любимое.",
  walk:"Свободная глава без программы — побыть рядом, разговаривать и не смотреть на часы.",
  viewpoint:"Визуальный акцент вечера: тот момент, ради которого кажется, что вы действительно куда-то выбрались.",
  cafe:"Лёгкая пауза без длинного застолья — настроиться друг на друга за кофе или чаем.",
  dessert:"Небольшой вкусный финал, чтобы не заканчивать свидание резко.",
  dinner:"Центральная гастрономическая глава — нормальная еда и время спокойно поговорить.",
  bar:"Продолжение для вечера, который не хочется заканчивать сразу после основной программы.",
  activity:"Здесь вы делаете что-то вместе. Совместное действие даёт эмоцию и общий сюжет на весь вечер.",
  event:"Конкретный повод выйти из дома: событие из афиши становится центральным впечатлением свидания."
};

const STORY_PHRASES = {
  art:"посмотреть что-то новое вместе", walk:"оставить время на разговор", viewpoint:"поймать красивый вид на город",
  cafe:"начать легко", dessert:"закончить чем-то вкусным", dinner:"сесть за нормальную еду", bar:"продолжить ещё немного",
  activity:"сделать что-то вместе", event:"попасть на событие, которое происходит сейчас"
};

function unique(values) { return [...new Set(values)]; }
const BASE_VIBES = Object.freeze({
  walk:["calm","romantic","active"], viewpoint:["romantic","unusual","calm"], art:["calm","unusual","romantic"],
  cafe:["calm","romantic"], dessert:["romantic","calm","fun"], dinner:["romantic","calm"], bar:["fun","romantic"],
  activity:["fun","unusual"], event:["fun","unusual"]
});
function effectiveVibes(item){
  const base=BASE_VIBES[item?.category]||[];
  const subtype=inferSubtype(item);
  const extra=["climbing","skating","karting","mini_golf","dance","bowling","billiards","vr","quest","games"].includes(subtype)?["active"]:[];
  return unique([...(item?.vibes||[]),...base,...extra]);
}
function itemHasVibe(item,vibe){return effectiveVibes(item).includes(vibe);}
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function hashString(value="") {
  let hash = 2166136261;
  for (let i=0; i<value.length; i++) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}
function timeToMinutes(value="00:00") {
  const [h,m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
function minutesToTime(value) {
  const day = 24 * 60;
  const normalized = ((value % day) + day) % day;
  return `${String(Math.floor(normalized/60)).padStart(2,"0")}:${String(normalized%60).padStart(2,"0")}`;
}
function dateWithOffset(isoDate,offsetDays){const d=new Date(`${isoDate}T12:00:00`);d.setDate(d.getDate()+offsetDays);return d;}
function openingWindowsFor(item,isoDate,absoluteMinute){
  if(!item?.weeklyHours)return null;
  const dayOffset=Math.floor(absoluteMinute/(24*60));
  const weekday=dateWithOffset(isoDate,dayOffset).getDay();
  const windows=item.weeklyHours[String(weekday)]||item.weeklyHours[weekday]||[];
  return windows.map(([from,to])=>{
    const start=dayOffset*1440+timeToMinutes(from),rawEnd=timeToMinutes(to);
    const end=dayOffset*1440+(rawEnd<=timeToMinutes(from)?rawEnd+1440:rawEnd);
    return[start,end];
  }).sort((a,b)=>a[0]-b[0]);
}
function alignToOpeningHours(item,isoDate,cursor,duration){
  const windows=openingWindowsFor(item,isoDate,cursor);
  if(!windows)return{cursor,wait:0};
  for(const [start,end] of windows){const actual=Math.max(cursor,start);if(actual+duration<=end)return{cursor:actual,wait:Math.max(0,actual-cursor)};}
  return null;
}
export function formatMoney(value) {
  if (!value) return "бесплатно";
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(value))} ₽`;
}
export function formatDuration(minutes) {
  const rounded = Math.max(0, Math.round(minutes / 5) * 5);
  const h = Math.floor(rounded / 60), m = rounded % 60;
  if (!h) return `${m} мин`;
  if (!m) return `${h} ч`;
  return `${h} ч ${m} мин`;
}
function targetFloor(duration) {
  const ratio = duration >= 330 ? .875 : duration >= 220 ? .80 : duration >= 170 ? .82 : .80;
  return Math.floor((duration * ratio) / 5) * 5;
}

// Geography is a hidden feasibility constraint, not part of the displayed date duration.
// We keep the date compact without showing or charging travel minutes to the user.
function normalizedCoords(item) {
  const lat = Number(item?.coords?.lat), lon = Number(item?.coords?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}
function haversineKm(a,b) {
  const ca=normalizedCoords(a), cb=normalizedCoords(b); if(!ca||!cb) return null;
  const R=6371, toRad=(v)=>v*Math.PI/180;
  const dLat=toRad(cb.lat-ca.lat), dLon=toRad(cb.lon-ca.lon);
  const x=Math.sin(dLat/2)**2+Math.cos(toRad(ca.lat))*Math.cos(toRad(cb.lat))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(x));
}
const ROUTE_PROFILES = Object.freeze({
  micro:{maxLegKm:1.9,maxSpanKm:2.8,maxTotalKm:4.2,maxDetour:1.90},
  compact:{maxLegKm:2.8,maxSpanKm:4.2,maxTotalKm:6.8,maxDetour:2.10},
  district:{maxLegKm:3.6,maxSpanKm:5.5,maxTotalKm:9.5,maxDetour:2.25},
  extended:{maxLegKm:4.2,maxSpanKm:6.4,maxTotalKm:11.0,maxDetour:2.40}
});
function geoLimits(filters,template=null) {
  const mode=template?.routeMode || (filters.duration<=130?"micro":filters.duration>=330?"district":"compact");
  return ROUTE_PROFILES[mode] || ROUTE_PROFILES.compact;
}
function fallbackZoneCompatible(a,b) {
  // Coordinate-less fallback data is intentionally strict: one coarse Moscow zone per date.
  return Boolean(a?.zone && b?.zone && a.zone === b.zone);
}
function pairGeographicallyCompatible(a,b,filters,template=null,{span=false}={}) {
  const distance=haversineKm(a,b);
  if (distance === null) return fallbackZoneCompatible(a,b);
  const limits=geoLimits(filters,template);
  return distance <= (span ? limits.maxSpanKm : limits.maxLegKm);
}
function geographicMetrics(items,filters,template=null) {
  if (items.length < 2) return { ok:true,maxLegKm:0,maxSpanKm:0,totalLegKm:0,detourRatio:1,mode:"single" };
  const limits=geoLimits(filters,template);
  let maxLegKm=0,maxSpanKm=0,totalLegKm=0,measuredPairs=0,measuredLegs=0;
  for (let i=1;i<items.length;i++) {
    const distance=haversineKm(items[i-1],items[i]);
    if (distance === null) {
      if (!fallbackZoneCompatible(items[i-1],items[i])) return {ok:false,maxLegKm:null,maxSpanKm:null,totalLegKm:null,detourRatio:null,mode:"zone"};
    } else {
      measuredPairs++; measuredLegs++; totalLegKm += distance; maxLegKm=Math.max(maxLegKm,distance);
      if (!pairGeographicallyCompatible(items[i-1],items[i],filters,template)) return {ok:false,maxLegKm,maxSpanKm,totalLegKm,detourRatio:null,mode:"coords"};
      if (totalLegKm > limits.maxTotalKm) return {ok:false,maxLegKm,maxSpanKm,totalLegKm,detourRatio:null,mode:"coords"};
    }
  }
  for (let i=0;i<items.length;i++) for(let j=i+1;j<items.length;j++) {
    const distance=haversineKm(items[i],items[j]);
    if (distance === null) {
      if (!fallbackZoneCompatible(items[i],items[j])) return {ok:false,maxLegKm:null,maxSpanKm:null,totalLegKm:null,detourRatio:null,mode:"zone"};
    } else {
      measuredPairs++; maxSpanKm=Math.max(maxSpanKm,distance);
      if (!pairGeographicallyCompatible(items[i],items[j],filters,template,{span:true})) return {ok:false,maxLegKm,maxSpanKm,totalLegKm,detourRatio:null,mode:"coords"};
    }
  }
  const detourRatio=maxSpanKm>0&&measuredLegs===items.length-1?totalLegKm/maxSpanKm:1;
  if(items.length>=3&&measuredLegs===items.length-1&&detourRatio>limits.maxDetour) return {ok:false,maxLegKm,maxSpanKm,totalLegKm,detourRatio,mode:"coords"};
  return {ok:true,maxLegKm,maxSpanKm,totalLegKm,detourRatio,mode:measuredPairs?"coords":"zone"};
}
function geographicallyPlausible(items,filters,template=null) { return geographicMetrics(items,filters,template).ok; }
function hiddenTransferMinutes(a,b) {
  const distance=haversineKm(a,b);
  if(distance===null) return fallbackZoneCompatible(a,b)?12:30;
  return Math.round(clamp(7 + distance*3.6, 8, 26));
}
function eventTimesForDate(event,date){
  const dated=event?.occurrences?.[date];
  if(Array.isArray(dated))return dated;
  return Array.isArray(event?.startTimes)?event.startTimes:[];
}
function eventAvailable(event, date) {
  const exact=event.exactDates?.includes(date) || Boolean(event.occurrences?.[date]);
  const inRange=Boolean(event.activeFrom||event.activeUntil) && (!event.activeFrom||date>=event.activeFrom) && (!event.activeUntil||date<=event.activeUntil);
  const hasCalendar=Boolean(event.exactDates?.length || event.occurrences || event.activeFrom || event.activeUntil);
  if(hasCalendar && !exact && !inRange)return false;
  if (event.allowedWeekdays?.length) {
    const weekday = new Date(`${date}T12:00:00`).getDay();
    if (!event.allowedWeekdays.includes(weekday)) return false;
  }
  return hasCalendar || eventTimesForDate(event,date).length>0;
}

function templateTone(template) {
  if (template.adventure >= 3 || (template.usesEvents && template.slots.length >= 4)) return "wow";
  if (template.adventure >= 2 || template.usesEvents || template.slots.some((value)=>slotCategory(value)==="activity")) return "discovery";
  return "reliable";
}
function templateSummary(template) {
  const labels = template.slots.map((value) => slotLabel(value).toLowerCase());
  const route = labels.length <= 2 ? labels.join(" → ") : `${labels.slice(0,-1).join(" → ")} → ${labels.at(-1)}`;
  return `${template.concept}. ${route}.`;
}

const TEMPLATES = scenarioBlueprints.map((blueprint) => {
  const base = {
    ...blueprint,
    hasFood:blueprint.slots.some(slotHasFood),
    hasBar:blueprint.slots.some((value)=>slotCategory(value)==="bar"),
    usesEvents:blueprint.slots.some((value)=>slotCategory(value)==="event")
  };
  const tone = templateTone(base);
  return { ...base, tone, label:blueprint.concept, summary:templateSummary(base) };
});

function templateEligible(template, filters) {
  if (Number(template.duration) !== Number(filters.duration)) return false;
  if (filters.food === false && template.hasFood) return false;
  if (filters.food === true && !template.hasFood) return false;
  if (!filters.useEvents && template.usesEvents) return false;
  if (filters.noBars && template.hasBar) return false;

  // Mood is a real scenario constraint, not just a score decoration.
  const requested = filters.vibes || [];
  if (requested.length && !requested.some((vibe) => template.vibes.includes(vibe))) return false;

  // Adventure control changes which scenario grammar is even eligible.
  const mode = filters.adventure || "balanced";
  if (mode === "safe" && template.adventure > 2) return false;
  if (mode === "wild" && template.adventure < 2) return false;

  const start = timeToMinutes(filters.time || "19:00");
  const daypart = start < 11*60 ? "morning" : start < 17*60 ? "day" : start < 22*60 ? "evening" : "late";
  if (template.dayparts?.length && !template.dayparts.includes(daypart)) return false;
  if(daypart==="morning"){
    const regularMeal=template.slots.some((value)=>slotCategory(value)==="dinner" && !slotSubtypes(value).some((x)=>x==="breakfast"||x==="brunch"));
    if(regularMeal)return false;
  }
  // A bar should not be the result of an early daytime date that ends before late afternoon.
  if (template.hasBar && start + filters.duration < 16 * 60) return false;
  return true;
}

function itemFitsPreferences(item, filters) {
  if (filters.indoorOnly && item.indoor === false) return false;
  if (filters.noBars && item.category === "bar") return false;
  if (filters.food === false && itemIncludesFood(item)) return false;
  if (filters.zone !== "any" && item.zone !== filters.zone) return false;
  if (filters.dislikedItemIds?.includes(item.id)) return false;
  if (filters.avoidVisited && filters.visitedItemIds?.includes(item.id)) return false;
  return true;
}

function candidateScore(item, filters, template) {
  let score = (item.quality ?? 7) * 8;
  const vibeHits = (filters.vibes || []).filter((v) => itemHasVibe(item,v)).length;
  score += vibeHits * 14;
  if (template.vibes.some((v) => itemHasVibe(item,v))) score += 4;
  if (item.image) score += 3;
  if (item.sourceUrl || item.officialUrl) score += 2;
  if (item.costEstimated) score -= 1.5;
  if (filters.likedItemIds?.includes(item.id)) score += 11;
  if (filters.recentlyShownItemIds?.includes(item.id)) score -= 9;
  if (filters.visitedItemIds?.includes(item.id)) score -= 7;

  const adventure = filters.adventure || "balanced";
  const unusual = itemHasVibe(item,"unusual") ? 1 : 0;
  if (adventure === "safe") score += unusual ? -3 : 5;
  if (adventure === "wild") score += unusual ? 10 : -2;
  const targetAdventure = adventure === "safe" ? 1 : adventure === "wild" ? 3 : 2;
  score -= Math.abs((template.adventure || 2) - targetAdventure) * 3;
  return score;
}

function buildPools(template, places, events, filters, anchorItem=null) {
  if(anchorItem){
    if(!itemFitsPreferences(anchorItem,filters))return null;
    if(anchorItem.category==="event"&&!eventAvailable(anchorItem,filters.date))return null;
  }
  const anchorSlot = anchorItem ? template.slots.findIndex((slot) => placeMatchesSlot(anchorItem, slot)) : -1;
  if (anchorItem && anchorSlot < 0) return null;

  return template.slots.map((slot, slotIndex) => {
    if (anchorItem && slotIndex === anchorSlot) return [anchorItem];
    const source = slotCategory(slot) === "event" ? events.filter((event) => eventAvailable(event, filters.date)) : places;
    return source
      .filter((item) => placeMatchesSlot(item, slot))
      .filter((item) => itemFitsPreferences(item, filters))
      .filter((item) => !anchorItem || item.id !== anchorItem.id)
      .sort((a,b) => candidateScore(b, filters, template) - candidateScore(a, filters, template))
      .slice(0, 20);
  });
}

function cartesianLimited(pools, filters, template, limit=180) {
  const result = [];
  function walk(index, acc) {
    if (result.length >= limit) return;
    if (index === pools.length) { result.push(acc.slice()); return; }
    for (const item of pools[index]) {
      if (acc.some((x) => x.id === item.id)) continue;
      acc.push(item);
      // Prune impossible geography immediately instead of wasting the candidate budget on cross-city combinations.
      if (geographicallyPlausible(acc,filters,template)) walk(index+1, acc);
      acc.pop();
      if (result.length >= limit) break;
    }
  }
  walk(0, []);
  return result;
}

function schedulePlan(items, filters, template) {
  const startAt = timeToMinutes(filters.time);
  let cursor = startAt, totalCost = 0, activityMinutes = 0, waitingMinutes = 0, transferMinutes = 0;
  const timeline = [];

  for (let index=0; index<items.length; index++) {
    const item=items[index];
    if(index>0){
      // Hidden routing buffer: used only to make fixed-time events/opening hours feasible.
      // It is never added to the duration shown to the user.
      const transfer=hiddenTransferMinutes(items[index-1],item);
      transferMinutes += transfer;
      cursor += transfer;
    }
    const eventTimes=item.category==="event"?eventTimesForDate(item,filters.date):[];
    let fixedStart=false;
    if (item.category === "event" && eventTimes.length) {
      const possible = eventTimes.map(timeToMinutes).filter((time) => time >= cursor).sort((a,b) => a-b);
      if (!possible.length) return null;
      const fixed = possible[0], wait = fixed - cursor;
      if (wait > 45) return null;
      waitingMinutes += wait; cursor = fixed; fixedStart=true;
    }
    const plannedDuration=plannedSlotMinutes(template.slots[index],item);
    const aligned=alignToOpeningHours(item,filters.date,cursor,plannedDuration);
    if(!aligned)return null;
    if(aligned.wait>45)return null;
    if(aligned.wait){waitingMinutes+=aligned.wait;cursor=aligned.cursor;}
    if (item.openFrom && cursor < timeToMinutes(item.openFrom)) {
      const wait = timeToMinutes(item.openFrom) - cursor;
      if (wait > 45) return null;
      waitingMinutes += wait; cursor = timeToMinutes(item.openFrom);
    }
    if (item.openUntil && cursor + plannedDuration > timeToMinutes(item.openUntil)) return null;

    const start = cursor;
    cursor += plannedDuration;
    activityMinutes += plannedDuration;
    totalCost += item.costForTwo || 0;
    timeline.push({ type:"stop", start, end:cursor, duration:plannedDuration, slot:template.slots[index], item, fixedStart });
  }

  const totalMinutes = activityMinutes;
  if (totalMinutes > filters.duration + 5) return null;
  if (totalMinutes < targetFloor(filters.duration)) return null;
  if (filters.budget < 900000 && totalCost > filters.budget) return null;

  return { timeline, totalMinutes, activityMinutes, waitingMinutes, transferMinutes, elapsedMinutes:cursor-startAt, finishTime:minutesToTime(cursor), totalCost };
}

function moodCoverage(template, items, filters) {
  const requested = filters.vibes || [];
  if (!requested.length) return true;

  // A mood needs a real anchor, not a decorative tag on a dessert or a walk.
  // This is intentionally stricter than scoring: the selected mood describes
  // how the date should feel, so contradictory anchor activities are rejected.
  const activeSubtypes=new Set(["climbing","skating","karting","dance","bowling","vr","quest","karaoke","games"]);
  const loudEventTypes=new Set(["standup","party","show","concert"]);
  const hasActiveAnchor=items.some((item)=>item.category==="activity"&&(itemHasVibe(item,"active")||activeSubtypes.has(inferSubtype(item))));
  const hasFunAnchor=items.some((item)=>["activity","event","bar"].includes(item.category)&&itemHasVibe(item,"fun"));
  const hasUnusualAnchor=items.some((item)=>["art","activity","event","viewpoint"].includes(item.category)&&itemHasVibe(item,"unusual"));
  const calmConflict=items.some((item)=>
    (item.category==="activity"&&(activeSubtypes.has(inferSubtype(item))||item.vibes?.includes("active"))) ||
    (item.category==="event"&&loudEventTypes.has(inferSubtype(item))&&!item.vibes?.includes("calm"))
  );

  if(requested.includes("active")&&!hasActiveAnchor)return false;
  if(requested.includes("fun")&&!hasFunAnchor)return false;
  if(requested.includes("unusual")&&!hasUnusualAnchor)return false;
  if(requested.includes("calm")&&calmConflict)return false;
  return requested.every((vibe)=>items.some((item)=>itemHasVibe(item,vibe)));
}

function geographicCoherence(items,filters,template) {
  const metrics=geographicMetrics(items,filters,template);
  if (!metrics.ok) return -1000;
  if (metrics.mode === "zone") return 16;
  const limits=geoLimits(filters,template);
  const legRatio=metrics.maxLegKm/Math.max(limits.maxLegKm,.1);
  const spanRatio=metrics.maxSpanKm/Math.max(limits.maxSpanKm,.1);
  const routeRatio=metrics.totalLegKm/Math.max(limits.maxTotalKm,.1);
  const detourPenalty=Math.max(0,(metrics.detourRatio||1)-1)*3;
  return 24 - (legRatio*5 + spanRatio*6 + routeRatio*8 + detourPenalty);
}

function planBaseScore(template, items, schedule, filters, variationSeed) {
  let score = 52;
  const vibeHits = template.vibes.filter((v) => filters.vibes?.includes(v)).length;
  score += vibeHits * 9;
  score += items.reduce((sum,item) => sum + candidateScore(item, filters, template), 0) / Math.max(items.length,1) * .55;
  score += geographicCoherence(items,filters,template);

  if (filters.budget >= 900000) score += 4;
  else {
    const budgetRatio = schedule.totalCost / Math.max(filters.budget,1);
    score += 14 - Math.abs(.72 - budgetRatio) * 9;
  }

  const durationRatio = schedule.totalMinutes / filters.duration;
  score += clamp(1 - Math.abs(.94 - durationRatio), 0, 1) * 30;
  if (items.some((item) => item.category === "event")) score += 4;
  if (schedule.waitingMinutes > 30) score -= 3;
  if (schedule.transferMinutes > 55) score -= 4;
  if (items.every((item) => item.sourceUrl || item.officialUrl)) score += 3;

  const signature = `${template.id}|${items.map((x) => x.id).join("|")}|${variationSeed}`;
  score += (hashString(signature) % 1000) / 1000 * 7;
  return score;
}

function archetypeScore(plan, archetype, filters) {
  const items = plan.items;
  const avgQuality = items.reduce((sum,item) => sum + (item.quality ?? 7), 0) / items.length;
  const unusualCount = items.filter((item) => itemHasVibe(item,"unusual")).length;
  const activeCount = items.filter((item) => itemHasVibe(item,"active")).length;
  const hasEvent = items.some((item) => item.category === "event");
  const hasView = items.some((item) => item.category === "viewpoint");
  const hasImage = items.some((item) => item.image);
  const estimatedCount = items.filter((item) => item.costEstimated).length;
  const budgetUse = filters.budget >= 900000 ? .7 : plan.totalCost / Math.max(filters.budget,1);

  if (archetype === "reliable") {
    return plan.baseScore + avgQuality * 4 - estimatedCount * 2 + (plan.template.tone === "reliable" ? 10 : 0) + (hasEvent ? -1 : 4);
  }
  if (archetype === "discovery") {
    return plan.baseScore + unusualCount * 12 + activeCount * 4 + (hasEvent ? 9 : 0) + (plan.template.tone === "discovery" ? 10 : 0);
  }
  return plan.baseScore + avgQuality * 3 + (hasEvent ? 10 : 0) + (hasView ? 8 : 0) + (hasImage ? 5 : 0) + clamp(budgetUse,.2,1) * 8 + items.length * 2;
}

function planSimilarity(a,b) {
  const idsA = new Set(a.items.map((x) => x.id)), idsB = new Set(b.items.map((x) => x.id));
  const sharedIds = [...idsA].filter((id) => idsB.has(id)).length / Math.max(idsA.size, idsB.size, 1);
  const catsA = a.template.structureKey || a.items.map((x)=>x.category).join(">");
  const catsB = b.template.structureKey || b.items.map((x)=>x.category).join(">");
  const sameStructure = catsA === catsB ? 1 : 0;
  const sameFamily = a.template.family && a.template.family === b.template.family ? 1 : 0;
  const subtypeA=new Set(a.items.map(inferSubtype)),subtypeB=new Set(b.items.map(inferSubtype));
  const subtypeUnion=new Set([...subtypeA,...subtypeB]).size||1;
  const sharedSubtypes=[...subtypeA].filter((x)=>subtypeB.has(x)).length/subtypeUnion;
  return sharedIds*.55 + sharedSubtypes*.15 + sameStructure*.20 + sameFamily*.10;
}

function chooseArchetypes(candidates, count=3) {
  const chosen = [];
  for (const archetype of ARCHETYPES.slice(0,count)) {
    const ranked = candidates
      .filter((plan) => !chosen.includes(plan) && chosen.every((other) => plan.template.id !== other.template.id))
      .map((plan) => ({ plan, score:archetypeScore(plan, archetype.id, plan.filters) - chosen.reduce((penalty,other) => penalty + planSimilarity(plan,other)*52,0) }))
      .sort((a,b) => b.score-a.score);
    const strict = ranked.find(({plan}) => chosen.every((other) =>
      planSimilarity(plan,other) < .60 &&
      plan.template.family !== other.template.family &&
      plan.template.structureKey !== other.template.structureKey
    ));
    const structureDifferent = ranked.find(({plan}) => chosen.every((other) => planSimilarity(plan,other) < .68 && plan.template.structureKey !== other.template.structureKey));
    // Never fill a result slot with the same broad evening structure just to
    // reach three cards. Two honest, different dates are better than three
    // cosmetic variants of the same route.
    const picked = strict?.plan || structureDifferent?.plan;
    if (!picked) continue;
    picked.archetype = archetype;
    chosen.push(picked);
  }
  if (chosen.length < count) {
    // First try to keep both family and structure different.
    for (const plan of candidates) {
      if (chosen.length >= count) break;
      if (chosen.includes(plan) || chosen.some((other)=>other.template.id===plan.template.id)) continue;
      if (chosen.some((other)=>other.template.structureKey===plan.template.structureKey)) continue;
      if (chosen.some((other)=>other.template.family===plan.template.family)) continue;
      plan.archetype = ARCHETYPES[chosen.length] || ARCHETYPES[0];
      chosen.push(plan);
    }
  }
  if (chosen.length < count) {
    // Family may repeat in a sparse city/constraint set, broad structure may not.
    for (const plan of candidates) {
      if (chosen.length >= count) break;
      if (chosen.includes(plan) || chosen.some((other)=>other.template.id===plan.template.id)) continue;
      if (chosen.some((other)=>other.template.structureKey===plan.template.structureKey)) continue;
      plan.archetype = ARCHETYPES[chosen.length] || ARCHETYPES[0];
      chosen.push(plan);
    }
  }
  return chosen;
}

function itemLabel(item) { return SUBTYPE_LABELS[inferSubtype(item)] || CATEGORY_LABELS[item?.category] || item?.category || "Место"; }
function categoryLabel(category) { return CATEGORY_LABELS[category] || category; }

function describeItem(item) {
  if (item.description && item.description.length >= 35) return item.description.slice(0,260);
  if (item.category === "event") {
    const eventType = EVENT_TYPE_LABELS[item.eventType] || "событие";
    return `Центральное впечатление вечера — ${eventType} из актуальной афиши. Перед выходом лучше подтвердить билеты и расписание.`;
  }
  return ITEM_DESCRIPTIONS[item.category] || "Отдельная глава вечера, выбранная так, чтобы сценарий ощущался цельным.";
}
function makeStory(template,items) {
  const phrases = template.slots.map((value,index)=>slotSpec(value).role || STORY_PHRASES[items[index]?.category]).filter(Boolean);
  if (phrases.length <= 1) return phrases[0] ? `План простой: ${phrases[0]}.` : "Несколько впечатлений, собранных в один цельный вечер.";
  if (phrases.length === 2) return `Сначала ${phrases[0]}, а потом ${phrases[1]}.`;
  return `Сначала ${phrases[0]}, затем ${phrases.slice(1,-1).join(", затем ")}, а в финале — ${phrases.at(-1)}.`;
}
function makeInviteTeaser(items) {
  const labels = items.map((item) => itemLabel(item).toLowerCase());
  const visible = labels.slice(0,3).join(" · ");
  return `${visible}${labels.length > 3 ? " · и ещё кое-что" : ""}. Остальное можно оставить сюрпризом.`;
}
function makeWhy(plan, filters) {
  if (plan.archetype?.id === "reliable") return "Самый понятный выбор: сильные места, цельный ритм и минимум случайностей.";
  if (plan.archetype?.id === "discovery") {
    if (plan.items.some((x) => x.category === "event")) return "Здесь есть актуальное событие и хотя бы одна глава, которую легко было бы не придумать самому.";
    return "Здесь больше нового: сценарий специально уходит от обычного «поесть и разойтись».";
  }
  if (plan.items.some((x) => x.category === "event")) return "Самый насыщенный вариант: событие становится центром вечера, а остальные главы собирают вокруг него полноценное свидание.";
  return "Самый выразительный вариант по атмосфере, качеству мест и насыщенности программы.";
}
function coverFor(items) { return items.find((item) => item.image)?.image || null; }
function makeTitle(filters, plan, index, variationSeed) {
  const preferred = filters.vibes?.[index % Math.max(filters.vibes.length,1)] || filters.vibes?.[0] || "romantic";
  const pool = TITLE_POOLS[preferred] || TITLE_POOLS.romantic;
  return pool[hashString(`${plan.template.id}|${plan.items.map((x)=>x.id).join("|")}|${variationSeed}|${index}`) % pool.length];
}

function enrichPlan(plan, filters, index, variationSeed, titleOverride=null, archetypeOverride=null) {
  if (archetypeOverride) plan.archetype = archetypeOverride;
  const title = titleOverride || makeTitle(filters, plan, index, variationSeed);
  return {
    ...plan,
    title,
    label:plan.template.label,
    summary:plan.template.summary,
    story:makeStory(plan.template,plan.items),
    why:makeWhy(plan, filters),
    inviteTeaser:makeInviteTeaser(plan.items),
    coverImage:coverFor(plan.items),
    sourceUrls:unique(plan.items.flatMap((item) => [item.sourceUrl,item.officialUrl]).filter(Boolean))
  };
}

function makeCandidates({places,events,filters,variationSeed=0,anchorItem=null}) {
  const candidates = [];
  for (const template of TEMPLATES) {
    if (!templateEligible(template, filters)) continue;
    const pools = buildPools(template, places, events, filters, anchorItem);
    if (!pools || pools.some((pool) => !pool.length)) continue;
    for (const items of cartesianLimited(pools,filters,template)) {
      if (!moodCoverage(template, items, filters)) continue;
      const schedule = schedulePlan(items, filters, template);
      if (!schedule) continue;
      const baseScore = planBaseScore(template, items, schedule, filters, variationSeed);
      candidates.push({ ...schedule, template, items, baseScore, filters, geo:geographicMetrics(items,filters,template) });
    }
  }
  candidates.sort((a,b) => b.baseScore-a.baseScore);
  return candidates;
}

export function generateDates({ places, events, filters, count=3, variationSeed=0, anchorItem=null }) {
  const candidates = makeCandidates({places,events,filters,variationSeed,anchorItem});
  const chosen = chooseArchetypes(candidates,count);
  const usedTitles = new Set();
  return chosen.map((plan,index) => {
    let enriched = enrichPlan(plan,filters,index,variationSeed);
    if (usedTitles.has(enriched.title)) enriched = enrichPlan(plan,filters,index+5,variationSeed);
    usedTitles.add(enriched.title);
    return enriched;
  });
}

export function replacePlanItem({ plan, itemIndex, places, events, filters, variationSeed=0 }) {
  const slot = plan.template.slots[itemIndex];
  if (!slot) return plan;
  const source = slotCategory(slot) === "event" ? events.filter((event) => eventAvailable(event,filters.date)) : places;
  const currentItem = plan.items[itemIndex];
  const otherIds = new Set(plan.items.filter((_,i) => i !== itemIndex).map((item) => item.id));
  const alternatives = source
    .filter((item) => placeMatchesSlot(item,slot))
    .filter((item) => itemFitsPreferences(item,filters))
    .filter((item) => item.id !== currentItem.id && !otherIds.has(item.id))
    .sort((a,b) => candidateScore(b,filters,plan.template)-candidateScore(a,filters,plan.template));

  let best = null;
  for (const alternative of alternatives.slice(0,30)) {
    const items = plan.items.slice(); items[itemIndex] = alternative;
    if (!geographicallyPlausible(items,filters,plan.template)) continue;
    if (!moodCoverage(plan.template,items,filters)) continue;
    const schedule = schedulePlan(items,filters,plan.template);
    if (!schedule) continue;
    const baseScore = planBaseScore(plan.template,items,schedule,filters,variationSeed+itemIndex+1);
    const candidate = { ...schedule, template:plan.template, items, baseScore, filters, archetype:plan.archetype };
    if (!best || baseScore > best.baseScore) best = candidate;
  }
  return best ? enrichPlan(best,filters,0,variationSeed,plan.title,plan.archetype) : plan;
}

export function planRows(plan) {
  return plan.timeline.map((node,index) => ({
    index:index+1,
    itemId:node.item.id,
    item:node.item,
    title:node.item.title,
    detail:node.item.address || "Москва",
    category:itemLabel(node.item),
    role:slotSpec(node.slot || plan.template.slots[index]).role || null,
    symbol:CATEGORY_SYMBOLS[node.item.category] || "•",
    description:describeItem(node.item),
    duration:formatDuration(node.duration || node.item.duration),
    cost:formatMoney(node.item.costForTwo || 0),
    costEstimated:Boolean(node.item.costEstimated),
    startTime:node.item.category === "event" && node.fixedStart ? minutesToTime(node.start) : null,
    sourceUrl:node.item.sourceUrl || null,
    officialUrl:node.item.officialUrl || null,
    image:node.item.image || null
  }));
}

export function estimateScenarioCount(places, events) {
  let total = 0;
  for (const template of TEMPLATES) {
    let combinations = 1;
    for (const value of template.slots) {
      const source=slotCategory(value)==="event"?events:places;
      const count=source.filter((item)=>placeMatchesSlot(item,value)).length;
      combinations *= Math.max(0,count);
      if (combinations > 1000000) { combinations = 1000000; break; }
    }
    total += combinations;
  }
  return Math.round(total);
}

export function auditPlanGeography(plan,filters=plan?.filters||{}) { return geographicMetrics(plan?.items||[],filters,plan?.template||null); }
export function auditPlanConstraints(plan,filters=plan?.filters||{}) {
  const items=plan?.items||[],food=items.some(itemIncludesFood);
  return {
    duration:Boolean(plan)&&plan.totalMinutes<=Number(filters.duration)+5&&plan.totalMinutes>=targetFloor(Number(filters.duration)),
    budget:filters.budget>=900000||Number(plan?.totalCost||0)<=Number(filters.budget),
    vibes:moodCoverage(plan?.template||{vibes:[]},items,filters),
    food:filters.food===true?food:filters.food===false?!food:true,
    events:filters.useEvents===false?!items.some((x)=>x.category==="event"):true,
    indoor:filters.indoorOnly?!items.some((x)=>x.indoor===false):true,
    bars:filters.noBars?!items.some((x)=>x.category==="bar"):true,
    zone:filters.zone&&filters.zone!=="any"?items.every((x)=>x.zone===filters.zone):true,
    geography:geographicMetrics(items,filters,plan?.template||null).ok
  };
}

export { TEMPLATES, ARCHETYPES };
