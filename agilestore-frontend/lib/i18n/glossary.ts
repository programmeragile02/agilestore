// lib/i18n/glossary.ts
export const GLOSSARY_EN_TO_ID: Record<string, string> = {
  "Agile Store": "Agile Store", // brand tetap
  "Rent Vix Pro": "Rent Vix Pro",
  "Absen Fast": "Absen Fast",
  "Salesman Apps": "Salesman Apps",
  "Ayo Hidupkan Rumah Ibadah": "Ayo Hidupkan Rumah Ibadah",
  CTA: "CTA",
  Dashboard: "Dasbor",
  Pricing: "Harga",
  Features: "Fitur",
  Packages: "Paket",
  Duration: "Durasi",
  Monthly: "Bulanan",
  Yearly: "Tahunan",
  // tambahkan istilah lain sesuai ekosistem Anda
};

/** Kata/field yang TIDAK perlu diterjemahkan (ID, kode, email, dsb.) */
export function shouldSkipPath(path: string): boolean {
  const p = path.toLowerCase();
  return (
    p.endsWith("product_code") ||
    p.endsWith("email") ||
    p.endsWith("phone") ||
    p.endsWith("address") ||
    (p.includes("id") && !p.endsWith("headline")) // id numeric/uuid
  );
}

/** Heuristik: jika string tampak kode/URL/angka murni — skip */
export function shouldSkipValue(val: string): boolean {
  if (!val) return true;
  if (/^https?:\/\//i.test(val)) return true;
  if (/^[A-Z0-9_-]{6,}$/.test(val)) return true; // kode/sku-ish
  if (/^\d+([.,]\d+)*(\s*(usd|idr|rp|k|m))?$/i.test(val.trim())) return true; // angka/uang
  return false;
}

/** Terapkan glossary setelah terjemahan (atau sebelum—sesuaikan kebutuhan) */
export function applyGlossaryPost(text: string): string {
  let out = text;
  for (const [en, id] of Object.entries(GLOSSARY_EN_TO_ID)) {
    const re = new RegExp(`\\b${escapeRegExp(en)}\\b`, "g");
    out = out.replace(re, id);
  }
  return out;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
