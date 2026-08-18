# 1001 Dates — v12 Clean

Полная чистая сборка приложения для публикации через GitHub Desktop + GitHub Pages.

## Что находится в архиве

- `index.html` — приложение и интерфейс.
- `styles.css` — вся дизайн-система и mobile UI.
- `app.js` — интерфейс, состояние, избранное, история, приглашения, PNG-share и календарь.
- `engine.js` — генератор свиданий, hard/soft constraints, география, scoring и разнообразие.
- `data/scenarios.js` — библиотека из 1001 сценарного blueprint.
- `data/seed.js` — curated fallback-база мест и событий.
- `data/kudago.generated.js` — место для импортированного snapshot KudaGo.
- `scripts/update-kudago.mjs` — ручное обновление snapshot.
- `scripts/validate-data.mjs` — проверка данных.
- `scripts/audit-scenarios.mjs` — структурный аудит 1001 сценария.
- `scripts/audit-filters.mjs` — матричный аудит фильтров.
- `scripts/smoke-test.mjs` — smoke/regression tests движка.
- `scripts/export-scenario-catalog.mjs` — экспорт каталога сценариев.
- `SCENARIO_CATALOG.md` — читаемый каталог всех сценариев.
- `manifest.webmanifest`, `sw.js`, `assets/icon.svg` — PWA.
- `.nojekyll` — корректная публикация GitHub Pages.
- `.gitignore`, `.gitattributes` — настройки Git.

**В этой сборке специально нет `.github/workflows`.** Она не создаёт автоматические коммиты, не обновляет `main` ботом и не запускает собственный competing deploy.

## Как полностью заменить старый проект

В своей локальной папке репозитория оставьте только скрытую папку `.git`. Удалите все остальные старые файлы и папки. Затем скопируйте в корень содержимое папки `1001-dates` из этого архива.

Итоговый корень должен содержать `index.html`, `styles.css`, `app.js`, `engine.js`, `data/`, `scripts/`, `assets/` и остальные файлы из списка выше. **Не должна оставаться старая папка `.github`.**

После этого в GitHub Desktop: `Commit to main` → `Push origin`.

## GitHub Pages

В репозитории GitHub откройте `Settings → Pages` и выберите:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

После этого публикацией занимается стандартный GitHub Pages workflow.

## Локальная проверка

Из корня проекта:

```bash
python -m http.server 8080
```

Откройте `http://localhost:8080`.

## Тесты движка

Если установлен Node.js:

```bash
node scripts/audit-scenarios.mjs
node scripts/smoke-test.mjs
node scripts/audit-filters.mjs
node scripts/validate-data.mjs
```

## Обновление базы KudaGo вручную

```bash
node scripts/update-kudago.mjs
node scripts/validate-data.mjs --strict
```

После успешного обновления `data/kudago.generated.js` можно закоммитить через GitHub Desktop как обычный файл.
