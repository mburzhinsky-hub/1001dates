import { seedPlaces, seedEvents } from "./data/seed.js";
import { kudagoPlaces, kudagoEvents, kudagoMeta } from "./data/kudago.generated.js";
import { generateDates, replacePlanItem, planRows, formatMoney, formatDuration, estimateScenarioCount } from "./engine.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const FILTERS_KEY = "1001dates.filters.v10";
const PROFILE_KEY = "1001dates.profile.v10";

const DEFAULTS = {
  duration:180, budget:7000, vibes:["romantic"], zone:"any", time:"19:00",
  food:true, useEvents:true, indoorOnly:false, noBars:false, avoidVisited:true, adventure:"balanced"
};
const VIBE_LABELS = { romantic:"Романтично", fun:"Весело", unusual:"Необычно", calm:"Спокойно", active:"Активно" };
const ARCHETYPE_ART = { reliable:"01", discovery:"02", wow:"03" };

const plannerForm = $("#plannerForm");
const dateInput = $("#dateInput");
const timeInput = $("#timeInput");
const zoneInput = $("#zoneInput");
const foodInput = $("#foodInput");
const eventsInput = $("#eventsInput");
const indoorInput = $("#indoorInput");
const noBarsInput = $("#noBarsInput");
const avoidVisitedInput = $("#avoidVisitedInput");
const resultsSection = $("#resultsSection");
const resultsGrid = $("#resultsGrid");
const filterRecap = $("#filterRecap");
const preferencesPanel = $("#preferencesPanel");
const preferencesToggle = $("#preferencesToggle");
const preferenceCount = $("#preferenceCount");
const detailDialog = $("#detailDialog");
const detailContent = $("#detailContent");
const inviteDialog = $("#inviteDialog");
const inviteCard = $("#inviteCard");
const libraryDialog = $("#libraryDialog");
const libraryContent = $("#libraryContent");

let state = { ...DEFAULTS, ...loadJSON(FILTERS_KEY, {}) };
if (!Array.isArray(state.vibes) || !state.vibes.length) state.vibes = [state.vibe || "romantic"];
delete state.vibe;
let profile = normalizeProfile(loadJSON(PROFILE_KEY, {}));
let latestPlans = [];
let activePlanIndex = null;
let activePlanFilters = null;
let inviteTheme = "warm";
let inviteReveal = "secret";
let variationSeed = 0;
let currentAnchor = null;

const cityPlaces = dedupe([...seedPlaces, ...kudagoPlaces].map(sanitizeItem));
const cityEvents = dedupe([...seedEvents, ...kudagoEvents].map(sanitizeItem));
const allItemsById = new Map([...cityPlaces, ...cityEvents].map((item) => [item.id,item]));

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function normalizeProfile(raw) {
  return {
    favoritePlans:Array.isArray(raw.favoritePlans) ? raw.favoritePlans.slice(0,40) : [],
    history:Array.isArray(raw.history) ? raw.history.slice(0,30) : [],
    favoriteItems:raw.favoriteItems && typeof raw.favoriteItems === "object" ? raw.favoriteItems : {},
    dislikedItemIds:Array.isArray(raw.dislikedItemIds) ? raw.dislikedItemIds.slice(0,150) : [],
    recentlyShownItemIds:Array.isArray(raw.recentlyShownItemIds) ? raw.recentlyShownItemIds.slice(0,90) : []
  };
}
function saveProfile() { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); updateLibraryCount(); }
function persistState() {
  const compact = { duration:state.duration,budget:state.budget,vibes:state.vibes,zone:state.zone,time:state.time,food:state.food,useEvents:state.useEvents,indoorOnly:state.indoorOnly,noBars:state.noBars,avoidVisited:state.avoidVisited,adventure:state.adventure };
  localStorage.setItem(FILTERS_KEY, JSON.stringify(compact));
}
function dedupe(items) {
  const map = new Map();
  for (const item of items) {
    const key = `${item.category}:${item.title}`.toLowerCase();
    const previous = map.get(key);
    if (!previous || Number(item.quality || 0) > Number(previous.quality || 0)) map.set(key,item);
  }
  return [...map.values()];
}
function sanitizeItem(item) {
  return {
    ...item,
    sourceUrl:isConcreteLink(item.sourceUrl) ? item.sourceUrl : null,
    officialUrl:isHTTP(item.officialUrl) ? item.officialUrl : null
  };
}
function isHTTP(value) {
  try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; }
}
function isConcreteLink(value) {
  if (!isHTTP(value)) return false;
  const url = new URL(value);
  if (!url.hostname.endsWith("kudago.com")) return true;
  return /^\/msk\/(place|event)\/[^/]+\/?$/.test(url.pathname);
}
function localISODate(date=new Date()) {
  const y=date.getFullYear(), m=String(date.getMonth()+1).padStart(2,"0"), d=String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}
function formatDateHuman(value) {
  return new Intl.DateTimeFormat("ru-RU",{weekday:"long",day:"numeric",month:"long"}).format(new Date(`${value}T12:00:00`)).replace(/^./,(x)=>x.toUpperCase());
}
function shortMoney(value) { return value >= 900000 ? "любой бюджет" : `до ${new Intl.NumberFormat("ru-RU").format(value)} ₽`; }
function escapeHTML(value="") { return String(value).replace(/[&<>'"]/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char])); }
function escapeAttr(value="") { return escapeHTML(value); }
function planKey(plan) { return `${plan.template.id}:${plan.items.map((item)=>item.id).join("|")}`; }
function visitedItemIds() { return [...new Set(profile.history.flatMap((entry)=>entry.itemIds || []))]; }
function likedItemIds() { return Object.keys(profile.favoriteItems); }
function snapshotPlan(plan, filters) {
  return {
    key:planKey(plan), title:plan.title, archetype:plan.archetype?.label || "Свидание", totalMinutes:plan.totalMinutes,
    totalCost:plan.totalCost, itemIds:plan.items.map((item)=>item.id), itemTitles:plan.items.map((item)=>item.title),
    categories:plan.items.map((item)=>item.category), coverImage:plan.coverImage || null, date:filters.date, time:filters.time,
    filters:{ duration:filters.duration,budget:filters.budget,vibes:filters.vibes,zone:filters.zone,food:filters.food,useEvents:filters.useEvents,indoorOnly:filters.indoorOnly,noBars:filters.noBars,adventure:filters.adventure },
    savedAt:new Date().toISOString()
  };
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
  avoidVisitedInput.checked = state.avoidVisited !== false;

  $$("#durationControl [data-duration]").forEach((button)=>button.classList.toggle("active",Number(button.dataset.duration)===Number(state.duration)));
  $$("#budgetControl [data-budget]").forEach((button)=>button.classList.toggle("active",Number(button.dataset.budget)===Number(state.budget)));
  $$("#vibeControl [data-vibe]").forEach((button)=>button.classList.toggle("active",state.vibes.includes(button.dataset.vibe)));
  $$("#adventureControl [data-adventure]").forEach((button)=>button.classList.toggle("active",button.dataset.adventure===state.adventure));

  $("#durationSummary").textContent = formatDuration(state.duration);
  $("#budgetSummary").textContent = shortMoney(state.budget);
  $("#vibeSummary").textContent = state.vibes.map((v)=>VIBE_LABELS[v]).join(" + ");
  updatePreferenceCount();
}
function updatePreferenceCount() {
  let count=0;
  if (!foodInput.checked) count++;
  if (!eventsInput.checked) count++;
  if (indoorInput.checked) count++;
  if (noBarsInput.checked) count++;
  if (!avoidVisitedInput.checked) count++;
  if (state.adventure !== "balanced") count++;
  preferenceCount.hidden = count===0;
  preferenceCount.textContent = String(count);
}
function collectState() {
  state = { ...state,date:dateInput.value,time:timeInput.value,zone:zoneInput.value,food:foodInput.checked,useEvents:eventsInput.checked,indoorOnly:indoorInput.checked,noBars:noBarsInput.checked,avoidVisited:avoidVisitedInput.checked };
  persistState();
  return {
    date:state.date,time:state.time,duration:Number(state.duration),budget:Number(state.budget),vibes:[...state.vibes],zone:state.zone,
    food:state.food,useEvents:state.useEvents,indoorOnly:state.indoorOnly,noBars:state.noBars,avoidVisited:state.avoidVisited,adventure:state.adventure,
    likedItemIds:likedItemIds(),visitedItemIds:visitedItemIds(),dislikedItemIds:profile.dislikedItemIds,recentlyShownItemIds:profile.recentlyShownItemIds
  };
}

$("#durationControl").addEventListener("click",(event)=>{ const button=event.target.closest("button[data-duration]"); if(!button)return; state.duration=Number(button.dataset.duration); syncUI();persistState(); });
$("#budgetControl").addEventListener("click",(event)=>{ const button=event.target.closest("button[data-budget]"); if(!button)return; state.budget=Number(button.dataset.budget); syncUI();persistState(); });
$("#vibeControl").addEventListener("click",(event)=>{
  const button=event.target.closest("button[data-vibe]"); if(!button)return;
  const vibe=button.dataset.vibe;
  if (state.vibes.includes(vibe)) {
    if (state.vibes.length===1) return;
    state.vibes=state.vibes.filter((v)=>v!==vibe);
  } else {
    state.vibes=state.vibes.length>=2 ? [state.vibes[1],vibe] : [...state.vibes,vibe];
  }
  syncUI();persistState();
});
$("#adventureControl").addEventListener("click",(event)=>{ const button=event.target.closest("button[data-adventure]");if(!button)return;state.adventure=button.dataset.adventure;syncUI();persistState(); });
[foodInput,eventsInput,indoorInput,noBarsInput,avoidVisitedInput].forEach((input)=>input.addEventListener("change",()=>{collectState();updatePreferenceCount();}));
timeInput.addEventListener("change",collectState); zoneInput.addEventListener("change",collectState);
preferencesToggle.addEventListener("click",()=>{ const open=preferencesPanel.hidden; preferencesPanel.hidden=!open;preferencesToggle.setAttribute("aria-expanded",String(open));preferencesToggle.querySelector("span:first-child").textContent=open?"− Пожелания":"+ Пожелания"; });
plannerForm.addEventListener("submit",(event)=>{ event.preventDefault();variationSeed=0;currentAnchor=null;runPlanner({scroll:true}); });
$("#surpriseButton").addEventListener("click",()=>{ variationSeed += 17 + Math.floor(Math.random()*900);currentAnchor=null;runPlanner({scroll:true}); });
$("#moreDatesButton").addEventListener("click",()=>{ variationSeed++;currentAnchor=null;runPlanner({scroll:false}); });
$("#editFiltersButton").addEventListener("click",()=>plannerForm.scrollIntoView({behavior:"smooth",block:"start"}));

function runPlanner({scroll=false,anchorItem=null}={}) {
  const filters=collectState();
  currentAnchor=anchorItem;
  const submit=$(".planner-submit"); submit.classList.add("is-working"); submit.querySelector("span:first-child").textContent=anchorItem?"Собираю вокруг места":"Собираю три вечера";
  requestAnimationFrame(()=>setTimeout(()=>{
    latestPlans=generateDates({places:cityPlaces,events:cityEvents,filters,count:3,variationSeed,anchorItem});
    activePlanFilters=filters;
    renderPlans(latestPlans,filters,anchorItem);
    rememberShown(latestPlans);
    resultsSection.hidden=false;
    submit.classList.remove("is-working");submit.querySelector("span:first-child").textContent="Подобрать 3 свидания";
    if(scroll)resultsSection.scrollIntoView({behavior:"smooth",block:"start"});
  },90));
}
function rememberShown(plans) {
  const ids=plans.flatMap((plan)=>plan.items.map((item)=>item.id));
  profile.recentlyShownItemIds=[...new Set([...ids,...profile.recentlyShownItemIds])].slice(0,90);saveProfile();
}
function renderRecap(filters,anchorItem) {
  const zone=zoneInput.options[zoneInput.selectedIndex]?.textContent||"Москва";
  filterRecap.innerHTML=`<span>${escapeHTML(formatDuration(filters.duration))}</span><span>${escapeHTML(shortMoney(filters.budget))}</span><span>${escapeHTML(zone)}</span>${anchorItem?`<span class="anchor-recap">вокруг «${escapeHTML(anchorItem.title)}»</span>`:""}`;
}
function renderPlans(plans,filters,anchorItem=null) {
  renderRecap(filters,anchorItem);
  if(!plans.length){
    resultsGrid.innerHTML=`<div class="empty-state"><span class="empty-symbol">✦</span><h3>Слабый вариант лучше не показывать.</h3><p>Под эти условия не нашлось трёх сценариев нужной длительности. Время и бюджет не будут нарушены ради заполнения карточек.</p><div class="empty-actions"><button class="primary-button loosen" type="button">Ослабить пожелания</button><button class="secondary-button keep-time" type="button">Оставить время и поднять бюджет</button></div></div>`;
    $(".loosen")?.addEventListener("click",()=>{state.zone="any";state.indoorOnly=false;state.noBars=false;state.avoidVisited=false;syncUI();variationSeed++;runPlanner({scroll:false});});
    $(".keep-time")?.addEventListener("click",()=>{state.budget=state.budget>=15000?999999:15000;syncUI();variationSeed++;runPlanner({scroll:false});});
    return;
  }
  resultsGrid.innerHTML=plans.map((plan,index)=>planCardHTML(plan,index)).join("");
  resultsGrid.querySelectorAll("[data-open-plan]").forEach((button)=>button.addEventListener("click",()=>openDetail(Number(button.dataset.openPlan))));
  resultsGrid.querySelectorAll("[data-favorite-plan]").forEach((button)=>button.addEventListener("click",()=>toggleFavoritePlan(Number(button.dataset.favoritePlan),button)));
}
function planCardHTML(plan,index) {
  const rows=planRows(plan);
  const estimate=plan.items.some((item)=>item.costEstimated)?"≈ ":"";
  const image=plan.coverImage?`<img src="${escapeAttr(plan.coverImage)}" alt="" loading="lazy" />`:`<div class="cover-art cover-art-${index+1}"><i></i><i></i><i></i></div>`;
  const route=rows.slice(0,4).map((row)=>`<li><span>${escapeHTML(row.category)}</span><strong>${escapeHTML(row.title)}</strong></li>`).join("");
  const isFavorite=profile.favoritePlans.some((entry)=>entry.key===planKey(plan));
  return `<article class="result-card result-card-${index+1}">
    <div class="result-cover">${image}<div class="cover-gradient"></div><div class="cover-top"><span class="archetype-badge">${escapeHTML(plan.archetype?.label||"Вариант")}</span><button class="heart-button ${isFavorite?"active":""}" data-favorite-plan="${index}" type="button" aria-label="Сохранить">${isFavorite?"♥":"♡"}</button></div><div class="cover-bottom"><span>${ARCHETYPE_ART[plan.archetype?.id]||`0${index+1}`}</span><h3>${escapeHTML(plan.title)}</h3></div></div>
    <div class="result-body">
      <p class="result-why">${escapeHTML(plan.why)}</p>
      <div class="result-meta"><strong>${escapeHTML(formatDuration(plan.totalMinutes))}</strong><span>на двоих ${estimate}${escapeHTML(formatMoney(plan.totalCost))}</span></div>
      <ol class="route-preview">${route}</ol>
      <button class="primary-button result-open" data-open-plan="${index}" type="button"><span>Посмотреть свидание</span><span>→</span></button>
    </div>
  </article>`;
}

function openDetail(index) { activePlanIndex=index;renderDetail();detailDialog.showModal(); }
function renderDetail() {
  if(activePlanIndex===null||!latestPlans[activePlanIndex])return;
  const plan=latestPlans[activePlanIndex], filters=activePlanFilters;
  const rows=planRows(plan);
  const estimate=plan.items.some((item)=>item.costEstimated)?"≈ ":"";
  const image=plan.coverImage?`<img src="${escapeAttr(plan.coverImage)}" alt="" />`:`<div class="detail-art cover-art-${activePlanIndex+1}"><i></i><i></i><i></i></div>`;
  const isFavorite=profile.favoritePlans.some((entry)=>entry.key===planKey(plan));
  detailContent.innerHTML=`
    <section class="detail-hero"><div class="detail-image">${image}<div class="cover-gradient"></div><span class="archetype-badge">${escapeHTML(plan.archetype?.label||"Свидание")}</span></div><div class="detail-title"><div class="eyebrow">${escapeHTML(plan.label)}</div><h2>${escapeHTML(plan.title)}</h2><p>${escapeHTML(plan.story)}</p><div class="detail-meta"><span><b>${escapeHTML(formatDuration(plan.totalMinutes))}</b> по программе</span><span><b>${estimate}${escapeHTML(formatMoney(plan.totalCost))}</b> на двоих</span><span><b>${plan.items.length}</b> ${pluralChapter(plan.items.length)}</span></div></div></section>
    <section class="why-panel"><span>Почему этот вариант</span><p>${escapeHTML(plan.why)}</p></section>
    <section class="detail-route"><div class="detail-section-head"><div><span class="eyebrow">СЦЕНАРИЙ</span><h3>Как пройдёт свидание</h3></div><small>Любую главу можно заменить отдельно.</small></div><ol>${rows.map((row)=>detailRowHTML(row)).join("")}</ol></section>
    <div class="detail-actions"><button class="secondary-button detail-save ${isFavorite?"active":""}" type="button">${isFavorite?"♥ Сохранено":"♡ Сохранить"}</button><button class="primary-button detail-invite" type="button"><span>Выбираю это свидание</span><span>→</span></button></div>`;
  detailContent.querySelector(".detail-save").addEventListener("click",(event)=>toggleFavoritePlan(activePlanIndex,event.currentTarget,true));
  detailContent.querySelector(".detail-invite").addEventListener("click",()=>{recordHistory(plan,filters);openInvitation(plan,filters);});
  detailContent.querySelectorAll("[data-replace-item]").forEach((button)=>button.addEventListener("click",()=>replaceItem(Number(button.dataset.replaceItem),button)));
  detailContent.querySelectorAll("[data-around-item]").forEach((button)=>button.addEventListener("click",()=>{const item=plan.items[Number(button.dataset.aroundItem)];detailDialog.close();variationSeed++;runPlanner({scroll:true,anchorItem:item});}));
  detailContent.querySelectorAll("[data-favorite-item]").forEach((button)=>button.addEventListener("click",()=>toggleFavoriteItem(plan.items[Number(button.dataset.favoriteItem)],button)));
  detailContent.querySelectorAll("[data-dislike-item]").forEach((button)=>button.addEventListener("click",()=>dislikeItem(plan.items[Number(button.dataset.dislikeItem)],button)));
}
function detailRowHTML(row) {
  const item=row.item;
  const favorited=Boolean(profile.favoriteItems[item.id]);
  const links=[];
  if(row.officialUrl)links.push(`<a href="${escapeAttr(row.officialUrl)}" target="_blank" rel="noreferrer">Официальный сайт ↗</a>`);
  if(row.sourceUrl)links.push(`<a href="${escapeAttr(row.sourceUrl)}" target="_blank" rel="noreferrer">Подробнее ↗</a>`);
  return `<li class="detail-stop"><div class="detail-stop-index">${String(row.index).padStart(2,"0")}</div><div class="detail-stop-main"><div class="detail-stop-overline"><span>${escapeHTML(row.category)}</span><span>${row.costEstimated?"≈ ":""}${escapeHTML(row.cost)} · ${escapeHTML(row.duration)}</span></div><h4>${escapeHTML(row.title)}</h4><p>${escapeHTML(row.description)}</p><small>${escapeHTML(row.detail)}</small>${links.length?`<div class="stop-links">${links.join("")}</div>`:""}<div class="stop-actions"><button type="button" data-replace-item="${row.index-1}">↻ Заменить</button><button type="button" data-around-item="${row.index-1}">✦ Собрать вокруг этого</button><button type="button" data-favorite-item="${row.index-1}">${favorited?"♥":"♡"}</button><button type="button" data-dislike-item="${row.index-1}" title="Больше не предлагать">×</button></div></div></li>`;
}
function pluralChapter(n){if(n%10===1&&n%100!==11)return"глава";if([2,3,4].includes(n%10)&&![12,13,14].includes(n%100))return"главы";return"глав";}
function replaceItem(itemIndex,button){
  const plan=latestPlans[activePlanIndex];
  button.disabled=true;button.textContent="Ищу замену…";
  setTimeout(()=>{
    const next=replacePlanItem({plan,itemIndex,places:cityPlaces,events:cityEvents,filters:activePlanFilters,variationSeed:++variationSeed});
    latestPlans[activePlanIndex]=next;
    renderPlans(latestPlans,activePlanFilters,currentAnchor);
    renderDetail();
  },80);
}

function toggleFavoritePlan(index,button,fromDetail=false) {
  const plan=latestPlans[index], filters=activePlanFilters||collectState();if(!plan)return;
  const key=planKey(plan), existing=profile.favoritePlans.findIndex((entry)=>entry.key===key);
  if(existing>=0)profile.favoritePlans.splice(existing,1);else profile.favoritePlans.unshift(snapshotPlan(plan,filters));
  saveProfile();
  renderPlans(latestPlans,filters,currentAnchor);
  if(fromDetail)renderDetail();
  else if(button)button.classList.toggle("active",existing<0);
}
function toggleFavoriteItem(item,button) {
  if(profile.favoriteItems[item.id])delete profile.favoriteItems[item.id];else profile.favoriteItems[item.id]={id:item.id,title:item.title,category:item.category,sourceUrl:item.sourceUrl||null,officialUrl:item.officialUrl||null,savedAt:new Date().toISOString()};
  saveProfile();button.textContent=profile.favoriteItems[item.id]?"♥":"♡";
}
function dislikeItem(item,button) {
  if(!profile.dislikedItemIds.includes(item.id))profile.dislikedItemIds.unshift(item.id);
  profile.dislikedItemIds=profile.dislikedItemIds.slice(0,150);saveProfile();button.textContent="✓";button.disabled=true;
}
function recordHistory(plan,filters) {
  const key=planKey(plan);
  profile.history=profile.history.filter((entry)=>entry.key!==key);
  profile.history.unshift(snapshotPlan(plan,filters));profile.history=profile.history.slice(0,30);saveProfile();
}

function openInvitation(plan,filters) {
  activePlanFilters=filters;
  inviteTheme="warm";inviteReveal="secret";
  $$("[data-invite-theme]").forEach((button)=>button.classList.toggle("active",button.dataset.inviteTheme==="warm"));
  $$("[data-invite-reveal]").forEach((button)=>button.classList.toggle("active",button.dataset.inviteReveal==="secret"));
  $("#inviteNoteInput").value="";
  renderInvitation(plan,filters);inviteDialog.showModal();
}
function renderInvitation(plan=latestPlans[activePlanIndex],filters=activePlanFilters) {
  if(!plan||!filters)return;
  const date=new Date(`${filters.date}T12:00:00`),day=String(date.getDate()).padStart(2,"0"),month=new Intl.DateTimeFormat("ru-RU",{month:"short"}).format(date).replace(".","").toUpperCase(),weekday=new Intl.DateTimeFormat("ru-RU",{weekday:"long"}).format(date).toUpperCase();
  const number=String((Math.abs(hashString(planKey(plan)+filters.date))%1001)+1).padStart(4,"0");
  const note=$("#inviteNoteInput").value.trim()||"Просто освободи вечер. Остальное уже придумано.";
  const chapters=planRows(plan).map((row)=>inviteReveal==="full"?`<span>${escapeHTML(row.title)}</span>`:`<span>${escapeHTML(row.category)}</span>`).join("");
  inviteCard.className=`invite-card theme-${inviteTheme}`;
  inviteCard.innerHTML=`<div class="poster-noise"></div><div class="poster-orbit orbit-a"></div><div class="poster-orbit orbit-b"></div><div class="invite-topline"><span>1001 DATES · PRIVATE INVITATION</span><span>№ ${number}</span></div><div class="invite-date-lockup"><strong>${day}</strong><div><span>${escapeHTML(month)}</span><small>${escapeHTML(weekday)}</small></div></div><div class="invite-main"><span>ТЕБЯ ПРИГЛАШАЮТ НА</span><h2>${escapeHTML(plan.title)}</h2><p>${escapeHTML(note)}</p></div><div class="invite-chapters">${chapters}</div><div class="invite-footer"><div><span>СТАРТ</span><b>${escapeHTML(filters.time)}</b></div><div><span>НА СКОЛЬКО</span><b>${escapeHTML(formatDuration(plan.totalMinutes))}</b></div><div><span>СОСТАВ</span><b>ты + я</b></div></div>`;
}
function hashString(value=""){let hash=0;for(const char of value)hash=((hash<<5)-hash+char.charCodeAt(0))|0;return hash;}
$$("[data-invite-theme]").forEach((button)=>button.addEventListener("click",()=>{inviteTheme=button.dataset.inviteTheme;$$('[data-invite-theme]').forEach((x)=>x.classList.toggle("active",x===button));renderInvitation();}));
$$("[data-invite-reveal]").forEach((button)=>button.addEventListener("click",()=>{inviteReveal=button.dataset.inviteReveal;$$('[data-invite-reveal]').forEach((x)=>x.classList.toggle("active",x===button));renderInvitation();}));
$("#inviteNoteInput").addEventListener("input",()=>renderInvitation());
function inviteText() {
  const plan=latestPlans[activePlanIndex],filters=activePlanFilters;if(!plan||!filters)return"";
  const note=$("#inviteNoteInput").value.trim();
  const details=inviteReveal==="full"?`\n\nПлан: ${plan.items.map((item)=>item.title).join(" → ")}`:"\n\nДетали пока оставлю сюрпризом.";
  return `У меня есть план на нас двоих ♡\n\n${plan.title}\n${formatDateHuman(filters.date)}, ${filters.time}\nПримерно ${formatDuration(plan.totalMinutes)}.${note?`\n\n${note}`:""}${details}\n\n1001 Dates`;
}
$("#copyInvite").addEventListener("click",async()=>{await navigator.clipboard.writeText(inviteText());flashButton($("#copyInvite"),"Скопировано ✓");});
$("#downloadInvite").addEventListener("click",async()=>{
  const button=$("#downloadInvite");
  try{ const blob=await ensureInviteBlob(); downloadBlob(blob,inviteFileName()); flashButton(button,"PNG сохранён ✓"); }
  catch(error){ console.error(error); flashButton(button,"Не вышло"); }
});
$("#shareInvite").addEventListener("click",async()=>{
  const button=$("#shareInvite");
  const plan=latestPlans[activePlanIndex],text=inviteText();
  try{
    const blob=await ensureInviteBlob();
    const file=new File([blob],inviteFileName(),{type:"image/png"});
    if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
      await navigator.share({title:plan?.title||"1001 Dates",text,files:[file]});
      return;
    }
    downloadBlob(blob,inviteFileName());
    flashButton(button,"PNG скачан ✓");
  }catch(error){
    console.error(error);
    if(navigator.share){ try { await navigator.share({title:plan?.title||"1001 Dates",text}); return; } catch {} }
    await navigator.clipboard.writeText(text); flashButton(button,"Скопировано ✓");
  }
});
$("#calendarInvite").addEventListener("click",()=>downloadCalendar());
function downloadCalendar(){
  const plan=latestPlans[activePlanIndex],filters=activePlanFilters;if(!plan||!filters)return;
  const start=new Date(`${filters.date}T${filters.time}:00`),end=new Date(start.getTime()+plan.totalMinutes*60000);
  const stamp=(date)=>date.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
  const description=inviteReveal==="full"?plan.items.map((item)=>item.title).join(" → "):"Свидание от 1001 Dates";
  const ics=`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//1001 Dates//RU\r\nBEGIN:VEVENT\r\nUID:${Date.now()}@1001dates\r\nDTSTAMP:${stamp(new Date())}\r\nDTSTART:${stamp(start)}\r\nDTEND:${stamp(end)}\r\nSUMMARY:${escapeICS(plan.title)}\r\nDESCRIPTION:${escapeICS(description)}\r\nEND:VEVENT\r\nEND:VCALENDAR`;
  const blob=new Blob([ics],{type:"text/calendar;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="1001-dates.ics";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function escapeICS(value=""){return String(value).replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");}
function flashButton(button,text){const old=button.textContent;button.textContent=text;setTimeout(()=>button.textContent=old,1600);} 
async function ensureInviteBlob(){
  const plan=latestPlans[activePlanIndex],filters=activePlanFilters;
  if(!plan||!filters) throw new Error("Нет активного приглашения");
  if(document.fonts?.ready) { try { await document.fonts.ready; } catch {} }
  if(typeof window.html2canvas !== "function") throw new Error("html2canvas unavailable");
  const canvas = await window.html2canvas(inviteCard,{backgroundColor:null,scale:Math.max(2,Math.min(3,window.devicePixelRatio||2)),useCORS:true,logging:false});
  const blob = await new Promise((resolve,reject)=>canvas.toBlob((value)=>value?resolve(value):reject(new Error("PNG export failed")),"image/png"));
  return blob;
}
function inviteFileName(){
  const plan=latestPlans[activePlanIndex],filters=activePlanFilters;
  const slug=(plan?.title||"1001-dates").toLowerCase().replace(/[^a-zа-я0-9]+/gi,"-").replace(/^-+|-+$/g,"");
  return `${slug || "1001-dates"}-${filters?.date || "invite"}.png`;
}
function downloadBlob(blob,name){
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1200);
}

$("#libraryButton").addEventListener("click",()=>{renderLibrary();libraryDialog.showModal();});
function updateLibraryCount(){const count=profile.favoritePlans.length+profile.history.length;const badge=$("#libraryCount");badge.hidden=count===0;badge.textContent=String(Math.min(count,99));}
function renderLibrary(){
  const liked=Object.values(profile.favoriteItems),favorite=profile.favoritePlans,history=profile.history;
  libraryContent.innerHTML=`<div class="profile-strip"><div><b>${favorite.length}</b><span>сохранено</span></div><div><b>${history.length}</b><span>выбрано</span></div><div><b>${liked.length}</b><span>любимых мест</span></div></div>${favorite.length?`<section class="library-section"><div class="library-section-head"><h3>Избранное</h3></div><div class="library-cards">${favorite.map(libraryCardHTML).join("")}</div></section>`:""}${history.length?`<section class="library-section"><div class="library-section-head"><h3>История</h3><button id="clearHistory" type="button">Очистить</button></div><div class="history-list">${history.map(historyRowHTML).join("")}</div></section>`:""}${liked.length?`<section class="library-section"><div class="library-section-head"><h3>Любимые места</h3></div><div class="favorite-places">${liked.map((item)=>`<span>${escapeHTML(item.title)}</span>`).join("")}</div></section>`:""}${!favorite.length&&!history.length&&!liked.length?`<div class="empty-library"><span>♡</span><h3>Здесь появится ваша история.</h3><p>Сохраняй целые свидания или отдельные места — и следующие подборки станут персональнее.</p></div>`:""}`;
  $("#clearHistory")?.addEventListener("click",()=>{profile.history=[];saveProfile();renderLibrary();});
}
function libraryCardHTML(entry){return `<article><span>${escapeHTML(entry.archetype)}</span><h4>${escapeHTML(entry.title)}</h4><p>${escapeHTML(formatDuration(entry.totalMinutes))} · ${escapeHTML(formatMoney(entry.totalCost))}</p><small>${escapeHTML(entry.itemTitles.slice(0,3).join(" → "))}</small></article>`;}
function historyRowHTML(entry){return `<article><div><span>${escapeHTML(formatDateHuman(entry.date))}</span><h4>${escapeHTML(entry.title)}</h4><small>${escapeHTML(entry.itemTitles.slice(0,3).join(" → "))}</small></div><b>${escapeHTML(formatDuration(entry.totalMinutes))}</b></article>`;}

function closeOnBackdrop(dialog){dialog.addEventListener("click",(event)=>{if(event.target===dialog)dialog.close();});}
$("#closeDetail").addEventListener("click",()=>detailDialog.close());$("#closeInvite").addEventListener("click",()=>inviteDialog.close());$("#closeLibrary").addEventListener("click",()=>libraryDialog.close());
[detailDialog,inviteDialog,libraryDialog].forEach(closeOnBackdrop);

function updateDataStatus(){
  const status=$("#dataStatus"),scenarios=estimateScenarioCount(cityPlaces,cityEvents),scenarioLabel=scenarios>=1000000?`${(scenarios/1000000).toFixed(1).replace(".0","")} млн+`:scenarios>=1000?`${Math.floor(scenarios/1000)} тыс.+`:String(scenarios);
  if(kudagoMeta.updatedAt){const date=new Date(kudagoMeta.updatedAt);status.textContent=`${cityPlaces.length} мест · ${cityEvents.length} событий · ${scenarioLabel} комбинаций · ${date.toLocaleDateString("ru-RU")}`;}
  else status.textContent=`fallback: ${cityPlaces.length} мест · ${cityEvents.length} событий · ${scenarioLabel} возможных комбинаций`;
}

syncUI();updateDataStatus();updateLibraryCount();
if("serviceWorker" in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js?v=12",{updateViaCache:"none"}).catch(()=>{});
