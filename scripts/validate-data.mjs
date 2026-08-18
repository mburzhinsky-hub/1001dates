import { seedPlaces, seedEvents } from "../data/seed.js";
import { kudagoPlaces, kudagoEvents } from "../data/kudago.generated.js";

const strict = process.argv.includes("--strict");
const validCategories = new Set(["dinner","cafe","bar","dessert","walk","viewpoint","art","activity","event"]);
const validSubtypes = new Set([
  "coffee","tea","bakery","pastry","icecream","chocolate","gallery","museum","contemporary","digital","photo","science",
  "park","waterfront","architecture","observation","rooftop","workshop","pottery","painting","cooking","dance","games","bowling",
  "billiards","vr","quest","karaoke","climbing","skating","karting","mini_golf","bookstore","vinyl","market","activity",
  "restaurant","casual","gastropub","breakfast","brunch","cocktail","wine","jazz","concert","theater","standup","movie","show",
  "exhibition","lecture","excursion","festival","party","event"
]);

function assert(condition, message) { if (!condition) throw new Error(message); }
function isHTTP(value) { try { const u = new URL(value); return ["http:","https:"].includes(u.protocol); } catch { return false; } }
function validCoords(coords) { const lat=Number(coords?.lat),lon=Number(coords?.lon); return Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180; }
function concrete(value) {
  if (!value) return true;
  if (!isHTTP(value)) return false;
  const u = new URL(value);
  if (!u.hostname.endsWith("kudago.com")) return true;
  return /^\/msk\/(place|event)\/[^/]+\/?$/.test(u.pathname);
}
function validOccurrences(value) {
  if(value==null)return true;
  if(typeof value!=="object"||Array.isArray(value))return false;
  for(const [date,times] of Object.entries(value)){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Array.isArray(times))return false;
    if(!times.every((x)=>/^\d{2}:\d{2}$/.test(String(x))))return false;
  }
  return true;
}
function validWeeklyHours(value) {
  if (value == null) return true;
  if (typeof value !== "object" || Array.isArray(value)) return false;
  for (const [day,windows] of Object.entries(value)) {
    if (!/^[0-6]$/.test(String(day)) || !Array.isArray(windows)) return false;
    for (const window of windows) if (!Array.isArray(window) || window.length!==2 || !window.every((x)=>/^\d{2}:\d{2}$/.test(String(x)))) return false;
  }
  return true;
}
function validate(items, label, generated=false) {
  const ids = new Set();
  for (const item of items) {
    assert(item.id && !ids.has(item.id), `${label}: duplicate or missing id ${item.id}`); ids.add(item.id);
    assert(item.title, `${label}: missing title for ${item.id}`);
    assert(validCategories.has(item.category), `${label}: invalid category ${item.category}`);
    assert(Number.isFinite(Number(item.duration)) && Number(item.duration) > 0, `${label}: invalid duration for ${item.id}`);
    assert(Number.isFinite(Number(item.costForTwo)) && Number(item.costForTwo) >= 0, `${label}: invalid cost for ${item.id}`);
    assert(concrete(item.sourceUrl), `${label}: generic/bad sourceUrl for ${item.id}: ${item.sourceUrl}`);
    assert(!item.officialUrl || isHTTP(item.officialUrl), `${label}: bad officialUrl for ${item.id}`);
    if (item.coords) assert(validCoords(item.coords), `${label}: invalid coords for ${item.id}`);
    if (item.weeklyHours != null) assert(validWeeklyHours(item.weeklyHours), `${label}: malformed weeklyHours for ${item.id}`);
    if (item.occurrences != null) assert(validOccurrences(item.occurrences), `${label}: malformed occurrences for ${item.id}`);
    if (generated) assert(item.subtype && validSubtypes.has(item.subtype), `${label}: missing/unknown subtype ${item.subtype} for ${item.id}`);
  }
}

validate(seedPlaces, "seedPlaces");
validate(seedEvents, "seedEvents");
validate(kudagoPlaces, "kudagoPlaces", true);
validate(kudagoEvents, "kudagoEvents", true);

if (strict) {
  assert(kudagoPlaces.length >= 100, `Strict mode: expected >=100 imported places, got ${kudagoPlaces.length}`);
  assert(kudagoEvents.length >= 30, `Strict mode: expected >=30 imported events, got ${kudagoEvents.length}`);
  const categories = new Set(kudagoPlaces.map((x)=>x.category));
  const subtypes = new Set(kudagoPlaces.map((x)=>x.subtype));
  assert(categories.size >= 6, `Strict mode: imported place base is too narrow (${categories.size} categories)`);
  assert(subtypes.size >= 10, `Strict mode: imported place base is too narrow (${subtypes.size} subtypes)`);
  assert(kudagoPlaces.filter((x) => x.sourceUrl || x.officialUrl).length >= Math.min(50, Math.floor(kudagoPlaces.length * .25)), "Strict mode: too few useful place links");
  assert(kudagoEvents.filter((x) => x.sourceUrl).length >= Math.min(20, Math.floor(kudagoEvents.length * .25)), "Strict mode: too few useful event links");
  assert(kudagoPlaces.every((x)=>validCoords(x.coords)), "Strict mode: every imported place must have coordinates for route validation");
  assert(kudagoEvents.every((x)=>validCoords(x.coords)), "Strict mode: every imported event must have coordinates for route validation");
}

console.log(`Data validation OK: seed ${seedPlaces.length}+${seedEvents.length}; generated ${kudagoPlaces.length}+${kudagoEvents.length}`);
