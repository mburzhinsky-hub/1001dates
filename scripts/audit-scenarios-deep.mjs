// Deep per-scenario audit: slot logic, concrete plans, cover images, map model, preparation planner, texts.
// Usage: node scripts/audit-scenarios-deep.mjs [start] [end] [outFile]   (1-based blueprint numbers)
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { seedPlaces, seedEvents } from "../data/seed.js";
import { kudagoPlaces, kudagoEvents, kudagoMeta } from "../data/kudago.generated.js";
import { scenarioBlueprints } from "../data/scenarios.js";
import { generateTemplateDates, planRows, auditPlanConstraints } from "../engine-v14.js?v=duration5";
import { scenarioMapPoints, scenarioLegs, scenarioRouteSummary } from "../scenario-map.js";
import { selectScenarioCover, pickScenarioCover, coverRank, scenarioImageUsable } from "../scenario-visuals.js";
import { buildPreparationTasks } from "../preparation.js";

const places = [...seedPlaces, ...kudagoPlaces], events = [...seedEvents, ...kudagoEvents];
const month = kudagoMeta.targetMonth, dateAt = (d) => `${month}-${String(d).padStart(2, "0")}`;
const findings = {};
function flag(code, id, detail = "") { const f = (findings[code] ??= { count: 0, ids: new Set(), examples: [] }); f.count++; f.ids.add(id); if (f.examples.length < 6) f.examples.push(`${id}${detail ? " :: " + detail : ""}`); }
const toMin = (s) => { const [h, m] = String(s).split(":").map(Number); return h * 60 + m; };
const BBOX = { latMin: 55.45, latMax: 56.05, lonMin: 37.25, lonMax: 38.0 };
const km = (a, b) => { const R = 6371, r = (x) => x * Math.PI / 180, dp = r(b.lat - a.lat), dl = r(b.lon - a.lon), q = Math.sin(dp / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dl / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(q)); };

// ---------- static catalogue lint ----------
const CAT_WORDS = [
  ["dessert", /десерт|сладк|мороженое|пирожн/i], ["cafe", /кофе|кофейн|чайн/i],
  ["dinner", /ужин|ресторан|поесть|бранч|завтрак/i], ["bar", /(^|[^а-я])бар([^а-я]|$)|коктейл|винн/i],
  ["art", /выставк|музе[йя]|галере|искусств|фотограф|мультимед/i], ["walk", /прогулк|прогул|парк|набережн|пройтись|пройти|улиц/i],
  ["viewpoint", /панорам|крыш|смотров|сверху|вид на/i], ["event", /событи|концерт|спектакл/i],
  ["activity", /боулинг|картинг|каток|танц|квест|мастер|керами|рисован|скалодром|маркет|книж|винил|vr/i]
];
const catOf = (select) => String(select).split(":")[0];
const subOf = (select) => { const i = String(select).indexOf(":"); return i < 0 ? [] : select.slice(i + 1).split("|"); };
const ACTIVE_SUB = new Set(["climbing", "skating", "karting", "dance", "bowling", "vr", "quest", "karaoke", "games", "mini_golf", "water", "billiards"]);
const seenIds = new Set();
function lintBlueprint(b) {
  const id = b.id;
  if (seenIds.has(id)) flag("S0 duplicate blueprint id", id); seenIds.add(id);
  const cats = b.slots.map((s) => catOf(s.select));
  if (b.structureKey !== cats.join(">")) flag("S1 structureKey differs from slots", id, `${b.structureKey} vs ${cats.join(">")}`);
  const minutes = b.slots.reduce((a, s) => a + Number(s.minutes || 0), 0), transfers = (b.slots.length - 1) * 12;
  const ratio = b.duration >= 330 ? .875 : b.duration >= 220 ? .80 : b.duration >= 170 ? .82 : .80;
  const eventSlots = b.slots.some((s) => catOf(s.select) === "event");
  if (!eventSlots && minutes + transfers > b.duration + 5) flag("S2 slots cannot fit the duration", id, `${minutes}+${transfers}>${b.duration}`);
  if (!eventSlots && minutes + (b.slots.length - 1) * 26 < Math.floor(b.duration * ratio / 5) * 5) flag("S3 slots can never fill the duration floor", id, `${minutes} of ${b.duration}`);
  for (const [cat, re] of CAT_WORDS) {
    if (re.test(b.concept)) {
      const ok = cats.includes(cat) || (cat === "art" && cats.includes("event")) || (cat === "dinner" && cats.includes("dinner")) || (cat === "event" && cats.includes("event"));
      if (!ok) flag("S4 concept names something the slots do not contain", id, `«${b.concept}» → ${cat}; slots ${cats.join(">")}`);
    }
  }
  b.slots.forEach((s, i) => {
    const cat = catOf(s.select), hits = CAT_WORDS.filter(([, re]) => re.test(s.role || "")).map(([c]) => c);
    const compatible = new Set([cat, ...(cat === "art" ? ["event"] : []), ...(cat === "event" ? ["art"] : []), ...(cat === "cafe" ? ["dessert", "dinner"] : []), ...(cat === "dessert" ? ["cafe"] : []), ...(cat === "dinner" ? ["cafe"] : [])]);
    if (hits.length && !hits.some((h) => compatible.has(h))) flag("S5 slot role text contradicts slot category", id, `slot ${i + 1} ${s.select}: «${s.role}»`);
    if (!s.role) flag("S6 slot without role text", id, `slot ${i + 1}`);
  });
  const subs = b.slots.flatMap((s) => subOf(s.select));
  const acts = b.slots.filter((s) => catOf(s.select) === "activity");
  if (b.vibes.includes("calm") && b.vibes.length === 1 && acts.length && acts.every((s) => subOf(s.select).length && subOf(s.select).every((x) => ACTIVE_SUB.has(x)))) flag("S7 calm-only scenario made of active activities", id, b.slots.map((s) => s.select).join(" > "));
  if (b.vibes.includes("active") && !b.slots.some((s) => ["activity", "walk"].includes(catOf(s.select)))) flag("S8 active vibe without activity or walk", id, b.slots.map((s) => s.select).join(" > "));
  if (b.dayparts?.includes("morning") && cats.includes("bar")) flag("S9 bar in a morning scenario", id);
  if ((b.dayparts || []).every((d) => ["evening", "late"].includes(d)) && b.dayparts?.length && b.slots.some((s) => /breakfast|brunch/.test(s.select))) flag("S10 breakfast in an evening-only scenario", id);
  if (!b.concept || b.concept.length > 48) flag("S11 concept empty or longer than 48 chars (title falls back to generic)", id, b.concept);
}

// ---------- concrete plan checks ----------
function windowsFor(item, date, offset) {
  const wd = new Date(`${date}T12:00:00`); wd.setDate(wd.getDate() + offset);
  return (item.weeklyHours[wd.getDay()] || []).map(([a, b]) => [offset * 1440 + toMin(a), offset * 1440 + (toMin(b) <= toMin(a) ? toMin(b) + 1440 : toMin(b))]);
}
const heroOf = (items) => { let bi = 0; items.forEach((x, i) => { if (coverRank(x) < coverRank(items[bi])) bi = i; }); return bi; };
const RU_CHAPTER = (n) => (n % 10 === 1 && n % 100 !== 11 ? "глава" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "главы" : "глав");

function checkPlan(b, plan, filters, ctx) {
  const id = b.id, items = plan.items, tl = plan.timeline;
  const hard = auditPlanConstraints(plan, filters);
  for (const [k, ok] of Object.entries(hard)) if (!ok) flag(`D2 hard constraint failed: ${k}`, id, ctx);
  // chapters vs slots
  items.forEach((item, i) => {
    const sel = b.slots[i].select, cat = catOf(sel), subs = subOf(sel), sub = item.subtype || item.eventType;
    if (item.category !== cat) flag("D3 chapter category differs from slot", id, `${sel} got ${item.category} «${item.title}»`);
    else if (subs.length && sub && !subs.includes(sub)) flag("D3b chapter subtype differs from slot", id, `${sel} got ${sub} «${item.title}»`);
  });
  // timeline
  let prevEnd = -1;
  const t0 = toMin(filters.time);
  tl.forEach((n, i) => {
    const item = n.item;
    if (n.start < prevEnd) flag("D4 stops overlap or go backwards", id, ctx);
    prevEnd = n.end;
    if (n.end - n.start !== n.duration) flag("D4b stop length differs from its duration", id, `${item.title}`);
    if (n.start < t0) flag("D4c stop starts before the requested start", id, ctx);
    if (item.weeklyHours) {
      const ok = [0, 1].some((off) => windowsFor(item, filters.date, off).some(([s, e]) => n.start >= s && n.end <= e));
      if (!ok) flag("D4d venue is closed during its slot", id, `${item.title} ${n.start}-${n.end} ${filters.date}`);
    } else if (!["walk"].includes(item.category) && !(item.category === "event") && !String(item.id).endsWith("~view")) flag("D4e venue without any schedule data", id, `${item.category} «${item.title}»`);
    if (item.category === "event" && n.fixedStart) {
      const times = (item.occurrences?.[filters.date] || item.startTimes || []).map(toMin);
      if (times.length && !times.includes(n.start)) flag("D4f event start differs from listed session time", id, item.title);
    }
  });
  if (tl.length && tl.at(-1).end > 26 * 60 + 30) flag("D4g date ends after 02:30", id, ctx);
  if (plan.totalMinutes > b.duration + 5 || plan.totalMinutes < b.duration * 0.6) flag("D4h total duration far from the scenario duration", id, `${plan.totalMinutes} vs ${b.duration}`);
  // item data
  for (const item of items) {
    const c = item.coords;
    if (!c || !Number.isFinite(+c.lat) || !Number.isFinite(+c.lon)) flag("D5 chapter without coordinates (not on map)", id, `${item.category} «${item.title}»`);
    else if (+c.lat < BBOX.latMin || +c.lat > BBOX.latMax || +c.lon < BBOX.lonMin || +c.lon > BBOX.lonMax) flag("D5b coordinates outside Moscow", id, `«${item.title}» ${c.lat},${c.lon}`);
    if (!item.address || /^(москва|центр москвы)$/i.test(String(item.address).trim())) flag("D5c chapter has no street address", id, `«${item.title}»`);
    if (!(item.sourceUrl || item.officialUrl)) flag("D5d chapter has no link at all", id, `${item.category} «${item.title}»`);
    if (Number(item.costForTwo) < 0 || Number(item.costForTwo) > 25000) flag("D5e implausible cost", id, `«${item.title}» ${item.costForTwo}`);
    if (!item.description || String(item.description).trim().length < 20) flag("D5f chapter has no description (generic text shown)", id, `${item.category} «${item.title}»`);
  }
  // duplicates inside a plan
  const imgs = items.map((x) => x.image).filter(Boolean);
  if (new Set(imgs).size !== imgs.length) flag("D6 same image used for two chapters", id);
  const eating = (x) => ["cafe", "dessert", "dinner", "bar"].includes(x.category), visiting = (x) => ["art", "event"].includes(x.category);
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i].coords, c = items[j].coords;
    if (a && c && km(a, c) < 0.03 && ((eating(items[i]) && eating(items[j])) || (visiting(items[i]) && visiting(items[j])))) flag("D6b two chapters at the same point (markers overlap)", id, `«${items[i].title}» / «${items[j].title}»`);
  }
  // cover
  const cover = selectScenarioCover(plan);
  if (!cover) flag("D7 no usable cover image", id, `${items.map((x) => x.category + (x.image ? "+" : "-")).join(" ")}`);
  else {
    const coverItem = items.findIndex((x) => x.image === cover), hero = heroOf(items);
    if (coverItem < 0) flag("D7b cover is not an image of any chapter", id);
    if (!scenarioImageUsable(cover)) flag("D7c cover URL unusable", id);
    // the cover must be the photo of the best-ranked chapter that has a photo
    const best = items.filter((x) => scenarioImageUsable(x.image)).sort((a, c) => coverRank(a) - coverRank(c))[0];
    if (best && coverRank(items[coverItem]) !== coverRank(best)) flag("D7e cover is not the image of the scenario's main chapter", id, `cover=${items[coverItem].category} best=${best.category}`);
    if (plan.coverImage !== cover) flag("D7f engine cover differs from the cover shown on the card", id);
    if (pickScenarioCover(items) !== cover) flag("D7g cover helper disagrees with selectScenarioCover", id);
  }
  // map
  const pts = scenarioMapPoints(plan), summary = scenarioRouteSummary(plan);
  if (pts.length < 2) flag("D8 map has fewer than 2 points", id, `${pts.length}/${items.length}`);
  else if (pts.length !== items.length) flag("D8b map is missing some chapters", id, `${pts.length}/${items.length}`);
  pts.forEach((p, i) => { if (p.index !== i + 1 && pts.length === items.length) flag("D8c marker number differs from chapter number", id); });
  const legs = scenarioLegs(plan);
  legs.forEach((l, i) => { if (l.km != null && (l.minutes == null || l.minutes < 5 || l.minutes > 40)) flag("D8d implausible transfer time", id, `${l.km?.toFixed(1)} km → ${l.minutes} min`); });
  if (Math.abs(summary.totalMinutes - plan.transferMinutes) > 8 && plan.transferMinutes != null) flag("D8e map route time differs from scheduled transfer time", id, `${summary.totalMinutes} vs ${plan.transferMinutes}`);
  // preparation planner
  const rows = planRows(plan), tasks = buildPreparationTasks(plan, filters);
  if (new Set(tasks.map((t) => t.id)).size !== tasks.length) flag("D9 duplicate preparation task id", id);
  for (const t of tasks) if ((t.type === "ticket" || t.type === "booking") && !t.url) flag(`D9b ${t.type} task without a link (shows "Ссылка недоступна")`, id, `«${t.itemTitle}»`);
  for (const item of items) {
    if (item.category === "dinner" && !tasks.some((t) => t.type === "booking" && t.itemTitle === item.title)) flag("D9c dinner without a booking task", id, item.title);
    if (item.category === "event" && Number(item.costForTwo) > 0 && !tasks.some((t) => t.type === "ticket" && t.itemTitle === item.title)) flag("D9d paid event without a ticket task", id, item.title);
  }
  if (rows.length !== items.length) flag("D9e planRows length differs from chapters", id);
  // texts
  for (const [k, v] of [["title", plan.title], ["story", plan.story], ["why", plan.why]]) {
    if (!v || /undefined|NaN|null|\[object/i.test(v)) flag(`D10 ${k} broken`, id, v);
    if (v && /\s{2,}|\.\./.test(v)) flag(`D10b ${k} has double spaces or dots`, id, v.slice(0, 80));
    if (v && k !== "title" && /\. [а-я]/.test(v)) flag(`D10c ${k} sentence starts with lowercase`, id, v.slice(0, 90));
  }
  if (plan.title.length > 52) flag("D10d title too long for the card", id, plan.title);
}

// ---------- driver ----------
function contexts(b) {
  const usesEvents = b.slots.some((s) => catOf(s.select) === "event");
  const days = usesEvents ? [1, 4, 7, 10, 13, 17, 21, 25, 28] : [6, 10, 18];
  const dp = b.dayparts || ["morning", "day", "evening", "late"];
  const timeFor = { morning: "10:00", day: "13:00", evening: "19:00", late: "22:00" };
  const times = (b.dayparts ? dp : ["day", "evening"]).map((d) => timeFor[d]);
  return { days, times };
}
export function run(start = 1, end = scenarioBlueprints.length) {
  const stats = { blueprints: 0, dead: [], plans: 0, contexts: 0, coverPlans: 0 };
  for (let n = start; n <= end; n++) {
    const b = scenarioBlueprints[n - 1];
    if (!b) continue;
    stats.blueprints++; lintBlueprint(b);
    const { days, times } = contexts(b);
    const hasFood = b.slots.some((s) => ["cafe", "dessert", "dinner"].includes(catOf(s.select)));
    let found = 0;
    for (const day of days) for (const time of times) {
      for (const vibe of [...new Set([b.vibes[0], b.vibes.at(-1)])]) {
        const filters = { date: dateAt(day), time, duration: b.duration, budget: 999999, zone: "any", vibes: [vibe], food: hasFood, useEvents: true, indoorOnly: false, noBars: false, avoidVisited: false, adventure: "balanced", likedItemIds: [], visitedItemIds: [], dislikedItemIds: [], recentlyShownItemIds: [] };
        stats.contexts++;
        const plans = generateTemplateDates({ places, events, filters, templateId: b.id, count: 1, variationSeed: 0 });
        if (!plans.length) continue;
        found++; stats.plans++;
        checkPlan(b, plans[0], filters, `${filters.date} ${time} ${vibe}`);
      }
    }
    if (!found) {
      // second chance: other plausible start times (a concert at 19:30 needs a 16:00-17:00 start, not 13:00)
      const spare = ["11:00", "15:00", "16:00", "17:00", "18:00", "20:00"];
      outer: for (const day of days) for (const time of spare) for (const vibe of [...new Set([b.vibes[0], b.vibes.at(-1)])]) {
        const filters = { date: dateAt(day), time, duration: b.duration, budget: 999999, zone: "any", vibes: [vibe], food: hasFood, useEvents: true, indoorOnly: false, noBars: false, avoidVisited: false, adventure: "balanced", likedItemIds: [], visitedItemIds: [], dislikedItemIds: [], recentlyShownItemIds: [] };
        stats.contexts++;
        const plans = generateTemplateDates({ places, events, filters, templateId: b.id, count: 1, variationSeed: 0 });
        if (!plans.length) continue;
        found++; stats.plans++; stats.aliveOnlyAtOtherTimes = (stats.aliveOnlyAtOtherTimes || 0) + 1;
        checkPlan(b, plans[0], filters, `${filters.date} ${time} ${vibe}`);
        break outer;
      }
    }
    if (!found) { stats.dead.push(b.id); flag("D1 scenario never produces a plan in any tested context", b.id, `${b.concept} · ${b.slots.map((s) => s.select).join(" > ")} · dayparts ${b.dayparts || "any"}`); }
  }
  return { stats, findings };
}
const direct = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (direct) {
  const start = Number(process.argv[2] || 1), end = Number(process.argv[3] || scenarioBlueprints.length), out = process.argv[4];
  const t = Date.now(), { stats, findings: f } = run(start, end);
  const plain = Object.fromEntries(Object.entries(f).sort().map(([k, v]) => [k, { count: v.count, scenarios: v.ids.size, ids: [...v.ids], examples: v.examples }]));
  const payload = { range: [start, end], seconds: Math.round((Date.now() - t) / 1000), stats, findings: plain };
  if (out) writeFileSync(out, JSON.stringify(payload));
  console.log(`range ${start}-${end}: ${stats.plans} plans in ${stats.contexts} contexts, ${Math.round((Date.now() - t) / 1000)}s; dead=${stats.dead.length}`);
  for (const [k, v] of Object.entries(plain)) console.log(`${String(v.scenarios).padStart(4)} scenarios ${String(v.count).padStart(5)}x  ${k}`);
}
