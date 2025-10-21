// lib/auto-translate.ts
export type Target = "id" | "en";
export type Source = "id" | "en";
type Format = "text" | "html";

type CacheLayer = {
  get(key: string): string | null;
  set(key: string, val: string): void;
};

const mem = new Map<string, string>();

const ls: CacheLayer = {
  get(key) {
    try {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, val) {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem(key, val);
    } catch {}
  },
};

function djb2(str: string) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return (h >>> 0).toString(36);
}

const CACHE_VERSION = "v2";
const keyOf = (s: string, src: Source, tgt: Target, fmt: Format) =>
  `lt:${CACHE_VERSION}:${fmt}:${src}->${tgt}:${djb2(s)}`;

async function callTranslateAPI(
  texts: string[],
  target: Target,
  source?: Source,
  format: Format = "text"
): Promise<string[]> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts, target, source, format }),
  });
  if (!res.ok) throw new Error("translate failed");
  const json = await res.json().catch(() => null);
  const outs = json?.data;
  if (!Array.isArray(outs) || outs.length !== texts.length) {
    // mismatch → kembalikan input apa adanya agar aman
    return texts.slice();
  }
  return outs as string[];
}

export async function translateBatchCached(
  texts: string[],
  target: Target,
  format: Format = "text",
  source: Source = "id"
) {
  const normalized = texts.map((s) => (s ?? "").toString());
  const unique = Array.from(new Set(normalized.filter(Boolean)));

  const result = new Map<string, string>();
  const need: string[] = [];

  for (const s of unique) {
    const k = keyOf(s, source, target, format);
    const vMem = mem.get(k);
    if (vMem) {
      result.set(s, vMem);
      continue;
    }
    const vLS = ls.get(k);
    if (vLS) {
      result.set(s, vLS);
      mem.set(k, vLS);
      continue;
    }
    need.push(s);
  }

  if (need.length) {
    const CHUNK = 20; // lebih hemat kuota; granular saat fallback
    for (let i = 0; i < need.length; i += CHUNK) {
      const part = need.slice(i, i + CHUNK);
      let outs: string[] = [];
      try {
        outs = await callTranslateAPI(part, target, source, format);
      } catch {
        outs = part.slice(); // jangan cache jika gagal
      }

      part.forEach((orig, idx) => {
        const tr = outs[idx];
        if (typeof tr === "string" && tr.trim() && tr !== orig) {
          result.set(orig, tr);
          const k = keyOf(orig, source, target, format);
          mem.set(k, tr);
          ls.set(k, tr);
        } else {
          result.set(orig, orig);
        }
      });

      if (need.length > CHUNK) await new Promise((s) => setTimeout(s, 35));
    }
  }

  return result;
}
