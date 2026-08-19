import "./app-v151.js?v=1511";

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const filtersDialog = $("#filtersDialog");
const profileDialog = $("#profileDialog");
const plannerForm = $("#plannerForm");
const navButtons = [$("#navDiscover"),$("#navLibrary"),$("#navProfile")].filter(Boolean);

function safeJSON(key,fallback){
  try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}catch{return fallback;}
}
function setNav(active){navButtons.forEach((button)=>button.classList.toggle("active",button?.id===active));}
function humanDate(value){
  if(!value)return "Сегодня";
  try{return new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short"}).format(new Date(`${value}T12:00:00`)).replace(".","");}catch{return value;}
}
function syncQuickSummary(){
  const date=$("#dateInput")?.value;
  const duration=$("#durationSummary")?.textContent?.trim();
  const budget=$("#budgetSummary")?.textContent?.trim();
  const vibe=$("#vibeSummary")?.textContent?.trim();
  const zone=$("#zoneInput")?.selectedOptions?.[0]?.textContent?.trim();
  if($("#quickDate"))$("#quickDate").textContent=humanDate(date);
  if($("#quickDuration"))$("#quickDuration").textContent=duration||"3 часа";
  if($("#quickBudget"))$("#quickBudget").textContent=budget||"до 7 000 ₽";
  if($("#quickVibe"))$("#quickVibe").textContent=vibe||"Романтично";
  $(".planner-launch-card")?.setAttribute("data-zone",zone||"Вся Москва");
}
function openFilters(section=null){
  if(!filtersDialog)return;
  if(!filtersDialog.open)filtersDialog.showModal();
  requestAnimationFrame(()=>{
    const target=section?filtersDialog.querySelector(`[data-filter-section="${section}"]`):null;
    target?.scrollIntoView({behavior:"smooth",block:"start"});
  });
}
function closeFilters(){if(filtersDialog?.open)filtersDialog.close();}

$("#openFiltersButton")?.addEventListener("click",()=>openFilters());
$$("[data-open-filter]").forEach((button)=>button.addEventListener("click",()=>openFilters(button.dataset.openFilter)));
$("#closeFilters")?.addEventListener("click",closeFilters);
filtersDialog?.addEventListener("click",(event)=>{if(event.target===filtersDialog)closeFilters();});
$("#quickGenerate")?.addEventListener("click",()=>plannerForm?.requestSubmit());
plannerForm?.addEventListener("submit",()=>{syncQuickSummary();closeFilters();setNav("navDiscover");});
$("#editFiltersButton")?.addEventListener("click",()=>openFilters());

function renderProfile(){
  const profile=safeJSON("1001dates.profile.v10",{});
  const filters=safeJSON("1001dates.filters.v10",{});
  const saved=Array.isArray(profile.favoritePlans)?profile.favoritePlans.length:0;
  const history=Array.isArray(profile.history)?profile.history.length:0;
  const places=profile.favoriteItems&&typeof profile.favoriteItems==="object"?Object.keys(profile.favoriteItems).length:0;
  const vibe=Array.isArray(filters.vibes)&&filters.vibes.length?filters.vibes.map((value)=>({romantic:"Романтично",fun:"Весело",unusual:"Необычно",calm:"Спокойно",active:"Активно"}[value]||value)).join(" + "):"Романтично";
  const adventure={safe:"Проверенное",balanced:"Баланс",wild:"Смелее"}[filters.adventure]||"Баланс";
  const zone=$("#zoneInput")?.selectedOptions?.[0]?.textContent?.trim()||"Вся Москва";
  const content=$("#profileV16Content");
  if(!content)return;
  content.innerHTML=`<div class="profile-stats-v16"><div><b>${saved}</b><span>сохранено</span></div><div><b>${history}</b><span>выбрано</span></div><div><b>${places}</b><span>любимых мест</span></div></div><section class="profile-taste-v16"><span>СЕЙЧАС ВАЖНО</span><h3>${escapeHTML(vibe)}</h3><div class="profile-chips-v16"><span>${escapeHTML(zone)}</span><span>${escapeHTML(adventure)}</span></div></section><p class="profile-privacy-v16">История и предпочтения хранятся локально в браузере. Никакого отдельного аккаунта для подбора свиданий не требуется.</p>`;
}
function escapeHTML(value=""){return String(value).replace(/[&<>"']/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));}

$("#navDiscover")?.addEventListener("click",()=>{setNav("navDiscover");document.querySelector("#top")?.scrollIntoView({behavior:"smooth"});});
$("#navLibrary")?.addEventListener("click",()=>{$("#libraryButton")?.click();setNav("navLibrary");});
$("#navProfile")?.addEventListener("click",()=>{renderProfile();profileDialog?.showModal();setNav("navProfile");});
$("#closeProfile")?.addEventListener("click",()=>profileDialog?.close());
profileDialog?.addEventListener("click",(event)=>{if(event.target===profileDialog)profileDialog.close();});
profileDialog?.addEventListener("close",()=>setNav("navDiscover"));
$("#libraryDialog")?.addEventListener("close",()=>setNav("navDiscover"));
$("#profileEditFilters")?.addEventListener("click",()=>{profileDialog?.close();openFilters();});

function chapterRole(index,total){
  if(index===0)return "Начало";
  if(index===total-1)return "Финал";
  if(index===1)return "Главная часть";
  return "Ещё одна глава";
}
function decorateDetail(){
  const detail=$("#detailContent");
  if(!detail)return;
  const stops=$$(".detail-stop",detail);
  stops.forEach((stop,index)=>{
    const overline=$(".detail-stop-overline",stop);
    if(overline&&!$(".chapter-role-v16",overline)){
      const role=document.createElement("b");
      role.className="chapter-role-v16";
      role.textContent=chapterRole(index,stops.length);
      overline.prepend(role);
    }
    const replace=$("[data-replace-item]",stop);
    if(replace&&!replace.dataset.v16Label){replace.dataset.v16Label="1";replace.textContent="Другой вариант";}
    const around=$("[data-around-item]",stop);
    if(around&&!around.dataset.v16Label){around.dataset.v16Label="1";around.textContent="Собрать вокруг";}
  });
}
function decorateInvite(){
  const top=$("#inviteCard .invite-topline span:first-child");
  if(top&&top.textContent!=="1001 DATES · ПРИГЛАШЕНИЕ")top.textContent="1001 DATES · ПРИГЛАШЕНИЕ";
}
function decorateLibrary(){
  const content=$("#libraryContent");
  if(!content||$(".library-tabs-v16",content))return;
  const sections=$$(".library-section",content);
  if(sections.length<2)return;
  const tabs=document.createElement("div");
  tabs.className="library-tabs-v16";
  sections.forEach((section,index)=>{
    const title=$(".library-section-head h3",section)?.textContent?.trim()||`Раздел ${index+1}`;
    const button=document.createElement("button");
    button.type="button";button.textContent=title;button.classList.toggle("active",index===0);
    button.addEventListener("click",()=>{
      [...tabs.children].forEach((item)=>item.classList.toggle("active",item===button));
      sections.forEach((item,i)=>item.hidden=i!==index);
    });
    tabs.append(button);section.hidden=index!==0;
  });
  const strip=$(".profile-strip",content);
  if(strip)strip.after(tabs);else content.prepend(tabs);
}
function syncV16(){syncQuickSummary();decorateDetail();decorateInvite();decorateLibrary();}

document.addEventListener("click",()=>queueMicrotask(syncV16),true);
document.addEventListener("change",()=>queueMicrotask(syncV16),true);
const observer=new MutationObserver(()=>queueMicrotask(syncV16));
["#resultsGrid","#detailContent","#inviteCard","#libraryContent","#durationSummary","#budgetSummary","#vibeSummary"].forEach((selector)=>{const node=$(selector);if(node)observer.observe(node,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["class","hidden"]});});

if("serviceWorker" in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js?v=1600",{updateViaCache:"none"}).catch(()=>{});

syncV16();
