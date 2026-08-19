const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];

function syncChoiceSemantics(){
  ["#durationControl","#budgetControl","#adventureControl"].forEach((selector)=>{
    $$(selector+" button").forEach((button)=>{
      button.setAttribute("role","radio");
      button.setAttribute("aria-checked",String(button.classList.contains("active")));
    });
  });
  $$("#vibeControl button").forEach((button)=>button.setAttribute("aria-pressed",String(button.classList.contains("active"))));
  $$("[data-invite-theme],[data-invite-reveal]").forEach((button)=>button.setAttribute("aria-pressed",String(button.classList.contains("active"))));
}

function resultCountLabel(count){
  if(count===1)return "ОДИН СИЛЬНЫЙ ВАРИАНТ";
  if(count===2)return "ДВА РАЗНЫХ ПОДХОДА";
  if(count===3)return "ТРИ РАЗНЫХ ПОДХОДА";
  return "РАЗНЫЕ ПОДХОДЫ";
}

function decorateResults(){
  const grid=$("#resultsGrid");
  if(!grid)return;
  const cards=$$(".result-card",grid);
  grid.dataset.count=String(cards.length);
  const eyebrow=$("#resultsEyebrow");
  if(eyebrow)eyebrow.textContent=resultCountLabel(cards.length);
  const more=$("#moreDatesButton");
  if(more)more.textContent="Показать другие варианты";

  cards.forEach((card,index)=>{
    const sequence=$(".cover-bottom > span",card);
    if(sequence)sequence.textContent=`1001 · ${String(index+1).padStart(2,"0")}`;
    const heart=$(".heart-button",card);
    if(heart)heart.setAttribute("aria-label",heart.classList.contains("active")?"Убрать свидание из сохранённых":"Сохранить свидание");
    if(!$(".result-selection-note",card)){
      const why=$(".result-why",card);
      if(why){
        const note=document.createElement("div");
        note.className="result-selection-note";
        note.innerHTML="<span>цельный сценарий</span><span>в рамках условий</span>";
        why.insertAdjacentElement("afterend",note);
      }
    }
  });

  const empty=$(".empty-state",grid);
  if(empty){
    grid.dataset.count="0";
    if(eyebrow)eyebrow.textContent="УСЛОВИЯ СЛИШКОМ УЗКИЕ";
    const title=$("h3",empty),copy=$("p",empty),loosen=$(".loosen",empty),budget=$(".keep-time",empty);
    if(title)title.textContent="Под эти условия нет сильного сценария.";
    if(copy)copy.textContent="Мы не будем нарушать время, бюджет или ограничения ради лишней карточки. Можно расширить район и дополнительные пожелания либо увеличить бюджет.";
    if(loosen)loosen.textContent="Расширить район и пожелания";
    if(budget)budget.textContent="Оставить время и поднять бюджет";
  }
}

function decorateDetail(){
  const detail=$("#detailContent");
  if(!detail)return;
  const why=$(".why-panel",detail);
  if(why&&!$(".selection-context",why)){
    const chips=[];
    $$("#filterRecap span").forEach((node)=>chips.push(node.textContent.trim()));
    const vibe=$("#vibeSummary")?.textContent?.trim();
    if(vibe)chips.push(vibe);
    const context=document.createElement("div");
    context.className="selection-context";
    context.setAttribute("aria-label","Условия подбора");
    context.innerHTML=[...new Set(chips)].slice(0,4).map((text)=>`<span>${escapeHTML(text)}</span>`).join("");
    why.append(context);
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

function escapeHTML(value=""){
  return String(value).replace(/[&<>"']/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}

function syncAll(){syncChoiceSemantics();decorateResults();decorateDetail();}

document.addEventListener("click",()=>queueMicrotask(syncAll),true);
document.addEventListener("change",()=>queueMicrotask(syncAll),true);

const observer=new MutationObserver(()=>queueMicrotask(syncAll));
const results=$("#resultsGrid"),detail=$("#detailContent");
if(results)observer.observe(results,{subtree:true,childList:true,attributes:true,attributeFilter:["class","disabled"]});
if(detail)observer.observe(detail,{subtree:true,childList:true,attributes:true,attributeFilter:["class","disabled"]});

syncAll();
