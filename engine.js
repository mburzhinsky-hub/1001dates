const CATEGORY_GROUPS = {
  art: ["art"],
  walk: ["walk"],
  view: ["viewpoint"],
  cafe: ["cafe"],
  dessert: ["dessert"],
  dinner: ["dinner"],
  bar: ["bar"],
  activity: ["activity"],
  event: ["event"]
};

const FOOD_SLOTS = new Set(["cafe", "dessert", "dinner"]);

const TEMPLATE_BLUEPRINTS = [
  // Short: 2 hours.
  ["cafe","art"], ["art","dessert"], ["view","dessert"], ["activity","dessert"],
  ["art","walk"], ["view","walk"], ["activity","cafe"], ["event","dessert"],
  ["cafe","event"], ["activity","view"], ["walk","dessert"], ["art","cafe"],

  // Medium: 3 hours.
  ["art","dinner"], ["walk","dinner"], ["activity","dinner"], ["dinner","view"],
  ["dinner","bar"], ["event","dinner"], ["dinner","event"], ["activity","art"],
  ["art","bar"], ["cafe","activity","dessert"], ["art","view","dessert"], ["walk","cafe","art"],
  ["view","dinner","dessert"], ["activity","cafe","walk"], ["event","walk","dessert"], ["art","cafe","walk"],

  // Long: 4 hours.
  ["art","dinner","dessert"], ["activity","dinner","bar"], ["dinner","event","dessert"],
  ["walk","dinner","view"], ["cafe","art","dinner"], ["activity","art","dinner"],
  ["event","dinner","bar"], ["art","event","dessert"], ["activity","dinner","view"],
  ["walk","art","dinner"], ["art","dinner","bar"], ["cafe","activity","dinner"],
  ["view","dinner","bar"], ["activity","event","dessert"], ["event","art","dinner"], ["walk","event","dinner"],

  // Grand: 6 hours.
  ["art","dinner","view","dessert","bar"], ["cafe","art","walk","dinner","view"],
  ["activity","art","dinner","dessert","walk"], ["walk","art","dinner","view","dessert"],
  ["activity","cafe","art","dinner","view"], ["art","dinner","event","dessert"],
  ["dinner","event","dessert","bar"], ["activity","art","event","walk"],
  ["activity","dinner","event","dessert"], ["walk","activity","dinner","view","dessert"],
  ["cafe","activity","art","dinner","bar"], ["art","event","dinner","dessert"],
  ["view","art","dinner","dessert","bar"], ["walk","cafe","art","dinner","bar"],
  ["activity","event","dinner","bar"], ["art","activity","dinner","view","dessert"]
];

const SLOT_VIBES = {
  art:["calm","unusual","romantic"], walk:["calm","active","romantic"], view:["romantic","unusual"],
  cafe:["calm","romantic"], dessert:["romantic","calm","fun"], dinner:["romantic","calm"],
  bar:["fun","romantic"], activity:["active","fun","unusual"], event:["fun","unusual"]
};

const TEMPLATE_LABELS = {
  reliable:["Красивый вечер","Легко выбрать","Хороший план","Без лишнего риска"],
  discovery:["Не как обычно","Чуть интереснее","Новый сценарий","С приключением"],
  wow:["Главный план","Вечер с историей","Большое свидание","Тот самый вариант"]
};

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
  dinner:"Ужин", bar:"Бар", activity:"Активность", event:"Событие"
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
  dinner:"Спокойная центральная глава — полноценный ужин и время нормально поговорить.",
  bar:"Продолжение для вечера, который не хочется заканчивать сразу после основной программы.",
  activity:"Здесь вы делаете что-то вместе. Совместное действие даёт эмоцию и общий сюжет на весь вечер.",
  event:"Конкретный повод выйти из дома: событие из афиши становится центральным впечатлением свидания."
};

const STORY_PHRASES = {
  art:"посмотреть что-то новое вместе", walk:"оставить время на разговор", viewpoint:"поймать красивый вид на город",
  cafe:"начать легко", dessert:"закончить чем-то вкусным", dinner:"не спеша поужинать", bar:"продолжить ещё немного",
  activity:"сделать что-то вместе", event:"попасть на событие, которое происходит сейчас"
};

function unique(values) { return [...new Set(values)]; }
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
  const ratio = duration >= 330 ? .86 : duration >= 220 ? .84 : .83;
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
function geoLimits(duration) {
  if (duration <= 130) return { maxLegKm:3.6, maxSpanKm:4.8 };
  if (duration <= 200) return { maxLegKm:4.4, maxSpanKm:5.8 };
  if (duration <= 270) return { maxLegKm:5.0, maxSpanKm:6.8 };
  return { maxLegKm:5.6, maxSpanKm:7.6 };
}
function fallbackZoneCompatible(a,b) {
  // When coordinates are missing (mainly the offline seed), be conservative.
  // Same coarse district is acceptable; cross-district pairs are rejected.
  return Boolean(a?.zone && b?.zone && a.zone === b.zone);
}
function pairGeographicallyCompatible(a,b,filters,{span=false}={}) {
  const distance=haversineKm(a,b);
  if (distance === null) return fallbackZoneCompatible(a,b);
  const limits=geoLimits(filters.duration);
  return distance <= (span ? limits.maxSpanKm : limits.maxLegKm);
}
function geographicMetrics(items,filters) {
  if (items.length < 2) return { ok:true,maxLegKm:0,maxSpanKm:0,mode:"single" };
  let maxLegKm=0,maxSpanKm=0,measuredPairs=0;
  for (let i=1;i<items.length;i++) {
    const distance=haversineKm(items[i-1],items[i]);
    if (distance === null) {
      if (!fallbackZoneCompatible(items[i-1],items[i])) return {ok:false,maxLegKm:null,maxSpanKm:null,mode:"zone"};
    } else {
      measuredPairs++; maxLegKm=Math.max(maxLegKm,distance);
      if (!pairGeographicallyCompatible(items[i-1],items[i],filters)) return {ok:false,maxLegKm,maxSpanKm,mode:"coords"};
    }
  }
  for (let i=0;i<items.length;i++) for(let j=i+1;j<items.length;j++) {
    const distance=haversineKm(items[i],items[j]);
    if (distance === null) {
      if (!fallbackZoneCompatible(items[i],items[j])) return {ok:false,maxLegKm:null,maxSpanKm:null,mode:"zone"};
    } else {
      measuredPairs++; maxSpanKm=Math.max(maxSpanKm,distance);
      if (!pairGeographicallyCompatible(items[i],items[j],filters,{span:true})) return {ok:false,maxLegKm,maxSpanKm,mode:"coords"};
    }
  }
  return {ok:true,maxLegKm,maxSpanKm,mode:measuredPairs?"coords":"zone"};
}
function geographicallyPlausible(items,filters) { return geographicMetrics(items,filters).ok; }
function categoryForSlot(slot) { return CATEGORY_GROUPS[slot] || [slot]; }
function placeMatchesSlot(item, slot) { return categoryForSlot(slot).includes(item.category); }
function slotHasFood(slot) { return FOOD_SLOTS.has(slot); }
function eventAvailable(event, date) {
  if (event.exactDates?.length && !event.exactDates.includes(date)) return false;
  if (event.activeFrom && date < event.activeFrom) return false;
  if (event.activeUntil && date > event.activeUntil) return false;
  if (event.allowedWeekdays?.length) {
    const weekday = new Date(`${date}T12:00:00`).getDay();
    if (!event.allowedWeekdays.includes(weekday)) return false;
  }
  return Boolean(event.exactDates?.length || event.activeFrom || event.activeUntil || event.startTimes?.length);
}

function blueprintVibes(slots) {
  const scores = new Map();
  for (const slot of slots) for (const vibe of SLOT_VIBES[slot] || []) scores.set(vibe, (scores.get(vibe) || 0) + 1);
  return [...scores.entries()].sort((a,b) => b[1]-a[1]).map(([v]) => v).slice(0,4);
}
function templateTone(slots) {
  if (slots.includes("event") || slots.includes("view")) return "wow";
  if (slots.includes("activity") || slots.filter((slot) => slot === "art").length) return "discovery";
  return "reliable";
}
function templateSummary(slots) {
  const labels = slots.map((slot) => CATEGORY_LABELS[categoryForSlot(slot)[0]]?.toLowerCase() || slot);
  if (labels.length === 2) return `${labels[0]} и ${labels[1]} — компактный сценарий без лишних остановок.`;
  if (labels.length === 3) return `${labels.slice(0,-1).join(", ")} и ${labels.at(-1)} — три разные главы одного вечера.`;
  return `${labels.slice(0,-1).join(", ")} и ${labels.at(-1)} — большой сценарий, который ощущается как настоящий выход из рутины.`;
}

const TEMPLATES = TEMPLATE_BLUEPRINTS.map((slots, index) => {
  const tone = templateTone(slots);
  return {
    id:`scenario-${String(index+1).padStart(2,"0")}`,
    slots,
    tone,
    vibes:blueprintVibes(slots),
    hasFood:slots.some(slotHasFood),
    hasBar:slots.includes("bar"),
    usesEvents:slots.includes("event"),
    label:TEMPLATE_LABELS[tone][index % TEMPLATE_LABELS[tone].length],
    summary:templateSummary(slots)
  };
});

function templateEligible(template, filters) {
  if (filters.food === false && template.hasFood) return false;
  if (filters.food === true && !template.hasFood) return false;
  if (!filters.useEvents && template.usesEvents) return false;
  if (filters.noBars && template.hasBar) return false;
  const slotCount = template.slots.length;
  if (filters.duration <= 130 && slotCount > 2) return false;
  if (filters.duration <= 200 && slotCount > 3) return false;
  if (filters.duration <= 270 && slotCount > 4) return false;
  if (filters.duration >= 330 && slotCount < 4) return false;
  return true;
}

function itemFitsPreferences(item, filters) {
  if (filters.indoorOnly && item.indoor === false) return false;
  if (filters.noBars && item.category === "bar") return false;
  if (filters.food === false && item.includesFood) return false;
  if (filters.zone !== "any" && item.zone !== filters.zone) return false;
  if (filters.dislikedItemIds?.includes(item.id)) return false;
  if (filters.avoidVisited && filters.visitedItemIds?.includes(item.id)) return false;
  return true;
}

function candidateScore(item, filters, template) {
  let score = (item.quality ?? 7) * 8;
  const vibeHits = (filters.vibes || []).filter((v) => item.vibes?.includes(v)).length;
  score += vibeHits * 14;
  if (template.vibes.some((v) => item.vibes?.includes(v))) score += 4;
  if (item.image) score += 3;
  if (item.sourceUrl || item.officialUrl) score += 2;
  if (item.costEstimated) score -= 1.5;
  if (filters.likedItemIds?.includes(item.id)) score += 11;
  if (filters.recentlyShownItemIds?.includes(item.id)) score -= 9;
  if (filters.visitedItemIds?.includes(item.id)) score -= 7;

  const adventure = filters.adventure || "balanced";
  const unusual = item.vibes?.includes("unusual") ? 1 : 0;
  if (adventure === "safe") score += unusual ? -3 : 5;
  if (adventure === "wild") score += unusual ? 10 : -2;
  return score;
}

function buildPools(template, places, events, filters, anchorItem=null) {
  const anchorSlot = anchorItem ? template.slots.findIndex((slot) => placeMatchesSlot(anchorItem, slot)) : -1;
  if (anchorItem && anchorSlot < 0) return null;

  return template.slots.map((slot, slotIndex) => {
    if (anchorItem && slotIndex === anchorSlot) return [anchorItem];
    const source = slot === "event" ? events.filter((event) => eventAvailable(event, filters.date)) : places;
    return source
      .filter((item) => placeMatchesSlot(item, slot))
      .filter((item) => itemFitsPreferences(item, filters))
      .filter((item) => !anchorItem || item.id !== anchorItem.id)
      .sort((a,b) => candidateScore(b, filters, template) - candidateScore(a, filters, template))
      .slice(0, 18);
  });
}

function cartesianLimited(pools, filters, limit=760) {
  const result = [];
  function walk(index, acc) {
    if (result.length >= limit) return;
    if (index === pools.length) { result.push(acc.slice()); return; }
    for (const item of pools[index]) {
      if (acc.some((x) => x.id === item.id)) continue;
      acc.push(item);
      // Prune impossible geography immediately instead of wasting the candidate budget on cross-city combinations.
      if (geographicallyPlausible(acc,filters)) walk(index+1, acc);
      acc.pop();
      if (result.length >= limit) break;
    }
  }
  walk(0, []);
  return result;
}

function schedulePlan(items, filters) {
  const startAt = timeToMinutes(filters.time);
  let cursor = startAt, totalCost = 0, activityMinutes = 0, waitingMinutes = 0;
  const timeline = [];

  for (const item of items) {
    if (item.category === "event" && item.startTimes?.length) {
      const possible = item.startTimes.map(timeToMinutes).filter((time) => time >= cursor).sort((a,b) => a-b);
      if (!possible.length) return null;
      const fixed = possible[0], wait = fixed - cursor;
      if (wait > 60) return null;
      waitingMinutes += wait; cursor = fixed;
    }
    if (item.openFrom && cursor < timeToMinutes(item.openFrom)) {
      const wait = timeToMinutes(item.openFrom) - cursor;
      if (wait > 60) return null;
      waitingMinutes += wait; cursor = timeToMinutes(item.openFrom);
    }
    if (item.openUntil && cursor + item.duration > timeToMinutes(item.openUntil)) return null;

    const start = cursor;
    cursor += item.duration;
    activityMinutes += item.duration;
    totalCost += item.costForTwo || 0;
    timeline.push({ type:"stop", start, end:cursor, item });
  }

  // Travel is deliberately not part of the product duration. Only the date activities count.
  const totalMinutes = activityMinutes;
  if (totalMinutes > filters.duration + 5) return null;
  if (totalMinutes < targetFloor(filters.duration)) return null;
  if (filters.budget < 900000 && totalCost > filters.budget) return null;

  return { timeline, totalMinutes, activityMinutes, waitingMinutes, elapsedMinutes:cursor-startAt, finishTime:minutesToTime(cursor), totalCost };
}

function moodCoverage(template, items, filters) {
  const requested = filters.vibes || [];
  if (!requested.length) return true;
  return requested.every((vibe) => template.vibes.includes(vibe) || items.some((item) => item.vibes?.includes(vibe)));
}

function geographicCoherence(items,filters) {
  const metrics=geographicMetrics(items,filters);
  if (!metrics.ok) return -1000;
  if (metrics.mode === "zone") return 14;
  const limits=geoLimits(filters.duration);
  const legRatio=metrics.maxLegKm/Math.max(limits.maxLegKm,.1);
  const spanRatio=metrics.maxSpanKm/Math.max(limits.maxSpanKm,.1);
  return 18 - (legRatio*6 + spanRatio*7);
}

function planBaseScore(template, items, schedule, filters, variationSeed) {
  let score = 52;
  const vibeHits = template.vibes.filter((v) => filters.vibes?.includes(v)).length;
  score += vibeHits * 9;
  score += items.reduce((sum,item) => sum + candidateScore(item, filters, template), 0) / Math.max(items.length,1) * .55;
  score += geographicCoherence(items,filters);

  if (filters.budget >= 900000) score += 4;
  else {
    const budgetRatio = schedule.totalCost / Math.max(filters.budget,1);
    score += 14 - Math.abs(.72 - budgetRatio) * 9;
  }

  const durationRatio = schedule.totalMinutes / filters.duration;
  score += clamp(1 - Math.abs(.94 - durationRatio), 0, 1) * 30;
  if (items.some((item) => item.category === "event")) score += 4;
  if (schedule.waitingMinutes > 30) score -= 3;
  if (items.every((item) => item.sourceUrl || item.officialUrl)) score += 3;

  const signature = `${template.id}|${items.map((x) => x.id).join("|")}|${variationSeed}`;
  score += (hashString(signature) % 1000) / 1000 * 7;
  return score;
}

function archetypeScore(plan, archetype, filters) {
  const items = plan.items;
  const avgQuality = items.reduce((sum,item) => sum + (item.quality ?? 7), 0) / items.length;
  const unusualCount = items.filter((item) => item.vibes?.includes("unusual")).length;
  const activeCount = items.filter((item) => item.vibes?.includes("active")).length;
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
  const catsA = new Set(a.items.map((x) => x.category)), catsB = new Set(b.items.map((x) => x.category));
  const sharedCats = [...catsA].filter((c) => catsB.has(c)).length;
  const catUnion = new Set([...catsA,...catsB]).size || 1;
  return sharedIds * .68 + (sharedCats / catUnion) * .32;
}

function chooseArchetypes(candidates, count=3) {
  const chosen = [];
  for (const archetype of ARCHETYPES.slice(0,count)) {
    const ranked = candidates
      .filter((plan) => !chosen.includes(plan))
      .map((plan) => ({ plan, score:archetypeScore(plan, archetype.id, plan.filters) - chosen.reduce((penalty,other) => penalty + planSimilarity(plan,other)*42,0) }))
      .sort((a,b) => b.score-a.score);
    const picked = ranked.find(({plan}) => chosen.every((other) => planSimilarity(plan,other) < .72))?.plan || ranked[0]?.plan;
    if (!picked) continue;
    picked.archetype = archetype;
    chosen.push(picked);
  }
  if (chosen.length < count) {
    for (const plan of candidates) {
      if (chosen.length >= count) break;
      if (chosen.includes(plan)) continue;
      plan.archetype = ARCHETYPES[chosen.length] || ARCHETYPES[0];
      chosen.push(plan);
    }
  }
  return chosen;
}

function categoryLabel(category) { return CATEGORY_LABELS[category] || category; }
function describeItem(item) {
  if (item.description && item.description.length >= 35) return item.description.slice(0,260);
  if (item.category === "event") {
    const eventType = EVENT_TYPE_LABELS[item.eventType] || "событие";
    return `Центральное впечатление вечера — ${eventType} из актуальной афиши. Перед выходом лучше подтвердить билеты и расписание.`;
  }
  return ITEM_DESCRIPTIONS[item.category] || "Отдельная глава вечера, выбранная так, чтобы сценарий ощущался цельным.";
}
function makeStory(items) {
  const phrases = items.map((item) => STORY_PHRASES[item.category]).filter(Boolean);
  if (phrases.length <= 1) return phrases[0] ? `План простой: ${phrases[0]}.` : "Несколько впечатлений, собранных в один цельный вечер.";
  if (phrases.length === 2) return `Сначала ${phrases[0]}, а потом ${phrases[1]}.`;
  return `Сначала ${phrases[0]}, затем ${phrases.slice(1,-1).join(", затем ")}, а в финале — ${phrases.at(-1)}.`;
}
function makeInviteTeaser(items) {
  const labels = items.map((item) => categoryLabel(item.category).toLowerCase());
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
    story:makeStory(plan.items),
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
    for (const items of cartesianLimited(pools,filters)) {
      if (!moodCoverage(template, items, filters)) continue;
      const schedule = schedulePlan(items, filters);
      if (!schedule) continue;
      const baseScore = planBaseScore(template, items, schedule, filters, variationSeed);
      candidates.push({ ...schedule, template, items, baseScore, filters, geo:geographicMetrics(items,filters) });
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
  const source = slot === "event" ? events.filter((event) => eventAvailable(event,filters.date)) : places;
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
    if (!geographicallyPlausible(items,filters)) continue;
    if (!moodCoverage(plan.template,items,filters)) continue;
    const schedule = schedulePlan(items,filters);
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
    category:categoryLabel(node.item.category),
    symbol:CATEGORY_SYMBOLS[node.item.category] || "•",
    description:describeItem(node.item),
    duration:formatDuration(node.item.duration),
    cost:formatMoney(node.item.costForTwo || 0),
    costEstimated:Boolean(node.item.costEstimated),
    startTime:node.item.category === "event" && node.item.startTimes?.length ? minutesToTime(node.start) : null,
    sourceUrl:node.item.sourceUrl || null,
    officialUrl:node.item.officialUrl || null,
    image:node.item.image || null
  }));
}

export function estimateScenarioCount(places, events) {
  const counts = new Map();
  for (const item of [...places,...events]) counts.set(item.category,(counts.get(item.category)||0)+1);
  let total = 0;
  for (const template of TEMPLATES) {
    let combinations = 1;
    for (const slot of template.slots) {
      const category = categoryForSlot(slot)[0];
      combinations *= Math.max(0,counts.get(category)||0);
      if (combinations > 250000) { combinations = 250000; break; }
    }
    total += combinations;
  }
  return Math.round(total);
}

export function auditPlanGeography(plan,filters=plan?.filters||{}) { return geographicMetrics(plan?.items||[],filters); }

export { TEMPLATES, ARCHETYPES };
