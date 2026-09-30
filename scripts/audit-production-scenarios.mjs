import { seedPlaces, seedEvents } from "../data/seed.js";
import { kudagoPlaces, kudagoEvents, kudagoMeta } from "../data/kudago.generated.js";
import { generateDates, auditPlanConstraints } from "../engine-v14.js?v=duration5";

function assert(condition,message){if(!condition)throw new Error(message);}
function dateAt(day){return `${kudagoMeta.targetMonth}-${String(day).padStart(2,"0")}`;}
function daysInMonth(month){const[y,m]=month.split("-").map(Number);return new Date(Date.UTC(y,m,0)).getUTCDate();}
function normalizeText(value=""){return String(value).toLowerCase().replace(/ё/g,"е").replace(/[«»“”„"'.,:;!?()—–−/-]+/g," ").replace(/\s+/g," ").trim();}
function semanticBar(item){
  const t=normalizeText(item?.title||"");
  return item?.category==="bar"||/(^|\s)(бар|паб|pub|bar)(\s|$)|гастробар|пивная|cocktail bar|wine bar/i.test(t);
}
function fixedEvent(item){return new Set(["concert","theater","standup","show","movie","lecture","excursion","party"]).has(item?.eventType||item?.subtype);}
function eventHasTime(item,date){
  if(!fixedEvent(item))return true;
  return Boolean(item?.occurrences?.[date]?.length || item?.startTimes?.length);
}
function duplicateSentences(text){
  const parts=String(text).split(/[.!?]+/).map(normalizeText).filter(Boolean);
  return new Set(parts).size!==parts.length;
}
function repeatedNgramAcross(a,b,n=4){
  const A=normalizeText(a).split(" ").filter(x=>x.length>2),B=normalizeText(b).split(" ").filter(x=>x.length>2);
  if(A.length<n||B.length<n)return false;
  const grams=new Set();
  for(let i=0;i<=A.length-n;i++)grams.add(A.slice(i,i+n).join(" "));
  for(let i=0;i<=B.length-n;i++)if(grams.has(B.slice(i,i+n).join(" ")))return true;
  return false;
}
function repeatedWord(text,word,max){
  const n=normalizeText(text).split(" ").filter(x=>x.startsWith(word)).length;
  return n>max;
}

const places=[...seedPlaces,...kudagoPlaces],events=[...seedEvents,...kudagoEvents];
const common={
  zone:"any",avoidVisited:false,likedItemIds:[],visitedItemIds:[],dislikedItemIds:[],recentlyShownItemIds:[]
};
const profiles=[
  {name:"default",time:"19:00",duration:180,budget:7000,vibes:["romantic"],food:true,useEvents:true,indoorOnly:false,noBars:false,adventure:"balanced",expectEvent:true},
  {name:"no-bars",time:"19:00",duration:180,budget:7000,vibes:["romantic"],food:true,useEvents:true,indoorOnly:false,noBars:true,adventure:"balanced"},
  {name:"no-food",time:"19:00",duration:240,budget:10000,vibes:["unusual"],food:false,useEvents:true,indoorOnly:false,noBars:true,adventure:"wild"},
  {name:"indoor",time:"19:00",duration:180,budget:7000,vibes:["calm"],food:true,useEvents:true,indoorOnly:true,noBars:true,adventure:"safe"},
  {name:"active",time:"18:00",duration:240,budget:10000,vibes:["active"],food:true,useEvents:true,indoorOnly:false,noBars:true,adventure:"wild"},
  {name:"daytime",time:"12:00",duration:180,budget:7000,vibes:["calm"],food:true,useEvents:true,indoorOnly:false,noBars:true,adventure:"safe"},
  {name:"no-events",time:"19:00",duration:240,budget:10000,vibes:["romantic"],food:true,useEvents:false,indoorOnly:false,noBars:false,adventure:"balanced"},
  {name:"low-budget",time:"19:00",duration:120,budget:4000,vibes:["romantic"],food:true,useEvents:true,indoorOnly:false,noBars:true,adventure:"safe"}
];

let runs=0,plansChecked=0,eventRuns=0,eventRunsCovered=0,noResult=0;
for(let day=1;day<=daysInMonth(kudagoMeta.targetMonth);day++){
  const date=dateAt(day);
  for(const profile of profiles){
    for(const variationSeed of [0,7]){
      runs++;
      const filters={...common,...profile,date};
      delete filters.name; delete filters.expectEvent;
      const plans=generateDates({places,events,filters,count:3,variationSeed});
      if(!plans.length){noResult++;continue;}
      if(profile.expectEvent){
        eventRuns++;
        if(plans.some(plan=>plan.items.some(item=>item.category==="event")))eventRunsCovered++;
      }
      assert(new Set(plans.map(plan=>plan.title)).size===plans.length,`${date}/${profile.name}: duplicate titles in one result set`);
      for(const plan of plans){
        plansChecked++;
        const audit=auditPlanConstraints(plan,filters);
        for(const [name,ok] of Object.entries(audit))assert(ok,`${date}/${profile.name}: ${name} leaked in ${plan.template.id}`);
        assert(new Set(plan.items.map(x=>x.id)).size===plan.items.length,`${date}: duplicate place/event inside plan`);
        if(filters.noBars)assert(!plan.items.some(semanticBar),`${date}: semantic bar leaked with noBars: ${plan.items.map(x=>x.title).join(" | ")}`);
        assert(!plan.items.some(x=>x.scheduleConfidence==="parse_failed"),`${date}: timetable parser failure selected: ${plan.items.find(x=>x.scheduleConfidence==="parse_failed")?.title}`);
        for(const event of plan.items.filter(x=>x.category==="event"))assert(eventHasTime(event,date),`${date}: fixed-time event has no known start: ${event.title}`);
        assert(!duplicateSentences(plan.story),`${date}: duplicate sentence in story: ${plan.story}`);
        assert(!duplicateSentences(plan.why),`${date}: duplicate sentence in why: ${plan.why}`);
        assert(!repeatedNgramAcross(plan.story,plan.why,5),`${date}: story/why repeat the same phrase: ${plan.story} || ${plan.why}`);
        assert(!repeatedWord(`${plan.story} ${plan.why}`,"спеш",1),`${date}: repeated "спешка" wording: ${plan.story} || ${plan.why}`);
        assert(!repeatedWord(`${plan.story} ${plan.why}`,"вмест",2),`${date}: repeated "вместе" wording: ${plan.story} || ${plan.why}`);
      }
    }
  }
}
assert(eventRuns===eventRunsCovered,`Default event coverage failed: ${eventRunsCovered}/${eventRuns} result sets contain an event`);

console.log(`Production scenario audit OK: ${runs} runs, ${plansChecked} plans, ${noResult} honest no-result runs.`);
console.log(`Default event coverage: ${eventRunsCovered}/${eventRuns} result sets contain a valid event.`);
