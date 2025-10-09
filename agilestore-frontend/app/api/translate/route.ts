// // app/api/translate/route.ts
// import { NextRequest, NextResponse } from "next/server";

// const LT_PRIMARY = "https://libretranslate.com/translate";
// const LT_MIRROR = "https://translate.astian.org/translate";
// const SUPPORTED = new Set(["id", "en"]);

// type Body = {
//   texts: string[];
//   target: "id" | "en";
//   source?: "id" | "en";
//   format?: "text" | "html";
// };

// function protectPlaceholders(s: string) {
//   return s
//     .replace(
//       /:[a-zA-Z_]\w*/g,
//       (m) => `__PH__${Buffer.from(m).toString("base64")}__`
//     )
//     .replace(
//       /\{\{.*?\}\}/g,
//       (m) => `__PH__${Buffer.from(m).toString("base64")}__`
//     )
//     .replace(
//       /\{[^{}]+\}/g,
//       (m) => `__PH__${Buffer.from(m).toString("base64")}__`
//     )
//     .replace(/%[sd]/g, (m) => `__PH__${Buffer.from(m).toString("base64")}__`);
// }
// function restorePlaceholders(s: string) {
//   return s.replace(/__PH__([A-Za-z0-9+/=]+)__/g, (_, b64) =>
//     Buffer.from(b64, "base64").toString("utf8")
//   );
// }

// async function ltTranslate(
//   q: string,
//   source: string,
//   target: string,
//   format: "text" | "html"
// ) {
//   const payload = { q, source, target, format };
//   const fetcher = async (url: string) => {
//     const res = await fetch(url, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//       // jika perlu, kamu bisa tambah timeout AbortController di sini
//     });
//     if (!res.ok) throw new Error(await res.text());
//     const json = await res.json();
//     return json.translatedText as string;
//   };

//   try {
//     return await fetcher(LT_PRIMARY);
//   } catch {
//     return await fetcher(LT_MIRROR);
//   }
// }

// export async function POST(req: NextRequest) {
//   const { texts, target, source, format = "text" } = (await req.json()) as Body;

//   if (!Array.isArray(texts) || texts.length === 0) {
//     return NextResponse.json({ error: "texts required" }, { status: 400 });
//   }

//   const tgt = SUPPORTED.has(target) ? target : "en";
//   const src = source && SUPPORTED.has(source) ? source : "id";

//   const protectedTexts = texts.map((t) => (t ?? "").toString());
//   const mapProt = protectedTexts.map(protectPlaceholders);

//   const concurrency = 8;
//   const results: string[] = new Array(mapProt.length);

//   let i = 0;
//   const tasks = new Array(Math.min(concurrency, mapProt.length))
//     .fill(0)
//     .map(async () => {
//       while (i < mapProt.length) {
//         const idx = i++;
//         const original = protectedTexts[idx].trim();
//         if (!original) {
//           results[idx] = "";
//           continue;
//         }
//         try {
//           const translated = await ltTranslate(mapProt[idx], src, tgt, format);
//           results[idx] = restorePlaceholders(translated);
//         } catch {
//           results[idx] = protectedTexts[idx]; // fallback: pakai sumber
//         }
//       }
//     });

//   await Promise.all(tasks);
//   return NextResponse.json({ data: results });
// }

// app/api/translate/route.ts
// app/api/translate/route.ts
// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// import { type NextRequest, NextResponse } from "next/server";

// type Lang = "id" | "en";
// type Format = "text" | "html";

// type Payload =
//   | {
//       text: string;
//       targetLanguage?: string;
//       target?: Lang;
//       source?: Lang;
//       format?: Format;
//     }
//   | {
//       texts: string[];
//       targetLanguage?: string;
//       target?: Lang;
//       source?: Lang;
//       format?: Format;
//     };

// // ====== Config ======
// const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
// const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;
// const GEMINI_KEY = process.env.GEMINI_API_KEY || ""; // jangan hardcode di file

// const LT_ENDPOINTS = [
//   "https://libretranslate.com/translate",
//   "https://translate.astian.org/translate",
//   "https://libretranslate.de/translate",
// ];

// // ====== Helpers ======
// function bad(message: string, status = 400, extra: any = {}) {
//   return NextResponse.json({ ok: false, error: message, ...extra }, { status });
// }

// function buildPrompt(
//   input: string,
//   target: Lang,
//   source?: Lang,
//   format: Format = "text"
// ) {
//   const tgtName = target === "en" ? "English" : "Indonesian";
//   const srcLine = source
//     ? `Source language: ${source === "en" ? "English" : "Indonesian"}.\n`
//     : "Auto-detect source language.\n";
//   const fmtLine =
//     format === "html"
//       ? "Treat input as HTML. Translate only human-visible text. Keep tags/attributes/inline styles unchanged.\n"
//       : "Treat input as plain text/Markdown. Keep code blocks, URLs, emoji, placeholders ({{name}}, %s, {amount}) intact.\n";

//   return (
//     "You are a precise translation engine.\n" +
//     srcLine +
//     fmtLine +
//     `Translate to ${tgtName}.\n` +
//     "Return ONLY the translation, no quotes, no extra text.\n\n" +
//     "INPUT:\n" +
//     input +
//     "\n\nOUTPUT:"
//   );
// }

// async function translateGemini(
//   input: string,
//   target: Lang,
//   source?: Lang,
//   format: Format = "text"
// ) {
//   if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY missing");
//   const prompt = buildPrompt(input, target, source, format);

//   const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       contents: [{ role: "user", parts: [{ text: prompt }] }],
//       generationConfig: {
//         temperature: 0.1,
//         maxOutputTokens: 400,
//         topP: 0.8,
//         topK: 10,
//       },
//     }),
//   });

//   if (!res.ok) {
//     const txt = await res.text().catch(() => "");
//     throw new Error(`Gemini HTTP ${res.status}: ${txt || "Unknown error"}`);
//   }

//   const data = await res.json().catch(() => ({}));
//   let out: string | undefined =
//     data?.candidates?.[0]?.content?.parts?.[0]?.text ??
//     data?.candidates?.[0]?.content?.parts?.[0]?.generatedText;

//   if (typeof out !== "string") out = "";

//   // bersihkan kemungkinan code fences
//   out = out
//     .trim()
//     .replace(/^```(?:\w+)?\n?/, "")
//     .replace(/```$/, "")
//     .trim();

//   // buang kutip pembungkus
//   if (
//     (out.startsWith('"') && out.endsWith('"')) ||
//     (out.startsWith("'") && out.endsWith("'"))
//   ) {
//     out = out.slice(1, -1).trim();
//   }

//   return out.length ? out : input;
// }

// async function translateLibre(input: string, target: Lang, source?: Lang) {
//   for (const url of LT_ENDPOINTS) {
//     try {
//       const r = await fetch(url, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           q: input,
//           source: source || "auto",
//           target,
//           format: "text",
//         }),
//       });
//       if (!r.ok) throw new Error("LT not ok");
//       const j = await r.json();
//       const tr = (j?.translatedText || "").toString().trim();
//       if (tr) return tr;
//     } catch {
//       // coba mirror berikutnya
//     }
//   }
//   return input; // gagal semua → kembalikan input
// }

// async function translateOne(
//   input: string,
//   target: Lang,
//   source?: Lang,
//   format: Format = "text"
// ) {
//   try {
//     return await translateGemini(input, target, source, format);
//   } catch (e) {
//     console.error("[translate] Gemini fail:", (e as any)?.message || e);
//     try {
//       return await translateLibre(input, target, source);
//     } catch (e2) {
//       console.error("[translate] Libre fail:", (e2 as any)?.message || e2);
//       return input;
//     }
//   }
// }

// // throttle promise concurrency
// async function mapWithConcurrency<T, R>(
//   list: T[],
//   limit: number,
//   worker: (item: T, idx: number) => Promise<R>
// ): Promise<R[]> {
//   const out: R[] = new Array(list.length);
//   let i = 0;
//   const workers: Promise<void>[] = [];
//   const run = async () => {
//     while (i < list.length) {
//       const idx = i++;
//       out[idx] = await worker(list[idx], idx);
//     }
//   };
//   for (let c = 0; c < Math.min(limit, list.length); c++) workers.push(run());
//   await Promise.all(workers);
//   return out;
// }

// // ====== Handler ======
// export async function POST(request: NextRequest) {
//   try {
//     const body = (await request.json().catch(() => null)) as Payload | null;
//     if (!body) return bad("Invalid request body");

//     const target: Lang =
//       (body as any).target ??
//       (((body as any).targetLanguage === "en" ||
//       (body as any).targetLanguage === "id"
//         ? (body as any).targetLanguage
//         : undefined) as Lang) ??
//       "en";
//     if (target !== "id" && target !== "en")
//       return bad("Field 'target'/'targetLanguage' must be 'id' or 'en'");

//     const source: Lang | undefined =
//       (body as any).source === "id" || (body as any).source === "en"
//         ? ((body as any).source as Lang)
//         : undefined;

//     const format: Format = (body as any).format === "html" ? "html" : "text";

//     let items: string[] = [];
//     if (Array.isArray((body as any).texts))
//       items = (body as any).texts.filter((s: any) => typeof s === "string");
//     else if (typeof (body as any).text === "string")
//       items = [(body as any).text];

//     items = items.map((s) => (s ?? "").toString().trim()).filter(Boolean);
//     if (!items.length)
//       return bad("Provide 'text' (string) or 'texts' (string[])");

//     // dedup untuk efisiensi
//     const uniq = Array.from(new Set(items));
//     const translatedUniq = await mapWithConcurrency(
//       uniq,
//       4, // concurrency
//       (txt) => translateOne(txt, target, source, format)
//     );

//     // remap ke urutan asli
//     const map = new Map<string, string>();
//     uniq.forEach((u, i) => map.set(u, translatedUniq[i] ?? u));
//     const results = items.map((s) => map.get(s) ?? s);

//     return NextResponse.json({ ok: true, data: results });
//   } catch (e: any) {
//     console.error("[translate] fatal:", e);
//     // fallback aman: kembalikan input kalau ada
//     try {
//       const body = await request.clone().json();
//       const items: string[] = Array.isArray(body?.texts)
//         ? body.texts
//         : typeof body?.text === "string"
//         ? [body.text]
//         : [];
//       if (items.length) return NextResponse.json({ ok: true, data: items });
//     } catch {}
//     return NextResponse.json(
//       { ok: false, error: "Internal error" },
//       { status: 500 }
//     );
//   }
// }

// app/api/translate/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

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

// ===== Config =====
const ENGINE = (process.env.TRANSLATE_ENGINE || "auto").toLowerCase(); // auto | gemini | libre
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL, // hormati env kalau ada
  "gemini-2.5-flash-8b", // ringan & umumnya tersedia
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash-latest", // via v1beta (fallback)
].filter(Boolean) as string[];
const API_VERSIONS: Array<"v1" | "v1beta"> = ["v1", "v1beta"];

const LT_ENDPOINTS = [
  "https://libretranslate.com/translate",
  "https://translate.astian.org/translate",
  "https://libretranslate.de/translate",
];

// ===== Helpers =====
function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
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
      ? "Input may contain HTML. Translate visible text only; keep tags/attributes/styles unchanged.\n"
      : "Treat as plain text/Markdown. Keep code blocks, URLs, emoji, placeholders ({{name}}, %s, {amount}).\n";

  // Kita pakai delimiter yang jarang dipakai agar bisa split aman
  const SEP = "<<<__SPLIT__>>>";
  const joined = items.join(`\n${SEP}\n`);

  return {
    text:
      "You are a precise translation engine.\n" +
      srcLine +
      fmtLine +
      `Translate each segment to ${tgtName}.\n` +
      `Segments are separated by the line "${SEP}".\n` +
      `Return the translations in the same order, joined by the same separator "${SEP}".\n` +
      "Do not add numbering or quotes.\n\n" +
      "INPUT:\n" +
      joined +
      "\n\nOUTPUT:",
    sep: SEP,
  };
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

// ===== Translators =====
async function geminiBatch(
  items: string[],
  target: Lang,
  source?: Lang,
  format: Format = "text"
) {
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY missing");
  const { text, sep } = buildPromptBatch(items, target, source, format);

  let lastErr: any = null;
  for (const ver of API_VERSIONS) {
    for (const model of CANDIDATE_MODELS) {
      const url = `https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent?key=${GEMINI_KEY}`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 8192,
              topP: 0.8,
              topK: 10,
            },
          }),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          // status 404 (model tak tersedia) / 429 (rate limit) => coba kandidat lain atau fallback
          lastErr = new Error(`[${ver}/${model}] ${res.status}: ${body}`);
          continue;
        }

        const json = await res.json().catch(() => ({}));
        const raw =
          json?.candidates?.[0]?.content?.parts?.[0]?.text ??
          json?.candidates?.[0]?.content?.parts?.[0]?.generatedText ??
          "";
        const cleaned = cleanText(raw);
        if (!cleaned) throw new Error("Empty response");

        const splits = cleaned.split(sep).map((s: string) => cleanText(s));
        // Jika jumlah tidak match, anggap gagal supaya fallback
        if (splits.length !== items.length)
          throw new Error("Mismatch split count");
        return splits;
      } catch (e) {
        lastErr = e;
        continue;
      }
    }
  }
  throw lastErr || new Error("All Gemini candidates failed");
}

async function libreBatch(items: string[], target: Lang, source?: Lang) {
  // Libre tidak support batch -> lakukan serial ringan
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
        const j = await r.json();
        translated = (j?.translatedText || "").toString().trim() || text;
        break;
      } catch {
        // coba mirror berikutnya
      }
    }
    out.push(translated);
    // kecilkan kecepatan supaya ramah rate-limit publik
    await new Promise((s) => setTimeout(s, 35));
  }
  return out;
}

async function translateBatch(
  items: string[],
  target: Lang,
  source?: Lang,
  format: Format = "text"
) {
  if (ENGINE === "libre") return libreBatch(items, target, source);
  if (ENGINE === "gemini") return geminiBatch(items, target, source, format);

  // AUTO: coba Gemini dulu, jika 404/429/5xx ⇒ Libre
  try {
    return await geminiBatch(items, target, source, format);
  } catch (e) {
    console.error("[translate] Gemini batch fail:", (e as any)?.message || e);
    return await libreBatch(items, target, source);
  }
}

// ===== Handler =====
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

    items = items.map((s) => (s ?? "").toString().trim()).filter(Boolean);
    if (!items.length)
      return bad("Provide 'text' (string) or 'texts' (string[])");

    // dedup → batch translate → remap ke urutan asli
    const uniq = Array.from(new Set(items));
    const translatedUniq = await translateBatch(uniq, target, source, format);
    const map = new Map<string, string>();
    uniq.forEach((u, i) => map.set(u, translatedUniq[i] ?? u));
    const results = items.map((s) => map.get(s) ?? s);

    return NextResponse.json({ ok: true, data: results });
  } catch (e: any) {
    console.error("[translate] fatal:", e);
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
