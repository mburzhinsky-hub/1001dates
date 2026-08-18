// 1001 Dates scenario catalogue v11.
//
// The catalogue is intentionally built from hand-curated date flows rather than
// arbitrary category permutations. Each recipe defines a human evening arc;
// selector variants only specialise the type of venue/event inside that arc.
// The final library is balanced to exactly 1001 scenario blueprints.

const slot = (select, minutes, role, options = {}) => ({ select, minutes, role, ...options });
const variants = (...items) => items;

// Slot packs. The first option in every pack is deliberately broad so the curated
// fallback database can still produce results before the live KudaGo snapshot is built.
const P = Object.freeze({
  coffee35: variants(
    slot("cafe",35,"настроиться друг на друга"),
    slot("cafe:coffee",35,"начать с хорошего кофе"),
    slot("cafe:tea",35,"начать спокойно за чаем"),
    slot("cafe:bakery",35,"взять кофе и что-нибудь свежее")
  ),
  coffee45: variants(
    slot("cafe",45,"поговорить без спешки"),
    slot("cafe:coffee",45,"посидеть за хорошим кофе"),
    slot("cafe:tea",45,"устроить чайную паузу"),
    slot("cafe:bakery",45,"зайти в красивую пекарню")
  ),
  coffee55: variants(
    slot("cafe",55,"дать разговору нормально начаться"),
    slot("cafe:coffee",55,"не спешить за кофе"),
    slot("cafe:tea",55,"посидеть в чайной"),
    slot("cafe:bakery",55,"начать с уютного кафе")
  ),
  dessert35: variants(
    slot("dessert",35,"закончить чем-то вкусным"),
    slot("dessert:pastry",35,"разделить красивый десерт"),
    slot("dessert:icecream",35,"взять мороженое на двоих"),
    slot("dessert:chocolate",35,"сделать сладкую паузу")
  ),
  dessert45: variants(
    slot("dessert",45,"оставить сладкий финал"),
    slot("dessert:pastry",45,"зайти за десертом"),
    slot("dessert:icecream",45,"завершить мороженым"),
    slot("dessert:chocolate",45,"закончить чем-то шоколадным")
  ),
  dessert55: variants(
    slot("dessert",55,"оставить время на десерт и разговор"),
    slot("dessert:pastry",55,"спокойно посидеть за десертом"),
    slot("dessert:icecream",55,"взять мороженое и не спешить"),
    slot("dessert:chocolate",55,"сделать длинную сладкую паузу")
  ),
  walk35: variants(
    slot("walk",35,"пройтись и поговорить"),
    slot("walk:waterfront",35,"пройтись у воды"),
    slot("walk:architecture",35,"погулять по красивым улицам"),
    slot("walk:park",35,"сделать короткий круг по парку")
  ),
  walk45: variants(
    slot("walk",45,"оставить время на разговор"),
    slot("walk:waterfront",45,"погулять вдоль воды"),
    slot("walk:architecture",45,"посмотреть на город"),
    slot("walk:park",45,"погулять в зелени")
  ),
  walk55: variants(
    slot("walk",55,"нормально прогуляться вдвоём"),
    slot("walk:waterfront",55,"пройти длиннее вдоль воды"),
    slot("walk:architecture",55,"сделать городской маршрут"),
    slot("walk:park",55,"погулять по парку")
  ),
  view35: variants(
    slot("viewpoint",35,"поймать красивый вид"),
    slot("viewpoint:observation",35,"посмотреть на город сверху"),
    slot("viewpoint:rooftop",35,"подняться на крышу или террасу")
  ),
  view45: variants(
    slot("viewpoint",45,"сделать визуальный акцент вечера"),
    slot("viewpoint:observation",45,"посмотреть на город сверху"),
    slot("viewpoint:rooftop",45,"выйти к панораме")
  ),
  view55: variants(
    slot("viewpoint",55,"не спешить у красивого вида"),
    slot("viewpoint:observation",55,"подольше посмотреть на город сверху"),
    slot("viewpoint:rooftop",55,"посидеть у панорамы")
  ),
  art45: variants(
    slot("art",45,"посмотреть что-то новое"),
    slot("art:gallery",45,"зайти в небольшую галерею"),
    slot("art:contemporary",45,"посмотреть современное искусство"),
    slot("art:photo",45,"посмотреть фотографию"),
    slot("art:digital",45,"зайти на мультимедийную выставку")
  ),
  art60: variants(
    slot("art",60,"посмотреть и обсудить"),
    slot("art:gallery",60,"пройти выставку без спешки"),
    slot("art:museum",60,"выбрать один музейный маршрут"),
    slot("art:contemporary",60,"посмотреть современное искусство"),
    slot("art:digital",60,"получить визуальное впечатление"),
    slot("art:photo",60,"посмотреть фотографию"),
    slot("art:science",60,"найти тему для разговора в научной экспозиции")
  ),
  art75: variants(
    slot("art",75,"провести время в искусстве"),
    slot("art:gallery|contemporary",75,"посмотреть сильную выставку"),
    slot("art:museum",75,"пройти выбранную часть музея"),
    slot("art:digital",75,"погрузиться в мультимедийный проект"),
    slot("art:photo",75,"посмотреть большую фотовыставку")
  ),
  creative60: variants(
    slot("activity",60,"сделать что-то вместе"),
    slot("activity:workshop",60,"попробовать мастер-класс"),
    slot("activity:pottery",60,"поработать с керамикой"),
    slot("activity:painting",60,"порисовать вместе"),
    slot("activity:cooking",60,"приготовить что-то вместе")
  ),
  creative75: variants(
    slot("activity",75,"сделать что-то руками вместе"),
    slot("activity:workshop",75,"сходить на мастер-класс"),
    slot("activity:pottery",75,"сделать что-то из керамики"),
    slot("activity:painting",75,"порисовать вместе"),
    slot("activity:cooking",75,"приготовить блюдо вместе"),
    slot("activity:dance",75,"попробовать танцевальный класс")
  ),
  play60: variants(
    slot("activity",60,"добавить лёгкое соревнование"),
    slot("activity:games",60,"поиграть вместе"),
    slot("activity:bowling",60,"сыграть пару партий"),
    slot("activity:billiards",60,"сыграть в бильярд"),
    slot("activity:vr",60,"попробовать VR"),
    slot("activity:quest",60,"пройти короткий квест")
  ),
  play75: variants(
    slot("activity",75,"добавить игру в вечер"),
    slot("activity:games",75,"поиграть без спешки"),
    slot("activity:bowling",75,"устроить мини-турнир"),
    slot("activity:billiards",75,"поиграть в бильярд"),
    slot("activity:vr",75,"уйти в VR на один раунд"),
    slot("activity:quest",75,"пройти квест вдвоём"),
    slot("activity:karaoke",75,"спеть несколько любимых песен")
  ),
  active70: variants(
    slot("activity",70,"немного подвигаться вместе"),
    slot("activity:climbing",70,"попробовать скалодром"),
    slot("activity:skating",70,"покататься вместе"),
    slot("activity:karting",70,"устроить заезд"),
    slot("activity:mini_golf",70,"сыграть в мини-гольф"),
    slot("activity:dance",70,"потанцевать")
  ),
  active85: variants(
    slot("activity",85,"сделать активность центральной главой"),
    slot("activity:climbing",85,"провести время на скалодроме"),
    slot("activity:skating",85,"покататься подольше"),
    slot("activity:karting",85,"устроить полноценный заезд"),
    slot("activity:mini_golf",85,"сыграть спокойный матч"),
    slot("activity:dance",85,"сходить на танцевальное занятие")
  ),
  slowActivity45: variants(
    slot("activity",45,"добавить маленькое совместное занятие"),
    slot("activity:bookstore",45,"побродить по книжному"),
    slot("activity:vinyl",45,"посмотреть винил и музыку"),
    slot("activity:market",45,"погулять по интересному маркету"),
    slot("activity:games",45,"сыграть в короткую игру")
  ),
  slowActivity60: variants(
    slot("activity",60,"заняться чем-то вместе без спешки"),
    slot("activity:bookstore",60,"выбрать друг другу книгу"),
    slot("activity:vinyl",60,"послушать и выбрать музыку"),
    slot("activity:market",60,"исследовать маркет"),
    slot("activity:games",60,"поиграть в настольную игру")
  ),
  dinner80: variants(
    slot("dinner",80,"поужинать и поговорить"),
    slot("dinner:restaurant",80,"сесть за нормальный ужин"),
    slot("dinner:casual",80,"выбрать лёгкий ресторан"),
    slot("dinner:gastropub",80,"поужинать без лишнего пафоса")
  ),
  dinner90: variants(
    slot("dinner",90,"сделать ужин центральной паузой"),
    slot("dinner:restaurant",90,"поужинать без спешки"),
    slot("dinner:casual",90,"выбрать расслабленный ресторан"),
    slot("dinner:gastropub",90,"поесть и спокойно поговорить")
  ),
  brunch75: variants(
    slot("dinner:breakfast|brunch",75,"встретиться за завтраком или бранчем"),
    slot("dinner:breakfast",75,"устроить красивый завтрак"),
    slot("dinner:brunch",75,"встретиться за поздним бранчем")
  ),
  bar55: variants(
    slot("bar",55,"продолжить ещё одним напитком"),
    slot("bar:cocktail",55,"зайти за одним хорошим коктейлем"),
    slot("bar:wine",55,"закончить бокалом вина"),
    slot("bar:jazz",55,"посидеть в баре с музыкой")
  ),
  bar70: variants(
    slot("bar",70,"не заканчивать вечер сразу"),
    slot("bar:cocktail",70,"перейти в коктейльный бар"),
    slot("bar:wine",70,"продолжить в винном баре"),
    slot("bar:jazz",70,"закончить вечер музыкой и напитком")
  ),
  eventCulture: variants(
    slot("event:exhibition",null,"попасть на актуальную выставку",{useItemDuration:true}),
    slot("event:lecture",null,"сходить на интересную лекцию",{useItemDuration:true}),
    slot("event:excursion",null,"попасть на необычную экскурсию",{useItemDuration:true}),
    slot("event",null,"выбрать актуальное культурное событие",{useItemDuration:true})
  ),
  eventStage: variants(
    slot("event:concert",null,"сходить на концерт",{useItemDuration:true}),
    slot("event:theater",null,"сходить на спектакль",{useItemDuration:true}),
    slot("event:standup",null,"сходить на стендап",{useItemDuration:true}),
    slot("event:movie",null,"сходить на специальный кинопоказ",{useItemDuration:true}),
    slot("event:show",null,"попасть на шоу",{useItemDuration:true}),
    slot("event",null,"сделать событие центром вечера",{useItemDuration:true})
  ),
  eventFun: variants(
    slot("event:standup",null,"посмеяться на стендапе",{useItemDuration:true}),
    slot("event:festival",null,"зайти на фестиваль",{useItemDuration:true}),
    slot("event:show",null,"посмотреть живое шоу",{useItemDuration:true}),
    slot("event:party",null,"попасть на вечеринку",{useItemDuration:true}),
    slot("event",null,"выбрать яркое событие",{useItemDuration:true})
  )
});

const R = (id, duration, family, concept, packs, vibes, adventure = 2, options = {}) => ({
  id, duration, family, concept, packs, vibes, adventure, routeMode: options.routeMode || "compact",
  dayparts: options.dayparts || null, notes: options.notes || null
});

// Broad flows below are deliberately finite and reviewed. The large catalogue comes
// from specialising these good flows by venue subtype, never by reordering chapters arbitrarily.
const recipes = [
  // --- 2 hours: one main idea + a natural second chapter. ---
  R("2-coffee-walk",120,"slow","Кофе и прогулка",["coffee45","walk55"],["calm","romantic"],1,{routeMode:"micro"}),
  R("2-walk-coffee",120,"slow","Прогулка и кофе",["walk55","coffee45"],["calm","romantic","active"],1,{routeMode:"micro"}),
  R("2-coffee-art",120,"culture","Кофе и небольшая выставка",["coffee45","art60"],["calm","romantic","unusual"],1,{routeMode:"micro"}),
  R("2-art-coffee",120,"culture","Искусство и разговор после",["art60","coffee45"],["calm","romantic","unusual"],1,{routeMode:"micro"}),
  R("2-art-dessert",120,"culture","Выставка и десерт",["art60","dessert45"],["romantic","calm","unusual"],1,{routeMode:"micro"}),
  R("2-walk-dessert",120,"slow","Прогулка и десерт",["walk55","dessert45"],["romantic","calm","active"],1,{routeMode:"micro"}),
  R("2-dessert-walk",120,"slow","Десерт и прогулка",["dessert45","walk55"],["romantic","calm"],1,{routeMode:"micro"}),
  R("2-view-dessert",120,"romance","Красивый вид и десерт",["view45","dessert45"],["romantic","unusual","calm"],1,{routeMode:"micro"}),
  R("2-dessert-view",120,"romance","Десерт и красивый финал",["dessert45","view45"],["romantic","unusual"],1,{routeMode:"micro"}),
  R("2-view-walk",120,"city","Панорама и прогулка",["view45","walk55"],["romantic","calm","active","unusual"],1,{routeMode:"micro"}),
  R("2-walk-view",120,"city","Прогулка к красивому виду",["walk55","view45"],["romantic","calm","active"],1,{routeMode:"micro"}),
  R("2-art-walk",120,"culture","Искусство и город",["art60","walk45"],["calm","romantic","unusual","active"],1,{routeMode:"micro"}),
  R("2-walk-art",120,"culture","Город и искусство",["walk45","art60"],["calm","romantic","unusual","active"],1,{routeMode:"micro"}),
  R("2-art-view",120,"culture","Искусство и панорама",["art60","view45"],["romantic","unusual","calm"],2,{routeMode:"micro"}),
  R("2-view-art",120,"culture","Панорама и искусство",["view45","art60"],["romantic","unusual","calm"],2,{routeMode:"micro"}),
  R("2-creative-coffee",120,"make","Сделать что-то вместе и выпить кофе",["creative60","coffee45"],["active","fun","unusual","romantic"],2,{routeMode:"micro"}),
  R("2-creative-dessert",120,"make","Мастер-класс и десерт",["creative60","dessert45"],["active","fun","unusual","romantic"],2,{routeMode:"micro"}),
  R("2-play-coffee",120,"play","Игра и кофе",["play60","coffee45"],["active","fun","unusual"],2,{routeMode:"micro"}),
  R("2-play-dessert",120,"play","Игра и сладкий финал",["play60","dessert45"],["active","fun","unusual","romantic"],2,{routeMode:"micro"}),
  R("2-active-dessert",120,"active","Подвигаться и взять десерт",["active70","dessert35"],["active","fun","romantic"],2,{routeMode:"micro"}),
  R("2-slowactivity-coffee",120,"discover","Найти что-то новое и обсудить за кофе",["slowActivity60","coffee45"],["calm","unusual","fun"],2,{routeMode:"micro"}),
  R("2-coffee-slowactivity",120,"discover","Кофе и маленькое исследование",["coffee45","slowActivity60"],["calm","unusual","fun"],2,{routeMode:"micro"}),
  R("2-event-dessert",120,"event","Короткое событие и десерт",["eventCulture","dessert35"],["unusual","fun","romantic"],2,{routeMode:"micro"}),
  R("2-dessert-event",120,"event","Десерт перед культурным событием",["dessert35","eventCulture"],["unusual","fun","romantic"],2,{routeMode:"micro"}),
  R("2-event-walk",120,"event","Событие и короткая прогулка",["eventCulture","walk35"],["unusual","fun","calm","active"],2,{routeMode:"micro"}),
  R("2-walk-event",120,"event","Прогулка перед событием",["walk35","eventCulture"],["unusual","fun","calm","active"],2,{routeMode:"micro"}),
  R("2-brunch-walk",120,"daytime","Бранч и прогулка",["brunch75","walk35"],["calm","romantic","fun"],1,{routeMode:"micro",dayparts:["morning","day"]}),
  R("2-walk-brunch",120,"daytime","Прогулка и бранч",["walk35","brunch75"],["calm","romantic","active"],1,{routeMode:"micro",dayparts:["morning","day"]}),
  R("2-brunch-art",120,"daytime","Бранч и искусство",["brunch75","art45"],["calm","romantic","unusual"],1,{routeMode:"micro",dayparts:["morning","day"]}),
  R("2-view-coffee",120,"romance","Красивый вид и кофе",["view45","coffee45"],["romantic","calm","unusual"],1,{routeMode:"micro"}),

  // --- 3 hours: a main chapter plus a meaningful beginning/aftertaste. ---
  R("3-art-dinner",180,"culture","Выставка и ужин",["art75","dinner90"],["romantic","calm","unusual"],1),
  R("3-creative-dinner",180,"make","Мастер-класс и ужин",["creative75","dinner90"],["active","fun","romantic","unusual"],2),
  R("3-play-dinner",180,"play","Игра и ужин",["play75","dinner90"],["active","fun","romantic"],2),
  R("3-active-dinner",180,"active","Активность и ужин",["active85","dinner80"],["active","fun","romantic"],2),
  R("3-walk-dinner",180,"slow","Прогулка и ужин",["walk55","dinner90"],["romantic","calm","active"],1),
  R("3-view-dinner",180,"romance","Панорама и ужин",["view45","dinner90"],["romantic","unusual","calm"],1),
  R("3-dinner-view",180,"romance","Ужин и красивый финал",["dinner90","view55"],["romantic","calm","unusual"],1),
  R("3-dinner-dessert",180,"food","Ужин и отдельный десерт",["dinner90","dessert55"],["romantic","calm","fun"],1),
  R("3-dinner-bar",180,"night","Ужин и один хороший бар",["dinner90","bar70"],["romantic","fun"],1,{dayparts:["evening","late"]}),
  R("3-art-bar",180,"night","Искусство и бар",["art75","bar70"],["romantic","unusual","fun"],2,{dayparts:["evening","late"]}),
  R("3-play-bar",180,"night","Игра и бар",["play75","bar70"],["active","fun","unusual"],2,{dayparts:["evening","late"]}),
  R("3-event-dinner",180,"event","Событие и ужин после",["eventCulture","dinner80"],["fun","unusual","romantic"],2),
  R("3-dinner-event",180,"event","Ужин перед событием",["dinner80","eventStage"],["fun","unusual","romantic"],2,{dayparts:["day","evening"]}),
  R("3-event-dessert",180,"event","Событие и десерт после",["eventStage","dessert35"],["fun","unusual","romantic"],2),
  R("3-art-event",180,"event","Искусство и актуальное событие",["art60","eventCulture"],["unusual","calm","fun"],2),
  R("3-event-art",180,"event","Событие и ещё немного искусства",["eventCulture","art60"],["unusual","calm","fun"],2),
  R("3-creative-art",180,"make","Сделать и посмотреть",["creative75","art75"],["active","unusual","fun","calm"],2),
  R("3-art-creative",180,"make","Посмотреть и сделать",["art75","creative75"],["active","unusual","fun","calm"],2),
  R("3-coffee-walk-dessert",180,"slow","Кофе, прогулка и десерт",["coffee45","walk55","dessert45"],["romantic","calm","active"],1,{routeMode:"micro"}),
  R("3-walk-coffee-dessert",180,"slow","Прогулка, кофе и десерт",["walk55","coffee45","dessert45"],["romantic","calm","active"],1,{routeMode:"micro"}),
  R("3-coffee-art-dessert",180,"culture","Кофе, искусство и десерт",["coffee45","art60","dessert45"],["romantic","calm","unusual"],1,{routeMode:"micro"}),
  R("3-art-coffee-dessert",180,"culture","Искусство, разговор и десерт",["art60","coffee45","dessert45"],["romantic","calm","unusual"],1,{routeMode:"micro"}),
  R("3-walk-art-dessert",180,"culture","Прогулка, искусство и десерт",["walk45","art60","dessert45"],["romantic","calm","unusual","active"],1,{routeMode:"micro"}),
  R("3-art-walk-dessert",180,"culture","Искусство, прогулка и десерт",["art60","walk45","dessert45"],["romantic","calm","unusual","active"],1,{routeMode:"micro"}),
  R("3-play-view-dessert",180,"play","Игра, красивый вид и десерт",["play60","view45","dessert35"],["active","fun","unusual","romantic"],2),
  R("3-view-art-dessert",180,"culture","Панорама, искусство и десерт",["view45","art60","dessert45"],["romantic","unusual","calm"],2),
  R("3-art-view-dessert",180,"culture","Искусство, панорама и десерт",["art60","view45","dessert45"],["romantic","unusual","calm"],2),
  R("3-event-walk-dessert",180,"event","Событие, прогулка и десерт",["eventCulture","walk35","dessert35"],["fun","unusual","romantic","calm"],2,{routeMode:"micro"}),
  R("3-walk-event-dessert",180,"event","Прогулка, событие и десерт",["walk35","eventCulture","dessert35"],["fun","unusual","romantic","calm"],2,{routeMode:"micro"}),
  R("3-active-view-walk",180,"active","Активность и городской маршрут",["active70","view45","walk45"],["active","unusual","fun","romantic"],2),
  R("3-walk-creative-view",180,"make","Прогулка, мастер-класс и вид",["walk35","creative75","view45"],["active","unusual","romantic","calm"],2),
  R("3-book-coffee-walk",180,"discover","Маленькое исследование, кофе и прогулка",["slowActivity60","coffee45","walk45"],["calm","unusual","fun","active"],2,{routeMode:"micro"}),
  R("3-brunch-art",180,"daytime","Бранч и выставка",["brunch75","art75"],["calm","romantic","unusual"],1,{dayparts:["morning","day"]}),
  R("3-brunch-walk-coffee",180,"daytime","Бранч, прогулка и кофе",["brunch75","walk45","coffee35"],["calm","romantic","active"],1,{dayparts:["morning","day"],routeMode:"micro"}),
  R("3-coffee-play-dessert",180,"play","Кофе, игра и десерт",["coffee35","play75","dessert35"],["fun","active","romantic"],2,{routeMode:"micro"}),
  R("3-view-walk-art",180,"city","Панорама, прогулка и искусство",["view45","walk45","art60"],["romantic","calm","unusual","active"],2),

  // --- 4 hours: 3–4 chapters with a clear emotional arc. ---
  R("4-art-dinner-dessert",240,"culture","Искусство, ужин и десерт",["art60","dinner90","dessert45"],["romantic","calm","unusual"],1),
  R("4-art-dinner-bar",240,"night","Искусство, ужин и бар",["art60","dinner90","bar70"],["romantic","unusual","fun"],2,{dayparts:["evening","late"]}),
  R("4-creative-dinner-dessert",240,"make","Мастер-класс, ужин и десерт",["creative75","dinner90","dessert45"],["active","fun","romantic","unusual"],2),
  R("4-creative-dinner-bar",240,"make","Мастер-класс, ужин и бар",["creative75","dinner90","bar70"],["active","fun","unusual","romantic"],2,{dayparts:["evening","late"]}),
  R("4-play-dinner-dessert",240,"play","Игра, ужин и десерт",["play75","dinner90","dessert45"],["active","fun","romantic"],2),
  R("4-active-dinner-view",240,"active","Активность, ужин и красивый финал",["active85","dinner80","view45"],["active","fun","romantic","unusual"],2),
  R("4-walk-dinner-view",240,"romance","Прогулка, ужин и красивый вид",["walk55","dinner90","view45"],["romantic","calm","active"],1),
  R("4-walk-dinner-dessert",240,"slow","Прогулка, ужин и десерт",["walk55","dinner90","dessert45"],["romantic","calm"],1),
  R("4-view-dinner-dessert",240,"romance","Панорама, ужин и десерт",["view45","dinner90","dessert45"],["romantic","unusual","calm"],1),
  R("4-view-dinner-bar",240,"night","Панорама, ужин и бар",["view45","dinner90","bar70"],["romantic","unusual","fun"],2,{dayparts:["evening","late"]}),
  R("4-event-dinner-dessert",240,"event","Событие, ужин и десерт",["eventCulture","dinner80","dessert35"],["fun","unusual","romantic"],2),
  R("4-event-dinner-bar",240,"event","Событие, ужин и бар",["eventStage","dinner80","bar55"],["fun","unusual","romantic"],2,{dayparts:["evening","late"]}),
  R("4-dinner-event-dessert",240,"event","Ужин, событие и десерт",["dinner80","eventStage","dessert35"],["fun","unusual","romantic"],2,{dayparts:["day","evening"]}),
  R("4-dinner-event-bar",240,"event","Ужин, событие и бар",["dinner80","eventStage","bar55"],["fun","unusual","romantic"],2,{dayparts:["evening","late"]}),
  R("4-art-event-dessert",240,"event","Искусство, событие и десерт",["art60","eventCulture","dessert35"],["unusual","fun","romantic","calm"],2),
  R("4-event-art-dinner",240,"event","Событие, искусство и ужин",["eventCulture","art60","dinner80"],["unusual","calm","romantic"],2),
  R("4-walk-event-dinner",240,"event","Прогулка, событие и ужин",["walk45","eventStage","dinner80"],["fun","unusual","romantic","active"],2),
  R("4-coffee-art-dinner",240,"culture","Кофе, искусство и ужин",["coffee45","art60","dinner90"],["calm","romantic","unusual"],1),
  R("4-coffee-creative-dinner",240,"make","Кофе, мастер-класс и ужин",["coffee35","creative75","dinner90"],["active","fun","romantic"],2),
  R("4-walk-art-dinner",240,"culture","Прогулка, искусство и ужин",["walk45","art60","dinner90"],["calm","romantic","unusual","active"],1),
  R("4-creative-art-dinner",240,"make","Мастер-класс, искусство и ужин",["creative75","art60","dinner80"],["active","unusual","romantic"],2),
  R("4-art-creative-dinner",240,"make","Искусство, мастер-класс и ужин",["art60","creative75","dinner80"],["active","unusual","fun"],2),
  R("4-active-view-dinner",240,"active","Активность, панорама и ужин",["active70","view45","dinner90"],["active","unusual","romantic"],2),
  R("4-view-art-dinner",240,"culture","Панорама, искусство и ужин",["view45","art60","dinner90"],["romantic","unusual","calm"],2),
  R("4-coffee-event-dessert",240,"event","Кофе, событие и десерт",["coffee35","eventStage","dessert35"],["fun","unusual","calm","romantic"],2),
  R("4-coffee-event-walk",240,"event","Кофе, событие и прогулка",["coffee35","eventStage","walk45"],["fun","unusual","calm","active"],2),
  R("4-walk-event-dessert",240,"event","Прогулка, событие и десерт",["walk45","eventStage","dessert35"],["fun","unusual","romantic","active"],2),
  R("4-art-walk-dinner",240,"culture","Искусство, прогулка и ужин",["art60","walk45","dinner90"],["romantic","calm","unusual","active"],1),
  R("4-walk-play-dinner",240,"play","Прогулка, игра и ужин",["walk35","play75","dinner90"],["active","fun","romantic"],2),
  R("4-coffee-art-walk-dessert",240,"culture","Кофе, искусство, прогулка и десерт",["coffee35","art60","walk45","dessert45"],["romantic","calm","unusual","active"],1,{routeMode:"micro"}),
  R("4-coffee-walk-art-dessert",240,"culture","Кофе, прогулка, искусство и десерт",["coffee35","walk45","art60","dessert45"],["romantic","calm","unusual","active"],1,{routeMode:"micro"}),
  R("4-play-coffee-walk-dessert",240,"play","Игра, кофе, прогулка и десерт",["play60","coffee35","walk45","dessert35"],["active","fun","romantic"],2,{routeMode:"micro"}),
  R("4-view-coffee-art-dessert",240,"culture","Панорама, кофе, искусство и десерт",["view45","coffee35","art60","dessert45"],["romantic","unusual","calm"],2),
  R("4-active-art-view-dessert",240,"active","Активность, искусство, вид и десерт",["active70","art60","view45","dessert35"],["active","unusual","romantic"],2),
  R("4-creative-event-walk",240,"event","Мастер-класс, событие и прогулка",["creative60","eventCulture","walk35"],["active","fun","unusual","calm"],3),
  R("4-art-event-walk",240,"event","Искусство, событие и прогулка",["art60","eventCulture","walk35"],["calm","unusual","fun","active"],2),
  R("4-active-art-walk-view",240,"active","Активность, искусство, прогулка и вид",["active70","art60","walk45","view45"],["active","unusual","romantic","calm"],3),
  R("4-brunch-art-walk",240,"daytime","Бранч, искусство и прогулка",["brunch75","art60","walk55"],["calm","romantic","unusual","active"],1,{dayparts:["morning","day"]}),
  R("4-brunch-creative-coffee",240,"daytime","Бранч, мастер-класс и кофе",["brunch75","creative75","coffee45"],["calm","romantic","fun","active"],2,{dayparts:["morning","day"]}),
  R("4-slowactivity-art-walk-view",240,"discover","Исследование, искусство, прогулка и вид",["slowActivity45","art60","walk45","view45"],["calm","unusual","active","romantic"],2),

  // --- 6 hours: full date arcs. One meal core at most; no filler food-chain. ---
  R("6-coffee-creative-art-dinner-view",360,"make","Кофе, совместное дело, искусство, ужин и вид",["coffee35","creative75","art60","dinner90","view45"],["active","unusual","romantic","calm"],2,{routeMode:"district"}),
  R("6-walk-art-creative-dinner-dessert",360,"culture","Город, искусство, совместное дело, ужин и десерт",["walk45","art60","creative75","dinner90","dessert35"],["active","unusual","romantic","calm"],2,{routeMode:"district"}),
  R("6-view-art-creative-dinner-dessert",360,"culture","Панорама, искусство, мастер-класс, ужин и десерт",["view45","art60","creative75","dinner90","dessert35"],["active","unusual","romantic"],2,{routeMode:"district"}),
  R("6-creative-walk-art-dinner-bar",360,"night","Активность, город, искусство, ужин и бар",["creative75","walk45","art60","dinner90","bar55"],["active","fun","unusual","romantic"],2,{routeMode:"district",dayparts:["day","evening"]}),
  R("6-coffee-creative-art-dinner-bar",360,"night","От кофе и мастер-класса до ужина и бара",["coffee35","creative75","art60","dinner90","bar55"],["active","fun","unusual","romantic"],2,{routeMode:"district",dayparts:["day","evening"]}),
  R("6-view-art-dinner-dessert-bar",360,"night","Панорама, искусство, ужин, десерт и бар",["view45","art60","dinner90","dessert35","bar55"],["romantic","unusual","fun","calm"],2,{routeMode:"district",dayparts:["evening","late"]}),
  R("6-walk-coffee-art-dinner-bar",360,"night","Город, кофе, искусство, ужин и бар",["walk45","coffee35","art60","dinner90","bar55"],["romantic","calm","fun","unusual"],1,{routeMode:"district",dayparts:["day","evening"]}),
  R("6-creative-event-dinner-bar",360,"event","Совместное дело, событие, ужин и бар",["creative75","eventStage","dinner80","bar55"],["active","fun","unusual","romantic"],3,{routeMode:"district",dayparts:["day","evening"]}),
  R("6-active-event-dinner-dessert",360,"event","Активность, событие, ужин и десерт",["active85","eventStage","dinner80","dessert35"],["active","fun","unusual","romantic"],3,{routeMode:"district"}),
  R("6-art-event-walk-dinner-bar",360,"event","Искусство, событие, прогулка, ужин и бар",["art60","eventCulture","walk35","dinner80","bar55"],["fun","unusual","romantic","calm"],2,{routeMode:"district",dayparts:["day","evening"]}),
  R("6-walk-art-event-dinner-dessert",360,"event","Прогулка, искусство, событие, ужин и десерт",["walk35","art60","eventCulture","dinner80","dessert35"],["romantic","unusual","fun","calm"],2,{routeMode:"district"}),
  R("6-coffee-art-event-walk-dinner",360,"event","Кофе, искусство, событие, прогулка и ужин",["coffee35","art60","eventCulture","walk35","dinner80"],["calm","unusual","fun","romantic"],2,{routeMode:"district"}),
  R("6-creative-art-event-dinner",360,"event","Мастер-класс, искусство, событие и ужин",["creative75","art60","eventStage","dinner80"],["active","fun","unusual","romantic"],3,{routeMode:"district"}),
  R("6-walk-play-event-dinner",360,"event","Город, игра, событие и ужин",["walk45","play75","eventStage","dinner80"],["active","fun","unusual","romantic"],3,{routeMode:"district"}),
  R("6-art-view-event-dinner-dessert",360,"event","Искусство, вид, событие, ужин и десерт",["art60","view45","eventCulture","dinner80","dessert35"],["romantic","unusual","fun","calm"],2,{routeMode:"district"}),
  R("6-coffee-view-art-dinner-bar",360,"night","Кофе, панорама, искусство, ужин и бар",["coffee35","view45","art60","dinner90","bar55"],["romantic","unusual","fun","calm"],2,{routeMode:"district",dayparts:["day","evening"]}),
  R("6-view-walk-active-dinner-bar",360,"active","Панорама, прогулка, активность, ужин и бар",["view45","walk45","active85","dinner80","bar55"],["active","romantic","fun","unusual"],2,{routeMode:"district",dayparts:["day","evening"]}),
  R("6-art-creative-event-dinner-dessert",360,"event","Искусство, совместное дело, событие, ужин и десерт",["art60","creative75","eventCulture","dinner80","dessert35"],["romantic","unusual","fun","active"],3,{routeMode:"district"}),
  R("6-coffee-creative-event-art-dinner",360,"event","Кофе, мастер-класс, событие, искусство и ужин",["coffee35","creative75","eventCulture","art60","dinner80"],["calm","unusual","fun","active","romantic"],3,{routeMode:"district"}),
  R("6-art-event-creative-dinner-dessert",360,"event","Искусство, событие, мастер-класс, ужин и десерт",["art60","eventCulture","creative75","dinner80","dessert35"],["romantic","unusual","fun","active"],3,{routeMode:"district"}),
  R("6-creative-event-art-dinner-dessert",360,"event","Мастер-класс, событие, искусство, ужин и десерт",["creative75","eventCulture","art60","dinner80","dessert35"],["romantic","unusual","fun","active"],3,{routeMode:"district"}),
  R("6-art-creative-walk-view-slowactivity",360,"nofd","Искусство, совместное дело и большой городской маршрут",["art75","creative75","walk55","view45","slowActivity60"],["active","unusual","calm","romantic"],3,{routeMode:"district"}),
  R("6-walk-art-active-view-slowactivity",360,"nofd","Городской день без гастрономической части",["walk55","art75","active85","view45","slowActivity60"],["active","unusual","calm","romantic"],3,{routeMode:"district"}),
  R("6-creative-art-walk-active-view",360,"nofd","Делать, смотреть, гулять и двигаться",["creative75","art75","walk55","active85","view45"],["active","unusual","calm","romantic"],3,{routeMode:"district"}),
  R("6-art-play-walk-view-slowactivity",360,"nofd","Искусство, игра и исследование города",["art75","play75","walk55","view45","slowActivity60"],["active","unusual","fun","calm"],3,{routeMode:"district"}),
  R("6-walk-art-event-creative-view",360,"event-nofd","Город, искусство, событие, мастер-класс и вид",["walk45","art75","eventCulture","creative75","view45"],["active","fun","unusual","calm","romantic"],3,{routeMode:"district"}),
  R("6-view-art-event-play-walk",360,"event-nofd","Панорама, искусство, событие, игра и прогулка",["view45","art75","eventCulture","play75","walk45"],["active","fun","unusual","romantic"],3,{routeMode:"district"}),
  R("6-active-walk-event-art-view",360,"event-nofd","Активность, город, событие, искусство и панорама",["active85","walk45","eventCulture","art75","view45"],["active","fun","unusual","romantic"],3,{routeMode:"district"}),
  R("6-art-creative-event-walk-view",360,"event-nofd","Искусство, мастер-класс, событие, прогулка и вид",["art75","creative75","eventCulture","walk45","view45"],["active","fun","unusual","calm","romantic"],3,{routeMode:"district"}),
  R("6-brunch-art-creative-walk-view",360,"daytime","Бранч, искусство, мастер-класс, прогулка и вид",["brunch75","art75","creative75","walk55","view45"],["calm","romantic","unusual","active"],2,{routeMode:"district",dayparts:["morning","day"]}),
  R("6-brunch-walk-art-dinner-view",360,"daytime","Бранч, город, искусство, ужин и вид",["brunch75","walk55","art75","dinner80","view45"],["calm","romantic","unusual","active"],1,{routeMode:"district",dayparts:["morning","day"]}),
  R("6-brunch-play-art-walk-dessert",360,"daytime","Бранч, игра, искусство, прогулка и десерт",["brunch75","play75","art75","walk55","dessert35"],["fun","active","unusual","romantic"],2,{routeMode:"district",dayparts:["morning","day"]}),
  R("6-coffee-slowactivity-art-creative-dinner",360,"discover","Кофе, исследование, искусство, мастер-класс и ужин",["coffee35","slowActivity60","art75","creative75","dinner90"],["calm","unusual","active","romantic"],2,{routeMode:"district"}),
  R("6-view-slowactivity-art-dinner-dessert",360,"discover","Панорама, маленькое исследование, искусство, ужин и десерт",["view45","slowActivity60","art75","dinner90","dessert35"],["romantic","unusual","calm"],2,{routeMode:"district"}),
  R("6-play-art-walk-dinner-dessert",360,"play","Игра, искусство, прогулка, ужин и десерт",["play75","art60","walk45","dinner90","dessert35"],["active","fun","unusual","romantic"],2,{routeMode:"district"}),
  R("6-active-art-walk-dinner-dessert",360,"active","Активность, искусство, прогулка, ужин и десерт",["active85","art60","walk45","dinner90","dessert35"],["active","unusual","romantic","calm"],2,{routeMode:"district"}),
  R("6-creative-view-walk-dinner-dessert",360,"make","Мастер-класс, панорама, прогулка, ужин и десерт",["creative75","view45","walk45","dinner90","dessert35"],["active","unusual","romantic","calm"],2,{routeMode:"district"}),
  R("6-art-walk-view-dinner-bar",360,"night","Искусство, город, панорама, ужин и бар",["art60","walk45","view45","dinner90","bar55"],["romantic","unusual","fun","calm"],2,{routeMode:"district",dayparts:["day","evening"]}),
  R("6-play-view-art-dinner-bar",360,"night","Игра, панорама, искусство, ужин и бар",["play75","view45","art60","dinner90","bar55"],["active","fun","unusual","romantic"],3,{routeMode:"district",dayparts:["day","evening"]}),
  R("6-active-view-art-dinner-bar",360,"night","Активность, панорама, искусство, ужин и бар",["active85","view45","art60","dinner80","bar55"],["active","fun","unusual","romantic"],3,{routeMode:"district",dayparts:["day","evening"]}),

  // Long dates without food need their own real arcs, not a food scenario with chapters deleted.
  // These versions deliberately avoid viewpoints so the filter remains usable in compact central clusters too.
  R("6-active-art-walk-slow-creative",360,"nofd","Активность, искусство, город, исследование и совместное дело",["active85","art75","slowActivity60","walk55","creative75"],["active","unusual","calm","romantic"],3,{routeMode:"district"}),
  R("6-creative-art-walk-play-slow",360,"nofd","Мастер-класс, искусство, прогулка, игра и маленькое исследование",["creative75","art75","play75","walk55","slowActivity60"],["active","fun","unusual","calm"],3,{routeMode:"district"}),
  R("6-art-walk-creative-slow-art",360,"nofd","Два культурных впечатления с прогулкой и совместным делом",["art75","creative75","walk55","slowActivity60","art75"],["unusual","calm","romantic","active"],2,{routeMode:"district"}),
  R("6-play-art-walk-active-slow",360,"nofd","Игра, искусство, город и активная глава",["play75","art75","active85","walk55","slowActivity45"],["active","fun","unusual","calm"],3,{routeMode:"district"}),
  R("6-creative-art-event-walk-slow",360,"event-nofd","Мастер-класс, искусство, событие, прогулка и исследование",["creative75","art75","eventCulture","walk55","slowActivity60"],["active","fun","unusual","calm","romantic"],3,{routeMode:"district"}),
  R("6-active-art-event-walk-slow",360,"event-nofd","Активность, искусство, событие и спокойный городской финал",["active85","art75","eventCulture","walk55","slowActivity60"],["active","fun","unusual","calm"],3,{routeMode:"district"}),
  R("6-art-event-creative-walk-slow",360,"event-nofd","Искусство, событие, мастер-класс, прогулка и маленькое открытие",["art75","eventCulture","creative75","walk55","slowActivity60"],["active","fun","unusual","calm","romantic"],3,{routeMode:"district"}),
  R("6-walk-art-stage-play",360,"event-nofd","Прогулка, искусство, большой выход и игра после",["walk55","art75","eventStage","play75"],["active","fun","unusual","romantic"],3,{routeMode:"district",dayparts:["day","evening"]})
];

function cartesian(options) {
  const result=[];
  const walk=(i,acc)=>{
    if(i===options.length){result.push(acc.slice());return;}
    for(const value of options[i]){acc.push(value);walk(i+1,acc);acc.pop();}
  };
  walk(0,[]);
  return result;
}
function baseCategory(slotSpec){return String(slotSpec.select).split(":")[0];}
function selectorFingerprint(slots){return slots.map((s)=>s.select).join(">");}
function expandRecipe(recipe){
  const optionSets=recipe.packs.map((key)=>P[key]);
  if(optionSets.some((set)=>!set)) throw new Error(`Unknown slot pack in ${recipe.id}`);
  return cartesian(optionSets).map((slots,index)=>({
    id:`${recipe.id}-${String(index+1).padStart(3,"0")}`,
    recipeId:recipe.id,
    duration:recipe.duration,
    family:recipe.family,
    concept:recipe.concept,
    slots:slots.map((value)=>({...value})),
    vibes:[...recipe.vibes],
    adventure:recipe.adventure,
    routeMode:recipe.routeMode,
    dayparts:recipe.dayparts ? [...recipe.dayparts] : null,
    notes:recipe.notes || null,
    structureKey:slots.map(baseCategory).join(">")
  }));
}

const TARGETS = Object.freeze({120:200,180:250,240:275,360:276});
const allCandidates=recipes.flatMap(expandRecipe);
const EVENT_NOMINAL = Object.freeze({exhibition:80,lecture:90,excursion:100,concert:110,theater:130,standup:100,movie:120,show:105,festival:105,party:120,event:105});
function targetFloor(duration){const ratio=duration>=330?.875:duration>=220?.80:duration>=170?.82:.80;return Math.floor((duration*ratio)/5)*5;}
function nominalSlotMinutes(value){
  if(!value.useItemDuration)return Number(value.minutes||60);
  const subtype=(String(value.select).split(":")[1]||"event").split("|")[0];return EVENT_NOMINAL[subtype]||105;
}
function nominalScenarioMinutes(item){return item.slots.reduce((sum,value)=>sum+nominalSlotMinutes(value),0);}
function nominallyFeasible(item){const total=nominalScenarioMinutes(item);return total>=targetFloor(item.duration)&&total<=item.duration+5;}

function balancedSelect(duration,target){
  const raw=allCandidates.filter((x)=>x.duration===duration&&nominallyFeasible(x));
  const dedup=[];
  const seen=new Set();
  for(const item of raw){
    const key=`${duration}|${selectorFingerprint(item.slots)}`;
    if(seen.has(key)) continue;
    seen.add(key);dedup.push(item);
  }

  // Balance on two levels. First rotate through families, then rotate through
  // the reviewed base recipes inside each family. This prevents a prolific
  // recipe from consuming the catalogue before later human-authored flows are
  // even reached (the old implementation could accidentally erase a vibe).
  const families=new Map();
  for(const item of dedup){
    if(!families.has(item.family))families.set(item.family,new Map());
    const recipesInFamily=families.get(item.family);
    if(!recipesInFamily.has(item.recipeId))recipesInFamily.set(item.recipeId,[]);
    recipesInFamily.get(item.recipeId).push(item);
  }
  const familyState=[...families.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([family,recipeMap])=>({
    family,
    recipes:[...recipeMap.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([recipeId,items])=>({recipeId,items,cursor:0})),
    recipeCursor:0
  }));

  const nextFromFamily=(state)=>{
    if(!state.recipes.length)return null;
    for(let attempt=0;attempt<state.recipes.length;attempt++){
      const index=(state.recipeCursor+attempt)%state.recipes.length;
      const recipe=state.recipes[index];
      if(recipe.cursor>=recipe.items.length)continue;
      const item=recipe.items[recipe.cursor++];
      state.recipeCursor=(index+1)%state.recipes.length;
      return item;
    }
    return null;
  };

  const selected=[];
  while(selected.length<target){
    let progressed=false;
    for(const state of familyState){
      const item=nextFromFamily(state);
      if(!item)continue;
      selected.push(item);progressed=true;
      if(selected.length>=target)break;
    }
    if(!progressed)break;
  }
  if(selected.length<target)throw new Error(`Scenario catalogue for ${duration}m only produced ${selected.length}/${target} unique flows`);
  return selected;
}

export const scenarioBlueprints = Object.freeze(
  Object.entries(TARGETS).flatMap(([duration,target])=>balancedSelect(Number(duration),target))
);

export const scenarioStats = Object.freeze({
  total:scenarioBlueprints.length,
  byDuration:Object.freeze(scenarioBlueprints.reduce((acc,scenario)=>{acc[scenario.duration]=(acc[scenario.duration]||0)+1;return acc;},{})),
  byFamily:Object.freeze(scenarioBlueprints.reduce((acc,scenario)=>{acc[scenario.family]=(acc[scenario.family]||0)+1;return acc;},{})),
  recipes:recipes.length
});
