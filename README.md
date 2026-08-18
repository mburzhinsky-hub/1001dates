# 1001 Dates v11

1001 Dates собирает три разных свидания под реальные ограничения пользователя: **район, дата, время старта, длительность, бюджет, настроение и пожелания**.

## Что изменилось в v11

Главное изменение — полностью новая библиотека сценариев и более строгий планировщик.

В `data/scenarios.js` теперь находится **ровно 1001 scenario blueprint**:

- 200 сценариев на 2 часа;
- 250 сценариев на 3 часа;
- 275 сценариев на 4 часа;
- 276 сценариев на 6 часов.

Эти 1001 blueprint собраны из **154 отдельно продуманных базовых flows**. Расширение делается не перестановкой категорий, а специализацией конкретной главы: например «искусство» может стать галереей, музеем, фотографией, digital-art или научной экспозицией; «активность» — керамикой, рисованием, танцами, боулингом, VR, квестом, скалодромом, картингом, мини-гольфом, книжным, винилом и т.д.

Примеры нормальных человеческих flows:

```text
кофе → небольшая выставка
мастер-класс → ужин → десерт
прогулка → искусство → ужин
активность → событие → ужин → бар
кофе → искусство → прогулка → десерт
искусство → событие → мастер-класс → прогулка → маленькое открытие
```

Для `food=false` есть отдельные длинные сценарии. Движок не берет обычный гастрономический сценарий и не вырезает из него ресторан — без еды используется самостоятельная логика вечера.

## Почему 1001 сценарий не превращается в 1001 случайную перестановку

У каждого сценария заранее заданы:

- длительность;
- family / характер вечера;
- допустимые настроения;
- adventure level;
- точный порядок глав;
- рекомендуемая длительность каждой главы;
- роль каждой главы в истории вечера;
- route mode;
- daypart, если сценарий подходит только для утра/дня/вечера;
- разрешенные subtype мест/событий.

Автоаудит запрещает плохие структуры: бар не оказывается в середине вечера, десерт не ставится перед обычным ужином, активная глава не ставится после обычного плотного ужина, нет бессмысленных соседних одинаковых глав, нет трех гастрономических остановок и т.п.

Каталог специально балансируется **по family и по исходным human-reviewed flows**, чтобы один богатый вариантами рецепт не вытеснил остальные. Это важно для `Спокойно`, `Активно`, `Необычно` и других фильтров.

## Более точный словарь мест

Вместо одной широкой `activity` движок умеет различать subtype:

```text
art:
  gallery / museum / contemporary / digital / photo / science

walk:
  park / waterfront / architecture

viewpoint:
  observation / rooftop

activity:
  workshop / pottery / painting / cooking / dance
  games / bowling / billiards / vr / quest / karaoke
  climbing / skating / karting / mini_golf
  bookstore / vinyl / market

food:
  coffee / tea / bakery
  pastry / icecream / chocolate
  restaurant / casual / gastropub / breakfast / brunch
  cocktail / wine / jazz

events:
  exhibition / lecture / excursion
  concert / theater / standup / movie / show
  festival / party
```

Fallback-объекты без `subtype` классифицируются локально по названию и описанию. Live importer сохраняет subtype прямо в snapshot.

## Все фильтры — настоящие constraints

- `duration` — hard constraint;
- `budget` — hard constraint;
- выбранный район — hard constraint;
- `indoorOnly` — hard constraint;
- `noBars` — hard constraint;
- `food=true` требует гастрономическую главу;
- `food=false` полностью исключает еду;
- `useEvents=false` полностью исключает события;
- настроение должно быть покрыто сценарием и конкретными точками;
- два выбранных mood тоже проверяются;
- `adventure=safe/wild` ограничивает характер сценария;
- visited/disliked места исключаются;
- дата проверяется по актуальности события;
- время старта участвует в daypart и, когда доступны данные, в часах работы;
- fixed-time events проверяются на физическую выполнимость последовательности.

Если честного варианта под фильтры нет, движок возвращает 1–2 результата или no-result. Он не нарушает фильтр и не дублирует ту же broad structure ради заполнения трех карточек.

## Маршрут — скрытый hard constraint

Пользователь по-прежнему **не видит дорогу и она не прибавляется к выбранным 2/3/4/6 часам**.

Но внутри движка маршрут теперь обязателен.

Проверяются:

- расстояние между каждой соседней точкой;
- максимальный размах всего свидания;
- суммарная длина последовательности;
- zig-zag / backtracking;
- более строгие лимиты для коротких сценариев;
- route mode конкретного сценария: `micro / compact / district / extended`;
- скрытый transfer buffer для попадания на событие к фиксированному времени.

Если есть координаты, используется геометрия по lat/lon. Если fallback-объект без координат — действует консервативное правило одной крупной московской зоны.

## Три результата должны быть реально разными

`Надёжный / Необычный / Вау` ранжируются отдельно.

При выборе трех результатов учитываются:

- разные concrete places;
- разные scenario templates;
- разные broad structures;
- разные subtype;
- family;
- штраф за визуально/структурно похожие планы.

На regression-аудите текущего fallback набора не выбрано ни одного географически невалидного маршрута и не повторяется broad structure внутри тройки, когда есть честная альтернатива.

## База мест и событий

Fallback:

```text
data/seed.js
```

Live snapshot строится во время GitHub Pages deploy:

```text
data/kudago.generated.js
```

Importer по умолчанию читает до:

- 2000 исходных places;
- 800 events на ближайшие 60 дней;
- до 280 качественных объектов на broad category;
- до 90 объектов одного subtype, чтобы база не была забита одним форматом.

В production в planner допускаются только объекты с валидными координатами. Для places importer также сохраняет timetable и пытается преобразовать понятные часы работы в `weeklyHours`.

Запуск вручную:

```bash
node scripts/update-kudago.mjs
```

## Проверки v11

```bash
node scripts/validate-data.mjs
node scripts/audit-scenarios.mjs
node scripts/smoke-test.mjs
node scripts/audit-filters.mjs
```

На текущей fallback-базе:

```text
1001 scenario blueprints
154 reviewed base flows
132 576 theoretical concrete combinations

scenario route regression:
1160 selected plans
0 invalid geography
0 result sets with repeated broad structure

smoke route sample:
696 selected plans
0 cross-zone plans

filter audit:
960 filter configurations
1388 returned plans checked
```

`audit-filters` специально разрешает honest no-result на маленьком fallback snapshot: отсутствие варианта считается лучше, чем нарушение hard constraint.

## GitHub Desktop / Pages

Workflow:

```text
.github/workflows/deploy-pages.yml
```

Он делает:

```text
checkout
→ live data import
→ validate snapshot
→ audit 1001 scenarios
→ smoke tests
→ filter matrix
→ upload Pages artifact
→ deploy
```

**Workflow не делает `git commit` и не делает `git push` в `main`.**

Поэтому после того, как старый конфликт generated-файла уже разрешен, обычный процесс такой:

```text
GitHub Desktop
→ Commit to main
→ Push origin
```

GitHub Pages:

```text
GitHub → Settings → Pages → Source → GitHub Actions
```

## Локальный запуск

```bash
cd 1001-dates
python3 -m http.server 8080
```

Открыть:

```text
http://localhost:8080
```

## Основные файлы

```text
index.html                         UI
styles.css                         design / mobile
app.js                             UX, history, favorites, invite PNG/share
engine.js                          constraints, timetable, routing, generation, ranking

data/scenarios.js                 1001 curated scenario blueprints
data/seed.js                      fallback places/events
data/kudago.generated.js          deploy-time city snapshot

scripts/update-kudago.mjs         subtype-aware live importer
scripts/validate-data.mjs         data validator
scripts/audit-scenarios.mjs       audit all 1001 scenario blueprints
scripts/export-scenario-catalog.mjs human-readable export of all 1001
scripts/smoke-test.mjs            planner regression suite
scripts/audit-filters.mjs         960-filter constraint matrix

.github/workflows/deploy-pages.yml GitHub Pages build/deploy
sw.js                              PWA cache v11
SCENARIO_CATALOG.md                полный список 1001 blueprint
```
