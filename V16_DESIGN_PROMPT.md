# 1001 Dates — v16 Mobile Product Redesign

## Product goal
Turn 1001 Dates into a mature mobile-first date curation product. The interface must feel like a private editorial service, not a filter form, venue catalogue or generic lifestyle template.

## Non-negotiable product logic
- Keep the existing recommendation engine, hard constraints, database and scenario catalogue intact.
- Never surface transport/road time, match percentages or return-home time.
- Return one to three honest date scenarios; never pad the result count with weak duplicates.
- Preserve Surprise me, replace a chapter, build around a place, favorites/history and invitation mechanics.

## Visual language
- Warm ivory canvas, near-black typography, terracotta accent.
- Instrument Serif only for emotional/editorial headlines; DM Sans for interface and utility information.
- The scenario is the primary product object. A card should communicate: image -> feeling -> route -> time/budget -> action.
- Keep a stable date number from the 1001 collection across cards, detail, invitation and library.
- Reduce decorative English and ornamental UI. Brand through restraint, not through labels everywhere.
- Minimum critical text size: 12px. Minimum interactive target: 44px.
- Photography is art-directed through consistent crop, dark gradient and typography placement.

## Mobile information architecture
Primary mobile navigation has three destinations:
1. Подобрать
2. Мои свидания
3. Профиль

Saved dates, history and favorite places live inside “Мои свидания”.

## Main screen
- Ask one emotional question: “Какой вечер хочется сегодня?”
- Show the current date parameters as compact chips.
- Provide one dominant “Подобрать свидания” CTA and a secondary “Удиви меня”.
- Move the full parameter form into a dedicated bottom sheet (“Настроить вечер”).
- The first viewport must not look like a long questionnaire.

## Results
- One to three editorial scenario cards.
- Strong photography, stable №, archetype, title, short why, compact route, duration and budget.
- Cards must feel like complete evenings, not venue listings.
- On mobile: one card per row with generous vertical rhythm.

## Date detail
- Present the evening as chapters.
- Explicit emotional roles: “Начало”, “Главная часть”, “Финал” (and an extra chapter when needed).
- Keep chapter replacement contextual and quiet.
- The explanation must remain tied to the generation snapshot.

## Replacement
Do not visually turn replacement into a venue aggregator. Replacement remains a contextual action inside the chapter and should visually read as changing the character of one chapter, not shopping through a list.

## Invitation
The invitation is a branded artifact, not another form screen. Keep controls visually secondary and the poster dominant.

## Empty state
Be honest: “Сейчас хорошего варианта нет.” Explain that time/budget/constraints are not being broken. Offer clear relaxation actions.

## Acceptance
- Professional at 360, 390, 430, 768 and 1440px by code design.
- One public v16 CSS entrypoint and one public v16 JS entrypoint.
- Existing engine and data files remain unchanged.
- Keyboard/focus states remain functional.
- Service worker moves to a v16 cache namespace.
