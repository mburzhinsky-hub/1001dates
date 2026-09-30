import {seedPlaces,seedEvents} from "./data/seed.js";
import {kudagoPlaces,kudagoEvents,kudagoMeta} from "./data/kudago.generated.js";
import {generateDates,replacePlanItem,planRows,formatMoney,formatDuration} from "./engine-v14.js?v=duration5";
import {selectScenarioCover} from "./scenario-visuals.js?v=1";
import {PREPARATION_KEY,buildPreparationTasks,preparationStateKey,preparationProgress} from "./preparation.js?v=1";

const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const FILTERS_KEY="1001dates.filters.v11", PROFILE_KEY="1001dates.profile.v11", SAVED_KEY="1001dates.saved.v1";
const DEFAULTS={duration:180,budget:7000,vibes:["romantic"],zone:"any",time:"19:00",food:true,useEvents:true,indoorOnly:false,noBars:false,adventure:"balanced"};
const VIBE_LABELS={romantic:"Романтика",fun:"Весело",unusual:"Необычно",calm:"Уютно",active:"Активно"};
const ZONES={any:"Вся Москва",center:"Центр",city:"Москва-Сити",vdnh:"ВДНХ / Останкино",west:"Запад",south:"Юг",east:"Восток"};
const OCTOBER_HERO_IMAGE="https://media.kudago.com/images/place/53/16/53166fcbdf44a0f34a7a8de5fa7e07e9.jpg";
const FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
let state={...DEFAULTS,...loadJSON(FILTERS_KEY,{})}; if(!Array.isArray(state.vibes)||!state.vibes.length)state.vibes=["romantic"];
let profile=normalizeProfile(loadJSON(PROFILE_KEY,{})),savedDates=loadJSON(SAVED_KEY,[]),preparationStore=loadJSON(PREPARATION_KEY,{}),latestPlans=[],activePlanIndex=null,activeFilters=null,variationSeed=0,currentAnchor=null,inviteTheme="warm",inviteReveal="secret",focusStack=[],libraryTab="dates"; if(!Array.isArray(savedDates))savedDates=[];if(!preparationStore||typeof preparationStore!=="object"||Array.isArray(preparationStore))preparationStore={};
const places=dedupe([...seedPlaces,...kudagoPlaces].map(sanitize)),events=dedupe([...seedEvents,...kudagoEvents].map(sanitize));
const DATA_START=kudagoMeta?.windowStart||localISODate(), DATA_END=kudagoMeta?.windowEnd||DATA_START;

function loadJSON(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}}
function normalizeProfile(r){return{favoriteItems:r.favoriteItems&&typeof r.favoriteItems==="object"?r.favoriteItems:{},dislikedItemIds:Array.isArray(r.dislikedItemIds)?r.dislikedItemIds.slice(0,150):[],recentlyShownItemIds:Array.isArray(r.recentlyShownItemIds)?r.recentlyShownItemIds.slice(0,90):[]}}
function persist(){localStorage.setItem(FILTERS_KEY,JSON.stringify({duration:state.duration,budget:state.budget,vibes:state.vibes,zone:state.zone,time:state.time,date:state.date,food:state.food,useEvents:state.useEvents,indoorOnly:state.indoorOnly,noBars:state.noBars,adventure:state.adventure}))}
function saveProfile(){localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));syncBadge()} function saveSavedDates(){localStorage.setItem(SAVED_KEY,JSON.stringify(savedDates.slice(0,30)));syncBadge()}
function isURL(v){try{const u=new URL(v);return /^https?:$/.test(u.protocol)}catch{return false}}
function sanitize(i){return{...i,sourceUrl:isURL(i.sourceUrl)?i.sourceUrl:null,officialUrl:isURL(i.officialUrl)?i.officialUrl:null}}
function imageOK(v){return isURL(v)&&!/logo|poster|banner|afisha|афиш|sprite|icon/i.test(String(v))}
function dedupe(items){const m=new Map();for(const i of items){const k=`${i.category}:${i.title}`.toLowerCase(),p=m.get(k);if(!p||Number(i.quality||0)>Number(p.quality||0))m.set(k,i)}return[...m.values()]}
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function localISODate(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function shortDate(v){try{return new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short"}).format(new Date(`${v}T12:00:00`)).replace(".","")}catch{return v}}
function humanDate(v){try{return new Intl.DateTimeFormat("ru-RU",{weekday:"long",day:"numeric",month:"long"}).format(new Date(`${v}T12:00:00`))}catch{return v}}
function monthLabel(v){try{return new Intl.DateTimeFormat("ru-RU",{month:"long",year:"numeric"}).format(new Date(`${v}-01T12:00:00`))}catch{return v}}
function monthName(v){try{const s=new Intl.DateTimeFormat("ru-RU",{month:"long"}).format(new Date(`${v}-01T12:00:00`));return s.charAt(0).toUpperCase()+s.slice(1)}catch{return v}}
function addDays(v,n){const d=new Date(`${v}T12:00:00`);d.setDate(d.getDate()+n);return localISODate(d)}
function availableStartDate(){const today=localISODate();if(today<DATA_START)return DATA_START;if(today>DATA_END)return DATA_END;return today}
function clampDataDate(v){const min=availableStartDate();if(!v||v<min||v>DATA_END)return min;return v}
function presetDate(offset){const v=addDays(availableStartDate(),offset);return v>DATA_END?DATA_END:v}
function snapshotDays(){const a=new Date(`${DATA_START}T12:00:00`),b=new Date(`${DATA_END}T12:00:00`);return Math.round((b-a)/86400000)+1}
function syncSeasonMeta(){const month=kudagoMeta?.targetMonth||DATA_START.slice(0,7),label=monthLabel(month),name=monthName(month);$("#seasonMonthLabel")&&($("#seasonMonthLabel").textContent=label.toUpperCase());$("#seasonMonthTitle")&&($("#seasonMonthTitle").textContent=name);$("#deviceMonth")&&($("#deviceMonth").textContent=label.charAt(0).toUpperCase()+label.slice(1));$("#seasonDays")&&($("#seasonDays").textContent=String(snapshotDays()));$("#seasonEvents")&&($("#seasonEvents").textContent=String(kudagoEvents.length));$("#seasonPlaces")&&($("#seasonPlaces").textContent=String(kudagoPlaces.length));}
function shortMoney(v){return v>=900000?"любой бюджет":`до ${new Intl.NumberFormat("ru-RU").format(v)} ₽`}
function planKey(p){return `${p.template.id}:${p.items.map(i=>i.id).join("|")}`}
function stableNo(p){let h=2166136261;for(const c of planKey(p)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return String(((h>>>0)%1001)+1).padStart(3,"0")}
function collectFilters(){return{date:clampDataDate(state.date),time:state.time,duration:Number(state.duration),budget:Number(state.budget),vibes:[...state.vibes],zone:state.zone,food:state.food,useEvents:state.useEvents,indoorOnly:state.indoorOnly,noBars:state.noBars,avoidVisited:false,adventure:state.adventure,likedItemIds:Object.keys(profile.favoriteItems),visitedItemIds:[],dislikedItemIds:profile.dislikedItemIds,recentlyShownItemIds:profile.recentlyShownItemIds}}
function visibleOverlay(){return $$(".overlay.open").at(-1)||null}
function openOverlay(id){const o=$(id);if(!o)return;focusStack.push(document.activeElement);o.classList.add("open");o.setAttribute("aria-hidden","false");document.body.classList.add("modal-open");requestAnimationFrame(()=>$(FOCUSABLE,o)?.focus())}
function closeOverlay(id){const o=$(id);if(!o)return;o.classList.remove("open");o.setAttribute("aria-hidden","true");if(!visibleOverlay())document.body.classList.remove("modal-open");const target=focusStack.pop();requestAnimationFrame(()=>target?.focus?.())}
function trapFocus(e){const o=visibleOverlay();if(!o)return;if(e.key==="Escape"){e.preventDefault();closeOverlay(`#${o.id}`);return}if(e.key!=="Tab")return;const nodes=$$(FOCUSABLE,o).filter(n=>n.offsetParent!==null);if(!nodes.length){e.preventDefault();return}const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
document.addEventListener("keydown",trapFocus);$$('.overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o&&o.dataset.dismiss!=="false")closeOverlay(`#${o.id}`)}));$$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeOverlay(b.dataset.close)));
function syncPressed(){$$('[data-duration],[data-budget],[data-vibe],[data-adventure],[data-theme],[data-reveal],[data-timepreset],[data-date-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('active'))))}
function syncBadge(){const n=Object.keys(profile.favoriteItems).length+savedDates.length,b=$("#libraryCount");if(b){b.hidden=!n;b.textContent=Math.min(99,n)}}
function syncUI(){
  state.date=clampDataDate(state.date);
  const first=presetDate(0),second=presetDate(1),today=localISODate();
  $("#dateInput").min=availableStartDate();$("#dateInput").max=DATA_END;$("#dateInput").value=state.date;
  $("#timeInput").value=state.time;$("#zoneInput").value=state.zone;$("#foodInput").checked=!!state.food;$("#eventsInput").checked=!!state.useEvents;$("#indoorInput").checked=!!state.indoorOnly;$("#noBarsInput").checked=!!state.noBars;
  $$('[data-duration]').forEach(b=>b.classList.toggle('active',+b.dataset.duration===+state.duration));$$('[data-budget]').forEach(b=>b.classList.toggle('active',+b.dataset.budget===+state.budget));$$('[data-vibe]').forEach(b=>b.classList.toggle('active',state.vibes.includes(b.dataset.vibe)));$$('[data-adventure]').forEach(b=>b.classList.toggle('active',b.dataset.adventure===state.adventure));
  $("#durationSummary").textContent=formatDuration(state.duration);$("#budgetSummary").textContent=shortMoney(state.budget);$("#vibeSummary").textContent=state.vibes.map(v=>VIBE_LABELS[v]).join(" + ");$("#timeSummary")&&($("#timeSummary").textContent=state.time);
  $("#quickDate").textContent=state.date===today?"Сегодня":shortDate(state.date);$("#quickTime")&&($("#quickTime").textContent=state.time);$("#quickDuration").textContent=formatDuration(state.duration);$("#quickBudget").textContent=shortMoney(state.budget);$("#quickVibe").textContent=state.vibes.map(v=>VIBE_LABELS[v]).join(" + ");$("#devicePreviewDate")&&($("#devicePreviewDate").textContent=shortDate(state.date));$("#devicePreviewDuration")&&($("#devicePreviewDuration").textContent=formatDuration(state.duration));$("#devicePreviewBudget")&&($("#devicePreviewBudget").textContent=shortMoney(state.budget));$("#devicePreviewVibe")&&($("#devicePreviewVibe").textContent=(VIBE_LABELS[state.vibes[0]]||"Романтика").toLowerCase());
  $("#preset0Title")&&($("#preset0Title").textContent=first===today?"Сегодня":shortDate(first));$("#preset1Title")&&($("#preset1Title").textContent=second===addDays(today,1)?"Завтра":shortDate(second));
  $("#todayLabel")&&($("#todayLabel").textContent=humanDate(first).split(",")[0]);$("#tomorrowLabel")&&($("#tomorrowLabel").textContent=humanDate(second).split(",")[0]);
  $$("[data-timepreset]").forEach(b=>b.classList.toggle("active",b.dataset.timepreset===state.time));$$("[data-date-preset]").forEach(b=>b.classList.toggle("active",presetDate(Number(b.dataset.datePreset))===state.date));
  syncSeasonMeta();syncBadge();syncPressed();
}
$$('[data-duration]').forEach(b=>b.addEventListener('click',()=>{state.duration=+b.dataset.duration;persist();syncUI()}));$$("[data-timepreset]").forEach(b=>b.addEventListener("click",()=>{state.time=b.dataset.timepreset;persist();syncUI()}));$$("[data-date-preset]").forEach(b=>b.addEventListener("click",()=>{state.date=presetDate(Number(b.dataset.datePreset));persist();syncUI()}));$$('[data-budget]').forEach(b=>b.addEventListener('click',()=>{state.budget=+b.dataset.budget;persist();syncUI()}));$$('[data-adventure]').forEach(b=>b.addEventListener('click',()=>{state.adventure=b.dataset.adventure;persist();syncUI()}));$$('[data-vibe]').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.vibe;if(state.vibes.includes(v)){if(state.vibes.length>1)state.vibes=state.vibes.filter(x=>x!==v)}else state.vibes=state.vibes.length>=2?[state.vibes[1],v]:[...state.vibes,v];persist();syncUI()}));
['zoneInput','dateInput','timeInput','foodInput','eventsInput','indoorInput','noBarsInput'].forEach(id=>$("#"+id)?.addEventListener('change',()=>{state.zone=$("#zoneInput").value;state.date=clampDataDate($("#dateInput").value);state.time=$("#timeInput").value;state.food=$("#foodInput").checked;state.useEvents=$("#eventsInput").checked;state.indoorOnly=$("#indoorInput").checked;state.noBars=$("#noBarsInput").checked;persist();syncUI()}));$("#prefsToggle")?.addEventListener('click',()=>{$("#prefs").hidden=!$("#prefs").hidden;$("#prefsToggle").setAttribute('aria-expanded',String(!$("#prefs").hidden))});
$("#openFilters")?.addEventListener('click',()=>openOverlay('#filtersOverlay'));$$('[data-open-filter]').forEach(b=>b.addEventListener('click',()=>openOverlay('#filtersOverlay')));$("#filtersForm")?.addEventListener('submit',e=>{e.preventDefault();variationSeed=0;currentAnchor=null;closeOverlay('#filtersOverlay');runPlanner(true)});$("#quickGenerate")?.addEventListener('click',()=>{variationSeed=0;currentAnchor=null;runPlanner(true)});$("#deviceGenerate")?.addEventListener('click',()=>{variationSeed=0;currentAnchor=null;runPlanner(true)});$("#surprise")?.addEventListener('click',()=>{variationSeed+=17+Math.floor(Math.random()*900);currentAnchor=null;runPlanner(true)});$("#moreDates")?.addEventListener('click',()=>{variationSeed++;currentAnchor=null;runPlanner(false)});$("#editFilters")?.addEventListener('click',()=>openOverlay('#filtersOverlay'));
function updateHomeHero(){const hero=$("#homeHeroImage");if(!hero)return;hero.src=OCTOBER_HERO_IMAGE;hero.hidden=false}
function renderDevicePreview(plan){
  if(!plan)return;
  const cover=selectScenarioCover(plan);
  const image=$("#devicePreviewImage");
  if(image&&cover)image.src=cover;
  $("#devicePreviewTitle")&&($("#devicePreviewTitle").textContent=plan.title);
  $("#devicePreviewStory")&&($("#devicePreviewStory").textContent=plan.story);
  const first=activeFilters?.vibes?.[0]||state.vibes?.[0]||"romantic";
  $("#devicePreviewVibe")&&($("#devicePreviewVibe").textContent=(VIBE_LABELS[first]||"Романтика").toLowerCase());
  $("#devicePreviewDuration")&&($("#devicePreviewDuration").textContent=formatDuration(plan.totalMinutes));
  $("#devicePreviewBudget")&&($("#devicePreviewBudget").textContent=shortMoney(plan.totalCost));
  $("#devicePreviewDate")&&($("#devicePreviewDate").textContent=shortDate(activeFilters?.date||state.date));
}
function runPlanner(scroll){const filters=collectFilters();activeFilters=filters;latestPlans=generateDates({places,events,filters,count:3,variationSeed,anchorItem:currentAnchor});rememberShown();renderResults();renderDevicePreview(latestPlans[0]);updateHomeHero();$("#resultsSection").hidden=false;if(scroll)$("#resultsSection").scrollIntoView({behavior:'smooth',block:'start'})}
function rememberShown(){const ids=latestPlans.flatMap(p=>p.items.map(i=>i.id));profile.recentlyShownItemIds=[...new Set([...ids,...profile.recentlyShownItemIds])].slice(0,90);saveProfile()}
function renderResults(){const grid=$("#resultsGrid"),f=activeFilters||collectFilters();$("#resultsEyebrow").textContent=latestPlans.length===1?"ОДИН ХОРОШИЙ ВАРИАНТ":latestPlans.length===2?"2 ВАРИАНТА НА ВЕЧЕР":latestPlans.length===3?"3 ВАРИАНТА НА ВЕЧЕР":"ВАРИАНТЫ НА ВЕЧЕР";$("#filterRecap").innerHTML=`<span>${esc(formatDuration(f.duration))}</span><span>${esc(shortMoney(f.budget))}</span><span>${esc(ZONES[f.zone]||"Москва")}</span>`;if(!latestPlans.length){grid.innerHTML=`<div class="empty"><div class="eyebrow">ПОКА НЕ НАШЛОСЬ</div><h3>Под эти условия хорошего варианта сейчас нет.</h3><p>Лучше немного изменить параметры, чем предлагать случайное свидание.</p><div class="empty-actions"><button class="secondary" data-relax="zone">Расширить район</button><button class="secondary" data-relax="budget">Увеличить бюджет</button><button class="secondary" data-relax="time">Добавить времени</button></div></div>`;$$('[data-relax]',grid).forEach(b=>b.addEventListener('click',()=>relax(b.dataset.relax)));return}grid.innerHTML=latestPlans.map(cardHTML).join('');$$('[data-open-plan]',grid).forEach(b=>b.addEventListener('click',()=>openDetail(+b.dataset.openPlan)));$$('[data-save-plan]',grid).forEach(b=>b.addEventListener('click',()=>{toggleSavedPlan(+b.dataset.savePlan);renderResults()}))}
function snapshotPlan(p){return{key:planKey(p),number:stableNo(p),title:p.title,story:p.story,why:p.why,coverImage:selectScenarioCover(p),totalMinutes:p.totalMinutes,totalCost:p.totalCost,savedAt:new Date().toISOString(),plan:p}}
function isPlanSaved(p){return savedDates.some(x=>x.key===planKey(p))}
function toggleSavedPlan(i){const p=latestPlans[i];if(!p)return;const k=planKey(p),at=savedDates.findIndex(x=>x.key===k);if(at>=0)savedDates.splice(at,1);else savedDates.unshift(snapshotPlan(p));saveSavedDates()}
function cardHTML(p,i){
  const cover=selectScenarioCover(p),img=cover?`<img src="${esc(cover)}" alt="" loading="lazy">`:"";
  const vibe=(VIBE_LABELS[activeFilters?.vibes?.[0]||state.vibes?.[0]]||"Романтика").toLowerCase(),saved=isPlanSaved(p);
  return `<article class="date-card">
    <div class="date-photo ${img?"":"placeholder"}">${img}
      <div class="photo-top"><span class="serial">№ ${stableNo(p)}</span><button class="save-icon ${saved?"active":""}" data-save-plan="${i}" aria-label="${saved?"Убрать из сохранённых":"Сохранить свидание"}">${saved?"♥":"♡"}</button></div>
    </div>
    <div class="card-body">
      <h3>${esc(p.title)}</h3>
      <p class="route-line">${esc(p.story)}</p>
      <div class="scenario-chips">
        <span>♡ ${esc(vibe)}</span>
        <span>◷ ${esc(formatDuration(p.totalMinutes))}</span>
        <span>₽ ${p.items.some(x=>x.costEstimated)?"≈ ":""}${esc(formatMoney(p.totalCost))}</span>
      </div>
      <button class="scenario-open" data-open-plan="${i}"><span>Открыть сценарий</span><span>→</span></button>
    </div>
  </article>`;
}
function relax(type){if(type==='zone')state.zone='any';if(type==='budget')state.budget=state.budget>=15000?999999:15000;if(type==='time')state.duration=Math.min(360,Math.max(240,state.duration+60));persist();syncUI();variationSeed++;runPlanner(false)}
function chapterRole(i,n){if(i===0)return'Начало';if(i===n-1)return'Финал';if(n===4&&i===1)return'Развитие';return'Главная часть'}
function openDetail(i){activePlanIndex=i;renderDetail();openOverlay('#detailOverlay')}
function renderDetail(){const p=latestPlans[activePlanIndex];if(!p)return;const rows=planRows(p),cover=selectScenarioCover(p),img=cover?`<img src="${esc(cover)}" alt="">`:'';$("#detailScreenTitle").textContent=`Свидание № ${stableNo(p)}`;$("#detailContent").innerHTML=`<div class="detail-hero"><div class="hero-img ${img?'':'placeholder'}">${img}</div><div class="detail-copy"><div class="eyebrow">СВИДАНИЕ № ${stableNo(p)}</div><h2>${esc(p.title)}</h2><p>${esc(p.story)}</p><div class="detail-meta"><span>${esc(formatDuration(p.totalMinutes))}</span><span>${p.items.some(x=>x.costEstimated)?'≈ ':''}${esc(formatMoney(p.totalCost))}</span><span>${p.items.length} главы</span></div></div></div><div class="why-box"><b>ПОЧЕМУ ПОДОЙДЁТ</b><p>${esc(p.why)}</p></div><section class="chapters"><h3>План вечера</h3>${rows.map((r,i)=>chapterHTML(r,i,rows.length)).join('')}</section>`;$("#chooseDate").onclick=()=>{renderInvite();openOverlay("#inviteOverlay")};const saveButton=$("#saveDate");if(saveButton){const sync=()=>{saveButton.textContent=isPlanSaved(p)?"♥ Сохранено":"♡ Сохранить себе"};sync();saveButton.onclick=()=>{toggleSavedPlan(activePlanIndex);sync();renderResults()}};$$('[data-replace]',$("#detailContent")).forEach(b=>b.addEventListener('click',()=>openReplace(+b.dataset.replace)));$$('[data-around]',$("#detailContent")).forEach(b=>b.addEventListener('click',()=>{currentAnchor=p.items[+b.dataset.around];variationSeed++;closeOverlay('#detailOverlay');runPlanner(true)}));$$('[data-like-item]',$("#detailContent")).forEach(b=>b.addEventListener('click',()=>toggleItem(p.items[+b.dataset.likeItem],b)));$$('[data-dislike-item]',$("#detailContent")).forEach(b=>b.addEventListener('click',()=>dislikeItem(p.items[+b.dataset.dislikeItem],b)))}
function chapterHTML(r,i,n){const links=[r.officialUrl&&`<a href="${esc(r.officialUrl)}" target="_blank" rel="noreferrer">Сайт ↗</a>`,r.sourceUrl&&`<a href="${esc(r.sourceUrl)}" target="_blank" rel="noreferrer">Подробнее ↗</a>`].filter(Boolean).join('');const liked=Boolean(profile.favoriteItems[r.itemId]),disliked=profile.dislikedItemIds.includes(r.itemId);return `<article class="chapter"><div class="chapter-no">${String(i+1).padStart(2,'0')}</div><div><span class="chapter-role">${chapterRole(i,n).toUpperCase()}</span><h4>${esc(r.title)}</h4><p>${esc(r.description)}</p><div class="chapter-meta">${esc(r.duration)} · ${r.costEstimated?'≈ ':''}${esc(r.cost)}</div><div class="chapter-actions"><button class="chapter-primary" data-replace="${i}">Заменить</button><button class="icon-action" data-around="${i}" aria-label="Собрать свидание вокруг этого места">✦</button><button class="icon-action" data-like-item="${i}" aria-label="${liked?'Убрать место из любимых':'Сохранить место'}">${liked?'♥':'♡'}</button><button class="icon-action" data-dislike-item="${i}" aria-label="${disliked?'Место уже исключено':'Больше не предлагать это место'}" ${disliked?'disabled':''}>${disliked?'✓':'⊘'}</button>${links}</div></div></article>`}
function toggleItem(item,b){if(profile.favoriteItems[item.id])delete profile.favoriteItems[item.id];else profile.favoriteItems[item.id]={id:item.id,title:item.title,category:item.category,image:item.image||null,savedAt:new Date().toISOString()};saveProfile();b.textContent=profile.favoriteItems[item.id]?'♥':'♡';b.setAttribute('aria-label',profile.favoriteItems[item.id]?'Убрать место из любимых':'Сохранить место')}
function dislikeItem(item,b){if(!profile.dislikedItemIds.includes(item.id))profile.dislikedItemIds.unshift(item.id);profile.dislikedItemIds=profile.dislikedItemIds.slice(0,150);saveProfile();b.disabled=true;b.textContent='✓';b.setAttribute('aria-label','Место уже исключено')}
function replacementWhy(label,item,current){const same=item.category===current.category,cost=Number(item.costForTwo||0)-Number(current.costForTwo||0);if(same&&cost<0)return'Похожий формат, но немного дешевле.';if(same&&cost>0)return'Похожий формат с чуть большим бюджетом.';if(same)return'Похожий формат без заметного изменения бюджета.';if(cost<0)return'Другая идея для этой части вечера — и немного дешевле.';if(cost>0)return'Другая идея с чуть большим бюджетом.';return'Другая идея без заметного изменения бюджета.'}
function openReplace(itemIndex){const p=latestPlans[activePlanIndex];if(!p)return;const candidates=[];for(let s=1;s<=7&&candidates.length<4;s++){const next=replacePlanItem({plan:p,itemIndex,places,events,filters:activeFilters,variationSeed:variationSeed+s*11});if(next.items[itemIndex]?.id!==p.items[itemIndex]?.id&&!candidates.some(x=>x.items[itemIndex].id===next.items[itemIndex].id))candidates.push(next)}const labels=['Похожий вариант','Другой вариант','Ещё одна идея','Ещё один вариант'];$("#replaceTitle").textContent='Чем заменить эту часть вечера?';$("#replaceList").innerHTML=candidates.length?candidates.map((plan,idx)=>{const item=plan.items[itemIndex],label=labels[idx]||'Другой вариант',img=imageOK(item.image)?`<img src="${esc(item.image)}" alt="" loading="lazy">`:'';return `<article class="replace-card"><div class="replace-thumb">${img}</div><div><div class="eyebrow">${label}</div><h4>${esc(item.title)}</h4><p>${esc(replacementWhy(label,item,p.items[itemIndex]))}</p><div class="replace-meta">${item.costEstimated?'≈ ':''}${esc(formatMoney(item.costForTwo||0))}</div><button data-pick-replace="${idx}">Выбрать</button></div></article>`}).join(''):`<div class="empty"><h3>Здесь лучше ничего не менять.</h3><p>Под ваши условия достойной замены сейчас нет.</p></div>`;$$('[data-pick-replace]').forEach(b=>b.addEventListener('click',()=>{latestPlans[activePlanIndex]=candidates[+b.dataset.pickReplace];variationSeed+=13;closeOverlay('#replaceOverlay');renderResults();renderDetail()}));openOverlay('#replaceOverlay')}
function renderLibrary(){const box=$("#libraryContent");$$("[data-library-tab]").forEach(b=>b.classList.toggle("active",b.dataset.libraryTab===libraryTab));if(libraryTab==="places"){const items=Object.values(profile.favoriteItems);box.innerHTML=items.length?items.map(entry=>`<article class="mini-card">${imageOK(entry.image)?`<img src="${esc(entry.image)}" alt="" loading="lazy">`:`<div class="mini-placeholder"></div>`}<div><h4>${esc(entry.title)}</h4><p>${esc(entry.category||"Место")}</p></div></article>`).join(""):`<div class="empty"><h3>Любимых мест пока нет.</h3><p>Сохраняйте места из глав свидания — они появятся здесь.</p></div>`;return}box.innerHTML=savedDates.length?savedDates.map((d,i)=>`<article class="saved-date">${imageOK(d.coverImage)?`<img src="${esc(d.coverImage)}" alt="">`:'<div class="mini-placeholder"></div>'}<div><div class="eyebrow">№ ${esc(d.number)}</div><h4>${esc(d.title)}</h4><p>${esc(formatDuration(d.totalMinutes))} · ${esc(formatMoney(d.totalCost))}</p><div class="saved-actions">${d.plan?`<button data-open-saved="${i}">Открыть сценарий</button>`:""}<button data-remove-saved="${i}">Убрать</button></div></div></article>`).join(""):`<div class="empty"><h3>Здесь будут ваши вечера.</h3><p>Сохраните понравившийся сценарий — и он останется в «Моих свиданиях».</p></div>`;$$("[data-open-saved]").forEach(b=>b.addEventListener("click",()=>{const d=savedDates[+b.dataset.openSaved];if(!d?.plan)return;latestPlans=[d.plan];activePlanIndex=0;activeFilters=d.plan.filters||collectFilters();renderDetail();openOverlay("#detailOverlay")}));$$("[data-remove-saved]").forEach(b=>b.addEventListener("click",()=>{savedDates.splice(+b.dataset.removeSaved,1);saveSavedDates();renderLibrary();renderResults()}))}$$("[data-library-tab]").forEach(b=>b.addEventListener("click",()=>{libraryTab=b.dataset.libraryTab;renderLibrary()}));$("#libraryButton")?.addEventListener("click",()=>{renderLibrary();openOverlay("#libraryOverlay")});$("#navLibrary")?.addEventListener("click",()=>{renderLibrary();openOverlay("#libraryOverlay")});
function renderProfile(){const v=state.vibes.map(x=>VIBE_LABELS[x]).join(' + '),adv={safe:'Без сюрпризов',balanced:'Баланс',wild:'Смелее'}[state.adventure],favPlaces=Object.values(profile.favoriteItems).slice(0,4);$("#profileContent").innerHTML=`<div class="profile"><div class="eyebrow">ПРОФИЛЬ</div><h2>Ваш вкус<br><em>уже складывается.</em></h2><p>Мы запоминаем любимые места только на этом устройстве.</p><div class="profile-summary"><div><b>${savedDates.length}</b><span>сохранённых свиданий</span></div><div><b>${Object.keys(profile.favoriteItems).length}</b><span>любимых мест</span></div></div><div class="taste"><div class="eyebrow">ВАШИ ПРЕДПОЧТЕНИЯ</div><h3>${esc(v)}</h3><div class="chips"><span>${esc(ZONES[state.zone])}</span><span>${esc(adv)}</span>${favPlaces.map(x=>`<span>${esc(x.title)}</span>`).join('')}</div></div><div class="profile-links"><button id="profileFilters">Настроить предпочтения</button></div></div>`;$("#profileFilters")?.addEventListener('click',()=>{closeOverlay('#profileOverlay');openOverlay('#filtersOverlay')})}
$("#navProfile")?.addEventListener('click',()=>{renderProfile();openOverlay('#profileOverlay')});$("#navDiscover")?.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
function activePreparationContext(){
  const plan=latestPlans[activePlanIndex],filters=activeFilters;
  if(!plan||!filters)return null;
  const tasks=buildPreparationTasks(plan,filters);
  const key=preparationStateKey(planKey(plan),filters.date,filters.time);
  const current=preparationStore[key]&&typeof preparationStore[key]==="object"?preparationStore[key]:{};
  return {plan,filters,tasks,key,state:current,progress:preparationProgress(tasks,current)};
}
function persistPreparation(){localStorage.setItem(PREPARATION_KEY,JSON.stringify(preparationStore));}
function setPreparationDone(taskId,done){
  const context=activePreparationContext();if(!context)return;
  preparationStore[context.key]={...context.state,[taskId]:Boolean(done)};
  persistPreparation();renderPreparation();syncPreparationDetailStatus();
}
function syncPreparationDetailStatus(){
  const context=activePreparationContext(),button=$("#prepareDate"),status=$("#prepareDateStatus");
  if(!context||!button||!status)return;
  const p=context.progress;
  button.classList.toggle("complete",p.done);
  status.textContent=p.done?"✓ Всё готово":(p.completed?String(p.completed)+"/"+String(p.total):"");
  button.setAttribute("aria-label",p.done?"Подготовка свидания завершена":(p.completed?String(p.completed)+" из "+String(p.total)+" шагов подготовки готово":"Подготовить свидание"));
}
function downloadCalendarInvite(plan,filters){
  if(!plan||!filters)return;
  const start=new Date(filters.date+"T"+filters.time+":00"),end=new Date(start.getTime()+plan.totalMinutes*60000);
  const stamp=d=>d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
  const ics="BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nDTSTART:"+stamp(start)+"\r\nDTEND:"+stamp(end)+"\r\nSUMMARY:"+plan.title+"\r\nEND:VEVENT\r\nEND:VCALENDAR";
  const blob=new Blob([ics],{type:"text/calendar"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="1001-dates.ics";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function preparationTaskHTML(task,done){
  let action="";
  if(task.type==="calendar")action='<button class="preparation-action" type="button" data-prep-action="calendar">Добавить в календарь</button>';
  else if(task.type==="invite")action='<button class="preparation-action" type="button" data-prep-action="invite">Открыть приглашение</button>';
  else if(task.url)action='<a class="preparation-link" href="'+esc(task.url)+'" target="_blank" rel="noreferrer">'+(task.type==="ticket"?"Открыть билеты ↗":"Открыть сайт ↗")+'</a>';
  else action='<span class="preparation-unavailable">Ссылка недоступна</span>';
  return '<article class="preparation-task '+(done?'done':'')+'"><button class="preparation-check" type="button" data-prep-toggle="'+esc(task.id)+'" aria-pressed="'+String(done)+'" aria-label="'+(done?'Отметить как неготовое':'Отметить готовым')+'">'+(done?'✓':'○')+'</button><div class="preparation-task-body"><div class="preparation-task-title"><span>'+esc(task.title)+'</span>'+(done?'<b>ГОТОВО</b>':'')+'</div>'+(task.itemTitle?'<strong>'+esc(task.itemTitle)+'</strong>':'')+'<p>'+esc(task.subtitle||'')+'</p><div class="preparation-task-actions">'+action+'<button class="preparation-done-button" type="button" data-prep-toggle="'+esc(task.id)+'" aria-pressed="'+String(done)+'">'+(done?'Отменить':'Отметить готовым')+'</button></div></div></article>';
}
function renderPreparation(){
  const context=activePreparationContext();if(!context)return;
  const plan=context.plan,filters=context.filters,tasks=context.tasks,stateForDate=context.state,p=context.progress;
  $("#preparationNumber").textContent="СВИДАНИЕ № "+stableNo(plan);
  $("#preparationPlanTitle").textContent=plan.title;
  $("#preparationMeta").textContent=humanDate(filters.date)+" · "+filters.time;
  $("#preparationProgressLabel").textContent=p.done?"Всё готово ♡":String(p.completed)+" из "+String(p.total)+" готово";
  $("#preparationPercent").textContent=String(p.percent)+"%";
  $("#preparationProgressBar").style.width=String(p.percent)+"%";
  const left=p.total-p.completed;
  $("#preparationRemaining").textContent=p.done?"Осталось только хорошо провести вечер.":(left===1?"Остался последний шаг":"Осталось "+String(left)+" шага");
  $("#preparationList").innerHTML=tasks.map(task=>preparationTaskHTML(task,Boolean(stateForDate[task.id]))).join("");
  $('[data-prep-toggle]',$('#preparationList')).forEach(button=>button.addEventListener('click',()=>{const id=button.dataset.prepToggle;const now=activePreparationContext();setPreparationDone(id,!Boolean(now&&now.state&&now.state[id]));}));
  $('[data-prep-action]',$('#preparationList')).forEach(button=>button.addEventListener('click',()=>{if(button.dataset.prepAction==="calendar")downloadCalendarInvite(plan,filters);if(button.dataset.prepAction==="invite"){renderInvite();openOverlay("#inviteOverlay");}}));
}
function openPreparation(){renderPreparation();openOverlay("#preparationOverlay");}
function syncInviteControls(){
  $$('[data-theme]').forEach(button=>{
    const active=button.dataset.theme===inviteTheme;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  $$('[data-reveal]').forEach(button=>{
    const active=button.dataset.reveal===inviteReveal;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
}
function animateInvitePoster(){
  const poster=$("#poster");
  if(!poster)return;
  poster.classList.remove("theme-swap");
  void poster.offsetWidth;
  poster.classList.add("theme-swap");
}
function renderInvite(){
  const p=latestPlans[activePlanIndex],f=activeFilters;
  if(!p||!f)return;
  const rows=planRows(p);
  const d=new Date(`${f.date}T12:00:00`);
  const day=String(d.getDate()).padStart(2,'0');
  const month=new Intl.DateTimeFormat('ru-RU',{month:'short'}).format(d).replace('.','').toUpperCase();
  const note=$("#inviteNote").value.trim()||'Просто освободи вечер. Остальное — сюрприз.';
  const posterUrl=inviteTheme!=="minimal"&&imageOK(p.coverImage)?p.coverImage:"";
  const planHtml=inviteReveal==="full"
    ? `<div class="poster-plan" aria-label="План свидания">
        <div class="poster-plan-title">ПЛАН ВЕЧЕРА</div>
        ${rows.slice(0,4).map((row,i)=>`<div class="poster-plan-row">
          <span class="poster-plan-no">${String(i+1).padStart(2,"0")}</span>
          <div><small>${esc(chapterRole(i,rows.length))}</small><b>${esc(row.title)}</b></div>
        </div>`).join("")}
      </div>`
    : "";
  const poster=$("#poster");
  const titleLength=[...String(p.title||'')].length;
  const noteLength=[...note].length;
  const densePlan=rows.slice(0,4).some(row=>[...String(row.title||'')].length>34);
  const titleFit=titleLength>58?'title-xlong':titleLength>38?'title-long':'';
  const noteFit=noteLength>64?'note-long':'';
  poster.className=`poster theme-${inviteTheme} ${inviteTheme==='night'?'night':inviteTheme==='minimal'?'minimal':''} ${inviteReveal==='full'?'plan-open':''} ${titleFit} ${noteFit} ${densePlan?'plan-dense':''}`.replace(/\s+/g,' ').trim();
  poster.dataset.theme=inviteTheme;
  poster.innerHTML=`${posterUrl?'<div class="poster-bg" aria-hidden="true"></div>':""}
    <div class="poster-top"><span>1001 DATES</span><span>№ ${stableNo(p)}</span></div>
    <div class="poster-date"><strong>${day}</strong><div><span>${esc(month)}</span><span>${esc(f.time)}</span></div></div>
    ${planHtml}
    <div class="poster-main"><span>${inviteReveal==="full"?"ВЕЧЕР ПО ГЛАВАМ":"ОСВОБОДИ ВЕЧЕР. У МЕНЯ ЕСТЬ ПЛАН."}</span><h3>${esc(p.title)}</h3><p>${esc(note)}</p></div>
    <div class="poster-foot"><div><span>ДЛИТЕЛЬНОСТЬ</span><b>${esc(formatDuration(p.totalMinutes))}</b></div><div><span>ПЛАН</span><b>${inviteReveal==='full'?`${p.items.length} главы`:'сюрприз'}</b></div></div>`;
  if(posterUrl){
    const bg=$(".poster-bg",poster);
    if(bg)bg.style.backgroundImage=`url("${posterUrl.replace(/"/g,'%22')}")`;
  }
  syncInviteControls();
}
$$('[data-theme]').forEach(button=>button.addEventListener('click',()=>{
  if(inviteTheme===button.dataset.theme)return;
  inviteTheme=button.dataset.theme;
  renderInvite();
  animateInvitePoster();
}));
$$('[data-reveal]').forEach(button=>button.addEventListener('click',()=>{
  if(inviteReveal===button.dataset.reveal)return;
  inviteReveal=button.dataset.reveal;
  renderInvite();
}));
$("#inviteNote")?.addEventListener('input',renderInvite);
function currentInvitePayload(){
  const p=latestPlans[activePlanIndex],f=activeFilters;
  if(!p||!f)return null;
  const rows=planRows(p);
  return {
    v:1,no:stableNo(p),title:String(p.title||"").slice(0,120),date:f.date,time:f.time,
    duration:formatDuration(p.totalMinutes),
    note:($("#inviteNote")?.value.trim()||"Просто освободи вечер. Остальное — сюрприз.").slice(0,100),
    theme:inviteTheme,reveal:inviteReveal,
    items:rows.slice(0,4).map(row=>String(row.title||"").slice(0,80)),
    itemCount:p.items.length
  };
}
function encodeInvitePayload(payload){
  const bytes=new TextEncoder().encode(JSON.stringify(payload));
  let binary=""; for(const byte of bytes)binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function decodeInvitePayload(token){
  try{
    let base=String(token||"").replace(/-/g,"+").replace(/_/g,"/");
    while(base.length%4)base+="=";
    const binary=atob(base),bytes=Uint8Array.from(binary,ch=>ch.charCodeAt(0));
    const raw=JSON.parse(new TextDecoder().decode(bytes));
    if(!raw||raw.v!==1||!raw.title||!/^\d{4}-\d{2}-\d{2}$/.test(raw.date||""))return null;
    return {
      v:1,no:String(raw.no||"001").replace(/\D/g,"").slice(0,4)||"001",
      title:String(raw.title).slice(0,120),date:raw.date,time:/^\d{2}:\d{2}$/.test(raw.time||"")?raw.time:"19:00",
      duration:String(raw.duration||"вечер").slice(0,32),note:String(raw.note||"").slice(0,100),
      theme:["warm","night","minimal"].includes(raw.theme)?raw.theme:"warm",
      reveal:raw.reveal==="full"?"full":"secret",
      items:Array.isArray(raw.items)?raw.items.slice(0,4).map(x=>String(x).slice(0,80)):[],
      itemCount:Math.max(1,Math.min(9,Number(raw.itemCount)||1))
    };
  }catch{return null}
}
function inviteLink(payload=currentInvitePayload()){
  if(!payload)return location.href;
  return `${location.origin}${location.pathname}#invite=${encodeInvitePayload(payload)}`;
}
function inviteText(payload=currentInvitePayload()){
  if(!payload)return "";
  return `Я приготовил для нас свидание ♡\n${payload.title}\n${humanDate(payload.date)}, ${payload.time}\n\nОткрой приглашение: ${inviteLink(payload)}`;
}
async function copyInviteText(text){
  try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true}}catch{}
  const textarea=document.createElement("textarea"); textarea.value=text; textarea.setAttribute("readonly",""); textarea.style.position="fixed"; textarea.style.opacity="0";
  document.body.append(textarea); textarea.select(); textarea.setSelectionRange(0,textarea.value.length); let copied=false;
  try{copied=document.execCommand("copy")}catch{} textarea.remove(); return copied;
}
function setInviteShareStatus(label,delay=0){
  const node=$("#shareInvite")?.querySelector("span:first-child"); if(!node)return; node.textContent=label;
  if(delay)setTimeout(()=>node.textContent="Отправить приглашение",delay);
}
$("#copyInvite")?.addEventListener("click",async()=>{
  const payload=currentInvitePayload(); if(!payload)return;
  if(await copyInviteText(inviteLink(payload))){$("#copyInvite").textContent="Ссылка скопирована ✓";setTimeout(()=>$("#copyInvite").textContent="Скопировать ссылку",1400)}
});
$("#calendarInvite")?.addEventListener("click",()=>{const p=latestPlans[activePlanIndex],f=activeFilters,start=new Date(`${f.date}T${f.time}:00`),end=new Date(start.getTime()+p.totalMinutes*60000),stamp=d=>d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z"),ics=`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nDTSTART:${stamp(start)}\r\nDTEND:${stamp(end)}\r\nSUMMARY:${p.title}\r\nEND:VEVENT\r\nEND:VCALENDAR`,blob=new Blob([ics],{type:"text/calendar"}),u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download="1001-dates.ics";a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)});
async function shareInvitation(){
  const payload=currentInvitePayload(); if(!payload)return;
  const url=inviteLink(payload),data={title:"Приглашение на свидание — 1001 Dates",text:"Я приготовил для нас свидание ♡",url};
  if(navigator.share){try{await navigator.share(data);return}catch(error){if(error?.name==="AbortError")return}}
  if(await copyInviteText(`${data.text}\n${url}`)){setInviteShareStatus("Ссылка скопирована ✓",1600);return}
  setInviteShareStatus("Не удалось отправить",1600);
}
$("#shareInvite")?.addEventListener("click",shareInvitation);
function wrapPostcardText(value,maxChars,maxLines){
  const words=String(value||"").trim().split(/\s+/).filter(Boolean),lines=[]; let line="";
  for(const word of words){const next=line?`${line} ${word}`:word;if(next.length<=maxChars){line=next;continue}if(line)lines.push(line);line=word;if(lines.length>=maxLines){line="";break}}
  if(line&&lines.length<maxLines)lines.push(line);
  if(lines.length===maxLines&&words.join(" ").length>lines.join(" ").length)lines[maxLines-1]=lines[maxLines-1].slice(0,Math.max(1,maxChars-1)).trimEnd()+"…";
  return lines.slice(0,maxLines);
}
function svgSafe(value=""){return String(value).replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]))}
function postcardSvg(payload){
  const data=payload, palettes={
    warm:{a:"#4f2018",b:"#7e3222",c:"#2b120e",text:"#fff4e9",muted:"#e9cfc3",accent:"#ef6a47",line:"#b97c69"},
    night:{a:"#080a14",b:"#10182a",c:"#05070d",text:"#f4f3ff",muted:"#c9cde7",accent:"#8fa3ff",line:"#56627f"},
    minimal:{a:"#f3ece2",b:"#ede3d6",c:"#e9ded0",text:"#181714",muted:"#6d6259",accent:"#b45136",line:"#b9aa9d"}
  },p=palettes[data.theme]||palettes.warm,d=new Date(`${data.date}T12:00:00`),day=String(d.getDate()).padStart(2,"0"),month=new Intl.DateTimeFormat("ru-RU",{month:"long"}).format(d).toUpperCase();
  const titleSize=data.reveal==="full"?(data.title.length>58?62:data.title.length>38?72:84):(data.title.length>58?74:data.title.length>38?88:104);
  const titleLines=wrapPostcardText(data.title,data.reveal==="full"?24:20,data.reveal==="full"?2:3),titleY=data.reveal==="full"?870:770,titleLH=Math.round(titleSize*.92),noteLines=wrapPostcardText(data.note,42,2),noteY=titleY+titleLines.length*titleLH+42;
  const texts=(lines,x,y,size,lh,fill,family="Georgia, serif",weight="400")=>lines.map((line,i)=>`<text x="${x}" y="${y+i*lh}" fill="${fill}" font-family="${family}" font-size="${size}" font-weight="${weight}">${svgSafe(line)}</text>`).join("");
  const plan=data.reveal==="full"?`<text x="88" y="450" fill="${p.muted}" font-family="Arial, sans-serif" font-size="24" font-weight="700">ПЛАН ВЕЧЕРА</text>${data.items.map((item,i)=>`<text x="88" y="${515+i*72}" fill="${p.accent}" font-family="Georgia, serif" font-size="36">${String(i+1).padStart(2,"0")}</text><text x="160" y="${515+i*72}" fill="${p.text}" font-family="Arial, sans-serif" font-size="28" font-weight="600">${svgSafe(wrapPostcardText(item,36,1)[0]||"")}</text>`).join("")}`:"";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${p.a}"/><stop offset="52%" stop-color="${p.b}"/><stop offset="100%" stop-color="${p.c}"/></linearGradient></defs><rect width="1080" height="1350" rx="56" fill="url(#bg)"/><text x="88" y="105" fill="${p.text}" font-family="Arial, sans-serif" font-size="28" font-weight="700">1001 DATES</text><text x="992" y="105" text-anchor="end" fill="${p.muted}" font-family="Arial, sans-serif" font-size="28">№ ${svgSafe(data.no)}</text><text x="82" y="335" fill="${p.accent}" font-family="Georgia, serif" font-size="210">${day}</text><text x="360" y="245" fill="${p.text}" font-family="Arial, sans-serif" font-size="50" font-weight="700">${svgSafe(month)}</text><text x="360" y="302" fill="${p.muted}" font-family="Arial, sans-serif" font-size="30">${svgSafe(data.time)}</text>${plan}<text x="88" y="${titleY-52}" fill="${p.muted}" font-family="Arial, sans-serif" font-size="22" font-weight="700">${data.reveal==="full"?"ВЕЧЕР ПО ГЛАВАМ":"ОСВОБОДИ ВЕЧЕР. У МЕНЯ ЕСТЬ ПЛАН."}</text>${texts(titleLines,88,titleY,titleSize,titleLH,p.text)}${texts(noteLines,88,noteY,30,42,p.muted,"Arial, sans-serif")}<line x1="88" x2="992" y1="1195" y2="1195" stroke="${p.line}" stroke-width="2"/><text x="88" y="1245" fill="${p.muted}" font-family="Arial, sans-serif" font-size="20">ДЛИТЕЛЬНОСТЬ</text><text x="88" y="1298" fill="${p.text}" font-family="Georgia, serif" font-size="44">${svgSafe(data.duration)}</text><text x="620" y="1245" fill="${p.muted}" font-family="Arial, sans-serif" font-size="20">ПЛАН</text><text x="620" y="1298" fill="${p.text}" font-family="Georgia, serif" font-size="44">${data.reveal==="full"?`${data.itemCount} главы`:"сюрприз"}</text></svg>`;
}
async function invitePngBlob(payload){
  const blob=new Blob([postcardSvg(payload)],{type:"image/svg+xml;charset=utf-8"}),url=URL.createObjectURL(blob);
  try{
    const img=new Image(); await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url});
    const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1350;const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas unavailable");ctx.drawImage(img,0,0);
    return await new Promise((resolve,reject)=>canvas.toBlob(out=>out?resolve(out):reject(new Error("PNG failed")),"image/png"));
  }finally{URL.revokeObjectURL(url)}
}
let invitePreviewUrl=null;
function showInvitePreview(blob,payload){
  if(invitePreviewUrl)URL.revokeObjectURL(invitePreviewUrl); invitePreviewUrl=URL.createObjectURL(blob);
  $("#inviteSaveImage").src=invitePreviewUrl; $("#inviteSaveDirect").href=invitePreviewUrl; $("#inviteSaveDirect").download=`1001-dates-${payload.no}.png`;
  openOverlay("#inviteSaveOverlay");
}
async function saveInvitePostcard(payload,button){
  const label=button?.querySelector?.("span:first-child")||button,original=label?.textContent||"Сохранить открытку";if(button)button.disabled=true;if(label)label.textContent="Готовим открытку…";
  try{const blob=await invitePngBlob(payload);showInvitePreview(blob,payload);if(label)label.textContent="Открытка готова ✓"}catch{if(label)label.textContent="Не удалось создать"}finally{if(button)button.disabled=false;setTimeout(()=>{if(label)label.textContent=original},1500)}
}
$("#downloadInvite")?.addEventListener("click",()=>{const payload=currentInvitePayload();if(payload)saveInvitePostcard(payload,$("#downloadInvite"))});
function renderPayloadPoster(target,payload){
  const poster=$(target);if(!poster)return;const d=new Date(`${payload.date}T12:00:00`),day=String(d.getDate()).padStart(2,"0"),month=new Intl.DateTimeFormat("ru-RU",{month:"short"}).format(d).replace(".","").toUpperCase();
  poster.className=`poster theme-${payload.theme} ${payload.theme==="night"?"night":payload.theme==="minimal"?"minimal":""} ${payload.reveal==="full"?"plan-open":""}`;
  const plan=payload.reveal==="full"?`<div class="poster-plan"><div class="poster-plan-title">ПЛАН ВЕЧЕРА</div>${payload.items.map((item,i)=>`<div class="poster-plan-row"><span class="poster-plan-no">${String(i+1).padStart(2,"0")}</span><div><small>${chapterRole(i,payload.itemCount)}</small><b>${esc(item)}</b></div></div>`).join("")}</div>`:"";
  poster.innerHTML=`<div class="poster-top"><span>1001 DATES</span><span>№ ${esc(payload.no)}</span></div><div class="poster-date"><strong>${day}</strong><div><span>${esc(month)}</span><span>${esc(payload.time)}</span></div></div>${plan}<div class="poster-main"><span>${payload.reveal==="full"?"ВЕЧЕР ПО ГЛАВАМ":"ОСВОБОДИ ВЕЧЕР. У МЕНЯ ЕСТЬ ПЛАН."}</span><h3>${esc(payload.title)}</h3><p>${esc(payload.note)}</p></div><div class="poster-foot"><div><span>ДЛИТЕЛЬНОСТЬ</span><b>${esc(payload.duration)}</b></div><div><span>ПЛАН</span><b>${payload.reveal==="full"?`${payload.itemCount} главы`:"сюрприз"}</b></div></div>`;
}
function showSharedInviteFromHash(){
  if(!location.hash.startsWith("#invite="))return;const payload=decodeInvitePayload(location.hash.slice(8));if(!payload)return;
  renderPayloadPoster("#sharedInvitePoster",payload);$("#sharedInviteMeta").textContent=`${humanDate(payload.date)}, ${payload.time} · ${payload.duration}`;
  $("#sharedInviteSave").onclick=()=>saveInvitePostcard(payload,$("#sharedInviteSave")); openOverlay("#sharedInviteOverlay");
}
$("#sharedInviteHome")?.addEventListener("click",()=>{history.replaceState(null,"",location.pathname+location.search);closeOverlay("#sharedInviteOverlay");window.scrollTo({top:0,behavior:"smooth"})});
$("#sharedInviteClose")?.addEventListener("click",()=>{if(location.hash.startsWith("#invite="))history.replaceState(null,"",location.pathname+location.search)});
window.addEventListener("hashchange",showSharedInviteFromHash);
if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js?v=monthly11",{updateViaCache:"none"}).catch(()=>{});saveProfile();saveSavedDates();syncUI();renderLibrary();updateHomeHero();showSharedInviteFromHash();
