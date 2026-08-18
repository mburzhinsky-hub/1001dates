import { seedPlaces, seedEvents } from "./data/seed.js";
import { kudagoPlaces, kudagoEvents, kudagoMeta } from "./data/kudago.generated.js";
import { generateDates, timelineRows, formatMoney, formatDuration } from "./engine.js";

const $ = (selector) => document.querySelector(selector);
const plannerForm = $("#plannerForm");
const dateInput = $("#dateInput");
const timeInput = $("#timeInput");
const budgetInput = $("#budgetInput");
const budgetValue = $("#budgetValue");
const zoneInput = $("#zoneInput");
const travelInput = $("#travelInput");
const foodInput = $("#foodInput");
const indoorInput = $("#indoorInput");
const eventsInput = $("#eventsInput");
const resultsSection = $("#resultsSection");
const resultsGrid = $("#resultsGrid");
const returnPromise = $("#returnPromise");
const inviteDialog = $("#inviteDialog");
const inviteCard = $("#inviteCard");

let duration = 270;
let vibes = ["romantic"];
let latestPlans = [];
let activePlan = null;

const cityPlaces = dedupe([...seedPlaces, ...kudagoPlaces]);
const cityEvents = dedupe([...seedEvents, ...kudagoEvents]);

function dedupe(items) {
  const map = new Map();
  for (const item of items) map.set(`${item.category}:${item.title}`.toLowerCase(), item);
  return [...map.values()];
}

function localISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,"0");
  const d = String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

dateInput.value = localISODate();
dateInput.min = localISODate();
budgetValue.textContent = `до ${formatMoney(Number(budgetInput.value))}`;

$("#durationControl").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-duration]");
  if (!button) return;
  duration = Number(button.dataset.duration);
  $("#durationControl").querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === button));
});

$("#vibeControl").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-vibe]");
  if (!button) return;
  const value = button.dataset.vibe;
  button.classList.toggle("active");
  vibes = [...$("#vibeControl").querySelectorAll("button.active")].map((b) => b.dataset.vibe);
  if (!vibes.length) { button.classList.add("active"); vibes = [value]; }
});

budgetInput.addEventListener("input", () => budgetValue.textContent = `до ${formatMoney(Number(budgetInput.value))}`);

function currentFilters() {
  return {
    date: dateInput.value,
    time: timeInput.value,
    duration,
    budget: Number(budgetInput.value),
    vibes,
    zone: zoneInput.value,
    travel: travelInput.value,
    food: foodInput.checked,
    indoorOnly: indoorInput.checked,
    useEvents: eventsInput.checked
  };
}

plannerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  runPlanner();
});

$("#surpriseButton").addEventListener("click", () => {
  const moods = ["romantic","fun","unusual","calm","active"];
  vibes = [moods[Math.floor(Math.random()*moods.length)]];
  $("#vibeControl").querySelectorAll("button").forEach((b) => b.classList.toggle("active", vibes.includes(b.dataset.vibe)));
  const budgets = [5000,7000,9000,12000];
  budgetInput.value = budgets[Math.floor(Math.random()*budgets.length)];
  budgetValue.textContent = `до ${formatMoney(Number(budgetInput.value))}`;
  runPlanner();
});

function runPlanner() {
  const filters = currentFilters();
  latestPlans = generateDates({ places:cityPlaces, events:cityEvents, filters, count:3 });
  renderPlans(latestPlans, filters);
  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior:"smooth", block:"start" });
}

function formatDateHuman(value) {
  return new Intl.DateTimeFormat("ru-RU", { weekday:"short", day:"numeric", month:"long" }).format(new Date(`${value}T12:00:00`));
}

function renderPlans(plans, filters) {
  if (!plans.length) {
    resultsGrid.innerHTML = `<div class="empty-state"><strong>В эти ограничения ничего хорошего не помещается.</strong><br><br>Попробуйте добавить 30–60 минут, увеличить бюджет или выбрать «Неважно» в районе.</div>`;
    returnPromise.textContent = "Лучше показать ноль вариантов, чем предложить невыполнимый маршрут.";
    return;
  }
  const latestReturn = plans.map((p) => p.returnTime).sort().at(-1);
  returnPromise.textContent = `Все варианты уже включают ориентировочную дорогу туда и обратно и укладываются примерно до ${latestReturn}.`;
  resultsGrid.innerHTML = plans.map((plan, index) => cardHTML(plan, index, filters)).join("");
  resultsGrid.querySelectorAll("[data-plan-index]").forEach((button) => button.addEventListener("click", () => openInvitation(plans[Number(button.dataset.planIndex)], filters)));
}

function cardHTML(plan, index, filters) {
  const timeline = timelineRows(plan).map((row) => row.type === "stop"
    ? `<div class="timeline-row"><div class="timeline-time">${row.time}</div><div><div class="timeline-title">${escapeHTML(row.title)}</div><div class="timeline-detail">${escapeHTML(row.detail)}</div></div></div>`
    : `<div class="timeline-travel">${escapeHTML(row.text)}</div>`).join("");
  const hasEstimate = plan.items.some((x) => x.costEstimated);
  const source = plan.sourceUrls[0] ? `<a class="source-link" href="${escapeAttr(plan.sourceUrls[0])}" target="_blank" rel="noreferrer">Проверить источник ↗</a>` : "";
  return `<article class="date-card">
    <div class="card-kicker"><span>${escapeHTML(plan.label)}</span><span class="match">${plan.match}% match</span></div>
    <h3>${escapeHTML(plan.title)}</h3>
    <p class="card-summary">${escapeHTML(plan.summary)}</p>
    <div class="card-meta">
      <span class="meta-pill">${formatDuration(plan.totalMinutes)}</span>
      <span class="meta-pill">${hasEstimate ? "≈ " : ""}${formatMoney(plan.totalCost)}</span>
      <span class="meta-pill">домой ≈ ${plan.returnTime}</span>
    </div>
    <div class="timeline">${timeline}</div>
    <div class="card-bottom">${source}<button class="primary-button card-action" data-plan-index="${index}" type="button"><span>Выбираю это свидание</span><span>→</span></button></div>
  </article>`;
}

function openInvitation(plan, filters) {
  activePlan = { plan, filters };
  const dress = filters.vibes.includes("active") ? "удобный casual" : filters.vibes.includes("romantic") ? "чуть красивее обычного" : "как хочется";
  inviteCard.innerHTML = `
    <div class="invite-brand">1001 Dates · invitation</div>
    <div class="invite-title">${escapeHTML(plan.title)}</div>
    <p class="invite-subtitle">Всё уже придумано${filters.vibes.includes("romantic") ? ". Тебе осталось только прийти ❤️" : ". Детали вечера оставлю маленьким сюрпризом."}</p>
    <div class="invite-info">
      <div><span>Когда</span><strong>${escapeHTML(formatDateHuman(filters.date))}, ${filters.time}</strong></div>
      <div><span>Сколько</span><strong>≈ ${formatDuration(plan.totalMinutes)}</strong></div>
      <div><span>Dress code</span><strong>${escapeHTML(dress)}</strong></div>
    </div>`;
  inviteDialog.showModal();
}

$("#closeInvite").addEventListener("click", () => inviteDialog.close());
inviteDialog.addEventListener("click", (event) => { if (event.target === inviteDialog) inviteDialog.close(); });

function inviteText() {
  if (!activePlan) return "";
  const { plan, filters } = activePlan;
  return `1001 Dates — ${plan.title}\n${formatDateHuman(filters.date)}, ${filters.time}\nПримерно ${formatDuration(plan.totalMinutes)}.\nМесто встречи пока секрет. Тебе нужно только прийти ✨`;
}

$("#copyInvite").addEventListener("click", async () => {
  await navigator.clipboard.writeText(inviteText());
  $("#copyInvite").textContent = "Скопировано ✓";
  setTimeout(() => $("#copyInvite").textContent = "Скопировать текст", 1600);
});

$("#shareInvite").addEventListener("click", async () => {
  const text = inviteText();
  if (navigator.share) await navigator.share({ title:"1001 Dates", text });
  else { await navigator.clipboard.writeText(text); $("#shareInvite").querySelector("span")?.remove(); $("#shareInvite").textContent = "Скопировано ✓"; }
});

function escapeHTML(value="") { return String(value).replace(/[&<>'"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }
function escapeAttr(value="") { return escapeHTML(value); }

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(() => {});

console.info(`1001 Dates: ${cityPlaces.length} places, ${cityEvents.length} events. Live KudaGo snapshot: ${kudagoMeta.updatedAt || "not generated"}.`);
