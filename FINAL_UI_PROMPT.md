# 1001 Dates — Final Product UI

Final structural presentation rewrite. The browser must load exactly one UI stylesheet (`styles-final.css`) and one UI runtime (`app-final.js`). Neither may import or depend on legacy UI styles or renderers.

Core rules:
- Mobile-first base at 390x844; validate 360, 375, 390, 393, 430, 768 and desktop.
- Preserve recommendation engine, hard constraints, data, Surprise me, replace, build-around, favorites/history/dislikes and invitation flow.
- Never show travel/road time, match percentage, return-home time or internal scores.
- Home is a compact emotional entry point, not a long form. Filters live in one bottom sheet with one scroll surface.
- Results are editorial date cards: photo, stable number, mood/archetype, title, short route, duration/budget and one clear action.
- Detail is a full-screen product screen on mobile. Chapters stack vertically; role labels never share a cramped metadata row.
- Replace is a dedicated full-screen contextual choice, not a venue catalogue.
- Invitation is a responsive 4:5 branded poster with controls visually secondary.
- Mobile navigation has three destinations: Подобрать / Мои свидания / Профиль.
- All overlays use one scrolling surface, no floats, no negative margins, no nested overflow containers. Mobile dialogs use 100dvh and safe areas.
- Minimum critical text 12px; body 15–17px; touch targets at least 44x44px.
- Long real content must wrap without collision. No horizontal scroll at supported mobile widths.
- Old CSS/app layers may remain in repository history but must not be loaded by the final production page.
