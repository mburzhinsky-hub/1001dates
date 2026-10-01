// Invitation link and postcard layout: round trips, link size, secrecy of the plan, and "nothing overlaps".
import { encodeInvite, encodeInviteSync, decodeInvite, normalizeInvite, coverPath, coverUrl, postcardLayout, fitText, wrapWords, POSTCARD, font } from "../invite.js";

function assert(c, m) { if (!c) throw new Error(m); }
const base = {
  no: "579", title: "Искусство, прогулка и ужин", date: "2026-10-03", time: "19:00", duration: "3 ч 35 мин",
  note: "Просто освободи вечер. Остальное — сюрприз.", theme: "warm", reveal: "secret",
  items: ["Музей-театр «Булгаковский дом»", "Патриаршие пруды", "ресторан «Турандот»"], itemCount: 3,
  bg: "place/4f/e6/4fe6637684563af731212b81de8abe93.jpeg"
};

// ---- link: round trip, short, secret stays secret ----
for (const variant of [
  base,
  { ...base, reveal: "full", theme: "night" },
  { ...base, theme: "minimal", bg: "" },
  { ...base, title: "Панорама, искусство, мастер-класс, ужин и десерт «Вечер»", note: "Люблю тебя ♡ \"до встречи\" <3" }
]) {
  const payload = normalizeInvite(variant);
  const token = await encodeInvite(payload), back = await decodeInvite(token);
  assert(back && back.title === payload.title && back.date === payload.date && back.time === payload.time && back.note === payload.note, "round trip lost data");
  assert(back.theme === payload.theme && back.reveal === payload.reveal && back.bg === payload.bg && back.itemCount === payload.itemCount, "round trip lost settings");
  assert(JSON.stringify(back.items) === JSON.stringify(payload.reveal === "full" ? payload.items : []), "a surprise link must not carry the plan");
  const sync = await decodeInvite(encodeInviteSync(payload));
  assert(sync && sync.title === payload.title, "plain link does not decode");
  assert(token.length <= 520, `link token too long: ${token.length}`);
}
const typical = await encodeInvite(normalizeInvite(base));
assert(typical.length < 330, `a typical surprise link should stay short, got ${typical.length}`);
assert(typical.length < encodeInviteSync(normalizeInvite(base)).length, "compression did not shorten the link");

// ---- first-generation links keep working ----
const legacyJson = JSON.stringify({ v: 1, no: "012", title: "Кофе и выставка", date: "2026-10-05", time: "12:30", duration: "2 ч", note: "Привет", theme: "night", reveal: "full", items: ["А", "Б"], itemCount: 2 });
const legacyToken = btoa(String.fromCharCode(...new TextEncoder().encode(legacyJson))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const legacy = await decodeInvite(legacyToken);
assert(legacy && legacy.title === "Кофе и выставка" && legacy.theme === "night" && legacy.reveal === "full" && legacy.items.length === 2, "old links no longer open");

// ---- garbage never opens a broken invitation ----
for (const bad of ["", "z.", "z.@@@@", "p.", "p.AAAA", "e30", "not-a-token", "z.AAAAAAAA", null, undefined]) {
  assert((await decodeInvite(bad)) === null, `garbage token "${bad}" produced an invitation`);
}
assert(normalizeInvite({ title: "x", date: "03.10.2026" }) === null, "a bad date was accepted");
assert(normalizeInvite({ title: "", date: "2026-10-03" }) === null, "an empty title was accepted");

// ---- cover photo reference ----
const url = "https://media.kudago.com/images/place/4f/e6/4fe6637684563af731212b81de8abe93.jpeg";
assert(coverPath(url) === "place/4f/e6/4fe6637684563af731212b81de8abe93.jpeg" && coverUrl(coverPath(url)) === url, "cover path round trip failed");
assert(coverPath("https://evil.example/images/place/4f/e6/4fe6637684563af731212b81de8abe93.jpeg") === "" && coverUrl("../../x") === "", "foreign cover URL was accepted");

// ---- text fitting ----
const widthOf = (factor) => (f, s) => Number(/(\d+)px/.exec(f)[1]) * factor * [...s].length;
const m1 = (size, s) => size * 0.5 * s.length;
const lines = wrapWords((s) => m1(40, s), "Искусство прогулка и ужин в центре города", 400);
assert(lines.length > 1 && lines.every((l) => m1(40, l) <= 400), "wrapWords produced an over-long line");
assert(wrapWords((s) => m1(40, s), "Сверхдлинноеслововообщебезпробелов", 300).every((l) => m1(40, l) <= 300), "an over-long word was not broken");
const fitted = fitText((size, s) => size * 0.5 * s.length, "Очень длинное название вечера которое никак не помещается в три строки на открытке даже самым мелким шрифтом " + "слово ".repeat(30), { sizes: [60, 40], maxWidth: 500, maxLines: 2 });
assert(fitted.lines.length === 2 && fitted.lines[1].endsWith("…") && fitted.lines.every((l) => 40 * 0.5 * l.length <= 500), "text that cannot fit must end with an ellipsis, not overflow");

// ---- postcard layout: nothing overlaps, nothing leaves the frame (for narrow, normal and very wide fonts) ----
const titles = ["Кофе", "Ужин и красивый финал", "Искусство, прогулка и ужин", "Панорама, искусство, мастер-класс, ужин и десерт", "Город, кофе, искусство, ужин и бар в центре Москвы с видом на реку и закатом", "Д".repeat(60) + " " + "слово ".repeat(14)];
const notes = ["", "Просто освободи вечер.", "Просто освободи вечер. Остальное — сюрприз. Надень что-нибудь тёплое и возьми хорошее настроение, остальное я беру на себя.", "x".repeat(100)];
let cases = 0;
for (const factor of [0.42, 0.52, 0.66]) {
  const measure = widthOf(factor);
  for (const title of titles) for (const note of notes) for (const reveal of ["secret", "full"]) for (const itemCount of [2, 4]) {
    const payload = normalizeInvite({ ...base, title, note, reveal, itemCount, items: base.items.concat(["Четвёртая точка вечера с очень длинным названием места для проверки"]).slice(0, itemCount), date: "2026-10-23" });
    const L = postcardLayout(measure, payload);
    cases++;
    const where = `${factor}/${title.length}/${note.length}/${reveal}/${itemCount}`;
    for (const line of L.main.title.lines) assert(measure(font.serif(L.main.title.size), line) <= L.inner + 0.5, `title line too wide (${where})`);
    for (const line of L.main.note.lines) assert(measure(font.sans(L.main.note.size), line) <= L.inner + 0.5, `note line too wide (${where})`);
    assert(L.main.label.y < L.main.title.top + 4, `label runs into the title (${where})`);
    assert(L.main.title.bottom <= L.main.note.top || !L.main.note.lines.length, `title runs into the note (${where})`);
    assert(Math.max(L.main.title.bottom, L.main.note.bottom) <= L.footer.lineY - 20, `text runs into the footer (${where})`);
    assert(L.main.top >= L.dateBottom + 10, `text block climbs into the date (${where})`);
    if (L.plan) {
      const last = L.plan.rows[L.plan.rows.length - 1];
      assert(last.y + 12 < L.main.top, `plan list runs into the title (${where})`);
      for (const row of L.plan.rows) assert(measure(font.sans(28, 600), row.title) <= POSTCARD.width - POSTCARD.margin - L.plan.titleX + 0.5, `plan row too wide (${where})`);
    }
    assert(L.month.x >= L.day.x + measure(font.serif(210), L.day.text) + 30, `month overlaps the day number (${where})`);
  }
}
assert(cases > 250, "layout test did not run enough cases");
console.log(`Invite OK: links round-trip (${typical.length} chars typical), old links open, ${cases} postcard layouts without overlap.`);
