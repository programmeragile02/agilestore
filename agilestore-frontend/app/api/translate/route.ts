// app/api/translate/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

/** ===== Types ===== */
type Lang = "id" | "en";
type Format = "text" | "html";
type Payload =
  | {
      text: string;
      targetLanguage?: string;
      target?: Lang;
      source?: Lang;
      format?: Format;
    }
  | {
      texts: string[];
      targetLanguage?: string;
      target?: Lang;
      source?: Lang;
      format?: Format;
    };

/** ===== Config =====
 * ENGINE = auto | gemini | libre
 * GEMINI_API_KEY harus diset jika ingin Gemini.
 */
const ENGINE = (process.env.TRANSLATE_ENGINE || "auto").toLowerCase();
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

/** Normalisasi nama model ENV agar tidak pakai "-latest", dan hanya yang valid */
function normalizeModel(m?: string | null) {
  const s = (m || "").trim();
  if (!s) return "";
  // hilangkan suffix -latest atau versi yang tidak didukung
  const base = s.replace(/-latest$/i, "");
  // daftar yang kita izinkan
  const allowed = new Set(["gemini-1.5-flash", "gemini-1.5-flash-8b"]);
  return allowed.has(base) ? base : "";
}

// Urutan kandidat model yang stabil (ENV disanitasi lalu fallback ke default)
const CANDIDATE_MODELS: string[] = [
  normalizeModel(process.env.GEMINI_MODEL),
  "gemini-1.5-flash", // paling umum tersedia
  "gemini-1.5-flash-8b",
].filter(Boolean);

// Kunci versi API ke v1 saja (hindari v1beta yang sering 404 untuk flash)
const API_VERSION: "v1" = "v1";

// Mirror LibreTranslate publik (tanpa kunci) — best-effort
const LT_ENDPOINTS = [
  "https://libretranslate.com/translate",
  "https://translate.astian.org/translate",
  "https://libretranslate.de/translate",
];

/** ===== Utils ===== */
function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function clampLen(s: string) {
  const MAX = 10_000;
  s = String(s ?? "");
  return s.length > MAX ? s.slice(0, MAX) : s;
}

function cleanText(s: string) {
  let out = (s || "")
    .trim()
    .replace(/^```(?:json|text|markdown)?\n?/, "")
    .replace(/```$/, "")
    .trim();
  if (
    (out.startsWith('"') && out.endsWith('"')) ||
    (out.startsWith("'") && out.endsWith("'"))
  ) {
    out = out.slice(1, -1).trim();
  }
  return out;
}

/** fetch dengan timeout (benar-benar meng-abort request) */
async function fetchWithTimeout(
  url: string,
  opts: RequestInit = {},
  ms = 25000
) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

/** ===== Prompt builder (JSON mode) ===== */
function buildJsonPrompt(
  items: string[],
  target: Lang,
  source?: Lang,
  format: Format = "text"
) {
  const tgtName = target === "en" ? "English" : "Indonesian";
  const srcLine = source
    ? `Source language is ${source === "en" ? "English" : "Indonesian"}.`
    : "Source language may vary; auto-detect it per segment.";
  const fmtLine =
    format === "html"
      ? "Input may contain HTML. Translate visible text only; keep tags/attributes/styles unchanged."
      : "Treat as plain text/Markdown. Preserve code blocks, URLs, emoji, and placeholders like {{name}}, %s, {amount}.";

  const instructions = [
    "You are a precise translation engine.",
    srcLine,
    fmtLine,
    `Translate each input segment into ${tgtName}.`,
    "Return ONLY a valid JSON array of strings, same length and order as inputs.",
    "Do not add explanations, comments, or any extra text.",
  ].join(" ");

  const inputJson = JSON.stringify(items.map((s) => clampLen(s)));
  const prompt =
    `${instructions}\n\nINPUT_JSON:\n${inputJson}\n\n` + "OUTPUT_JSON:";
  return prompt;
}

/** ===== Gemini translator (JSON array output) ===== */
async function geminiBatchJSON(
  items: string[],
  target: Lang,
  source?: Lang,
  format: Format = "text"
) {
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY missing");

  const text = buildJsonPrompt(items, target, source, format);
  let lastErr: any = null;

  for (const model of CANDIDATE_MODELS) {
    const url = `https://generativelanguage.googleapis.com/${API_VERSION}/models/${model}:generateContent?key=${GEMINI_KEY}`;

    try {
      const res = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 8192,
              topP: 0.8,
              topK: 40,
              responseMimeType: "application/json",
            },
          }),
        },
        25000
      );

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        lastErr = new Error(`[${API_VERSION}/${model}] ${res.status}: ${body}`);
        // coba model lain
        continue;
      }

      const json = await res.json().catch(() => ({} as any));
      const raw =
        json?.candidates?.[0]?.content?.parts?.[0]?.text ??
        json?.candidates?.[0]?.content?.parts?.[0]?.generatedText ??
        "";

      const cleaned = cleanText(raw);

      // Parse ke JSON array
      let arr: unknown;
      try {
        arr = JSON.parse(cleaned);
      } catch {
        const m = cleaned.match(/\[[\s\S]*\]$/);
        if (m) arr = JSON.parse(m[0]);
        else throw new Error("Gemini output is not valid JSON");
      }

      if (!Array.isArray(arr)) throw new Error("Gemini output is not an array");

      const out = (arr as unknown[]).map((x) =>
        typeof x === "string" ? cleanText(x) : String(x ?? "")
      );

      if (out.length !== items.length) {
        throw new Error(
          `Gemini array length mismatch: got ${out.length}, want ${items.length}`
        );
      }

      return out.map((s, i) => (s.trim() ? s : items[i]));
    } catch (e) {
      lastErr = e;
      continue;
    }
  }

  throw lastErr || new Error("All Gemini candidates failed");
}

/** ===== LibreTranslate (serial, best-effort) ===== */
async function libreBatch(
  items: string[],
  target: Lang,
  source?: Lang,
  format: Format = "text"
) {
  const out: string[] = [];

  for (const text of items) {
    let translated = text;
    for (const url of LT_ENDPOINTS) {
      try {
        const r = await fetchWithTimeout(
          url,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              q: text,
              source: source || "auto",
              target,
              format: format === "html" ? "html" : "text",
            }),
          },
          10000
        );

        if (!r.ok) throw new Error(`LT not ok: ${r.status}`);
        const j = await r.json().catch(() => ({} as any));
        const t = (j?.translatedText || "").toString().trim();
        translated = t || text;
        break; // suksess salah satu mirror
      } catch {
        // coba mirror berikutnya
      }
    }
    out.push(translated);
    await new Promise((s) => setTimeout(s, 35)); // throttle ramah
  }

  return out;
}

/** ===== Orkestrator ===== */
async function translateBatch(
  items: string[],
  target: Lang,
  source?: Lang,
  format: Format = "text"
) {
  if (ENGINE === "libre") return libreBatch(items, target, source, format);
  if (ENGINE === "gemini")
    return geminiBatchJSON(items, target, source, format);

  // AUTO: coba Gemini dulu → kalau gagal, fallback ke Libre
  try {
    return await geminiBatchJSON(items, target, source, format);
  } catch (e) {
    console.warn("[translate] Gemini fallback to Libre");
    return await libreBatch(items, target, source, format);
  }
}

/** ===== Handler ===== */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Payload | null;
    if (!body) return bad("Invalid request body");

    const target: Lang =
      (body as any).target ??
      (((body as any).targetLanguage === "en" ||
      (body as any).targetLanguage === "id"
        ? (body as any).targetLanguage
        : undefined) as Lang) ??
      "en";
    if (target !== "id" && target !== "en")
      return bad("Field 'target'/'targetLanguage' must be 'id' or 'en'");

    const source: Lang | undefined =
      (body as any).source === "id" || (body as any).source === "en"
        ? ((body as any).source as Lang)
        : undefined;

    const format: Format = (body as any).format === "html" ? "html" : "text";

    let items: string[] = [];
    if (Array.isArray((body as any).texts))
      items = (body as any).texts.filter((s: any) => typeof s === "string");
    else if (typeof (body as any).text === "string")
      items = [(body as any).text];

    items = items
      .map((s) => clampLen((s ?? "").toString().trim()))
      .filter(Boolean);
    if (!items.length)
      return bad("Provide 'text' (string) or 'texts' (string[])");

    // de-dupe → translate → remap
    const uniq = Array.from(new Set(items));
    const translatedUniq = await translateBatch(uniq, target, source, format);

    while (translatedUniq.length < uniq.length) {
      translatedUniq.push(uniq[translatedUniq.length]);
    }

    const map = new Map<string, string>();
    uniq.forEach((u, i) => map.set(u, translatedUniq[i] ?? u));
    const results = items.map((s) => map.get(s) ?? s);

    return NextResponse.json({ ok: true, data: results });
  } catch (e: any) {
    console.error("[translate] fatal:", e?.message || e);
    // fallback aman: kembalikan input kalau ada
    try {
      const body = await request.clone().json();
      const items: string[] = Array.isArray(body?.texts)
        ? body.texts
        : typeof body?.text === "string"
        ? [body.text]
        : [];
      if (items.length) return NextResponse.json({ ok: true, data: items });
    } catch {}
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
