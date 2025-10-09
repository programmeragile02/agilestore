// lib/auto-translate.ts
type Target = "id" | "en";
type Source = "id" | "en";

const mem = new Map<string, string>();
const keyOf = (s: string, src: Source, tgt: Target, fmt = "text") =>
  `lt:${fmt}:${src}->${tgt}:${s}`;

export async function translateBatch(
  texts: string[],
  target: Target,
  format: "text" | "html" = "text",
  source: Source = "id"
) {
  const trimmed = texts.map((s) => (s ?? "").toString());
  const unique = Array.from(
    new Set(trimmed.map((s) => s.trim()).filter(Boolean))
  );

  const result = new Map<string, string>();
  const need: string[] = [];

  for (const s of unique) {
    const k = keyOf(s, source, target, format);
    const inMem = mem.get(k);
    if (inMem) {
      result.set(s, inMem);
      continue;
    }
    const inLS = typeof window !== "undefined" ? localStorage.getItem(k) : null;
    if (inLS) {
      result.set(s, inLS);
      mem.set(k, inLS);
      continue;
    }
    need.push(s);
  }

  if (need.length) {
    const chunkSize = 100;
    for (let i = 0; i < need.length; i += chunkSize) {
      const chunk = need.slice(i, i + chunkSize);

      // === panggil API (pakai multi texts sekaligus biar hemat) ===
      let outs: string[] | null = null;
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: chunk, target, source, format }),
        });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.ok && Array.isArray(json.data)) {
          outs = json.data as string[];
        }
      } catch (e) {
        // biarkan outs tetap null
      }

      // === mapping hasil ===
      chunk.forEach((orig, idx) => {
        const k = keyOf(orig, source, target, format);
        const translated = outs?.[idx];

        // Jika sukses -> simpan ke mem & localStorage
        if (
          typeof translated === "string" &&
          translated.trim().length > 0 &&
          translated !== orig
        ) {
          result.set(orig, translated);
          mem.set(k, translated);
          if (typeof window !== "undefined")
            localStorage.setItem(k, translated);
        } else {
          // Jika gagal -> JANGAN cache original (biar bisa coba lagi nanti)
          result.set(orig, orig);
        }
      });
    }
  }

  return result;
}
