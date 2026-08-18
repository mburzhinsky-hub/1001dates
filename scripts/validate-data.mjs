import { seedPlaces, seedEvents } from "../data/seed.js";
import { kudagoPlaces, kudagoEvents } from "../data/kudago.generated.js";

const strict = process.argv.includes("--strict");
const validCategories = new Set(["dinner","cafe","bar","dessert","walk","viewpoint","art","activity","event"]);

function assert(condition, message) { if (!condition) throw new Error(message); }
function isHTTP(value) { try { const u = new URL(value); return ["http:","https:"].includes(u.protocol); } catch { return false; } }
function concrete(value) {
  if (!value) return true;
  if (!isHTTP(value)) return false;
  const u = new URL(value);
  if (!u.hostname.endsWith("kudago.com")) return true;
  return /^\/msk\/(place|event)\/[^/]+\/?$/.test(u.pathname);
}
function validate(items, label) {
  const ids = new Set();
  for (const item of items) {
    assert(item.id && !ids.has(item.id), `${label}: duplicate or missing id ${item.id}`); ids.add(item.id);
    assert(item.title, `${label}: missing title for ${item.id}`);
    assert(validCategories.has(item.category), `${label}: invalid category ${item.category}`);
    assert(Number.isFinite(Number(item.duration)) && Number(item.duration) > 0, `${label}: invalid duration for ${item.id}`);
    assert(Number.isFinite(Number(item.costForTwo)) && Number(item.costForTwo) >= 0, `${label}: invalid cost for ${item.id}`);
    assert(concrete(item.sourceUrl), `${label}: generic/bad sourceUrl for ${item.id}: ${item.sourceUrl}`);
    assert(!item.officialUrl || isHTTP(item.officialUrl), `${label}: bad officialUrl for ${item.id}`);
  }
}

validate(seedPlaces, "seedPlaces");
validate(seedEvents, "seedEvents");
validate(kudagoPlaces, "kudagoPlaces");
validate(kudagoEvents, "kudagoEvents");

if (strict) {
  assert(kudagoPlaces.length >= 80, `Strict mode: expected >=80 imported places, got ${kudagoPlaces.length}`);
  assert(kudagoEvents.length >= 30, `Strict mode: expected >=30 imported events, got ${kudagoEvents.length}`);
  const categories = new Map();
  for (const item of kudagoPlaces) categories.set(item.category, (categories.get(item.category) || 0) + 1);
  assert(categories.size >= 5, `Strict mode: imported place base is too narrow (${categories.size} categories)`);
  assert(kudagoPlaces.filter((x) => x.sourceUrl || x.officialUrl).length >= Math.min(40, Math.floor(kudagoPlaces.length * .25)), "Strict mode: too few useful place links");
  assert(kudagoEvents.filter((x) => x.sourceUrl).length >= Math.min(20, Math.floor(kudagoEvents.length * .25)), "Strict mode: too few useful event links");
}

console.log(`Data validation OK: seed ${seedPlaces.length}+${seedEvents.length}; generated ${kudagoPlaces.length}+${kudagoEvents.length}`);
