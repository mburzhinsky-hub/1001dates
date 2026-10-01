// Regression tests for the mechanics audit (October 2026): "more" never runs dry, calm+active works,
// night plans respect opening hours, the calendar file is time-zone safe, 6-hour dates stay fast.
import { seedPlaces, seedEvents } from "../data/seed.js";
import { kudagoPlaces, kudagoEvents, kudagoMeta } from "../data/kudago.generated.js";
import { generateDates, replacePlanItem, generateNearbyDates, repairScenarioItem } from "../engine-v14.js?v=duration5";
import { buildCalendarICS, buildPreparationTasks } from "../preparation.js";

function assert(c, m) { if (!c) throw new Error(m); }
const places = [...seedPlaces, ...kudagoPlaces], events = [...seedEvents, ...kudagoEvents];
const month = kudagoMeta.targetMonth;
const day = (n) => `${month}-${String(n).padStart(2, "0")}`;
const base = { duration: 180, budget: 7000, vibes: ["romantic"], zone: "any", time: "19:00", food: true, useEvents: true, indoorOnly: false, noBars: false, adventure: "balanced", avoidVisited: false, likedItemIds: [], visitedItemIds: [], dislikedItemIds: [], recentlyShownItemIds: [] };
const gen = (f, seed = 0, anchorItem = null) => generateDates({ places, events, filters: f, count: 3, variationSeed: seed, anchorItem });

// 1. Pressing "more" repeatedly must keep returning dates (repeats are scored down, never forbidden).
for (const extra of [{ date: day(6), duration: 120, budget: 4000 }, { date: day(3) }, { date: day(3), zone: "center" }]) {
  let recent = [], seed = 0;
  const first = gen({ ...base, ...extra }, 0).length;
  assert(first > 0, `no first result for ${JSON.stringify(extra)}`);
  for (let click = 0; click < 12; click++) {
    const plans = gen({ ...base, ...extra, recentlyShownItemIds: recent }, seed++);
    assert(plans.length > 0, `"more" ran dry on click ${click + 1} for ${JSON.stringify(extra)}`);
    const ids = plans.flatMap((p) => p.items.map((i) => i.id));
    recent = [...new Set([...ids, ...recent])].slice(0, 90);
  }
}

// 2. Fresh ideas come first: with a long recent list the next result differs from the previous one.
{
  const f = { ...base, date: day(3) };
  const a = gen(f, 0), recent = a.flatMap((p) => p.items.map((i) => i.id));
  const b = gen({ ...f, recentlyShownItemIds: recent }, 1);
  const overlap = b.flatMap((p) => p.items.map((i) => i.id)).filter((id) => recent.includes(id)).length;
  assert(overlap < recent.length / 2, `fresh results still repeat most places (${overlap}/${recent.length})`);
}

// 3. Calm + active used to be impossible by definition.
{
  const found = [day(3), day(6)].some((date) => [999999, 10000].some((budget) => gen({ ...base, date, budget, vibes: ["calm", "active"] }).length > 0));
  assert(found, "calm + active still never returns a date");
}

// 4. Night dates: every venue with a known or assumed schedule must be open for the whole stay.
function windowsFor(item, date, offset) {
  const wd = new Date(`${date}T12:00:00`); wd.setDate(wd.getDate() + offset);
  const toMin = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  return (item.weeklyHours[wd.getDay()] || []).map(([a, b]) => { const s = offset * 1440 + toMin(a), e = offset * 1440 + (toMin(b) <= toMin(a) ? toMin(b) + 1440 : toMin(b)); return [s, e]; });
}
let nightChecked = 0;
for (const time of ["19:00", "22:30"]) for (const duration of [120, 180]) for (const vibes of [["romantic"], ["fun"], ["calm"]]) {
  const date = day(6);
  for (const plan of gen({ ...base, date, time, duration, vibes, budget: 999999 })) for (const node of plan.timeline) {
    const item = node.item;
    if (item.category === "walk" || (item.category === "event" && !item.weeklyHours)) continue;
    assert(item.weeklyHours, `${item.title} (${item.category}) has no schedule at all`);
    const ok = [0, 1].some((off) => windowsFor(item, date, off).some(([s, e]) => node.start >= s && node.end <= e));
    assert(ok, `${item.title} (${item.category}) is scheduled ${node.start}-${node.end} outside its opening hours`);
    nightChecked++;
  }
}
assert(nightChecked > 0, "night opening-hours check had nothing to verify");

// 5. Parks stay unrestricted; everything else gets a schedule.
assert(repairScenarioItem({ id: "x3", title: "Парк Горького", category: "walk" }).scheduleConfidence !== "default", "parks stay unrestricted");

// 6. Calendar file: pinned to Moscow time, valid structure, escaped text.
{
  const plan = { title: "Вечер, кино; ужин", totalMinutes: 175, template: { id: "t-1" }, items: [{ title: "Кино", address: "Москва, Тверская 1" }, { title: "Ужин" }] };
  const ics = buildCalendarICS(plan, { date: "2026-10-03", time: "19:00" }, new Date("2026-10-01T12:00:00Z"));
  assert(ics.includes("DTSTART:20261003T160000Z"), "19:00 Moscow must be 16:00 UTC");
  assert(ics.includes("DTEND:20261003T185500Z"), "end must follow the real duration");
  assert(ics.includes("UID:") && ics.includes("DTSTAMP:20261001T120000Z"), "UID and DTSTAMP are mandatory");
  assert(ics.includes("SUMMARY:Вечер\\, кино\\; ужин"), "SUMMARY must be escaped");
  assert(ics.includes("LOCATION:Москва\\, Тверская 1") && ics.includes("DESCRIPTION:1. Кино\\n2. Ужин"), "location and plan must be included");
  assert(ics.split("\r\n").length > 10 && !/[^\r]\n/.test(ics), "lines must end with CRLF");
  const tasks = buildPreparationTasks(plan, { date: "2026-10-03", time: "19:00" });
  assert(!/2026-10-03/.test(tasks[0].subtitle), "preparation shows a raw ISO date");
}

// 7. Six-hour dates must not freeze the page, and impossible budgets must be rejected cheaply.
{
  const t0 = Date.now();
  gen({ ...base, date: day(6), duration: 360, time: "13:00", budget: 4000 });
  const cheap = Date.now() - t0;
  const t1 = Date.now();
  gen({ ...base, date: day(6), duration: 360, time: "13:00", budget: 999999 });
  const rich = Date.now() - t1;
  assert(cheap < 1500, `6h with a small budget took ${cheap} ms`);
  assert(rich < 5000, `6h without a limit took ${rich} ms`);
}

// 8. Replacing a chapter in a nearby plan keeps the distance badge data.
{
  const origin = { lat: 55.7558, lon: 37.6173 };
  const { plans } = generateNearbyDates({ places, events, filters: { ...base, date: day(3) }, count: 3, variationSeed: 0, origin, radii: [2, 4, 6] });
  assert(plans.length > 0 && plans[0].nearby, "nearby plan expected");
  const filters = { ...plans[0].filters };
  const next = replacePlanItem({ plan: plans[0], itemIndex: 0, places, events, filters, variationSeed: 11 });
  assert(next.nearby && Number.isFinite(next.nearby.startDistanceKm), "nearby summary lost after replacing a chapter");
}
console.log("Audit fixes OK");
