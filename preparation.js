export const PREPARATION_KEY="1001dates.preparation.v1";

function text(item){
  return [item?.title,item?.category,item?.subtype,item?.eventType,item?.type].filter(Boolean).join(" ").toLowerCase().replace(/ё/g,"е");
}

export function preparationUrl(item){
  return item?.officialUrl||item?.sourceUrl||null;
}

export function needsReservation(item){
  const t=text(item);
  if(item?.category==="dinner")return true;
  if(item?.category==="bar"&&/(гастробар|lounge|rooftop|wine bar|cocktail bar|ресторан)/i.test(t))return true;
  if(item?.category==="cafe"&&/(ресторан|бистро|brasserie|ужин|dinner|chef|гастро)/i.test(t))return true;
  return false;
}

export function needsTickets(item){
  const t=text(item),paid=Number(item?.costForTwo||0)>0;
  if(/бесплатн|free admission|свободный вход/i.test(t)&&!/регистрац|registration|билет|ticket/i.test(t))return false;
  if(["concert","theater","standup","show","movie","excursion"].includes(item?.eventType))return true;
  if(item?.category==="event")return paid||/(концерт|театр|спектак|стендап|шоу|кино|выстав|экскурс|билет|ticket)/i.test(t);
  if(item?.category==="art"&&paid&&/(музей|museum|выстав|галере|gallery|экспозиц)/i.test(t))return true;
  if(item?.category==="activity"&&paid&&/(квест|quest|каток|rink|bowling|боулинг|vr|виртуал|мастер-класс|workshop)/i.test(t))return true;
  if(item?.category==="viewpoint"&&paid)return true;
  return false;
}

export function buildPreparationTasks(plan,filters={}){
  const tasks=[
    {id:"calendar",type:"calendar",title:"Добавить в календарь",subtitle:`${filters.date||""} · ${filters.time||""}`.trim()},
    {id:"invite",type:"invite",title:"Отправить приглашение",subtitle:"Отправьте партнёру открытку 1001 Dates"}
  ];
  for(const item of plan?.items||[]){
    if(needsTickets(item)){
      tasks.push({
        id:`ticket:${item.id}`,type:"ticket",title:"Купить билеты",itemTitle:item.title,
        subtitle:"Лучше проверить и купить заранее",url:preparationUrl(item)
      });
    }
    if(needsReservation(item)){
      tasks.push({
        id:`booking:${item.id}`,type:"booking",title:"Забронировать стол",itemTitle:item.title,
        subtitle:"Лучше забронировать заранее",url:preparationUrl(item)
      });
    }
  }
  const seen=new Set();
  return tasks.filter(task=>!seen.has(task.id)&&seen.add(task.id));
}

export function preparationStateKey(planKey,date,time){
  return `${planKey}|${date||""}|${time||""}`;
}

export function preparationProgress(tasks,state={}){
  const total=tasks.length;
  const completed=tasks.filter(task=>Boolean(state?.[task.id])).length;
  return {completed,total,percent:total?Math.round(completed/total*100):100,done:total>0&&completed===total};
}
