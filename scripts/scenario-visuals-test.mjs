import { selectScenarioCover, pickScenarioCover, COVER_ORDER } from "../scenario-visuals.js";

function assert(condition,message){if(!condition)throw new Error(message);}

const dinnerView={
  title:"Ужин с видом на огни Москвы",
  story:"Панорамный вечер для двоих",
  items:[
    {title:"Ресторан",category:"dinner",subtype:"restaurant",image:"https://example.com/dinner.jpg",quality:9},
    {title:"Смотровая площадка",category:"viewpoint",subtype:"observation",image:"https://example.com/view.jpg",quality:8}
  ]
};
assert(selectScenarioCover(dinnerView)==="https://example.com/view.jpg","Viewpoint image should beat dinner image for panorama scenario");

const museumDinner={
  title:"Выставка и ужин",
  story:"Искусство, а затем ресторан",
  items:[
    {title:"Ресторан",category:"dinner",subtype:"restaurant",image:"https://example.com/dinner.jpg",quality:10},
    {title:"Галерея",category:"art",subtype:"gallery",image:"https://example.com/gallery.jpg",quality:8}
  ]
};
assert(selectScenarioCover(museumDinner)==="https://example.com/gallery.jpg","Art image should beat dinner image for museum scenario");

const concert={
  title:"Концерт и вечерняя прогулка",
  items:[
    {title:"Парк",category:"walk",subtype:"park",image:"https://example.com/park.jpg",quality:10},
    {title:"Вивальди",category:"event",subtype:"concert",eventType:"concert",image:"https://example.com/concert.jpg",quality:8}
  ]
};
assert(selectScenarioCover(concert)==="https://example.com/concert.jpg","Concert event image should be selected");

const fallback={
  title:"Нейтральный сценарий",
  coverImage:"https://example.com/fallback.jpg",
  items:[{title:"Без фото",category:"walk"}]
};
assert(selectScenarioCover(fallback)==="https://example.com/fallback.jpg","Valid legacy cover remains fallback");

// Free text must never steer the cover: a plan whose story mentions "кофе" but has no cafe chapter keeps its real main chapter.
const strayWords={
  title:"Прогулка и бранч",story:"Сначала кофе по пути, затем вид на город",why:"Музыка вечера",
  items:[
    {title:"Парк",category:"walk",image:"https://example.com/park.jpg",quality:9},
    {title:"Бистро",category:"dinner",image:"https://example.com/bistro.jpg",quality:9}
  ]
};
assert(selectScenarioCover(strayWords)==="https://example.com/bistro.jpg","Stray keywords in text must not change the cover");

// The first-ranked chapter without a photo is skipped, the next one is used; same result from the engine helper.
const noHeroPhoto={items:[{title:"Музей",category:"art"},{title:"Кафе",category:"cafe",image:"https://example.com/cafe.jpg"}]};
assert(selectScenarioCover(noHeroPhoto)==="https://example.com/cafe.jpg","Cover falls back to the next chapter with a photo");
assert(pickScenarioCover(noHeroPhoto.items)===selectScenarioCover(noHeroPhoto),"pickScenarioCover and selectScenarioCover must agree");
assert(COVER_ORDER[0]==="viewpoint"&&COVER_ORDER.at(-1)==="cafe","Cover priority order changed unexpectedly");
const posterOnly={items:[{title:"Концерт",category:"event",image:"https://example.com/afisha/x.jpg"},{title:"Парк",category:"walk",image:"https://example.com/park.jpg"}]};
assert(selectScenarioCover(posterOnly)==="https://example.com/park.jpg","Poster-like image URLs are not used as covers");

console.log("Scenario visual selection OK");
