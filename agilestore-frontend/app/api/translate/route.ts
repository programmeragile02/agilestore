export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

/**
 * Robust translate API:
 * - Primary: Gemini (v1 untuk model 2.x, v1beta untuk 1.x)
 * - Fallback 1: LibreTranslate (beberapa mirror publik)
 * - Fallback 2: Google Translate (unofficial endpoint)
 * - Circuit breaker bila Gemini kena 429/RESOURCE_EXHAUSTED
 */

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

// ====== CONFIG ======
const ENGINE = (process.env.TRANSLATE_ENGINE || "auto").toLowerCase(); // auto | gemini | libre | google
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const LT_ENDPOINTS = [
  "https://libretranslate.com/translate",
  "https://translate.astian.org/translate",
  "https://libretranslate.de/translate",
];

// Circuit breaker (hindari spam ke Gemini saat quota habis)
let geminiBlockedUntil = 0; // epoch ms

// ====== HELPERS ======
function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function cleanText(s: string) {
  if (!s) return "";
  let out = s
    .trim()
    .replace(/^```(?:json|text|markdown)?\n?/, "")
    .replace(/```$/, "")
    .trim();
  if (
    (out.startsWith('"') && out.endsWith('"')) ||
    (out.startsWith("'") && out.endsWith("'"))
  ) {
    out = out.slice(1, -1);
  }
  return out.trim();
}

function buildPromptBatch(
  items: string[],
  target: Lang,
  source?: Lang,
  format: Format = "text"
) {
  const tgtName = target === "en" ? "English" : "Indonesian";
  const srcLine = source
    ? `Source language: ${source === "en" ? "English" : "Indonesian"}.\n`
    : "Auto-detect source language.\n";
  const fmtLine =
    format === "html"
      ? "Input may contain HTML. Translate visible text only; keep tags/attributes unchanged.\n"
      : "Treat input as plain text/Markdown. Keep URLs, code blocks, placeholders ({{name}}, %s), and emoji.\n";
  const SEP = "<<<__SPLIT__>>>";

  const joined = items.join(`\n${SEP}\n`);
  return {
    text:
      "You are a precise translation engine.\n" +
      srcLine +
      fmtLine +
      `Translate each segment to ${tgtName}.\n` +
      `Segments are separated by "${SEP}".\n` +
      `Return the translations in the same order, joined by the same separator "${SEP}".\n` +
      "Do not add numbering, quotes, or explanations.\n\n" +
      "INPUT:\n" +
      joined +
      "\n\nOUTPUT:",
    sep: SEP,
  };
}

// ====== PROVIDERS ======
async function geminiBatch(
  items: string[],
  target: Lang,
  source?: Lang,
  format: Format = "text"
): Promise<string[]> {
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY missing");

  // Circuit breaker: jika masih diblokir, lempar error khusus
  if (Date.now() < geminiBlockedUntil) {
    throw new Error("GeminiCircuitOpen");
  }

  const { text, sep } = buildPromptBatch(items, target, source, format);
  const version = GEMINI_MODEL.startsWith("gemini-2") ? "v1" : "v1beta";
  const url = `https://generativelanguage.googleapis.com/${version}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
    }),
  });

  if (res.status === 429) {
    // Kuota/Rate limit — aktifkan circuit breaker
    const body = await res.text().catch(() => "");
    // Cari retryDelay "XXs" → fallback gunakan 1 jam kalau tak ketemu
    const retryMatch = body.match(/"retryDelay"\s*:\s*"(\d+)s?"/i);
    const delaySecs = retryMatch ? parseInt(retryMatch[1], 10) : 60 * 60;
    geminiBlockedUntil =
      Date.now() + Math.min(Math.max(delaySecs, 40), 3600) * 1000;
    console.warn(
      `[translate] Gemini quota exceeded. Circuit open for ~${Math.round(
        (geminiBlockedUntil - Date.now()) / 1000
      )}s`
    );
    throw new Error("GeminiQuotaExceeded");
  }

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${msg}`);
  }

  const json = await res.json().catch(() => ({}));
  let raw =
    json?.candidates?.[0]?.content?.parts?.[0]?.text ??
    json?.candidates?.[0]?.content?.parts?.[0]?.generatedText ??
    "";
  if (!raw) throw new Error("Empty response");
  raw = cleanText(raw);

  // JSON array pattern
  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length === items.length) {
        return arr.map((x: any) => cleanText(String(x ?? "")) || "");
      }
    } catch {}
  }

  // Delimiter split
  const splits = raw.split(sep).map((s: string) => cleanText(s));
  if (splits.length !== items.length) {
    // Partial — jangan gagal total; isi yang kosong pakai original
    return items.map((s, i) => splits[i] ?? s);
  }
  return splits;
}

async function libreBatch(items: string[], target: Lang, source?: Lang) {
  const out: string[] = [];
  for (const text of items) {
    let translated = text;
    for (const url of LT_ENDPOINTS) {
      try {
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            q: text,
            source: source || "auto",
            target,
            format: "text",
          }),
        });
        if (!r.ok) throw new Error("LT not ok");
        const j = await r.json().catch(() => ({}));
        translated = (j?.translatedText || "").toString().trim() || text;
        break;
      } catch {
        // coba mirror berikutnya
        continue;
      }
    }
    out.push(translated);
    // jeda kecil biar ramah rate-limit publik
    await new Promise((s) => setTimeout(s, 50));
  }
  return out;
}

async function googleUnofficialBatch(
  items: string[],
  target: Lang,
  source?: Lang
) {
  // WARNING: unofficial endpoint; gunakan terakhir sebagai fallback
  const out: string[] = [];
  for (const text of items) {
    try {
      const url =
        "https://translate.googleapis.com/translate_a/single?" +
        new URLSearchParams({
          client: "gtx",
          sl: source || "auto",
          tl: target,
          dt: "t",
          q: text,
        }).toString();

      const r = await fetch(url, { method: "GET" });
      if (!r.ok) throw new Error("google unofficial not ok");
      const j = await r.json();
      // Format: [[["translated","source",null,null, ... ]], ...]
      const translated = (
        j?.[0]?.map((seg: any) => seg?.[0] || "").join("") || ""
      ).trim();
      out.push(translated || text);
    } catch {
      out.push(text);
    }
    await new Promise((s) => setTimeout(s, 45));
  }
  return out;
}

// Orkestrator per batch unik
async function translateBatch(
  items: string[],
  target: Lang,
  source?: Lang,
  format: Format = "text"
): Promise<string[]> {
  // Force provider via env
  if (ENGINE === "gemini") return geminiBatch(items, target, source, format);
  if (ENGINE === "libre") return libreBatch(items, target, source);
  if (ENGINE === "google") return googleUnofficialBatch(items, target, source);

  // AUTO chain: Gemini → Libre → Google (unofficial)
  try {
    return await geminiBatch(items, target, source, format);
  } catch (err: any) {
    const msg = String(err?.message || "");
    if (msg.includes("GeminiCircuitOpen") || msg.includes("Quota")) {
      console.log("[translate] Gemini quota/circuit — using Libre");
    } else {
      console.error("[translate] Gemini failed:", msg);
    }
    try {
      const lt = await libreBatch(items, target, source);
      return lt;
    } catch (e) {
      console.error("[translate] Libre failed, fallback to Google unofficial");
      const g = await googleUnofficialBatch(items, target, source);
      return g;
    }
  }
}

// ====== HANDLER ======
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Payload | null;
    if (!body) return bad("Invalid request body");

    const target: Lang =
      (body as any).target ??
      ((["id", "en"].includes((body as any).targetLanguage)
        ? (body as any).targetLanguage
        : "en") as Lang);

    if (target !== "id" && target !== "en")
      return bad("Field 'target'/'targetLanguage' must be 'id' or 'en'");

    const source: Lang | undefined = ["id", "en"].includes((body as any).source)
      ? ((body as any).source as Lang)
      : undefined;

    const format: Format = (body as any).format === "html" ? "html" : "text";

    let items: string[] = [];
    if (Array.isArray((body as any).texts)) {
      items = (body as any).texts.filter((s: any) => typeof s === "string");
    } else if (typeof (body as any).text === "string") {
      items = [(body as any).text];
    }
    items = items.map((s) => (s ?? "").toString().trim()).filter(Boolean);
    if (!items.length)
      return bad("Provide 'text' (string) or 'texts' (string[])");

    // Dedup → translate uniq → remap
    const uniq = Array.from(new Set(items));
    const translatedUniq = await translateBatch(uniq, target, source, format);
    const map = new Map<string, string>();
    uniq.forEach((u, i) => map.set(u, translatedUniq[i] ?? u));
    const results = items.map((s) => map.get(s) ?? s);

    return NextResponse.json({ ok: true, data: results });
  } catch (e: any) {
    console.error("[translate] fatal:", e);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
