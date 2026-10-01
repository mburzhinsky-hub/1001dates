const BAD_IMAGE_HINTS=/logo|poster|banner|afisha|афиш|sprite|icon/i;
const MALL=/торгов|трц|тц|молл|mall/i;

// One cover algorithm for the whole product (engine, result cards, saved plans, invites):
// the cover is the photo of the chapter that defines the evening, never a keyword guess from free text.
// Order = how strongly a chapter's photo says "what this date is about".
export const COVER_ORDER=Object.freeze(["viewpoint","art","event","activity","dinner","bar","walk","dessert","cafe"]);

export function scenarioImageUsable(value){
  if(typeof value!=="string"||BAD_IMAGE_HINTS.test(value))return false;
  try{const url=new URL(value);return /^https?:$/.test(url.protocol)}catch{return false}
}

export function coverRank(item){
  const base=COVER_ORDER.indexOf(item?.category);
  return (base<0?COVER_ORDER.length:base)+(MALL.test(String(item?.title||""))?COVER_ORDER.length:0);
}

export function pickScenarioCover(items){
  const ranked=(items||[])
    .map((item,index)=>({item,index,rank:coverRank(item)}))
    .filter(entry=>scenarioImageUsable(entry.item?.image))
    .sort((a,b)=>a.rank-b.rank||Number(b.item.quality||0)-Number(a.item.quality||0)||a.index-b.index);
  return ranked[0]?.item.image||null;
}

// Index of the chapter whose photo is used (or would be used if it had one) — handy for audits and UI captions.
export function coverChapterIndex(items){
  const cover=pickScenarioCover(items);
  return cover?(items||[]).findIndex(item=>item?.image===cover):-1;
}

export function selectScenarioCover(plan){
  return pickScenarioCover(plan?.items)||(scenarioImageUsable(plan?.coverImage)?plan.coverImage:null);
}
