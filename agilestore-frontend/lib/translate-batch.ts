// lib/translate-batch.ts
// Utilitas translate batch dengan caching, batching, abort, progress, dan provider pluggable.
// Default provider diarahkan ke Laravel /api/translate-batch (paket stichoza di backend).

import { TRANSLATE_API } from "@/lib/api";

/* ============================================
 * Types
 * ==========================================*/

export type ProviderFn = (
  texts: string[],
  from: string,
  to: string,
  ctx?: { signal?: AbortSignal }
) => Promise<string[]>;

export type TranslateBatchOptions = {
  /** Bahasa sumber, default "en" */
  from?: string;
  /** Bahasa target, default "id" */
  to?: string;
  /** Ukuran batch panggilan provider, default 50 (dibatasi 1..200) */
  chunkSize?: number;
  /** Provider custom; jika tidak diisi → providerViaYourAPI (Laravel) */
  provider?: ProviderFn;
  /** Prefix kunci cache (mem/localStorage), default "lt" */
  cachePrefix?: string;
  /** AbortSignal untuk cancel, misal dari AbortController */
  signal?: AbortSignal;
  /** Callback progress: 0..1  */
  onProgress?: (progress: number) => void;
  /** Glossary opsional untuk konsistensi istilah (Laravel akan abaikan, aman) */
  glossary?: Record<string, string>;
};

/* ============================================
 * Cache helpers
 * ==========================================*/

const memCache = new Map<string, string>();

const makeKey = (prefix: string, from: string, to: string, text: string) =>
  `${prefix}:${from}->${to}:${text}`;

const hasWindow = typeof window !== "undefined";

const lsGet = (k: string): string | null => {
  if (!hasWindow) return null;
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
};

const lsSet = (k: string, v: string) => {
  if (!hasWindow) return;
  try {
    window.localStorage.setItem(k, v);
  } catch {
    // ignore quota/access errors
  }
};

/* ============================================
 * Default Provider: panggil endpoint Laravel /api/translate-batch
 * (stichoza di backend). Mendukung glossary: Laravel akan abaikan jika tidak dipakai.
 * ==========================================*/
async function providerViaYourAPIWithGlossary(
  texts: string[],
  from: string,
  to: string,
  glossary?: Record<string, string>,
  ctx?: { signal?: AbortSignal }
): Promise<string[]> {
  const resp = await fetch(TRANSLATE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // glossary ikut dikirim; Laravel versi stichoza akan abaikan (aman)
    body: JSON.stringify({ from, to, texts, glossary }),
    signal: ctx?.signal,
  });

  // Kalau server balas non-2xx → throw agar UI tahu ini gagal
  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(
      `Translate API ${resp.status}${
        errText ? ` - ${errText.slice(0, 400)}` : ""
      }`
    );
  }

  // Struktur sukses: { ok: true, data: string[] }
  const json = (await resp.json().catch(() => null)) as {
    ok?: boolean;
    data?: unknown;
    error?: unknown;
    message?: unknown;
  } | null;

  if (!json || json.ok === false) {
    const e = (json && (json.error || json.message)) || "Unknown error";
    throw new Error(String(e));
  }
  if (!Array.isArray(json?.data)) {
    throw new Error("Bad translate response (data is not an array)");
  }
  return (json.data as any[]).map((x) => String(x ?? ""));
}

// Back-compat untuk siapa pun yang pakai nama lama
export async function providerViaYourAPI(
  texts: string[],
  from: string,
  to: string,
  ctx?: { signal?: AbortSignal }
): Promise<string[]> {
  return providerViaYourAPIWithGlossary(texts, from, to, undefined, ctx);
}

/* ============================================
 * Fallback Provider (no-op) untuk testing/dev
 * ==========================================*/
export async function providerNoop(
  texts: string[],
  _from: string,
  _to: string
): Promise<string[]> {
  return texts.map((t) => String(t ?? ""));
}

/* ============================================
 * translateBatch — fungsi utama
 * ==========================================*/

/**
 * Menerjemahkan array string secara batch dengan caching & dedupe.
 * - Input dan output berukuran sama serta urutan sama.
 * - Secara default memanggil Laravel /api/translate-batch.
 */
export async function translateBatch(
  inputs: string[],
  opts: TranslateBatchOptions = {}
): Promise<string[]> {
  const from = opts.from ?? "en";
  const to = opts.to ?? "id";
  const chunkSize = Math.max(1, Math.min(200, opts.chunkSize ?? 200));
  const prefix = opts.cachePrefix ?? "lt-v2";

  // Default provider → Laravel + kirim glossary jika ada
  const provider: ProviderFn =
    opts.provider ??
    ((slice, f, t, ctx) =>
      providerViaYourAPIWithGlossary(slice, f, t, opts.glossary, ctx));

  // short-circuit
  if (!Array.isArray(inputs) || inputs.length === 0) return [];

  // dedupe untuk efisiensi
  const orderIndex: number[] = [];
  const uniqTexts: string[] = [];
  const seen = new Map<string, number>();
  for (const t of inputs) {
    const s = String(t ?? "");
    if (!seen.has(s)) {
      seen.set(s, uniqTexts.length);
      uniqTexts.push(s);
    }
    orderIndex.push(seen.get(s)!);
  }

  // tentukan mana yang sudah ada di cache
  const resolved = new Array<string>(uniqTexts.length);
  const pending: string[] = [];
  const pendingIdx: number[] = [];

  for (let i = 0; i < uniqTexts.length; i++) {
    const src = uniqTexts[i]!;
    const key = makeKey(prefix, from, to, src);

    // memory cache
    const m = memCache.get(key);
    if (m != null) {
      resolved[i] = m;
      continue;
    }
    // localStorage
    const l = lsGet(key);
    if (l != null) {
      resolved[i] = l;
      memCache.set(key, l);
      continue;
    }
    // jika belum ada di cache → pending
    pending.push(src);
    pendingIdx.push(i);
  }

  // translate pending dalam batch
  if (pending.length > 0) {
    for (let i = 0; i < pending.length; i += chunkSize) {
      // abort support
      if (opts.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      const slice = pending.slice(i, i + chunkSize);
      const out = await provider(slice, from, to, { signal: opts.signal });

      if (!Array.isArray(out) || out.length !== slice.length) {
        throw new Error(
          "Provider must return array with same length as input chunk."
        );
      }

      for (let j = 0; j < slice.length; j++) {
        const src = slice[j]!;
        const dst = String(out[j] ?? "");
        const ui = pendingIdx[i + j]!;
        resolved[ui] = dst;

        const k = makeKey(prefix, from, to, src);
        memCache.set(k, dst);
        lsSet(k, dst);
      }

      // progress callback
      if (typeof opts.onProgress === "function") {
        const done = Math.min(i + slice.length, pending.length);
        const p = done / pending.length;
        try {
          opts.onProgress(p);
        } catch {
          // ignore listener errors
        }
      }
    }
  }

  // rebuild sesuai urutan inputs
  return orderIndex.map((u) => resolved[u] ?? "");
}

/* ============================================
 * Convenience: clear caches (opsional)
 * ==========================================*/

/** Hapus seluruh cache in-memory (tidak menyentuh localStorage). */
export function clearTranslateMemoryCache() {
  memCache.clear();
}

/**
 * Hapus cache di localStorage untuk pasangan bahasa tertentu.
 * WARNING: Operasi linear terhadap ukuran localStorage.
 */
export function clearTranslateLocalCache(
  from = "en",
  to = "id",
  prefix = "lt"
) {
  if (!hasWindow) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k) continue;
      if (k.startsWith(`${prefix}:${from}->${to}:`)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

/* ============================================
 * Exports (named + default)
 * ==========================================*/
export default translateBatch;
export {
  // re-export eksplisit agar tree-shaking jelas & kompatibel dengan import lama
  translateBatch as _translateBatchNamed,
  providerViaYourAPI as _providerViaYourAPI,
  providerNoop as _providerNoop,
  clearTranslateMemoryCache as _clearTranslateMemoryCache,
  clearTranslateLocalCache as _clearTranslateLocalCache,
};
