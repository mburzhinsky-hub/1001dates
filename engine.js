const ZONE_MINUTES = {
  center: { center: 8, city: 20, vdnh: 24, west: 24, south: 27, east: 27 },
  city:   { center: 20, city: 8, vdnh: 34, west: 18, south: 30, east: 36 },
  vdnh:   { center: 24, city: 34, vdnh: 8, west: 38, south: 40, east: 27 },
  west:   { center: 24, city: 18, vdnh: 38, west: 8, south: 26, east: 42 },
  south:  { center: 27, city: 30, vdnh: 40, west: 26, south: 8, east: 33 },
  east:   { center: 27, city: 36, vdnh: 27, west: 42, south: 33, east: 8 }
};

const CATEGORY_GROUPS = {
  art: ["art"],
  walk: ["walk"],
  view: ["viewpoint"],
  cafe: ["cafe", "dessert"],
  dessert: ["dessert", "cafe"],
  dinner: ["dinner"],
  bar: ["bar"],
  activity: ["activity"],
  event: ["event"]
};

const TEMPLATES = [
  { id:"soft-evening", archetype:"Тихий", slots:["art","dessert","walk"], vibes:["romantic","calm"], food:false, summary:"Искусство, что-нибудь вкусное и время спокойно поговорить." },
  { id:"city-lights", archetype:"Красивый", slots:["dinner","view"], vibes:["romantic","unusual"], food:true, summary:"Ужин без спешки и город с высоты — простой сценарий с эффектным финалом." },
  { id:"talk-longer", archetype:"Неспешный", slots:["cafe","walk","dinner"], vibes:["calm","romantic"], food:true, summary:"Начать легко, прогуляться и закончить вечер за столом." },
  { id:"play-first", archetype:"С приключением", slots:["activity","dinner"], vibes:["fun","active","unusual"], food:true, summary:"Сначала совместная активность, потом место, где можно обсудить впечатления." },
  { id:"art-and-dinner", archetype:"Культурный", slots:["art","dinner"], vibes:["calm","romantic","unusual"], food:true, summary:"Выставка или галерея как повод для разговора, затем ужин поблизости." },
  { id:"event-anchor", archetype:"Сегодня в городе", slots:["event","bar"], vibes:["fun","unusual","romantic"], food:false, events:true, summary:"Актуальное событие становится центром вечера, после — короткое продолжение рядом." },
  { id:"event-dinner", archetype:"Событие + ужин", slots:["dinner","event"], vibes:["romantic","fun","unusual"], food:true, events:true, summary:"Ужин и конкретное событие в афише — весь вечер собран вокруг расписания." },
  { id:"view-and-dessert", archetype:"Короткий вау", slots:["view","dessert"], vibes:["romantic","unusual"], food:false, summary:"Панорама города и сладкий финал — минимум логистики, максимум ощущения свидания." },
  { id:"active-soft", archetype:"Живой", slots:["walk","activity","dessert"], vibes:["active","fun"], food:false, summary:"Немного движения, одна яркая активность и спокойный финал." },
  { id:"center-classic", archetype:"Надёжный", slots:["walk","dinner","bar"], vibes:["romantic","calm","fun"], food:true, summary:"Классический городской вечер, но без необходимости что-либо планировать самому." }
];

const TITLE_POOLS = {
  romantic: ["Пятничный побег", "Только для двоих", "Город после семи", "Вечер без спешки", "Высота притяжения"],
  fun: ["Смеяться до закрытия", "План: не скучать", "Два билета на вечер", "Никаких серьёзных планов", "Выйти из сценария"],
  unusual: ["Чуть левее привычного", "Секретный маршрут", "Не как обычно", "Другой вечер", "Операция «Свидание»"],
  calm: ["Медленный вечер", "Тихий город", "Никуда не спешим", "Пауза на двоих", "Разговор до ночи"],
  active: ["В движении", "Маршрут на двоих", "Поймать вечер", "Не сидим дома", "Дальше — интереснее"]
};

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function timeToMinutes(value) { const [h,m] = value.split(":").map(Number); return h * 60 + m; }
function minutesToTime(minutes) { const total = ((Math.round(minutes) % 1440) + 1440) % 1440; return `${String(Math.floor(total/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`; }
function dateISO(value) { return new Date(`${value}T12:00:00`).toISOString().slice(0,10); }

export function formatMoney(value) {
  if (!value) return "бесплатно";
  return new Intl.NumberFormat("ru-RU").format(Math.round(value / 100) * 100) + " ₽";
}

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  if (!h) return `${m} мин`;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}

export function travelMinutes(from, to, mode="mixed") {
  const base = ZONE_MINUTES[from?.zone]?.[to?.zone] ?? 25;
  const multiplier = mode === "taxi" ? .75 : mode === "walk" ? 1.28 : 1;
  return Math.max(6, Math.round(base * multiplier));
}

function eventAvailable(event, selectedDate) {
  const iso = dateISO(selectedDate);
  if (event.exactDates?.length && !event.exactDates.includes(iso)) return false;
  if (event.activeFrom && iso < event.activeFrom) return false;
  if (event.activeUntil && iso > event.activeUntil) return false;
  const weekday = new Date(`${iso}T12:00:00`).getDay();
  if (event.allowedWeekdays?.length && !event.allowedWeekdays.includes(weekday)) return false;
  return true;
}

function placeMatchesSlot(place, slot) {
  return CATEGORY_GROUPS[slot]?.includes(place.category);
}

function candidateScore(place, filters, template) {
  let score = (place.quality ?? 7) * 7;
  const vibeHits = filters.vibes.filter((v) => place.vibes?.includes(v)).length;
  score += vibeHits * 13;
  score += template.vibes.filter((v) => filters.vibes.includes(v)).length * 4;
  if (filters.zone !== "any") score += place.zone === filters.zone ? 18 : -10;
  if (place.costEstimated) score -= 1.5;
  return score;
}

function buildPools(template, places, events, filters) {
  return template.slots.map((slot) => {
    const source = slot === "event" ? events.filter((e) => eventAvailable(e, filters.date)) : places;
    return source
      .filter((item) => placeMatchesSlot(item, slot))
      .filter((item) => !filters.indoorOnly || item.indoor)
      .sort((a,b) => candidateScore(b, filters, template) - candidateScore(a, filters, template))
      .slice(0, 7);
  });
}

function cartesianLimited(pools, limit=90) {
  const result = [];
  function walk(index, acc) {
    if (result.length >= limit) return;
    if (index === pools.length) { result.push(acc.slice()); return; }
    for (const item of pools[index]) {
      if (acc.some((x) => x.id === item.id)) continue;
      acc.push(item); walk(index + 1, acc); acc.pop();
      if (result.length >= limit) break;
    }
  }
  walk(0, []);
  return result;
}

function transportCost(minutes, mode) {
  if (mode === "taxi") return Math.round((320 + minutes * 30) / 50) * 50;
  if (mode === "mixed" && minutes >= 16) return 160;
  return 0;
}

function schedulePlan(items, filters) {
  const startAt = timeToMinutes(filters.time);
  let cursor = startAt;
  const hardEnd = startAt + filters.duration;
  let cost = 0;
  let totalTravel = 0;
  let travelCost = 0;
  const timeline = [];

  const home = { zone: filters.zone === "any" ? items[0].zone : filters.zone };
  const outbound = filters.zone === "any" ? 15 : travelMinutes(home, items[0], filters.travel);
  cursor += outbound;
  totalTravel += outbound;
  travelCost += transportCost(outbound, filters.travel);
  timeline.push({ type:"travel", minutes:outbound, text:`≈ ${outbound} мин до первой точки` });

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (i > 0) {
      const travel = travelMinutes(items[i-1], item, filters.travel);
      totalTravel += travel;
      travelCost += transportCost(travel, filters.travel);
      cursor += travel;
      timeline.push({ type:"travel", minutes:travel, text:`≈ ${travel} мин между точками` });
    }

    if (item.category === "event" && item.startTimes?.length) {
      const possible = item.startTimes.map(timeToMinutes).filter((t) => t >= cursor - 5).sort((a,b) => a-b);
      if (!possible.length) return null;
      const fixed = possible[0];
      if (fixed - cursor > 50) return null;
      if (fixed > cursor) timeline.push({ type:"wait", minutes:fixed-cursor });
      cursor = fixed;
    }

    if (item.openFrom && cursor < timeToMinutes(item.openFrom)) cursor = timeToMinutes(item.openFrom);
    if (item.openUntil && cursor + item.duration > timeToMinutes(item.openUntil)) return null;

    const start = cursor;
    cursor += item.duration;
    cost += item.costForTwo || 0;
    timeline.push({ type:"stop", start, end:cursor, item });
  }

  const last = items.at(-1);
  const returnTrip = filters.zone === "any" ? 20 : travelMinutes(last, home, filters.travel);
  cursor += returnTrip;
  totalTravel += returnTrip;
  travelCost += transportCost(returnTrip, filters.travel);
  timeline.push({ type:"travel", minutes:returnTrip, text:`≈ ${returnTrip} мин заложено на дорогу домой` });
  cost += travelCost;

  if (cursor > hardEnd + 10) return null;
  return { timeline, totalMinutes:cursor-startAt, returnTime:minutesToTime(cursor), totalCost:cost, totalTravel, travelCost };
}

function planScore(template, items, schedule, filters) {
  let score = 50;
  score += template.vibes.filter((v) => filters.vibes.includes(v)).length * 9;
  score += items.reduce((sum, item) => sum + candidateScore(item, filters, template), 0) / items.length * .55;
  const budgetRatio = schedule.totalCost / Math.max(filters.budget, 1);
  score += budgetRatio <= 1 ? 14 - Math.abs(0.78-budgetRatio)*7 : -35 * (budgetRatio-1);
  const durationFit = 1 - Math.abs(schedule.totalMinutes - filters.duration * .9) / filters.duration;
  score += clamp(durationFit, -.5, 1) * 15;
  score -= schedule.totalTravel * .13;
  if (schedule.totalTravel <= 25) score += 7;
  if (items.some((item) => item.category === "event")) score += 7;
  if (items.some((item) => item.costEstimated)) score -= 1;
  return score;
}

function hashString(value) {
  let h = 2166136261;
  for (const char of value) { h ^= char.charCodeAt(0); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

function makeTitle(filters, items, index) {
  const primary = filters.vibes[index % filters.vibes.length] || filters.vibes[0] || "romantic";
  const pool = TITLE_POOLS[primary] || TITLE_POOLS.romantic;
  return pool[(hashString(items.map((x) => x.id).join("|")) + index * 2) % pool.length];
}

function explainMatch(plan, filters) {
  const hits = new Set(plan.items.flatMap((x) => x.vibes || []).filter((v) => filters.vibes.includes(v))).size;
  const budgetFit = plan.totalCost <= filters.budget ? 1 : 0;
  const timeFit = plan.totalMinutes <= filters.duration + 10 ? 1 : 0;
  return clamp(76 + hits * 6 + budgetFit * 5 + timeFit * 4 - Math.round(plan.totalTravel/18), 72, 98);
}

export function generateDates({ places, events, filters, count=3 }) {
  const eligibleTemplates = TEMPLATES.filter((t) => (!t.events || filters.useEvents) && (!t.food || filters.food));
  const all = [];

  for (const template of eligibleTemplates) {
    const pools = buildPools(template, places, events, filters);
    if (pools.some((pool) => !pool.length)) continue;
    for (const items of cartesianLimited(pools)) {
      const schedule = schedulePlan(items, filters);
      if (!schedule) continue;
      if (schedule.totalCost > filters.budget * 1.18) continue;
      const score = planScore(template, items, schedule, filters);
      all.push({ ...schedule, template, items, score });
    }
  }

  all.sort((a,b) => b.score-a.score);
  const chosen = [];
  const seenTemplate = new Set();
  const seenFirst = new Set();
  for (const plan of all) {
    if (chosen.length >= count) break;
    if (seenTemplate.has(plan.template.id)) continue;
    if (seenFirst.has(plan.items[0]?.id)) continue;
    chosen.push(plan); seenTemplate.add(plan.template.id); seenFirst.add(plan.items[0]?.id);
  }
  for (const plan of all) {
    if (chosen.length >= count) break;
    if (chosen.includes(plan)) continue;
    chosen.push(plan);
  }

  const usedTitles = new Set();
  return chosen.map((plan, index) => {
    let title = makeTitle(filters, plan.items, index);
    if (usedTitles.has(title)) title = `${title} · ${plan.template.archetype}`;
    usedTitles.add(title);
    return {
      ...plan, title,
      label: plan.template.archetype,
      summary: plan.template.summary,
      match: explainMatch(plan, filters),
      sourceUrls: [...new Set(plan.items.map((item) => item.sourceUrl).filter(Boolean))]
    };
  });
}

export function timelineRows(plan) {
  const rows = [];
  let stopIndex = 0;
  for (const node of plan.timeline) {
    if (node.type === "stop") {
      rows.push({ type:"stop", time:minutesToTime(node.start), title:node.item.title, detail:node.item.address || "Москва", item:node.item, index:stopIndex++ });
    } else if (node.type === "travel") {
      rows.push({ type:"travel", text:node.text || `≈ ${node.minutes} мин на дорогу` });
    } else if (node.type === "wait") {
      rows.push({ type:"travel", text:`≈ ${node.minutes} мин спокойно дойти / подождать начало` });
    }
  }
  return rows;
}
