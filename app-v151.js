import "./app.js?v=14";

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const RADIO_GROUPS = ["#durationControl", "#budgetControl", "#adventureControl"];
const cardMeta = new WeakMap();
let activeCardIndex = null;
let activeMeta = null;

function normalizeText(value="") {
  return String(value).toLowerCase().replace(/ё/g,"е").replace(/\s+/g," ").trim();
}

function stableNumber(parts=[]) {
  const value = parts.map(normalizeText).filter(Boolean).slice(0,3).join("|") || "1001-dates";
  let hash = 2166136261;
  for (let i=0; i<value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return String(((hash >>> 0) % 1001) + 1).padStart(4,"0");
}

function currentSelectionSnapshot() {
  const values = $$("#filterRecap span").map((node)=>node.textContent.trim()).filter(Boolean);
  const vibe = $("#vibeSummary")?.textContent?.trim();
  if(vibe) values.push(vibe);
  return [...new Set(values)].slice(0,4);
}

function routeTitles(card) {
  return $$(".route-preview strong",card).map((node)=>node.textContent.trim()).filter(Boolean).slice(0,3);
}

function routeLabels(card) {
  return $$(".route-preview span",card).map((node)=>node.textContent.trim().toLowerCase()).filter(Boolean).slice(0,3);
}

function explanation(card, snapshot) {
  const route = routeLabels(card);
  const constraints = snapshot.filter(Boolean).join(" · ");
  const archetype = $(".archetype-badge",card)?.textContent?.trim();
  const opening = archetype ? `${archetype}: ` : "";
  const constraintText = constraints ? `сценарий собран под ${constraints}` : "сценарий собран под выбранные условия";
  const routeText = route.length ? ` Ритм вечера — ${route.join(" → ")}.` : "";
  return `${opening}${constraintText}.${routeText}`;
}

function metadataForCard(card,index) {
  const titles = routeTitles(card);
  const snapshot = currentSelectionSnapshot();
  const meta = { index, number:stableNumber(titles), snapshot, explanation:explanation(card,snapshot) };
  cardMeta.set(card,meta);
  return meta;
}

function syncRadioSemantics() {
  RADIO_GROUPS.forEach((selector)=>{
    const group=$(selector);
    if(!group)return;
    group.setAttribute("role","radiogroup");
    const buttons=$$("button",group);
    let activeIndex=buttons.findIndex((button)=>button.classList.contains("active"));
    if(activeIndex<0)activeIndex=0;
    buttons.forEach((button,index)=>{
      const selected=button.classList.contains("active");
      button.setAttribute("role","radio");
      button.setAttribute("aria-checked",String(selected));
      button.tabIndex=index===activeIndex?0:-1;
    });
  });
  $$("#vibeControl button").forEach((button)=>button.setAttribute("aria-pressed",String(button.classList.contains("active"))));
  $$("[data-invite-theme],[data-invite-reveal]").forEach((button)=>button.setAttribute("aria-pressed",String(button.classList.contains("active"))));
}

function handleRadioKeys(event) {
  const group=event.target.closest(RADIO_GROUPS.join(","));
  if(!group || !event.target.matches("button"))return;
  const buttons=$$("button",group);
  const current=buttons.indexOf(event.target);
  let next=current;
  if(["ArrowRight","ArrowDown"].includes(event.key))next=(current+1)%buttons.length;
  else if(["ArrowLeft","ArrowUp"].includes(event.key))next=(current-1+buttons.length)%buttons.length;
  else if(event.key==="Home")next=0;
  else if(event.key==="End")next=buttons.length-1;
  else return;
  event.preventDefault();
  buttons[next].click();
  buttons[next].focus();
  queueMicrotask(syncRadioSemantics);
}

document.addEventListener("keydown",handleRadioKeys);

function resultCountLabel(count) {
  if(count===1)return "ОДИН СИЛЬНЫЙ ВАРИАНТ";
  if(count===2)return "ДВА РАЗНЫХ ПОДХОДА";
  if(count===3)return "ТРИ РАЗНЫХ ПОДХОДА";
  return "РАЗНЫЕ ПОДХОДЫ";
}

function decorateResults() {
  const grid=$("#resultsGrid");
  if(!grid)return;
  const cards=$$(".result-card",grid);
  grid.dataset.count=String(cards.length);
  const eyebrow=$("#resultsEyebrow");
  if(eyebrow && eyebrow.textContent!==resultCountLabel(cards.length))eyebrow.textContent=resultCountLabel(cards.length);
  const more=$("#moreDatesButton");
  if(more && more.textContent!=="Показать другие варианты")more.textContent="Показать другие варианты";

  cards.forEach((card,index)=>{
    const meta=cardMeta.get(card) || metadataForCard(card,index);
    card.dataset.dateNumber=meta.number;
    const sequence=$(".cover-bottom > span",card);
    const numberLabel=`№ ${meta.number} · 1001`;
    if(sequence && sequence.textContent!==numberLabel)sequence.textContent=numberLabel;
    const heart=$(".heart-button",card);
    if(heart){
      const active=heart.classList.contains("active");
      heart.setAttribute("aria-label",active?"Убрать свидание из сохранённых":"Сохранить свидание");
      heart.setAttribute("aria-pressed",String(active));
    }
  });

  const empty=$(".empty-state",grid);
  if(empty){
    grid.dataset.count="0";
    if(eyebrow && eyebrow.textContent!=="УСЛОВИЯ СЛИШКОМ УЗКИЕ")eyebrow.textContent="УСЛОВИЯ СЛИШКОМ УЗКИЕ";
    const title=$("h3",empty),copy=$("p",empty),loosen=$(".loosen",empty),budget=$(".keep-time",empty);
    const copyText="Мы не нарушаем время, бюджет или ограничения ради лишней карточки. Расширь район и дополнительные пожелания либо оставь время и увеличь бюджет.";
    if(title && title.textContent!=="Под эти условия нет сильного сценария.")title.textContent="Под эти условия нет сильного сценария.";
    if(copy && copy.textContent!==copyText)copy.textContent=copyText;
    if(loosen && loosen.textContent!=="Расширить район и пожелания")loosen.textContent="Расширить район и пожелания";
    if(budget && budget.textContent!=="Оставить время и поднять бюджет")budget.textContent="Оставить время и поднять бюджет";
  }
}

function refreshActiveMetaFromGrid() {
  if(activeCardIndex===null)return;
  const cards=$$("#resultsGrid .result-card");
  const card=cards[activeCardIndex];
  if(card)activeMeta=cardMeta.get(card) || metadataForCard(card,activeCardIndex);
}

function decorateDetail() {
  const detail=$("#detailContent");
  if(!detail || !detail.children.length)return;
  refreshActiveMetaFromGrid();
  if(activeMeta){
    const eyebrow=$(".detail-title .eyebrow",detail);
    if(eyebrow){
      const base=eyebrow.dataset.baseLabel || eyebrow.textContent.trim().replace(/^СВИДАНИЕ № \d{4} ·\s*/,"");
      eyebrow.dataset.baseLabel=base;
      const next=`СВИДАНИЕ № ${activeMeta.number} · ${base}`;
      if(eyebrow.textContent!==next)eyebrow.textContent=next;
    }
    const why=$(".why-panel",detail);
    if(why){
      const label=$("span",why),copy=$("p",why);
      if(label && label.textContent!=="ПОЧЕМУ ПОДХОДИТ")label.textContent="ПОЧЕМУ ПОДХОДИТ";
      if(copy && copy.textContent!==activeMeta.explanation)copy.textContent=activeMeta.explanation;
      $(".selection-context",why)?.remove();
    }
  }

  $$("[data-favorite-item]",detail).forEach((button)=>{
    const active=button.textContent.includes("♥");
    button.setAttribute("aria-label",active?"Убрать место из любимых":"Сохранить место");
    button.setAttribute("aria-pressed",String(active));
  });
  $$("[data-dislike-item]",detail).forEach((button)=>button.setAttribute("aria-label",button.disabled?"Место больше не будет предлагаться":"Больше не предлагать это место"));
  $$("[data-replace-item]",detail).forEach((button)=>button.setAttribute("aria-label","Заменить только эту главу"));
  $$("[data-around-item]",detail).forEach((button)=>button.setAttribute("aria-label","Собрать новое свидание вокруг этого места"));
}

function decorateInvite() {
  if(!activeMeta)return;
  const number=$("#inviteCard .invite-topline span:last-child");
  const text=`№ ${activeMeta.number}`;
  if(number && number.textContent!==text)number.textContent=text;
}

function decorateLibrary() {
  $$("#libraryContent .library-cards article").forEach((article)=>{
    if($(".date-serial",article))return;
    const route=$("small",article)?.textContent?.split("→").map((x)=>x.trim()).filter(Boolean).slice(0,3) || [];
    const serial=document.createElement("span");
    serial.className="date-serial";
    serial.textContent=`№ ${stableNumber(route)}`;
    article.prepend(serial);
  });
  $$("#libraryContent .history-list article").forEach((article)=>{
    const wrap=$("article > div",article) || $("div",article);
    if(!wrap || $(".date-serial",wrap))return;
    const route=$("small",article)?.textContent?.split("→").map((x)=>x.trim()).filter(Boolean).slice(0,3) || [];
    const serial=document.createElement("span");
    serial.className="date-serial";
    serial.textContent=`№ ${stableNumber(route)}`;
    wrap.prepend(serial);
  });
}

function syncAll() {
  syncRadioSemantics();
  decorateResults();
  decorateDetail();
  decorateInvite();
  decorateLibrary();
}

document.addEventListener("click",(event)=>{
  const open=event.target.closest("[data-open-plan]");
  if(open){
    const card=open.closest(".result-card");
    const cards=$$("#resultsGrid .result-card");
    activeCardIndex=cards.indexOf(card);
    activeMeta=card ? (cardMeta.get(card) || metadataForCard(card,activeCardIndex)) : null;
  }
  queueMicrotask(syncAll);
},true);

document.addEventListener("change",()=>queueMicrotask(syncAll),true);

const observer=new MutationObserver(()=>queueMicrotask(syncAll));
["#resultsGrid","#detailContent","#inviteCard","#libraryContent"].forEach((selector)=>{
  const node=$(selector);
  if(node)observer.observe(node,{subtree:true,childList:true,attributes:true,attributeFilter:["class","disabled"]});
});

if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  navigator.serviceWorker.register("./sw.js?v=151",{updateViaCache:"none"}).catch(()=>{});
}

syncAll();
