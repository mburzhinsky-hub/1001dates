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

const TEMPLATES = [
  { id:"coffee-art", label:"Легко начать", slots:["cafe","art"], vibes:["calm","romantic"], hasFood:true, summary:"Кофе или десерт, а потом место, где само собой появляется тема для разговора." },
  { id:"art-dessert", label:"Тихо и красиво", slots:["art","dessert"], vibes:["romantic","calm","unusual"], hasFood:true, summary:"Немного искусства и сладкий финал без перегруженного плана." },
  { id:"view-dessert", label:"Короткий вау", slots:["view","dessert"], vibes:["romantic","unusual"], hasFood:true, summary:"Одна эффектная точка и спокойное продолжение — просто, но ощущается как свидание." },
  { id:"activity-dessert", label:"Больше эмоций", slots:["activity","dessert"], vibes:["fun","active","unusual"], hasFood:true, summary:"Сначала совместное впечатление, потом место, где можно обсудить всё за десертом." },
  { id:"dinner-view", label:"Красивый вечер", slots:["dinner","view"], vibes:["romantic","unusual"], hasFood:true, summary:"Ужин и эффектный финал — классический сценарий, который не ощущается скучным." },
  { id:"art-dinner", label:"Неспешно", slots:["art","dinner"], vibes:["calm","romantic","unusual"], hasFood:true, summary:"Выставка или галерея, а после — нормальный ужин и время поговорить." },
  { id:"walk-dinner", label:"Просто хорошо", slots:["walk","dinner"], vibes:["romantic","calm","active"], hasFood:true, summary:"Прогулка задаёт настроение, ужин оставляет вечер без ощущения гонки по точкам." },
  { id:"activity-dinner", label:"С приключением", slots:["activity","dinner"], vibes:["fun","active","unusual"], hasFood:true, summary:"Сначала что-то сделать вместе, потом спокойно поесть — хороший вариант, когда не хочется просто сидеть." },
  { id:"dinner-bar", label:"Продолжить вечер", slots:["dinner","bar"], vibes:["romantic","fun"], hasFood:true, hasBar:true, summary:"Ужин и место для продолжения, если хочется чуть больше вечернего города." },
  { id:"event-dessert", label:"Сегодня в городе", slots:["event","dessert"], vibes:["fun","unusual","romantic"], hasFood:true, usesEvents:true, summary:"Актуальное событие становится центром свидания, а после остаётся красивый финал." },
  { id:"dinner-event", label:"Вокруг события", slots:["dinner","event"], vibes:["romantic","fun","unusual"], hasFood:true, usesEvents:true, summary:"Вечер собран вокруг конкретного события: сначала ужин, затем то, ради чего стоит выйти из дома." },
  { id:"event-bar", label:"Ночной вариант", slots:["event","bar"], vibes:["fun","unusual"], hasFood:false, hasBar:true, usesEvents:true, summary:"Событие и короткое продолжение — для вечера, которому не хочется ставить точку сразу." },
  { id:"art-walk", label:"Без стола", slots:["art","walk"], vibes:["calm","romantic","active"], hasFood:false, summary:"Посмотреть что-то интересное и просто побыть вдвоём, не привязывая вечер к ресторану." },
  { id:"view-walk", label:"Город на двоих", slots:["view","walk"], vibes:["romantic","active","calm"], hasFood:false, summary:"Красивый вид и прогулка — почти ничего лишнего, только сам вечер." },
  { id:"activity-art", label:"Не как обычно", slots:["activity","art"], vibes:["unusual","fun","active"], hasFood:false, summary:"Две разные эмоции подряд — для тех, кому хочется не очередного ресторана." },

  { id:"long-romantic", label:"Целый вечер", slots:["art","dinner","dessert"], vibes:["romantic","calm"], hasFood:true, minDuration:210, summary:"Три спокойных главы: впечатление, ужин и маленький финал, который не хочется торопить." },
  { id:"long-fun", label:"Вечер с историей", slots:["activity","dinner","bar"], vibes:["fun","unusual","active"], hasFood:true, hasBar:true, minDuration:220, summary:"Активность, ужин и продолжение — сценарий, после которого есть что вспоминать." },
  { id:"long-event", label:"Большой план", slots:["dinner","event","dessert"], vibes:["romantic","unusual","fun"], hasFood:true, usesEvents:true, minDuration:220, summary:"Полноценный вечер вокруг события с нормальным началом и красивым завершением." },
  { id:"long-city", label:"Город как сценарий", slots:["art","dinner","view","dessert"], vibes:["romantic","unusual","calm"], hasFood:true, minDuration:250, summary:"Четыре главы без случайных остановок: впечатление, ужин, красивый вид и небольшой финал." },
  { id:"long-play", label:"Сначала впечатления", slots:["activity","art","dinner","dessert"], vibes:["fun","unusual","active"], hasFood:true, minDuration:250, summary:"Вечер начинается с эмоций, потом становится спокойнее и заканчивается чем-то вкусным." },
  { id:"long-event-night", label:"Событие + продолжение", slots:["dinner","event","bar"], vibes:["fun","romantic","unusual"], hasFood:true, hasBar:true, usesEvents:true, minDuration:260, summary:"Не просто сходить на событие: вокруг него уже собраны начало и достойное продолжение." },

  // 5–6 hour plans. These exist specifically so a long-date filter means a genuinely long date.
  { id:"grand-romantic", label:"Большое свидание", slots:["art","dinner","view","dessert","bar"], vibes:["romantic","unusual"], hasFood:true, hasBar:true, minDuration:300, summary:"Пять разных глав: посмотреть, поужинать, увидеть город сверху, взять десерт и решить, что вечер ещё не закончен." },
  { id:"grand-soft", label:"Долго и неспешно", slots:["cafe","art","dinner","dessert","walk"], vibes:["romantic","calm"], hasFood:true, minDuration:300, summary:"Большой, но не шумный сценарий: лёгкое начало, искусство, ужин, десерт и спокойный финал." },
  { id:"grand-adventure", label:"Почти мини-путешествие", slots:["activity","art","dinner","dessert","walk"], vibes:["fun","unusual","active"], hasFood:true, minDuration:300, summary:"Много разных ощущений за один вечер — от совместной активности до финальной прогулки." },
  { id:"grand-city", label:"Весь город на двоих", slots:["walk","art","dinner","view","dessert"], vibes:["romantic","active","calm"], hasFood:true, minDuration:300, summary:"Прогулка, впечатление, ужин и красивый финал — полноценное свидание, а не две точки подряд." },
  { id:"grand-indoor", label:"Большой вечер внутри", slots:["cafe","art","dinner","activity","dessert"], vibes:["romantic","fun","unusual","calm"], hasFood:true, minDuration:300, summary:"Пять насыщенных глав полностью в помещении: лёгкое начало, искусство, ужин, совместная активность и десерт." },
  { id:"grand-event-indoor", label:"Афиша на весь вечер", slots:["art","dinner","event","dessert"], vibes:["romantic","fun","unusual"], hasFood:true, usesEvents:true, minDuration:300, summary:"Выставка, ужин, событие из афиши и десерт — длинный сценарий, который не зависит от погоды." },
  { id:"grand-event", label:"Главное событие вечера", slots:["dinner","event","dessert","bar"], vibes:["romantic","fun","unusual"], hasFood:true, hasBar:true, usesEvents:true, minDuration:300, summary:"Ужин, актуальное событие и ещё две главы после него — вечер действительно занимает выбранное время." },
  { id:"grand-nofood", label:"Долго без ресторана", slots:["activity","art","event","walk"], vibes:["unusual","fun","active"], hasFood:false, usesEvents:true, minDuration:300, summary:"Несколько впечатлений подряд без обязательного ресторана — для тех, кому важнее делать, смотреть и обсуждать." }
];

const TITLE_POOLS = {
  romantic: ["Только для двоих", "Город после семи", "Вечер без спешки", "Красивый повод", "Пятничный побег", "Ещё один хороший вечер"],
  fun: ["План: не скучать", "Два билета на вечер", "Выйти из сценария", "Смеяться до закрытия", "Нормально придумали", "Вечер пошёл не по плану"],
  unusual: ["Чуть левее привычного", "Секретный сценарий", "Не как обычно", "Другой вечер", "Операция «Свидание»", "Проверим одну идею"],
  calm: ["Медленный вечер", "Никуда не спешим", "Пауза на двоих", "Разговор подольше", "Тихий город", "Просто побыть вместе"],
  active: ["Не сидим дома", "В движении", "Поймать вечер", "Дальше интереснее", "План с характером", "С места в карьер"]
};

const CATEGORY_LABELS = {
  art:"Искусство", walk:"Прогулка", viewpoint:"Красивый вид", cafe:"Кофе", dessert:"Десерт",
  dinner:"Ужин", bar:"Продолжение", activity:"Активность", event:"Событие"
};

const CATEGORY_SYMBOLS = {
  art:"◌", walk:"↗", viewpoint:"◇", cafe:"☕", dessert:"✦", dinner:"◐", bar:"◒", activity:"◎", event:"★"
};

const EVENT_TYPE_LABELS = {
  standup:"стендап", concert:"концерт", exhibition:"выставка", show:"шоу", theater:"спектакль"
};

const ITEM_DESCRIPTIONS = {
  art:"Можно спокойно смотреть, спорить о понравившемся и не искать тему для разговора — она уже вокруг вас.",
  walk:"Свободная глава свидания без программы: идти рядом, разговаривать и останавливаться там, где хочется.",
  viewpoint:"Точка ради ощущения «мы сегодня действительно куда-то выбрались» — хороший визуальный акцент вечера.",
  cafe:"Лёгкое начало или пауза: кофе, чай и возможность настроиться друг на друга без длинного ужина.",
  dessert:"Маленький финал, который превращает набор мест в законченное свидание — взять десерт и ещё немного не расходиться.",
  dinner:"Главная спокойная часть вечера: полноценный ужин и достаточно времени, чтобы нормально поговорить.",
  bar:"Необязательная, но приятная последняя глава — остаться ещё на один напиток и не обрывать вечер резко.",
  activity:"Здесь вы не просто сидите друг напротив друга: совместное действие даёт эмоцию и общий сюжет на весь вечер.",
  event:"Конкретный повод выйти из дома: событие из афиши становится центральным впечатлением свидания."
};

const STORY_PHRASES = {
  art:"посмотреть что-то новое вместе",
  walk:"оставить время на прогулку и разговор",
  viewpoint:"поймать красивый вид на город",
  cafe:"начать с кофе и лёгкого разговора",
  dessert:"закончить чем-то сладким",
  dinner:"не спеша поужинать",
  bar:"продолжить вечер ещё на один напиток",
  activity:"сделать что-то вместе, а не просто сидеть",
  event:"сходить на конкретное событие из афиши"
};

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function timeToMinutes(value) {
  const [h, m] = String(value || "19:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
function minutesToTime(minutes) {
  const total = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2,"0")}:${String(total % 60).padStart(2,"0")}`;
}
function hashString(value) {
  let h = 2166136261;
  for (const char of String(value)) { h ^= char.charCodeAt(0); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
function dateISO(value) { return new Date(`${value}T12:00:00`).toISOString().slice(0, 10); }

export function formatMoney(value) {
  if (!value) return "бесплатно";
  if (value >= 900000) return "без лимита";
  return new Intl.NumberFormat("ru-RU").format(Math.round(value / 100) * 100) + " ₽";
}

export function formatDuration(minutes) {
  const rounded = Math.max(0, Math.round(minutes));
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (!h) return `${m} мин`;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}

export function categoryLabel(category) {
  return CATEGORY_LABELS[category] || "Место";
}

function targetFloor(duration) {
  // A duration filter is a target, not merely a maximum.
  // The longer the requested date, the more important it is to actually fill that time.
  if (duration >= 330) return Math.max(300, duration - 45); // 6 h => at least 5 h 15 m
  if (duration >= 240) return duration - 35;
  if (duration >= 180) return duration - 30;
  return Math.max(75, duration - 20);
}

function relaxedFloor(duration) {
  if (duration >= 330) return Math.max(285, duration - 75);
  if (duration >= 240) return duration - 55;
  if (duration >= 180) return duration - 45;
  return Math.max(60, duration - 35);
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

function itemFitsPreferences(item, filters) {
  if (filters.indoorOnly && !item.indoor) return false;
  if (filters.noBars && item.category === "bar") return false;
  if (filters.zone !== "any" && item.zone && item.zone !== filters.zone) return false;
  return true;
}

function templateEligible(template, filters) {
  if (template.usesEvents && !filters.useEvents) return false;
  if (template.hasBar && filters.noBars) return false;
  if (filters.food && !template.hasFood) return false;
  if (!filters.food && template.hasFood) return false;
  if (template.minDuration && filters.duration < template.minDuration) return false;
  return true;
}

function candidateScore(item, filters, template) {
  let score = (item.quality ?? 7) * 7;
  const vibeHits = filters.vibes.filter((v) => item.vibes?.includes(v)).length;
  score += vibeHits * 13;
  score += template.vibes.filter((v) => filters.vibes.includes(v)).length * 3;
  if (filters.zone !== "any" && item.zone === filters.zone) score += 8;
  if (item.costEstimated) score -= 1.2;
  return score;
}

function buildPools(template, places, events, filters) {
  return template.slots.map((slot) => {
    const source = slot === "event" ? events.filter((event) => eventAvailable(event, filters.date)) : places;
    return source
      .filter((item) => placeMatchesSlot(item, slot))
      .filter((item) => itemFitsPreferences(item, filters))
      .sort((a, b) => candidateScore(b, filters, template) - candidateScore(a, filters, template))
      .slice(0, 11);
  });
}

function cartesianLimited(pools, limit = 260) {
  const result = [];
  function walk(index, acc) {
    if (result.length >= limit) return;
    if (index === pools.length) { result.push(acc.slice()); return; }
    for (const item of pools[index]) {
      if (acc.some((x) => x.id === item.id)) continue;
      acc.push(item);
      walk(index + 1, acc);
      acc.pop();
      if (result.length >= limit) break;
    }
  }
  walk(0, []);
  return result;
}

function schedulePlan(items, filters) {
  const startAt = timeToMinutes(filters.time);
  let cursor = startAt;
  let totalCost = 0;
  let activityMinutes = 0;
  let waitingMinutes = 0;
  const timeline = [];

  for (const item of items) {
    if (item.category === "event" && item.startTimes?.length) {
      const possible = item.startTimes
        .map(timeToMinutes)
        .filter((time) => time >= cursor)
        .sort((a, b) => a - b);
      if (!possible.length) return null;
      const fixed = possible[0];
      const wait = fixed - cursor;
      if (wait > 45) return null;
      waitingMinutes += wait;
      cursor = fixed;
    }

    if (item.openFrom && cursor < timeToMinutes(item.openFrom)) {
      const wait = timeToMinutes(item.openFrom) - cursor;
      if (wait > 45) return null;
      waitingMinutes += wait;
      cursor = timeToMinutes(item.openFrom);
    }
    if (item.openUntil && cursor + item.duration > timeToMinutes(item.openUntil)) return null;

    const start = cursor;
    cursor += item.duration;
    activityMinutes += item.duration;
    totalCost += item.costForTwo || 0;
    timeline.push({ type:"stop", start, end:cursor, item });
  }

  // User-selected date duration counts the activities themselves. We intentionally do not add travel.
  const totalMinutes = activityMinutes;
  if (totalMinutes > filters.duration + 5) return null;

  return {
    timeline,
    totalMinutes,
    elapsedMinutes: cursor - startAt,
    activityMinutes,
    waitingMinutes,
    finishTime: minutesToTime(cursor),
    totalCost
  };
}

function geographicCoherence(items) {
  const zones = items.map((x) => x.zone).filter(Boolean);
  if (!zones.length) return 0;
  const counts = new Map();
  for (const zone of zones) counts.set(zone, (counts.get(zone) || 0) + 1);
  const max = Math.max(...counts.values());
  return max === zones.length ? 8 : max >= zones.length - 1 ? 4 : -5;
}

function planScore(template, items, schedule, filters, variationSeed) {
  let score = 54;
  score += template.vibes.filter((v) => filters.vibes.includes(v)).length * 10;
  score += items.reduce((sum, item) => sum + candidateScore(item, filters, template), 0) / items.length * 0.48;
  score += geographicCoherence(items);

  const budgetRatio = schedule.totalCost / Math.max(filters.budget, 1);
  if (filters.budget >= 900000) score += 6;
  else if (budgetRatio <= 1) score += 13 - Math.abs(0.72 - budgetRatio) * 7;
  else score -= 50 * (budgetRatio - 1);

  const durationRatio = schedule.totalMinutes / filters.duration;
  score += clamp(1 - Math.abs(0.94 - durationRatio), 0, 1) * 27;
  if (schedule.totalMinutes < targetFloor(filters.duration)) score -= 24;
  if (schedule.waitingMinutes > 25) score -= 3;
  if (items.some((item) => item.category === "event")) score += 5;
  if (items.some((item) => item.costEstimated)) score -= 1;

  const signature = `${template.id}|${items.map((x) => x.id).join("|")}|${variationSeed}`;
  score += (hashString(signature) % 1000) / 1000 * 8;
  return score;
}

function makeTitle(filters, items, index, variationSeed) {
  const primary = filters.vibes[index % filters.vibes.length] || filters.vibes[0] || "romantic";
  const pool = TITLE_POOLS[primary] || TITLE_POOLS.romantic;
  const hash = hashString(`${items.map((x) => x.id).join("|")}|${variationSeed}|${index}`);
  return pool[hash % pool.length];
}

function makeReason(plan, filters) {
  const reasons = [];
  reasons.push(`${formatDuration(plan.totalMinutes)} из выбранных ${formatDuration(filters.duration)}`);
  if (filters.budget < 900000 && plan.totalCost <= filters.budget) reasons.push(`в бюджете до ${formatMoney(filters.budget)}`);
  if (plan.items.some((x) => x.category === "event")) reasons.push("есть событие на выбранную дату");
  const vibeHits = filters.vibes.filter((v) => plan.items.some((x) => x.vibes?.includes(v)));
  if (vibeHits.length && reasons.length < 3) reasons.push("под выбранное настроение");
  return reasons.slice(0, 3);
}

function coverFor(items) {
  return items.find((item) => item.image)?.image || null;
}

function describeItem(item) {
  if (item.description) return item.description;
  if (item.category === "event") {
    const eventType = EVENT_TYPE_LABELS[item.eventType] || "событие";
    return `Центральное впечатление вечера — ${eventType} из актуальной афиши. Билеты и время лучше подтвердить перед выходом.`;
  }
  return ITEM_DESCRIPTIONS[item.category] || "Отдельная глава вечера, выбранная так, чтобы сценарий ощущался цельным.";
}

function makeStory(items) {
  const phrases = items.map((item) => STORY_PHRASES[item.category]).filter(Boolean);
  if (!phrases.length) return "Несколько разных впечатлений, собранных в один цельный вечер.";
  if (phrases.length === 1) return `План простой: ${phrases[0]}.`;
  if (phrases.length === 2) return `Сначала ${phrases[0]}, а потом ${phrases[1]}.`;
  const first = phrases[0];
  const middle = phrases.slice(1, -1).join(", затем ");
  const last = phrases[phrases.length - 1];
  return `Сначала ${first}, затем ${middle}, а в финале — ${last}.`;
}

function makeInviteTeaser(items) {
  const labels = items.map((item) => categoryLabel(item.category).toLowerCase());
  if (labels.length === 1) return `${labels[0]} и один вечер только для вас двоих.`;
  const visible = labels.slice(0, 3).join(" · ");
  return `${visible}${labels.length > 3 ? " · и ещё один сюрприз" : ""}. Места пока можно оставить секретом.`;
}

function chooseDiverse(candidates, count) {
  const chosen = [];
  const templateIds = new Set();
  const signatures = new Set();
  const firstItems = new Set();

  for (const plan of candidates) {
    if (chosen.length >= count) break;
    const signature = plan.items.map((x) => x.id).sort().join("|");
    if (signatures.has(signature)) continue;
    if (templateIds.has(plan.template.id)) continue;
    if (firstItems.has(plan.items[0]?.id) && chosen.length < 2) continue;
    chosen.push(plan);
    signatures.add(signature);
    templateIds.add(plan.template.id);
    firstItems.add(plan.items[0]?.id);
  }

  for (const plan of candidates) {
    if (chosen.length >= count) break;
    const signature = plan.items.map((x) => x.id).sort().join("|");
    if (signatures.has(signature)) continue;
    chosen.push(plan);
    signatures.add(signature);
  }
  return chosen;
}

export function generateDates({ places, events, filters, count = 3, variationSeed = 0 }) {
  const eligibleTemplates = TEMPLATES.filter((template) => templateEligible(template, filters));
  const candidates = [];

  for (const template of eligibleTemplates) {
    const pools = buildPools(template, places, events, filters);
    if (pools.some((pool) => !pool.length)) continue;

    for (const items of cartesianLimited(pools)) {
      const schedule = schedulePlan(items, filters);
      if (!schedule) continue;
      if (filters.budget < 900000 && schedule.totalCost > filters.budget) continue;
      const score = planScore(template, items, schedule, filters, variationSeed);
      candidates.push({ ...schedule, template, items, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  const strict = candidates.filter((plan) => plan.totalMinutes >= targetFloor(filters.duration));
  const relaxed = candidates.filter((plan) => plan.totalMinutes >= relaxedFloor(filters.duration));
  // Never answer a 6-hour request with a 2–4 hour date just to fill three cards.
  // If the budget/preferences make a long date impossible, the UI should ask to loosen constraints instead.
  const source = strict.length >= count
    ? strict
    : relaxed.length
      ? [...strict, ...relaxed.filter((plan) => !strict.includes(plan))]
      : [];
  const chosen = chooseDiverse(source, count);

  const usedTitles = new Set();
  return chosen.map((plan, index) => {
    let title = makeTitle(filters, plan.items, index, variationSeed);
    if (usedTitles.has(title)) {
      const primary = filters.vibes[index % filters.vibes.length] || filters.vibes[0] || "romantic";
      const pool = TITLE_POOLS[primary] || TITLE_POOLS.romantic;
      const baseHash = hashString(`${plan.items.map((x) => x.id).join("|")}|${variationSeed}|${index}`);
      for (let offset = 1; offset < pool.length; offset++) {
        const candidate = pool[(baseHash + offset) % pool.length];
        if (!usedTitles.has(candidate)) { title = candidate; break; }
      }
    }
    usedTitles.add(title);
    return {
      ...plan,
      title,
      label: plan.template.label,
      summary: plan.template.summary,
      story: makeStory(plan.items),
      inviteTeaser: makeInviteTeaser(plan.items),
      reasons: makeReason(plan, filters),
      coverImage: coverFor(plan.items),
      sourceUrls: [...new Set(plan.items.map((item) => item.sourceUrl).filter(Boolean))]
    };
  });
}

export function planRows(plan) {
  return plan.timeline.map((node, index) => ({
    index: index + 1,
    title: node.item.title,
    detail: node.item.address || "Москва",
    category: categoryLabel(node.item.category),
    symbol: CATEGORY_SYMBOLS[node.item.category] || "•",
    description: describeItem(node.item),
    duration: formatDuration(node.item.duration),
    cost: formatMoney(node.item.costForTwo || 0),
    costEstimated: Boolean(node.item.costEstimated),
    startTime: node.item.category === "event" && node.item.startTimes?.length ? minutesToTime(node.start) : null,
    sourceUrl: node.item.sourceUrl || null
  }));
}
