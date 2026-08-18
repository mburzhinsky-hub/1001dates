# 1001 Dates v7

Веб-приложение, которое собирает три **разных** сценария свидания под выбранные время, бюджет, настроение и пожелания.

## Что изменилось в v7

### Новый пользовательский flow

```text
пара параметров
  ↓
3 разные концепции: Надёжный / Необычный / Вау
  ↓
детали выбранного свидания
  ↓
замена отдельной главы при необходимости
  ↓
приглашение / календарь / share
```

Карточка результата больше не пытается показать весь маршрут сразу. Она помогает выбрать идею вечера, а подробности открываются отдельным экраном.

### Движок

- время — hard constraint;
- бюджет — hard constraint;
- район — hard constraint, если выбран конкретный район;
- indoor / no bars / food / events — hard constraints;
- настроение и уровень эксперимента влияют на ranking;
- выбранные настроения должны реально присутствовать в шаблоне или местах;
- три результата ранжируются по разным ролям: **reliable / discovery / wow**;
- между выбранными сценариями действует similarity penalty;
- длинный фильтр не заполняется короткими сценариями;
- дорога не показывается и не входит в длительность свидания.

В `engine.js` находится 60 сценарных blueprint-структур. При росте базы количество возможных комбинаций растёт автоматически.

### Новые механики

- мультивыбор до двух настроений;
- «Удиви меня» сохраняет время, бюджет и ограничения;
- замена **только одного** места внутри понравившегося свидания;
- «Собрать вокруг этого» для понравившегося места/события;
- избранные свидания;
- избранные места;
- история выбранных свиданий;
- исключение уже выбранных мест;
- «больше не предлагать» для конкретного места;
- локальная персонализация без аккаунта через `localStorage`;
- приглашение в режимах «сюрприз» и «показать план»;
- личная подпись в приглашении;
- экспорт выбранного свидания в `.ics` календарь.

## Ссылки

В UI ссылка показывается только если это:

- конкретная страница KudaGo вида `/msk/place/.../` или `/msk/event/.../`;
- либо официальный внешний сайт.

Общие страницы каталогов намеренно скрываются. В seed-базе такие ссылки удалены.

## База данных

Fallback-база находится в `data/seed.js`, чтобы приложение запускалось сразу и работало офлайн.

Production snapshot собирается из KudaGo API:

```bash
node scripts/update-kudago.mjs
```

По умолчанию importer читает до:

- 1200 исходных places;
- 500 актуальных events на ближайшие 60 дней.

После этого места балансируются по категориям, чтобы база не состояла почти целиком из парков или музеев. Параметры можно менять:

```bash
KUDAGO_PLACE_PAGES=15 \
KUDAGO_EVENT_PAGES=7 \
KUDAGO_PER_CATEGORY=200 \
node scripts/update-kudago.mjs
```

Snapshot записывается в:

```text
data/kudago.generated.js
```

## Проверки

```bash
node scripts/validate-data.mjs
node scripts/smoke-test.mjs
```

После живого импорта используется строгая проверка:

```bash
node scripts/validate-data.mjs --strict
```

Она отбраковывает плохие URL, битые категории и слишком узкую/маленькую импортированную базу.

## GitHub Actions

`.github/workflows/refresh-data.yml`:

1. обновляет городскую базу;
2. валидирует snapshot;
3. запускает smoke-test движка;
4. только после успешных проверок коммитит свежие данные.

Workflow запускается при push в `main`, вручную и ежедневно по расписанию.

## Локальный запуск

Сборщик не нужен.

```bash
cd 1001-dates
python3 -m http.server 8080
```

Открыть:

```text
http://localhost:8080
```

## GitHub Pages

Содержимое папки `1001-dates` должно лежать в корне репозитория. Затем:

```text
Settings → Pages → Deploy from a branch → main → /(root)
```

Все пути относительные, поэтому проект работает по адресу вида:

```text
https://username.github.io/1001-dates/
```

## Обновление существующего репозитория через GitHub Desktop

1. распаковать новую версию;
2. скопировать **содержимое** папки `1001-dates` в существующую локальную папку репозитория;
3. не удалять существующую `.git`;
4. `Commit to main`;
5. `Push origin`.

Service worker поднят до `1001-dates-v7`, а HTML/CSS/JS имеют version query `v=7`, чтобы iPhone не продолжал показывать старую сборку после push.

## Файлы

```text
index.html                         интерфейс
styles.css                         дизайн / mobile layout
app.js                             UI, local profile, favorites, history, invite
engine.js                          constraints, generation, ranking, replacement

data/seed.js                      fallback data
data/kudago.generated.js          generated city snapshot

scripts/update-kudago.mjs         importer
scripts/validate-data.mjs         data/link validator
scripts/smoke-test.mjs            engine tests

.github/workflows/refresh-data.yml automatic refresh
sw.js                              PWA cache
manifest.webmanifest               PWA manifest
```
