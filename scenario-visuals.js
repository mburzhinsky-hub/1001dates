const BAD_IMAGE_HINTS=/logo|poster|banner|afisha|афиш|sprite|icon/i;

export const VISUAL_RULES=[
  {name:"view",test:/вид|панорам|крыше|закат|огни москвы|смотров|skyline/i,categories:["viewpoint","walk"],subtypes:["observation","rooftop","waterfront","architecture"]},
  {name:"concert",test:/концерт|джаз|музык|опера|спектак|театр|стендап|шоу/i,categories:["event"],subtypes:["concert","jazz","theater","show","performance"]},
  {name:"art",test:/выстав|музей|галере|искусств|карти|фото/i,categories:["art","event"],subtypes:["museum","gallery","contemporary","painting","photo","exhibition"]},
  {name:"make",test:/мастер.?класс|леп|гончар|рисов|твор|готовим|кулинар/i,categories:["activity"],subtypes:["pottery","painting","cooking","workshop"]},
  {name:"coffee",test:/кофе|кофейн|завтрак|чай|десерт/i,categories:["cafe","dessert"],subtypes:["coffee","breakfast","tea","pastry","chocolate"]},
  {name:"dinner",test:/ужин|ресторан|гастро|кухн/i,categories:["dinner"],subtypes:["restaurant","gastropub"]},
  {name:"walk",test:/прогул|парк|набереж|гулять|усадьб/i,categories:["walk"],subtypes:["park","waterfront","architecture","market"]},
  {name:"night",test:/бар|коктейл|вечерин|ноч/i,categories:["bar"],subtypes:["cocktail","jazz","rooftop","karaoke"]},
  {name:"play",test:/квест|vr|игр|боулинг|картинг|актив/i,categories:["activity"],subtypes:["quest","vr","games","bowling","karting"]}
];

export function scenarioImageUsable(value){
  if(typeof value!=="string"||BAD_IMAGE_HINTS.test(value))return false;
  try{const url=new URL(value);return /^https?:$/.test(url.protocol)}catch{return false}
}

export function scenarioVisualRule(plan){
  const text=[
    plan?.title,plan?.story,plan?.why,
    ...(plan?.items||[]).map(item=>`${item?.title||""} ${item?.category||""} ${item?.subtype||""} ${item?.eventType||""}`)
  ].filter(Boolean).join(" ").toLowerCase();
  return VISUAL_RULES.find(rule=>rule.test.test(text))||null;
}

export function scoreScenarioImage(item,rule,index=0){
  if(!item||!scenarioImageUsable(item.image))return -Infinity;
  let score=100;
  if(rule?.categories?.includes(item.category))score+=70;
  if(rule?.subtypes?.includes(item.subtype))score+=45;
  if(rule?.subtypes?.includes(item.eventType))score+=45;
  if(item.category==="event")score+=8;
  if(item.category==="viewpoint")score+=12;
  score+=Math.min(15,Number(item.quality||0));
  score-=index*1.5;
  return score;
}

export function selectScenarioCover(plan){
  const rule=scenarioVisualRule(plan);
  const candidates=(plan?.items||[])
    .map((item,index)=>({item,index,score:scoreScenarioImage(item,rule,index)}))
    .filter(entry=>Number.isFinite(entry.score))
    .sort((a,b)=>b.score-a.score);
  if(candidates.length)return candidates[0].item.image;
  return scenarioImageUsable(plan?.coverImage)?plan.coverImage:null;
}
