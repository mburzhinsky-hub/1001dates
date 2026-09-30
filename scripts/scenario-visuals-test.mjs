import { selectScenarioCover, scenarioVisualRule } from "../scenario-visuals.js";

function assert(condition,message){if(!condition)throw new Error(message);}

const dinnerView={
  title:"Ужин с видом на огни Москвы",
  story:"Панорамный вечер для двоих",
  items:[
    {title:"Ресторан",category:"dinner",subtype:"restaurant",image:"https://example.com/dinner.jpg",quality:9},
    {title:"Смотровая площадка",category:"viewpoint",subtype:"observation",image:"https://example.com/view.jpg",quality:8}
  ]
};
assert(scenarioVisualRule(dinnerView)?.name==="view","Viewpoint scenario should use the view rule");
assert(selectScenarioCover(dinnerView)==="https://example.com/view.jpg","Viewpoint image should beat dinner image for panorama scenario");

const museumDinner={
  title:"Выставка и ужин",
  story:"Искусство, а затем ресторан",
  items:[
    {title:"Ресторан",category:"dinner",subtype:"restaurant",image:"https://example.com/dinner.jpg",quality:10},
    {title:"Галерея",category:"art",subtype:"gallery",image:"https://example.com/gallery.jpg",quality:8}
  ]
};
assert(scenarioVisualRule(museumDinner)?.name==="art","Museum scenario should use the art rule");
assert(selectScenarioCover(museumDinner)==="https://example.com/gallery.jpg","Art image should beat dinner image for museum scenario");

const concert={
  title:"Концерт и вечерняя прогулка",
  items:[
    {title:"Парк",category:"walk",subtype:"park",image:"https://example.com/park.jpg",quality:10},
    {title:"Вивальди",category:"event",subtype:"concert",eventType:"concert",image:"https://example.com/concert.jpg",quality:8}
  ]
};
assert(scenarioVisualRule(concert)?.name==="concert","Concert scenario should use concert rule");
assert(selectScenarioCover(concert)==="https://example.com/concert.jpg","Concert event image should be selected");

const fallback={
  title:"Нейтральный сценарий",
  coverImage:"https://example.com/fallback.jpg",
  items:[{title:"Без фото",category:"walk"}]
};
assert(selectScenarioCover(fallback)==="https://example.com/fallback.jpg","Valid legacy cover remains fallback");

console.log("Scenario visual selection OK");
