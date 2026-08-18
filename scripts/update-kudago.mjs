import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../data/kudago.generated.js");
const API = "https://kudago.com/public-api/v1.4";
const CITY = process.env.KUDAGO_CITY || "msk";
const PLACE_PAGES = Number(process.env.KUDAGO_PLACE_PAGES || 3);
const EVENT_PAGES = Number(process.env.KUDAGO_EVENT_PAGES || 2);

const zoneCenters = {
  center:[55.7558,37.6173], city:[55.7487,37.5378], vdnh:[55.8298,37.6320],
  west:[55.735,37.47], south:[55.64,37.63], east:[55.76,37.77]
};

function nearestZone(coords) {
  if (!coords?.lat || !coords?.lon) return "center";
  const lat = Number(coords.lat), lon = Number(coords.lon);
  let best = "center", bestD = Infinity;
  for (const [zone,[zlat,zlon]] of Object.entries(zoneCenters)) {
    const d = ((lat-zlat)*1.8)**2 + (lon-zlon)**2;
    if (d < bestD) { bestD = d; best = zone; }
  }
  return best;
}

function classifyPlace(categories=[]) {
  const text = categories.join(" ").toLowerCase();
  if (/restaurant|restaurants|food|eat/.test(text)) return "dinner";
  if (/cafe|coffee/.test(text)) return "cafe";
  if (/bar|pub/.test(text)) return "bar";
  if (/park|garden/.test(text)) return "walk";
  if (/view|observation/.test(text)) return "viewpoint";
  if (/museum|gallery|art/.test(text)) return "art";
  if (/theatre|theater|cinema|club|entertainment|amusement|quest/.test(text)) return "activity";
  if (/attract|landmark/.test(text)) return "walk";
  return null;
}

function vibesFor(category, text="") {
  const base = {
    dinner:["romantic","calm"], cafe:["calm","romantic"], bar:["fun","romantic"], dessert:["romantic","calm"],
    walk:["romantic","calm","active"], viewpoint:["romantic","unusual"], art:["calm","unusual","romantic"],
    activity:["fun","unusual","active"], event:["fun","unusual"]
  }[category] || ["calm"];
  const t = text.toLowerCase();
  if (/роман|любов|свидан/.test(t) && !base.includes("romantic")) base.push("romantic");
  if (/интерактив|иммерсив|необыч|мультимед/.test(t) && !base.includes("unusual")) base.push("unusual");
  return base;
}

function roughPlaceCost(category) {
  return { dinner:4500, cafe:1600, bar:3500, dessert:1600, walk:0, viewpoint:2200, art:1600, activity:3000 }[category] ?? 2000;
}
function roughDuration(category) {
  return { dinner:90, cafe:55, bar:75, dessert:50, walk:60, viewpoint:60, art:75, activity:85, event:100 }[category] ?? 70;
}

function parsePrice(text="", isFree=false) {
  if (isFree || /бесплат/i.test(text)) return { value:0, estimated:false };
  const pair = text.match(/свидани[ея]\D{0,24}([\d\s]{3,})/i);
  if (pair) return { value:Number(pair[1].replace(/\s/g,"")), estimated:false };
  const nums = [...text.matchAll(/\d[\d\s]{1,8}/g)].map((m) => Number(m[0].replace(/\s/g,""))).filter((n) => n >= 100 && n < 100000);
  if (nums.length) return { value:Math.min(...nums) * 2, estimated:false };
  return { value:2500, estimated:true };
}

async function fetchJSON(path, params) {
  const url = new URL(API + path);
  for (const [key,value] of Object.entries(params)) if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  const response = await fetch(url, { headers:{ "User-Agent":"1001-Dates-MVP/1.0" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

async function fetchPages(path, baseParams, pages) {
  const all = [];
  for (let page=1; page<=pages; page++) {
    const payload = await fetchJSON(path, { ...baseParams, page, page_size:100 });
    all.push(...(payload.results || []));
    if (!payload.next) break;
  }
  return all;
}

function normalizePlace(p) {
  const category = classifyPlace(p.categories || []);
  if (!category || p.is_closed) return null;
  return {
    id:`kudago-place-${p.id}`,
    title:p.title,
    category,
    zone:nearestZone(p.coords),
    address:p.address || (p.subway ? `метро ${p.subway}` : "Москва"),
    costForTwo:roughPlaceCost(category),
    costEstimated:true,
    duration:roughDuration(category),
    indoor:!["walk","viewpoint"].includes(category),
    vibes:vibesFor(category, `${p.title || ""} ${p.description || ""}`),
    quality:Math.min(9.5, 7 + Math.log10(1 + (p.favorites_count || 0))*.55),
    image:p.images?.[0]?.image || null,
    source:"KudaGo API",
    sourceUrl:p.site_url || null
  };
}

function eventCategory(categories=[]) {
  const text = categories.join(" ").toLowerCase();
  if (/exhibition/.test(text)) return "exhibition";
  if (/concert/.test(text)) return "concert";
  if (/theater|theatre/.test(text)) return "theater";
  if (/quest/.test(text)) return "quest";
  if (/festival/.test(text)) return "festival";
  return "event";
}

function normalizeDates(dates=[]) {
  const clean = dates.filter((d) => d?.start || d?.start_date);
  const exactDates = [...new Set(clean.map((d) => d.start_date || new Date(d.start*1000).toISOString().slice(0,10)))];
  const startTimes = [...new Set(clean.map((d) => d.start_time).filter(Boolean))].slice(0,6);
  if (exactDates.length && exactDates.length <= 24) return { exactDates, startTimes };
  if (exactDates.length) return { activeFrom:exactDates[0], activeUntil:exactDates.at(-1), startTimes };
  return {};
}

function normalizeEvent(e) {
  const place = e.place || {};
  const pricing = parsePrice(e.price || "", e.is_free);
  const type = eventCategory(e.categories || []);
  return {
    id:`kudago-event-${e.id}`,
    title:e.short_title || e.title,
    category:"event",
    eventType:type,
    zone:nearestZone(place.coords),
    address:place.address || place.title || "Москва",
    costForTwo:pricing.value,
    costEstimated:pricing.estimated,
    duration:type === "exhibition" ? 80 : type === "theater" ? 130 : type === "concert" ? 110 : 100,
    indoor:!(/festival|excursion/.test((e.categories || []).join(" ").toLowerCase())),
    vibes:vibesFor("event", `${e.title || ""} ${e.description || ""}`),
    quality:Math.min(9.7, 7.2 + Math.log10(1 + (e.favorites_count || 0))*.55),
    ...normalizeDates(e.dates || []),
    image:e.images?.[0]?.image || null,
    source:"KudaGo API",
    sourceUrl:e.site_url || null
  };
}

const now = Math.floor(Date.now()/1000);
const until = now + 45*24*60*60;
console.log(`Fetching KudaGo data for ${CITY}...`);

const rawPlaces = await fetchPages("/places/", {
  location:CITY,
  order_by:"-favorites_count",
  text_format:"text",
  fields:"id,title,slug,address,coords,subway,site_url,categories,is_closed,images,favorites_count,description",
  expand:"images"
}, PLACE_PAGES);

const rawEvents = await fetchPages("/events/", {
  location:CITY,
  actual_since:now,
  actual_until:until,
  order_by:"-favorites_count",
  text_format:"text",
  fields:"id,title,short_title,dates,place,description,categories,age_restriction,price,is_free,images,favorites_count,site_url",
  expand:"place,dates,images"
}, EVENT_PAGES);

const places = rawPlaces.map(normalizePlace).filter(Boolean);
const events = rawEvents.map(normalizeEvent).filter((e) => e.title && (e.exactDates?.length || e.activeFrom));
const updatedAt = new Date().toISOString();
const js = `// Generated automatically from the KudaGo public API.\nexport const kudagoPlaces = ${JSON.stringify(places, null, 2)};\n\nexport const kudagoEvents = ${JSON.stringify(events, null, 2)};\n\nexport const kudagoMeta = ${JSON.stringify({ updatedAt, city:CITY, source:"KudaGo public API", rawPlaces:rawPlaces.length, rawEvents:rawEvents.length }, null, 2)};\n`;
await writeFile(OUT, js, "utf8");
console.log(`Saved ${places.length} relevant places and ${events.length} current events to ${OUT}`);
