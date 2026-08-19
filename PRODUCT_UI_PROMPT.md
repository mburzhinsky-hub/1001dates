# 1001 Dates — Product UI mandate

## Goal
Raise the current 1001 Dates interface from a strong beta to a coherent product-level experience without changing the product idea or weakening the date-selection constraints.

## 1. Brand identity
- Strengthen unmistakable 1001 Dates motifs: date number, chapters of the evening, private invitation, editorial romance.
- Keep the established cream background, Instrument Serif + DM Sans typography and terracotta accent.
- Remove the feeling of a generic lifestyle template. Decorative decisions should point back to the idea of a private, numbered date from a catalogue of 1001 experiences.

## 2. UI / visual system
- Systematize typography, spacing, radii, buttons, cards and UI states through a coherent token layer.
- Remove critical 8–10 px interface text. Important metadata must remain legible on mobile.
- Improve mobile hierarchy, focus / hover / pressed states, accessibility and visual consistency across planner, result cards, detail views, library and invitation.
- Preserve the premium editorial feeling while making controls read as a deliberate product system.

## 3. UX mechanics
- Never promise exactly three dates. The product may honestly return one, two or three strong scenarios.
- Make result-count copy adapt to the actual number of honest results.
- Improve the no-result state so actions describe what will actually be relaxed.
- Improve the presentation of “why this option” without inventing data.
- Expose selected states semantically through ARIA.
- Preserve Surprise me, replace one chapter, build around this, favorites, history and invitation mechanics.

## 4. Do not do
- Do not surface travel/transfer time in the UI.
- Do not show match percentages.
- Do not add a return-home time.
- Do not weaken budget, duration, date, geography or preference hard constraints.
- Do not reduce a date to a flat list of venues.

## Acceptance criteria
- Desktop and mobile layouts remain coherent at 360 / 390 / 430 / 768 / 1440 widths by code design.
- No critical interface copy is intentionally set below 11 px in the v15 product layer.
- Main interactive controls expose clear keyboard focus and pressed/selected semantics.
- Copy remains truthful for 1, 2 or 3 returned results.
- Existing selection engine is not modified by this UI iteration.
