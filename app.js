import { seedPlaces, seedEvents } from "./data/seed.js";
import { kudagoPlaces, kudagoEvents, kudagoMeta } from "./data/kudago.generated.js";
import { generateDates, planRows, formatMoney, formatDuration } from "./engine.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const STORAGE_KEY = "1001dates.filters.v5";
const DEFAULTS = {
  duration: 180,
  budget: 7000,
  vibe: "romantic",
  zone: "any",
  time: "19:00",
  food: true,
  useEvents: true,
  indoorOnly: false,
  noBars: false
};

const VIBE_LABELS = {
  romantic: "Романтично",
  fun: "Весело",
  unusual: "Необычно",
  calm: "Спокойно",
  active: "Активно"
};

const plannerForm = $("#plannerForm");
const dateInput = $("#dateInput");
const timeInput = $("#timeInput");
const zoneInput = $("#zoneInput");
const foodInput = $("#foodInput");
const eventsInput = $("#eventsInput");
const indoorInput = $("#indoorInput");
const noBarsInput = $("#noBarsInput");
const resultsSection = $("#resultsSection");
const resultsGrid = $("#resultsGrid");
const filterRecap = $("#filterRecap");
const inviteDialog = $("#inviteDialog");
const inviteCard = $("#inviteCard");
const preferencesPanel = $("#preferencesPanel");
const preferencesToggle = $("#preferencesToggle");
const preferenceCount = $("#preferenceCount");

let state = { ...DEFAULTS, ...loadStoredFilters() };
let latestPlans = [];
let activePlan = null;
let inviteTheme = "warm";
let variationSeed = 0;

const cityPlaces = dedupe([...seedPlaces, ...kudagoPlaces]);
const cityEvents = dedupe([...seedEvents, ...kudagoEvents]);

function dedupe(items) {
  const map = new Map();
  for (const item of items) map.set(`${item.category}:${item.title}`.toLowerCase(), item);
  return [...map.values()];
}

function loadStoredFilters() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function persistState() {
  const { duration, budget, vibe, zone, time, food, useEvents, indoorOnly, noBars } = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ duration, budget, vibe, zone, time, food, useEvents, indoorOnly, noBars }));
}

function localISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateHuman(value) {
  return new Intl.DateTimeFormat("ru-RU", { weekday: "short", day: "numeric", month: "long" })
    .format(new Date(`${value}T12:00:00`))
    .replace(/^./, (letter) => letter.toUpperCase());
}

function shortMoney(value) {
  if (value >= 900000) return "любой бюджет";
  return `до ${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

function syncUI() {
  dateInput.min = localISODate();
  if (!dateInput.value || dateInput.value < dateInput.min) dateInput.value = dateInput.min;
  timeInput.value = state.time || DEFAULTS.time;
  zoneInput.value = state.zone || DEFAULTS.zone;
  foodInput.checked = Boolean(state.food);
  eventsInput.checked = Boolean(state.useEvents);
  indoorInput.checked = Boolean(state.indoorOnly);
  noBarsInput.checked = Boolean(state.noBars);

  $$("#durationControl [data-duration]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.duration) === Number(state.duration));
  });
  $$("#budgetControl [data-budget]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.budget) === Number(state.budget));
  });
  $$("#vibeControl [data-vibe]").forEach((button) => {
    button.classList.toggle("active", button.dataset.vibe === state.vibe);
  });

  $("#durationSummary").textContent = formatDuration(state.duration);
  $("#budgetSummary").textContent = shortMoney(state.budget);
  $("#vibeSummary").textContent = VIBE_LABELS[state.vibe] || "Романтично";
  updatePreferenceCount();
}

function updatePreferenceCount() {
  let count = 0;
  if (!foodInput.checked) count++;
  if (!eventsInput.checked) count++;
  if (indoorInput.checked) count++;
  if (noBarsInput.checked) count++;
  preferenceCount.hidden = count === 0;
  preferenceCount.textContent = String(count);
}

function collectState() {
  state = {
    ...state,
    date: dateInput.value,
    time: timeInput.value,
    zone: zoneInput.value,
    food: foodInput.checked,
    useEvents: eventsInput.checked,
    indoorOnly: indoorInput.checked,
    noBars: noBarsInput.checked
  };
  persistState();
  return {
    date: state.date,
    time: state.time,
    duration: Number(state.duration),
    budget: Number(state.budget),
    vibes: [state.vibe],
    zone: state.zone,
    food: state.food,
    useEvents: state.useEvents,
    indoorOnly: state.indoorOnly,
    noBars: state.noBars
  };
}

$("#durationControl").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-duration]");
  if (!button) return;
  state.duration = Number(button.dataset.duration);
  syncUI();
  persistState();
});

$("#budgetControl").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-budget]");
  if (!button) return;
  state.budget = Number(button.dataset.budget);
  syncUI();
  persistState();
});

$("#vibeControl").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-vibe]");
  if (!button) return;
  state.vibe = button.dataset.vibe;
  syncUI();
  persistState();
});

[foodInput, eventsInput, indoorInput, noBarsInput].forEach((input) => {
  input.addEventListener("change", () => {
    collectState();
    updatePreferenceCount();
  });
});

timeInput.addEventListener("change", collectState);
zoneInput.addEventListener("change", collectState);

preferencesToggle.addEventListener("click", () => {
  const open = preferencesPanel.hidden;
  preferencesPanel.hidden = !open;
  preferencesToggle.setAttribute("aria-expanded", String(open));
  preferencesToggle.querySelector("span:first-child").textContent = open ? "− Пожелания" : "+ Пожелания";
});

plannerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  variationSeed = 0;
  runPlanner({ scroll: true });
});

$("#surpriseButton").addEventListener("click", () => {
  const vibes = Object.keys(VIBE_LABELS);
  const durations = [120, 180, 240, 360];
  const budgets = [4000, 7000, 10000, 15000];
  state.vibe = vibes[Math.floor(Math.random() * vibes.length)];
  state.duration = durations[Math.floor(Math.random() * durations.length)];
  state.budget = budgets[Math.floor(Math.random() * budgets.length)];
  state.zone = "any";
  syncUI();
  variationSeed++;
  runPlanner({ scroll: true });
});

$("#moreDatesButton").addEventListener("click", () => {
  variationSeed++;
  runPlanner({ scroll: false });
});

$("#editFiltersButton").addEventListener("click", () => {
  plannerForm.scrollIntoView({ behavior: "smooth", block: "center" });
});

function runPlanner({ scroll }) {
  const filters = collectState();
  const submitButton = $(".planner-submit");
  submitButton.classList.add("is-working");
  submitButton.querySelector("span:first-child").textContent = "Собираю варианты";

  window.setTimeout(() => {
    latestPlans = generateDates({
      places: cityPlaces,
      events: cityEvents,
      filters,
      count: 3,
      variationSeed
    });
    renderPlans(latestPlans, filters);
    resultsSection.hidden = false;
    submitButton.classList.remove("is-working");
    submitButton.querySelector("span:first-child").textContent = "Подобрать 3 свидания";
    if (scroll) resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 180);
}

function renderRecap(filters) {
  const zone = zoneInput.options[zoneInput.selectedIndex]?.textContent || "Москва";
  filterRecap.innerHTML = `
    <span>${escapeHTML(formatDateHuman(filters.date))}</span>
    <span>${escapeHTML(formatDuration(filters.duration))}</span>
    <span>${escapeHTML(shortMoney(filters.budget))}</span>
    <span>${escapeHTML(zone)}</span>
  `;
}

function renderPlans(plans, filters) {
  renderRecap(filters);

  if (!plans.length) {
    const durationNote = filters.duration >= 330
      ? `Я не буду подсовывать короткий вечер вместо выбранных ${escapeHTML(formatDuration(filters.duration))}. С текущим бюджетом и пожеланиями нет трёх честных длинных вариантов.`
      : `Под выбранное время, бюджет и пожелания сейчас не получается собрать три сильных сценария.`;
    resultsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-symbol">✦</div>
        <h3>Здесь лучше не притворяться.</h3>
        <p>${durationNote} Попробуй поднять бюджет или снять одно из дополнительных пожеланий.</p>
        <button class="primary-button compact reset-preferences" type="button">Сделать условия свободнее</button>
      </div>`;
    resultsGrid.querySelector(".reset-preferences")?.addEventListener("click", () => {
      state.duration = 240;
      state.budget = 10000;
      state.zone = "any";
      state.food = true;
      state.useEvents = true;
      state.indoorOnly = false;
      state.noBars = false;
      syncUI();
      variationSeed++;
      runPlanner({ scroll: false });
    });
    return;
  }

  resultsGrid.innerHTML = plans.map((plan, index) => planCardHTML(plan, index, filters)).join("");
  resultsGrid.querySelectorAll("[data-plan-index]").forEach((button) => {
    button.addEventListener("click", () => openInvitation(plans[Number(button.dataset.planIndex)], filters));
  });
}

function planCardHTML(plan, index, filters) {
  const rows = planRows(plan).map((row) => `
    <li class="plan-stop">
      <div class="stop-rail" aria-hidden="true">
        <span class="stop-symbol">${escapeHTML(row.symbol)}</span>
        <i></i>
      </div>
      <div class="stop-main">
        <div class="stop-head">
          <span class="stop-overline">Глава ${String(row.index).padStart(2, "0")} · ${escapeHTML(row.category)}</span>
          <span class="stop-price">${row.costEstimated ? "≈ " : ""}${escapeHTML(row.cost)}</span>
        </div>
        ${row.sourceUrl
          ? `<a href="${escapeAttr(row.sourceUrl)}" target="_blank" rel="noreferrer" class="stop-title">${escapeHTML(row.title)} <span>↗</span></a>`
          : `<div class="stop-title">${escapeHTML(row.title)}</div>`}
        <p class="stop-description">${escapeHTML(row.description)}</p>
        <div class="stop-facts">
          <span>${escapeHTML(row.duration)}</span>
          ${row.startTime ? `<span>начало ${escapeHTML(row.startTime)}</span>` : ""}
          <span class="stop-address">${escapeHTML(row.detail)}</span>
        </div>
      </div>
    </li>`).join("");

  const reasons = plan.reasons.map((reason) => `<span>${escapeHTML(reason)}</span>`).join("");
  const estimate = plan.items.some((item) => item.costEstimated) ? "≈ " : "";
  const cover = plan.coverImage
    ? `<img src="${escapeAttr(plan.coverImage)}" alt="" loading="lazy" />`
    : `<div class="visual-orbit orbit-${(index % 3) + 1}" aria-hidden="true"><i></i><i></i><i></i></div>`;

  return `
    <article class="plan-card plan-card-${index + 1}">
      <div class="plan-visual">
        ${cover}
        <div class="visual-shade"></div>
        <span class="plan-number">0${index + 1}</span>
        <span class="plan-label">${escapeHTML(plan.label)}</span>
      </div>
      <div class="plan-body">
        <div class="plan-title-row">
          <h3>${escapeHTML(plan.title)}</h3>
          <span class="plan-duration-pill">${escapeHTML(formatDuration(plan.totalMinutes))}</span>
        </div>
        <p class="plan-summary">${escapeHTML(plan.summary)}</p>

        <div class="plan-story">
          <span>Как пройдёт свидание</span>
          <p>${escapeHTML(plan.story)}</p>
        </div>

        <div class="plan-meta">
          <div><span>Длительность</span><strong>${escapeHTML(formatDuration(plan.totalMinutes))}</strong><small>по программе</small></div>
          <div><span>Бюджет на двоих</span><strong>${estimate}${escapeHTML(formatMoney(plan.totalCost))}</strong><small>по местам и билетам</small></div>
          <div><span>В программе</span><strong>${plan.items.length} ${plan.items.length === 1 ? "глава" : plan.items.length < 5 ? "главы" : "глав"}</strong><small>цельный сценарий</small></div>
        </div>

        <div class="plan-section-title"><span>Внутри свидания</span><span>${plan.items.length} ${plan.items.length === 1 ? "глава" : plan.items.length < 5 ? "главы" : "глав"}</span></div>
        <ol class="plan-list">${rows}</ol>
        <div class="reason-row">${reasons}</div>

        <button class="primary-button choose-date" data-plan-index="${index}" type="button">
          <span>Выбираю это свидание</span><span aria-hidden="true">→</span>
        </button>
      </div>
    </article>`;
}

function openInvitation(plan, filters) {
  activePlan = { plan, filters };
  renderInvitation();
  inviteDialog.showModal();
}

function renderInvitation() {
  if (!activePlan) return;
  const { plan, filters } = activePlan;
  const date = new Date(`${filters.date}T12:00:00`);
  const day = String(date.getDate()).padStart(2, "0");
  const month = new Intl.DateTimeFormat("ru-RU", { month: "short" }).format(date).replace(".", "").toUpperCase();
  const weekday = new Intl.DateTimeFormat("ru-RU", { weekday: "long" }).format(date).toUpperCase();
  const signature = `${plan.title}|${filters.date}|${plan.items.map((item) => item.id).join("|")}`;
  let hash = 0;
  for (const char of signature) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  const inviteNumber = String((Math.abs(hash) % 1001) + 1).padStart(4, "0");
  const chapters = planRows(plan).map((row) => `<span>${escapeHTML(row.category)}</span>`).join("");

  inviteCard.className = `invite-card theme-${inviteTheme}`;
  inviteCard.innerHTML = `
    <div class="invite-art invite-art-a" aria-hidden="true"></div>
    <div class="invite-art invite-art-b" aria-hidden="true"></div>
    <div class="invite-stars" aria-hidden="true"></div>

    <div class="invite-topline">
      <span>1001 DATES · PRIVATE INVITATION</span>
      <span>№ ${inviteNumber}</span>
    </div>

    <div class="invite-date-lockup">
      <strong>${day}</strong>
      <div><span>${escapeHTML(month)}</span><span>${escapeHTML(weekday)}</span></div>
      <i>FOR TWO<br>ONLY</i>
    </div>

    <div class="invite-main">
      <div class="invite-kicker">Тебя приглашают на</div>
      <div class="invite-title">${escapeHTML(plan.title)}</div>
      <p>${escapeHTML(plan.inviteTeaser)}</p>
    </div>

    <div class="invite-chapters" aria-label="Что будет в свидании">${chapters}</div>

    <div class="invite-footer">
      <div><span>Старт</span><strong>${escapeHTML(filters.time)}</strong></div>
      <div><span>На сколько</span><strong>${escapeHTML(formatDuration(plan.totalMinutes))}</strong></div>
      <div class="invite-signature"><span>Состав</span><strong>ты + я</strong></div>
    </div>`;
}

$$("[data-invite-theme]").forEach((button) => {
  button.addEventListener("click", () => {
    inviteTheme = button.dataset.inviteTheme;
    $$("[data-invite-theme]").forEach((item) => item.classList.toggle("active", item === button));
    renderInvitation();
  });
});

$("#closeInvite").addEventListener("click", () => inviteDialog.close());
inviteDialog.addEventListener("click", (event) => {
  if (event.target === inviteDialog) inviteDialog.close();
});

function inviteText() {
  if (!activePlan) return "";
  const { plan, filters } = activePlan;
  return `У меня есть план на нас двоих ✦\n\n«${plan.title}»\n${formatDateHuman(filters.date)}, ${filters.time}\nПримерно ${formatDuration(plan.totalMinutes)}.\n\nДетали пока секрет. Тебе нужно только сказать «да».\n\n1001 Dates`;
}

$("#copyInvite").addEventListener("click", async () => {
  await navigator.clipboard.writeText(inviteText());
  const button = $("#copyInvite");
  const old = button.textContent;
  button.textContent = "Скопировано ✓";
  setTimeout(() => { button.textContent = old; }, 1500);
});

$("#shareInvite").addEventListener("click", async () => {
  const text = inviteText();
  if (navigator.share) {
    try { await navigator.share({ title: activePlan?.plan?.title || "1001 Dates", text }); } catch {}
  } else {
    await navigator.clipboard.writeText(text);
    const button = $("#shareInvite");
    const old = button.textContent;
    button.textContent = "Скопировано ✓";
    setTimeout(() => { button.textContent = old; }, 1500);
  }
});

function escapeHTML(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[char]));
}
function escapeAttr(value = "") { return escapeHTML(value); }

function updateDataStatus() {
  const status = $("#dataStatus");
  if (kudagoMeta.updatedAt) {
    const date = new Date(kudagoMeta.updatedAt);
    status.textContent = `${cityPlaces.length} мест · ${cityEvents.length} событий · обновлено ${date.toLocaleDateString("ru-RU")}`;
  } else {
    status.textContent = `${cityPlaces.length} мест · ${cityEvents.length} событий в локальной базе`;
  }
}

syncUI();
updateDataStatus();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).catch(() => {});
}
