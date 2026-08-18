import { seedPlaces, seedEvents } from "../data/seed.js";
import { generateDates } from "../engine.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const base = {
  date: "2026-08-22",
  time: "19:00",
  budget: 15000,
  vibes: ["romantic"],
  zone: "any",
  food: true,
  useEvents: true,
  indoorOnly: false,
  noBars: false
};

for (const duration of [120, 180, 240, 360]) {
  const plans = generateDates({ places: seedPlaces, events: seedEvents, filters: { ...base, duration }, count: 3 });
  assert(plans.length === 3, `Expected 3 plans for ${duration} minutes, got ${plans.length}`);
  assert(plans.every((plan) => plan.totalMinutes <= duration + 5), `A plan exceeds selected duration ${duration}`);
}

const longPlans = generateDates({ places: seedPlaces, events: seedEvents, filters: { ...base, duration: 360 }, count: 3 });
assert(longPlans.every((plan) => plan.totalMinutes >= 300), "6-hour filter returned a plan shorter than 5 hours");

const indoorNoBars = generateDates({
  places: seedPlaces,
  events: seedEvents,
  filters: { ...base, duration: 360, indoorOnly: true, noBars: true },
  count: 3
});
assert(indoorNoBars.length === 3, "Expected 3 indoor/no-bar long plans");
assert(indoorNoBars.every((plan) => plan.items.every((item) => item.indoor)), "Indoor-only plan contains an outdoor item");
assert(indoorNoBars.every((plan) => plan.items.every((item) => item.category !== "bar")), "No-bars plan contains a bar");

const lowBudgetLong = generateDates({
  places: seedPlaces,
  events: seedEvents,
  filters: { ...base, duration: 360, budget: 4000 },
  count: 3
});
assert(lowBudgetLong.every((plan) => plan.totalMinutes >= 285), "Low-budget fallback silently returned a short date");

console.log("1001 Dates smoke test: OK");
console.log("6h plans:", longPlans.map((plan) => `${plan.totalMinutes}m / ${plan.totalCost} RUB / ${plan.template.id}`).join(" | "));
