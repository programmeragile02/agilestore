// lib/easy-translate.ts
type Lang = "id" | "en";

const cache = new Map<string, string>();

async function translateText(text: string, target: Lang): Promise<string> {
  const key = `${target}:${text}`;
  if (cache.has(key)) return cache.get(key)!;
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(key);
    if (stored) {
      cache.set(key, stored);
      return stored;
    }
  }

  // --- Pakai MyMemory API (gratis, public, tanpa kunci) ---
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text
  )}&langpair=${target === "id" ? "en|id" : "id|en"}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const translated = data?.responseData?.translatedText || text;
    cache.set(key, translated);
    if (typeof window !== "undefined") localStorage.setItem(key, translated);
    return translated;
  } catch {
    return text; // fallback: tampilkan original
  }
}

export async function translateBatch(texts: string[], target: Lang) {
  const results: Record<string, string> = {};
  for (const t of texts) {
    results[t] = await translateText(t, target);
  }
  return results;
}
