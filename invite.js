// Invitation: the shareable link payload and the postcard picture.
// Everything here is plain functions (no DOM), so it can be tested in Node.
// The postcard layout measures real text widths, so a long title shrinks or wraps instead of running over its neighbours.

export const POSTCARD = { width: 1080, height: 1350, margin: 88 };
const THEMES = ["warm", "night", "minimal"];
const COVER_RE = /^(place|event)\/[0-9a-f]{2}\/[0-9a-f]{2}\/[0-9a-f]{32}\.(jpe?g|png|webp)$/i;

// ---------- Cover photo reference (kept short so the link stays short) ----------
export function coverPath(url) {
  const match = /^https:\/\/media\.kudago\.com\/images\/(.+)$/.exec(String(url || ""));
  return match && COVER_RE.test(match[1]) ? match[1] : "";
}
export function coverUrl(path) {
  return COVER_RE.test(String(path || "")) ? `https://media.kudago.com/images/${path}` : "";
}

// ---------- Payload ----------
export function normalizeInvite(raw) {
  if (!raw || typeof raw !== "object") return null;
  const title = String(raw.title || "").replace(/\s+/g, " ").trim().slice(0, 120);
  const date = String(raw.date || "");
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const time = /^\d{2}:\d{2}$/.test(String(raw.time || "")) ? String(raw.time) : "19:00";
  return {
    v: 2,
    no: String(raw.no || "001").replace(/\D/g, "").slice(0, 4) || "001",
    title,
    date,
    time,
    duration: String(raw.duration || "вечер").slice(0, 32),
    note: String(raw.note || "").slice(0, 100),
    theme: THEMES.includes(raw.theme) ? raw.theme : "warm",
    reveal: raw.reveal === "full" ? "full" : "secret",
    items: Array.isArray(raw.items) ? raw.items.slice(0, 4).map((item) => String(item).slice(0, 80)) : [],
    itemCount: Math.max(1, Math.min(9, Number(raw.itemCount) || 1)),
    bg: COVER_RE.test(String(raw.bg || "")) ? String(raw.bg) : ""
  };
}
// Compact array form. The plan items are only included when the sender chose to reveal the plan:
// a "surprise" link must not carry the surprise inside it.
function pack(p) {
  const full = p.reveal === "full";
  return [2, p.no, p.title, p.date, p.time, p.duration, p.note, Math.max(0, THEMES.indexOf(p.theme)), full ? 1 : 0, p.itemCount, p.bg || "", full ? p.items : []];
}
function unpack(a) {
  if (!Array.isArray(a) || a[0] !== 2) return null;
  return normalizeInvite({ no: a[1], title: a[2], date: a[3], time: a[4], duration: a[5], note: a[6], theme: THEMES[a[7]], reveal: a[8] ? "full" : "secret", itemCount: a[9], bg: a[10], items: a[11] });
}

function bytesToB64url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlToBytes(text) {
  let base = String(text || "").replace(/-/g, "+").replace(/_/g, "/");
  while (base.length % 4) base += "=";
  const binary = atob(base);
  return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
}
async function throughStream(stream, bytes) {
  const writer = stream.writable.getWriter();
  writer.write(bytes).catch(() => {});
  writer.close().catch(() => {});
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

// "z.<deflate>" is the short form, "p.<plain>" works everywhere, a bare token is the first-generation link (still readable).
export function encodeInviteSync(payload) {
  return "p." + bytesToB64url(new TextEncoder().encode(JSON.stringify(pack(payload))));
}
export async function encodeInvite(payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(pack(payload))), plain = "p." + bytesToB64url(bytes);
  if (typeof CompressionStream === "function") {
    try {
      const packed = "z." + bytesToB64url(await throughStream(new CompressionStream("deflate-raw"), bytes));
      if (packed.length < plain.length) return packed;
    } catch { /* fall back to the plain form */ }
  }
  return plain;
}
export async function decodeInvite(token) {
  const text = String(token || "");
  try {
    if (text.startsWith("z.")) {
      const bytes = await throughStream(new DecompressionStream("deflate-raw"), b64urlToBytes(text.slice(2)));
      return unpack(JSON.parse(new TextDecoder().decode(bytes)));
    }
    if (text.startsWith("p.")) return unpack(JSON.parse(new TextDecoder().decode(b64urlToBytes(text.slice(2)))));
    const legacy = JSON.parse(new TextDecoder().decode(b64urlToBytes(text)));
    return legacy && legacy.v === 1 ? normalizeInvite(legacy) : null;
  } catch { return null; }
}

// ---------- Text fitting ----------
export function ellipsize(measure, text, maxWidth) {
  if (measure(text) <= maxWidth) return text;
  let cut = String(text);
  while (cut.length > 1 && measure(cut + "…") > maxWidth) cut = cut.slice(0, -1);
  return cut.trimEnd() + "…";
}
export function wrapWords(measure, text, maxWidth) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean), lines = [];
  let line = "";
  for (const word of words) {
    let rest = word;
    while (rest.length > 1 && measure(rest) > maxWidth) { // a single word wider than the line is broken
      let cut = rest.length - 1;
      while (cut > 1 && measure(rest.slice(0, cut)) > maxWidth) cut--;
      if (line) { lines.push(line); line = ""; }
      lines.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
    const next = line ? `${line} ${rest}` : rest;
    if (measure(next) <= maxWidth) line = next;
    else { if (line) lines.push(line); line = rest; }
  }
  if (line) lines.push(line);
  return lines;
}
// Tries the sizes from largest to smallest; if even the smallest does not fit, the last line gets an ellipsis.
export function fitText(measureAt, text, { sizes, maxWidth, maxLines }) {
  for (const size of sizes) {
    const lines = wrapWords((s) => measureAt(size, s), text, maxWidth);
    if (lines.length <= maxLines) return { size, lines };
  }
  const size = sizes[sizes.length - 1], lines = wrapWords((s) => measureAt(size, s), text, maxWidth);
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = ellipsize((s) => measureAt(size, s), lines.slice(maxLines - 1).join(" "), maxWidth);
  return { size, lines: kept };
}

// ---------- Postcard layout ----------
export const SERIF = '"Cormorant", Georgia, "Times New Roman", serif';
export const SANS = '"Onest", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
export const font = {
  serif: (size, weight = 500) => `${weight} ${size}px ${SERIF}`,
  sans: (size, weight = 400) => `${weight} ${size}px ${SANS}`
};
export const PALETTES = {
  warm: { text: "#fff4e9", muted: "#e9cfc3", accent: "#ef6a47", line: "rgba(255,244,233,.45)" },
  night: { text: "#f4f3ff", muted: "#c9cde7", accent: "#8fa3ff", line: "rgba(244,243,255,.4)" },
  minimal: { text: "#181714", muted: "#6d6259", accent: "#b45136", line: "rgba(24,23,20,.4)" }
};
function dateParts(date) {
  const d = new Date(`${date}T12:00:00`);
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: new Intl.DateTimeFormat("ru-RU", { month: "long" }).format(d).toUpperCase()
  };
}
const CHAPTER_WORD = (n) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? "глава" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "главы" : "глав"}`;

// measure(fontString, text) -> width in px. Returns every position the drawing needs.
export function postcardLayout(measure, payload) {
  const { width: W, margin: M } = POSTCARD, inner = W - 2 * M, full = payload.reveal === "full";
  const { day, month } = dateParts(payload.date);
  const layout = { inner, margin: M, width: W, height: POSTCARD.height, full };

  // header and date
  const dayWidth = measure(font.serif(210, 500), day);
  layout.top = { y: 105 };
  layout.day = { text: day, x: M - 6, y: 335, size: 210 };
  layout.month = { text: month, x: Math.max(360, layout.day.x + dayWidth + 44), y: 245, size: 50 };
  layout.time = { text: payload.time, x: layout.month.x, y: 302, size: 30 };
  layout.dateBottom = 360;

  // plan list (only when the plan is revealed)
  layout.plan = null;
  let minTop = 410;
  if (full && payload.items.length) {
    const rows = payload.items.slice(0, 4).map((item, i) => ({
      no: String(i + 1).padStart(2, "0"),
      title: ellipsize((s) => measure(font.sans(28, 600), s), item, W - M - 160),
      y: 515 + i * 72
    }));
    layout.plan = { labelY: 450, rows, noX: M, titleX: 160 };
    minTop = rows[rows.length - 1].y + 16 + 44;
  }

  // title + note block, anchored above the footer; sizes shrink until it fits between minTop and the footer
  const footerLine = 1195, bottom = 1148;
  const titleSizes = full ? [88, 80, 72, 64, 56, 50, 44] : [112, 104, 96, 88, 80, 72, 64, 56];
  const titleLines = full ? 2 : 3, noteSizes = [30, 28, 26], noteMax = full ? 2 : 3;
  const labelH = 24, gap1 = 28, gap2 = 30;
  let chosen = null;
  const note = String(payload.note || "").trim();
  search:
  for (const titleSize of titleSizes) {
    const t = fitText((size, s) => measure(font.serif(size, 500), s), payload.title, { sizes: [titleSize], maxWidth: inner, maxLines: titleLines });
    if (t.lines.length > titleLines) continue;
    for (const noteSize of noteSizes) {
      const n = note ? fitText((size, s) => measure(font.sans(size, 400), s), note, { sizes: [noteSize], maxWidth: inner, maxLines: noteMax }) : { size: noteSize, lines: [] };
      const titleLH = Math.round(t.size * 0.98), noteLH = Math.round(n.size * 1.42);
      const total = labelH + gap1 + t.lines.length * titleLH + (n.lines.length ? gap2 + n.lines.length * noteLH : 0);
      const topY = bottom - total;
      if (topY >= minTop) { chosen = { t, n, titleLH, noteLH, topY, total }; break search; }
    }
  }
  if (!chosen) { // last resort: smallest sizes, shortest note
    const t = fitText((size, s) => measure(font.serif(size, 500), s), payload.title, { sizes: [titleSizes[titleSizes.length - 1]], maxWidth: inner, maxLines: 2 });
    const n = note ? fitText((size, s) => measure(font.sans(size, 400), s), note, { sizes: [noteSizes[noteSizes.length - 1]], maxWidth: inner, maxLines: 1 }) : { size: 26, lines: [] };
    const titleLH = Math.round(t.size * 0.98), noteLH = Math.round(n.size * 1.42);
    const total = labelH + gap1 + t.lines.length * titleLH + (n.lines.length ? gap2 + n.lines.length * noteLH : 0);
    chosen = { t, n, titleLH, noteLH, topY: bottom - total, total };
  }
  const { t, n, titleLH, noteLH, topY } = chosen;
  const titleTop = topY + labelH + gap1;
  const noteTop = titleTop + t.lines.length * titleLH + (n.lines.length ? gap2 : 0);
  layout.main = {
    top: topY,
    bottom,
    minTop,
    label: { text: full ? "ВЕЧЕР ПО ГЛАВАМ" : "ОСВОБОДИ ВЕЧЕР. У МЕНЯ ЕСТЬ ПЛАН.", x: M, y: topY + 20 },
    title: { size: t.size, lines: t.lines, x: M, y: Math.round(titleTop + t.size * 0.8), lh: titleLH, top: titleTop, bottom: titleTop + t.lines.length * titleLH },
    note: { size: n.size, lines: n.lines, x: M, y: Math.round(noteTop + n.size * 0.95), lh: noteLH, top: noteTop, bottom: noteTop + n.lines.length * noteLH }
  };

  // footer
  layout.footer = {
    lineY: footerLine,
    leftX: M, rightX: 620,
    labelY: 1245, valueY: 1298,
    duration: payload.duration,
    planLabel: full ? CHAPTER_WORD(payload.itemCount) : "сюрприз"
  };
  return layout;
}

// ---------- Drawing (takes any CanvasRenderingContext2D) ----------
function coverDraw(ctx, img, W, H) {
  const scale = Math.max(W / img.width, H / img.height), w = img.width * scale, h = img.height * scale;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}
export function drawPostcard(ctx, payload, { photo = null } = {}) {
  const W = POSTCARD.width, H = POSTCARD.height, pal = PALETTES[payload.theme] || PALETTES.warm;
  const measure = (f, s) => { ctx.font = f; return ctx.measureText(s).width; };
  const L = postcardLayout(measure, payload);
  const text = (value, x, y, f, fill, align = "left", spacing = "0px") => {
    ctx.font = f; ctx.fillStyle = fill; ctx.textAlign = align; ctx.textBaseline = "alphabetic";
    if ("letterSpacing" in ctx) ctx.letterSpacing = spacing;
    ctx.fillText(value, x, y);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  };

  // background: opaque, full bleed
  if (payload.theme === "minimal") {
    ctx.fillStyle = "#efe6da"; ctx.fillRect(0, 0, W, H);
  } else {
    const base = ctx.createLinearGradient(0, 0, W, H);
    if (payload.theme === "night") { base.addColorStop(0, "#080912"); base.addColorStop(.52, "#171a29"); base.addColorStop(1, "#29344a"); }
    else { base.addColorStop(0, "#1a0e0c"); base.addColorStop(.52, "#4f1d18"); base.addColorStop(1, "#8b3422"); }
    ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
    if (photo) {
      coverDraw(ctx, photo, W, H);
      const shade = ctx.createLinearGradient(0, 0, 0, H);
      shade.addColorStop(0, "rgba(9,7,6,.34)"); shade.addColorStop(.4, "rgba(9,7,6,.5)"); shade.addColorStop(1, "rgba(9,7,6,.88)");
      ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H);
    }
    const glow = ctx.createRadialGradient(W * .78, H * .15, 0, W * .78, H * .15, 330);
    glow.addColorStop(0, payload.theme === "night" ? "rgba(119,113,215,.30)" : "rgba(235,142,79,.40)"); glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    const floor = ctx.createLinearGradient(0, H * .35, 0, H);
    floor.addColorStop(0, "rgba(0,0,0,0)"); floor.addColorStop(1, "rgba(0,0,0,.4)");
    ctx.fillStyle = floor; ctx.fillRect(0, H * .35, W, H * .65);
  }

  // header
  text("1001 DATES", L.margin, L.top.y, font.sans(28, 700), pal.text, "left", "3px");
  text(`№ ${payload.no}`, W - L.margin, L.top.y, font.sans(28, 500), pal.muted, "right", "1px");
  // date
  text(L.day.text, L.day.x, L.day.y, font.serif(L.day.size, 500), pal.accent);
  text(L.month.text, L.month.x, L.month.y, font.sans(L.month.size, 700), pal.text);
  text(L.time.text, L.time.x, L.time.y, font.sans(L.time.size, 500), pal.muted, "left", "2px");
  // plan
  if (L.plan) {
    text("ПЛАН ВЕЧЕРА", L.margin, L.plan.labelY, font.sans(24, 700), pal.muted, "left", "3px");
    for (const row of L.plan.rows) {
      text(row.no, L.plan.noX, row.y, font.serif(38, 500), pal.accent);
      text(row.title, L.plan.titleX, row.y, font.sans(28, 600), pal.text);
    }
  }
  // title and note
  text(L.main.label.text, L.main.label.x, L.main.label.y, font.sans(22, 700), pal.muted, "left", "2.5px");
  L.main.title.lines.forEach((line, i) => text(line, L.main.title.x, L.main.title.y + i * L.main.title.lh, font.serif(L.main.title.size, 500), pal.text));
  L.main.note.lines.forEach((line, i) => text(line, L.main.note.x, L.main.note.y + i * L.main.note.lh, font.sans(L.main.note.size, 400), pal.muted));
  // footer
  ctx.strokeStyle = pal.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(L.margin, L.footer.lineY); ctx.lineTo(W - L.margin, L.footer.lineY); ctx.stroke();
  text("ДЛИТЕЛЬНОСТЬ", L.footer.leftX, L.footer.labelY, font.sans(20, 600), pal.muted, "left", "2px");
  text(L.footer.duration, L.footer.leftX, L.footer.valueY, font.serif(46, 500), pal.text);
  text("ПЛАН", L.footer.rightX, L.footer.labelY, font.sans(20, 600), pal.muted, "left", "2px");
  text(L.footer.planLabel, L.footer.rightX, L.footer.valueY, font.serif(46, 500), pal.text);
  return L;
}
