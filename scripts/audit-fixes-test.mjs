// Regression tests for the mechanics audit (October 2026): "more" never runs dry, calm+active works,
// night plans respect opening hours, the calendar file is time-zone safe, 6-hour dates stay fast.
import { seedPlaces, seedEvents } from "../data/seed.js";
import { kudagoPlaces, kudagoEvents, kudagoMeta } from "../data/kudago.generated.js";
import { generateDates, replacePlanItem, generateNearbyDates, repairScenarioItem, generateTemplateDates } from "../engine-v14.js?v=duration5";
import { scenarioBlueprints } from "../data/scenarios.js";
import { selectScenarioCover, scenarioImageUsable, scenarioCoverSources } from "../scenario-visuals.js";
import { scenarioMapPoints } from "../scenario-map.js";
import { readFileSync } from "node:fs";
import { buildCalendarICS, buildPreparationTasks, needsSlotBooking } from "../preparation.js";

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
// 9. Scenario audit: every blueprint must fit its duration together with the hidden transfers between chapters.
{
  const EV = { exhibition: 80, lecture: 90, excursion: 100, concert: 110, theater: 130, standup: 100, movie: 120, show: 105, festival: 105, party: 120, event: 105 };
  const nominal = (s) => (!s.useItemDuration ? Number(s.minutes || 60) : EV[(String(s.select).split(":")[1] || "event").split("|")[0]] || 105);
  for (const b of scenarioBlueprints) {
    const total = b.slots.reduce((a, s) => a + nominal(s), 0) + 8 * (b.slots.length - 1);
    assert(total <= b.duration + 5, `${b.id}: chapters (${total} min with the shortest transfers) can never fit ${b.duration} min`);
    assert(b.concept && b.concept.length <= 48, `${b.id}: concept is empty or too long for a card title`);
  }
}

// 10. Scenario audit: every chapter of every generated plan can be shown on the map, opened, and described;
// the cover is the photo of the main chapter; no two food or two exhibition chapters sit on one spot.
{
  const eating = (x) => ["cafe", "dessert", "dinner", "bar"].includes(x.category), visiting = (x) => ["art", "event"].includes(x.category);
  const km = (a, b) => { const R = 6371, r = (x) => x * Math.PI / 180, dp = r(b.lat - a.lat), dl = r(b.lon - a.lon), q = Math.sin(dp / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dl / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(q)); };
  let checked = 0;
  for (let n = 1; n <= scenarioBlueprints.length; n += 9) {
    const b = scenarioBlueprints[n - 1];
    const hasFood = b.slots.some((s) => ["cafe", "dessert", "dinner"].includes(String(s.select).split(":")[0]));
    for (const time of b.dayparts?.includes("morning") ? ["10:00"] : ["13:00", "19:00"]) {
      const filters = { ...base, date: day(10), time, duration: b.duration, budget: 999999, vibes: [b.vibes[0]], food: hasFood };
      const plan = generateTemplateDates({ places, events, filters, templateId: b.id, count: 1 })[0];
      if (!plan) continue;
      checked++;
      assert(scenarioMapPoints(plan).length === plan.items.length, `${b.id}: a chapter has no coordinates and is missing from the map`);
      for (const item of plan.items) {
        assert(item.sourceUrl || item.officialUrl, `${b.id}: «${item.title}» has no link`);
        assert(String(item.description || "").trim().length >= 20, `${b.id}: «${item.title}» has no description`);
      }
      const cover = selectScenarioCover(plan);
      assert(plan.coverImage === cover, `${b.id}: engine cover differs from the cover shown on the card`);
      if (cover) assert(scenarioImageUsable(cover) && plan.items.some((i) => i.image === cover), `${b.id}: cover is not a photo of a chapter`);
      for (let i = 0; i < plan.items.length; i++) for (let j = i + 1; j < plan.items.length; j++) {
        const [x, y] = [plan.items[i], plan.items[j]];
        if (km({ lat: x.coords.lat, lon: x.coords.lon }, { lat: y.coords.lat, lon: y.coords.lon }) < 0.03) assert(!((eating(x) && eating(y)) || (visiting(x) && visiting(y))), `${b.id}: «${x.title}» and «${y.title}» are one spot`);
      }
    }
  }
  assert(checked > 40, `scenario sample produced only ${checked} plans`);
}

// 11. Coffee shops and pastry shops filed under restaurants are found by cafe and dessert slots.
{
  const cafe = repairScenarioItem({ id: "kudago-t1", title: "Кофейня «Тест»", category: "dinner", subtype: "breakfast", coords: { lat: 55.75, lon: 37.6 } });
  assert(cafe.category === "cafe", "coffee shop stays a restaurant");
  const sweets = repairScenarioItem({ id: "kudago-t2", title: "кондитерская «Тест»", category: "dinner", coords: { lat: 55.75, lon: 37.6 } });
  assert(sweets.category === "dessert", "pastry shop stays a restaurant");
}

// 12. Planner wording: slot-based activities are booked by time, not bought as tickets.
{
  const quest = { id: "q", title: "Квест", category: "activity", subtype: "quest", costForTwo: 3000, sourceUrl: "https://example.com/q" };
  assert(needsSlotBooking(quest), "quest should be booked by time slot");
  const task = buildPreparationTasks({ items: [quest] }, { date: day(3), time: "19:00" }).find((t) => t.type === "ticket");
  assert(task && task.title === "Записаться на время" && /запись/i.test(task.linkLabel), "quest task wording");
}

// 13. UI: chapter counts decline correctly and long evenings do not break the invite poster.
{
  const app = readFileSync(new URL("../app-final.js", import.meta.url), "utf8");
  assert(!/\$\{[^}]*\}\s*главы/.test(app), "hard-coded «N главы» label is back");
  assert(app.includes("chaptersLabel(") && app.includes("posterTitles("), "plural helper or poster row limiter missing");
}
// 14. Photos load light: no multi-megabyte originals in the page markup or in the cards, and a broken photo has a fallback.
{
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const app = readFileSync(new URL("../app-final.js", import.meta.url), "utf8");
  const tags = html.match(/<img[^>]*media\.kudago\.com[^>]*>/g) || [];
  assert(tags.length >= 5, "home photos disappeared from index.html");
  for (const tag of tags) assert(/src="https:\/\/media\.kudago\.com\/thumbs\//.test(tag) && /data-full=/.test(tag) && /onerror=/.test(tag), `home photo without thumbnail + fallback: ${tag.slice(0, 80)}`);
  assert((app.match(/<img /g) || []).length === 1 && /function imgHTML[\s\S]{0,900}<img src="\$\{esc\(chain\[0\]\)\}"/.test(app), "every photo must be rendered through imgHTML (thumbnail + fallback chain), not straight from the original URL");
  assert(app.includes("imgHTML(") && app.includes("thumbOf("), "thumbnail helpers missing");
  const plan = { items: [{ category: "cafe", image: "https://media.kudago.com/images/place/aa/bb/cc.jpg" }, { category: "art", image: "https://media.kudago.com/images/place/dd/ee/ff.jpg", imageThumb: "https://media.kudago.com/thumbs/640x384/images/place/dd/ee/ff.jpg" }] };
  const sources = scenarioCoverSources(plan);
  assert(sources.length === 2 && sources[0].full.endsWith("ff.jpg") && sources[0].thumb && sources[0].full === selectScenarioCover(plan), "cover sources must start with the cover and keep the next chapter as a fallback");
}
console.log("Audit fixes OK");
